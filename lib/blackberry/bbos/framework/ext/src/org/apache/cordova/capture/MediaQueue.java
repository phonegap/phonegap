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

import java.util.Vector;

/**
 * Acts as a container for captured media files.  The media applications will
 * add to the queue when a media file is captured.
 */
class MediaQueue {
    private Vector queue = new Vector();

    synchronized void add(final String filePath) {
        queue.addElement(filePath);
        notifyAll();
    }

    synchronized String remove() throws InterruptedException {
        while (queue.size() == 0) {
            wait();
        }
        String filePath = (String) queue.firstElement();
        queue.removeElement(filePath);
        notifyAll();
        return filePath;
    }
}
