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

import java.io.IOException;

import javax.microedition.media.Control;
import javax.microedition.media.Manager;
import javax.microedition.media.MediaException;
import javax.microedition.media.Player;
import javax.microedition.media.control.ToneControl;
import javax.microedition.media.control.VolumeControl;

import org.apache.cordova.CordovaExtension;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.json4j.JSONArray;
import org.apache.cordova.json4j.JSONException;
import org.apache.cordova.util.Logger;

import net.rim.device.api.media.control.AudioPathControl;
import net.rim.device.api.notification.NotificationsManager;
import net.rim.device.api.system.Alert;

/**
 * Beep Action plays a device tone.
 */
public class BeepAction {

    private static final int BEEP_VOLUME = 100;
    private static final byte NOTE = 76;                // E5
    private static final byte D = 16;                   // quarter note
    private static final byte tempo = 30;               // 120 bpm

    private static final byte[] TONE_SEQUENCE_START = {
            ToneControl.VERSION, 1,
            ToneControl.TEMPO, tempo
    };

    private static final byte[] TONE = {
        NOTE,D, ToneControl.SILENCE,D/2
	};

    /**
     * Beeps the device for a given number of times.  By default, it will beep
     * once.  If the user explicitly sets the beep count to zero, it will play
     * the applications notification profile.  The application profile playback
     * sequence is controlled by the user.
     *
     * @param args JSONArray formatted as [ count ]
     *             count: specifies the number of times to beep the device (default: 1).
     * @return A CommandResult object with the success or failure
     *         state for beeping the device.
     */
    public static PluginResult execute(JSONArray args) {
        PluginResult result = null;

        if (Alert.isAudioSupported()) {

            try {
                int repeatCount = 1;
                if (args.length() > 0 && !args.isNull(0)) {
                    repeatCount = args.getInt(0);
                }

                // play tone n times
                if (repeatCount > 0) {
                    playTone(repeatCount);
                }
                // FIXME: unsupported on other platforms
                // send notification event to application profile
                else {
                    NotificationsManager.triggerImmediateEvent(
                            CordovaExtension.getAppID(), 0, null, null);
                }
            }
            catch (JSONException e) {
                Logger.log(BeepAction.class.getName() + ": " + e);
                result = new PluginResult(PluginResult.Status.JSON_EXCEPTION, e.getMessage());
            }
            catch (Exception e) {
                Logger.log(BeepAction.class.getName() + ": " + e);
                result = new PluginResult(PluginResult.Status.IO_EXCEPTION, e.getMessage());
            }

            result = new PluginResult(PluginResult.Status.OK);
        }
        else {
            result = new PluginResult(PluginResult.Status.ILLEGAL_ACCESS_EXCEPTION, "Audio not supported");
        }

        return result;
    }

    /**
     * Plays a tone the specified number of times on the device audio system.
     * @param repeatCount number of times to play tone
     */
    private static void playTone(int repeatCount) throws MediaException, IOException {

        // get tone player
        Player p = Manager.createPlayer(Manager.TONE_DEVICE_LOCATOR);
        p.realize();

        // set tone sequence
        ToneControl tc = (ToneControl)p.getControl("ToneControl");
        tc.setSequence(getToneSequence(repeatCount));

        // crank up the volume
        VolumeControl vc = (VolumeControl)p.getControl("VolumeControl");
        vc.setLevel(BEEP_VOLUME);

        // route audio to speaker phone
        p.prefetch();
        Control[] c = p.getControls();
        for(int i=c.length-1; i>=0; --i) {
            if(c[i] instanceof AudioPathControl) {
                AudioPathControl apc = (AudioPathControl)c[i];
                apc.setAudioPath(AudioPathControl.AUDIO_PATH_HANDSFREE);
                break;
            }
        }

        // play
        p.start();
    }

    /**
     * Creates a tone sequence to play.
     * @param repeatCount number of times to play tone
     * @return tone sequence
     */
    private static byte[] getToneSequence(int repeatCount) {
        // we have to build the sequence dynamically because
        // ToneControl.REPEAT, repeatCount, TONE, DURATION
        // doesn't seem to work
        byte[] sequence = new byte[TONE_SEQUENCE_START.length + TONE.length * repeatCount];
        System.arraycopy(TONE_SEQUENCE_START, 0, sequence, 0, TONE_SEQUENCE_START.length);
        for (int i = 0; i < repeatCount; i++) {
            System.arraycopy(TONE, 0, sequence, (TONE_SEQUENCE_START.length+TONE.length*i), TONE.length);
        }

        return sequence;
    }
}
