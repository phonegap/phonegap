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
import org.apache.cordova.util.Logger;

import net.rim.device.api.system.ApplicationDescriptor;
import net.rim.device.api.system.ApplicationManager;
import net.rim.device.api.system.ApplicationManagerException;
import net.rim.device.api.system.CodeModuleManager;

public class AudioControl {
    /**
     * Determines if the native voice notes recorder application is installed
     * on the device.
     *
     * @return true if native voice notes recorder application is installed
     */
    public static boolean hasAudioRecorderApplication() {
        return ApplicationUtils.isModuleInstalled("net_rim_bb_voicenotesrecorder");
    }

    /**
     * Determines if the native voice notes recorder application is running in
     * the foreground.
     *
     * @return true if native voice notes recorder application is running in
     *         foreground
     */
    public static boolean isAudioRecorderActive() {
        return ApplicationUtils.isApplicationInForeground("net_rim_bb_voicenotesrecorder");
    }

    /**
     * Launches the native audio recorder application.
     */
    public static void launchAudioRecorder() {
        int handle = CodeModuleManager.getModuleHandle("net_rim_bb_voicenotesrecorder");
        ApplicationDescriptor ad = CodeModuleManager.getApplicationDescriptors(handle)[0];
        ApplicationDescriptor ad2 = new ApplicationDescriptor(ad, null);
        try {
            ApplicationManager.getApplicationManager().runApplication(ad2, true);
        }
        catch (ApplicationManagerException e) {
            Logger.log(AudioControl.class.getName() + ": unable to launch net_rim_bb_voicenotesrecorder");
        }
    }

    /**
     * Closes the native audio recorder application.
     */
    public static void closeAudioRecorder() {
        if (!isAudioRecorderActive()) {
            return;
        }
        ApplicationUtils.injectEscKeyPress(1);
    }
}
