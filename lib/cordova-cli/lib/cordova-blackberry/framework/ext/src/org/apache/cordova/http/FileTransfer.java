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

import javax.microedition.io.Connector;
import javax.microedition.io.HttpConnection;
import javax.microedition.io.file.FileConnection;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.file.Entry;
import org.apache.cordova.json4j.JSONArray;
import org.apache.cordova.json4j.JSONException;
import org.apache.cordova.json4j.JSONObject;
import org.apache.cordova.util.Logger;

import net.rim.device.api.io.FileNotFoundException;
import net.rim.device.api.io.http.HttpProtocolConstants;

/**
 * The FileTransfer plugin can be used to transfer files between the device and
 * a remote server. The following actions are supported:
 *
 *      download - Download a file from a server to the device.
 *      upload   - Upload a file from the device to a server.
 */
public class FileTransfer extends Plugin {
    private static final String LOG_TAG = "FileTransfer: ";

    /**
     * Error codes
     */
    static int FILE_NOT_FOUND_ERR = 1;
    static int INVALID_URL_ERR = 2;
    static int CONNECTION_ERR = 3;

    /**
     * Possible actions
     */
    private static final String ACTION_DOWNLOAD = "download";
    private static final String ACTION_UPLOAD = "upload";

    private static final char SEPARATOR = '/';

    /**
     * Executes the requested action and returns a PluginResult.
     *
     * @param action
     *            The action to execute.
     * @param callbackId
     *            The callback ID to be invoked upon action completion.
     * @param args
     *            JSONArry of arguments for the action.
     * @return A PluginResult object with a status and message.
     */
    public PluginResult execute(String action, JSONArray args, String callbackId) {
        String source = null;
        String target = null;
        PluginResult result = null;

        try {
            // Retrieve the source and target locations from the argument array.
            source = args.isNull(0) ? null : args.getString(0).trim();
            target = args.isNull(1) ? null : args.getString(1).trim();

            if (source == null || source.length() == 0 || target == null
                    || target.length() == 0) {
                Logger.log(LOG_TAG + "Missing source or target");
                return new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                        "Missing source or target");
            }
        } catch (JSONException e) {
            Logger.log(LOG_TAG + e.getMessage());
            return new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                    "Invalid or missing parameter");
        }

        if (ACTION_UPLOAD.equals(action)) {
            // Source needs to follow the file URI protocol so add "file:///"
            // prefix if it doesn't exist.
            if (!source.startsWith("file:///")) {
                if (source.indexOf(SEPARATOR) != 0) {
                    source = "file://" + SEPARATOR + source;
                } else {
                    source = "file://" + source;
                }
            }

            FileUploader uploader = null;
            try {
                // Setup the options
                String fileKey = getArgument(args, 2, "file");
                String fileName = getArgument(args, 3, "image.jpg");
                String mimeType = getArgument(args, 4, null);
                JSONObject params = null;
                JSONObject headers = null;
                
                if (args.length() > 5 && !args.isNull(5)) {
                    params = args.getJSONObject(5);
                }

                if(args.length() > 8 && !args.isNull(8)){
                    headers = args.getJSONObject(8);
                }
                uploader = new FileUploader();
                FileUploadResult r = uploader.upload(source, target, fileKey,
                        fileName, mimeType, params, headers);

                int status = r.getResponseCode();
                if (status < 200 || status > 399) {
                    Logger.log(LOG_TAG + "HTTP Status " + status);
                    JSONObject error = createFileTransferError(CONNECTION_ERR, source, target, new Integer(status));
                    return new PluginResult(PluginResult.Status.IO_EXCEPTION, error);
                }

                result = new PluginResult(PluginResult.Status.OK,
                        r.toJSONObject());
            } catch (FileNotFoundException e) {
                Logger.log(LOG_TAG + e.getMessage());
                JSONObject error = createFileTransferError(FILE_NOT_FOUND_ERR,
                        source, target, uploader);
                result = new PluginResult(PluginResult.Status.IO_EXCEPTION,
                        error);
            } catch (IllegalArgumentException e) {
                Logger.log(LOG_TAG + e.getMessage());
                JSONObject error = createFileTransferError(INVALID_URL_ERR,
                        source, target, uploader);
                result = new PluginResult(
                        PluginResult.Status.MALFORMED_URL_EXCEPTION, error);
            } catch (IOException e) {
                Logger.log(LOG_TAG + e.getMessage());
                JSONObject error = createFileTransferError(CONNECTION_ERR,
                        source, target, uploader);
                result = new PluginResult(PluginResult.Status.IO_EXCEPTION,
                        error);
            } catch (JSONException e) {
                Logger.log(LOG_TAG + e.getMessage());
                result = new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                        "Invalid or missing parameter");
            }
        } else if (ACTION_DOWNLOAD.equals(action)) {
            result = download(source, target);
        } else {
            // invalid action
            result = new PluginResult(PluginResult.Status.INVALID_ACTION,
                    LOG_TAG + "invalid action " + action);
        }

        return result;
    }

    /**
     * Create an error object based on the passed in errorCode
     *
     * @param errorCode
     *            the error
     * @return JSONObject containing the error
     */
    private JSONObject createFileTransferError(int errorCode, String source,
            String target) {
        return createFileTransferError(errorCode, source, target,
                (Integer) null);
    }

    /**
     * Create an error object based on the passed in errorCode
     *
     * @param errorCode
     *            the error
     * @return JSONObject containing the error
     */
    private JSONObject createFileTransferError(int errorCode, String source,
            String target, FileUploader fileUploader) {

        Integer httpStatus = null;

        if (fileUploader != null) {
            httpStatus = fileUploader.getResponseCode();
        }
        return createFileTransferError(errorCode, source, target, httpStatus);
    }

    /**
     * Create an error object based on the passed in errorCode
     *
     * @param errorCode
     *            the error
     * @return JSONObject containing the error
     */
    private JSONObject createFileTransferError(int errorCode, String source,
            String target, HttpConnection connection) {

        Integer httpStatus = null;

        if (connection != null) {
            try {
                httpStatus = new Integer(connection.getResponseCode());
            } catch (IOException e) {
                Logger.log(LOG_TAG + " exception getting http response code "
                        + e.toString());
            }
        }

        return createFileTransferError(errorCode, source, target, httpStatus);
    }

    /**
     * Create an error object based on the passed in errorCode
     *
     * @param errorCode
     *            the error
     * @return JSONObject containing the error
     */
    private JSONObject createFileTransferError(int errorCode, String source,
            String target, Integer httpStatus) {
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
            Logger.log(LOG_TAG + e.getMessage());
        }
        return error;
    }

    /**
     * Recurse through a specified path and create any directories that do not
     * already exist.
     *
     * @param path
     *            directory path to recurse
     * @throws IOException
     */
    private void createSubDirs(String path) throws IOException {
        FileConnection outputStream = null;

        try {
            outputStream = (FileConnection) Connector.open(path,
                    Connector.READ_WRITE);
            if (!outputStream.exists()) {
                int dirIndex = path.lastIndexOf(SEPARATOR, path.length() - 2);
                // This code assumes file protocol is specified so stop
                // recursion once "file:///" is hit.
                if (dirIndex != -1 && dirIndex > 7) {
                    createSubDirs(path.substring(0, dirIndex + 1));
                }
                outputStream.mkdir();
            }
        } finally {
            try {
                if (outputStream != null) {
                    outputStream.close();
                }
            } catch (IOException e) {
                Logger.log(LOG_TAG + e.getMessage());
            }
        }
    }

    /**
     * Download a file from a given URL and save it to the specified location.
     *
     * @param source
     *            URL of the server to receive the file
     * @param target
     *            Full path of the file on the file system
     * @return JSONObject a file entry object in JSON form describing the
     *         downloaded file.
     */
    private PluginResult download(String source, String target) {
        HttpConnection httpConn = null;
        FileConnection fileConn = null;
        OutputStream outputStream = null;
        String filename = null;
        String path = null;

        Logger.debug(LOG_TAG + "downloading " + source + " to " + target);

        // Target needs to follow the file URI protocol so add "file:///"
        // prefix if it doesn't exist.
        if (!target.startsWith("file:///")) {
            if (target.indexOf(SEPARATOR) != 0) {
                target = "file://" + SEPARATOR + target;
            } else {
                target = "file://" + target;
            }
        }

        // Parse the target filename and directory path. If the target does not
        // specify a file name (only directory), try to get the file name from
        // the source.
        int dirIndex = target.lastIndexOf(SEPARATOR);
        if (dirIndex == (target.length() - 1)) {
            int srcdirIndex = source.lastIndexOf(SEPARATOR);
            if (srcdirIndex != (source.length() - 1)) {
                path = target;
                filename = source.substring(srcdirIndex + 1);
                target = path + filename;
            }
        } else if (dirIndex != -1) {
            filename = target.substring(dirIndex + 1);
            path = target.substring(0, dirIndex + 1);
        }

        // If no filename or path could be determined for the target, error out.
        if (filename == null || path == null) {
            Logger.log(LOG_TAG + "Target filename could not be determined.");
            JSONObject error = createFileTransferError(FILE_NOT_FOUND_ERR,
                    source, target);
            return new PluginResult(PluginResult.Status.JSON_EXCEPTION, error);
        }

        try {
            try {
                // Create any directories in the path that do not already exist.
                createSubDirs(path);

                // Open connection to the target file.
                fileConn = (FileConnection) Connector.open(target,
                    Connector.READ_WRITE);
            } catch (IOException e) {
                Logger.log(LOG_TAG + "Failed to open target file: " + target);
                JSONObject error = createFileTransferError(FILE_NOT_FOUND_ERR, source,
                        target, httpConn);
                return new PluginResult(PluginResult.Status.IO_EXCEPTION, error);
            }

            // Create the target file if it doesn't exist, otherwise truncate.
            if (!fileConn.exists()) {
                fileConn.create();
            } else {
                fileConn.truncate(0);
            }

            // Open the http connection to the server.
            try {
                httpConn = HttpUtils.getHttpConnection(source);
            } catch (IllegalArgumentException e) {
                JSONObject error = createFileTransferError(INVALID_URL_ERR, source, target, httpConn);
                return new PluginResult(PluginResult.Status.MALFORMED_URL_EXCEPTION, error);
            }
            if (httpConn == null) {
                Logger.log(LOG_TAG + "Failed to create http connection.");
                // TODO separate malformed url from actual connection error
                JSONObject error = createFileTransferError(CONNECTION_ERR,
                        source, target);
                return new PluginResult(
                        PluginResult.Status.IO_EXCEPTION, error);
            }

            // Set the request headers
            httpConn.setRequestMethod(HttpConnection.GET);
            httpConn.setRequestProperty(
                    HttpProtocolConstants.HEADER_USER_AGENT,
                    System.getProperty("browser.useragent"));
            httpConn.setRequestProperty(
                    HttpProtocolConstants.HEADER_KEEP_ALIVE, "300");
            httpConn.setRequestProperty(
                    HttpProtocolConstants.HEADER_CONNECTION, "keep-alive");

            // Set the cookie
            String cookie = HttpUtils.getCookie(source);
            if (cookie != null) {
                httpConn.setRequestProperty(
                        HttpProtocolConstants.HEADER_COOKIE, cookie);
            }

            InputStream inputStream = httpConn.openInputStream();
            int status = httpConn.getResponseCode();
            if (status < 200 || status > 399) {
                Logger.log(LOG_TAG + "HTTP Status " + status);
                JSONObject error = createFileTransferError(CONNECTION_ERR, source, target, httpConn);
                return new PluginResult(PluginResult.Status.IO_EXCEPTION, error);
            }

            outputStream = fileConn.openOutputStream();

            // Read from the connection and write bytes to the file.
            byte[] buffer = new byte[1024];
            int bytesRead = 0;
            while ((bytesRead = inputStream.read(buffer)) > 0) {
                outputStream.write(buffer, 0, bytesRead);
            }
        } catch (IOException e) {
            Logger.log(LOG_TAG + e.getMessage());
            JSONObject error = createFileTransferError(CONNECTION_ERR, source,
                    target, httpConn);
            return new PluginResult(PluginResult.Status.IO_EXCEPTION, error);
        } catch (ClassCastException e) {
            // in case something really funky gets passed in
            Logger.log(LOG_TAG + e.getMessage());
            JSONObject error = createFileTransferError(INVALID_URL_ERR, source,
                    target, httpConn);
            return new PluginResult(
                    PluginResult.Status.MALFORMED_URL_EXCEPTION, error);
        } catch (Throwable t) {
            Logger.log(LOG_TAG + t.toString());
            JSONObject error = createFileTransferError(CONNECTION_ERR, source, target, httpConn);
            return new PluginResult(PluginResult.Status.IO_EXCEPTION, error);
        } finally {
            try {
                if (httpConn != null) {
                    httpConn.close();
                }
                if (outputStream != null) {
                    outputStream.close();
                }
                if (fileConn != null) {
                    fileConn.close();
                }
            } catch (IOException e) {
                Logger.log(LOG_TAG + "IOException in finally: "
                        + e.getMessage());
            }
        }

        // create a new Entry
        Entry entry = new Entry();
        entry.setDirectory(false);
        entry.setName(filename);
        entry.setFullPath(target);

        return new PluginResult(PluginResult.Status.OK, entry.toJSONObject());
    }

    /**
     * Convenience method to read a parameter from the list of JSON args.
     *
     * @param args
     *            the args passed to the Plugin
     * @param position
     *            the position to retrieve the arg from
     * @param defaultString
     *            the default to be used if the arg does not exist
     * @return String with the retrieved value
     */
    private String getArgument(JSONArray args, int position,
            String defaultString) {
        String arg = defaultString;
        if (args.length() >= position) {
            arg = args.optString(position);
            if (arg == null || "null".equals(arg)) {
                arg = defaultString;
            }
        }
        return arg;
    }
}
