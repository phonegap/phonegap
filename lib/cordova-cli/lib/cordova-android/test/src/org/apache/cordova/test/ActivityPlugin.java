/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/
package org.apache.cordova.test;

import org.apache.cordova.api.LOG;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.Intent;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;

/**
 * This class provides a service.
 */
public class ActivityPlugin extends Plugin {

    static String TAG = "ActivityPlugin";

    /**
     * Constructor.
     */
    public ActivityPlugin() {
    }

    /**
     * Executes the request and returns PluginResult.
     *
     * @param action        The action to execute.
     * @param args          JSONArry of arguments for the plugin.
     * @param callbackId    The callback id used when calling back into JavaScript.
     * @return              A PluginResult object with a status and message.
     */
    @Override
    public PluginResult execute(String action, JSONArray args, String callbackId) {
        PluginResult.Status status = PluginResult.Status.OK;
        String result = "";

        try {
            if (action.equals("start")) {
                this.startActivity(args.getString(0));
            }
            return new PluginResult(status, result);
        } catch (JSONException e) {
            return new PluginResult(PluginResult.Status.JSON_EXCEPTION);
        }
    }

    // --------------------------------------------------------------------------
    // LOCAL METHODS
    // --------------------------------------------------------------------------

    public void startActivity(String className) {
        try {
            Intent intent = new Intent().setClass(this.ctx.getActivity(), Class.forName(className));
            LOG.d(TAG, "Starting activity %s", className);
            this.ctx.getActivity().startActivity(intent);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
            LOG.e(TAG, "Error starting activity %s", className);
        }
    }

}
