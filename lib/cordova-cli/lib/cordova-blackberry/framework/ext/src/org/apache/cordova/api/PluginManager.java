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
package org.apache.cordova.api;

import java.util.Hashtable;

import org.apache.cordova.CordovaExtension;
import org.apache.cordova.util.FileUtils;
import org.apache.cordova.util.Logger;

import net.rim.device.api.script.Scriptable;
import net.rim.device.api.script.ScriptableFunction;

/**
 * PluginManager represents an object in the script engine. It can be accessed
 * from the script environment using <code>cordova.PluginManager</code>.
 *
 * PluginManager provides a function, <code>exec</code>, that can be invoked
 * from the script environment: <code>cordova.PluginManager.exec(...)</code>.
 * Invoking this function causes the script engine to load the appropriate
 * Cordova Plugin and perform the specified action.
 */
public final class PluginManager extends Scriptable {

    /**
     * Field used to invoke Plugin actions.
     */
    public static String FIELD_EXEC = "exec";

    /**
     * Field used to cleanup Plugins.
     */
    public static String FIELD_DESTROY = "destroy";

    /**
     * Field used to indicate application has been brought to foreground.
     */
    public static String FIELD_RESUME = "resume";

    /**
     * Field used to indicate application has been sent to background
     */
    public static String FIELD_PAUSE = "pause";

    /**
     * Field used to register a Plugin.
     */
    public static String FIELD_ADD_PLUGIN = "addPlugin";

    /**
     * Loads the appropriate Cordova Plugins and invokes their actions.
     */
    private final PluginManagerFunction pluginManagerFunction;

    /**
     * Maps available services to Java class names.
     */
    private Hashtable services = new Hashtable();

    /**
     * Constructor.  Adds available Cordova services.
     * @param ext   The Cordova JavaScript Extension
     */
    public PluginManager(CordovaExtension ext) {
        this.pluginManagerFunction = new PluginManagerFunction(ext, this);
    }

    /**
     * The following fields are supported from the script environment:
     *
     *  <code>cordova.pluginManager.exec</code> - Loads the appropriate
     *  Plugin and invokes the specified action.
     *
     *  <code>cordova.pluginManager.destroy</code> - Invokes the <code>onDestroy</code>
     *  method on all Plugins to give them a chance to cleanup before exit.
     */
    public Object getField(String name) throws Exception {
        if (name.equals(FIELD_EXEC)) {
            return this.pluginManagerFunction;
        }
        else if (name.equals(FIELD_DESTROY)) {
            return new ScriptableFunction() {
                public Object invoke(Object obj, Object[] oargs) throws Exception {
                    destroy();
                    return null;
                }
            };
        }
        else if (name.equals(FIELD_RESUME)) {
            final PluginManagerFunction plugin_mgr = this.pluginManagerFunction;
            return new ScriptableFunction() {
                public Object invoke(Object obj, Object[] oargs) throws Exception {
                    plugin_mgr.onResume();
                    return null;
                }
            };
        }
        else if (name.equals(FIELD_PAUSE)) {
            final PluginManagerFunction plugin_mgr = this.pluginManagerFunction;
            return new ScriptableFunction() {
                public Object invoke(Object obj, Object[] oargs) throws Exception {
                    plugin_mgr.onPause();
                    return null;
                }
            };
        }
        else if (name.equals(FIELD_ADD_PLUGIN)) {
            Logger.log("Plugins are now added through the plugins.xml in the application root.");
        }
        return super.getField(name);
    }

    /**
     * Add a class that implements a service.
     *
     * @param serviceName   The service name.
     * @param className     The Java class name that implements the service.
     */
    public void addService(String serviceName, String className) {
        this.services.put(serviceName, className);
    }

    /**
     * Cleanup the plugin resources and delete temporary directory that may have
     * been created.
     */
    public void destroy() {
        // allow plugins to clean up
        pluginManagerFunction.onDestroy();

        // delete temporary application directory
        // NOTE: doing this on a background thread doesn't work because the app
        // is closing and the thread is killed before it completes.
        try {
            FileUtils.deleteApplicationTempDirectory();
        } catch (Exception e) {
            Logger.log(this.getClass().getName()
                    + ": error deleting application temp directory: "
                    + e.getMessage());
        }
    }

    /**
     * Get the class that implements a service.
     *
     * @param serviceName   The service name.
     * @return The Java class name that implements the service.
     */
    public String getClassForService(String serviceName) {
        return (String)this.services.get(serviceName);
    }
}
