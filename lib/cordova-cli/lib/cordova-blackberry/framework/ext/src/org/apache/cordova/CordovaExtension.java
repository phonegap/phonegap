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
 *
 * Copyright (c) 2011, Research In Motion Limited.
 */
package org.apache.cordova;

import net.rim.device.api.browser.field2.BrowserField;
import net.rim.device.api.script.ScriptEngine;
import net.rim.device.api.system.Application;
import net.rim.device.api.web.WidgetConfig;
import net.rim.device.api.web.WidgetExtension;
import net.rim.device.api.xml.parsers.DocumentBuilderFactory;

import org.apache.cordova.api.PluginManager;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.notification.Notification;
import org.apache.cordova.util.Log;
import org.apache.cordova.util.Logger;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.lang.ref.WeakReference;

/**
 * CordovaExtension is a BlackBerry WebWorks JavaScript extension.  It
 * represents a single feature that can be used to access device capabilities.
 */
public final class CordovaExtension implements WidgetExtension {

    // Weak reference encapsulating BrowserField object used to display the application
    // We use the weak reference because keeping a direct reference can
    // cause memory leak issues in WebWorks. Original solution described
    // and suggested by Tim Neil on the BlackBerry support forums.
    // Thanks Tim!
    protected static WeakReference browser = null;

    // Browser script engine
    //
    protected static ScriptEngine script;

    // Application name
    //
    protected static String appName;

    // Application GUID
    //
    protected static long appID;

    // Plugin Manager
    //
    protected PluginManager pluginManager;

    // Feature ID
    //
    private static final String FEATURE_ID ="org.apache.cordova";

    // Called when the BlackBerry Widget references this extension for the first time.
    // It provides a list of feature IDs exposed by this extension.
    //
    public String[] getFeatureList() {
      return new String[] {FEATURE_ID};
    }

    // Called whenever a widget loads a resource that requires a feature ID that is supplied
    // in the getFeatureList
    //
    public void loadFeature(String feature, String version, Document doc,
            ScriptEngine scriptEngine) throws Exception {
        script = scriptEngine;
        // Not sure why logger is not already enabled?
        Logger.enableLogging();
        if (feature.equals(FEATURE_ID)) {
            pluginManager = new PluginManager(this);

            // create and parse the plugins.xml
            Document c = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(Application.class.getResourceAsStream("/plugins.xml"));

            NodeList plugins = c.getElementsByTagName("plugin");
            if (plugins.getLength() == 0) {
                Logger.warn("If you are using any Cordova APIs you will need to "+
                        "specify them in the config.xml using <gap:plugin name=\"MyPlugin\" "+
                        "value=\"com.example.MyPlugin\"/>");
            }
            for(int i=0; i<plugins.getLength() ; i++){
                Node plugin = plugins.item(i);
                Logger.log("Found plugin " + plugin.getAttributes().getNamedItem("name").getNodeValue() + " = " +
                        plugin.getAttributes().getNamedItem("value").getNodeValue());
                pluginManager.addService(plugin.getAttributes().getNamedItem("name").getNodeValue(),
                        plugin.getAttributes().getNamedItem("value").getNodeValue());
            }

            scriptEngine.addExtension("org.apache.cordova.JavaPluginManager",  pluginManager);
            scriptEngine.addExtension("org.apache.cordova.Logger",         new Log());

            // let Cordova JavaScript know that extensions have been loaded
            // if this is premature, we at least set the _nativeReady flag to true
            // so that when the JS side is ready, it knows native side is too
            Logger.log(this.getClass().getName() + ": invoking Cordova.onNativeReady.fire()");
            scriptEngine.executeScript("try {cordova.require('cordova/channel').onNativeReady.fire();} catch(e) {_nativeReady = true;}", null);
        }
    }

    // Called so that the extension can get a reference to the configuration or browser field object
    //
    public void register(WidgetConfig widgetConfig, BrowserField browserField) {
        browser = new WeakReference(browserField);

        // grab widget application name and use it to generate a unique ID
        appName = widgetConfig.getName();
        appID = Long.parseLong(Math.abs(("org.apache.cordova."+appName).hashCode())+"",16);

        // create a notification profile for the application
        Notification.registerProfile();
    }

    /**
     * Called to clean up any features when the extension is unloaded.  This is
     * invoked by the WebWorks Framework when another URL is loaded.
     *
     * @see net.rim.device.api.web.WidgetExtension#unloadFeatures(org.w3c.dom.Document)
     */
    public void unloadFeatures(Document doc) {
        // Cleanup plugin resources.
        if (pluginManager != null) {
            pluginManager.destroy();
        }
    }

    public static void invokeScript(final String js) {
        // Use a new thread so that JavaScript is invoked asynchronously.
        // Otherwise executeScript doesn't return until JavaScript call back
        // is finished.
        (new Thread() {
            public void run() {
                try {
                    script.executeScript(js, null);
                } catch (Exception e) {
                    // This is likely an IllegalStateException which is thrown
                    // because the framework is in the process of being shutdown
                    // so communication to JavaScript side is not allowed.
                    Logger.log("Caught exception while executing script: "
                            + e.getMessage());
                }
            }
        }).start();
    }

    /**
     * Invokes the Cordova success callback specified by callbackId.
     * @param callbackId   unique callback ID
     * @param result       Cordova PluginResult containing result
     */
    public static void invokeSuccessCallback(String callbackId, PluginResult result) {
      invokeScript(result.toSuccessCallbackString(callbackId));
    }

    /**
     * Invokes the Cordova error callback specified by callbackId.
     * @param callbackId   unique callback ID
     * @param result       Cordova PluginResult containing result
     */
    public static void invokeErrorCallback(String callbackId, PluginResult result) {
      invokeScript(result.toErrorCallbackString(callbackId));
    }

    /**
     * Provides access to the browser instance for the application.
     */
    public static BrowserField getBrowserField() {
      Object o = browser.get();
      if ( o instanceof BrowserField ) {
        return (BrowserField)o;
      } else {
        return null;
      }
    }

    /**
     * Returns the widget application name.
     */
    public static String getAppName() {
        return appName;
    }

    /**
     * Returns unique ID of the widget application.
     */
    public static long getAppID() {
        return appID;
    }
}
