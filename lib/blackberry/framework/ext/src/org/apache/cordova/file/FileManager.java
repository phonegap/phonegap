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
package org.apache.cordova.file;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.Enumeration;

import javax.microedition.io.Connector;
import javax.microedition.io.file.FileConnection;
import javax.microedition.io.file.FileSystemRegistry;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.json4j.JSONArray;
import org.apache.cordova.json4j.JSONException;
import org.apache.cordova.json4j.JSONObject;
import org.apache.cordova.util.FileUtils;
import org.apache.cordova.util.Logger;

import net.rim.device.api.io.Base64OutputStream;
import net.rim.device.api.io.FileNotFoundException;
import net.rim.device.api.io.MIMETypeAssociations;
import net.rim.device.api.system.Application;

public class FileManager extends Plugin {

    /**
     * File related errors.
     */
    public static int NOT_FOUND_ERR = 1;
    public static int SECURITY_ERR = 2;
    public static int ABORT_ERR = 3;
    public static int NOT_READABLE_ERR = 4;
    public static int ENCODING_ERR = 5;
    public static int NO_MODIFICATION_ALLOWED_ERR = 6;
    public static int INVALID_STATE_ERR = 7;
    public static int SYNTAX_ERR = 8;
    public static int INVALID_MODIFICATION_ERR = 9;
    public static int QUOTA_EXCEEDED_ERR = 10;
    public static int TYPE_MISMATCH_ERR = 11;
    public static int PATH_EXISTS_ERR = 12;

    /**
     * File system for storing information on a temporary basis (no guaranteed persistence).
     */
    public static final short FS_TEMPORARY = 0;

    /**
     * File system for storing information on a permanent basis.
     */
    public static final short FS_PERSISTENT = 1;

    /**
     * Possible actions.
     */
    protected static String ACTION_READ_AS_TEXT = "readAsText";
    protected static String ACTION_READ_AS_DATA_URL = "readAsDataURL";
    protected static String ACTION_WRITE = "write";
    protected static String ACTION_TRUNCATE = "truncate";
    protected static String ACTION_REQUEST_FILE_SYSTEM = "requestFileSystem";
    protected static String ACTION_RESOLVE_FILE_SYSTEM_URI = "resolveLocalFileSystemURI";
    protected static String ACTION_GET_METADATA = "getMetadata";
    protected static String ACTION_GET_FILE_METADATA = "getFileMetadata";
    protected static String ACTION_LIST_DIRECTORY = "readEntries";
    protected static String ACTION_COPY_TO = "copyTo";
    protected static String ACTION_MOVE_TO = "moveTo";
    protected static String ACTION_IS_FILE_SYSTEM_ROOT = "isFileSystemRoot";

    /**
     * Executes the requested action and returns a PluginResult.
     *
     * @param action
     *            The action to execute.
     * @param callbackId
     *            The callback ID to be invoked upon action completion
     * @param args
     *            JSONArry of arguments for the action.
     * @return A PluginResult object with a status and message.
     */
    public PluginResult execute(String action, JSONArray args, String callbackId) {
        // perform specified action
        if (ACTION_READ_AS_TEXT.equals(action)) {
            // get file path
            String filePath = null;
            try {
                filePath = args.getString(0);
            }
            catch (JSONException e) {
                Logger.log(this.getClass().getName()
                        + ": Invalid or missing path: " + e);
                return new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                        SYNTAX_ERR);
            }
            return readAsText(filePath, args.optString(1));
        }
        else if (ACTION_READ_AS_DATA_URL.equals(action)) {
            // get file path
            String filePath = null;
            try {
                filePath = args.getString(0);
            }
            catch (JSONException e) {
                Logger.log(this.getClass().getName()
                        + ": Invalid or missing path: " + e);
                return new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                        SYNTAX_ERR);
            }
            return readAsDataURL(filePath);
        }
        else if (ACTION_WRITE.equals(action)) {
            // file path
            String filePath = null;
            try {
                filePath = args.getString(0);
            }
            catch (JSONException e) {
                Logger.log(this.getClass().getName()
                        + ": Invalid or missing path: " + e);
                return new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                        SYNTAX_ERR);
            }

            // file data
            String data = null;
            try {
                data = args.getString(1);
            }
            catch (JSONException e) {
                Logger.log(this.getClass().getName()
                        + ": Unable to parse file data: " + e);
                return new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                        SYNTAX_ERR);
            }

            // position
            int position = 0;
            try {
                position = Integer.parseInt(args.optString(2));
            }
            catch (NumberFormatException e) {
                Logger.log(this.getClass().getName()
                        + ": Invalid position parameter: " + e);
                return new PluginResult(
                        PluginResult.Status.JSON_EXCEPTION,
                        SYNTAX_ERR);
            }
            return writeFile(filePath, data, position);
        }
        else if (ACTION_TRUNCATE.equals(action)) {
            // file path
            String filePath = null;
            try {
                filePath = args.getString(0);
            }
            catch (JSONException e) {
                Logger.log(this.getClass().getName()
                        + ": Invalid or missing path: " + e);
                return new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                        SYNTAX_ERR);
            }

            // file size
            long fileSize = 0;
            try {
                // retrieve new file size
                fileSize = Long.parseLong(args.getString(1));
            }
            catch (Exception e) {
                Logger.log(this.getClass().getName()
                        + ": Invalid file size parameter: " + e);
                return new PluginResult(
                        PluginResult.Status.JSON_EXCEPTION,
                        SYNTAX_ERR);
            }
            return truncateFile(filePath, fileSize);
        }
        else if (ACTION_REQUEST_FILE_SYSTEM.equals(action)) {
            int fileSystemType = -1;
            long fileSystemSize = 0;
            try {
                fileSystemType = args.getInt(0);
                fileSystemSize = (args.isNull(1) == true) ? 0 : args.getLong(1);
            }
            catch (JSONException e) {
                Logger.log(this.getClass().getName()
                        + ": Invalid file system type: " + e);
                return new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                        SYNTAX_ERR);
            }
            return requestFileSystem(fileSystemType, fileSystemSize);
        }
        else if (ACTION_RESOLVE_FILE_SYSTEM_URI.equals(action)) {
            String uri = null;
            try {
                uri = args.getString(0);
            }
            catch (JSONException e) {
                Logger.log(this.getClass().getName()
                        + ": Invalid or missing file URI: " + e);
                return new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                        SYNTAX_ERR);
            }
            return resolveFileSystemURI(uri);
        }
        else if (ACTION_GET_METADATA.equals(action) || ACTION_GET_FILE_METADATA.equals(action)) {
            String path = null;
            try {
                path = args.getString(0);
            }
            catch (JSONException e) {
                Logger.log(this.getClass().getName()
                        + ": Invalid or missing file URI: " + e);
                return new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                        SYNTAX_ERR);
            }
            return getMetadata(path, ACTION_GET_FILE_METADATA.equals(action));
        }
        else if (ACTION_LIST_DIRECTORY.equals(action)) {
            String path = null;
            try {
                path = args.getString(0);
            }
            catch (JSONException e) {
                Logger.log(this.getClass().getName()
                        + ": Invalid or missing path: " + e);
                return new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                        SYNTAX_ERR);
            }
            return listDirectory(path);
        }
        else if (ACTION_COPY_TO.equals(action)) {
            String srcPath = null;
            String parent = null;
            String newName = null;
            try {
                srcPath = args.getString(0);
                parent = args.getString(1);
                newName = args.getString(2);
            }
            catch (JSONException e) {
                Logger.log(this.getClass().getName()
                        + ": Invalid or missing path: " + e);
                return new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                        SYNTAX_ERR);
            }
            return copyTo(srcPath, parent, newName);
        }
        else if (ACTION_MOVE_TO.equals(action)) {
            String srcPath = null;
            String parent = null;
            String newName = null;
            try {
                srcPath = args.getString(0);
                parent = args.getString(1);
                newName = args.getString(2);
            }
            catch (JSONException e) {
                Logger.log(this.getClass().getName()
                        + ": Invalid or missing path: " + e);
                return new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                        SYNTAX_ERR);
            }
            return moveTo(srcPath, parent, newName);
        }
        else if (ACTION_IS_FILE_SYSTEM_ROOT.equals(action)) {
            return new PluginResult(PluginResult.Status.OK,
                    isFileSystemRoot(args.optString(0)));
        }

        // invalid action
        return new PluginResult(PluginResult.Status.INVALID_ACTION,
                "File: invalid action " + action);
    }

    /**
     * Reads a file and encodes the contents using the specified encoding.
     *
     * @param filePath
     *            Full path of the file to be read
     * @param encoding
     *            Encoding to use for the file contents
     * @return PluginResult containing encoded file contents or error code if
     *         unable to read or encode file
     */
    protected static PluginResult readAsText(String filePath, String encoding) {
        PluginResult result = null;
        String logMsg = ": encoding file contents using " + encoding;

        // read the file
        try {
            // return encoded file contents
            byte[] blob = FileUtils.readFile(filePath, Connector.READ);
            result = new PluginResult(PluginResult.Status.OK,
                    new String(blob, encoding));
        }
        catch (FileNotFoundException e) {
            logMsg = e.toString();
            result = new PluginResult(PluginResult.Status.IO_EXCEPTION,
                    NOT_FOUND_ERR);
        }
        catch (UnsupportedEncodingException e) {
            logMsg = e.toString();
            result = new PluginResult(PluginResult.Status.IO_EXCEPTION,
                    ENCODING_ERR);
        }
        catch (IOException e) {
            logMsg = e.toString();
            result = new PluginResult(PluginResult.Status.IO_EXCEPTION,
                    NOT_READABLE_ERR);
        }
        finally {
            Logger.log(FileManager.class.getName() + ": " + logMsg);
        }

        return result;
    }

    /**
     * Read file and return data as a base64 encoded data url. A data url is of
     * the form: data:[<mediatype>][;base64],<data>
     *
     * @param filePath
     *            Full path of the file to be read
     * @return PluginResult containing the encoded file contents or an error
     *         code if unable to read the file
     */
    protected static PluginResult readAsDataURL(String filePath) {
        String data = null;
        try {
            // read file
            byte[] blob = FileUtils.readFile(filePath, Connector.READ);

            // encode file contents using BASE64 encoding
            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            Base64OutputStream base64OutputStream = new Base64OutputStream(
                    byteArrayOutputStream);
            base64OutputStream.write(blob);
            base64OutputStream.flush();
            base64OutputStream.close();
            data = byteArrayOutputStream.toString();
        }
        catch (FileNotFoundException e) {
            Logger.log(FileManager.class.getName() + ": " + e);
            return new PluginResult(PluginResult.Status.IO_EXCEPTION,
                    NOT_FOUND_ERR);
        }
        catch (IOException e) {
            Logger.log(FileManager.class.getName() + ": " + e);
            return new PluginResult(PluginResult.Status.IO_EXCEPTION,
                    NOT_READABLE_ERR);
        }

        // put result in proper form
        String mediaType = MIMETypeAssociations.getMIMEType(filePath);
        if (mediaType == null) {
            mediaType = "";
        }
        data = "data:" + mediaType + ";base64," + data;

        return new PluginResult(PluginResult.Status.OK, data);
    }

    /**
     * Writes data to the specified file.
     *
     * @param filePath
     *            Full path of file to be written to
     * @param data
     *            Data to be written
     * @param position
     *            Position at which to begin writing
     * @return PluginResult containing the number of bytes written or error code
     *         if unable to write file
     */
    protected static PluginResult writeFile(String filePath, String data, int position) {
        PluginResult result = null;
        int bytesWritten = 0;
        try {
            // write file data
            // The default String encoding on BB is ISO-8859-1 which causes
            // issues with extended characters.  Force to UTF-8 to provide
            // greater character support and match other platforms.
            bytesWritten = FileUtils.writeFile(filePath, data.getBytes("UTF-8"), position);
            result = new PluginResult(PluginResult.Status.OK, bytesWritten);
        }
        catch (SecurityException e) {
            Logger.log(FileManager.class.getName() + ": " + e);
            result = new PluginResult(PluginResult.Status.IO_EXCEPTION,
                    NO_MODIFICATION_ALLOWED_ERR);
        }
        catch (IOException e) {
            // it's not a security issue, so the directory path is either
            // not fully created or a general error occurred
            Logger.log(FileManager.class.getName() + ": " + e);
            result = new PluginResult(PluginResult.Status.IO_EXCEPTION,
                    NOT_FOUND_ERR);
        }

        return result;
    }

    /**
     * Changes the length of the specified file. If shortening, data beyond new
     * length is discarded.
     *
     * @param fileName
     *            The full path of the file to truncate
     * @param size
     *            The size to which the length of the file is to be adjusted
     * @return PluginResult containing new file size or an error code if an
     *         error occurred
     */
    protected static PluginResult truncateFile(String filePath, long size) {
        long fileSize = 0;
        FileConnection fconn = null;
        try {
            fconn = (FileConnection) Connector.open(filePath,
                    Connector.READ_WRITE);
            if (!fconn.exists()) {
                Logger.log(FileManager.class.getName() + ": path not found "
                        + filePath);
                return new PluginResult(PluginResult.Status.IO_EXCEPTION,
                        NOT_FOUND_ERR);
            }
            if (size >= 0) {
                fconn.truncate(size);
            }
            fileSize = fconn.fileSize();
        }
        catch (IOException e) {
            Logger.log(FileManager.class.getName() + ": " + e);
            return new PluginResult(PluginResult.Status.IO_EXCEPTION,
                    NO_MODIFICATION_ALLOWED_ERR);
        }
        finally {
            try {
                if (fconn != null)
                    fconn.close();
            }
            catch (IOException e) {
                Logger.log(FileManager.class.getName() + ": " + e);
            }
        }
        return new PluginResult(PluginResult.Status.OK, fileSize);
    }

    /**
     * Returns a directory entry that represents the specified file system. The
     * directory entry does not represent the root of the file system, but a
     * directory within the file system that is writable. Users must provide the
     * file system type, which can be one of FS_TEMPORARY or FS_PERSISTENT.
     *
     * @param type
     *            The type of file system desired.
     * @param size
     *            The minimum size, in bytes, of space required
     * @return a PluginResult containing a file system object for the specified
     *         file system
     */
    protected static PluginResult requestFileSystem(int type, long size) {
        if (!isValidFileSystemType(type)) {
            Logger.log(FileManager.class.getName()
                    + ": Invalid file system type: " + Integer.toString(type));
            return new PluginResult(
                    PluginResult.Status.JSON_EXCEPTION,
                    SYNTAX_ERR);
        }

        PluginResult result = null;
        String filePath = null;
        switch (type) {
        case FS_TEMPORARY:
            // create application-specific temp directory
            try {
                filePath = FileUtils.createApplicationTempDirectory();
            }
            catch (IOException e) {
                Logger.log(FileManager.class.getName() + ": " + e);
                return new PluginResult(PluginResult.Status.IO_EXCEPTION,
                        NO_MODIFICATION_ALLOWED_ERR);
            }
            break;
        case FS_PERSISTENT:
            // get a path to SD card (if present) or user directory (internal)
            filePath = FileUtils.getFileSystemRoot();
            break;
        }

        // create a file system entry from the path
        Entry entry = null;
        try {
            // check the file system size
            if (size > FileUtils.availableSize(filePath)) {
                return new PluginResult(
                        PluginResult.Status.IO_EXCEPTION,
                        QUOTA_EXCEEDED_ERR);
            }

            entry = getEntryFromURI(filePath);
        }
        catch (Exception e) {
            // bad path (not likely)
            return new PluginResult(PluginResult.Status.IO_EXCEPTION,
                    ENCODING_ERR);
        }

        try {
            JSONObject fileSystem = new JSONObject();
            fileSystem.put("name", getFileSystemName(type));
            fileSystem.put("root", entry.toJSONObject());
            result = new PluginResult(PluginResult.Status.OK, fileSystem);
        }
        catch (JSONException e) {
            return new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                    "File system entry JSON conversion failed.");
        }

        return result;
    }

    /**
     * Creates a file system entry object from the specified file system URI.
     *
     * @param uri
     *            the full path to the file or directory on the file system
     * @return a PluginResult containing the file system entry
     */
    protected static PluginResult resolveFileSystemURI(String uri) {
        PluginResult result = null;
        Entry entry = null;
        try {
            entry = getEntryFromURI(uri);
        }
        catch (IllegalArgumentException e) {
            Logger.log(e.toString());
            return new PluginResult(
                    PluginResult.Status.JSON_EXCEPTION,
                    ENCODING_ERR);
        }

        if (entry == null) {
            result = new PluginResult(PluginResult.Status.IO_EXCEPTION,
                    NOT_FOUND_ERR);
        }
        else {
            result = new PluginResult(PluginResult.Status.OK,
                    entry.toJSONObject());
        }

        return result;
    }

    /**
     * Retrieve metadata for file or directory specified by path.
     *
     * @param path
     *            full path name of the file or directory
     * @param full
     *            return full or partial meta data.
     * @return PluginResult containing metadata for file system entry or an
     *         error code if unable to retrieve metadata
     */
    protected static PluginResult getMetadata(String path, boolean full) {
        PluginResult result = null;
        FileConnection fconn = null;
        try {
            fconn = (FileConnection)Connector.open(path);
            if (fconn.exists()) {
                if (full) {
                    JSONObject metadata = new JSONObject();
                    metadata.put("size", fconn.fileSize());
                    metadata.put("type",
                            MIMETypeAssociations.getMIMEType(fconn.getURL()));
                    metadata.put("name", fconn.getName());
                    metadata.put("fullPath", fconn.getURL());
                    metadata.put("lastModifiedDate", fconn.lastModified());
                    result = new PluginResult(PluginResult.Status.OK, metadata);
                } else {
                    result = new PluginResult(PluginResult.Status.OK,
                            fconn.lastModified());
                }
            }
            else {
                result = new PluginResult(PluginResult.Status.IO_EXCEPTION,
                        NOT_FOUND_ERR);
            }
        }
        catch (IllegalArgumentException e) {
            // bad path
            Logger.log(FileUtils.class.getName() + ": " + e);
            result = new PluginResult(PluginResult.Status.IO_EXCEPTION,
                    NOT_FOUND_ERR);
        }
        catch (IOException e) {
            Logger.log(FileUtils.class.getName() + ": " + e);
            result = new PluginResult(PluginResult.Status.IO_EXCEPTION,
                    NOT_READABLE_ERR);
        }
        catch (JSONException e) {
            result = new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                    "File system entry JSON conversion failed.");
        }
        finally {
            try {
                if (fconn != null) fconn.close();
            }
            catch (IOException ignored) {
            }
        }
        return result;
    }

    private static JSONObject buildEntry(String dirPath, String filePath) throws JSONException {
        JSONObject entry = new JSONObject();
        boolean isDir = filePath.endsWith(FileUtils.FILE_SEPARATOR);

        entry.put("isFile", !isDir);
        entry.put("isDirectory", isDir);
        entry.put("name", isDir ? filePath.substring(0, filePath.length()-1) : filePath);
        entry.put("fullPath", dirPath + filePath);

        return entry;
    }

    /**
     * Returns a listing of the specified directory contents. Names of both
     * files and directories are returned.
     *
     * @param path
     *            full path name of directory
     * @return PluginResult containing list of file and directory names
     *         corresponding to directory contents
     */
    protected static PluginResult listDirectory(String path) {
        Enumeration listing = null;
        try {
            listing = FileUtils.listDirectory(path);
        }
        catch (Exception e) {
            // bad path
            Logger.log(FileUtils.class.getName() + ": " + e);
            return new PluginResult(PluginResult.Status.IO_EXCEPTION,
                    NOT_FOUND_ERR);
        }

        try {
            // pass directory contents back as an array of JSONObjects (entries)
            JSONArray array = new JSONArray();
            while (listing.hasMoreElements()) {
                array.add(buildEntry(path, (String) listing.nextElement()));
            }

            return new PluginResult(PluginResult.Status.OK, array);
        } catch (JSONException e) {
            return new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                    "File system entry JSON conversion failed.");
        }
    }

    /**
     * Copies a file or directory to a new location. If copying a directory, the
     * entire contents of the directory are copied recursively.
     *
     * @param srcPath
     *            the full path of the file or directory to be copied
     * @param parent
     *            the full path of the target directory to which the file or
     *            directory should be copied
     * @param newName
     *            the new name of the file or directory
     * @return PluginResult containing an Entry object representing the new
     *         entry, or an error code if an error occurs
     */
    protected static PluginResult copyTo(String srcPath, String parent, String newName) {
        try {
            FileUtils.copy(srcPath, parent, newName);
        }
        catch (IllegalArgumentException e) {
            Logger.log(FileManager.class.getName() + ": " + e.getMessage());
            return new PluginResult(
                    PluginResult.Status.JSON_EXCEPTION, ENCODING_ERR);
        }
        catch (FileNotFoundException e) {
            Logger.log(FileManager.class.getName() + ": " + e.getMessage());
            return new PluginResult(
                    PluginResult.Status.IO_EXCEPTION, NOT_FOUND_ERR);
        }
        catch (SecurityException e) {
            Logger.log(FileManager.class.getName() + ": " + e.getMessage());
            return new PluginResult(
                    PluginResult.Status.IO_EXCEPTION, SECURITY_ERR);
        }
        catch (IOException e) {
            Logger.log(FileManager.class.getName() + ": " + e.getMessage());
            return new PluginResult(
                    PluginResult.Status.IO_EXCEPTION, INVALID_MODIFICATION_ERR);
        }

        return resolveFileSystemURI(getFullPath(parent, newName));
    }

    /**
     * Moves a file or directory to a new location. If moving a directory, the
     * entire contents of the directory are moved recursively.
     * <p>
     * It is an error to try to: move a directory inside itself; move a
     * directory into its parent unless the name has changed; move a file to a
     * path occupied by a directory; move a directory to a path occupied by a
     * file; move any element to a path occupied by a directory that is not
     * empty.
     * </p>
     * <p>
     * A move of a file on top of an existing file must attempt to delete and
     * replace that file. A move of a directory on top of an existing empty
     * directory must attempt to delete and replace that directory.
     * </p>
     *
     * @param srcPath
     *            the full path of the file or directory to be moved
     * @param parent
     *            the full path of the target directory to which the file or
     *            directory should be copied
     * @param newName
     *            the new name of the file or directory
     * @return PluginResult containing an Entry object representing the new
     *         entry, or an error code if an error occurs
     */
    protected static PluginResult moveTo(String srcPath, String parent, String newName) {

        // check paths
        if (parent == null || newName == null) {
            Logger.log(FileManager.class.getName() + ": Parameter cannot be null.");
            return new PluginResult(
                    PluginResult.Status.IO_EXCEPTION, NOT_FOUND_ERR);
        }
        else if (!parent.endsWith(FileUtils.FILE_SEPARATOR)) {
            parent += FileUtils.FILE_SEPARATOR;
        }

        // Rules:
        // 1 - file replace existing file ==> OK
        // 2 - directory replace existing EMPTY directory ==> OK
        // 3 - file replace existing directory ==> NO!
        // 4 - directory replace existing file ==> NO!
        // 5 - ANYTHING replace non-empty directory ==> NO!
        //
        // The file-to-directory and directory-to-file checks are performed in
        // the copy operation (below). In addition, we check the destination
        // path to see if it is a directory that is not empty. Also, if the
        // source and target paths have the same parent directory, it is far
        // more efficient to rename the source.
        //
        FileConnection src = null;
        FileConnection dst = null;
        try {
            src = (FileConnection)Connector.open(srcPath, Connector.READ_WRITE);
            if (!src.exists()) {
                Logger.log(FileManager.class.getName() + ": Path not found: " + srcPath);
                return new PluginResult(
                        PluginResult.Status.IO_EXCEPTION, NOT_FOUND_ERR);
            }

            if (src.isDirectory() && !srcPath.endsWith(FileUtils.FILE_SEPARATOR)) {
                // Rename of a directory on OS 7+ is quirky in that it requires
                // the opened file path to have a trailing slash.
                src.close();
                src = (FileConnection)Connector.open(srcPath + '/', Connector.READ_WRITE);
            }

            // cannot delete the destination path if it is a directory that is
            // not empty
            dst = (FileConnection) Connector.open(parent + newName, Connector.READ_WRITE);
            if (dst.isDirectory() && dst.list("*", true).hasMoreElements()) {
                return new PluginResult(
                        PluginResult.Status.IO_EXCEPTION, INVALID_MODIFICATION_ERR);
            }

            // simply rename if source path and parent are same directory
            String srcURL = src.getURL();
            String srcName = src.getName();
            String srcDir = srcURL.substring(0, srcURL.length() - srcName.length());
            if (srcDir.equals(parent)) {
                // rename to itself is an error
                if (FileUtils.stripSeparator(srcName).equals(
                        FileUtils.stripSeparator(newName))) {
                    return new PluginResult(PluginResult.Status.IO_EXCEPTION,
                            INVALID_MODIFICATION_ERR);
                }

                // file replace file || directory replace directory ==> OK
                // delete the existing entry
                if (dst.exists() &&
                        ( (src.isDirectory() && dst.isDirectory()) ||
                          (!src.isDirectory() && !dst.isDirectory()) )) {
                    dst.delete();
                }

                // rename
                src.rename(newName);
                Entry entry = getEntryFromURI(parent + newName);
                return new PluginResult(PluginResult.Status.OK, entry.toJSONObject());
            }
        }
        catch (IllegalArgumentException e) {
            Logger.log(FileManager.class.getName() + ": " + e);
            return new PluginResult(
                    PluginResult.Status.JSON_EXCEPTION,
                    ENCODING_ERR);
        }
        catch (IOException e) {
            // rename failed
            Logger.log(FileManager.class.getName() + ": " + e);
            return new PluginResult(
                    PluginResult.Status.IO_EXCEPTION,
                    INVALID_MODIFICATION_ERR);
        }
        finally {
            try {
                if (src != null) src.close();
                if (dst != null) dst.close();
            }
            catch (IOException ignored) {
            }
        }

        // There is no FileConnection API to move files and directories, so
        // the move is a copy operation from source to destination, followed by
        // a delete operation of the source.
        //
        // The following checks are made in the copy operation:
        //   * moving a directory into itself,
        //   * moving a file to an existing directory, and
        //   * moving a directory to an existing file
        //
        // copy source to destination
        PluginResult result = copyTo(srcPath, parent, newName);

        // if copy succeeded, delete source
        if (result.getStatus() == PluginResult.Status.OK.ordinal()) {
            try {
                FileUtils.delete(srcPath);
            }
            catch (IOException e) {
                // FIXME: half of move failed, but deleting either source or
                // destination to compensate seems risky
                Logger.log(FileManager.class.getName()
                        + ": Failed to delete source directory during move operation.");
            }
        }
        return result;
    }

    /**
     * Creates a file system entry for the file or directory located at the
     * specified path.
     *
     * @param filePath
     *            full path name of an entry on the file system
     * @return a file system entry corresponding to the file path, or
     *         <code>null</code> if the path is invalid or does not exist on the
     *         file system
     * @throws IllegalArgumentException
     *             is the file path is invalid
     * @throws IOException
     */
    protected static Entry getEntryFromURI(String filePath)
            throws IllegalArgumentException {
        // check for bogus path
        String path = (filePath == null) ? null : filePath.trim();
        if (path == null || path.length() < 1) {
            throw new IllegalArgumentException("Invalid URI.");
        }

        //check for query string
        int queryIndex = filePath.indexOf('?');
        if (queryIndex > 0) {
            path = filePath.substring(0, queryIndex); // discard the query string
            Logger.log(FileManager.class.getName() + ": found query string when resolving URI = " + filePath.substring(queryIndex));
        }

        // create a file system entry
        Entry entry = null;
        if (path.startsWith(FileUtils.LOCAL_PROTOCOL)) {
            entry = getEntryFromLocalURI(filePath);
        }
        else {
            FileConnection fconn = null;
            try {
                fconn = (FileConnection) Connector.open(path);
                if (fconn.exists()) {
                    // create a new Entry
                    entry = new Entry();
                    entry.setDirectory(fconn.isDirectory());
                    entry.setName(FileUtils.stripSeparator(fconn.getName()));
                    entry.setFullPath(FileUtils.stripSeparator(path));
                }
            }
            catch (IOException e) {
                Logger.log(FileManager.class.getName() + ": " + e.getMessage());
            }
            finally {
                try {
                    if (fconn != null) fconn.close();
                }
                catch (IOException ignored) {
                }
            }
        }

        return entry;
    }

    /**
     * Creates a file system entry for a resource contained in the packaged
     * application. Use this method if the specified path begins with
     * <code>local:///</code> protocol.
     *
     * @param localPath
     *            the path of the application resource
     * @return a file system entry corresponding to the local path, or
     *         <code>null</code> if a resource does not exist at the specified
     *         path
     */
    private static Entry getEntryFromLocalURI(String localPath) {
        // Remove local:// from filePath but leave a leading /
        String path = localPath.substring(8);
        Entry entry = null;
        if (FileUtils.FILE_SEPARATOR.equals(path)
                || Application.class.getResourceAsStream(path) != null) {
            entry = new Entry();
            entry.setName(path.substring(1));
            entry.setFullPath(localPath);
        }
        return entry;
    }

    /**
     * Tests whether the specified file system type is valid.
     *
     * @param type
     *            file system type
     * @return true if file system type is valid
     */
    protected static boolean isValidFileSystemType(int type) {
        return (type == FS_TEMPORARY || type == FS_PERSISTENT);
    }

    /**
     * Determines if the specified path is the root path of a file system.
     *
     * @param path
     *            full path
     * @return true if the path is the root path of a file system
     */
    protected static boolean isFileSystemRoot(String path) {
        if (path == null) {
            return false;
        }

        if (!path.endsWith(FileUtils.FILE_SEPARATOR)) {
            path += FileUtils.FILE_SEPARATOR;
        }

        boolean isRoot = false;
        Enumeration e = FileSystemRegistry.listRoots();
        while (e.hasMoreElements()) {
            String root = "file:///" + (String) e.nextElement();
            if (root.equals(path)) {
                isRoot = true;
                break;
            }
        }

        return (isRoot || path.equals(FileUtils.getApplicationTempDirPath()));
    }

    /**
     * Retrieves the name for the specified file system type.
     *
     * @param type
     *            file system type
     * @return file system name
     */
    protected static String getFileSystemName(int type) {
        String name = null;
        switch (type) {
        case FS_TEMPORARY:
            name = "temporary";
            break;
        case FS_PERSISTENT:
            name = "persistent";
            break;
        }
        return name;
    }

    /**
     * Returns full path from the directory and name specified.
     *
     * @param parent
     *            full path of the parent directory
     * @param name
     *            name of the directory entry (can be <code>null</code>)
     * @return full path of the file system entry
     * @throws IllegalArgumentException
     *             if <code>parent</code> is <code>null</code>
     */
    public static String getFullPath(String parent, String name)
            throws IllegalArgumentException {
        if (parent == null) {
            throw new IllegalArgumentException("Directory cannot be null.");
        }

        if (!parent.endsWith(FileUtils.FILE_SEPARATOR)) {
            parent += FileUtils.FILE_SEPARATOR;
        }
        return (name == null) ? parent : parent + name;
    }

    /**
     * Determines if the specified action should be run synchronously.
     *
     * @param action
     *            the action to perform
     * @return true if the action should be synchronous
     */
    public boolean isSynch(String action) {
        if (ACTION_IS_FILE_SYSTEM_ROOT.equals(action)) {
            return true;
        }
        return super.isSynch(action);
    }
}
