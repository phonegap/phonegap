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
package org.apache.cordova.device;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.json4j.JSONArray;
import org.apache.cordova.json4j.JSONException;
import org.apache.cordova.json4j.JSONObject;

import net.rim.device.api.system.DeviceInfo;

/**
 * Provides device information, including:
 *
 * - Device platform version (e.g. 2.13.0.95). Not to be confused with BlackBerry OS version.
 * - Unique device identifier (UUID).
 * - Cordova software version.
 */
public final class Device extends Plugin {

	public static final String FIELD_PLATFORM 	= "platform";
	public static final String FIELD_UUID     	= "uuid";
	public static final String FIELD_CORDOVA	= "cordova";
	public static final String FIELD_MODEL 		= "model";
	public static final String FIELD_NAME 		= "name";
	public static final String FIELD_VERSION 	= "version";

	public static final String ACTION_GET_DEVICE_INFO = "getDeviceInfo";

	public PluginResult execute(String action, JSONArray args, String callbackId) {
		PluginResult result = new PluginResult(PluginResult.Status.INVALID_ACTION, "Device: Invalid action:" + action);

		if(action.equals(ACTION_GET_DEVICE_INFO)){
			try {
				JSONObject device = new JSONObject();
				device.put( FIELD_PLATFORM, "BlackBerry");
				device.put( FIELD_UUID, new Integer( DeviceInfo.getDeviceId()) );
				device.put( FIELD_CORDOVA, "2.7.0" );
				device.put( FIELD_MODEL, new String(DeviceInfo.getDeviceName()) );
				device.put( FIELD_NAME, new String(DeviceInfo.getDeviceName()) );
				device.put( FIELD_VERSION, new String(DeviceInfo.getSoftwareVersion()) );
				result = new PluginResult(PluginResult.Status.OK, device);
			} catch (JSONException e) {
				result = new PluginResult(PluginResult.Status.JSON_EXCEPTION, e.getMessage());
			}
		}

		return result;
	}

}
