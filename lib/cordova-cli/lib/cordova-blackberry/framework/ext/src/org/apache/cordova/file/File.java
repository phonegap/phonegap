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
package org.apache.cordova.file;

import org.apache.cordova.json4j.JSONException;
import org.apache.cordova.json4j.JSONObject;

public class File {
    private String name = null;
    private String fullPath = null;
    private String type = null;
    private long lastModifiedDate;
    private long size = 0;

    public File(String filePath) {
        this.fullPath = filePath;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public long getLastModifiedDate() {
        return lastModifiedDate;
    }

    public void setLastModifiedDate(long lastModifiedDate) {
        this.lastModifiedDate = lastModifiedDate;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public String getFullPath() {
        return fullPath;
    }

    public JSONObject toJSONObject() {
        JSONObject o = new JSONObject();
        try {
            o.put("fullPath", fullPath);
            o.put("type", type);
            o.put("name", name);
            o.put("lastModifiedDate", lastModifiedDate);
            o.put("size", size);
        }
        catch (JSONException ignored) {
        }
        return o;
    }
}
