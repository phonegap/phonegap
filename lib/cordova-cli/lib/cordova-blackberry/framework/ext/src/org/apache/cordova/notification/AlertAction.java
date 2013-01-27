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

import org.apache.cordova.api.PluginResult;
import org.apache.cordova.json4j.JSONArray;
import org.apache.cordova.json4j.JSONException;

import net.rim.device.api.ui.UiApplication;

/**
 * Alert Action
 *
 * Displays and interacts with a dialog box.
 *
 */
public class AlertAction {

    private static final String DEFAULT_MESSAGE = "";
    private static final String DEFAULT_TITLE   = "Alert";
    private static final String DEFAULT_BUTTON  = "OK";

    /**
     * Displays a custom alert.
     *
     * @param args JSONArray formatted as [ message, title, buttonLabel ]
     *             message:     the message to display in the dialog body (default: "").
     *             title:       the title to display at the top of the dialog (default: "Alert").
     *             buttonLabel: the button text (default: "OK").
     * @return A PluginResult object with the success or failure state for displaying the dialog box.
     */
    public static PluginResult execute(JSONArray args) {

        PluginResult result = null;

        try {
            String message = DEFAULT_MESSAGE;
            String title = DEFAULT_TITLE;
            String buttonLabel = DEFAULT_BUTTON;
            if (args.length() > 0 && !args.isNull(0))
                message = args.getString(0);
            if (args.length() > 1 && !args.isNull(1))
                title = args.getString(1);
            if (args.length() > 2 && !args.isNull(2))
                buttonLabel = args.getString(2);

            // construct the dialog
            final AlertDialog dialog = new AlertDialog(message, title, buttonLabel);

            // ask the event dispatch thread to show dialog
            Runnable runnable = new Runnable() {
                public void run() {
                    UiApplication ui = UiApplication.getUiApplication();
                    ui.pushModalScreen(dialog);
                }
            };
            UiApplication.getUiApplication().invokeAndWait(runnable);

            result = new PluginResult(PluginResult.Status.OK);
        }
        catch (JSONException e) {
            result = new PluginResult(PluginResult.Status.JSON_EXCEPTION, "JSONException: " + e.getMessage());
        }

        return result;
    }
}
