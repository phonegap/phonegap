/*
 *  Copyright 2012 Research In Motion Limited.
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
/*global objJSExt */

function JNEXT_() {
    var self = this;
    var m_bFirstRequire = true;

    self.m_arEvents = {};

    self.onPageLoad = function() {
    };

    self.attachToDOM = function() {
        // Make sure JNEXT onPageLoad is called when page load
        //  completes without damaging existing onLoad handlers
        var prevOnLoad = window.onload;
        if( typeof window.onload != 'function') {
            window.onload = self.onPageLoad;
        } else {
            window.onload = function() {
                if(prevOnLoad) {
                    prevOnLoad();
                }

                self.onPageLoad();
            };
        }

        // Unobtrusively add the JNEXT plugin or ActiveX to the DOM
        var objBody = document.getElementsByTagName("body")[0];
        var objDiv = document.createElement('div');
        var strHTML;

        if(window.ActiveXObject) {
            strHTML = '<object id="objJSExt" width="0" height="0" classid="CLSID:C802F39D-BF85-427a-A334-77E501DB62E9" codebase="jnext.ocx"></object>';
            strHTML += '<script language="JavaScript" for="objJSExt" EVENT="Js2nEvent( strEvent )">JNEXT.processEvent(strEvent)</script>';
        } else {
            var strAddSrc = "";
            if(navigator.userAgent.indexOf("Safari") != -1 && navigator.userAgent.indexOf("Windows") != -1) {
                // This hack required on Safari for Windows
                strAddSrc = 'src="./jnext/safari.foo"';
            }
            strHTML = '<embed id="objJSExt" ' + strAddSrc + ' type="application/jnext-scriptable-plugin" width="0" height="0">';
        }

        objDiv.innerHTML = strHTML;
        objBody.appendChild(objDiv);
    };

    self.getosname = function() {
        return objJSExt.sendCmd("osname");
    };

    self.require = function(strLibrary) {
        // Load a required JNEXT plugin
        var strCmd;
        var strVal;
        var arParams;

        if(m_bFirstRequire) {
            strCmd = "userAgent " + navigator.userAgent;
            strVal = objJSExt.sendCmd(strCmd);
            arParams = strVal.split(" ");
            if(arParams[0] != "Ok") {
                alert("userAgent " + strVal);
                return false;
            }
            self.m_bFirstRequire = false;
        }
        strCmd = "Require " + strLibrary;
        strVal = objJSExt.sendCmd(strCmd);
        arParams = strVal.split(" ");
        if(arParams[0] != "Ok") {
            alert("Require " + strVal);
            return false;
        }

        return true;
    };

    self.createObject = function(strObjName) {
        // Create an instance of a native object
        var strCmd;
        var strVal;
        var arParams;
        strVal = objJSExt.sendCmd("CreateObject " + strObjName);
        arParams = strVal.split(" ");
        if(arParams[0] != "Ok") {
            alert("CreateObject: " + strVal);
            return "";
        }
        return arParams[1];
    };

    self.invoke = function(strObjId, strMethod, strParams) {
        // Invoke a method of a given instance of a native object
        var strCmd = "InvokeMethod " + strObjId + " " + strMethod;

        if( typeof (strParams) != "undefined") {
            strCmd += " " + strParams;
        }

        return objJSExt.sendCmd(strCmd);
    };

    self.registerEvents = function(objNotify) {
        var strId = objNotify.getId();
        self.m_arEvents[strId] = objNotify;
    };

    self.unregisterEvents = function(objNotify) {
        var strId = objNotify.getId();
        delete self.m_arEvents[strId];
    };

    self.processEvent = function(strNativeEvt) {
        // Process an event received from native code. The event
        // containes the target JavaScript object id and the
        // relevant parameters.

        var arParams = strNativeEvt.split(" ");
        var strObjId = arParams[0];
        var strEvent = strNativeEvt.substring(strObjId.length + 1);

        var objNotify = self.m_arEvents[strObjId];
        if( typeof (objNotify) == 'undefined') {
            alert("Warning: No object with Id " + strId + " found for event " + strEvent);
            return;
        }

        // This will now be handled by the appropriate JavaScript
        // JNEXT extension object
        objNotify.onEvent(strEvent);
    };

    self.ajaxGet = function(strUrl, id) {
        var req = false;
        if(window.ActiveXObject) {
            try {
                req = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                try {
                    req = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (ex) {
                }
            }
        } else if(window.XMLHttpRequest) {
            req = new XMLHttpRequest();
        } else {
            return false;
        }

        req.onreadystatechange = function() {
            if(req.readyState == 4 && (req.status == 200 || window.location.href.indexOf("http") == -1)) {
                self.onAjaxRecv(req.responseText);
            }
        };

        req.open('GET', strUrl, true);
        req.send(null);
    };

    self.onAjaxRecv = function(strContent) {
        alert(strContent);
    };

    self.attachToDOM();
}

window.JNEXT = new JNEXT_();
module.exports = JNEXT;
