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

/**
 * Class that implements an exception type thrown by all JSON classes
 * as a common exception when JSON handling errors occur.
 */
public class JSONException extends Exception {

    private Throwable cause;

    /**
     * Constructor for JSON Exception
     * @param message The error that generated the exception.
     */
    public JSONException(String message) {
        super(message);
    }

    /**
     * Constructor for JSON Exception
     * @param t The exception that generated this exception.
     */
    public JSONException(Throwable t) {
        cause = t;
    }

    public void setCause(Throwable t) {
        cause = t;
    }

    /**
     * Method to get the underlying cause of the JSONException
     */
    public Throwable getCause() {
        return cause;
    }
}
