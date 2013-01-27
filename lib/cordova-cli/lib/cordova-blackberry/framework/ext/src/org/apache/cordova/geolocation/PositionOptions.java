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

import org.apache.cordova.json4j.JSONArray;
import org.apache.cordova.json4j.JSONException;

public class PositionOptions {
	private static final int START_ARG_MAX_AGE = 1;
	private static final int START_ARG_TIMEOUT = 2;
	private static final int START_ARG_HIGH_ACCURACY = 3;

	public int maxAge;
	public int timeout;
	public boolean enableHighAccuracy;

	public static PositionOptions fromJSONArray(JSONArray args) throws NumberFormatException, JSONException {
		PositionOptions po = new PositionOptions();

		po.maxAge = Integer.parseInt(args.getString(START_ARG_MAX_AGE));
		po.timeout = Integer.parseInt(args.getString(START_ARG_TIMEOUT));
		po.enableHighAccuracy = args.getBoolean(START_ARG_HIGH_ACCURACY);

		return po;
	}
}
