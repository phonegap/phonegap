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
# Changing the JavaScript to Native Bridge Mode #

In Cordova 2.1.0 for iOS, we changed the default bridge mode from using an **iframe** to using **xhr** (XmlHttpRequest). This has proved to fix some [UI issues](https://issues.apache.org/jira/browse/CB-593) and possibly fix [crash issues](https://issues.apache.org/jira/browse/CB-975).

In iOS 4.2.1 however, Cordova defaults back to **iframe** mode because of [a bug](https://issues.apache.org/jira/browse/CB-1296)

To change the bridge mode back to the **xhr** method, do this in your **deviceready** hander:

        var exec = cordova.require('cordova/exec');
        exec.setJsToNativeBridgeMode(exec.jsToNativeModes.XHR_OPTIONAL_PAYLOAD);


To change the bridge mode back to the **iframe** method:

        var exec = cordova.require('cordova/exec');
        exec.setJsToNativeBridgeMode(exec.jsToNativeModes.IFRAME_NAV);
