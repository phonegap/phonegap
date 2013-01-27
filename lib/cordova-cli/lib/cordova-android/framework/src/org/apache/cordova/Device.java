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

import java.util.TimeZone;

import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.apache.cordova.api.LOG;
import org.apache.cordova.api.CordovaInterface;
import org.apache.cordova.api.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.provider.Settings;
import android.telephony.TelephonyManager;

public class Device extends CordovaPlugin {
    public static final String TAG = "Device";

    public static String cordovaVersion = "2.4.0rc1";              // Cordova version
    public static String platform = "Android";                  // Device OS
    public static String uuid;                                  // Device UUID

    BroadcastReceiver telephonyReceiver = null;

    /**
     * Constructor.
     */
    public Device() {
    }

    /**
     * Sets the context of the Command. This can then be used to do things like
     * get file paths associated with the Activity.
     *
     * @param cordova The context of the main Activity.
     * @param webView The CordovaWebView Cordova is running in.
     */
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        Device.uuid = getUuid();
        this.initTelephonyReceiver();
    }

    /**
     * Executes the request and returns PluginResult.
     *
     * @param action            The action to execute.
     * @param args              JSONArry of arguments for the plugin.
     * @param callbackContext   The callback id used when calling back into JavaScript.
     * @return                  True if the action was valid, false if not.
     */
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("getDeviceInfo")) {
            JSONObject r = new JSONObject();
            r.put("uuid", Device.uuid);
            r.put("version", this.getOSVersion());
            r.put("platform", Device.platform);
            r.put("name", this.getProductName());
            r.put("cordova", Device.cordovaVersion);
            r.put("model", this.getModel());
            callbackContext.success(r);
        }
        else {
            return false;
        }
        return true;
    }

    /**
     * Unregister receiver.
     */
    public void onDestroy() {
        this.cordova.getActivity().unregisterReceiver(this.telephonyReceiver);
    }

    //--------------------------------------------------------------------------
    // LOCAL METHODS
    //--------------------------------------------------------------------------

    /**
     * Listen for telephony events: RINGING, OFFHOOK and IDLE
     * Send these events to all plugins using
     *      DroidGap.onMessage("telephone", "ringing" | "offhook" | "idle")
     */
    private void initTelephonyReceiver() {
        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(TelephonyManager.ACTION_PHONE_STATE_CHANGED);
        //final CordovaInterface mycordova = this.cordova;
        this.telephonyReceiver = new BroadcastReceiver() {

            @Override
            public void onReceive(Context context, Intent intent) {

                // If state has changed
                if ((intent != null) && intent.getAction().equals(TelephonyManager.ACTION_PHONE_STATE_CHANGED)) {
                    if (intent.hasExtra(TelephonyManager.EXTRA_STATE)) {
                        String extraData = intent.getStringExtra(TelephonyManager.EXTRA_STATE);
                        if (extraData.equals(TelephonyManager.EXTRA_STATE_RINGING)) {
                            LOG.i(TAG, "Telephone RINGING");
                            webView.postMessage("telephone", "ringing");
                        }
                        else if (extraData.equals(TelephonyManager.EXTRA_STATE_OFFHOOK)) {
                            LOG.i(TAG, "Telephone OFFHOOK");
                            webView.postMessage("telephone", "offhook");
                        }
                        else if (extraData.equals(TelephonyManager.EXTRA_STATE_IDLE)) {
                            LOG.i(TAG, "Telephone IDLE");
                            webView.postMessage("telephone", "idle");
                        }
                    }
                }
            }
        };

        // Register the receiver
        this.cordova.getActivity().registerReceiver(this.telephonyReceiver, intentFilter);
    }

    /**
     * Get the OS name.
     *
     * @return
     */
    public String getPlatform() {
        return Device.platform;
    }

    /**
     * Get the device's Universally Unique Identifier (UUID).
     *
     * @return
     */
    public String getUuid() {
        String uuid = Settings.Secure.getString(this.cordova.getActivity().getContentResolver(), android.provider.Settings.Secure.ANDROID_ID);
        return uuid;
    }

    /**
     * Get the Cordova version.
     *
     * @return
     */
    public String getCordovaVersion() {
        return Device.cordovaVersion;
    }

    public String getModel() {
        String model = android.os.Build.MODEL;
        return model;
    }

    public String getProductName() {
        String productname = android.os.Build.PRODUCT;
        return productname;
    }

    /**
     * Get the OS version.
     *
     * @return
     */
    public String getOSVersion() {
        String osversion = android.os.Build.VERSION.RELEASE;
        return osversion;
    }

    public String getSDKVersion() {
        @SuppressWarnings("deprecation")
        String sdkversion = android.os.Build.VERSION.SDK;
        return sdkversion;
    }

    public String getTimeZoneID() {
        TimeZone tz = TimeZone.getDefault();
        return (tz.getID());
    }

}
