<!--
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
# 
# http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
-->
# Cordova Custom URL Scheme Handling #

For an iOS app, you can add a URL Scheme handler in your app's Info.plist so that your app launches when another iOS app (like Mobile Safari) launches a URL with your custom scheme.

1. Register your custom scheme in your app's Info.plist: the instructions are [here](http://developer.apple.com/library/ios/#documentation/iPhone/Conceptual/iPhoneOSProgrammingGuide/AdvancedAppTricks/AdvancedAppTricks.html#//apple_ref/doc/uid/TP40007072-CH7-SW21)
2. In your JavaScript, add a global function **handleOpenURL** which just takes one parameter, which will be a string containing the URL that was launched. Add your code to parse and handle the URL in that global function. This function will be called always if your app was launched from the custom scheme.

        function handleOpenURL(url) {
            // TODO: parse the url, and do something 
        }

        
**IMPORTANT NOTE:** 
        
You **cannot** launch any interactive features like alerts in the **handleOpenURL** code, if you do, your app will hang. Similarly, you should not call any Cordova APIs in there, unless you wrap it first in a setTimeout call, with a timeout value of zero:

        function handleOpenUrl(url) {
             // TODO: parse the url, and do something 
             setTimeout(function() {
                 // TODO: call some Cordova API here
             }, 0);
        }