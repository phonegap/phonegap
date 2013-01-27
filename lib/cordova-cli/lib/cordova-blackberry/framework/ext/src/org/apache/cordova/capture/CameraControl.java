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

import org.apache.cordova.util.ApplicationUtils;

import net.rim.blackberry.api.invoke.CameraArguments;
import net.rim.blackberry.api.invoke.Invoke;
import net.rim.device.api.ui.UiApplication;

public class CameraControl {
    /**
     * Determines if the native camera application is running in the foreground.
     *
     * @return true if native camera application is running in foreground
     */
    public static boolean isCameraActive() {
        return ApplicationUtils.isApplicationInForeground("net_rim_bb_camera");
    }

    /**
     * Determines if the native video recorder application is running in the
     * foreground.
     *
     * @return true if native video recorder application is running in
     *         foreground
     */
    public static boolean isVideoRecorderActive() {
        return ApplicationUtils.isApplicationInForeground("net_rim_bb_videorecorder");
    }

    /**
     * Launches the native camera application.
     */
    public static void launchCamera() {
        synchronized(UiApplication.getEventLock()) {
            Invoke.invokeApplication(Invoke.APP_TYPE_CAMERA,
                    new CameraArguments());
        }
    }

    /**
     * Launches the native video recorder application.
     */
    public static void launchVideoRecorder() {
        synchronized(UiApplication.getEventLock()) {
            Invoke.invokeApplication(Invoke.APP_TYPE_CAMERA,
                    new CameraArguments(CameraArguments.ARG_VIDEO_RECORDER));
        }
    }

    /**
     * Closes the native camera application.
     */
    public static void closeCamera() {
        if (!isCameraActive()) {
            return;
        }
        ApplicationUtils.injectEscKeyPress(2);
    }

    /**
     * Closes the native video recorder application.
     */
    public static void closeVideoRecorder() {
        if (!isVideoRecorderActive()) {
            return;
        }
        ApplicationUtils.injectEscKeyPress(2);
    }
}
