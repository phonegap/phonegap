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

public class Entry {

    private boolean isDirectory = false;
    private String name = null;
    private String fullPath = null;

    public boolean isDirectory() {
        return isDirectory;
    }

    public void setDirectory(boolean isDirectory) {
        this.isDirectory = isDirectory;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFullPath() {
        return fullPath;
    }

    public void setFullPath(String fullPath) {
        this.fullPath = fullPath;
    }

    public JSONObject toJSONObject() {
        JSONObject o = new JSONObject();
        try {
            o.put("isDirectory", isDirectory);
            o.put("isFile", !isDirectory);
            o.put("name", name);
            o.put("fullPath", fullPath);
        }
        catch (JSONException ignored) {
        }
        return o;
    }
}
