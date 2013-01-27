/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/
package org.apache.cordova;

import java.io.ByteArrayOutputStream;
import java.io.Closeable;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLDecoder;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.HashMap;
import java.util.Iterator;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.apache.cordova.api.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.net.Uri;
import android.os.Build;
import android.util.Log;
import android.webkit.CookieManager;

public class FileTransfer extends CordovaPlugin {

    private static final String LOG_TAG = "FileTransfer";
    private static final String LINE_START = "--";
    private static final String LINE_END = "\r\n";
    private static final String BOUNDARY =  "+++++";

    public static int FILE_NOT_FOUND_ERR = 1;
    public static int INVALID_URL_ERR = 2;
    public static int CONNECTION_ERR = 3;
    public static int ABORTED_ERR = 4;

    private static HashMap<String, RequestContext> activeRequests = new HashMap<String, RequestContext>();
    private static final int MAX_BUFFER_SIZE = 16 * 1024;

    private static final class RequestContext {
        String source;
        String target;
        CallbackContext callbackContext;
        InputStream currentInputStream;
        OutputStream currentOutputStream;
        boolean aborted;
        RequestContext(String source, String target, CallbackContext callbackContext) {
            this.source = source;
            this.target = target;
            this.callbackContext = callbackContext;
        }
        void sendPluginResult(PluginResult pluginResult) {
            synchronized (this) {
                if (!aborted) {
                    callbackContext.sendPluginResult(pluginResult);
                }
            }
        }
    }

    /**
     * Works around a bug on Android 2.3.
     * http://code.google.com/p/android/issues/detail?id=14562
     */
    private static final class DoneHandlerInputStream extends FilterInputStream {
        private boolean done;
        
        public DoneHandlerInputStream(InputStream stream) {
            super(stream);
        }
        
        @Override
        public int read() throws IOException {
            int result = done ? -1 : super.read();
            done = (result == -1);
            return result;
        }

        @Override
        public int read(byte[] buffer) throws IOException {
            int result = done ? -1 : super.read(buffer);
            done = (result == -1);
            return result;
        }

        @Override
        public int read(byte[] bytes, int offset, int count) throws IOException {
            int result = done ? -1 : super.read(bytes, offset, count);
            done = (result == -1);
            return result;
        }
    }
    
    @Override
    public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException {
        if (action.equals("upload") || action.equals("download")) {
            String source = args.getString(0);
            String target = args.getString(1);

            if (action.equals("upload")) {
                try {
                    source = URLDecoder.decode(source, "UTF-8");
                    upload(source, target, args, callbackContext);
                } catch (UnsupportedEncodingException e) {
                    callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.MALFORMED_URL_EXCEPTION, "UTF-8 error."));
                }
            } else {
                download(source, target, args, callbackContext);
            }
            return true;
        } else if (action.equals("abort")) {
            String objectId = args.getString(0);
            abort(objectId);
            callbackContext.success();
            return true;
        }
        return false;
    }

    /**
     * Uploads the specified file to the server URL provided using an HTTP multipart request.
     * @param source        Full path of the file on the file system
     * @param target        URL of the server to receive the file
     * @param args          JSON Array of args
     * @param callbackContext    callback id for optional progress reports
     *
     * args[2] fileKey       Name of file request parameter
     * args[3] fileName      File name to be used on server
     * args[4] mimeType      Describes file content type
     * args[5] params        key:value pairs of user-defined parameters
     * @return FileUploadResult containing result of upload request
     */
    private void upload(final String source, final String target, JSONArray args, CallbackContext callbackContext) throws JSONException {
        Log.d(LOG_TAG, "upload " + source + " to " +  target);

        // Setup the options
        final String fileKey = getArgument(args, 2, "file");
        final String fileName = getArgument(args, 3, "image.jpg");
        final String mimeType = getArgument(args, 4, "image/jpeg");
        final JSONObject params = args.optJSONObject(5) == null ? new JSONObject() : args.optJSONObject(5);
        final boolean trustEveryone = args.optBoolean(6);
        // Always use chunked mode unless set to false as per API
        final boolean chunkedMode = args.optBoolean(7) || args.isNull(7);
        // Look for headers on the params map for backwards compatibility with older Cordova versions.
        final JSONObject headers = args.optJSONObject(8) == null ? params.optJSONObject("headers") : args.optJSONObject(8);
        final String objectId = args.getString(9);

        Log.d(LOG_TAG, "fileKey: " + fileKey);
        Log.d(LOG_TAG, "fileName: " + fileName);
        Log.d(LOG_TAG, "mimeType: " + mimeType);
        Log.d(LOG_TAG, "params: " + params);
        Log.d(LOG_TAG, "trustEveryone: " + trustEveryone);
        Log.d(LOG_TAG, "chunkedMode: " + chunkedMode);
        Log.d(LOG_TAG, "headers: " + headers);
        Log.d(LOG_TAG, "objectId: " + objectId);
        
        final URL url;
        try {
            url = new URL(target);
        } catch (MalformedURLException e) {
            JSONObject error = createFileTransferError(INVALID_URL_ERR, source, target, 0);
            Log.e(LOG_TAG, error.toString(), e);
            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, error));
            return;
        }
        final boolean useHttps = url.getProtocol().toLowerCase().equals("https");

        final RequestContext context = new RequestContext(source, target, callbackContext);
        synchronized (activeRequests) {
            activeRequests.put(objectId, context);
        }
        
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                if (context.aborted) {
                    return;
                }
                HttpURLConnection conn = null;
                HostnameVerifier oldHostnameVerifier = null;
                SSLSocketFactory oldSocketFactory = null;
                try {
                    // Create return object
                    FileUploadResult result = new FileUploadResult();
                    FileProgressResult progress = new FileProgressResult();

                    //------------------ CLIENT REQUEST
                    // Open a HTTP connection to the URL based on protocol
                    if (useHttps) {
                        // Using standard HTTPS connection. Will not allow self signed certificate
                        if (!trustEveryone) {
                            conn = (HttpsURLConnection) url.openConnection();
                        }
                        // Use our HTTPS connection that blindly trusts everyone.
                        // This should only be used in debug environments
                        else {
                            // Setup the HTTPS connection class to trust everyone
                            HttpsURLConnection https = (HttpsURLConnection) url.openConnection();
                            oldSocketFactory  = trustAllHosts(https);
                            // Save the current hostnameVerifier
                            oldHostnameVerifier = https.getHostnameVerifier();
                            // Setup the connection not to verify hostnames
                            https.setHostnameVerifier(DO_NOT_VERIFY);
                            conn = https;
                        }
                    }
                    // Return a standard HTTP connection
                    else {
                        conn = (HttpURLConnection) url.openConnection();
                    }

                    // Allow Inputs
                    conn.setDoInput(true);

                    // Allow Outputs
                    conn.setDoOutput(true);

                    // Don't use a cached copy.
                    conn.setUseCaches(false);

                    // Use a post method.
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Connection", "Keep-Alive");
                    conn.setRequestProperty("Content-Type", "multipart/form-data;boundary=" + BOUNDARY);

                    // Set the cookies on the response
                    String cookie = CookieManager.getInstance().getCookie(target);
                    if (cookie != null) {
                        conn.setRequestProperty("Cookie", cookie);
                    }

                    // Handle the other headers
                    if (headers != null) {
                        try {
                            for (Iterator<?> iter = headers.keys(); iter.hasNext(); ) {
                                String headerKey = iter.next().toString();
                                JSONArray headerValues = headers.optJSONArray(headerKey);
                                if (headerValues == null) {
                                    headerValues = new JSONArray();
                                    headerValues.put(headers.getString(headerKey));
                                }
                                conn.setRequestProperty(headerKey, headerValues.getString(0));
                                for (int i = 1; i < headerValues.length(); ++i) {
                                    conn.addRequestProperty(headerKey, headerValues.getString(i));
                                }
                            }
                        } catch (JSONException e1) {
                          // No headers to be manipulated!
                        }
                    }

                    /*
                        * Store the non-file portions of the multipart data as a string, so that we can add it
                        * to the contentSize, since it is part of the body of the HTTP request.
                        */
                    String extraParams = "";
                    try {
                        for (Iterator<?> iter = params.keys(); iter.hasNext();) {
                            Object key = iter.next();
                            if(!String.valueOf(key).equals("headers"))
                            {
                              extraParams += LINE_START + BOUNDARY + LINE_END;
                              extraParams += "Content-Disposition: form-data; name=\"" +  key.toString() + "\";";
                              extraParams += LINE_END + LINE_END;
                              extraParams += params.getString(key.toString());
                              extraParams += LINE_END;
                            }
                        }
                    } catch (JSONException e) {
                        Log.e(LOG_TAG, e.getMessage(), e);
                    }

                    extraParams += LINE_START + BOUNDARY + LINE_END;
                    extraParams += "Content-Disposition: form-data; name=\"" + fileKey + "\";" + " filename=\"";
                    byte[] extraBytes = extraParams.getBytes("UTF-8");

                    String midParams = "\"" + LINE_END + "Content-Type: " + mimeType + LINE_END + LINE_END;
                    String tailParams = LINE_END + LINE_START + BOUNDARY + LINE_START + LINE_END;
                    byte[] fileNameBytes = fileName.getBytes("UTF-8");

                    
                    // Get a input stream of the file on the phone
                    InputStream sourceInputStream = getPathFromUri(source);
                    
                    int stringLength = extraBytes.length + midParams.length() + tailParams.length() + fileNameBytes.length;
                    Log.d(LOG_TAG, "String Length: " + stringLength);
                    int fixedLength = -1;
                    if (sourceInputStream instanceof FileInputStream) {
                        fixedLength = (int) ((FileInputStream)sourceInputStream).getChannel().size() + stringLength;
                        progress.setLengthComputable(true);
                        progress.setTotal(fixedLength);
                    }
                    Log.d(LOG_TAG, "Content Length: " + fixedLength);
                    // setFixedLengthStreamingMode causes and OutOfMemoryException on pre-Froyo devices.
                    // http://code.google.com/p/android/issues/detail?id=3164
                    // It also causes OOM if HTTPS is used, even on newer devices.
                    boolean useChunkedMode = chunkedMode && (Build.VERSION.SDK_INT < Build.VERSION_CODES.FROYO || useHttps);
                    useChunkedMode = useChunkedMode || (fixedLength == -1);
                            
                    if (useChunkedMode) {
                        conn.setChunkedStreamingMode(MAX_BUFFER_SIZE);
                        // Although setChunkedStreamingMode sets this header, setting it explicitly here works
                        // around an OutOfMemoryException when using https.
                        conn.setRequestProperty("Transfer-Encoding", "chunked");
                    } else {
                        conn.setFixedLengthStreamingMode(fixedLength);
                    }

                    DataOutputStream dos = null;
                    try {
                        dos = new DataOutputStream( conn.getOutputStream() );
                        synchronized (context) {
                            if (context.aborted) {
                                return;
                            }
                            context.currentOutputStream = dos;
                        }
                        //We don't want to change encoding, we just want this to write for all Unicode.
                        dos.write(extraBytes);
                        dos.write(fileNameBytes);
                        dos.writeBytes(midParams);
    
                        // create a buffer of maximum size
                        int bytesAvailable = sourceInputStream.available();
                        int bufferSize = Math.min(bytesAvailable, MAX_BUFFER_SIZE);
                        byte[] buffer = new byte[bufferSize];
    
                        // read file and write it into form...
                        int bytesRead = sourceInputStream.read(buffer, 0, bufferSize);
                        long totalBytes = 0;
    
                        long prevBytesRead = 0;
                        while (bytesRead > 0) {
                            totalBytes += bytesRead;
                            result.setBytesSent(totalBytes);
                            dos.write(buffer, 0, bufferSize);
                            if (totalBytes > prevBytesRead + 102400) {
                                prevBytesRead = totalBytes;
                                Log.d(LOG_TAG, "Uploaded " + totalBytes + " of " + fixedLength + " bytes");
                            }
                            bytesAvailable = sourceInputStream.available();
                            bufferSize = Math.min(bytesAvailable, MAX_BUFFER_SIZE);
                            bytesRead = sourceInputStream.read(buffer, 0, bufferSize);

                            // Send a progress event.
                            progress.setLoaded(totalBytes);
                            PluginResult progressResult = new PluginResult(PluginResult.Status.OK, progress.toJSONObject());
                            progressResult.setKeepCallback(true);
                            context.sendPluginResult(progressResult);
                        }
    
                        // send multipart form data necessary after file data...
                        dos.writeBytes(tailParams);
                        dos.flush();
                    } finally {
                        safeClose(sourceInputStream);
                        safeClose(dos);
                    }
                    context.currentOutputStream = null;

                    //------------------ read the SERVER RESPONSE
                    String responseString;
                    int responseCode = conn.getResponseCode();
                    InputStream inStream = null;
                    try {
                        inStream = getInputStream(conn);
                        synchronized (context) {
                            if (context.aborted) {
                                return;
                            }
                            context.currentInputStream = inStream;
                        }
                        
    
                        ByteArrayOutputStream out = new ByteArrayOutputStream();
                        byte[] buffer = new byte[1024];
                        int bytesRead = 0;
                        // write bytes to file
                        while ((bytesRead = inStream.read(buffer)) > 0) {
                            out.write(buffer, 0, bytesRead);
                        }
                        responseString = out.toString("UTF-8");
                    } finally {
                        context.currentInputStream = null;
                        safeClose(inStream);
                    }
                    
                    Log.d(LOG_TAG, "got response from server");
                    Log.d(LOG_TAG, responseString.substring(0, Math.min(256, responseString.length())));
                    
                    // send request and retrieve response
                    result.setResponseCode(responseCode);
                    result.setResponse(responseString);

                    context.sendPluginResult(new PluginResult(PluginResult.Status.OK, result.toJSONObject()));
                } catch (FileNotFoundException e) {
                    JSONObject error = createFileTransferError(FILE_NOT_FOUND_ERR, source, target, conn);
                    Log.e(LOG_TAG, error.toString(), e);
                    context.sendPluginResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, error));
                } catch (IOException e) {
                    JSONObject error = createFileTransferError(CONNECTION_ERR, source, target, conn);
                    Log.e(LOG_TAG, error.toString(), e);
                    context.sendPluginResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, error));
                } catch (JSONException e) {
                    Log.e(LOG_TAG, e.getMessage(), e);
                    context.sendPluginResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                } catch (Throwable t) {
                    // Shouldn't happen, but will
                    JSONObject error = createFileTransferError(CONNECTION_ERR, source, target, conn);
                    Log.e(LOG_TAG, error.toString(), t);
                    context.sendPluginResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, error));
                } finally {
                    synchronized (activeRequests) {
                        activeRequests.remove(objectId);
                    }

                    if (conn != null) {
                        // Revert back to the proper verifier and socket factories
                        // Revert back to the proper verifier and socket factories
                        if (trustEveryone && useHttps) {
                            HttpsURLConnection https = (HttpsURLConnection) conn;
                            https.setHostnameVerifier(oldHostnameVerifier);
                            https.setSSLSocketFactory(oldSocketFactory);
                        }

                        conn.disconnect();
                    }
                }                
            }
        });
    }

    private static void safeClose(Closeable stream) {
        if (stream != null) {
            try {
                stream.close();
            } catch (IOException e) {
            }
        }
    }

    private static InputStream getInputStream(HttpURLConnection conn) throws IOException {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.HONEYCOMB) {
            return new DoneHandlerInputStream(conn.getInputStream());
        }
        return conn.getInputStream();
    }

    // always verify the host - don't check for certificate
    private static final HostnameVerifier DO_NOT_VERIFY = new HostnameVerifier() {
        public boolean verify(String hostname, SSLSession session) {
            return true;
        }
    };
    // Create a trust manager that does not validate certificate chains
    private static final TrustManager[] trustAllCerts = new TrustManager[] { new X509TrustManager() {
        public java.security.cert.X509Certificate[] getAcceptedIssuers() {
            return new java.security.cert.X509Certificate[] {};
        }
        
        public void checkClientTrusted(X509Certificate[] chain,
                String authType) throws CertificateException {
        }
        
        public void checkServerTrusted(X509Certificate[] chain,
                String authType) throws CertificateException {
        }
    } };

    /**
     * This function will install a trust manager that will blindly trust all SSL
     * certificates.  The reason this code is being added is to enable developers
     * to do development using self signed SSL certificates on their web server.
     *
     * The standard HttpsURLConnection class will throw an exception on self
     * signed certificates if this code is not run.
     */
    private static SSLSocketFactory trustAllHosts(HttpsURLConnection connection) {
        // Install the all-trusting trust manager
        SSLSocketFactory oldFactory = connection.getSSLSocketFactory();
        try {
            // Install our all trusting manager
            SSLContext sc = SSLContext.getInstance("TLS");
            sc.init(null, trustAllCerts, new java.security.SecureRandom());
            SSLSocketFactory newFactory = sc.getSocketFactory();
            connection.setSSLSocketFactory(newFactory);
        } catch (Exception e) {
            Log.e(LOG_TAG, e.getMessage(), e);
        }
        return oldFactory;
    }

    private static JSONObject createFileTransferError(int errorCode, String source, String target, HttpURLConnection connection) {

        Integer httpStatus = null;

        if (connection != null) {
            try {
                httpStatus = connection.getResponseCode();
            } catch (IOException e) {
                Log.w(LOG_TAG, "Error getting HTTP status code from connection.", e);
            }
        }

        return createFileTransferError(errorCode, source, target, httpStatus);
    }

        /**
        * Create an error object based on the passed in errorCode
        * @param errorCode 	the error
        * @return JSONObject containing the error
        */
    private static JSONObject createFileTransferError(int errorCode, String source, String target, Integer httpStatus) {
        JSONObject error = null;
        try {
            error = new JSONObject();
            error.put("code", errorCode);
            error.put("source", source);
            error.put("target", target);
            if (httpStatus != null) {
                error.put("http_status", httpStatus);
            }
        } catch (JSONException e) {
            Log.e(LOG_TAG, e.getMessage(), e);
        }
        return error;
    }

    /**
     * Convenience method to read a parameter from the list of JSON args.
     * @param args			the args passed to the Plugin
     * @param position		the position to retrieve the arg from
     * @param defaultString the default to be used if the arg does not exist
     * @return String with the retrieved value
     */
    private static String getArgument(JSONArray args, int position, String defaultString) {
        String arg = defaultString;
        if (args.length() >= position) {
            arg = args.optString(position);
            if (arg == null || "null".equals(arg)) {
                arg = defaultString;
            }
        }
        return arg;
    }

    /**
     * Downloads a file form a given URL and saves it to the specified directory.
     *
     * @param source        URL of the server to receive the file
     * @param target      	Full path of the file on the file system
     */
    private void download(final String source, final String target, JSONArray args, CallbackContext callbackContext) throws JSONException {
        Log.d(LOG_TAG, "download " + source + " to " +  target);

        final boolean trustEveryone = args.optBoolean(2);
        final String objectId = args.getString(3);

        final URL url;
        try {
            url = new URL(source);
        } catch (MalformedURLException e) {
            JSONObject error = createFileTransferError(INVALID_URL_ERR, source, target, 0);
            Log.e(LOG_TAG, error.toString(), e);
            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, error));
            return;
        }
        final boolean useHttps = url.getProtocol().toLowerCase().equals("https");

        if (!Config.isUrlWhiteListed(source)) {
            Log.w(LOG_TAG, "Source URL is not in white list: '" + source + "'");
            JSONObject error = createFileTransferError(CONNECTION_ERR, source, target, 401);
            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, error));
            return;
        }

        
        final RequestContext context = new RequestContext(source, target, callbackContext);
        synchronized (activeRequests) {
            activeRequests.put(objectId, context);
        }
        
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                if (context.aborted) {
                    return;
                }
                HttpURLConnection connection = null;
                HostnameVerifier oldHostnameVerifier = null;
                SSLSocketFactory oldSocketFactory = null;

                try {

                    // create needed directories
                    File file = getFileFromPath(target);
                    file.getParentFile().mkdirs();
        
                    // connect to server
                    // Open a HTTP connection to the URL based on protocol
                    if (useHttps) {
                        // Using standard HTTPS connection. Will not allow self signed certificate
                        if (!trustEveryone) {
                            connection = (HttpsURLConnection) url.openConnection();
                        }
                        // Use our HTTPS connection that blindly trusts everyone.
                        // This should only be used in debug environments
                        else {
                            // Setup the HTTPS connection class to trust everyone
                            HttpsURLConnection https = (HttpsURLConnection) url.openConnection();
                            oldSocketFactory = trustAllHosts(https);
                            // Save the current hostnameVerifier
                            oldHostnameVerifier = https.getHostnameVerifier();
                            // Setup the connection not to verify hostnames
                            https.setHostnameVerifier(DO_NOT_VERIFY);
                            connection = https;
                        }
                    }
                    // Return a standard HTTP connection
                    else {
                          connection = (HttpURLConnection) url.openConnection();
                    }
    
                    connection.setRequestMethod("GET");
    
                    //Add cookie support
                    String cookie = CookieManager.getInstance().getCookie(source);
                    if(cookie != null)
                    {
                        connection.setRequestProperty("cookie", cookie);
                    }
    
                    connection.connect();
    
                    Log.d(LOG_TAG, "Download file:" + url);

                    FileProgressResult progress = new FileProgressResult();
                    if (connection.getContentEncoding() == null) {
                        // Only trust content-length header if no gzip etc
                        progress.setLengthComputable(true);
                        progress.setTotal(connection.getContentLength());
                    }
                    
                    FileOutputStream outputStream = null;
                    InputStream inputStream = null;
                    
                    try {
                        inputStream = getInputStream(connection);
                        outputStream = new FileOutputStream(file);
                        synchronized (context) {
                            if (context.aborted) {
                                return;
                            }
                            context.currentInputStream = inputStream;
                        }
                        
                        // write bytes to file
                        byte[] buffer = new byte[MAX_BUFFER_SIZE];
                        int bytesRead = 0;
                        long totalBytes = 0;
                        while ((bytesRead = inputStream.read(buffer)) > 0) {
                            outputStream.write(buffer, 0, bytesRead);
                            totalBytes += bytesRead;
                            // Send a progress event.
                            progress.setLoaded(totalBytes);
                            PluginResult progressResult = new PluginResult(PluginResult.Status.OK, progress.toJSONObject());
                            progressResult.setKeepCallback(true);
                            context.sendPluginResult(progressResult);
                        }
                    } finally {
                        context.currentInputStream = null;
                        safeClose(inputStream);
                        safeClose(outputStream);
                    }
    
                    Log.d(LOG_TAG, "Saved file: " + target);
    
                    // create FileEntry object
                    FileUtils fileUtil = new FileUtils();
                    JSONObject fileEntry = fileUtil.getEntry(file);
                    
                    context.sendPluginResult(new PluginResult(PluginResult.Status.OK, fileEntry));
                } catch (FileNotFoundException e) {
                    JSONObject error = createFileTransferError(FILE_NOT_FOUND_ERR, source, target, connection);
                    Log.e(LOG_TAG, error.toString(), e);
                    context.sendPluginResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, error));
                } catch (IOException e) {
                    JSONObject error = createFileTransferError(CONNECTION_ERR, source, target, connection);
                    Log.e(LOG_TAG, error.toString(), e);
                    context.sendPluginResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, error));
                } catch (JSONException e) {
                    Log.e(LOG_TAG, e.getMessage(), e);
                    context.sendPluginResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                } catch (Throwable e) {
                    JSONObject error = createFileTransferError(CONNECTION_ERR, source, target, connection);
                    Log.e(LOG_TAG, error.toString(), e);
                    context.sendPluginResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, error));
                } finally {
                    synchronized (activeRequests) {
                        activeRequests.remove(objectId);
                    }

                    if (connection != null) {
                        // Revert back to the proper verifier and socket factories
                        if (trustEveryone && useHttps) {
                            HttpsURLConnection https = (HttpsURLConnection) connection;
                            https.setHostnameVerifier(oldHostnameVerifier);
                            https.setSSLSocketFactory(oldSocketFactory);
                        }
    
                        connection.disconnect();
                    }
                }
            }
        });
    }

    /**
     * Get an input stream based on file path or content:// uri
     *
     * @param path foo
     * @return an input stream
     * @throws FileNotFoundException
     */
    private InputStream getPathFromUri(String path) throws FileNotFoundException {
        if (path.startsWith("content:")) {
            Uri uri = Uri.parse(path);
            return cordova.getActivity().getContentResolver().openInputStream(uri);
        }
        else if (path.startsWith("file://")) {
            int question = path.indexOf("?");
            if (question == -1) {
                return new FileInputStream(path.substring(7));
            } else {
                return new FileInputStream(path.substring(7, question));
            }
        }
        else {
            return new FileInputStream(path);
        }
    }

    /**
     * Get a File object from the passed in path
     *
     * @param path file path
     * @return file object
     */
    private File getFileFromPath(String path) throws FileNotFoundException {
        File file;
        String prefix = "file://";

        if (path.startsWith(prefix)) {
            file = new File(path.substring(prefix.length()));
        } else {
            file = new File(path);
        }

        if (file.getParent() == null) {
            throw new FileNotFoundException();
        }

        return file;
    }

    /**
     * Abort an ongoing upload or download.
     */
    private void abort(String objectId) {
        final RequestContext context;
        synchronized (activeRequests) {
            context = activeRequests.remove(objectId);
        }
        if (context != null) {
            // Trigger the abort callback immediately to minimize latency between it and abort() being called.
            JSONObject error = createFileTransferError(ABORTED_ERR, context.source, context.target, -1);
            synchronized (context) {
                context.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, error));
                context.aborted = true;
            }
            // Closing the streams can block, so execute on a background thread.
            cordova.getThreadPool().execute(new Runnable() {
                public void run() {
                    synchronized (context) {
                        safeClose(context.currentInputStream);
                        safeClose(context.currentOutputStream);
                    }
                }
            });
        }
    }
}
