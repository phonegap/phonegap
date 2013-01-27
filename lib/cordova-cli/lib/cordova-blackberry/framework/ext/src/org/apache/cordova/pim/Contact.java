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
package org.apache.cordova.pim;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

import javax.microedition.io.Connector;
import javax.microedition.io.HttpConnection;
import javax.microedition.pim.PIM;
import javax.microedition.pim.PIMException;
import javax.microedition.pim.PIMItem;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.http.HttpUtils;
import org.apache.cordova.json4j.JSONArray;
import org.apache.cordova.json4j.JSONException;
import org.apache.cordova.util.FileUtils;
import org.apache.cordova.util.Logger;

import net.rim.blackberry.api.pdap.BlackBerryContact;
import net.rim.blackberry.api.pdap.BlackBerryContactList;
import net.rim.device.api.io.Base64InputStream;
import net.rim.device.api.io.FileNotFoundException;
import net.rim.device.api.io.IOUtilities;
import net.rim.device.api.io.http.HttpProtocolConstants;
import net.rim.device.api.math.Fixed32;
import net.rim.device.api.system.Bitmap;
import net.rim.device.api.system.EncodedImage;
import net.rim.device.api.system.PNGEncodedImage;

/**
 * Performs operations on Contacts stored in the BlackBerry Contacts database.
 */
public class Contact extends Plugin {

    /**
     * Possible actions
     */
    public static final int ACTION_SET_PICTURE  = 0;
    public static final int ACTION_GET_PICTURE  = 1;

    /**
     * Maximum object size is 64KB in contact database.  The raw image is Base64
     * encoded before insertion.
     * Base64 = (Bytes + 2 - ((Bytes + 2) MOD 3)) / 3 * 4
     */
    private static final long MAX_BYTES = 46080L;

    /**
     * Executes the requested action and returns a PluginResult.
     *
     * @param action        The action to execute.
     * @param callbackId    The callback ID to be invoked upon action completion.
     * @param args          JSONArry of arguments for the action.
     * @return              A PluginResult object with a status and message.
     */
    public PluginResult execute(String action, JSONArray args, String callbackId) {

        PluginResult result = null;
        int a = getAction(action);

        // perform specified action
        if (a == ACTION_SET_PICTURE) {
            // get parameters
            String uid;
            String type;
            String value;
            try {
                uid = args.isNull(0) ? null : args.getString(0);
                type = args.isNull(1) ? null : args.getString(1).toLowerCase();
                value = args.isNull(2) ? null : args.getString(2);
            } catch (JSONException e) {
                Logger.log(this.getClass().getName() + ": " + e);
                return new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                        "Invalid or missing photo parameters");
            }

            // get the raw image data
            byte[] photo = null;
            if ("base64".equals(type)) {
                // decode the image string
                try {
                    photo = decodeBase64(value.getBytes());
                }
                catch (Exception e) {
                    Logger.log(this.getClass().getName() + ": " + e);
                    return new PluginResult(PluginResult.Status.ERROR, "Unable to decode image.");
                }
            }
            else {
                // retrieve the photo from URL
                try {
                    photo = getPhotoFromUrl(value);
                }
                catch (Exception e) {
                    Logger.log(this.getClass().getName() + ": " + e);
                    return new PluginResult(PluginResult.Status.ERROR, "Unable to retrieve image at " + value);
                }
            }

            // set the contact picture
            result = setPicture(uid, photo);
        }
        else if (a == ACTION_GET_PICTURE) {
            // get required parameters
            String uid = null;
            try {
                uid = args.getString(0);
            } catch (JSONException e) {
                Logger.log(this.getClass().getName() + ": " + e);
                return new PluginResult(PluginResult.Status.JSON_EXCEPTION,
                        "Invalid or missing image URL");
            }
            result = getPictureURI(uid);
        }
        else {
            // invalid action
            result = new PluginResult(PluginResult.Status.INVALID_ACTION,
                    "Contact: invalid action " + action);
        }

        return result;
    }

    /**
     * Decodes the base64 encoded data provided.
     * @param data Base64 encoded data
     * @return byte array containing decoded data
     * @throws IllegalArgumentException if encodedData is null
     * @throws IOException if there is an error decoding
     */
    protected byte[] decodeBase64(final byte[] encodedData) throws IllegalArgumentException, IOException {
        if (encodedData == null) {
            throw new IllegalArgumentException();
        }
        ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(encodedData, 0, encodedData.length);
        Base64InputStream base64InputStream = new Base64InputStream(byteArrayInputStream);
        byte[] raw = null;
        try {
            raw = IOUtilities.streamToBytes(base64InputStream);
        }
        finally {
            base64InputStream.close();
        }
        return raw;
    }

    /**
     * Sets the photo of the specified contact to the picture at the specified URL.
     * Local file-based (file:///) and web-based (http://) URLs are supported.
     * The specified photo is retrieved and a scaled down copy is created and stored
     * in the contacts database.
     * @param uid   Unique identifier of contact
     * @param url   URL of the photo to use for contact photo
     * @return PluginResult providing status of operation
     */
    protected PluginResult setPicture(final String uid, final byte[] photo) {
        Logger.log(this.getClass().getName() + ": setting picture for contact " + uid);

        // We need to ensure the image encoding is supported, and resize the image
        // so that it will fit in the persistent store.  Note: testing indicates
        // that the max image size is 64KB, so we scale it down considerably.
        byte[] thumbnail = null;
        try {
            thumbnail = resizeImage(photo);
        }
        catch (IllegalArgumentException e) {
            // unsupported image format
            Logger.log(this.getClass().getName() + ": " + e);
            return new PluginResult(PluginResult.Status.JSON_EXCEPTION, "Unsupported image format.");
        }

        // lookup contact and save the photo
        BlackBerryContactList contactList = null;
        try {
            // lookup the contact
            contactList = (BlackBerryContactList) PIM.getInstance().openPIMList(
                    PIM.CONTACT_LIST, PIM.READ_WRITE);
            BlackBerryContact contact = contactList.getByUID(uid);
            if (contact == null) {
                return new PluginResult(PluginResult.Status.ERROR, "Contact " + uid + " not found.");
            }

            // save photo image
            if(contact.countValues(javax.microedition.pim.Contact.PHOTO) > 0) {
                contact.setBinary(javax.microedition.pim.Contact.PHOTO, 0,
                        PIMItem.ATTR_NONE, thumbnail, 0, thumbnail.length);
            }
            else {
                contact.addBinary(javax.microedition.pim.Contact.PHOTO,
                        PIMItem.ATTR_NONE, thumbnail, 0, thumbnail.length);
            }

            // commit contact record to persistent store
            contact.commit();
        }
        catch (Exception e) {
            Logger.log(this.getClass().getName() + ": " + e);
            return new PluginResult(PluginResult.Status.ERROR, e.getMessage());
        }
        finally {
            // be sure to close the contact list to avoid locking it up
            if (contactList != null) {
                try { contactList.close(); } catch (PIMException ignored) { }
            }
        }

        return new PluginResult(PluginResult.Status.OK);
    }

    /**
     * Returns the URI of the contact photo.  The photo image is extracted from
     * the Contacts database and saved to a temporary file system.  The URI of
     * the saved photo is returned.
     * @param uid unique Contact identifier
     * @return PluginResult containing photo URI
     */
    protected PluginResult getPictureURI(final String uid) {
        Logger.log(this.getClass().getName() + ": retrieving picture for contact " + uid);
        String photoPath = null;

        // lookup contact
        BlackBerryContactList contactList = null;
        try {
            // lookup the contact
            contactList = (BlackBerryContactList) PIM.getInstance().openPIMList(
                    PIM.CONTACT_LIST, PIM.READ_WRITE);
            BlackBerryContact contact = contactList.getByUID(uid);
            if (contact == null) {
                return new PluginResult(PluginResult.Status.ERROR, "Contact " + uid + " not found.");
            }

            // get photo
            if(contact.countValues(javax.microedition.pim.Contact.PHOTO) > 0) {
                // decode from base64
                byte[] encPhoto = contact.getBinary(javax.microedition.pim.Contact.PHOTO, 0);
                byte[] photo = Base64InputStream.decode(encPhoto, 0, encPhoto.length);

                // save photo to file system and return file URI
                saveImage(uid, photo);
            }
        }
        catch (Exception e) {
            Logger.log(this.getClass().getName() + ": " + e);
            return new PluginResult(PluginResult.Status.ERROR, e.getMessage());
        }
        finally {
            // be sure to close the contact list to avoid locking it up
            if (contactList != null) {
                try { contactList.close(); } catch (PIMException ignored) { }
            }
        }

        return new PluginResult(PluginResult.Status.OK, photoPath);
    }

    /**
     * Retrieves the raw image data from the URL provided.
     * @param url  URL of the image
     * @return raw image data from the URL provided
     * @throws FileNotFoundException - if file URL could not be found
     * @throws IOException - if there was an error processing the image file
     */
    protected byte[] getPhotoFromUrl(final String url) throws FileNotFoundException, IOException {
        byte[] photo = null;

        // externally hosted image
        if (url != null && url.startsWith("http")) {
            // open connection
            HttpConnection conn = HttpUtils.getHttpConnection(url);
            if (conn == null) {
                throw new IllegalArgumentException("Invalid URL: " + url);
            }

            // retrieve image
            InputStream in = null;
            try {
                conn.setRequestMethod(HttpConnection.GET);
                conn.setRequestProperty(
                        HttpProtocolConstants.HEADER_USER_AGENT,
                        System.getProperty("browser.useragent"));
                conn.setRequestProperty(
                        HttpProtocolConstants.HEADER_KEEP_ALIVE, "300");
                conn.setRequestProperty(
                        HttpProtocolConstants.HEADER_CONNECTION, "keep-alive");
                conn.setRequestProperty(
                        HttpProtocolConstants.HEADER_CONTENT_TYPE,
                        HttpProtocolConstants.CONTENT_TYPE_IMAGE_STAR);

                // send request and get response
                int rc = conn.getResponseCode();
                if (rc != HttpConnection.HTTP_OK) {
                    throw new IOException("HTTP connection error: " + rc);
                }
                in = conn.openDataInputStream();
                photo = IOUtilities.streamToBytes(in, 64*1024);
                in.close();
            }
            finally {
                conn.close();
            }
        }
        // local image file
        else {
            photo = FileUtils.readFile(url, Connector.READ);
        }
        return photo;
    }

    /**
     * Saves the contact image to a temporary directory.
     * @param uid unique contact identifier
     * @param photo encoded photo image data
     * @throws IOException
     */
    protected void saveImage(final String uid, final byte[] photo) throws IOException {
        // create a temporary directory to store the contacts photos
        String contactsDir = "Contacts";
        String tempDir = FileUtils.getApplicationTempDirPath() + contactsDir;
        if (!FileUtils.exists(tempDir)) {
            FileUtils.createTempDirectory(contactsDir);
        }

        // save the photo image to the temporary directory, overwriting if necessary
        String photoPath = tempDir + FileUtils.FILE_SEPARATOR + uid + ".png";
        if (FileUtils.exists(photoPath)) {
            FileUtils.delete(photoPath);
        }
        FileUtils.writeFile(photoPath, photo, 0);
    }

    /**
     * Creates a scaled copy of the specified image.
     * @param photo  Raw image data
     * @return a scaled-down copy of the image provided
     * @throws IllegalArgumentException
     */
    protected byte[] resizeImage(byte[] data) throws IllegalArgumentException {
        // create an EncodedImage to make sure the encoding is supported
        EncodedImage image = EncodedImage.createEncodedImage(data, 0, data.length);

        // we're limited to 64KB encoding size, do we need to scale?
        if (data.length < MAX_BYTES) {
            return data;
        }

        // if so, try to maintain aspect ratio of original image and set max resolution
        int srcWidth = image.getWidth();
        int srcHeight = image.getHeight();
        int dstWidth, dstHeight;
        int max_rez = 150;
        if (srcWidth > srcHeight) {
            dstWidth = max_rez;
            dstHeight = (dstWidth * srcHeight)/srcWidth;
        }
        else if (srcWidth < srcHeight) {
            dstHeight = max_rez;
            dstWidth = (dstHeight * srcWidth)/srcHeight;
        }
        else {
            dstWidth = max_rez;
            dstHeight = max_rez;
        }

        // calculate scale factors
        int currentWidthFixed32 = Fixed32.toFP(srcWidth);
        int currentHeightFixed32 = Fixed32.toFP(srcHeight);
        int requiredWidthFixed32 = Fixed32.toFP(dstWidth);
        int requiredHeightFixed32 = Fixed32.toFP(dstHeight);
        int scaleXFixed32 = Fixed32.div(currentWidthFixed32,
                requiredWidthFixed32);
        int scaleYFixed32 = Fixed32.div(currentHeightFixed32,
                requiredHeightFixed32);

        // scale image (must be redrawn)
        EncodedImage thumbnail = image.scaleImage32(scaleXFixed32, scaleYFixed32);
        Bitmap bitmap = thumbnail.getBitmap();

        // convert back to bytes
        PNGEncodedImage png = PNGEncodedImage.encode(bitmap);
        byte[] thumbData = png.getData();
        Logger.log(this.getClass().getName() + ": photo size reduced from " + data.length + " to " + thumbData.length);
        return thumbData;
    }

    /**
     * Returns action to perform.
     * @param action action to perform
     * @return action to perform
     */
    protected static int getAction(String action) {
        if ("setPicture".equals(action)) return ACTION_SET_PICTURE;
        if ("getPicture".equals(action)) return ACTION_GET_PICTURE;
        return -1;
    }

    /**
     * Identifies if action to be executed returns a value and should be run synchronously.
     *
     * @param action    The action to execute
     * @return          T=returns value
     */
    public boolean isSynch(String action) {
        if (getAction(action) == ACTION_GET_PICTURE) {
            return true;
        }
        else {
            return super.isSynch(action);
        }
    }
}
