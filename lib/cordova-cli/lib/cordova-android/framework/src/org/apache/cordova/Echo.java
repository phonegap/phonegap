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
package org.apache.cordova;

import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.json.JSONException;

public class Echo extends CordovaPlugin {

    @Override
    public boolean execute(String action, CordovaArgs args, final CallbackContext callbackContext) throws JSONException {
        if ("echo".equals(action)) {
            final String result = args.isNull(0) ? null : args.getString(0);
            callbackContext.success(result);
            return true;
        } else if ("echoAsync".equals(action)) {
            final String result = args.isNull(0) ? null : args.getString(0);
            cordova.getThreadPool().execute(new Runnable() {
                public void run() {
                    callbackContext.success(result);
                }
            });
            return true;
        } else if ("echoArrayBuffer".equals(action)) {
            final byte[] result = args.getArrayBuffer(0);
            callbackContext.success(result);
            return true;
        }
        return false;
    }
}
