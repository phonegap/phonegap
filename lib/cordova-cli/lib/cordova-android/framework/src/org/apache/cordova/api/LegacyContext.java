// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

package org.apache.cordova.api;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.AssetManager;
import android.content.res.Resources;
import android.util.Log;

import java.util.concurrent.ExecutorService;

@Deprecated
public class LegacyContext implements CordovaInterface {
    private static final String LOG_TAG = "Deprecation Notice";
    private CordovaInterface cordova;

    public LegacyContext(CordovaInterface cordova) {
        this.cordova = cordova;
    }

    @Deprecated
    public void cancelLoadUrl() {
        Log.i(LOG_TAG, "Replace ctx.cancelLoadUrl() with cordova.cancelLoadUrl()");
    }

    @Deprecated
    public Activity getActivity() {
        Log.i(LOG_TAG, "Replace ctx.getActivity() with cordova.getActivity()");
        return this.cordova.getActivity();
    }

    @Deprecated
    public Context getContext() {
        Log.i(LOG_TAG, "Replace ctx.getContext() with cordova.getContext()");
        return this.cordova.getActivity();
    }

    @Deprecated
    public Object onMessage(String arg0, Object arg1) {
        Log.i(LOG_TAG, "Replace ctx.onMessage() with cordova.onMessage()");
        return this.cordova.onMessage(arg0, arg1);
    }

    @Deprecated
    public void setActivityResultCallback(CordovaPlugin arg0) {
        Log.i(LOG_TAG, "Replace ctx.setActivityResultCallback() with cordova.setActivityResultCallback()");
        this.cordova.setActivityResultCallback(arg0);
    }

    @Deprecated
    public void startActivityForResult(CordovaPlugin arg0, Intent arg1, int arg2) {
        Log.i(LOG_TAG, "Replace ctx.startActivityForResult() with cordova.startActivityForResult()");
        this.cordova.startActivityForResult(arg0, arg1, arg2);
    }

    @Deprecated
    public void startActivity(Intent intent) {
        Log.i(LOG_TAG, "Replace ctx.startActivity() with cordova.getActivity().startActivity()");
        this.cordova.getActivity().startActivity(intent);
    }

    @Deprecated
    public Object getSystemService(String name) {
        Log.i(LOG_TAG, "Replace ctx.getSystemService() with cordova.getActivity().getSystemService()");
        return this.cordova.getActivity().getSystemService(name);
    }

    @Deprecated
    public AssetManager getAssets() {
        Log.i(LOG_TAG, "Replace ctx.getAssets() with cordova.getActivity().getAssets()");
        return this.cordova.getActivity().getAssets();
    }

    @Deprecated
    public void runOnUiThread(Runnable runnable) {
        Log.i(LOG_TAG, "Replace ctx.runOnUiThread() with cordova.getActivity().runOnUiThread()");
        this.cordova.getActivity().runOnUiThread(runnable);
    }

    @Deprecated
    public Context getApplicationContext() {
        Log.i(LOG_TAG, "Replace ctx.getApplicationContext() with cordova.getActivity().getApplicationContext()");
        return this.cordova.getActivity().getApplicationContext();
    }

    @Deprecated
    public PackageManager getPackageManager() {
        Log.i(LOG_TAG, "Replace ctx.getPackageManager() with cordova.getActivity().getPackageManager()");
        return this.cordova.getActivity().getPackageManager();
    }

    @Deprecated
    public SharedPreferences getSharedPreferences(String name, int mode) {
        Log.i(LOG_TAG, "Replace ctx.getSharedPreferences() with cordova.getActivity().getSharedPreferences()");
        return this.cordova.getActivity().getSharedPreferences(name, mode);
    }

    @Deprecated
    public void unregisterReceiver(BroadcastReceiver receiver) {
        Log.i(LOG_TAG, "Replace ctx.unregisterReceiver() with cordova.getActivity().unregisterReceiver()");
        this.cordova.getActivity().unregisterReceiver(receiver);
    }

    @Deprecated
    public Resources getResources() {
        Log.i(LOG_TAG, "Replace ctx.getResources() with cordova.getActivity().getResources()");
        return this.cordova.getActivity().getResources();
    }

    @Deprecated
    public ComponentName startService(Intent service) {
        Log.i(LOG_TAG, "Replace ctx.startService() with cordova.getActivity().startService()");
        return this.cordova.getActivity().startService(service);
    }

    @Deprecated
    public boolean bindService(Intent service, ServiceConnection conn, int flags) {
        Log.i(LOG_TAG, "Replace ctx.bindService() with cordova.getActivity().bindService()");
        return this.cordova.getActivity().bindService(service, conn, flags);
    }

    @Deprecated
    public void unbindService(ServiceConnection conn) {
        Log.i(LOG_TAG, "Replace ctx.unbindService() with cordova.getActivity().unbindService()");
        this.cordova.getActivity().unbindService(conn);
    }

    public ExecutorService getThreadPool() {
        Log.i(LOG_TAG, "Replace ctx.getThreadPool() with cordova.getThreadPool()");
        return this.cordova.getThreadPool();
    }
}
