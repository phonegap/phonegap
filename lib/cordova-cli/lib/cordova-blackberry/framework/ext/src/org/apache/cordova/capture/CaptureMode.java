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

import org.apache.cordova.json4j.JSONException;
import org.apache.cordova.json4j.JSONObject;

public class CaptureMode {

    private String mimeType = null;
    private long height = 0;
    private long width = 0;

    public CaptureMode() {
    }

    public CaptureMode(String type) {
        this.mimeType = type;
    }

    public CaptureMode(String type, long width, long height) {
        this.mimeType = type;
        this.height = height;
        this.width = width;
    }

    public String getMimeType() {
        return mimeType;
    }

    public long getHeight() {
        return height;
    }

    public long getWidth() {
        return width;
    }

    public JSONObject toJSONObject() {
        JSONObject o = new JSONObject();
        try {
            o.put("type", getMimeType());
            o.put("height", getHeight());
            o.put("width", getWidth());
        }
        catch (JSONException ignored) {
        }
        return o;
    }

    public boolean equals(Object o) {
        if (o == this) {
            return true;
        }
        if (!(o instanceof CaptureMode)) {
            return false;
        }
        CaptureMode cm = (CaptureMode)o;
        return ((mimeType == null ? cm.mimeType == null :
            mimeType.equals(cm.mimeType))
            && (width == cm.width)
            && (height == cm.height));
    }

    public int hashCode() {
        int hash = (mimeType != null ? mimeType.hashCode() : 19);
        hash = 37*hash + (int)width;
        hash = 37*hash + (int)height;
        return hash;
    }
}
