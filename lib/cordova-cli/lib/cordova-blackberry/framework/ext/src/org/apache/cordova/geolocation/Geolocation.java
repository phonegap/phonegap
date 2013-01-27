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

import java.util.Date;
import java.util.Enumeration;
import java.util.Hashtable;

import javax.microedition.location.Criteria;
import javax.microedition.location.Location;
import javax.microedition.location.LocationException;
import javax.microedition.location.LocationProvider;

import org.apache.cordova.CordovaExtension;
import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.json4j.JSONArray;
import org.apache.cordova.json4j.JSONException;
import org.apache.cordova.json4j.JSONObject;
import org.apache.cordova.util.Logger;

import net.rim.device.api.gps.BlackBerryCriteria;
import net.rim.device.api.gps.BlackBerryLocationProvider;
import net.rim.device.api.gps.GPSInfo;

public class Geolocation extends Plugin {

	/**
	 * Possible actions.
	 */
	protected static final int ACTION_WATCH = 0;
	protected static final int ACTION_CLEAR_WATCH = 1;
	protected static final int ACTION_GET_POSITION = 2;
	protected static final int ACTION_SHUTDOWN = 3;

	/**
	 * Callback ID argument index.
	 */
	protected static final int ARG_CALLBACK_ID = 0;

	/**
	 * Minimum GPS accuracy (meters).
	 */
	protected static final float MIN_GPS_ACCURACY = 10F; // meters

	/**
	 * Hash of all the listeners created, keyed on callback ids.
	 */
	protected final Hashtable geoListeners;

	/**
	 * Constructor.
	 */
	public Geolocation() {
		this.geoListeners = new Hashtable();
	}

	/**
	 * Executes the specified geolocation action.
	 *
	 * @param action
	 * 	  "getCurrentPosition" - Retrieves current location.
	 * 	  "watchPosition"      - Establishes a location provider that is keyed on specified position options
	 *                           and attaches a listener that notifies registered callbacks of location updates.
	 *    "stop"               - Clears the watch identified by the watch ID that must be specified in args.
	 *    "shutdown"           - Stops all listeners and resets all location providers.
	 * @param callbackId callback managed by the plugin manager (ignored)
	 * @param args contains the callback id and position options
	 */
	public PluginResult execute(String action, JSONArray args,  String callbackId) {

		/*
		 * The geolocation plugin bypasses the plugin callback framework for
		 * success callbacks because the current implementation of the framework
		 * deletes the callbacks after they have been called.  The geolocation
		 * listener callbacks need to continue listening for location changes,
		 * and are therefore managed separately from the plugin framework.
		 *
		 * This means the invoking script must pass the listener callback ID in
		 * the args parameter (along with the position options).  The callbackId
		 * parameter (used by the plugin framework) is ignored.
		 *
		 * The invoking script should still provide a failure callback so the
		 * plugin framework can handle general error reporting.
		 */
		String listenerCallbackId;
		try {
			listenerCallbackId = args.getString(ARG_CALLBACK_ID);
		} catch (JSONException e) {
			return new PluginResult(PluginResult.Status.JSON_EXCEPTION, "Callback ID argument is not valid.");
		}

		if (!GPSInfo.isGPSModeAvailable(GPSInfo.GPS_DEVICE_INTERNAL)){
			return new PluginResult(GeolocationStatus.GPS_NOT_AVAILABLE);
		}

		PositionOptions options;
		switch (getAction(action)) {
			case ACTION_CLEAR_WATCH:
				clearWatch(listenerCallbackId);
				return null;

			case ACTION_WATCH:

				try {
					options = PositionOptions.fromJSONArray(args);
				} catch (NumberFormatException e) {
					return new PluginResult(PluginResult.Status.JSON_EXCEPTION, "One of the position options is not a valid number.");
				} catch (JSONException e) {
					return new PluginResult(PluginResult.Status.JSON_EXCEPTION, "One of the position options is not valid JSON.");
				}

				this.watchPosition(listenerCallbackId, options);
				return null;

			case ACTION_GET_POSITION:

				try {
					options = PositionOptions.fromJSONArray(args);
				} catch (NumberFormatException e) {
					return new PluginResult(PluginResult.Status.JSON_EXCEPTION, "One of the position options is not a valid number.");
				} catch (JSONException e) {
					return new PluginResult(PluginResult.Status.JSON_EXCEPTION, "One of the position options is not valid JSON.");
				}

				this.getCurrentPosition(listenerCallbackId, options);
				return null;

			case ACTION_SHUTDOWN:
				this.shutdown();
				return null;
		}

		return new PluginResult(PluginResult.Status.INVALID_ACTION, "Geolocation: invalid action " + action);
	}

	/**
	 * Checks if the provided location is valid.
	 * @param location
	 * @return true if the location is valid
	 */
	protected boolean isLocationValid(Location location) {
		return location != null && location.isValid();
	}

	/**
	 * Checks if the provided location is fresh or not.
	 * @param po           position options containing maximum location age allowed
	 * @param location     location object
	 * @return true if the location is newer than maximum age allowed
	 */
	protected boolean isLocationFresh(PositionOptions po, Location location) {
		return new Date().getTime() - location.getTimestamp() < po.maxAge;
	}

	/**
	 * Checks if the accuracy of the location is high enough.
	 * @param po           position options containing high accuracy flag
	 * @param location     location object
	 * @return true if the location accuracy is lower than MIN_GPS_ACCURACY
	 */
	protected boolean isLocationAccurate(PositionOptions po, Location location) {
		return po.enableHighAccuracy && location.getQualifiedCoordinates().getHorizontalAccuracy() < MIN_GPS_ACCURACY;
	}

	/**
	 * Retrieves a location provider with some criteria.
	 * @param po position options
	 */
	protected static LocationProvider getLocationProvider(PositionOptions po) {
		// configure criteria for location provider
		// Note: being too restrictive will make it less likely that one will be returned
		BlackBerryCriteria criteria = new BlackBerryCriteria();

		// can we get GPS info from the wifi network?
		if (GPSInfo.isGPSModeAvailable(GPSInfo.GPS_MODE_ASSIST))
			criteria.setMode(GPSInfo.GPS_MODE_ASSIST);
		// relies on device GPS receiver - not good indoors or if obstructed
		else if (GPSInfo.isGPSModeAvailable(GPSInfo.GPS_MODE_AUTONOMOUS))
			criteria.setMode(GPSInfo.GPS_MODE_AUTONOMOUS);

		criteria.setAltitudeRequired(true);

		// enable full power usage to increase location accuracy
		if (po.enableHighAccuracy) {
			criteria.setPreferredPowerConsumption(Criteria.POWER_USAGE_HIGH);
		}

		// Attempt to get a location provider
		BlackBerryLocationProvider provider;
		try {
			// Note: this could return an existing provider that meets above criteria
			provider  = (BlackBerryLocationProvider) LocationProvider.getInstance(criteria);
		} catch (LocationException e) {
			// all LocationProviders are currently permanently unavailable :(
			provider = null;
		}

		return provider;
	}

    /**
     * Gets the current location, then creates a location listener to receive
     * updates. Registers the specified callback with the listener.
     * @param callbackId   callback to receive location updates
     * @param options      position options
     */
    protected void watchPosition(String callbackId, PositionOptions options) {

        // attempt to retrieve a location provider
        LocationProvider provider = getLocationProvider(options);
        if (provider == null) {
            CordovaExtension.invokeErrorCallback(callbackId,
                    new GeolocationResult(GeolocationStatus.GPS_NOT_AVAILABLE));
            return;
        }

        // create a listener for location updates
        GeolocationListener listener;
        try {
            listener = new GeolocationListener(provider, callbackId, options);
        } catch (IllegalArgumentException e) {
            // if 	interval < -1, or
            // if 	(interval != -1) and
            //		(timeout > interval or maxAge > interval or
            //			(timeout < 1 and timeout != -1) or
            //			(maxAge < 1 and maxAge != -1)
            //		)
            CordovaExtension.invokeErrorCallback(callbackId,
                    new GeolocationResult(GeolocationStatus.GPS_JSON_EXCEPTION, e.getMessage()));
            return;
        }

        // store the listener
        addListener(callbackId, listener);
    }

    /**
     * Shuts down all location listeners.
     */
    protected synchronized void shutdown() {
        for (Enumeration listeners = this.geoListeners.elements(); listeners.hasMoreElements(); ) {
            GeolocationListener listener = (GeolocationListener) listeners.nextElement();
            listener.shutdown();
        }
        this.geoListeners.clear();
    }

	/**
	 * Clears the watch for the specified callback id.
	 * If no more watches exist for the location provider, it is shut down.
	 * @param callbackId   identifer of the listener to shutdown
	 */
    protected void clearWatch(String callbackId) {
        synchronized(this.geoListeners) {
            GeolocationListener listener = (GeolocationListener) this.geoListeners.get(callbackId);
            listener.shutdown();
            this.geoListeners.remove(callbackId);
        }
    }

    /**
     * Returns a PluginResult with status OK and a JSON object representing the coords
     * @param callbackId   callback to receive the the result
     * @param po           position options
     */
    protected void getCurrentPosition(String callbackId, PositionOptions options) {

        // Check the device for its last known location (may have come from
        // another app on the device that has already requested a location).
        // If it is invalid, old, or inaccurate, attempt to get a new one.
        Location location = LocationProvider.getLastKnownLocation();
        if (!isLocationValid(location) || !isLocationFresh(options, location) || !isLocationAccurate(options, location)) {
            // attempt to retrieve a location provider
            LocationProvider provider = getLocationProvider(options);
            if (provider == null) {
                CordovaExtension.invokeErrorCallback(callbackId,
                        new GeolocationResult(GeolocationStatus.GPS_NOT_AVAILABLE));
                return;
            }

            try {
                // convert timeout from millis
                int timeout = (options.timeout > 0) ? options.timeout/1000 : -1;
                Logger.log(this.getClass().getName() + ": retrieving location with timeout=" + timeout);
                location = provider.getLocation(timeout);
            } catch(LocationException e) {
                Logger.log(this.getClass().getName() + ": " + e.getMessage());
                provider.reset();
                CordovaExtension.invokeErrorCallback(callbackId,
                        new GeolocationResult(GeolocationStatus.GPS_TIMEOUT));
                return;
            } catch (InterruptedException e) {
                Logger.log(this.getClass().getName() + ": " + e.getMessage());
                provider.reset();
                CordovaExtension.invokeErrorCallback(callbackId,
                        new GeolocationResult(GeolocationStatus.GPS_INTERUPTED_EXCEPTION));
                return;
            }
        }

        // send the location back
        sendLocation(callbackId, location);
    }

    /**
     * Converts the location to a geo position and sends result to JavaScript.
     * @param callbackId   callback to receive position
     * @param location     location to send
     */
    protected void sendLocation(String callbackId, Location location) {
        // convert the location to a JSON object and return it in the PluginResult
        JSONObject position = null;
        try {
            position = Position.fromLocation(location).toJSONObject();
        } catch (JSONException e) {
            CordovaExtension.invokeErrorCallback(callbackId,
                    new GeolocationResult(PluginResult.Status.JSON_EXCEPTION,
                    "Converting the location to a JSON object failed"));
            return;
        }

        // invoke the geolocation callback
        CordovaExtension.invokeSuccessCallback(callbackId,
                new GeolocationResult(GeolocationResult.Status.OK, position));
    }

	/**
	 * Returns action to perform.
	 * @param action
	 * @return action to perform
	 */
	protected static int getAction(String action) {
		if ("watchPosition".equals(action)) return ACTION_WATCH;
		if ("stop".equals(action)) return ACTION_CLEAR_WATCH;
		if ("getCurrentPosition".equals(action)) return ACTION_GET_POSITION;
		if ("shutdown".endsWith(action)) return ACTION_SHUTDOWN;
		return -1;
	}

    /**
     * Adds a location listener.
     * @param callbackId    callback to receive listener updates
     * @param listener      location listener
     */
    protected synchronized void addListener(String callbackId, GeolocationListener listener) {
        this.geoListeners.put(callbackId, listener);
    }

    /**
     * Called when Plugin is destroyed.
     */
    public void onDestroy() {
        this.shutdown();
    }
}
