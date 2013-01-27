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
package org.apache.cordova.api;

import java.io.IOException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map.Entry;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.xmlpull.v1.XmlPullParserException;

import android.content.Intent;
import android.content.res.XmlResourceParser;
import android.util.Log;

/**
 * PluginManager is exposed to JavaScript in the Cordova WebView.
 *
 * Calling native plugin code can be done by calling PluginManager.exec(...)
 * from JavaScript.
 */
public class PluginManager {
    private static String TAG = "PluginManager";

    // List of service entries
    private final HashMap<String, PluginEntry> entries = new HashMap<String, PluginEntry>();

    private final CordovaInterface ctx;
    private final CordovaWebView app;

    // Flag to track first time through
    private boolean firstRun;

    // Map URL schemes like foo: to plugins that want to handle those schemes
    // This would allow how all URLs are handled to be offloaded to a plugin
    protected HashMap<String, String> urlMap = new HashMap<String, String>();

    /**
     * Constructor.
     *
     * @param app
     * @param ctx
     */
    public PluginManager(CordovaWebView app, CordovaInterface ctx) {
        this.ctx = ctx;
        this.app = app;
        this.firstRun = true;
    }

    /**
     * Init when loading a new HTML page into webview.
     */
    public void init() {
        LOG.d(TAG, "init()");

        // If first time, then load plugins from plugins.xml file
        if (this.firstRun) {
            this.loadPlugins();
            this.firstRun = false;
        }

        // Stop plugins on current HTML page and discard plugin objects
        else {
            this.onPause(false);
            this.onDestroy();
            this.clearPluginObjects();
        }

        // Start up all plugins that have onload specified
        this.startupPlugins();
    }

    /**
     * Load plugins from res/xml/plugins.xml
     */
    public void loadPlugins() {
        int id = this.ctx.getActivity().getResources().getIdentifier("config", "xml", this.ctx.getActivity().getPackageName());
        if(id == 0)
        {
            id = this.ctx.getActivity().getResources().getIdentifier("plugins", "xml", this.ctx.getActivity().getPackageName());
            LOG.i(TAG, "Using plugins.xml instead of config.xml.  plugins.xml will eventually be deprecated");
        }
        if (id == 0) {
            this.pluginConfigurationMissing();
            //We have the error, we need to exit without crashing!
            return;
        }
        XmlResourceParser xml = this.ctx.getActivity().getResources().getXml(id);
        int eventType = -1;
        String service = "", pluginClass = "", paramType = "";
        boolean onload = false;
        PluginEntry entry = null;
        boolean insideFeature = false;
        while (eventType != XmlResourceParser.END_DOCUMENT) {
            if (eventType == XmlResourceParser.START_TAG) {
                String strNode = xml.getName();
                //This is for the old scheme
                if (strNode.equals("plugin")) {
                    service = xml.getAttributeValue(null, "name");
                    pluginClass = xml.getAttributeValue(null, "value");
                    // System.out.println("Plugin: "+name+" => "+value);
                    onload = "true".equals(xml.getAttributeValue(null, "onload"));
                    entry = new PluginEntry(service, pluginClass, onload);
                    this.addService(entry);                   
                }
                //What is this?
                else if (strNode.equals("url-filter")) {
                    this.urlMap.put(xml.getAttributeValue(null, "value"), service);
                }
                else if (strNode.equals("feature")) {
                    insideFeature = true;
                    //Check for supported feature sets (Accelerometer, Geolocation, etc)
                    //Set the bit for reading params
                    String uri = xml.getAttributeValue(null,"name");
                }
                else if(strNode.equals("param")) {
                    if(insideFeature)
                    {
                        paramType = xml.getAttributeValue(null, "name");
                        if(paramType.equals("service"))
                            service = xml.getAttributeValue(null, "value");
                        else if(paramType.equals("package"))
                            pluginClass = xml.getAttributeValue(null, "value");
                        if(service.length() > 0  && pluginClass.length() > 0)
                        {
                            onload = "true".equals(xml.getAttributeValue(null, "onload"));
                            entry = new PluginEntry(service, pluginClass, onload);
                            this.addService(entry);
                            service = "";
                            pluginClass = "";
                        }
                    }
                }
            }
            else if (eventType == XmlResourceParser.END_TAG)
            {
                String strNode = xml.getName();
                if(strNode.equals("feature"))
                {
                    //Empty the strings to prevent plugin loading bugs
                    service = "";
                    pluginClass = "";
                    insideFeature = false;
                }
            }
            try {
                eventType = xml.next();
            } catch (XmlPullParserException e) {
                e.printStackTrace();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    /**
     * Delete all plugin objects.
     */
    public void clearPluginObjects() {
        for (PluginEntry entry : this.entries.values()) {
            entry.plugin = null;
        }
    }

    /**
     * Create plugins objects that have onload set.
     */
    public void startupPlugins() {
        for (PluginEntry entry : this.entries.values()) {
            if (entry.onload) {
                entry.createPlugin(this.app, this.ctx);
            }
        }
    }

    /**
     * Receives a request for execution and fulfills it by finding the appropriate
     * Java class and calling it's execute method.
     *
     * PluginManager.exec can be used either synchronously or async. In either case, a JSON encoded
     * string is returned that will indicate if any errors have occurred when trying to find
     * or execute the class denoted by the clazz argument.
     *
     * @param service       String containing the service to run
     * @param action        String containing the action that the class is supposed to perform. This is
     *                      passed to the plugin execute method and it is up to the plugin developer
     *                      how to deal with it.
     * @param callbackId    String containing the id of the callback that is execute in JavaScript if
     *                      this is an async plugin call.
     * @param rawArgs       An Array literal string containing any arguments needed in the
     *                      plugin execute method.
     * @return Whether the task completed synchronously.
     */
    public boolean exec(String service, String action, String callbackId, String rawArgs) {
        CordovaPlugin plugin = this.getPlugin(service);
        if (plugin == null) {
            PluginResult cr = new PluginResult(PluginResult.Status.CLASS_NOT_FOUND_EXCEPTION);
            app.sendPluginResult(cr, callbackId);
            return true;
        }
        try {
            CallbackContext callbackContext = new CallbackContext(callbackId, app);
            boolean wasValidAction = plugin.execute(action, rawArgs, callbackContext);
            if (!wasValidAction) {
                PluginResult cr = new PluginResult(PluginResult.Status.INVALID_ACTION);
                app.sendPluginResult(cr, callbackId);
                return true;
            }
            return callbackContext.isFinished();
        } catch (JSONException e) {
            PluginResult cr = new PluginResult(PluginResult.Status.JSON_EXCEPTION);
            app.sendPluginResult(cr, callbackId);
            return true;
        }
    }

    @Deprecated
    public boolean exec(String service, String action, String callbackId, String jsonArgs, boolean async) {
        return exec(service, action, callbackId, jsonArgs);
    }

    /**
     * Get the plugin object that implements the service.
     * If the plugin object does not already exist, then create it.
     * If the service doesn't exist, then return null.
     *
     * @param service       The name of the service.
     * @return              CordovaPlugin or null
     */
    public CordovaPlugin getPlugin(String service) {
        PluginEntry entry = this.entries.get(service);
        if (entry == null) {
            return null;
        }
        CordovaPlugin plugin = entry.plugin;
        if (plugin == null) {
            plugin = entry.createPlugin(this.app, this.ctx);
        }
        return plugin;
    }

    /**
     * Add a plugin class that implements a service to the service entry table.
     * This does not create the plugin object instance.
     *
     * @param service           The service name
     * @param className         The plugin class name
     */
    public void addService(String service, String className) {
        PluginEntry entry = new PluginEntry(service, className, false);
        this.addService(entry);
    }

    /**
     * Add a plugin class that implements a service to the service entry table.
     * This does not create the plugin object instance.
     *
     * @param entry             The plugin entry
     */
    public void addService(PluginEntry entry) {
        this.entries.put(entry.service, entry);
    }

    /**
     * Called when the system is about to start resuming a previous activity.
     *
     * @param multitasking      Flag indicating if multitasking is turned on for app
     */
    public void onPause(boolean multitasking) {
        for (PluginEntry entry : this.entries.values()) {
            if (entry.plugin != null) {
                entry.plugin.onPause(multitasking);
            }
        }
    }

    /**
     * Called when the activity will start interacting with the user.
     *
     * @param multitasking      Flag indicating if multitasking is turned on for app
     */
    public void onResume(boolean multitasking) {
        for (PluginEntry entry : this.entries.values()) {
            if (entry.plugin != null) {
                entry.plugin.onResume(multitasking);
            }
        }
    }

    /**
     * The final call you receive before your activity is destroyed.
     */
    public void onDestroy() {
        for (PluginEntry entry : this.entries.values()) {
            if (entry.plugin != null) {
                entry.plugin.onDestroy();
            }
        }
    }

    /**
     * Send a message to all plugins.
     *
     * @param id                The message id
     * @param data              The message data
     * @return
     */
    public Object postMessage(String id, Object data) {
        Object obj = this.ctx.onMessage(id, data);
        if (obj != null) {
            return obj;
        }
        for (PluginEntry entry : this.entries.values()) {
            if (entry.plugin != null) {
                obj = entry.plugin.onMessage(id, data);
                if (obj != null) {
                    return obj;
                }
            }
        }
        return null;
    }

    /**
     * Called when the activity receives a new intent.
     */
    public void onNewIntent(Intent intent) {
        for (PluginEntry entry : this.entries.values()) {
            if (entry.plugin != null) {
                entry.plugin.onNewIntent(intent);
            }
        }
    }

    /**
     * Called when the URL of the webview changes.
     *
     * @param url               The URL that is being changed to.
     * @return                  Return false to allow the URL to load, return true to prevent the URL from loading.
     */
    public boolean onOverrideUrlLoading(String url) {
        Iterator<Entry<String, String>> it = this.urlMap.entrySet().iterator();
        while (it.hasNext()) {
            HashMap.Entry<String, String> pairs = it.next();
            if (url.startsWith(pairs.getKey())) {
                return this.getPlugin(pairs.getValue()).onOverrideUrlLoading(url);
            }
        }
        return false;
    }

    /**
     * Called when the app navigates or refreshes.
     */
    public void onReset() {
        Iterator<PluginEntry> it = this.entries.values().iterator();
        while (it.hasNext()) {
            CordovaPlugin plugin = it.next().plugin;
            if (plugin != null) {
                plugin.onReset();
            }
        }
    }


    private void pluginConfigurationMissing() {
        LOG.e(TAG, "=====================================================================================");
        LOG.e(TAG, "ERROR: plugin.xml is missing.  Add res/xml/plugins.xml to your project.");
        LOG.e(TAG, "https://git-wip-us.apache.org/repos/asf?p=incubator-cordova-android.git;a=blob;f=framework/res/xml/plugins.xml");
        LOG.e(TAG, "=====================================================================================");
    }
}
