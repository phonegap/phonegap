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
package org.apache.cordova.capture;

import java.util.Enumeration;
import java.util.Hashtable;
import java.util.Vector;

import javax.microedition.media.Manager;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.file.File;
import org.apache.cordova.json4j.JSONArray;
import org.apache.cordova.json4j.JSONException;
import org.apache.cordova.json4j.JSONObject;
import org.apache.cordova.util.Logger;
import org.apache.cordova.util.StringUtils;

/**
 * This plugin provides the ability to capture media from the native media
 * applications. The appropriate media application is launched, and a capture
 * operation is started in the background to identify captured media files and
 * return the file info back to the caller.
 */
public class MediaCapture extends Plugin {

    public static String PROTOCOL_CAPTURE = "capture";

    private static final String LOG_TAG = "MediaCapture: ";

    /**
     * Error codes.
     */
    // Camera or microphone failed to capture image or sound.
    private static final int CAPTURE_INTERNAL_ERR = 0;
    // Camera application or audio capture application is currently serving other capture request.
    private static final int CAPTURE_APPLICATION_BUSY = 1;
    // Invalid use of the API (e.g. limit parameter has value less than one).
    private static final int CAPTURE_INVALID_ARGUMENT = 2;
    // User exited camera application or audio capture application before capturing anything.
    private static final int CAPTURE_NO_MEDIA_FILES = 3;
    // The requested capture operation is not supported.
    private static final int CAPTURE_NOT_SUPPORTED = 20;

    /**
     * Possible actions.
     */
    protected static final String ACTION_GET_SUPPORTED_MODES = "captureModes";
    protected static final String ACTION_CAPTURE_AUDIO = "captureAudio";
    protected static final String ACTION_CAPTURE_IMAGE = "captureImage";
    protected static final String ACTION_CAPTURE_VIDEO = "captureVideo";
    protected static final String ACTION_CANCEL_CAPTURES = "stopCaptures";

    /**
     * Executes the requested action and returns a PluginResult.
     *
     * @param action
     *            The action to execute.
     * @param callbackId
     *            The callback ID to be invoked upon action completion
     * @param args
     *            JSONArry of arguments for the action.
     * @return A PluginResult object with a status and message.
     */
    public PluginResult execute(String action, JSONArray args, String callbackId) {
        PluginResult result = null;

        if (ACTION_GET_SUPPORTED_MODES.equals(action)) {
            result = getCaptureModes();
        } else if (ACTION_CAPTURE_AUDIO.equals(action)) {
            result = captureAudio(args, callbackId);
        } else if (ACTION_CAPTURE_IMAGE.equals(action)) {
            result = captureImage(args, callbackId);
        } else if (ACTION_CAPTURE_VIDEO.equals(action)) {
            result = captureVideo(args, callbackId);
        } else if (ACTION_CANCEL_CAPTURES.equals(action)) {
            CaptureControl.getCaptureControl().stopPendingOperations(true);
            result =  new PluginResult(PluginResult.Status.OK);
        } else {
            result = new PluginResult(PluginResult.Status.INVALID_ACTION,
                "MediaCapture: invalid action " + action);
        }

        return result;
    }

    /**
     * Determines if audio capture is supported.
     * @return <code>true</code> if audio capture is supported
     */
    protected boolean isAudioCaptureSupported() {
        return (System.getProperty("supports.audio.capture").equals(Boolean.TRUE.toString())
                && AudioControl.hasAudioRecorderApplication());
    }

    /**
     * Determines if video capture is supported.
     * @return <code>true</code> if video capture is supported
     */
    protected boolean isVideoCaptureSupported() {
        return (System.getProperty("supports.video.capture").equals(Boolean.TRUE.toString()));
    }

    /**
     * Return the supported capture modes for audio, image and video.
     * @return supported capture modes.
     */
    private PluginResult getCaptureModes() {
        JSONArray audioModes = new JSONArray();
        JSONArray imageModes = new JSONArray();
        boolean audioSupported = isAudioCaptureSupported();

        // need to get the recording dimensions from supported image encodings
        String imageEncodings = System.getProperty("video.snapshot.encodings");
        Logger.log(this.getClass().getName() + ": video.snapshot.encodings="
                + imageEncodings);
        String[] encodings = StringUtils.split(imageEncodings, "encoding=");
        CaptureMode mode = null;
        Vector list = new Vector();

        // get all supported capture content types for audio and image
        String[] contentTypes = getCaptureContentTypes();
        for (int i = 0; i < contentTypes.length; i++) {
            if (audioSupported
                    && contentTypes[i]
                            .startsWith(AudioCaptureOperation.CONTENT_TYPE)) {
                audioModes.add(new CaptureMode(contentTypes[i]).toJSONObject());
            } else if (contentTypes[i]
                    .startsWith(ImageCaptureOperation.CONTENT_TYPE)) {
                String type = contentTypes[i]
                        .substring(ImageCaptureOperation.CONTENT_TYPE.length());
                for (int j = 0; j < encodings.length; j++) {
                    // format: "jpeg&width=2592&height=1944 "
                    String enc = encodings[j];
                    if (enc.startsWith(type)) {
                        Hashtable parms = parseEncodingString(enc);
                        // "width="
                        String w = (String)parms.get("width");
                        long width = (w == null) ? 0 : Long.parseLong(w);
                        // "height="
                        String h = (String)parms.get("height");
                        long height = (h == null) ? 0 : Long.parseLong(h);
                        // new capture mode
                        mode = new CaptureMode(contentTypes[i], width, height);
                        // don't want duplicates
                        if (!list.contains(mode)) {
                            list.addElement(mode);
                            imageModes.add(mode.toJSONObject());
                        }
                    }
                }
            }
        }

        JSONObject captureModes = new JSONObject();
        try {
            captureModes.put("supportedAudioModes", audioModes.toString());
            captureModes.put("supportedImageModes", imageModes.toString());
            captureModes.put("supportedVideoModes", getVideoCaptureModes().toString());
        } catch (JSONException e) {
            Logger.error("JSONException: " + e.getMessage());
            return new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                    "Failed to build supported capture modes.");
        }

        return new PluginResult(PluginResult.Status.OK, captureModes);
    }

    /**
     * Retrieves supported video capture modes (content type, width and height).
     * @return supported video capture modes
     */
    protected JSONArray getVideoCaptureModes() {
        JSONArray videoModes = new JSONArray();

        if (!isVideoCaptureSupported()) {
            // if the device does not support video capture, return an empty
            // array of capture modes
            Logger.log(this.getClass().getName() + ": video capture not supported");
            return videoModes;
        }

        /**
         * DOH! Even if video capture is supported, BlackBerry's API
         * does not provide any 'video/' content types for the 'capture'
         * protocol.  So if we looked at only capture content types,
         * it wouldn't return any results...
         *
         * // get all supported capture content types
         * String[] contentTypes = getCaptureContentTypes();
         *
         * A better alternative, and probably not too inaccurate, would be to
         * send back all supported video modes (not just capture).  This will
         * at least give the developer an idea of the capabilities.
         */

        // retrieve ALL supported video encodings
        String videoEncodings = System.getProperty("video.encodings");
        Logger.log(this.getClass().getName() + ": video.encodings=" + videoEncodings);
        String[] encodings = StringUtils.split(videoEncodings, "encoding=");

        // parse them into CaptureModes
        String enc = null;
        CaptureMode mode = null;
        Vector list = new Vector();
        for (int i = 0; i < encodings.length; i++) {
            enc = encodings[i];
            // format: "video/3gpp&width=640&height=480&video_codec=MPEG-4&audio_codec=AAC "
            if (enc.startsWith(VideoCaptureOperation.CONTENT_TYPE)) {
                Hashtable parms = parseEncodingString(enc);
                // type "video/3gpp"
                String t = (String)parms.get("type");
                // "width="
                String w = (String)parms.get("width");
                long width = (w == null) ? 0 : Long.parseLong(w);
                // "height="
                String h = (String)parms.get("height");
                long height = (h == null) ? 0 : Long.parseLong(h);
                // new capture mode
                mode = new CaptureMode(t, width, height);
                // don't want duplicates
                if (!list.contains(mode)) {
                    list.addElement(mode);
                    videoModes.add(mode.toJSONObject());
                }
            }
        }

        return videoModes;
    }

    /**
     * Utility method to parse encoding strings.
     *
     * @param encodingString
     *            encoding string
     * @return Hashtable containing key:value pairs
     */
    protected Hashtable parseEncodingString(final String encodingString) {
        // format: "video/3gpp&width=640&height=480&video_codec=MPEG-4&audio_codec=AAC "
        Hashtable props = new Hashtable();
        String[] parms = StringUtils.split(encodingString, "&");
        props.put("type", parms[0]);
        for (int i = 0; i < parms.length; i++) {
            String parameter = parms[i];
            if (parameter.indexOf('=') != -1) {
                String[] pair = StringUtils.split(parameter, "=");
                props.put(pair[0].trim(), pair[1].trim());
            }
        }
        return props;
    }

    /**
     * Returns the content types supported for the <code>capture://</code>
     * protocol.
     *
     * @return list of supported capture content types
     */
    protected static String[] getCaptureContentTypes() {
        // retrieve list of all content types supported for capture protocol
        return Manager.getSupportedContentTypes(PROTOCOL_CAPTURE);
    }

    /**
     * Starts an audio capture operation using the native voice notes recorder
     * application. If the native voice notes recorder application is already
     * running, the <code>CAPTURE_APPLICATION_BUSY</code> error is returned.
     *
     * @param args
     *            capture options (e.g., limit)
     * @param callbackId
     *            the callback to be invoked with the capture results
     * @return PluginResult containing captured media file properties
     */
    protected PluginResult captureAudio(final JSONArray args, final String callbackId) {
        PluginResult result = null;

        // if audio is not being recorded, start audio capture
        if (!AudioControl.hasAudioRecorderApplication()) {
            result = errorResult(CAPTURE_NOT_SUPPORTED,
                    "Audio recorder application is not installed.");
        } else if (AudioControl.isAudioRecorderActive()) {
            result = errorResult(CAPTURE_APPLICATION_BUSY,
                    "Audio recorder application is busy.");
        }
        else {
            // optional parameters
            long limit = 1;
            double duration = 0.0f;

            try {
                JSONObject options = args.getJSONObject(0);
                if (options != null) {
                    limit = options.optLong("limit", 1);
                    duration = options.optDouble("duration", 0.0f);
                }
            } catch (JSONException e) {
                // Eat it and use default value of 1.
                Logger.log(this.getClass().getName()
                        + ": Invalid captureAudio options format. " + e.getMessage());
            }

            // start audio capture
            // start capture operation in the background
            CaptureControl.getCaptureControl().startAudioCaptureOperation(
                    limit, duration, callbackId);

            // return NO_RESULT and allow callbacks to be invoked later
            result = new PluginResult(PluginResult.Status.NO_RESULT);
            result.setKeepCallback(true);
        }

        return result;
    }

    /**
     * Starts an image capture operation using the native camera application. If
     * the native camera application is already running, the
     * <code>CAPTURE_APPLICATION_BUSY</code> error is returned.
     *
     * @param args
     *            capture options (e.g., limit)
     * @param callbackId
     *            the callback to be invoked with the capture results
     * @return PluginResult containing captured media file properties
     */
    protected PluginResult captureImage(final JSONArray args,
            final String callbackId) {
        PluginResult result = null;

        if (CameraControl.isCameraActive()) {
            result = errorResult(CAPTURE_APPLICATION_BUSY,
                    "Camera application is busy.");
        }
        else {
            // optional parameters
            long limit = 1;

            try {
                JSONObject options = args.getJSONObject(0);
                if (options != null) {
                    limit = options.optLong("limit", 1);
                }
            } catch (JSONException e) {
                // Eat it and use default value of 1.
                Logger.log(this.getClass().getName()
                        + ": Invalid captureImage options format. " + e.getMessage());
            }

            // start capture operation in the background
            CaptureControl.getCaptureControl().startImageCaptureOperation(
                    limit, callbackId);

            // return NO_RESULT and allow callbacks to be invoked later
            result = new PluginResult(PluginResult.Status.NO_RESULT);
            result.setKeepCallback(true);
        }

        return result;
    }

    /**
     * Starts an video capture operation using the native video recorder
     * application. If the native video recorder application is already running,
     * the <code>CAPTURE_APPLICATION_BUSY</code> error is returned.
     *
     * @param args
     *            capture options (e.g., limit)
     * @param callbackId
     *            the callback to be invoked with the capture results
     * @return PluginResult containing captured media file properties
     */
    protected PluginResult captureVideo(final JSONArray args,
            final String callbackId) {
        PluginResult result = null;

        if (!isVideoCaptureSupported()) {
            result = errorResult(CAPTURE_NOT_SUPPORTED,
                    "Video capture is not supported.");
        } else if (CameraControl.isVideoRecorderActive()) {
            result = errorResult(CAPTURE_APPLICATION_BUSY,
                    "Video recorder application is busy.");
        }
        else {
            // optional parameters
            long limit = 1;

            try {
                JSONObject options = args.getJSONObject(0);
                if (options != null) {
                    limit = options.optLong("limit", 1);
                }
            } catch (JSONException e) {
                // Eat it and use default value of 1.
                Logger.log(this.getClass().getName()
                        + ": Invalid captureVideo options format. " + e.getMessage());
            }

            // start capture operation in the background
            CaptureControl.getCaptureControl().startVideoCaptureOperation(
                    limit, callbackId);

            // return NO_RESULT and allow callbacks to be invoked later
            result = new PluginResult(PluginResult.Status.NO_RESULT);
            result.setKeepCallback(true);
        }

        return result;
    }

    /**
     * Sends media capture result back to JavaScript.
     *
     * @param mediaFiles
     *            list of File objects describing captured media files
     * @param callbackId
     *            the callback to receive the file descriptions
     */
    public static void captureSuccess(Vector mediaFiles, String callbackId) {
        PluginResult result = null;
        File file = null;

        JSONArray array = new JSONArray();
        for (Enumeration e = mediaFiles.elements(); e.hasMoreElements();) {
            file = (File) e.nextElement();
            array.add(file.toJSONObject());
        }

        // invoke the appropriate callback
        result = new PluginResult(PluginResult.Status.OK, array);
        success(result, callbackId);
    }

    /**
     * Sends error back to JavaScript.
     *
     * @param callbackId
     *            the callback to receive the error
     */
    public static void captureError(String callbackId) {
        error(errorResult(CAPTURE_NO_MEDIA_FILES, ""), callbackId);
    }

    /**
     * Called when application is resumed.
     */
    public void onResume() {
        // We launch the native media applications for capture operations, which
        // puts this application in the background.  This application will come
        // to the foreground when the user closes the native media application.
        // So we close any running capture operations any time we resume.
        //
        // It would be nice if we could catch the EVT_APP_FOREGROUND event that
        // is supposed to be triggered when the application comes to the
        // foreground, but have not seen a way to do that on the Java side.
        // Unfortunately, we have to get notification from the JavaScript side,
        // which does get the event.  (Argh! Only BlackBerry.)
        //
        // In this case, we're just stopping the capture operations, not
        // canceling them.
        CaptureControl.getCaptureControl().stopPendingOperations(false);
    }

    /**
     * Invoked when this application terminates.
     */
    public void onDestroy() {
        CaptureControl.getCaptureControl().stopPendingOperations(true);
    }

    private static PluginResult errorResult(int code, String message) {
        Logger.log(LOG_TAG + message);

        JSONObject obj = new JSONObject();
        try {
            obj.put("code", code);
            obj.put("message", message);
        } catch (JSONException e) {
            // This will never happen
        }

        return new PluginResult(PluginResult.Status.ERROR, obj);
    }
}
