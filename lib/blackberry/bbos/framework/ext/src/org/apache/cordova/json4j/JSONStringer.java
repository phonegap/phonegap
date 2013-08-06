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
package org.apache.cordova.json4j;

import java.io.IOException;

import org.apache.cordova.json4j.internal.JSON4JStringWriter;

/**
 * This class implements a JSONSringer, a basic convenience subclass of JSONWriter to allow for
 * generating JSON strings quickly.   This class exists for API compatibility to other popular
 * JSON parsers.
 */
public class JSONStringer extends JSONWriter {

    public JSONStringer() {
        super(new JSON4JStringWriter());
    }

    /**
     * Return a string of the stringer contents.  This also terminates the
     * Stringer and it cannot be used again.  If any errors occur while trying to generate the JSON
     * it returns an empty string.
     */
    public String toString() {
        try {
            super.flush();
            super.close();
            return ((JSON4JStringWriter)writer).toString();
        } catch (Exception ex) {
            /* Squelch */
            return "";
        }
    }

    /**
     * Over-ride to do nothing for the stringer.  Only toString() terminates the stringer object.
     */
    public void close() throws IOException, IllegalStateException {
        // Do nothing.
    }
}
