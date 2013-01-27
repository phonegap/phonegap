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
package org.apache.cordova.notification;

import org.apache.cordova.api.PluginResult;
import org.apache.cordova.json4j.JSONArray;
import org.apache.cordova.json4j.JSONException;

import net.rim.device.api.system.Alert;

/**
 * Vibrate Action
 *
 * Vibrates the device for specified duration.
 */
public class VibrateAction {

	private static final int DEFAULT_DURATION = 1000;

	/**
	 * Vibrates the device for a given amount of time.
	 *
	 * @param args JSONArray formatted as [ duration ]
	 *             duration: specifies the vibration length in milliseconds (default: 1000).
	 * @return A PluginResult object with the success or failure state for vibrating the device.
	 */
	public static PluginResult execute(JSONArray args) {
		PluginResult result = null;

		if (Alert.isVibrateSupported()) {
			try {
				int duration = (args.length() >= 1) ? args.getInt(0) : DEFAULT_DURATION;

				Alert.startVibrate(duration);
			}
			catch (JSONException e) {
				result = new PluginResult(PluginResult.Status.JSON_EXCEPTION, "JSONException: " + e.getMessage());
			}

			result = new PluginResult(PluginResult.Status.OK, "OK");
		}
		else {
			result = new PluginResult(PluginResult.Status.ILLEGAL_ACCESS_EXCEPTION, "Vibrate not supported");
		}

		return result;
	}
}
