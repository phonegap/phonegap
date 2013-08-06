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
package org.apache.cordova.util;

import net.rim.device.api.script.Scriptable;
import net.rim.device.api.script.ScriptableFunction;

/**
 * Log provides a mechanism for JavaScript code to utilize the Event Log.
 * Log represents an object in the script engine that can be accessed from the
 * script environment using <code>cordova.Logger</code>.
 *
 * Log provides a function, <code>log(msg)</code>, that logs messages to the
 * BlackBerry Event Log as well as to System.out.
 *
 * To use of the BlackBerry Event Log from JavaScript, you must first
 * invoke the <code>enable()</code> method:
 *
 * <code>cordova.Logger.enable();</code>
 * <code>cordova.Logger.log(msg);</code>
 */
public final class Log extends Scriptable {

    /**
     * Field used to log messages.
     */
    public static final String FIELD_LOG = "log";

    /**
     * Field used to enable message logging.
     */
    public static final String FIELD_ENABLE = "enable";

    /**
     * Logs messages to the BlackBerry Event Log and to <code>System.out</code>.
     */
    public final LogFunction logFunction; // logs to the Event Log

    /**
     * Constructor.
     */
    public Log() {
        this.logFunction = new LogFunction();
    }

    /**
     * The following fields are supported from the script environment:
     *
     *  <code>cordova.Logger.enable</code> - Enables message logging.
     *  <code>cordova.Logger.log</code> - Logs the specified message.
     */
    public Object getField(String name) throws Exception {

        if (name.equals(FIELD_LOG)) {
            return this.logFunction;
	    }
        else if (name.equals(FIELD_ENABLE)) {
            return new ScriptableFunction() {
                public Object invoke(Object obj, Object[] oargs) throws Exception {
                    Logger.enableLogging();
                    return null;
                }
            };
        }
        return super.getField(name);
    }
}
