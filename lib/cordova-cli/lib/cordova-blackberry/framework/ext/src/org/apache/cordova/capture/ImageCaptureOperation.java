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
package org.apache.cordova.capture;

import java.io.IOException;
import java.util.Date;
import javax.microedition.io.Connector;
import javax.microedition.io.file.FileConnection;

import org.apache.cordova.file.File;
import org.apache.cordova.util.FileUtils;
import org.apache.cordova.util.Logger;

import net.rim.device.api.io.MIMETypeAssociations;
import net.rim.device.api.ui.UiApplication;

public class ImageCaptureOperation extends CaptureOperation {
    // content type
    public static String CONTENT_TYPE = "image/";

    // file system listener
    private ImageCaptureListener listener = null;

    /**
     * Creates and starts an image capture operation.
     *
     * @param limit
     *            maximum number of media files to capture
     * @param callbackId
     *            the callback to receive the files
     * @param queue
     *            the queue from which to retrieve captured media files
     */
    public ImageCaptureOperation(long limit, String callbackId, MediaQueue queue) {
        super(limit, callbackId, queue);

        // listener to capture image files added to file system
        this.listener = new ImageCaptureListener(queue);

        start();
    }

    /**
     * Registers file system listener and launches native camera application.
     */
    protected void setup() {
        // register listener for files being written
        synchronized(UiApplication.getEventLock()) {
            UiApplication.getUiApplication().addFileSystemJournalListener(listener);
        }

        // launch the native camera application
        CameraControl.launchCamera();
    }

    /**
     * Unregisters file system listener and closes native camera application.
     */
    protected void teardown() {
        // remove file system listener
        synchronized(UiApplication.getEventLock()) {
            UiApplication.getUiApplication().removeFileSystemJournalListener(listener);
        }

        // close the native camera application
        CameraControl.closeCamera();
    }

    /**
     * Waits for image file to be written to file system and retrieves its file
     * properties.
     *
     * @param filePath
     *            the full path of the media file
     */
    protected void processFile(final String filePath) {
        Logger.log(this.getClass().getName() + ": processing file: " + filePath);

        // wait for file to finish writing and add it to captured files
        addCaptureFile(getMediaFile(filePath));
    }

    /**
     * Waits for file to be fully written to the file system before retrieving
     * its file properties.
     *
     * @param filePath
     *            Full path of the image file
     * @throws IOException
     */
    private File getMediaFile(String filePath) {
        File file = new File(FileUtils.stripSeparator(filePath));

        // time begin waiting for file write
        long start = (new Date()).getTime();

        // wait for the file to be fully written, then grab its properties
        FileConnection fconn = null;
        try {
            fconn = (FileConnection) Connector.open(filePath, Connector.READ);
            if (fconn.exists()) {
                // wait for file to be fully written
                long fileSize = fconn.fileSize();
                long size = 0;
                Thread thisThread = Thread.currentThread();
                while (myThread == thisThread) {
                    try {
                        Thread.sleep(100);
                    }
                    catch (InterruptedException e) {
                        break;
                    }
                    size = fconn.fileSize();
                    if (size == fileSize) {
                        break;
                    }
                    fileSize = size;
                }
                Logger.log(this.getClass().getName() + ": " + filePath + " size="
                        + Long.toString(fileSize) + " bytes");

                // retrieve file properties
                file.setLastModifiedDate(fconn.lastModified());
                file.setName(FileUtils.stripSeparator(fconn.getName()));
                file.setSize(fileSize);
                file.setType(MIMETypeAssociations.getMIMEType(filePath));
            }
        }
        catch (IOException e) {
            Logger.log(this.getClass().getName() + ": " + e);
        }
        finally {
            try {
                if (fconn != null) fconn.close();
            } catch (IOException ignored) {}
        }

        // log time it took to write the file
        long end = (new Date()).getTime();
        Logger.log(this.getClass().getName() + ": wait time="
                + Long.toString(end - start) + " ms");

        return file;
    }
}
