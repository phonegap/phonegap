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

import javax.microedition.io.Connector;
import javax.microedition.io.file.FileConnection;

import org.apache.cordova.file.File;
import org.apache.cordova.util.FileUtils;
import org.apache.cordova.util.Logger;

import net.rim.device.api.io.MIMETypeAssociations;
import net.rim.device.api.ui.UiApplication;

public class VideoCaptureOperation extends CaptureOperation {

    // content type
    public static String CONTENT_TYPE = "video/";

    // file system listener
    private VideoCaptureListener listener = null;

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
    public VideoCaptureOperation(long limit, String callbackId, MediaQueue queue) {
        super(limit, callbackId, queue);

        // listener to capture image files added to file system
        this.listener = new VideoCaptureListener(queue);

        start();
    }

    /**
     * Registers file system listener and launches native video recorder
     * application.
     */
    protected void setup() {
        // register listener for files being written
        synchronized(UiApplication.getEventLock()) {
            UiApplication.getUiApplication().addFileSystemJournalListener(listener);
        }

        // launch the native video recorder application
        CameraControl.launchVideoRecorder();
    }

    /**
     * Unregisters file system listener and closes native video recorder
     * application.
     */
    protected void teardown() {
        // remove file system listener
        synchronized(UiApplication.getEventLock()) {
            UiApplication.getUiApplication().removeFileSystemJournalListener(listener);
        }

        // close the native video recorder application
        CameraControl.closeVideoRecorder();
    }

    /**
     * Retrieves the file properties for the captured video recording.
     *
     * @param filePath
     *            full path of the video recording file
     */
    protected void processFile(String filePath) {
        Logger.log(this.getClass().getName() + ": processing file: " + filePath);

        File file = new File(FileUtils.stripSeparator(filePath));

        // grab file properties
        FileConnection fconn = null;
        try {
            fconn = (FileConnection) Connector.open(filePath, Connector.READ);
            if (fconn.exists()) {
                long size = fconn.fileSize();
                Logger.log(this.getClass().getName() + ": " + filePath + " size="
                        + Long.toString(size) + " bytes");
                file.setLastModifiedDate(fconn.lastModified());
                file.setName(FileUtils.stripSeparator(fconn.getName()));
                file.setSize(size);
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

        addCaptureFile(file);
    }
}
