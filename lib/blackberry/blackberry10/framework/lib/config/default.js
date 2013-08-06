/*
 * Copyright 2010-2011 Research In Motion Limited.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = {
    configXML: "config.xml",
    configXMLDoc: null,

    backButtonBehavior: "back",
    customHeaders: {},
    version: "1.0.0",

    author: "",
    authorURL: "",
    authorEmail: "",
    copyright: "",
    content: "index.html",
    contentCharset: "",
    contentType: "",
    description: "",
    icon: "AIRApp_72.png",
    iconHover: "",
    id: "",
    license: "",
    licenseURL: "",
    name: "WebWorksAppTemplate",

    navigationMode: "pointer",

    preferredTransports: null,
    transportTimeout: 300000,

    hasMultiAccess: false,
    widgetExtensions: null,
    featureTable: null,
    accessList: null,
    permissions: null,

    loadingScreenColor: "#FFFFFF",
    backgroundImage: "",
    foregroundImage: "",
    onFirstLaunch: false,
    onLocalPageLoad: false,
    onRemotePageLoad: false,
    transitionType: -1,
    transitionDuration: 250,
    transitionDirection: 128,

    disableAllCache: false,
    aggressiveCacheAge: 2592000,
    maxCacheSizeTotal: 1024,
    maxCacheSizeItem: 128,
    maxStandardCacheAge: 2592000,

    runOnStartUp: false,
    allowInvokeParams: false,
    backgroundSource: "",
    foregroundSource: "index.html",
    debugEnabled: false,
    enableFormControl: true,
    enableChildWebView: true,
    enableWebSecurity: true,
    enablePopupBlocker: false
};
