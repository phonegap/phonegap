/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/
package org.apache.cordova;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;

import org.apache.cordova.api.CallbackContext;

import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.util.Log;

public class CordovaLocationListener implements LocationListener {
    public static int PERMISSION_DENIED = 1;
    public static int POSITION_UNAVAILABLE = 2;
    public static int TIMEOUT = 3;

    protected LocationManager locationManager;
    private GeoBroker owner;
    protected boolean running = false;

    public HashMap<String, CallbackContext> watches = new HashMap<String, CallbackContext>();
    private List<CallbackContext> callbacks = new ArrayList<CallbackContext>();

    private String TAG = "[Cordova Location Listener]";

    public CordovaLocationListener(LocationManager manager, GeoBroker broker, String tag) {
        this.locationManager = manager;
        this.owner = broker;
        this.TAG = tag;
    }

    protected void fail(int code, String message) {
        for (CallbackContext callbackContext: this.callbacks)
        {
            this.owner.fail(code, message, callbackContext);
        }
        if(this.owner.isGlobalListener(this))
        {
        	Log.d(TAG, "Stopping global listener");
        	this.stop();
        }
        this.callbacks.clear();

        Iterator<CallbackContext> it = this.watches.values().iterator();
        while (it.hasNext()) {
            this.owner.fail(code, message, it.next());
        }
    }

    private void win(Location loc) {
        for (CallbackContext callbackContext: this.callbacks)
        {
            this.owner.win(loc, callbackContext);
        }
        if(this.owner.isGlobalListener(this))
        {
        	Log.d(TAG, "Stopping global listener");
        	this.stop();
        }
        this.callbacks.clear();

        Iterator<CallbackContext> it = this.watches.values().iterator();
        while (it.hasNext()) {
            this.owner.win(loc, it.next());
        }
    }

    /**
     * Location Listener Methods
     */

    /**
     * Called when the provider is disabled by the user.
     *
     * @param provider
     */
    public void onProviderDisabled(String provider) {
        Log.d(TAG, "Location provider '" + provider + "' disabled.");
        this.fail(POSITION_UNAVAILABLE, "GPS provider disabled.");
    }

    /**
     * Called when the provider is enabled by the user.
     *
     * @param provider
     */
    public void onProviderEnabled(String provider) {
        Log.d(TAG, "Location provider "+ provider + " has been enabled");
    }

    /**
     * Called when the provider status changes. This method is called when a
     * provider is unable to fetch a location or if the provider has recently
     * become available after a period of unavailability.
     *
     * @param provider
     * @param status
     * @param extras
     */
    public void onStatusChanged(String provider, int status, Bundle extras) {
        Log.d(TAG, "The status of the provider " + provider + " has changed");
        if (status == 0) {
            Log.d(TAG, provider + " is OUT OF SERVICE");
            this.fail(CordovaLocationListener.POSITION_UNAVAILABLE, "Provider " + provider + " is out of service.");
        }
        else if (status == 1) {
            Log.d(TAG, provider + " is TEMPORARILY_UNAVAILABLE");
        }
        else {
            Log.d(TAG, provider + " is AVAILABLE");
        }
    }

    /**
     * Called when the location has changed.
     *
     * @param location
     */
    public void onLocationChanged(Location location) {
        Log.d(TAG, "The location has been updated!");
        this.win(location);
    }

    // PUBLIC

    public int size() {
        return this.watches.size() + this.callbacks.size();
    }

    public void addWatch(String timerId, CallbackContext callbackContext) {
        this.watches.put(timerId, callbackContext);
        if (this.size() == 1) {
            this.start();
        }
    }
    public void addCallback(CallbackContext callbackContext) {
        this.callbacks.add(callbackContext);
        if (this.size() == 1) {
            this.start();
        }
    }
    public void clearWatch(String timerId) {
        if (this.watches.containsKey(timerId)) {
            this.watches.remove(timerId);
        }
        if (this.size() == 0) {
            this.stop();
        }
    }

    /**
     * Destroy listener.
     */
    public void destroy() {
        this.stop();
    }

    // LOCAL

    /**
     * Start requesting location updates.
     *
     * @param interval
     */
    protected void start() {
        if (!this.running) {
            if (this.locationManager.getProvider(LocationManager.NETWORK_PROVIDER) != null) {
                this.running = true;
                this.locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 60000, 10, this);
            } else {
                this.fail(CordovaLocationListener.POSITION_UNAVAILABLE, "Network provider is not available.");
            }
        }
    }

    /**
     * Stop receiving location updates.
     */
    private void stop() {
        if (this.running) {
            this.locationManager.removeUpdates(this);
            this.running = false;
        }
    }
}
