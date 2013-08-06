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
package org.apache.cordova.media;

import java.util.Enumeration;
import java.util.Hashtable;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.json4j.JSONArray;
import org.apache.cordova.json4j.JSONException;
import org.apache.cordova.util.Logger;

/**
 * This plugin provides the ability to play and record audio. The file can be
 * local or over a network using http.
 *
 * Audio formats supported (tested): .mp3, .wav, .amr
 *
 * Supports playing audio locally and remotely. Files located within the
 * application package must be prefixed with "local:///". If no URI prefix
 * (file, http, local) is found, file is assumed to be on device and "file:///"
 * prefix added.
 */
public class Media extends Plugin {

    private static final String LOG_TAG = "Media: ";
    private final Hashtable players = new Hashtable();

    // Cross-platform defined actions
    private static final String CREATE = "create";
    private static final String START_RECORDING = "startRecordingAudio";
    private static final String STOP_RECORDING = "stopRecordingAudio";
    private static final String START_PLAYING = "startPlayingAudio";
    private static final String STOP_PLAYING = "stopPlayingAudio";
    private static final String SEEK_TO = "seekToAudio";
    private static final String PAUSE_PLAYING = "pausePlayingAudio";
    private static final String SET_VOLUME = "setVolume";
    private static final String GET_POSITION = "getCurrentPositionAudio";
    private static final String GET_DURATION = "getDurationAudio";
    private static final String RELEASE = "release";

    /**
     * Executes the request and returns PluginResult.
     *
     * @param action
     *            The action to execute.
     * @param args
     *            JSONArry of arguments for the plugin.
     * @param callbackId
     *            The callback id used when calling back into JavaScript.
     * @return A PluginResult object with a status and message.
     */
    public PluginResult execute(String action, JSONArray args, String callbackId) {
        PluginResult.Status status = PluginResult.Status.NO_RESULT;

        try {
            if (CREATE.equals(action)) {
                createMedia(args.getString(0), args.getString(1));
                return new PluginResult(PluginResult.Status.OK, "");
            } else if (START_RECORDING.equals(action)) {
                startRecordingAudio(args.getString(0), args.getString(1));
            } else if (STOP_RECORDING.equals(action)) {
                stopRecordingAudio(args.getString(0));
            } else if (START_PLAYING.equals(action)) {
                startPlayingAudio(args.getString(0), args.getString(1));
            } else if (SEEK_TO.equals(action)) {
                seekToAudio(args.getString(0), args.getInt(1));
            } else if (PAUSE_PLAYING.equals(action)) {
                pausePlayingAudio(args.getString(0));
            } else if (STOP_PLAYING.equals(action)) {
                stopPlayingAudio(args.getString(0));
            } else if (SET_VOLUME.equals(action)) {
                try {
                    float level = Float.parseFloat(args.getString(1));
                    setVolume(args.getString(0), level);
                } catch (NumberFormatException nfe) {
                    Logger.log(LOG_TAG + "execute(): Failed to convert volume level: "
                            + args.getString(1) + " " + nfe.getMessage());
                    return new PluginResult(PluginResult.Status.JSON_EXCEPTION);
                }
            } else if (GET_POSITION.equals(action)) {
                float f = getCurrentPositionAudio(args.getString(0));
                return new PluginResult(PluginResult.Status.OK, f);
            } else if (GET_DURATION.equals(action)) {
                float f = getDurationAudio(args.getString(0), args.getString(1));
                return new PluginResult(PluginResult.Status.OK, f);
            } else if (RELEASE.equals(action)) {
                boolean b = release(args.getString(0));
                return new PluginResult(PluginResult.Status.OK, b);
            } else {
                Logger.log(LOG_TAG + "execute(): Invalid action: " + action);
                return new PluginResult(PluginResult.Status.INVALID_ACTION,
                        "Invalid action: " + action);
            }
            return new PluginResult(status, "");
        } catch (JSONException e) {
            Logger.log(LOG_TAG + "execute() Error: " + e.getMessage());
            return new PluginResult(PluginResult.Status.JSON_EXCEPTION);
        }
    }

    /**
     * Identifies if action to be executed returns a value and should be run
     * synchronously.
     *
     * @param action
     *            The action to execute
     * @return T=returns value
     */
    public boolean isSynch(String action) {
        if (CREATE.equals(action) || GET_POSITION.equals(action)
                || GET_DURATION.equals(action) || RELEASE.equals(action)) {
            return true;
        }
        return false;
    }

    /**
     * Stop all audio players and recorders.
     */
    public void onDestroy() {
        Enumeration keys = players.keys();
        while (keys.hasMoreElements()) {
            AudioPlayer audio = (AudioPlayer) players.get(keys.nextElement());
            if (audio != null) {
                audio.destroy();
            }
        }

        players.clear();
    }

    /**
     * Start or resume playing audio file.
     *
     * @param id
     *            The id of the audio player
     * @param file
     *            The name of the audio file.
     */
    private void createMedia(String id, String file) {
        AudioPlayer audio = (AudioPlayer) players.get(id);
        if (audio == null) {
            audio = new AudioPlayer(this, id);
            players.put(id, audio);
        }
    }

    /**
     * Get current position of playback.
     *
     * @param id
     *            The id of the audio player
     * @return position in msec
     */
    private float getCurrentPositionAudio(String id) {
        AudioPlayer audio = (AudioPlayer) players.get(id);
        if (audio != null) {
            return (audio.getCurrentPosition());
        }
        return -1;
    }

    /**
     * Get the duration of the audio file.
     *
     * @param id
     *            The id of the audio player
     * @param file
     *            The name of the audio file.
     * @return The duration in msec.
     */
    private float getDurationAudio(String id, String file) {
        // Get audio file
        AudioPlayer audio = (AudioPlayer) players.get(id);
        if (audio != null) {
            return (audio.getDuration(file));
        }

        // If not already open, then open the file
        audio = new AudioPlayer(this, id);
        players.put(id, audio);
        return (audio.getDuration(file));
    }

    /**
     * Pause playing.
     *
     * @param id
     *            The id of the audio player
     */
    private void pausePlayingAudio(String id) {
        AudioPlayer audio = (AudioPlayer) players.get(id);
        if (audio != null) {
            audio.pausePlaying();
        } else {
            Logger.log(LOG_TAG
                    + "pausePlayingAudio() Error: Unknown Audio Player " + id);
        }
    }

    /**
     * Release the audio player instance to save memory.
     *
     * @param id
     *            The id of the audio player
     */
    private boolean release(String id) {
        if (!players.containsKey(id)) {
            Logger.log(LOG_TAG + "release() Error: Unknown Audio Player " + id);
            return false;
        }

        AudioPlayer audio = (AudioPlayer) players.get(id);
        players.remove(id);
        audio.destroy();
        return true;
    }

    /**
     * Seek to a location.
     *
     * @param id
     *            The id of the audio player
     * @param miliseconds
     *            int: number of milliseconds to skip 1000 = 1 second
     */
    private void seekToAudio(String id, int milliseconds) {
        AudioPlayer audio = (AudioPlayer) players.get(id);
        if (audio != null) {
            audio.seekToPlaying(milliseconds);
        } else {
            Logger.log(LOG_TAG + "seekToAudio() Error: Unknown Audio Player "
                    + id);
        }
    }

    /**
     * Set the volume for an audio device
     *
     * @param id
     *            The id of the audio player
     * @param volume
     *            Volume to adjust to 0 - 1
     */
    private void setVolume(String id, float volume) {
        AudioPlayer audio = (AudioPlayer) players.get(id);
        if (audio != null) {
            audio.setVolume(volume);
        } else {
            Logger.log(LOG_TAG + "setVolume() Error: Unknown Audio Player "
                    + id);
        }
    }

    /**
     * Start or resume playing audio file.
     *
     * @param id
     *            The id of the audio player
     * @param file
     *            The name of the audio file.
     */
    private void startPlayingAudio(String id, String file) {
        AudioPlayer audio = (AudioPlayer) players.get(id);
        if (audio == null) {
            audio = new AudioPlayer(this, id);
            players.put(id, audio);
        }
        audio.startPlaying(file);
    }

    /**
     * Start recording and save the specified file.
     *
     * @param id
     *            The id of the audio player
     * @param file
     *            The name of the file
     */
    private void startRecordingAudio(String id, String file) {
        AudioPlayer audio = (AudioPlayer) players.get(id);
        if (audio == null) {
            audio = new AudioPlayer(this, id);
            players.put(id, audio);
        }

        int state = audio.getState();
        if (state == AudioPlayer.MEDIA_NONE
                || state == AudioPlayer.MEDIA_STOPPED) {
            audio.startRecording(file);
        }
    }

    /**
     * Stop playing the audio file.
     *
     * @param id
     *            The id of the audio player
     */
    private void stopPlayingAudio(String id) {
        AudioPlayer audio = (AudioPlayer) players.get(id);
        if (audio != null) {
            audio.stopPlaying();
        } else {
            Logger.log(LOG_TAG
                    + "stopPlayingAudio() Error: Unknown Audio Player " + id);
        }
    }

    /**
     * Stop recording and save to the file specified when recording started.
     *
     * @param id
     *            The id of the audio player
     */
    private void stopRecordingAudio(String id) {
        AudioPlayer audio = (AudioPlayer) players.get(id);
        if (audio != null) {
            audio.stopRecording();
            players.remove(id);
        } else {
            Logger.log(LOG_TAG
                    + "stopRecordingAudio() Error: Unknown Audio Player " + id);
        }
    }
}