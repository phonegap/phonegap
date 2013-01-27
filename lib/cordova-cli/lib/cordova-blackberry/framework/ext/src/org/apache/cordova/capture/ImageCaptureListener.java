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

import net.rim.device.api.io.file.FileSystemJournal;
import net.rim.device.api.io.file.FileSystemJournalEntry;
import net.rim.device.api.io.file.FileSystemJournalListener;

/**
 * Listens for image files that are added to file system.
 * <p>
 * The file system notifications will arrive on the application event thread.
 * When it receives a notification, it adds the image file path to a MediaQueue
 * so that the capture thread can process the file.
 */
class ImageCaptureListener implements FileSystemJournalListener {

    /**
     * Used to track file system changes.
     */
    private long lastUSN = 0;

    /**
     * Collection of media files.
     */
    private MediaQueue queue = null;

    /**
     * Constructor.
     */
    ImageCaptureListener(MediaQueue queue) {
        this.queue = queue;
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
                    // add file path to the capture queue
                    queue.add("file://" + path);
                    break;
                }
            }
        }

        // remember the file journal change number,
        // so we don't search the same events again and again
        lastUSN = USN;
    }
}
