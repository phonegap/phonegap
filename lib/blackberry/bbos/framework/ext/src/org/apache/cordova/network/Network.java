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
package org.apache.cordova.network;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.json4j.JSONArray;

/**
 * The Network command interface.
 *
 * The Network class can invoke the following actions:
 *
 *   - getConnectionInfo(callback)
 *
 */
public class Network extends Plugin {
	// Supported actions
	public static final String ACTION_CONNECTION_INFO = "getConnectionInfo";

	private ConnectionInfoAction connectionInfo = new ConnectionInfoAction();

	/**
	 * Executes the request and returns CommandResult.
	 *
	 * @param action The command to execute.
	 * @param callbackId The callback ID to be invoked upon action completion
	 * @param args   JSONArry of arguments for the command.
	 * @return A CommandResult object with a status and message.
	 */
	public PluginResult execute(String action, JSONArray args, String callbackId) {
		PluginResult result = null;

		if (action.equals(ACTION_CONNECTION_INFO)) {
			result = connectionInfo.getConnectionInfo(callbackId);
		}
		else {
			result = new PluginResult(PluginResult.Status.INVALID_ACTION, "Network: Invalid action: " + action);
		}

		return result;
	}

	/**
	 * Called when Plugin is destroyed.
	 */
	public void onDestroy() {
		connectionInfo.shutdown();
	}
}
