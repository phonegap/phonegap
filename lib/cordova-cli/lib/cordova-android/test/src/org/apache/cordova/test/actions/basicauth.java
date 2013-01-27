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
package org.apache.cordova.test.actions;

import android.os.Bundle;
import org.apache.cordova.*;

public class basicauth extends DroidGap {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        super.init();

        // LogCat: onReceivedHttpAuthRequest(browserspy.dk:80,BrowserSpy.dk - HTTP Password Test)
        AuthenticationToken token = new AuthenticationToken();
        token.setUserName("test");
        token.setPassword("test");
        super.setAuthenticationToken(token, "browserspy.dk:80", "BrowserSpy.dk - HTTP Password Test");

        // Add web site to whitelist
        Config.init();
        Config.addWhiteListEntry("http://browserspy.dk*", true);

        // Load test
        super.loadUrl("file:///android_asset/www/basicauth/index.html");
    }

}
