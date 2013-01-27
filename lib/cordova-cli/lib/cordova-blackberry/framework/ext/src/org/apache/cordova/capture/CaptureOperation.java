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
import java.util.Enumeration;
import java.util.Vector;

import org.apache.cordova.file.File;
import org.apache.cordova.util.FileUtils;
import org.apache.cordova.util.Logger;

public abstract class CaptureOperation implements Runnable {
    // max number of media files to capture
    protected long limit = 1;

    // for sending results
    protected String callbackId = null;

    // list of captured media files
    protected final Vector captureFiles = new Vector();

    // media file queue
    protected MediaQueue mediaQueue = null;

    // used to interrupt thread
    protected volatile Thread myThread;

    // to determine if operation has been canceled
    protected boolean canceled = false;

    /**
     * Creates and starts a capture operation on a new thread.
     *
     * @param limit
     *            maximum number of media files to capture
     * @param callbackId
     *            the callback to receive the files
     * @param queue
     *            the queue from which to retrieve captured media files
     */
    public CaptureOperation(long limit, String callbackId, MediaQueue queue) {
        if (limit > 1) {
            this.limit = limit;
        }

        this.callbackId = callbackId;
        this.mediaQueue = queue;
        this.myThread = new Thread(this);
    }

    /**
     * Waits for media file to be captured.
     */
    public void run() {
        if (myThread == null) {
            return; // stopped before started
        }

        Logger.log(this.getClass().getName() + ": " + callbackId + " started");

        // tasks to be run before entering main loop
        setup();

        // capture until interrupted or we've reached capture limit
        Thread thisThread = Thread.currentThread();
        String filePath = null;
        while (myThread == thisThread && captureFiles.size() < limit) {
            try {
                // consume file added to media capture queue
                filePath = mediaQueue.remove();
            }
            catch (InterruptedException e) {
                Logger.log(this.getClass().getName() + ": " + callbackId + " interrupted");
                // and we're done
                break;
            }
            processFile(filePath);
        }

        // perform cleanup tasks
        teardown();

        // process captured results
        processResults();

        // unregister the operation from the controller
        CaptureControl.getCaptureControl().removeCaptureOperation(this);

        Logger.log(this.getClass().getName() + ": " + callbackId + " finished");
    }

    /**
     * Starts this capture operation on a new thread.
     */
    protected void start() {
        if (myThread == null) {
            return; // stopped before started
        }
        myThread.start();
    }

    /**
     * Stops the operation.
     */
    public void stop() {
        // interrupt capture thread
        Thread tmpThread = myThread;
        myThread = null;
        if (tmpThread != null && tmpThread.isAlive()) {
            tmpThread.interrupt();
        }
    }

    /**
     * Cancels the operation.
     */
    public void cancel() {
        canceled = true;
        stop();
    }

    /**
     * Processes the results of the capture operation.
     */
    protected void processResults() {
        // process results
        if (!canceled) {
            // invoke appropriate callback
            if (captureFiles.size() > 0) {
                // send capture files
                MediaCapture.captureSuccess(captureFiles, callbackId);
            }
            else {
                // error
                MediaCapture.captureError(callbackId);
            }
        }
        else {
            removeCaptureFiles();
        }
    }

    /**
     * Adds a media file to list of collected media files for this operation.
     *
     * @param file
     *            object containing media file properties
     */
    protected void addCaptureFile(File file) {
        captureFiles.addElement(file);
    }

    /**
     * Removes captured files from the file system.
     */
    protected void removeCaptureFiles() {
        for (Enumeration e = captureFiles.elements(); e.hasMoreElements();) {
            File file = (File) e.nextElement();
            try {
                FileUtils.delete(file.getFullPath());
            }
            catch (IOException ignored) {
            }
        }
    }

    /**
     * Override this method to perform tasks before the operation starts.
     */
    protected void setup() {
    }

    /**
     * Override this method to perform tasks after the operation has
     * stopped.
     */
    protected void teardown() {
    }

    /**
     * Subclasses must implement this method to process a captured media file.
     * @param filePath the full path of the media file
     */
    protected abstract void processFile(final String filePath);
}
