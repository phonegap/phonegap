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
package org.apache.cordova.camera;

import net.rim.device.api.io.file.FileSystemJournal;
import net.rim.device.api.io.file.FileSystemJournalEntry;
import net.rim.device.api.io.file.FileSystemJournalListener;
import net.rim.device.api.ui.UiApplication;

/**
 * Listens for photo added to file system and invokes the specified callback
 * with the result formatted according the specified destination type.
 */
public class PhotoListener implements FileSystemJournalListener {

    /**
     * Image format options specified by the caller.
     */
    private CameraOptions options;

    /**
     * Callback to be invoked with the result.
     */
    private String callbackId;

    /**
     * Used to track file system changes.
     */
    private long lastUSN = 0;

    /**
     * Constructor.
     * @param options         Specifies the format of the image and result
     * @param callbackId      The id of the callback to receive the result
     */
    public PhotoListener(CameraOptions options, String callbackId)
    {
        this.options = options;
        this.callbackId = callbackId;
    }

    /**
     * Listens for file system changes.  When a JPEG file is added, we process
     * it and send it back.
     */
    public void fileJournalChanged()
    {
        // next sequence number file system will use
        long USN = FileSystemJournal.getNextUSN();

        for (long i = USN - 1; i >= lastUSN && i < USN; --i)
        {
            FileSystemJournalEntry entry = FileSystemJournal.getEntry(i);
            if (entry == null)
            {
                break;
            }

            if (entry.getEvent() == FileSystemJournalEntry.FILE_ADDED)
            {
                String path = entry.getPath();
                if (path != null && path.indexOf(".jpg") != -1)
                {
                    // we found a new JPEG file
                    // first, stop listening to avoid processing the file more than once
                    synchronized(UiApplication.getEventLock()) {
                        UiApplication.getUiApplication().removeFileSystemJournalListener(this);
                    }

                    // process the image on a background thread to avoid clogging the event queue
                    final String filePath = "file://" + path;
                    Thread thread = new Thread(new Runnable() {
                        public void run() {
                            Camera.processImage(filePath, options, callbackId);
                        }
                    });
                    thread.start();

                    // clean up
                    Camera.closeCamera();

                    break;
                }
            }
        }

        // remember the file journal change number,
        // so we don't search the same events again and again
        lastUSN = USN;
    }
}
