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
package org.apache.cordova.notification;

import org.apache.cordova.CordovaExtension;
import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.json4j.JSONArray;

import net.rim.device.api.notification.NotificationsConstants;
import net.rim.device.api.notification.NotificationsManager;

/**
 * Cordova Notification plugin.
 *
 * The Notification plugin can invoke the following actions:
 *
 *   - alert(message, title, buttonLabel)
 *   - confirm(message, title, button1,button2,button3...)
 *   - beep(count)
 *   - vibrate(duration)
 *   - progressStart(title, message)
 *   - progressStop()
 *   - progressValue(value)
 *   - activityStart(title, message)
 *   - activityStop()
 */
public class Notification extends Plugin {

    /**
     * Possible actions
     */
    private static final String ACTION_ALERT = "alert";
    private static final String ACTION_BEEP = "beep";
    private static final String ACTION_CONFIRM = "confirm";
    private static final String ACTION_VIBRATE = "vibrate";
    private static final String ACTION_PROGRESS_START = "progressStart";
    private static final String ACTION_PROGRESS_STOP = "progressStop";
    private static final String ACTION_PROGRESS_VALUE = "progressValue";
    private static final String ACTION_ACTIVITY_START = "activityStart";
    private static final String ACTION_ACTIVITY_STOP = "activityStop";

    /**
     * Creates a notification profile for the application on the device. The
     * application can trigger a notification event that will play the profile.
     * The profile settings are set by the user.
     */
    public static void registerProfile() {
        // Register with the NotificationsManager to create a notification
        // profile for this application and enable notifications to be
        // controlled by the user
        Object object = new Object() {
            private String appName = CordovaExtension.getAppName();

            public String toString() {
                return appName;
            }
        };
        NotificationsManager.registerSource(CordovaExtension.getAppID(),
                object, NotificationsConstants.IMPORTANT);
    }

    /**
     * Executes the request and returns CommandResult.
     *
     * @param action
     *            The action to perform.
     * @param callbackId
     *            The callback ID to be invoked upon action completion
     * @param args
     *            JSONArry of arguments for the specified action.
     * @return A PluginResult object with a status and message.
     */
    public PluginResult execute(String action, JSONArray args, String callbackId) {
        PluginResult result = null;

        if (ACTION_ALERT.equals(action)) {
            result = AlertAction.execute(args);
        } else if (ACTION_BEEP.equals(action)) {
            result = BeepAction.execute(args);
        } else if (ACTION_CONFIRM.equals(action)) {
            result = ConfirmAction.execute(args);
        } else if (ACTION_VIBRATE.equals(action)) {
            result = VibrateAction.execute(args);
        } else if (ACTION_ACTIVITY_START.equals(action)) {
            result = ActivityDialog.start(args);
        } else if (ACTION_ACTIVITY_STOP.equals(action)) {
            result = ActivityDialog.stop();
        } else if (ACTION_PROGRESS_START.equals(action)) {
            result = ProgressDialog.start(args);
        } else if (ACTION_PROGRESS_STOP.equals(action)) {
            result = ProgressDialog.stop();
        } else if (ACTION_PROGRESS_VALUE.equals(action)) {
            result = ProgressDialog.setValue(args);
        } else {
            result = new PluginResult(PluginResult.Status.INVALID_ACTION,
                    "Notification: Invalid action: " + action);
        }

        return result;
    }

    /**
     * Identifies if action to be executed returns a value and should be run
     * synchronously.
     *
     * @param action
     *            The action to execute
     * @return T=returns value
     */
    public boolean isSynch(String action) {
        if (ACTION_ALERT.equals(action) || ACTION_CONFIRM.equals(action)) {
            return false;
        }

        return true;
    }

}
