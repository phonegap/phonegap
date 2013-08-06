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
package org.apache.cordova.geolocation;

import org.apache.cordova.api.PluginResult;
import org.apache.cordova.json4j.JSONObject;
import org.apache.cordova.util.Logger;

/**
 * Extends PluginResult for the purposes of overriding the success and error
 * callback invocations.
 */
public class GeolocationResult extends PluginResult {

	/**
	 * Constructor.
	 * @param status
	 */
	public GeolocationResult(Status status) {
		super(status);
	}

	/**
	 * Constructor.
	 * @param status
	 * @param message
	 */
	public GeolocationResult(Status status, String message) {
		super(status, message);
	}

	/**
	 * Constructor.
	 * @param status
	 * @param message
	 */
	public GeolocationResult(Status status, JSONObject message) {
		super(status, message);
	}

	/**
	 * Produces the invocation string for the specified geolocation success callback.
	 * @param callbackId callback identifier
	 */
	public String toSuccessCallbackString(String callbackId) {
		Logger.log(this.getClass().getName() + ": invoking success callback: " + callbackId + ", with args: " + this.getJSONString());
		return "try { navigator.geolocation.success('"+callbackId+"', " + this.getJSONString() + "); } catch(e) { alert('error in success callback:' + e.message); }";
	}

	/**
	 * Produces the invocation string for the specified geolocation error callback.
	 * @param callbackId callback identifier
	 */
	public String toErrorCallbackString(String callbackId) {
		return "try { navigator.geolocation.fail('"+callbackId+"', " + this.getJSONString() + "); } catch(e) { alert('error in error callback:' + e.message); }";
	}
}
