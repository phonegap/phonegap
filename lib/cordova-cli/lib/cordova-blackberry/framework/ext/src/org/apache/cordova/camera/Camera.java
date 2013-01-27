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
package org.apache.cordova.camera;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Date;

import javax.microedition.io.Connector;
import javax.microedition.io.file.FileConnection;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.json4j.JSONArray;
import org.apache.cordova.json4j.JSONException;
import org.apache.cordova.util.Logger;

import net.rim.blackberry.api.invoke.CameraArguments;
import net.rim.blackberry.api.invoke.Invoke;
import net.rim.device.api.io.Base64OutputStream;
import net.rim.device.api.io.IOUtilities;
import net.rim.device.api.system.ApplicationDescriptor;
import net.rim.device.api.system.Bitmap;
import net.rim.device.api.system.Characters;
import net.rim.device.api.system.ControlledAccessException;
import net.rim.device.api.system.EncodedImage;
import net.rim.device.api.system.EventInjector;
import net.rim.device.api.system.JPEGEncodedImage;
import net.rim.device.api.system.PNGEncodedImage;
import net.rim.device.api.ui.UiApplication;

/**
 * The Camera plugin interface.
 *
 * The Camera class can invoke the following actions:
 *
 *   - takePicture: takes photo and returns base64 encoded image or image file URI
 *
 *   future?
 *   - captureVideo...
 *
 */
public class Camera extends Plugin
{
    /**
     * Possible actions.
     */
    public static final String ACTION_TAKE_PICTURE = "takePicture";

    /**
     * Maximum image encoding size (in bytes) to allow.  (Obtained unofficially
     * through trial and error). Anything larger will cause stability issues
     * when sending back to the browser.
     */
    private static final long MAX_ENCODING_SIZE = 1500000L;

    /**
     * Executes the requested action and returns a PluginResult.
     *
     * @param action The action to execute.
     * @param callbackId The callback ID to be invoked upon action completion
     * @param args   JSONArry of arguments for the action.
     * @return A PluginResult object with a status and message.
     */
    public PluginResult execute(String action, JSONArray args, String callbackId)
    {
        PluginResult result = null;

        // take a picture
        if (action != null && action.equals(ACTION_TAKE_PICTURE))
        {
            // Parse the options specified for the take picture action.
            CameraOptions options;
            try {
                options = CameraOptions.fromJSONArray(args);
            } catch (NumberFormatException e) {
                return new PluginResult(PluginResult.Status.JSON_EXCEPTION, "One of the camera options is not a valid number.");
            } catch (JSONException e) {
                return new PluginResult(PluginResult.Status.JSON_EXCEPTION, "One of the camera options is not valid JSON.");
            }

            // launch native camera application
            launchCamera(new PhotoListener(options, callbackId));

            // The native camera application runs in a separate process, so we
            // must now wait for the listener to retrieve the photo taken.
            // Return NO_RESULT status so plugin manager does not invoke a callback,
            // but keep the callback so the listener can invoke it later.
            result = new PluginResult(PluginResult.Status.NO_RESULT);
            result.setKeepCallback(true);
            return result;
        }
        else
        {
            result = new PluginResult(PluginResult.Status.INVALID_ACTION, "Camera: Invalid action:" + action);
        }

        return result;
    }

    /**
     * Launches the native camera application.
     */
    private static void launchCamera(PhotoListener listener)
    {
        // MMAPI interface doesn't use the native Camera application or interface
        // (we would have to replicate it).  So, we invoke the native Camera application,
        // which doesn't allow us to set any options.
        synchronized(UiApplication.getEventLock()) {
            UiApplication.getUiApplication().addFileSystemJournalListener(listener);
            Invoke.invokeApplication(Invoke.APP_TYPE_CAMERA, new CameraArguments());
        }
    }

    /**
     * Closes the native camera application.
     */
    public static void closeCamera()
    {
        // simulate two escape characters to exit native camera application
        // no, there is no other way to do this
        UiApplication.getUiApplication().invokeLater(new Runnable() {
            public void run() {
                try
                {
                    EventInjector.KeyEvent inject = new EventInjector.KeyEvent(
                            EventInjector.KeyEvent.KEY_DOWN, Characters.ESCAPE, 0);
                    inject.post();
                    inject.post();
                }
                catch (ControlledAccessException e)
                {
                    // the application doesn't have key injection permissions
                    Logger.log(Camera.class.getName() + ": Unable to close camera.  " +
                            ApplicationDescriptor.currentApplicationDescriptor().getName() +
                            " does not have key injection permissions.");
                }
            }
        });
    }

    /**
     * Returns the image file URI or the Base64-encoded image.
     * @param filePath The full path of the image file
     * @param options Specifies the format of the image and the result
     * @param callbackId The id of the callback to receive the result
     */
    public static void processImage(String filePath, CameraOptions options,
            String callbackId) {
        PluginResult result = null;
        try
        {
            // wait for the file to be fully written to the file system
            // to avoid premature access to it (yes, this has happened)
            waitForImageFile(filePath);

            // Reformat the image if the specified options require it,
            // otherwise, get encoded string if base 64 string is output format.
            String imageURIorData = filePath;
            
            // save to file:///store/home/user/ as oppsed to photo album
            // so it doesn't show up in the camera's photo album viewer
            if(!options.saveToPhotoAlbum){
                FileConnection fconnIn = null;
                FileConnection fconnOut = null;
                InputStream in = null;
                OutputStream out = null;
                String newOutName = "";
                try
                {
                    fconnIn = (FileConnection)Connector.open(filePath);
                    if (fconnIn.exists())
                    {
                        newOutName = "file:///store/home/user/"+fconnIn.getName();
                        fconnOut = (FileConnection)Connector.open(newOutName);
                        if (!fconnOut.exists())
                         {
                             fconnOut.create();  
                             in = fconnIn.openInputStream();
                             out = fconnOut.openOutputStream();
                             out.write(IOUtilities.streamToBytes(in, 96*1024));
                             fconnIn.delete();
                             out.close();
                             imageURIorData = newOutName;
                             filePath = newOutName;
                             waitForImageFile(newOutName);
                         }
                    }
                }
                finally
                {
                    if (in != null) in.close();
                    if (out != null) out.close();
                    if (fconnIn != null) fconnIn.close();
                    if (fconnOut != null) fconnOut.close();
                }
                
            }

            if (options.reformat) {
                imageURIorData = reformatImage(filePath, options);
            } else if (options.destinationType == CameraOptions.DESTINATION_DATA_URL) {
                imageURIorData = encodeImage(filePath);
            }

            // we have to check the size to avoid memory errors in the browser
            if (imageURIorData.length() > MAX_ENCODING_SIZE)
            {
                // it's a big one.  this is for your own good.
                String msg = "Encoded image is too large.  Try reducing camera image size.";
                Logger.log(Camera.class.getName() + ": " + msg);
                result =  new PluginResult(PluginResult.Status.ERROR, msg);
            }
            else
            {
                result = new PluginResult(PluginResult.Status.OK, imageURIorData);
            }
        }
        catch (Exception e)
        {
            result = new PluginResult(PluginResult.Status.IO_EXCEPTION, e.toString());
        }

        // send result back to JavaScript
        sendResult(result, callbackId);
    }

    /**
     * Waits for the image file to be fully written to the file system.
     * @param filePath     Full path of the image file
     * @throws IOException
     */
    private static void waitForImageFile(String filePath) throws IOException
    {
        long start = (new Date()).getTime();
        FileConnection fconn = null;
        try
        {
            fconn = (FileConnection)Connector.open(filePath, Connector.READ);
            if (fconn.exists())
            {
                long fileSize = fconn.fileSize();
                long size = 0;
                while (true)
                {
                    try { Thread.sleep(100); } catch (InterruptedException e) {}
                    size = fconn.fileSize();
                    if (size == fileSize) {
                        break;
                    }
                    fileSize = size;
                }
                Logger.log(Camera.class.getName() + ": " + filePath +
                    " size=" + Long.toString(fileSize) + " bytes");
            }
        }
        finally
        {
            if (fconn != null) fconn.close();
        }
        long end = (new Date()).getTime();
        Logger.log(Camera.class.getName() + ": wait time=" + Long.toString(end-start) + " ms");
    }

    /**
     * Opens the specified image file and converts its contents to a Base64-encoded string.
     * @param filePath     Full path of the image file
     * @return file contents as a Base64-encoded String
     */
    private static String encodeImage(String filePath) throws IOException
    {
        String imageData = null;

        // open the image file
        FileConnection fconn = null;
        InputStream in = null;
        ByteArrayOutputStream byteArrayOS = null;
        try
        {
            fconn = (FileConnection)Connector.open(filePath);
            if (fconn.exists())
            {
                // encode file contents using BASE64 encoding
                in = fconn.openInputStream();
                byteArrayOS = new ByteArrayOutputStream();
                Base64OutputStream base64OS = new Base64OutputStream(byteArrayOS);
                base64OS.write(IOUtilities.streamToBytes(in, 96*1024));
                base64OS.flush();
                base64OS.close();
                imageData = byteArrayOS.toString();

                Logger.log(Camera.class.getName() + ": Base64 encoding size=" +
                        Integer.toString(imageData.length()));
            }
        }
        finally
        {
            if (in != null) in.close();
            if (fconn != null) fconn.close();
            if (byteArrayOS != null) byteArrayOS.close();
        }

        return imageData;
    }

    /**
     * Reformats the image taken with the camera based on the options specified.
     *
     * Unfortunately, reformatting the image will cause EXIF data in the photo
     * to be lost.  Most importantly the orientation data is lost so the
     * picture is not auto rotated by software that recognizes EXIF data.
     *
     * @param filePath
     *            The full path of the image file
     * @param options
     *            Specifies the format of the image and the result
     * @return the reformatted image file URI or Base64-encoded image
     * @throws IOException
     */
    private static String reformatImage(String filePath, CameraOptions options)
            throws IOException {
        long start = (new Date()).getTime();

        // Open the original image created by the camera application and read
        // it into an EncodedImage object.
        FileConnection fconn = null;
        InputStream in = null;
        Bitmap originalImage = null;
        try {
            fconn = (FileConnection) Connector.open(filePath);
            in = fconn.openInputStream();
            originalImage = Bitmap.createBitmapFromBytes(IOUtilities.streamToBytes(in, 96*1024), 0, -1, 1);
        } finally {
            if (in != null)
                in.close();
            if (fconn != null)
                fconn.close();
        }

        int newWidth = options.targetWidth;
        int newHeight = options.targetHeight;
        int origWidth = originalImage.getWidth();
        int origHeight = originalImage.getHeight();

        // If only width or only height was specified, the missing dimension is
        // set based on the current aspect ratio of the image.
        if (newWidth > 0 && newHeight <= 0) {
            newHeight = (newWidth * origHeight) / origWidth;
        } else if (newWidth <= 0 && newHeight > 0) {
            newWidth = (newHeight * origWidth) / origHeight;
        } else if (newWidth <= 0 && newHeight <= 0) {
            newWidth = origWidth;
            newHeight = origHeight;
        } else {
            // If the user specified both a positive width and height
            // (potentially different aspect ratio) then the width or height is
            // scaled so that the image fits while maintaining aspect ratio.
            // Alternatively, the specified width and height could have been
            // kept and Bitmap.SCALE_TO_FIT specified when scaling, but this
            // would result in whitespace in the new image.
            double newRatio = newWidth / (double)newHeight;
            double origRatio = origWidth / (double)origHeight;

            if (origRatio > newRatio) {
                newHeight = (newWidth * origHeight) / origWidth;
            } else if (origRatio < newRatio) {
                newWidth = (newHeight * origWidth) / origHeight;
            }
        }

        Bitmap newImage = new Bitmap(newWidth, newHeight);
        originalImage.scaleInto(newImage, options.imageFilter, Bitmap.SCALE_TO_FILL);

        // Convert the image to the appropriate encoding.  PNG does not allow
        // quality to be specified so the only affect that the quality option
        // has for a PNG is on the seelction of the image filter.
        EncodedImage encodedImage;
        if (options.encoding == CameraOptions.ENCODING_PNG) {
            encodedImage = PNGEncodedImage.encode(newImage);
        } else {
            encodedImage = JPEGEncodedImage.encode(newImage, options.quality);
        }

        // Rewrite the modified image back out to the same file.  This is done
        // to ensure that for every picture taken, only one shows up in the
        // gallery.  If the encoding changed the file extension will differ
        // from the original.
        OutputStream out = null;
        int dirIndex = filePath.lastIndexOf('/');
        String filename = filePath.substring(dirIndex + 1, filePath.lastIndexOf('.'))
                + options.fileExtension;
        try {
            fconn = (FileConnection) Connector.open(filePath);
            fconn.truncate(0);
            out = fconn.openOutputStream();
            out.write(encodedImage.getData());
            fconn.rename(filename);
        } finally {
            if (out != null)
                out.close();
            if (fconn != null)
                fconn.close();
        }

        // Return either the Base64-encoded string or the image URI for the
        // new image.
        String imageURIorData;
        if (options.destinationType == CameraOptions.DESTINATION_DATA_URL) {
            ByteArrayOutputStream byteArrayOS = null;

            try {
                byteArrayOS = new ByteArrayOutputStream();
                Base64OutputStream base64OS = new Base64OutputStream(
                        byteArrayOS);
                base64OS.write(encodedImage.getData());
                base64OS.flush();
                base64OS.close();
                imageURIorData = byteArrayOS.toString();
                Logger.log(Camera.class.getName() + ": Base64 encoding size="
                        + Integer.toString(imageURIorData.length()));
            } finally {
                if (byteArrayOS != null) {
                    byteArrayOS.close();
                }
            }
        } else {
            imageURIorData = filePath.substring(0, dirIndex + 1) + filename;
        }

        long end = (new Date()).getTime();
        Logger.log(Camera.class.getName() + ": reformat time=" + Long.toString(end-start) + " ms");

        return imageURIorData;
    }

    /**
     * Sends result back to JavaScript.
     * @param result PluginResult
     */
    private static void sendResult(PluginResult result, String callbackId)
    {
        // invoke the appropriate callback
        if (result.getStatus() == PluginResult.Status.OK.ordinal())
        {
            success(result, callbackId);
        }
        else
        {
            error(result, callbackId);
        }
    }
}
