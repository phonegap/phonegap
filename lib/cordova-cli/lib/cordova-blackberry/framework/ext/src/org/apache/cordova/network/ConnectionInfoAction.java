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

import java.util.Enumeration;
import java.util.Hashtable;

import org.apache.cordova.CordovaExtension;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.util.Logger;

import net.rim.device.api.system.Application;
import net.rim.device.api.system.CoverageInfo;
import net.rim.device.api.system.CoverageStatusListener;
import net.rim.device.api.system.RadioInfo;
import net.rim.device.api.system.RadioStatusListener;
import net.rim.device.api.system.WLANConnectionListener;
import net.rim.device.api.system.WLANInfo;

/**
 * Determines the current network data connection type and listens for changes
 * to network coverage. This class is intended for use through the Network
 * plug-in.
 */
public class ConnectionInfoAction {
    // Return types
    private static final String TYPE_UNKNOWN = "unknown";
    private static final String TYPE_ETHERNET = "ethernet";
    private static final String TYPE_WIFI = "wifi";
    private static final String TYPE_2G = "2g";
    private static final String TYPE_3G = "3g";
    private static final String TYPE_4G = "4g";
    private static final String TYPE_NONE = "none";

    // Network status event values
    private static final String OFFLINE = "offline";
    private static final String ONLINE = "online";

    // Network service support constants
    private static final int DATA = RadioInfo.NETWORK_SERVICE_DATA;
    private static final int TWO_G = RadioInfo.NETWORK_SERVICE_DATA
            | RadioInfo.NETWORK_SERVICE_EDGE;
    private static final int THREE_G = RadioInfo.NETWORK_SERVICE_EVDO_REV0
            | RadioInfo.NETWORK_SERVICE_EVDO_REV0_ONLY
            | RadioInfo.NETWORK_SERVICE_EVDO_REVA
            | RadioInfo.NETWORK_SERVICE_EVDO_REVA_ONLY
            | RadioInfo.NETWORK_SERVICE_UMTS;

    // Listeners used to detect network changes
    private RadioStatusListener radioListener = null;
    private WLANConnectionListener wlanListener = null;
    private CoverageStatusListener coverageListener = null;

    // Variable indicating whether the user has disabled mobile data
    private Boolean dataDisabled = Boolean.FALSE;

    // The set of call back IDs to send results to. Using Hashtable because
    // BlackBerry does not support Collections. There should only ever be one
    // call back ID, but this allows multiple.
    private Hashtable callbackIds = new Hashtable();

    private String prevType = TYPE_NONE;
    private String prevEvent = OFFLINE;

    /**
     * Determines the current network data connection type. Listeners are
     * registered to return additional results when network state changes.
     *
     * @param callbackId
     *            The success call back ID to receive network type results.
     * @return A PluginResult object with the success or failure result of the
     *         operation. A success result includes information about the
     *         currently active network type.
     */
    protected PluginResult getConnectionInfo(String callbackId) {

        // Ensure that the dataDisabled variable is initialized.
        setDataDisabled(CoverageInfo.getCoverageStatus(), false);

        // Add the network change listeners if they have not been added.
        addListeners(callbackId);

        // Retrieve the current active connection type and build the return
        // result.
        PluginResult result = new PluginResult(PluginResult.Status.OK,
                getConnectionType(true, true));

        // Need to keep the call back since listeners have been registered to
        // fire events on the specified call back ID.
        result.setKeepCallback(true);

        return result;
    }

    /**
     * Removes all coverage listeners and clears the list of call back IDs. This
     * method should be invoked when the Network plug-in's onDestroy is called.
     */
    protected synchronized void shutdown() {
        if (radioListener != null) {
            Application.getApplication().removeRadioListener(radioListener);
            radioListener = null;
        }

        if (wlanListener != null) {
            WLANInfo.removeListener(wlanListener);
            wlanListener = null;
        }

        if (coverageListener != null) {
            CoverageInfo.removeListener(coverageListener);
            coverageListener = null;
        }

        callbackIds.clear();
    }

    /**
     * Adds a RadioStatusListener, WLANConnectionListener and
     * CoverageStatusListener to listen for various network change events. The
     * listeners are only registered if they have not already been added. Each
     * listener is used to detect different types of network change events.
     *
     * RadioStatusListener - Detects changes in cellular data coverage.
     * WLANConnectionListener - Detects changes in wifi coverage.
     * CoverageStatusListener - Used to detect changes in the mobile data config
     *
     * @param callbackId
     *            The reference point to call back when a listener event occurs.
     */
    private synchronized void addListeners(String callbackId) {
        callbackIds.put(callbackId, callbackId);

        if (radioListener == null) {
            radioListener = new RadioStatusListener() {
                public void baseStationChange() {}
                public void networkScanComplete(boolean success) {}

                public void networkServiceChange(int networkId, int service) {
                    // Cellular data change detected. If the user hasn't
                    // disabled mobile data and wifi is not currently in use
                    // return a result indicating the cellular data coverage
                    // change.
                    if (dataDisabled == Boolean.FALSE
                            && WLANInfo.getWLANState() != WLANInfo.WLAN_STATE_CONNECTED) {
                        if ((service & DATA) == 0) {
                            sendResult(TYPE_NONE, OFFLINE);
                        } else {
                            // In the case where cell data and wifi was turned
                            // off and then the user disabled mobile data
                            // configuration, the mobile data config disablement
                            // by the user isn't detected by the coverage status
                            // listener so dataDisabled may not be accurate.
                            // When service data is activated, have to make sure
                            // that dataDisabled is properly set.
                            setDataDisabled(CoverageInfo.getCoverageStatus(),
                                    false);
                            if (dataDisabled == Boolean.FALSE) {
                                sendResult(getConnectionType(false, true),
                                        ONLINE);
                            }
                        }
                    }
                }

                public void networkStarted(int networkId, int service) {}
                public void networkStateChange(int state) {}
                public void pdpStateChange(int apn, int state, int cause) {}
                public void radioTurnedOff() {}
                public void signalLevel(int level) {}
            };
            Application.getApplication().addRadioListener(radioListener);
        }

        if (wlanListener == null) {
            wlanListener = new WLANConnectionListener() {
                public void networkConnected() {
                    if (dataDisabled == Boolean.FALSE) {
                        sendResult(TYPE_WIFI, ONLINE);
                    }
                }

                public void networkDisconnected(int reason) {
                    // Wifi was disconnected, if the user hasn't disabled mobile
                    // data, check if cellular data coverage exists.
                    if (dataDisabled == Boolean.FALSE) {
                        String type = getConnectionType(false, true);
                        String event = OFFLINE;
                        if (!TYPE_NONE.equals(type)) {
                            event = ONLINE;
                        }
                        sendResult(type, event);
                    }
                }
            };
            WLANInfo.addListener(wlanListener);
        }

        if (coverageListener == null) {
            coverageListener = new CoverageStatusListener() {
                public void coverageStatusChanged(int newCoverage) {
                    // When coverage changes, check to determine if it is due
                    // to the user disabling mobile data through configuration
                    // flag.
                    setDataDisabled(newCoverage, true);
                }
            };
            CoverageInfo.addListener(coverageListener);
        }
    }

    /**
     * Determine the type of connection currently being used for data
     * transmission on the device. If the user has disabled mobile data then
     * TYPE_NONE is returned regardless of cellular or wifi radio state as this
     * is the way the browser behaves. Otherwise, wifi and/or cellular radios
     * are queried for state based on the passed in parameters.
     *
     * @param checkWLAN
     *            Determines whether wifi radio state is queried or not.
     * @param checkCell
     *            Determines whether cellular radio state is queried or not.
     * @return A string indicating one of the defined network connections types.
     */
    private String getConnectionType(boolean checkWLAN, boolean checkCell) {
        String networkType = TYPE_NONE;

        if (dataDisabled == Boolean.FALSE) {
            // Detect if wifi is active and connected. If wifi is active it
            // takes precedence over cellular data transmission.
            if (checkWLAN
                    && WLANInfo.getWLANState() == WLANInfo.WLAN_STATE_CONNECTED) {
                networkType = TYPE_WIFI;
            }

            if (checkCell && TYPE_NONE.equals(networkType)
                    && RadioInfo.isDataServiceOperational()) {

                int activeServices = RadioInfo.getNetworkService();
                networkType = TYPE_UNKNOWN;
                if ((activeServices & THREE_G) != 0) {
                    networkType = TYPE_3G;
                } else if ((activeServices & TWO_G) != 0) {
                    networkType = TYPE_2G;
                }
            }
        }

        return networkType;
    }

    /**
     * Helper function to build and send the PluginResult to the saved call back
     * IDs.
     *
     * @param type
     *            The network connection type. This value should be null if the
     *            specified event is "offline".
     * @param event
     *            The network event.
     */
    private void sendResult(String type, String event) {

        // Only send the event if it is different then the last sent event.
        synchronized (prevType) {
            if (prevType != null && prevEvent != null && prevType.equals(type)
                    && prevEvent.equals(event)) {
                return;
            } else {
                prevType = type;
                prevEvent = event;
            }
        }

        PluginResult result = new PluginResult(PluginResult.Status.OK,
                type);

        // Must keep the call back active for future events.
        result.setKeepCallback(true);

        // Iterate through the saved call back IDs. Really should only ever be
        // one.
        for (Enumeration callbacks = this.callbackIds.elements(); callbacks
                .hasMoreElements();) {
            String callbackId = (String) callbacks.nextElement();
            CordovaExtension.invokeSuccessCallback(callbackId, result);
        }

    }

    /**
     * Determines if the user has disabled mobile data through the user level
     * configuration panels and optionally returns an "online" or "offline"
     * result.
     *
     * @param newCoverage
     *            A bit mask of CoverageInfo.COVERAGE_* flags indicating the
     *            current coverage.
     * @param returnResult
     *            If true, return a result based on the value of the mobile data
     *            configuration.
     */
    private void setDataDisabled(int newCoverage, boolean returnResult) {

        boolean isRadioData = (RadioInfo.getNetworkService() & DATA) != 0;
        boolean wlanConnected = WLANInfo.getWLANState() == WLANInfo.WLAN_STATE_CONNECTED;
        boolean eventDetected = false;
        String event = OFFLINE;

        // Note: To detect that mobile data has been disabled through
        // configuration, determine if the current coverage is
        // CoverageInfo.COVERAGE_NONE AND that either cellular or wifi radios
        // are currently connected. This is because the low level radio routines
        // will return a connected state even when mobile data is disabled
        // through configuration.
        synchronized (dataDisabled) {
            if (newCoverage == CoverageInfo.COVERAGE_NONE
                    && (isRadioData || wlanConnected)) {
                if (dataDisabled == Boolean.FALSE) {
                    Logger.log("Mobile data was disabled by the user through configuration.");
                    dataDisabled = Boolean.TRUE;
                    eventDetected = true;
                }
            } else if (dataDisabled == Boolean.TRUE) {
                Logger.log("Mobile data was enabled by the user.");
                dataDisabled = Boolean.FALSE;
                event = ONLINE;
                eventDetected = true;
            }
        }

        if (returnResult && eventDetected) {
            // The user has enabled/disabled mobile data. Return a result
            // indicating the current network state.
            String type = getConnectionType(true, true);
            sendResult(type, event);
        }
    }
}
