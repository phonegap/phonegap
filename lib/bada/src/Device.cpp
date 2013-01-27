/*
 * Device.cpp
 *
 *  Created on: Mar 8, 2011
 *      Author: Anis Kadri <anis@adobe.com>
 *
 *  Licensed to the Apache Software Foundation (ASF) under one
 *  or more contributor license agreements.  See the NOTICE file
 *  distributed with this work for additional information
 *  regarding copyright ownership.  The ASF licenses this file
 *  to you under the Apache License, Version 2.0 (the
 *  "License"); you may not use this file except in compliance
 *  with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 */

#include "../inc/Device.h"

Device::Device() {
	// TODO Auto-generated constructor stub

}

Device::Device(Web* pWeb): CordovaCommand(pWeb) {

}

Device::~Device() {
	// TODO Auto-generated destructor stub
}

void
Device::Run(const String& command) {

}

result
Device::SetDeviceInfo() {
	result r = E_SUCCESS;
	String platformVersion;
	String apiVersion;
	String imei;
	int screen_height = 0;
	int screen_width = 0;

	/*screen*/
    r = SystemInfo::GetValue("ScreenWidth", screen_width);
    TryCatch(r == E_SUCCESS, , "SystemInfo: To get a value is failed");

    r = SystemInfo::GetValue("ScreenHeight", screen_height);
    TryCatch(r == E_SUCCESS, , "SystemInfo: To get a value is failed");

    r = SystemInfo::GetValue("PlatformVersion", platformVersion);
    TryCatch(r == E_SUCCESS, , "SystemInfo: To get a value is failed");

    r = SystemInfo::GetValue("APIVersion", apiVersion);
    TryCatch(r == E_SUCCESS, , "SystemInfo: To get a value is failed");

    r = SystemInfo::GetValue("IMEI", imei);
    TryCatch(r == E_SUCCESS, , "SystemInfo: To get a value is failed");

    if(r == E_SUCCESS) {
    	String res;
    	res.Format(1024, L"window.device={platform:'bada',version:'%S',name:'n/a',cordova:'2.4.0',uuid:'%S'}", platformVersion.GetPointer(), imei.GetPointer());
    	//AppLogDebug("%S", res.GetPointer());
    	pWeb->EvaluateJavascriptN(res);
    }
    return r;

CATCH:
	AppLog("Error = %s\n", GetErrorMessage(r));
    return r;
}
