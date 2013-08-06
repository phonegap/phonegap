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
import org.apache.cordova.util.Logger;

import net.rim.device.api.ui.UiApplication;

/**
 * Displays a confirmation dialog with customizable title, message, and button
 * fields.
 */
public class ConfirmAction {

    private static final String DEFAULT_MESSAGE = "";
    private static final String DEFAULT_TITLE   = "Confirm";
    private static final String DEFAULT_BUTTONS = "OK,Cancel";

    /**
     * Displays a custom confirmation dialog.
     *
     * @param args JSONArray formatted as [ message, title, buttonLabels ]
     *             message:     the message to display in the dialog body (default: "").
     *             title:       the title to display at the top of the dialog (default: "Confirm").
     *             buttonLabel: the button text (default: "OK,Cancel").
     * @return A PluginResult object with index of dialog button pressed (1,2,3...).
     */
    public static PluginResult execute(JSONArray args) {

        PluginResult result = null;

        try {
            String message = DEFAULT_MESSAGE;
            String title = DEFAULT_TITLE;
            String buttonLabels = DEFAULT_BUTTONS;
            if (args.length() > 0 && !args.isNull(0))
                message = args.getString(0);
            if (args.length() > 1 && !args.isNull(1))
                title = args.getString(1);
            if (args.length() > 2 && !args.isNull(2))
                buttonLabels = args.getString(2);

            // construct the dialog
            final ConfirmDialog dialog = new ConfirmDialog(message, title, buttonLabels);

            // ask the event dispatch thread to show it
            Runnable runnable = new Runnable() {
                public void run() {
                    UiApplication ui = UiApplication.getUiApplication();
                    ui.pushModalScreen(dialog);
                }
            };
            Logger.log(ConfirmAction.class.getName() + ": showing confirm dialog: '" + title + "'");
            UiApplication.getUiApplication().invokeAndWait(runnable);

            // add +1 to the button index to match the JavaScript API (which starts at 1)
            int button = dialog.getSelectedValue() + 1;
            result = new PluginResult(PluginResult.Status.OK, Integer.toString(button));
        }
        catch (JSONException e) {
            result = new PluginResult(PluginResult.Status.JSON_EXCEPTION, "JSONException: " + e.getMessage());
        }

        return result;
    }
}
