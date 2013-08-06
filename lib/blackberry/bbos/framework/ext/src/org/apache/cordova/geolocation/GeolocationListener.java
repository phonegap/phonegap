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
import javax.microedition.location.LocationListener;
import javax.microedition.location.LocationProvider;

import org.apache.cordova.CordovaExtension;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.json4j.JSONException;
import org.apache.cordova.json4j.JSONObject;
import org.apache.cordova.util.Logger;

/**
 * GeolocationListener listens for update notifications from a LocationProvider.
 * Provides location update notifications to registered callback.
 */
public final class GeolocationListener implements LocationListener {

	private LocationProvider locationProvider;  // location provider the listener listens to
	private String callbackId;                  // callback that is to be notified on location updates

	/**
	 * Creates a new listener that attaches itself to the specified LocationProvider.
	 * @param locationProvider location provider that listener will attach to
	 * @param callbackId       callback to receive location updates
	 * @param options          position options
	 */
	public GeolocationListener(LocationProvider locationProvider, String callbackId, PositionOptions options) {
	    this.locationProvider = locationProvider;
	    this.callbackId = callbackId;

	    // Add this as a location listener to the provider.  Updates are received
	    // at the specified interval.  This is where it gets confusing:
	    // the setLocationListener method takes three parameters: interval, timeout,
	    // and maxAge.  The listener only seems to work if all three are the same
	    // value, which is probably best, since neither timeout nor maxAge can be
	    // larger than interval.  Also, the actual timeout to wait for a valid
	    // location is [interval + timeout]. (I told you it was confusing).
	    // So, we do the only thing we can do, which is to divide the user timeout
	    // in half, and set it to the interval and timeout values.  This will give
	    // us the correct timeout value. BTW, this is exactly what RIM does in
	    // their HTML5 implementation in the 6.0 browser.  Try it :)
        int seconds = (options.timeout > 0) ? options.timeout/2000 : 1; // half and convert to millis
	    this.locationProvider.setLocationListener(this,
	            seconds,     // interval - seconds between location updates
	            seconds,     // timeout - additional time to wait for update
	            seconds);    // maxage - maximum age of location
	}

    /**
     * Updated when location changes.
     */
    public void locationUpdated(LocationProvider provider, Location location) {
        if (location.isValid()) {
            Logger.log(this.getClass().getName() + ": updated with valid location");
            this.updateLocation(location);
        } else {
            // This just means we couldn't get a valid location within the listener interval.
            Logger.log(this.getClass().getName() + ": updated with invalid location");
            CordovaExtension.invokeErrorCallback(callbackId,
                    new GeolocationResult(GeolocationStatus.GPS_TIMEOUT));
        }
    }

	/**
	 * Updated when provider state changes.
	 */
    public void providerStateChanged(LocationProvider provider, int newState) {
        switch (newState) {
        case LocationProvider.AVAILABLE:
            Logger.log(this.getClass().getName() + ": provider state changed to AVAILABLE");
            break;
        case LocationProvider.OUT_OF_SERVICE:
            Logger.log(this.getClass().getName() + ": provider state changed to OUT_OF_SERVICE");
            CordovaExtension.invokeErrorCallback(callbackId,
                    new GeolocationResult(GeolocationStatus.GPS_OUT_OF_SERVICE));
            this.shutdown();
            break;
        case LocationProvider.TEMPORARILY_UNAVAILABLE:
            Logger.log(this.getClass().getName() + ": provider state changed to TEMPORARILY_UNAVAILABLE");
            // This is what happens when you are inside
            // TODO: explore possible ways to recover
            CordovaExtension.invokeErrorCallback(callbackId,
                    new GeolocationResult(GeolocationStatus.GPS_TEMPORARILY_UNAVAILABLE));
            this.shutdown();
            break;
        }
    }

    /**
     * Shuts down the listener by resetting the location provider.
     */
	public void shutdown() {
		Logger.log(this.getClass().getName() + ": resetting location provider for callback '" + callbackId + "'");
		this.locationProvider.setLocationListener(null, 0, 0, 0);
		this.locationProvider.reset();
	}

	/**
	 * Notifies callbacks of location updates.
	 * @param location updated location
	 */
	protected void updateLocation(Location location) {
		JSONObject position = null;
		try {
			position = Position.fromLocation(location).toJSONObject();
		} catch (JSONException e) {
			CordovaExtension.invokeErrorCallback(callbackId,
				new GeolocationResult(PluginResult.Status.JSON_EXCEPTION, "Converting the location to a JSON object failed"));
		}

		CordovaExtension.invokeSuccessCallback(callbackId,
			new GeolocationResult(GeolocationStatus.OK, position));
	}
}
