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
package org.apache.cordova.battery;

import java.util.Enumeration;
import java.util.Hashtable;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.json4j.JSONArray;
import org.apache.cordova.json4j.JSONException;
import org.apache.cordova.json4j.JSONObject;
import org.apache.cordova.util.Logger;

import net.rim.device.api.system.Application;
import net.rim.device.api.system.DeviceInfo;
import net.rim.device.api.system.SystemListener;

/**
 * The Battery plug-in. This class provides information about the state of the
 * battery on the phone. The following actions are supported:
 *
 *      start - Start listening for changes in battery level (%) and batter
 *              charging state.
 *      stop  - Stop listening for changes in battery level and state.
 */
public class Battery extends Plugin {

    /** Actions to start and stop listening for battery changes. */
    private final static String ACTION_START = "start";
    private final static String ACTION_STOP = "stop";

    /** The percentage of battery remaining. */
    private final static String LEVEL = "level";

    /** Whether the battery is currently charging or not. */
    private final static String CHARGING = "isPlugged";

    // The set of call back IDs to send results to. Using Hashtable because
    // BlackBerry does not support Collections. There should only ever be one
    // call back ID, but this allows multiple.
    private Hashtable callbackIds = new Hashtable();

    private SystemListener batteryListener = null;

    /**
     * Executes the requested action and returns a PluginResult.
     *
     * @param action
     *            The action to execute.
     * @param callbackId
     *            The callback ID to be invoked upon action completion
     * @param args
     *            JSONArry of arguments for the action.
     * @return A PluginResult object with a status and message.
     */
    public PluginResult execute(String action, JSONArray args, String callbackId) {
        PluginResult result = null;

        if (ACTION_START.equals(action)) {
            // Register a listener to detect battery changes.
            addListener(callbackId);

            // Don't return any result now, since battery status results are
            // sent when listener is notified.
            result = new PluginResult(PluginResult.Status.NO_RESULT);

            // Must keep the call back active for future events.
            result.setKeepCallback(true);
        } else if (ACTION_STOP.equals(action)) {
            // Remove the battery listener and cleanup call back IDs.
            removeListener();
            result = new PluginResult(PluginResult.Status.OK);
        } else {
            result = new PluginResult(PluginResult.Status.INVALID_ACTION,
                    "Battery: Invalid action: " + action);
        }

        return result;
    }

    /**
     * Remove the listener when the application is destroyed. Note that onPause
     * is not overridden, so the listener will continue if the application is
     * simply paused instead of destroyed.
     */
    public void onDestroy() {
        removeListener();
    }

    /**
     * Adds a SystemListener to listen for changes to the battery state. The
     * listener is only registered if one has not already been added. If a
     * listener has already been registered the call back id is simply saved so
     * that it can be notified upon next battery state change.
     *
     * @param callbackId
     *            The reference point to call back when a listener event occurs.
     */
    private synchronized void addListener(String callbackId) {
        callbackIds.put(callbackId, callbackId);

        // Only register a listener if one has not been registered.
        if (batteryListener == null) {
            batteryListener = new SystemListener() {
                // Initialize the charging state and battery level.
                private boolean prevChargeState = (DeviceInfo
                        .getBatteryStatus() & DeviceInfo.BSTAT_CHARGING) != 0;
                private int prevLevel = DeviceInfo.getBatteryLevel();

                public void batteryGood() { }
                public void batteryLow() { }

                public void batteryStatusChange(int status) {
                    // The status bits passed into this method are unreliable
                    // in determining when the battery level has changed.
                    // Instead, when any state change occurs, get the current
                    // battery level and report the change if it is different
                    // then previous value.
                    int newLevel = DeviceInfo.getBatteryLevel();
                    boolean newChargeState = (DeviceInfo.BSTAT_CHARGING & status) != 0;

                    // Report change if level or charge state is different then
                    // previous values.
                    if (newLevel != prevLevel || newChargeState != prevChargeState) {
                        prevChargeState = newChargeState;
                        prevLevel = newLevel;

                        // Store the retrieved properties in a JSON object.
                        JSONObject connectionInfo = new JSONObject();
                        try {
                            connectionInfo.put(LEVEL, newLevel);
                            connectionInfo.put(CHARGING, newChargeState);
                        } catch (JSONException e) {
                            Logger.error("JSONException: " + e.getMessage());
                            return;
                        }

                        PluginResult result = new PluginResult(
                                PluginResult.Status.OK, connectionInfo);

                        sendSuccessResult(result, true);
                    }
                }

                public void powerOff() { }
                public void powerUp() { }
            };
            Application.getApplication().addSystemListener(batteryListener);
        }
    }

    /**
     * Remove the registered battery status listener and cleanup the call back
     * IDs.
     */
    private synchronized void removeListener() {
        if (batteryListener != null) {

            // Remove the battery listener.
            Application.getApplication().removeSystemListener(batteryListener);
            batteryListener = null;

            // Close out the call back IDs.
            sendSuccessResult(new PluginResult(PluginResult.Status.OK), false);
            callbackIds.clear();
        }
    }

    /**
     * Helper function to send the PluginResult to the saved call back IDs.
     *
     * @param result
     *            the PluginResult to return
     * @param keepCallback
     *            Boolean value indicating whether to keep the call back id
     *            active.
     */
    private void sendSuccessResult(PluginResult result, boolean keepCallback) {

        if (result != null) {
            // Must keep the call back active for future events.
            result.setKeepCallback(keepCallback);

            // Iterate through the saved call back IDs. Really should only ever
            // be one.
            for (Enumeration callbacks = this.callbackIds.elements(); callbacks
                    .hasMoreElements();) {
                success(result, (String) callbacks.nextElement());
            }
        }
    }

}
