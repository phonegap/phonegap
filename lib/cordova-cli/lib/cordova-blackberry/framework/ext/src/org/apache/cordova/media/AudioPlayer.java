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

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.IOException;

import javax.microedition.io.Connector;
import javax.microedition.io.file.FileConnection;
import javax.microedition.media.Manager;
import javax.microedition.media.MediaException;
import javax.microedition.media.Player;
import javax.microedition.media.PlayerListener;
import javax.microedition.media.control.RecordControl;
import javax.microedition.media.control.VolumeControl;
import javax.microedition.media.protocol.DataSource;

import net.rim.device.api.media.protocol.ByteArrayInputStreamDataSource;

import org.apache.cordova.util.FileUtils;
import org.apache.cordova.util.Logger;

/**
 * This class implements the audio playback and recording capabilities used by
 * Cordova. It is called by the Media Cordova class. Only one file can be played
 * or recorded per class instance.
 *
 * Supports playing audio locally and remotely. Files located within the
 * application package must be prefixed with "local:///". If no URI prefix
 * (file, http, local) is found, file is assumed to be on device and "file:///"
 * prefix added.
 */
public class AudioPlayer implements PlayerListener {

    private static final String LOG_TAG = "AudioPlayer: ";

    // Media states
    public static final int MEDIA_NONE = 0;
    public static final int MEDIA_STARTING = 1;
    public static final int MEDIA_RUNNING = 2;
    public static final int MEDIA_PAUSED = 3;
    public static final int MEDIA_STOPPED = 4;

    // Media message ids
    private static final int MEDIA_STATE = 1;
    private static final int MEDIA_DURATION = 2;
    private static final int MEDIA_POSITION = 3;
    private static final int MEDIA_ERROR = 9;

    // Media error codes
    private static final int MEDIA_ERR_NONE_ACTIVE = 0;
    private static final int MEDIA_ERR_ABORTED = 1;
    private static final int MEDIA_ERR_NETWORK = 2;
    private static final int MEDIA_ERR_DECODE = 3;
    private static final int MEDIA_ERR_NONE_SUPPORTED = 4;

    private final Media handler;
    private final String id;
    private int state = MEDIA_NONE; // State of recording or playback
    private String audioFile = null; // File name to play or record to
    private float duration = -1; // Duration of audio

    private Player recorder = null; // Audio recording object
    private RecordControl recorderControl = null;
    private ByteArrayOutputStream recorderOutput = null;

    private Player player = null; // Audio player object
    private boolean prepareOnly = false;

    private long prevPos = 0;
    private long adjustTime = 0;
    private long previousTime = 0;

    private long lastPlay = System.currentTimeMillis();

    private boolean buffering = false;

    /**
     * Constructor.
     *
     * @param handler
     *            The audio handler object
     * @param id
     *            The id of this audio player
     */
    public AudioPlayer(Media handler, String id) {
        this.handler = handler;
        this.id = id;
    }

    /**
     * Destroy stop audio playing or recording and free resources.
     */
    public synchronized void destroy() {
        // Stop any play or record
        destroyPlayer();
        if (recorder != null) {
            stopRecording();
        }
    }

    /**
     * Stop and free the player.
     */
    private void destroyPlayer() {
        if (player != null) {
            if (state == MEDIA_RUNNING || state == MEDIA_PAUSED) {
                stopPlaying();
            }
            player.removePlayerListener(this);
            player.close();
            player = null;
        }
    }

    /**
     * Get current position of playback.
     *
     * @return position as a floating point number indicating number of seconds
     *         or -1 if not playing
     */
    public synchronized float getCurrentPosition() {
        // Current position is only valid when running, paused or buffering.
        if (state == MEDIA_RUNNING || state == MEDIA_PAUSED || buffering) {
            // The time returned by getMediaTime() is only updated every second.
            // Keep track of time between updates in order to provide
            // millisecond granularity.
            long curPos = player.getMediaTime();

            // Media time is within the 1 second granularity window so add time
            // since last update.
            if (curPos == prevPos && state == MEDIA_RUNNING) {
                if (previousTime == 0) {
                    previousTime = System.currentTimeMillis();
                } else {
                    long newTime = System.currentTimeMillis();
                    // Convert from milliseconds to microseconds.
                    adjustTime += ((newTime - previousTime) * 1000);
                    previousTime = newTime;
                    curPos += adjustTime;
                }
            } else {
                prevPos = curPos;
                previousTime = System.currentTimeMillis();
                adjustTime = 0;
            }

            // Convert from microseconds to floating point seconds.
            float time = curPos / 1000000.0f;
            sendStatus(MEDIA_POSITION, time);
            return time;
        } else {
            return -1;
        }
    }

    /**
     * Get the duration of the audio file.
     *
     * @param file
     *            The name of the audio file.
     * @return duration as a floating point number indicating number of seconds
     *         or -1 = can't be determined or -2 = not allowed
     */
    public synchronized float getDuration(String file) {
        // Can't get duration of recording
        if (recorder != null) {
            return (-2); // not allowed
        }

        // If audio file already loaded and started, then return duration
        if (player != null) {
            return duration;
        }

        // If no player yet, then create one
        else {
            prepareOnly = true;
            startPlaying(file);
            // This will only return value for local, since streaming
            // file hasn't been read yet.
            return duration;
        }
    }

    /**
     * Get the audio state.
     *
     * @return int
     */
    public synchronized int getState() {
        return state;
    }

    /**
     * Pause playing.
     */
    public synchronized void pausePlaying() {
        // If playing, then pause
        if (state == MEDIA_RUNNING) {
            try {
                player.stop();
                setState(MEDIA_PAUSED);
            } catch (MediaException e) {
                Logger.log(LOG_TAG + "pausePlaying() Error: " + e.getMessage());
                sendError(MEDIA_ERR_ABORTED);
            }
        } else {
            Logger.log(LOG_TAG
                    + "pausePlaying() Error: called during invalid state: "
                    + state);
            sendError(MEDIA_ERR_NONE_ACTIVE);
        }
    }

    /**
     * PlayerListener interface callback when an event occurs in the player.
     *
     * @see javax.microedition.media.PlayerListener#playerUpdate(javax.microedition.media.Player,
     *      java.lang.String, java.lang.Object)
     */
    public void playerUpdate(Player player, String event, Object eventData) {
        if (BUFFERING_STARTED.equals(event)) {
            buffering = true;
        } else if (BUFFERING_STOPPED.equals(event)) {
            buffering = false;
            setState(MEDIA_RUNNING);
        } else if (DURATION_UPDATED.equals(event)) {
            if (eventData != null && eventData instanceof Long) {
                // Convert duration from microseconds to seconds.
                duration = ((Long) eventData).longValue() / 1000000.0f;
                sendStatus(MEDIA_DURATION, duration);
            }
        } else if (END_OF_MEDIA.equals(event)) {
            // Update the final position before stopping the player.
            if (eventData != null && eventData instanceof Long) {
                sendStatus(MEDIA_POSITION,
                        ((Long) eventData).longValue() / 1000000.0f);
            }
            stopPlaying();
        } else if (ERROR.equals(event)) {
            // Send error notification to JavaScript
            if (eventData != null && eventData instanceof String) {
                try {
                    int code = Integer.parseInt((String) eventData);
                    sendError(code);
                } catch (NumberFormatException ne) {
                    Logger.log(LOG_TAG + "playerUpdate(): Player id(" + id + ") received error: "
                            + eventData);
                }
            } else {
                Logger.log(LOG_TAG + "playerUpdate(): Player id(" + id + ") received error: " + eventData);
            }
            destroy();
        }
    }

    /**
     * Seek or jump to a new time in the track.
     *
     * @throws MediaException
     */
    public synchronized void seekToPlaying(int milliseconds) {
        if (player != null) {
            try {
                // Convert milliseconds to microseconds.
                player.setMediaTime(milliseconds > 0 ? milliseconds * 1000
                        : milliseconds);
                sendStatus(MEDIA_POSITION, milliseconds / 1000.0f);
            } catch (MediaException e) {
                Logger.log(LOG_TAG + "seekToPlaying() Error: " + e.getMessage());
                sendError(MEDIA_ERR_ABORTED);
            }
        }
    }

    /**
     * Set the volume for audio player
     *
     * @param volume
     *            volume level 0.0-1.0
     */
    public synchronized void setVolume(float volume) {
        if (player != null) {
            if (player.getState() >= Player.REALIZED) {
                VolumeControl vc = (VolumeControl) player
                        .getControl("VolumeControl");
                // Native volume level range is 0-100
                vc.setLevel((int) (volume * 100));
            }
        }
    }

    /**
     * Start or resume playing audio file.
     *
     * @param file
     *            The name of the audio file.
     */
    public synchronized void startPlaying(String file) {
        try {
            if (recorder != null) {
                Logger.log(LOG_TAG
                        + "startPlaying() Error: Can't play in record mode.");
                sendError(MEDIA_ERR_ABORTED);
            }

            // If this is a new request to play audio, or stopped
            else if (player == null || state == MEDIA_STOPPED) {
                setState(MEDIA_STARTING);

                if (file == null || file.length() == 0) {
                    Logger.log(LOG_TAG
                            + "startPlaying(): Input file not specified.");
                    sendError(MEDIA_ERR_ABORTED);
                    setState(MEDIA_NONE);
                    destroy();
                    return;
                }

                // If the player was previously used, need to check if it needs
                // recreated to pick up file changes. Cases when the player
                // needs recreated:
                //     1. New source file was specified.
                //     2. File is local and has been modified since last play.
                if (player != null) {
                    if (!file.equals(audioFile)) {
                        destroyPlayer();
                    } else if (!isStreaming(file)) {
                        // File needs to follow the local or file URI protocol
                        // so if neither prefix exists assume a file URI and add
                        // the "file:///" prefix.
                        file = FileUtils.prefixFileURI(file);
                        FileConnection fconn = null;
                        try {
                            fconn = (FileConnection) Connector.open(file,
                                    Connector.READ);
                            if (fconn.exists()) {
                                if (fconn.lastModified() > lastPlay) {
                                    destroyPlayer();
                                }
                            }
                        } catch (Exception e) {
                            // Ignore
                        } finally {
                            try {
                                if (fconn != null) {
                                    fconn.close();
                                }
                            } catch (IOException ignored) {
                            }
                        }
                    }
                }

                // At this point if player is not null then the file previously
                // played is still valid so just reset the current position.
                if (player != null) {
                    player.setMediaTime(0);
                }
                // Otherwise, create a new one
                else {
                    // If streaming file
                    if (isStreaming(file)) {
                        player = Manager.createPlayer(file);
                    } else {
                        // File needs to follow the local or file URI protocol
                        // so if neither prefix exists assume a file URI and add
                        // the "file:///" prefix.
                        file = FileUtils.prefixFileURI(file);

                        String contentType = "audio/mp3";
                        if (file.endsWith(".amr")) {
                            contentType = "audio/amr";
                        } else if (file.endsWith(".wav")) {
                            contentType = "audio/wav";
                        }

                        DataSource dataSource = new ByteArrayInputStreamDataSource(
                                new ByteArrayInputStream(FileUtils.readFile(
                                        file, Connector.READ)), contentType);
                        player = Manager.createPlayer(dataSource);
                    }
                    audioFile = file;
                    player.addPlayerListener(this);
                }

                lastPlay = System.currentTimeMillis();
                player.realize();
                player.prefetch();

                // Get duration as floating point seconds.
                duration = player.getDuration() == Player.TIME_UNKNOWN ? Player.TIME_UNKNOWN
                        : player.getDuration() / 1000000.0f;

                sendStatus(MEDIA_DURATION, duration);

                if (!prepareOnly) {
                    player.start();
                }
                prepareOnly = false;
            }

            // If previously existing player is still valid.
            else {
                // If player has been paused, then resume playback
                if (state == MEDIA_PAUSED || state == MEDIA_STARTING) {
                    player.start();
                    setState(MEDIA_RUNNING);
                } else {
                    Logger.log(LOG_TAG
                            + "Error: startPlaying() called during invalid state: "
                            + state);
                    sendError(MEDIA_ERR_ABORTED);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            Logger.log(LOG_TAG + "startPlaying() Error: " + e.getMessage());
            sendError(MEDIA_ERR_ABORTED);
        }
    }

    /**
     * Start recording the specified file.
     *
     * @param file
     *            The name of the file
     */
    public synchronized void startRecording(String file) {
        try {
            if (player != null) {
                Logger.log(LOG_TAG
                        + "startRecording() Error: Can't record in play mode.");
                sendError(MEDIA_ERR_ABORTED);
            } else if (recorder == null) {

                if (file == null || file.length() == 0) {
                    Logger.log(LOG_TAG
                            + "startRecording() Error: Output file not specified.");
                    sendError(MEDIA_ERR_ABORTED);
                    return;
                }
                setState(MEDIA_STARTING);
                file = FileUtils.prefixFileURI(file);

                recorder = Manager.createPlayer("capture://audio");
                recorder.addPlayerListener(this);
                recorder.realize();
                recorderControl = (RecordControl) recorder
                        .getControl("RecordControl");
                recorderOutput = new ByteArrayOutputStream();
                recorderControl.setRecordStream(recorderOutput);
                recorderControl.startRecord();
                recorder.start();
                audioFile = file;
                setState(MEDIA_RUNNING);

            } else {
                Logger.log(LOG_TAG
                        + "startRecording() Error: Already recording.");
                sendError(MEDIA_ERR_ABORTED);
            }
        } catch (Exception e) {
            Logger.log(LOG_TAG
                    + "startRecording() Error: Failed to start recording. "
                    + e.getMessage());
            if (recorder != null) {
                recorder.removePlayerListener(this);
                recorder.close();
                recorder = null;
            }
            if (recorderControl != null) {
                try {
                    recorderControl.reset();
                } catch (IOException e1) {
                    // Ignore
                }
                recorderControl = null;
            }
            if (recorderOutput != null) {
                try {
                    recorderOutput.close();
                } catch (IOException e1) {
                    // Ignore
                }
                recorderOutput = null;
            }

            setState(MEDIA_NONE);
        }
    }

    /**
     * Stop playing the audio file.
     */
    public synchronized void stopPlaying() {
        if (state == MEDIA_RUNNING || state == MEDIA_PAUSED) {
            try {
                player.stop();
                player.setMediaTime(0);
            } catch (MediaException e) {
                Logger.log(LOG_TAG + "stopPlaying() Error: " + e.getMessage());
                sendError(MEDIA_ERR_ABORTED);
            }
            setState(MEDIA_STOPPED);
        } else {
            Logger.log(LOG_TAG + "stopPlaying() called during invalid state: "
                    + state);
            sendError(MEDIA_ERR_NONE_ACTIVE);
        }
    }

    /**
     * Stop recording and save to the file specified when recording started.
     */
    public synchronized void stopRecording() {
        DataOutputStream output = null;
        FileConnection conn = null;

        try {
            if (recorder != null) {
                if (state == MEDIA_RUNNING) {
                    recorderControl.commit();
                    byte data[] = recorderOutput.toByteArray();

                    conn = (FileConnection) Connector.open(audioFile,
                            Connector.READ_WRITE);
                    if (conn.exists()) {
                        conn.delete();
                        conn.close();
                        conn = (FileConnection) Connector.open(audioFile,
                                Connector.READ_WRITE);
                    }
                    conn.create();
                    output = conn.openDataOutputStream();
                    output.write(data);
                    output.flush();
                }
            }
        } catch (IOException e) {
            // Ignore
            Logger.log(LOG_TAG + "stopRecording() Error: " + e.getMessage());
        } finally {
            if (recorderOutput != null) {
                try {
                    recorderOutput.close();
                } catch (IOException e) {
                    // Ignore
                    Logger.log(LOG_TAG
                            + "stopRecording() Failed to close recorder output. "
                            + e.getMessage());
                }
                recorderOutput = null;
            }
            if (recorder != null) {
                recorder.removePlayerListener(this);
                recorder.close();
                recorder = null;
            }

            if (recorderControl != null) {
                recorderControl.stopRecord();
                recorderControl = null;
            }

            if (output != null) {
                try {
                    output.close();
                } catch (IOException e) {
                    // Ignore
                    Logger.log(LOG_TAG
                            + "stopRecording() Failed to close output file. "
                            + e.getMessage());
                }
                output = null;
            }

            if (conn != null) {
                try {
                    conn.close();
                } catch (IOException e) {
                    // Ignore
                    Logger.log(LOG_TAG
                            + "stopRecording() Failed to close connection. "
                            + e.getMessage());
                }
            }
            setState(MEDIA_STOPPED);
        }
    }

    /**
     * Determine if playback file is streaming or local. It is streaming if file
     * name starts with "http://"
     *
     * @param file
     *            The file name
     * @return T=streaming, F=local
     */
    private boolean isStreaming(String file) {
        if (file.startsWith("http://") || file.startsWith("https://")) {
            return true;
        }
        return false;
    }

    private void sendError(int code) {
        handler.invokeScript("cordova.require('cordova/plugin/Media').onStatus('"
                + id + "', " + MEDIA_ERROR + ", { \"code\":" + code + "});");
    }

    private void sendStatus(int msg, float value) {
        handler.invokeScript("cordova.require('cordova/plugin/Media').onStatus('"
                + id + "', " + msg + ", " + value + ");");
    }

    private void sendStatus(int msg, int value) {
        handler.invokeScript("cordova.require('cordova/plugin/Media').onStatus('"
                + id + "', " + msg + ", " + value + ");");
    }

    /**
     * Set the state and send it to JavaScript.
     *
     * @param state
     */
    private synchronized void setState(int state) {
        // Only send state back to JavaScript if it has changed.
        if (this.state != state) {
            sendStatus(MEDIA_STATE, state);
        }

        this.state = state;
    }
}