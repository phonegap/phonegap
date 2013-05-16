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
package org.apache.cordova.util;

import java.io.DataInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Enumeration;
import java.util.Random;

import javax.microedition.io.Connector;
import javax.microedition.io.file.FileConnection;
import javax.microedition.io.file.FileSystemRegistry;

import org.apache.cordova.CordovaExtension;
import org.apache.cordova.file.File;

import net.rim.device.api.io.FileNotFoundException;
import net.rim.device.api.io.IOUtilities;
import net.rim.device.api.io.MIMETypeAssociations;
import net.rim.device.api.system.Application;
import net.rim.device.api.system.ControlledAccessException;

/**
 * Contains file utility methods.
 */
public class FileUtils {

    public static final String FILE_SEPARATOR = System.getProperty("file.separator");
    public static final String LOCAL_PROTOCOL = "local://";
    public static final String FILE_PROTOCOL = "file://";

    private static final String APP_TMP_DIR;
    
    // init APP_TMP_DIR with a random value
    static {
        Random gen = new Random();
        APP_TMP_DIR = "tmp" + Math.abs(gen.nextInt());
    }

    /**
     * Reads file as byte array.
     * @param filePath      Full path of the file to be read
     * @param mode          One of Connector.READ, READ_WRITE, WRITE
     * @return file content as a byte array
     */
    public static byte[] readFile(String filePath, int mode) throws FileNotFoundException, IOException {
        byte[] blob = null;
        DataInputStream dis = null;
        try {
            dis = openDataInputStream(filePath, mode);
            blob = IOUtilities.streamToBytes(dis);
        }
        finally {
            try {
                if (dis != null) dis.close();
            }
            catch (IOException ignored) {
            }
        }
        return blob;
    }

    /**
     * Utility function to open a DataInputStream from a file path.
     *
     * A file can be referenced with the following protocols:
     *  - System.getProperty("fileconn.dir.*")
     *  - local:/// references files bundled with the application
     *
     * @param filePath The full path to the file to open
     * @param mode     One of Connector.READ, READ_WRITE, WRITE
     * @return Handle to the DataInputStream
     */
    private static DataInputStream openDataInputStream(final String filePath, int mode) throws FileNotFoundException, IOException {
        FileConnection fconn = null;
        DataInputStream dis = null;
        try {
            if (filePath.startsWith(LOCAL_PROTOCOL)) {
                // Remove local:// from filePath but leave a leading /
                dis = new DataInputStream(Application.class.getResourceAsStream(filePath.substring(8)));
            }
            else {
                fconn = (FileConnection)Connector.open(filePath, mode);
                if (!fconn.exists()) {
                    throw new FileNotFoundException(filePath + " not found");
                }
                dis = fconn.openDataInputStream();
            }

            if (dis == null) {
                throw new FileNotFoundException(filePath + " not found");
            }
        }
        finally {
            try {
                if (fconn != null) fconn.close();
            }
            catch (IOException ignored) {
            }
        }

        return dis;
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
     * @return length of data written to file
     * @throws SecurityException
     *             if the application does not have write access to the file
     * @throws IOException
     *             if directory structure does not exist or an unspecified error
     *             occurs
     */
    public static int writeFile(String filePath, byte[] data, int position)
            throws SecurityException, IOException {
        FileConnection fconn = null;
        OutputStream os = null;
        try {
            fconn = (FileConnection) Connector.open(filePath,
                    Connector.READ_WRITE);
            if (!fconn.exists()) {
                fconn.create();
            } else {
                // Originally, this did an overwrite in place and did not
                // truncate.  The truncate was added to match behavior on
                // other platforms.
                fconn.truncate(position);
            }
            os = fconn.openOutputStream(position);
            os.write(data);
        }
        finally {
            try {
                if (os != null)
                    os.close();
                if (fconn != null)
                    fconn.close();
            }
            catch (IOException ignored) {
            }
        }
        return data.length;
    }

    /**
     * Deletes the specified file or directory from file system. If the
     * specified path is a directory, the deletion is recursive.
     *
     * @param path
     *            full path of file or directory to be deleted
     * @throws IOException
     */
    public static void delete(String path) throws IOException {
        FileConnection fconn = null;
        try {
            fconn = (FileConnection)Connector.open(path, Connector.READ_WRITE);
            if (fconn.exists()) {
                // file
                if (!fconn.isDirectory()) {
                    fconn.delete();
                    Logger.log(FileUtils.class.getName() + ":  " + path + " deleted");
                }
                // directory
                else {
                    if (!path.endsWith(FILE_SEPARATOR)) {
                        path += FILE_SEPARATOR;
                    }

                    // recursively delete directory contents
                    Enumeration contents = fconn.list("*", true);
                    if (contents.hasMoreElements()) {
                        fconn.close();
                        while (contents.hasMoreElements()) {
                            delete(path + contents.nextElement().toString());
                        }
                        fconn = (FileConnection)Connector.open(path, Connector.READ_WRITE);
                    }
                    // now delete this directory
                    fconn.delete();
                    Logger.log(FileUtils.class.getName() + ":  " + path + " deleted");
                }
            }
        }
        finally {
            try {
                if (fconn != null) fconn.close();
            }
            catch (IOException ignored) {
            }
        }
    }

    /**
     * Creates a directory. Directories in the specified path are not created
     * recursively. If the directory already exists, no action is taken.
     *
     * @param dirPath
     *            full path of directory to create
     * @throws IOException
     *             if the target file system is not accessible, or an
     *             unspecified error occurs
     */
    public static void mkdir(String dirPath) throws IOException {
        FileConnection fconn = null;
        try {
            fconn = (FileConnection)Connector.open(dirPath);
            if (fconn.isDirectory()) {
                // nothing to do
                return;
            }
            fconn.mkdir();
        } catch (ControlledAccessException e) {
            Logger.log("ControlledAccessException on dir " + dirPath + ", either directory conflict after reinstall of app, or device is connected via usb, see Cordova Docs File Blackberry Quirks");
            Logger.log(e.toString());
        }
        finally {
            try {
                if (fconn != null) fconn.close();
            }
            catch (IOException ignored) {
            }
        }
    }

    /**
     * Determines the size of a file on the file system. Size always represents number of bytes contained in the file; never pre-allocated but empty space
     * @return size in bytes of the selected file, or -1 if the file does not exist or is inaccessible
     */
    public static long fileSize(String path) throws IOException {
        FileConnection fconn = null;
        long fsize = -1;
        try {
            fconn = (FileConnection)Connector.open(path);
            fsize = fconn.fileSize();
        } catch (IOException e) {
            Logger.log(FileUtils.class.getName() + " fileSize:  " + path + "not found or inaccessible");
        } finally {
            try {
                if (fconn != null) fconn.close();
            } catch (IOException ignored) {}
        }
       return fsize;
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
     * @throws IllegalArgumentException
     *             if an invalid source or destination path is provided
     * @throws FileNotFoundException
     *             if the source path cannot be found on the file system
     * @throws SecurityException
     *             if unable to create the new file or directory specified by
     *             destination path
     * @throws IOException
     *             if an attempt is made to copy the contents of a directory
     *             into itself, or if the source and destination paths are
     *             identical, or if a general error occurs
     */
    public static void copy(String srcPath, String parent, String newName)
            throws IllegalArgumentException, FileNotFoundException,
            SecurityException, IOException {

        FileConnection src = null;
        FileConnection dst = null;
        try {
            src = (FileConnection)Connector.open(srcPath, Connector.READ_WRITE);

            // ensure source exists
            if (!src.exists()) {
                throw new FileNotFoundException("Path not found: " + srcPath);
            }

            // ensure target parent directory exists
            if (!isDirectory(parent)) {
                throw new FileNotFoundException("Target directory not found: " + parent);
            }

            // form full destination path
            if (!parent.endsWith(FileUtils.FILE_SEPARATOR)) {
                parent += FileUtils.FILE_SEPARATOR;
            }
            String dstPath = parent + newName;

            // source is a directory
            if (src.isDirectory()) {
                // target should also be directory; append file separator
                if (!dstPath.endsWith(FILE_SEPARATOR)) {
                    dstPath += FILE_SEPARATOR;
                }

                // can't copy directory into itself
                // file:///SDCard/tmp/ --> file:///SDCard/tmp/tmp/ ==> NO!
                // file:///SDCard/tmp/ --> file:///SDCard/tmp/ ==> NO!
                // file:///SDCard/tmp/ --> file:///SDCard/tmp2/ ==> OK
                String srcURL = src.getURL();
                if (dstPath.startsWith(srcURL)) {
                    throw new IOException("Cannot copy directory into itself.");
                }

                // create the destination directory
                mkdir(dstPath);

                // recursively copy directory contents
                Enumeration contents = src.list("*", true);
                if (contents.hasMoreElements()) {
                    src.close();
                    while (contents.hasMoreElements()) {
                        String name = contents.nextElement().toString();
                        copy(srcURL + name, dstPath, name);
                    }
                }
            }
            // source is a file
            else {
                // can't copy file onto itself
                if (dstPath.equals(srcPath)) {
                    throw new IOException("Cannot copy file onto itself.");
                }

                dst = (FileConnection) Connector.open(dstPath, Connector.READ_WRITE);

                // replace existing file, but not directory
                if (dst.exists()) {
                    if (dst.isDirectory()) {
                        throw new IOException(
                                "Cannot overwrite existing directory.");
                    }
                    else {
                        dst.delete();
                    }
                }
                dst.create();

                // copy the contents - wish there was a better way
                InputStream is = null;
                OutputStream os = null;
                try {
                    is = src.openInputStream();
                    os = dst.openOutputStream();
                    byte[] buf = new byte[1024];
                    int len;
                    while ((len = is.read(buf)) > 0) {
                        os.write(buf, 0, len);
                    }
                }
                finally {
                    if (is != null) is.close();
                    if (os != null) os.close();
                }
            }
        }
        finally {
            try {
                if (src != null) src.close();
                if (dst != null) dst.close();
            }
            catch (IOException ignored) {
            }
        }
    }

    /**
     * Creates an temporary directory for the application. The temporary
     * directory is created in the following location:
     * <code>&lt;root&gt;/tmpGUID/</code> where <code>&lt;root&gt;/</code>
     * is the path of the writable directory on the file system (could be the SD
     * card, if present, or the root file system on internal storage); and
     * <code>tmpGUID/</code> is a application temporary directory that is
     * created using the unique application GUID. If the application temporary
     * directory does not exist, invoking this method will create it.
     * <em>NOTE:</em> The <code>&lt;root&gt;/tmpGUID/</code> application
     * temporary directory and all its contents are deleted upon application
     * exit.
     *
     * @return full path name of the application temporary directory
     * @throws IOException
     *             if there are no file systems mounted, or an unspecified error
     *             occurs
     */
    public static String createApplicationTempDirectory() throws IOException {
        // <root>/tmpGUID/
        String tmpDir = getApplicationTempDirPath();
        mkdir(tmpDir);

        return tmpDir;
    }

    /**
     * Creates a temporary directory on the writable storage area of the file
     * system. The temporary directory is created in the following location:
     * <code>&lt;root&gt;/tmpGUID/dirName/</code> where
     * <code>&lt;root&gt;/tmpGUID/</code> is an application temporary
     * directory that is created using the unique application GUID; and
     * <code>dirName/</code> is an optional directory name to create beneath the
     * application temporary directory. If the application temporary directory
     * does not exist, invoking this method will create it. <em>NOTE:</em> The
     * <code>&lt;root&gt;/tmpGUID/</code> application temporary directory
     * and all its contents are deleted upon application exit.
     *
     * @param dirName
     *            name of directory to be created beneath the application
     *            temporary directory
     * @return full path name of the directory that was created
     * @throws IOException
     *             if there are no file systems mounted, or an unspecified error
     *             occurs
     */
    public static String createTempDirectory(String dirName) throws IOException {
        // create the application temp directory
        String tmpDir = createApplicationTempDirectory();

        // create specified sub-directory as "<root>/tmpGUID/dirName/"
        dirName = (dirName == null) ? "" : dirName.trim();
        if (dirName.length() > 0) {
            if (!dirName.endsWith(FILE_SEPARATOR)) {
                dirName += FILE_SEPARATOR;
            }
            tmpDir += dirName;
            mkdir(tmpDir);
        }
        return tmpDir;
    }

    /**
     * Attempts to delete the application temporary directory and all contents.
     * The application temporary directory is:
     * <code>&lt;root&gt;/tmpGUID/</code>, where <code>&lt;root&gt;</code> is
     * the file system root (could be the SD card or internal storage); and
     * <code>tmpGUID</code> is the application temporary directory that is
     * created using the unique application GUID. <em>NOTE:</em> The
     * <code>tmpGUID</code> application temporary directory and all
     * sub-directories are deleted upon application exit.
     *
     * @throws IOException
     *             if an unspecified error occurs
     */
    public synchronized static void deleteApplicationTempDirectory()
            throws IOException {
        String tmpDir = getApplicationTempDirPath();
        delete(tmpDir);
    }

    /**
     * Returns the full path of the application temporary directory. The path
     * points to the following location: <code>&lt;root&gt;/tmpGUID/</code>
     * where <code>&lt;root&gt;/</code> is the path of the writable directory on
     * the file system (could be the SD card, if present, or the root file system
     * on internal storage); and <code>tmpGUID/</code> is a application temporary
     * directory that is created using the unique application GUID. The
     * directory may not exist. Invoke
     * <code>createApplicationTempDirectory</code> to create it.
     *
     * @return the full path name of the application temporary directory
     */
    public static String getApplicationTempDirPath() {
        return getFileSystemRoot() + APP_TMP_DIR + FILE_SEPARATOR;
    }

    /**
     * Returns the full path of a root file system. Will return the path of the
     * SD card first, if it exists, or the root file system located on internal
     * storage.
     *
     * @return full path that can be used to store files
     */
    public static String getFileSystemRoot() {
        String root = null;
        String sdcard = getSDCardPath();

        // retrieve root list
        Enumeration e = FileSystemRegistry.listRoots();
        while (e.hasMoreElements()) {
            root = "file:///" + (String) e.nextElement();
            // system directory won't be writable
            if (root.endsWith("system/")) {
                continue;
            }
            // prefer the SDCard
            else if (root.equals(sdcard)) {
                break;
            }
        }
        return root;
    }

    /**
     * Returns the full path name to external storage (SD card, e.g.
     * file:///SDCard/).
     *
     * @return full path name to the external storage (SD card)
     */
    public static String getSDCardPath() {
        return System.getProperty("fileconn.dir.memorycard");
    }

    /**
     * Returns the full path name of the user directory located on internal
     * storage (e.g. file:///store/home/user/).
     *
     * @return full path name of the user directory
     */
    public static String getUserPath() {
        // grab the music folder
        String musicDir = System.getProperty("fileconn.dir.music");
        // ignore trailing '/'
        int i = musicDir.lastIndexOf('/', musicDir.length() - 2);
        // strip off the last directory
        return musicDir.substring(0, i + 1);
    }

    /**
     * Returns the available size of the file system that the path resides on.
     *
     * @param path
     *            full path of a file system entry
     * @return available size, in bytes, of the root file system
     * @throws IllegalArgumentException
     *             if path is invalid
     * @throws IOException
     *             if an error occurs
     */
    public static long availableSize(String path)
            throws IllegalArgumentException, IOException {
        long availableSize = 0;
        FileConnection fconn = null;
        try {
            fconn = (FileConnection) Connector.open(path);
            availableSize = fconn.availableSize();
        }
        finally {
            try {
                if (fconn != null)
                    fconn.close();
            }
            catch (IOException ignored) {
            }
        }
        return availableSize;
    }

    /**
     * Determines if the specified file system path exists.
     * @param path full path of file or directory
     * @return true if the file or directory exists
     */
    public static boolean exists(String path) {
        boolean exists = false;
        FileConnection fconn = null;
        try {
            fconn = (FileConnection)Connector.open(path);
            exists = fconn.exists();
        }
        catch (IllegalArgumentException e) {
            Logger.log(FileUtils.class.getName() + ": " + e);
        }
        catch (IOException e) {
            Logger.log(FileUtils.class.getName() + ": " + e);
        }
        finally {
            try {
                if (fconn != null) fconn.close();
            }
            catch (IOException ignored) {
            }
        }
        return exists;
    }

    /**
     * Determines if the specified file system path refers to a directory.
     * @param path full path of file or directory
     * @return true if the file path exists, is accessible, and is a directory
     */
    public static boolean isDirectory(String path) {
        boolean isDirectory = false;
        FileConnection fconn = null;
        try {
            fconn = (FileConnection)Connector.open(path);
            isDirectory = fconn.isDirectory();
        }
        catch (IllegalArgumentException e) {
            Logger.log(FileUtils.class.getName() + ": " + e);
        }
        catch (IOException e) {
            Logger.log(FileUtils.class.getName() + ": " + e);
        }
        finally {
            try {
                if (fconn != null) fconn.close();
            }
            catch (IOException ignored) {
            }
        }
        return isDirectory;
    }

    /**
     * Lists the contents of a directory. Lists both files and sub-directories.
     *
     * @param path
     *            full path of the directory to list
     * @return Enumeration containing names of files and sub-directories.
     * @throws FileNotFoundException
     *             if path is not found
     * @throws IOException
     *             if an error occurs
     */
    public static Enumeration listDirectory(String path)
            throws FileNotFoundException, IOException {
        FileConnection fconn = null;
        Enumeration listing = null;
        try {
            fconn = (FileConnection) Connector.open(path);
            if (!fconn.exists()) {
                throw new FileNotFoundException(path + " does not exist.");
            }
            listing = fconn.list();
        }
        finally {
            try {
                if (fconn != null)
                    fconn.close();
            }
            catch (IOException ignored) {
            }
        }
        return listing;
    }

    public static File getFileProperties(String filePath) throws FileNotFoundException {
        File file = new File(stripSeparator(filePath));
        FileConnection fconn = null;
        try {
            fconn = (FileConnection)Connector.open(filePath);
            if (!fconn.exists()) {
                throw new FileNotFoundException();
            }
            file.setLastModifiedDate(fconn.lastModified());
            file.setName(stripSeparator(fconn.getName()));
            file.setType(MIMETypeAssociations.getMIMEType(filePath));
            file.setSize(fconn.fileSize());
        }
        catch (IllegalArgumentException e) {
            Logger.log(FileUtils.class.getName() + ": " + e);
        }
        catch (IOException e) {
            Logger.log(FileUtils.class.getName() + ": " + e);
        }
        finally {
            try {
                if (fconn != null) fconn.close();
            }
            catch (IOException ignored) {
            }
        }
        return file;
    }

    /**
     * Strips the trailing slash from path names.
     *
     * @param path
     *            full or relative path name
     * @return formatted path (without trailing slash)
     */
    public static String stripSeparator(String path) {
        int len = FILE_SEPARATOR.length();
        while (path.endsWith(FILE_SEPARATOR)) {
            path = path.substring(0, path.length() - len);
        }
        return path;
    }


    /**
     * If the specified file path does not have a URI prefix, prefix it with the
     * file:/// prefix.
     *
     * @param filePath
     * @return the prefixed URI.
     */
    public static String prefixFileURI(String filePath) {
        if (!filePath.startsWith(LOCAL_PROTOCOL)
                && !filePath.startsWith(FILE_PROTOCOL)
                && !filePath.startsWith("http://")
                && !filePath.startsWith("https://")) {
            if (filePath.indexOf(FILE_SEPARATOR) != 0) {
                filePath = FILE_PROTOCOL + FILE_SEPARATOR + filePath;
            } else {
                filePath = FILE_PROTOCOL + filePath;
            }
        }

        return filePath;
    }
}
