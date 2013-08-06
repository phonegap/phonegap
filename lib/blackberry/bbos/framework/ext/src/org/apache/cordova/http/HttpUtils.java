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
package org.apache.cordova.http;

import javax.microedition.io.HttpConnection;

import org.apache.cordova.CordovaExtension;

import net.rim.device.api.io.transport.ConnectionDescriptor;
import net.rim.device.api.io.transport.ConnectionFactory;

/**
 * BlackBerry devices can connect to the network using a variety of transport
 * types, such as: WI-FI, BES/MDS, BIS, WAP (cellular).  A connection URL must
 * have the appropriate suffix to match the transport type.  This class contains
 * utility methods to retrieve the correct URL for the appropriate transport.
 */
public class HttpUtils
{
    /**
     * This method will open an HTTP connection over the best available transport type.
     * @param url   Connection URL
     */
    public static HttpConnection getHttpConnection(String url)
    {
        HttpConnection httpConn = null;

        // Create ConnectionFactory
        ConnectionFactory factory = new ConnectionFactory();

        // use the factory to get a connection
        ConnectionDescriptor conDescriptor = factory.getConnection(url);

        if (conDescriptor != null) {
           // using the connection
           httpConn = (HttpConnection) conDescriptor.getConnection();
        }

        return httpConn;
    }

    /**
     * Retrieves the cookie from the application browser instance for the specified URL.
     * @param url   Connection URL
     */
    public static String getCookie(String url)
    {
        return CordovaExtension.getBrowserField().getCookieManager().getCookie(url);
    }
}
