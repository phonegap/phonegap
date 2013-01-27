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

import javax.microedition.location.Location;

import org.apache.cordova.json4j.JSONException;
import org.apache.cordova.json4j.JSONObject;

/**
 * Stores geo location variables.
 */
public class Position {

	private double _lat = 0;
    private double _lng = 0;
	private float altitude = 0;
	private float accuracy = 0;
	private float alt_accuracy = 0;
    private float heading = 0;
	private float velocity = 0;
	private long timestamp = 0;

	public Position(double lat, double lng, float altitude, float accuracy, float alt_accuracy,
			float heading, float speed, long timestamp) {
		this._lat = lat;
		this._lng = lng;
		this.altitude = altitude;
		this.accuracy = accuracy;
		this.alt_accuracy = alt_accuracy;
		this.heading = heading;
		this.velocity = speed;
		this.timestamp = timestamp;
	}

	public static Position fromLocation(Location location) {
		double latitude = location.getQualifiedCoordinates().getLatitude();
        double longitude = location.getQualifiedCoordinates().getLongitude();
        float altitude = location.getQualifiedCoordinates().getAltitude();
        float accuracy = location.getQualifiedCoordinates().getHorizontalAccuracy();
        float alt_accuracy = location.getQualifiedCoordinates().getVerticalAccuracy();
        float heading = location.getCourse();
        float speed = location.getSpeed();
        long time = location.getTimestamp();

		return new Position(latitude, longitude, altitude, accuracy, alt_accuracy, heading, speed, time);
	}

    public double getLatitude() {
		return _lat;
	}

	public void setLatitude(double _lat) {
		this._lat = _lat;
	}

	public double getLongitude() {
		return _lng;
	}

	public void setLongitude(double _lng) {
		this._lng = _lng;
	}

	public float getAltitude() {
		return altitude;
	}

	public void setAltitude(float altitude) {
		this.altitude = altitude;
	}

	public float getAccuracy() {
		return accuracy;
	}

	public void setAccuracy(float accuracy) {
		this.accuracy = accuracy;
	}

	public float getAltitudeAccuracy() {
		return alt_accuracy;
	}

	public void setAltitudeAccuracy(float alt_accuracy) {
		this.alt_accuracy = alt_accuracy;
	}

	public float getHeading() {
		return heading;
	}

	public void setHeading(float heading) {
		this.heading = heading;
	}

	public float getVelocity() {
		return velocity;
	}

	public void setVelocity(float velocity) {
		this.velocity = velocity;
	}

	public long getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(long timestamp) {
		this.timestamp = timestamp;
	}

	public JSONObject toJSONObject() throws JSONException {
		return new JSONObject("{latitude:" + String.valueOf(_lat) + ", longitude:" + String.valueOf(_lng) + ", altitude:" + altitude + ", accuracy:" + accuracy + ", heading:" + heading + ", speed:" + velocity + ", alt_accuracy:" + alt_accuracy + ", timestamp:" + timestamp + "}");
	}

}
