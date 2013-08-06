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

import org.apache.cordova.camera.Camera;

import net.rim.device.api.system.ApplicationDescriptor;
import net.rim.device.api.system.ApplicationManager;
import net.rim.device.api.system.Characters;
import net.rim.device.api.system.CodeModuleManager;
import net.rim.device.api.system.ControlledAccessException;
import net.rim.device.api.system.EventInjector;
import net.rim.device.api.ui.UiApplication;

public class ApplicationUtils {
    /**
     * Determines if the specified application is running in the foreground.
     *
     * @param handle
     *            the name of the application handle (e.g., net_rim_bb_camera")
     * @return <code>true</code> if the application is running and in the
     *         foreground
     */
    public static boolean isApplicationInForeground(String handle) {
        // determine if the specified application is running in the foreground
        ApplicationManager manager = ApplicationManager.getApplicationManager();
        int foregroundProcessId = manager.getForegroundProcessId();
        ApplicationDescriptor descriptors[] = manager.getVisibleApplications();
        for (int i = 0; i < descriptors.length; i++) {
            if (descriptors[i].getModuleName().equals(handle)
                    && manager.getProcessId(descriptors[i]) == foregroundProcessId) {
                return true;
            }
        }
        return false;
    }

    /**
     * Determines if the specified application is installed.
     *
     * @param handle
     *            the name of the application handle (e.g., net_rim_bb_camera")
     * @return <code>true</code> if the application is installed on the device
     */
    public static boolean isModuleInstalled(String handle) {
        return (CodeModuleManager.getModuleHandle(handle) != 0);
    }

    /**
     * Use this method when another native application has been launched by this
     * application, and you would like the application to be closed.
     * <p>
     * Unfortunately, the only way to do this programmatically is to simulate
     * the Escape (back) key being pressed. We do this by injecting key events,
     * which means the application permissions must have the key injection
     * permissions enabled for it to work.
     * <p>
     * An alternative to closing the applications would be to simply request
     * that our application be brought to the foreground; however, this just
     * pushes all the applications we've launched to the background, leaving a
     * mess for the user to cleanup after this application has been closed.
     *
     * @param repeat
     *            the number of times to press the Esc key
     */
    public static void injectEscKeyPress(final int repeat) {
        // simulate escape characters (back button press)
        Runnable escKeyPresser = new Runnable() {
            public void run() {
                try {
                    EventInjector.KeyEvent inject = new EventInjector.KeyEvent(
                            EventInjector.KeyEvent.KEY_DOWN, Characters.ESCAPE,
                            0);
                    int count = 0;
                    while (count < repeat) {
                        inject.post();
                        count++;
                    }
                }
                catch (ControlledAccessException e) {
                    // the application doesn't have key injection
                    // permissions
                    Logger.log(Camera.class.getName() + ": "
                            + ApplicationDescriptor
                                    .currentApplicationDescriptor().getName()
                            + " does not have key injection permissions.");
                }
            }
        };
        UiApplication.getUiApplication().invokeLater(escKeyPresser);
    }
}
