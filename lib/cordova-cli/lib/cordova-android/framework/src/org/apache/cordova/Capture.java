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

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStream;

import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.apache.cordova.api.LOG;
import org.apache.cordova.api.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.BitmapFactory;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;

public class Capture extends CordovaPlugin {

    private static final String VIDEO_3GPP = "video/3gpp";
    private static final String VIDEO_MP4 = "video/mp4";
    private static final String AUDIO_3GPP = "audio/3gpp";
    private static final String IMAGE_JPEG = "image/jpeg";

    private static final int CAPTURE_AUDIO = 0;     // Constant for capture audio
    private static final int CAPTURE_IMAGE = 1;     // Constant for capture image
    private static final int CAPTURE_VIDEO = 2;     // Constant for capture video
    private static final String LOG_TAG = "Capture";

    private static final int CAPTURE_INTERNAL_ERR = 0;
//    private static final int CAPTURE_APPLICATION_BUSY = 1;
//    private static final int CAPTURE_INVALID_ARGUMENT = 2;
    private static final int CAPTURE_NO_MEDIA_FILES = 3;

    private CallbackContext callbackContext;        // The callback context from which we were invoked.
    private long limit;                             // the number of pics/vids/clips to take
    private double duration;                        // optional duration parameter for video recording
    private JSONArray results;                      // The array of results to be returned to the user
    private int numPics;                            // Number of pictures before capture activity

    //private CordovaInterface cordova;

//    public void setContext(Context mCtx)
//    {
//        if (CordovaInterface.class.isInstance(mCtx))
//            cordova = (CordovaInterface) mCtx;
//        else
//            LOG.d(LOG_TAG, "ERROR: You must use the CordovaInterface for this to work correctly. Please implement it in your activity");
//    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;
        this.limit = 1;
        this.duration = 0.0f;
        this.results = new JSONArray();

        JSONObject options = args.optJSONObject(0);
        if (options != null) {
            limit = options.optLong("limit", 1);
            duration = options.optDouble("duration", 0.0f);
        }

        if (action.equals("getFormatData")) {
            JSONObject obj = getFormatData(args.getString(0), args.getString(1));
            callbackContext.success(obj);
            return true;
        }
        else if (action.equals("captureAudio")) {
            this.captureAudio();
        }
        else if (action.equals("captureImage")) {
            this.captureImage();
        }
        else if (action.equals("captureVideo")) {
            this.captureVideo(duration);
        }
        else {
            return false;
        }

        return true;
    }

    /**
     * Provides the media data file data depending on it's mime type
     *
     * @param filePath path to the file
     * @param mimeType of the file
     * @return a MediaFileData object
     */
    private JSONObject getFormatData(String filePath, String mimeType) throws JSONException {
        JSONObject obj = new JSONObject();
        // setup defaults
        obj.put("height", 0);
        obj.put("width", 0);
        obj.put("bitrate", 0);
        obj.put("duration", 0);
        obj.put("codecs", "");

        // If the mimeType isn't set the rest will fail
        // so let's see if we can determine it.
        if (mimeType == null || mimeType.equals("") || "null".equals(mimeType)) {
            mimeType = FileUtils.getMimeType(filePath);
        }
        Log.d(LOG_TAG, "Mime type = " + mimeType);

        if (mimeType.equals(IMAGE_JPEG) || filePath.endsWith(".jpg")) {
            obj = getImageData(filePath, obj);
        }
        else if (mimeType.endsWith(AUDIO_3GPP)) {
            obj = getAudioVideoData(filePath, obj, false);
        }
        else if (mimeType.equals(VIDEO_3GPP) || mimeType.equals(VIDEO_MP4)) {
            obj = getAudioVideoData(filePath, obj, true);
        }
        return obj;
    }

    /**
     * Get the Image specific attributes
     *
     * @param filePath path to the file
     * @param obj represents the Media File Data
     * @return a JSONObject that represents the Media File Data
     * @throws JSONException
     */
    private JSONObject getImageData(String filePath, JSONObject obj) throws JSONException {
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inJustDecodeBounds = true;
        BitmapFactory.decodeFile(FileUtils.stripFileProtocol(filePath), options);
        obj.put("height", options.outHeight);
        obj.put("width", options.outWidth);
        return obj;
    }

    /**
     * Get the Image specific attributes
     *
     * @param filePath path to the file
     * @param obj represents the Media File Data
     * @param video if true get video attributes as well
     * @return a JSONObject that represents the Media File Data
     * @throws JSONException
     */
    private JSONObject getAudioVideoData(String filePath, JSONObject obj, boolean video) throws JSONException {
        MediaPlayer player = new MediaPlayer();
        try {
            player.setDataSource(filePath);
            player.prepare();
            obj.put("duration", player.getDuration() / 1000);
            if (video) {
                obj.put("height", player.getVideoHeight());
                obj.put("width", player.getVideoWidth());
            }
        } catch (IOException e) {
            Log.d(LOG_TAG, "Error: loading video file");
        }
        return obj;
    }

    /**
     * Sets up an intent to capture audio.  Result handled by onActivityResult()
     */
    private void captureAudio() {
        Intent intent = new Intent(android.provider.MediaStore.Audio.Media.RECORD_SOUND_ACTION);

        this.cordova.startActivityForResult((CordovaPlugin) this, intent, CAPTURE_AUDIO);
    }

    /**
     * Sets up an intent to capture images.  Result handled by onActivityResult()
     */
    private void captureImage() {
        // Save the number of images currently on disk for later
        this.numPics = queryImgDB(whichContentStore()).getCount();

        Intent intent = new Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE);

        // Specify file so that large image is captured and returned
        File photo = new File(DirectoryManager.getTempDirectoryPath(this.cordova.getActivity()), "Capture.jpg");
        intent.putExtra(android.provider.MediaStore.EXTRA_OUTPUT, Uri.fromFile(photo));

        this.cordova.startActivityForResult((CordovaPlugin) this, intent, CAPTURE_IMAGE);
    }

    /**
     * Sets up an intent to capture video.  Result handled by onActivityResult()
     */
    private void captureVideo(double duration) {
        Intent intent = new Intent(android.provider.MediaStore.ACTION_VIDEO_CAPTURE);
        // Introduced in API 8
        //intent.putExtra(android.provider.MediaStore.EXTRA_DURATION_LIMIT, duration);

        this.cordova.startActivityForResult((CordovaPlugin) this, intent, CAPTURE_VIDEO);
    }

    /**
     * Called when the video view exits.
     *
     * @param requestCode       The request code originally supplied to startActivityForResult(),
     *                          allowing you to identify who this result came from.
     * @param resultCode        The integer result code returned by the child activity through its setResult().
     * @param intent            An Intent, which can return result data to the caller (various data can be attached to Intent "extras").
     * @throws JSONException
     */
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {

        // Result received okay
        if (resultCode == Activity.RESULT_OK) {
            // An audio clip was requested
            if (requestCode == CAPTURE_AUDIO) {
                // Get the uri of the audio clip
                Uri data = intent.getData();
                // create a file object from the uri
                results.put(createMediaFile(data));

                if (results.length() >= limit) {
                    // Send Uri back to JavaScript for listening to audio
                    this.callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, results));
                } else {
                    // still need to capture more audio clips
                    captureAudio();
                }
            } else if (requestCode == CAPTURE_IMAGE) {
                // For some reason if I try to do:
                // Uri data = intent.getData();
                // It crashes in the emulator and on my phone with a null pointer exception
                // To work around it I had to grab the code from CameraLauncher.java
                try {
                    // Create entry in media store for image
                    // (Don't use insertImage() because it uses default compression setting of 50 - no way to change it)
                    ContentValues values = new ContentValues();
                    values.put(android.provider.MediaStore.Images.Media.MIME_TYPE, IMAGE_JPEG);
                    Uri uri = null;
                    try {
                        uri = this.cordova.getActivity().getContentResolver().insert(android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                    } catch (UnsupportedOperationException e) {
                        LOG.d(LOG_TAG, "Can't write to external media storage.");
                        try {
                            uri = this.cordova.getActivity().getContentResolver().insert(android.provider.MediaStore.Images.Media.INTERNAL_CONTENT_URI, values);
                        } catch (UnsupportedOperationException ex) {
                            LOG.d(LOG_TAG, "Can't write to internal media storage.");
                            this.fail(createErrorObject(CAPTURE_INTERNAL_ERR, "Error capturing image - no media storage found."));
                            return;
                        }
                    }
                    FileInputStream fis = new FileInputStream(DirectoryManager.getTempDirectoryPath(this.cordova.getActivity()) + "/Capture.jpg");
                    OutputStream os = this.cordova.getActivity().getContentResolver().openOutputStream(uri);
                    byte[] buffer = new byte[4096];
                    int len;
                    while ((len = fis.read(buffer)) != -1) {
                        os.write(buffer, 0, len);
                    }
                    os.flush();
                    os.close();
                    fis.close();

                    // Add image to results
                    results.put(createMediaFile(uri));

                    checkForDuplicateImage();

                    if (results.length() >= limit) {
                        // Send Uri back to JavaScript for viewing image
                        this.callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, results));
                    } else {
                        // still need to capture more images
                        captureImage();
                    }
                } catch (IOException e) {
                    e.printStackTrace();
                    this.fail(createErrorObject(CAPTURE_INTERNAL_ERR, "Error capturing image."));
                }
            } else if (requestCode == CAPTURE_VIDEO) {
                // Get the uri of the video clip
                Uri data = intent.getData();
                // create a file object from the uri
                results.put(createMediaFile(data));

                if (results.length() >= limit) {
                    // Send Uri back to JavaScript for viewing video
                    this.callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, results));
                } else {
                    // still need to capture more video clips
                    captureVideo(duration);
                }
            }
        }
        // If canceled
        else if (resultCode == Activity.RESULT_CANCELED) {
            // If we have partial results send them back to the user
            if (results.length() > 0) {
                this.callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, results));
            }
            // user canceled the action
            else {
                this.fail(createErrorObject(CAPTURE_NO_MEDIA_FILES, "Canceled."));
            }
        }
        // If something else
        else {
            // If we have partial results send them back to the user
            if (results.length() > 0) {
                this.callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, results));
            }
            // something bad happened
            else {
                this.fail(createErrorObject(CAPTURE_NO_MEDIA_FILES, "Did not complete!"));
            }
        }
    }

    /**
     * Creates a JSONObject that represents a File from the Uri
     *
     * @param data the Uri of the audio/image/video
     * @return a JSONObject that represents a File
     * @throws IOException
     */
    private JSONObject createMediaFile(Uri data) {
        File fp = new File(FileUtils.getRealPathFromURI(data, this.cordova));
        JSONObject obj = new JSONObject();

        try {
            // File properties
            obj.put("name", fp.getName());
            obj.put("fullPath", "file://" + fp.getAbsolutePath());
            // Because of an issue with MimeTypeMap.getMimeTypeFromExtension() all .3gpp files
            // are reported as video/3gpp. I'm doing this hacky check of the URI to see if it
            // is stored in the audio or video content store.
            if (fp.getAbsoluteFile().toString().endsWith(".3gp") || fp.getAbsoluteFile().toString().endsWith(".3gpp")) {
                if (data.toString().contains("/audio/")) {
                    obj.put("type", AUDIO_3GPP);
                } else {
                    obj.put("type", VIDEO_3GPP);
                }
            } else {
                obj.put("type", FileUtils.getMimeType(fp.getAbsolutePath()));
            }

            obj.put("lastModifiedDate", fp.lastModified());
            obj.put("size", fp.length());
        } catch (JSONException e) {
            // this will never happen
            e.printStackTrace();
        }

        return obj;
    }

    private JSONObject createErrorObject(int code, String message) {
        JSONObject obj = new JSONObject();
        try {
            obj.put("code", code);
            obj.put("message", message);
        } catch (JSONException e) {
            // This will never happen
        }
        return obj;
    }

    /**
     * Send error message to JavaScript.
     *
     * @param err
     */
    public void fail(JSONObject err) {
        this.callbackContext.error(err);
    }


    /**
     * Creates a cursor that can be used to determine how many images we have.
     *
     * @return a cursor
     */
    private Cursor queryImgDB(Uri contentStore) {
        return this.cordova.getActivity().getContentResolver().query(
            contentStore,
            new String[] { MediaStore.Images.Media._ID },
            null,
            null,
            null);
    }

    /**
     * Used to find out if we are in a situation where the Camera Intent adds to images
     * to the content store.
     */
    private void checkForDuplicateImage() {
        Uri contentStore = whichContentStore();
        Cursor cursor = queryImgDB(contentStore);
        int currentNumOfImages = cursor.getCount();

        // delete the duplicate file if the difference is 2
        if ((currentNumOfImages - numPics) == 2) {
            cursor.moveToLast();
            int id = Integer.valueOf(cursor.getString(cursor.getColumnIndex(MediaStore.Images.Media._ID))) - 1;
            Uri uri = Uri.parse(contentStore + "/" + id);
            this.cordova.getActivity().getContentResolver().delete(uri, null, null);
        }
    }

    /**
     * Determine if we are storing the images in internal or external storage
     * @return Uri
     */
    private Uri whichContentStore() {
        if (Environment.getExternalStorageState().equals(Environment.MEDIA_MOUNTED)) {
            return android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
        } else {
            return android.provider.MediaStore.Images.Media.INTERNAL_CONTENT_URI;
        }
    }
}
