/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.apache.cordova.http;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Enumeration;

import javax.microedition.io.Connector;
import javax.microedition.io.HttpConnection;
import javax.microedition.io.file.FileConnection;

import org.apache.cordova.CordovaExtension;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.json4j.JSONException;
import org.apache.cordova.json4j.JSONObject;
import org.apache.cordova.util.Logger;

import net.rim.device.api.io.FileNotFoundException;
import net.rim.device.api.io.IOUtilities;
import net.rim.device.api.io.MIMETypeAssociations;
import net.rim.device.api.io.http.HttpProtocolConstants;
import net.rim.device.api.ui.UiApplication;

/**
 * The FileUploader uses an HTTP multipart request to upload files on the
 * device to a remote server.  It currently supports a single file per HTTP
 * request.
 */
public class FileUploader {

    /**
     * Constants
     */
    private static final String BOUNDARY = "----0x2fc1b3ef7cecbf14L";
    private static final String LINE_END = "\r\n";
    private static final String TD = "--";

    private Integer responseCode = null;

    /**
     * Uploads the specified file to the server URL provided using an HTTP
     * multipart request.
     * @param filePath      Full path of the file on the file system
     * @param server        URL of the server to receive the file
     * @param fileKey       Name of file request parameter
     * @param fileName      File name to be used on server
     * @param mimeType      Describes file content type
     * @param params        key:value pairs of user-defined parameters
     * @return FileUploadResult containing result of upload request
     */
    public FileUploadResult upload(String filePath, String server, String fileKey,
            String fileName, String mimeType, JSONObject params, JSONObject headers)
    throws FileNotFoundException, IllegalArgumentException, IOException {

        Logger.log(this.getClass().getName() + ": uploading " + filePath + " to " + server);
        FileUploadResult result = new FileUploadResult();

        InputStream in = null;
        OutputStream out = null;
        FileConnection fconn = null;
        HttpConnection httpConn = null;
        try {
            // open connection to the file
            try {
                fconn = (FileConnection)Connector.open(filePath, Connector.READ);
            } catch (ClassCastException e) {
                // in case something really funky gets passed in
                throw new IllegalArgumentException("Invalid file path");
            } catch (IOException e) {
                throw new FileNotFoundException("Failed to open source file: " + filePath);
            }
            if (!fconn.exists()) {
                throw new FileNotFoundException(filePath + " not found");
            }

            // determine mime type by
            //     1) user-provided type
            //     2) retrieve from file system
            //     3) default to JPEG
            if (mimeType == null) {
                mimeType = MIMETypeAssociations.getMIMEType(filePath);
                if (mimeType == null) {
                    mimeType = HttpProtocolConstants.CONTENT_TYPE_IMAGE_JPEG;
                }
            }

            // boundary messages
            String boundaryMsg = getBoundaryMessage(fileKey, fileName, mimeType);
            String lastBoundary = getEndBoundary();

            // user-defined request parameters
            String customParams = (params != null) ? getParameterContent(params) : "";
            Logger.log(this.getClass().getName() + ": params=" + customParams);

            // determine content length
            long fileSize = fconn.fileSize();
            Logger.log(this.getClass().getName() + ": " + filePath + " size=" + fileSize + " bytes");
            long contentLength = fileSize +
                (long)boundaryMsg.length() +
                (long)lastBoundary.length() +
                (long)customParams.length();

            // get HttpConnection
            httpConn = HttpUtils.getHttpConnection(server);
            if (httpConn == null) {
                throw new IOException("Failed to connect to " + server);
            }
            Logger.log(this.getClass().getName() + ": server URL=" + httpConn.getURL());

            // set request headers
            httpConn.setRequestMethod(HttpConnection.POST);
            httpConn.setRequestProperty(
                    HttpProtocolConstants.HEADER_USER_AGENT,
                    System.getProperty("browser.useragent"));
            httpConn.setRequestProperty(
                    HttpProtocolConstants.HEADER_KEEP_ALIVE, "300");
            httpConn.setRequestProperty(
                    HttpProtocolConstants.HEADER_CONNECTION, "keep-alive");
            httpConn.setRequestProperty(
                    HttpProtocolConstants.HEADER_CONTENT_TYPE,
                    HttpProtocolConstants.CONTENT_TYPE_MULTIPART_FORM_DATA + "; boundary=" + BOUNDARY);
            httpConn.setRequestProperty(
                    HttpProtocolConstants.HEADER_CONTENT_LENGTH,
                    Long.toString(contentLength));

            if(headers != null){
                for(Enumeration e = headers.keys(); e.hasMoreElements();){
                    String key = e.nextElement().toString();
                    String value = headers.optString(key);
                    Logger.log(this.getClass().getName() + ": key=" + key + " value=" + value);
                    httpConn.setRequestProperty(key, value);
                }    
            }
            
            // set cookie
            String cookie = HttpUtils.getCookie(server);
            if (cookie != null) {
                httpConn.setRequestProperty(HttpProtocolConstants.HEADER_COOKIE, cookie);
                Logger.log(this.getClass().getName() + ": cookie=" + cookie);
            }

            // write...
            out = httpConn.openDataOutputStream();

            // parameters
            out.write(customParams.getBytes());

            // boundary
            out.write(boundaryMsg.getBytes());

            // file data
            in = fconn.openInputStream();
            byte[] data = IOUtilities.streamToBytes(in);
            out.write(data);
            in.close();

            // end boundary
            out.write(lastBoundary.getBytes());

            // send request and get response
            in = httpConn.openDataInputStream();
            //int rc = httpConn.getResponseCode();
            result.setResponse(new String(IOUtilities.streamToBytes(in)));
            //result.setResponseCode(rc);
            result.setBytesSent(contentLength);
            Logger.log(this.getClass().getName() + ": sent " + contentLength + " bytes");
        }
        finally {

            if (httpConn != null) {
                result.setResponseCode(httpConn.getResponseCode());
                responseCode = new Integer(httpConn.getResponseCode());
            }

            try {
                if (fconn != null) fconn.close();
                if (in != null) in.close();
                if (out != null) out.close();
                if (httpConn != null) httpConn.close();
            }
            catch (IOException e) {
                Logger.log(this.getClass().getName() + ": " + e);
            }
        }

        return result;
    }

    /**
     * Sends an upload progress notification back to JavaScript engine.
     * @param result        FileUploadResult containing bytes sent of total
     * @param callbackId    identifier of callback function to invoke
     */
    protected void sendProgress(FileUploadResult result, final String callbackId) {
        JSONObject o = null;
        try {
            o = result.toJSONObject();
        }
        catch (JSONException e) {
            Logger.log(this.getClass().getName() + ": " + e);
            return;
        }

        // send a progress result
        final PluginResult r = new PluginResult(PluginResult.Status.OK, o);
        r.setKeepCallback(true);
        UiApplication.getUiApplication().invokeAndWait(
            new Runnable() {
                public void run() {
                    CordovaExtension.invokeSuccessCallback(callbackId, r);
                }
            }
        );
    }

    /**
     * Returns the boundary string that represents the beginning of a file
     * in a multipart HTTP request.
     * @param fileKey       Name of file request parameter
     * @param fileName      File name to be used on server
     * @param mimeType      Describes file content type
     * @return string representing the boundary message in a multipart HTTP request
     */
    protected String getBoundaryMessage(String fileKey, String fileName, String mimeType) {
        return (new StringBuffer())
            .append(TD).append(BOUNDARY).append(LINE_END)
            .append("Content-Disposition: form-data; name=\"").append(fileKey)
            .append("\"; filename=\"").append(fileName).append("\"").append(LINE_END)
            .append("Content-Type: ").append(mimeType).append(LINE_END)
            .append(LINE_END)
            .toString();
    }

    /**
     * Returns the boundary string that represents the end of a file in a
     * multipart HTTP request.
     * @return string representing the end boundary message in a multipart HTTP request
     */
    protected String getEndBoundary() {
        return LINE_END + TD + BOUNDARY + TD + LINE_END;
    }

    /**
     * Returns HTTP form content containing specified parameters.
     */
    protected String getParameterContent(JSONObject params) {
        StringBuffer buf = new StringBuffer();
        for (Enumeration e = params.keys(); e.hasMoreElements();) {
            String key = e.nextElement().toString();
            String value = params.optString(key);
            buf.append(TD).append(BOUNDARY).append(LINE_END)
                .append("Content-Disposition: form-data; name=\"").append(key).append("\"")
                .append(LINE_END).append(LINE_END)
                .append(value).append(LINE_END);
        }
        return buf.toString();
    }

    Integer getResponseCode() {
        return responseCode;
    }
}
