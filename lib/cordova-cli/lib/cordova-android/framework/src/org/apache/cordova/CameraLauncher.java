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

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

import org.apache.commons.codec.binary.Base64;
import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.apache.cordova.api.LOG;
import org.apache.cordova.api.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.graphics.Bitmap.CompressFormat;
import android.media.MediaScannerConnection;
import android.media.MediaScannerConnection.MediaScannerConnectionClient;
import android.net.Uri;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;

/**
 * This class launches the camera view, allows the user to take a picture, closes the camera view,
 * and returns the captured image.  When the camera view is closed, the screen displayed before
 * the camera view was shown is redisplayed.
 */
public class CameraLauncher extends CordovaPlugin implements MediaScannerConnectionClient {

    private static final int DATA_URL = 0;              // Return base64 encoded string
    private static final int FILE_URI = 1;              // Return file uri (content://media/external/images/media/2 for Android)

    private static final int PHOTOLIBRARY = 0;          // Choose image from picture library (same as SAVEDPHOTOALBUM for Android)
    private static final int CAMERA = 1;                // Take picture from camera
    private static final int SAVEDPHOTOALBUM = 2;       // Choose image from picture library (same as PHOTOLIBRARY for Android)

    private static final int PICTURE = 0;               // allow selection of still pictures only. DEFAULT. Will return format specified via DestinationType
    private static final int VIDEO = 1;                 // allow selection of video only, ONLY RETURNS URL
    private static final int ALLMEDIA = 2;              // allow selection from all media types

    private static final int JPEG = 0;                  // Take a picture of type JPEG
    private static final int PNG = 1;                   // Take a picture of type PNG
    private static final String GET_PICTURE = "Get Picture";
    private static final String GET_VIDEO = "Get Video";
    private static final String GET_All = "Get All";

    private static final String LOG_TAG = "CameraLauncher";

    private int mQuality;                   // Compression quality hint (0-100: 0=low quality & high compression, 100=compress of max quality)
    private int targetWidth;                // desired width of the image
    private int targetHeight;               // desired height of the image
    private Uri imageUri;                   // Uri of captured image
    private int encodingType;               // Type of encoding to use
    private int mediaType;                  // What type of media to retrieve
    private boolean saveToPhotoAlbum;       // Should the picture be saved to the device's photo album
    private boolean correctOrientation;     // Should the pictures orientation be corrected
    //private boolean allowEdit;              // Should we allow the user to crop the image. UNUSED.

    public CallbackContext callbackContext;
    private int numPics;

    private MediaScannerConnection conn;    // Used to update gallery app with newly-written files
    private Uri scanMe;                     // Uri of image to be added to content store

    //This should never be null!
    //private CordovaInterface cordova;

    /**
     * Constructor.
     */
    public CameraLauncher() {
    }

//    public void setContext(CordovaInterface mCtx) {
//        super.setContext(mCtx);
//        if (CordovaInterface.class.isInstance(mCtx))
//            cordova = (CordovaInterface) mCtx;
//        else
//            LOG.d(LOG_TAG, "ERROR: You must use the CordovaInterface for this to work correctly. Please implement it in your activity");
//    }

    /**
     * Executes the request and returns PluginResult.
     *
     * @param action        	The action to execute.
     * @param args          	JSONArry of arguments for the plugin.
     * @param callbackContext   The callback id used when calling back into JavaScript.
     * @return              	A PluginResult object with a status and message.
     */
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;

        if (action.equals("takePicture")) {
            int srcType = CAMERA;
            int destType = FILE_URI;
            this.saveToPhotoAlbum = false;
            this.targetHeight = 0;
            this.targetWidth = 0;
            this.encodingType = JPEG;
            this.mediaType = PICTURE;
            this.mQuality = 80;

            this.mQuality = args.getInt(0);
            destType = args.getInt(1);
            srcType = args.getInt(2);
            this.targetWidth = args.getInt(3);
            this.targetHeight = args.getInt(4);
            this.encodingType = args.getInt(5);
            this.mediaType = args.getInt(6);
            //this.allowEdit = args.getBoolean(7); // This field is unused.
            this.correctOrientation = args.getBoolean(8);
            this.saveToPhotoAlbum = args.getBoolean(9);

            // If the user specifies a 0 or smaller width/height
            // make it -1 so later comparisons succeed
            if (this.targetWidth < 1) {
                this.targetWidth = -1;
            }
            if (this.targetHeight < 1) {
                this.targetHeight = -1;
            }

            if (srcType == CAMERA) {
                this.takePicture(destType, encodingType);
            }
            else if ((srcType == PHOTOLIBRARY) || (srcType == SAVEDPHOTOALBUM)) {
                this.getImage(srcType, destType);
            }
            PluginResult r = new PluginResult(PluginResult.Status.NO_RESULT);
            r.setKeepCallback(true);
            callbackContext.sendPluginResult(r);
            return true;
        }
        return false;
    }

    //--------------------------------------------------------------------------
    // LOCAL METHODS
    //--------------------------------------------------------------------------

    /**
     * Take a picture with the camera.
     * When an image is captured or the camera view is cancelled, the result is returned
     * in CordovaActivity.onActivityResult, which forwards the result to this.onActivityResult.
     *
     * The image can either be returned as a base64 string or a URI that points to the file.
     * To display base64 string in an img tag, set the source to:
     *      img.src="data:image/jpeg;base64,"+result;
     * or to display URI in an img tag
     *      img.src=result;
     *
     * @param quality           Compression quality hint (0-100: 0=low quality & high compression, 100=compress of max quality)
     * @param returnType        Set the type of image to return.
     */
    public void takePicture(int returnType, int encodingType) {
        // Save the number of images currently on disk for later
        this.numPics = queryImgDB(whichContentStore()).getCount();

        // Display camera
        Intent intent = new Intent("android.media.action.IMAGE_CAPTURE");

        // Specify file so that large image is captured and returned
        File photo = createCaptureFile(encodingType);
        intent.putExtra(android.provider.MediaStore.EXTRA_OUTPUT, Uri.fromFile(photo));
        this.imageUri = Uri.fromFile(photo);

        if (this.cordova != null) {
            this.cordova.startActivityForResult((CordovaPlugin) this, intent, (CAMERA + 1) * 16 + returnType + 1);
        }
//        else
//            LOG.d(LOG_TAG, "ERROR: You must use the CordovaInterface for this to work correctly. Please implement it in your activity");
    }

    /**
     * Create a file in the applications temporary directory based upon the supplied encoding.
     *
     * @param encodingType of the image to be taken
     * @return a File object pointing to the temporary picture
     */
    private File createCaptureFile(int encodingType) {
        File photo = null;
        if (encodingType == JPEG) {
            photo = new File(DirectoryManager.getTempDirectoryPath(this.cordova.getActivity()), ".Pic.jpg");
        } else if (encodingType == PNG) {
            photo = new File(DirectoryManager.getTempDirectoryPath(this.cordova.getActivity()), ".Pic.png");
        } else {
            throw new IllegalArgumentException("Invalid Encoding Type: " + encodingType);
        }
        return photo;
    }

    /**
     * Get image from photo library.
     *
     * @param quality           Compression quality hint (0-100: 0=low quality & high compression, 100=compress of max quality)
     * @param srcType           The album to get image from.
     * @param returnType        Set the type of image to return.
     */
    // TODO: Images selected from SDCARD don't display correctly, but from CAMERA ALBUM do!
    public void getImage(int srcType, int returnType) {
        Intent intent = new Intent();
        String title = GET_PICTURE;
        if (this.mediaType == PICTURE) {
            intent.setType("image/*");
        }
        else if (this.mediaType == VIDEO) {
            intent.setType("video/*");
            title = GET_VIDEO;
        }
        else if (this.mediaType == ALLMEDIA) {
            // I wanted to make the type 'image/*, video/*' but this does not work on all versions
            // of android so I had to go with the wildcard search.
            intent.setType("*/*");
            title = GET_All;
        }

        intent.setAction(Intent.ACTION_GET_CONTENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        if (this.cordova != null) {
            this.cordova.startActivityForResult((CordovaPlugin) this, Intent.createChooser(intent,
                    new String(title)), (srcType + 1) * 16 + returnType + 1);
        }
    }

    /**
     * Called when the camera view exits.
     *
     * @param requestCode       The request code originally supplied to startActivityForResult(),
     *                          allowing you to identify who this result came from.
     * @param resultCode        The integer result code returned by the child activity through its setResult().
     * @param intent            An Intent, which can return result data to the caller (various data can be attached to Intent "extras").
     */
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {

        // Get src and dest types from request code
        int srcType = (requestCode / 16) - 1;
        int destType = (requestCode % 16) - 1;
        int rotate = 0;

        // If CAMERA
        if (srcType == CAMERA) {
            // If image available
            if (resultCode == Activity.RESULT_OK) {
                try {
                    // Create an ExifHelper to save the exif data that is lost during compression
                    ExifHelper exif = new ExifHelper();
                    try {
                        if (this.encodingType == JPEG) {
                            exif.createInFile(DirectoryManager.getTempDirectoryPath(this.cordova.getActivity()) + "/.Pic.jpg");
                            exif.readExifData();
                            rotate = exif.getOrientation();
                        }
                    } catch (IOException e) {
                        e.printStackTrace();
                    }

                    Bitmap bitmap = null;
                    Uri uri = null;

                    // If sending base64 image back
                    if (destType == DATA_URL) {
                        bitmap = getScaledBitmap(FileUtils.stripFileProtocol(imageUri.toString()));
                        if (bitmap == null) {
                            // Try to get the bitmap from intent.
                            bitmap = (Bitmap)intent.getExtras().get("data");
                        }
                        
                        // Double-check the bitmap.
                        if (bitmap == null) {
                            Log.d(LOG_TAG, "I either have a null image path or bitmap");
                            this.failPicture("Unable to create bitmap!");
                            return;
                        }

                        if (rotate != 0 && this.correctOrientation) {
                            bitmap = getRotatedBitmap(rotate, bitmap, exif);
                        }

                        this.processPicture(bitmap);
                        checkForDuplicateImage(DATA_URL);
                    }

                    // If sending filename back
                    else if (destType == FILE_URI) {
                        if (!this.saveToPhotoAlbum) {
                            uri = Uri.fromFile(new File(DirectoryManager.getTempDirectoryPath(this.cordova.getActivity()), System.currentTimeMillis() + ".jpg"));
                        } else {
                            uri = getUriFromMediaStore();
                        }

                        if (uri == null) {
                            this.failPicture("Error capturing image - no media storage found.");
                        }

                        // If all this is true we shouldn't compress the image.
                        if (this.targetHeight == -1 && this.targetWidth == -1 && this.mQuality == 100 && 
                                !this.correctOrientation) {
                            writeUncompressedImage(uri);

                            this.callbackContext.success(uri.toString());
                        } else {
                            bitmap = getScaledBitmap(FileUtils.stripFileProtocol(imageUri.toString()));

                            if (rotate != 0 && this.correctOrientation) {
                                bitmap = getRotatedBitmap(rotate, bitmap, exif);
                            }

                            // Add compressed version of captured image to returned media store Uri
                            OutputStream os = this.cordova.getActivity().getContentResolver().openOutputStream(uri);
                            bitmap.compress(Bitmap.CompressFormat.JPEG, this.mQuality, os);
                            os.close();

                            // Restore exif data to file
                            if (this.encodingType == JPEG) {
                                String exifPath;
                                if (this.saveToPhotoAlbum) {
                                    exifPath = FileUtils.getRealPathFromURI(uri, this.cordova);
                                } else {
                                    exifPath = uri.getPath();
                                }
                                exif.createOutFile(exifPath);
                                exif.writeExifData();
                            }

                        }
                        // Send Uri back to JavaScript for viewing image
                        this.callbackContext.success(uri.toString());
                    }

                    this.cleanup(FILE_URI, this.imageUri, uri, bitmap);
                    bitmap = null;

                } catch (IOException e) {
                    e.printStackTrace();
                    this.failPicture("Error capturing image.");
                }
            }

            // If cancelled
            else if (resultCode == Activity.RESULT_CANCELED) {
                this.failPicture("Camera cancelled.");
            }

            // If something else
            else {
                this.failPicture("Did not complete!");
            }
        }

        // If retrieving photo from library
        else if ((srcType == PHOTOLIBRARY) || (srcType == SAVEDPHOTOALBUM)) {
            if (resultCode == Activity.RESULT_OK) {
                Uri uri = intent.getData();

                // If you ask for video or all media type you will automatically get back a file URI
                // and there will be no attempt to resize any returned data
                if (this.mediaType != PICTURE) {
                    this.callbackContext.success(uri.toString());
                }
                else {
                    // This is a special case to just return the path as no scaling,
                    // rotating or compression needs to be done
                    if (this.targetHeight == -1 && this.targetWidth == -1 &&
                            this.mQuality == 100 && destType == FILE_URI && !this.correctOrientation) {
                        this.callbackContext.success(uri.toString());
                    } else {
                        // Get the path to the image. Makes loading so much easier.
                        String imagePath = FileUtils.getRealPathFromURI(uri, this.cordova);
                        String mimeType = FileUtils.getMimeType(imagePath);
                        // Log.d(LOG_TAG, "Real path = " + imagePath);
                        // Log.d(LOG_TAG, "mime type = " + mimeType);
                        // If we don't have a valid image so quit.
                        if (imagePath == null || mimeType == null || 
                                !(mimeType.equalsIgnoreCase("image/jpeg") || mimeType.equalsIgnoreCase("image/png"))) {
                        	Log.d(LOG_TAG, "I either have a null image path or bitmap");
                            this.failPicture("Unable to retrieve path to picture!");
                            return;
                        }
                        Bitmap bitmap = getScaledBitmap(imagePath);
                        if (bitmap == null) {
                        	Log.d(LOG_TAG, "I either have a null image path or bitmap");
                            this.failPicture("Unable to create bitmap!");
                            return;
                        }

                        if (this.correctOrientation) {
                            String[] cols = { MediaStore.Images.Media.ORIENTATION };
                            Cursor cursor = this.cordova.getActivity().getContentResolver().query(intent.getData(),
                                    cols, null, null, null);
                            if (cursor != null) {
                                cursor.moveToPosition(0);
                                rotate = cursor.getInt(0);
                                cursor.close();
                            }
                            if (rotate != 0) {
                                Matrix matrix = new Matrix();
                                matrix.setRotate(rotate);
                                bitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);
                            }
                        }

                        // If sending base64 image back
                        if (destType == DATA_URL) {
                            this.processPicture(bitmap);
                        }

                        // If sending filename back
                        else if (destType == FILE_URI) {
                            // Do we need to scale the returned file
                            if (this.targetHeight > 0 && this.targetWidth > 0) {
                                try {
                                    // Create an ExifHelper to save the exif data that is lost during compression
                                    String resizePath = DirectoryManager.getTempDirectoryPath(this.cordova.getActivity()) + "/resize.jpg";
                                    ExifHelper exif = new ExifHelper();
                                    try {
                                        if (this.encodingType == JPEG) {
                                            exif.createInFile(resizePath);
                                            exif.readExifData();
                                            rotate = exif.getOrientation();
                                        }
                                    } catch (IOException e) {
                                        e.printStackTrace();
                                    }

                                    OutputStream os = new FileOutputStream(resizePath);
                                    bitmap.compress(Bitmap.CompressFormat.JPEG, this.mQuality, os);
                                    os.close();

                                    // Restore exif data to file
                                    if (this.encodingType == JPEG) {
                                        exif.createOutFile(FileUtils.getRealPathFromURI(uri, this.cordova));
                                        exif.writeExifData();
                                    }

                                    // The resized image is cached by the app in order to get around this and not have to delete you
                                    // application cache I'm adding the current system time to the end of the file url.
                                    this.callbackContext.success("file://" + resizePath + "?" + System.currentTimeMillis());
                                } catch (Exception e) {
                                    e.printStackTrace();
                                    this.failPicture("Error retrieving image.");
                                }
                            }
                            else {
                                this.callbackContext.success(uri.toString());
                            }
                        }
                        if (bitmap != null) {
	                        bitmap.recycle();
	                        bitmap = null;
                        }
                        System.gc();
                    }
                }
            }
            else if (resultCode == Activity.RESULT_CANCELED) {
                this.failPicture("Selection cancelled.");
            }
            else {
                this.failPicture("Selection did not complete!");
            }
        }
    }

    /**
     * Figure out if the bitmap should be rotated. For instance if the picture was taken in
     * portrait mode
     *
     * @param rotate
     * @param bitmap
     * @return rotated bitmap
     */
    private Bitmap getRotatedBitmap(int rotate, Bitmap bitmap, ExifHelper exif) {
        Matrix matrix = new Matrix();
        if (rotate == 180) {
            matrix.setRotate(rotate);
        } else {
            matrix.setRotate(rotate, (float) bitmap.getWidth() / 2, (float) bitmap.getHeight() / 2);
        }
        bitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);
        exif.resetOrientation();
        return bitmap;
    }

    /**
     * In the special case where the default width, height and quality are unchanged
     * we just write the file out to disk saving the expensive Bitmap.compress function.
     *
     * @param uri
     * @throws FileNotFoundException
     * @throws IOException
     */
    private void writeUncompressedImage(Uri uri) throws FileNotFoundException,
            IOException {
        FileInputStream fis = new FileInputStream(FileUtils.stripFileProtocol(imageUri.toString()));
        OutputStream os = this.cordova.getActivity().getContentResolver().openOutputStream(uri);
        byte[] buffer = new byte[4096];
        int len;
        while ((len = fis.read(buffer)) != -1) {
            os.write(buffer, 0, len);
        }
        os.flush();
        os.close();
        fis.close();
    }

    /**
     * Create entry in media store for image
     *
     * @return uri
     */
    private Uri getUriFromMediaStore() {
        ContentValues values = new ContentValues();
        values.put(android.provider.MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
        Uri uri;
        try {
            uri = this.cordova.getActivity().getContentResolver().insert(android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
        } catch (UnsupportedOperationException e) {
            LOG.d(LOG_TAG, "Can't write to external media storage.");
            try {
                uri = this.cordova.getActivity().getContentResolver().insert(android.provider.MediaStore.Images.Media.INTERNAL_CONTENT_URI, values);
            } catch (UnsupportedOperationException ex) {
                LOG.d(LOG_TAG, "Can't write to internal media storage.");
                return null;
            }
        }
        return uri;
    }

    /**
     * Return a scaled bitmap based on the target width and height
     *
     * @param imagePath
     * @return
     */
    private Bitmap getScaledBitmap(String imagePath) {
        // If no new width or height were specified return the original bitmap
        if (this.targetWidth <= 0 && this.targetHeight <= 0) {
            return BitmapFactory.decodeFile(imagePath);
        }

        // figure out the original width and height of the image
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inJustDecodeBounds = true;
        BitmapFactory.decodeFile(imagePath, options);

        // determine the correct aspect ratio
        int[] widthHeight = calculateAspectRatio(options.outWidth, options.outHeight);

        // Load in the smallest bitmap possible that is closest to the size we want
        options.inJustDecodeBounds = false;
        options.inSampleSize = calculateSampleSize(options.outWidth, options.outHeight, this.targetWidth, this.targetHeight);
        Bitmap unscaledBitmap = BitmapFactory.decodeFile(imagePath, options);
        if (unscaledBitmap == null) {
            return null;
        }

        return Bitmap.createScaledBitmap(unscaledBitmap, widthHeight[0], widthHeight[1], true);
    }

    /**
     * Maintain the aspect ratio so the resulting image does not look smooshed
     *
     * @param origWidth
     * @param origHeight
     * @return
     */
    public int[] calculateAspectRatio(int origWidth, int origHeight) {
        int newWidth = this.targetWidth;
        int newHeight = this.targetHeight;

        // If no new width or height were specified return the original bitmap
        if (newWidth <= 0 && newHeight <= 0) {
            newWidth = origWidth;
            newHeight = origHeight;
        }
        // Only the width was specified
        else if (newWidth > 0 && newHeight <= 0) {
            newHeight = (newWidth * origHeight) / origWidth;
        }
        // only the height was specified
        else if (newWidth <= 0 && newHeight > 0) {
            newWidth = (newHeight * origWidth) / origHeight;
        }
        // If the user specified both a positive width and height
        // (potentially different aspect ratio) then the width or height is
        // scaled so that the image fits while maintaining aspect ratio.
        // Alternatively, the specified width and height could have been
        // kept and Bitmap.SCALE_TO_FIT specified when scaling, but this
        // would result in whitespace in the new image.
        else {
            double newRatio = newWidth / (double) newHeight;
            double origRatio = origWidth / (double) origHeight;

            if (origRatio > newRatio) {
                newHeight = (newWidth * origHeight) / origWidth;
            } else if (origRatio < newRatio) {
                newWidth = (newHeight * origWidth) / origHeight;
            }
        }

        int[] retval = new int[2];
        retval[0] = newWidth;
        retval[1] = newHeight;
        return retval;
    }

    /**
     * Figure out what ratio we can load our image into memory at while still being bigger than
     * our desired width and height
     *
     * @param srcWidth
     * @param srcHeight
     * @param dstWidth
     * @param dstHeight
     * @return
     */
    public static int calculateSampleSize(int srcWidth, int srcHeight, int dstWidth, int dstHeight) {
        final float srcAspect = (float)srcWidth / (float)srcHeight;
        final float dstAspect = (float)dstWidth / (float)dstHeight;

        if (srcAspect > dstAspect) {
            return srcWidth / dstWidth;
        } else {
            return srcHeight / dstHeight;
        }
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
     * Cleans up after picture taking. Checking for duplicates and that kind of stuff.
     * @param newImage
     */
    private void cleanup(int imageType, Uri oldImage, Uri newImage, Bitmap bitmap) {
        if (bitmap != null) {
            bitmap.recycle();
        }

        // Clean up initial camera-written image file.
        (new File(FileUtils.stripFileProtocol(oldImage.toString()))).delete();

        checkForDuplicateImage(imageType);
        // Scan for the gallery to update pic refs in gallery
        if (this.saveToPhotoAlbum && newImage != null) {
            this.scanForGallery(newImage);
        }

        System.gc();
    }

    /**
     * Used to find out if we are in a situation where the Camera Intent adds to images
     * to the content store. If we are using a FILE_URI and the number of images in the DB
     * increases by 2 we have a duplicate, when using a DATA_URL the number is 1.
     *
     * @param type FILE_URI or DATA_URL
     */
    private void checkForDuplicateImage(int type) {
        int diff = 1;
        Uri contentStore = whichContentStore();
        Cursor cursor = queryImgDB(contentStore);
        int currentNumOfImages = cursor.getCount();

        if (type == FILE_URI && this.saveToPhotoAlbum) {
            diff = 2;
        }

        // delete the duplicate file if the difference is 2 for file URI or 1 for Data URL
        if ((currentNumOfImages - numPics) == diff) {
            cursor.moveToLast();
            int id = Integer.valueOf(cursor.getString(cursor.getColumnIndex(MediaStore.Images.Media._ID)));
            if (diff == 2) {
                id--;
            }
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

    /**
     * Compress bitmap using jpeg, convert to Base64 encoded string, and return to JavaScript.
     *
     * @param bitmap
     */
    public void processPicture(Bitmap bitmap) {
        ByteArrayOutputStream jpeg_data = new ByteArrayOutputStream();
        try {
            if (bitmap.compress(CompressFormat.JPEG, mQuality, jpeg_data)) {
                byte[] code = jpeg_data.toByteArray();
                byte[] output = Base64.encodeBase64(code);
                String js_out = new String(output);
                this.callbackContext.success(js_out);
                js_out = null;
                output = null;
                code = null;
            }
        } catch (Exception e) {
            this.failPicture("Error compressing image.");
        }
        jpeg_data = null;
    }

    /**
     * Send error message to JavaScript.
     *
     * @param err
     */
    public void failPicture(String err) {
        this.callbackContext.error(err);
    }

    private void scanForGallery(Uri newImage) {
        this.scanMe = newImage;
        if(this.conn != null) {
            this.conn.disconnect();
        }
        this.conn = new MediaScannerConnection(this.cordova.getActivity().getApplicationContext(), this);
        conn.connect();
    }

    public void onMediaScannerConnected() {
        try{
            this.conn.scanFile(this.scanMe.toString(), "image/*");
        } catch (java.lang.IllegalStateException e){
            LOG.e(LOG_TAG, "Can't scan file in MediaScanner after taking picture");
        }

    }

    public void onScanCompleted(String path, Uri uri) {
        this.conn.disconnect();
    }
}
