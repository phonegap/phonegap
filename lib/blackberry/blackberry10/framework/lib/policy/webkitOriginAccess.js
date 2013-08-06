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

var config = require('./../config'),
    utils = require('./../utils'),
    Whitelist = require('./whitelist').Whitelist,
    LOCAL_URI = "local://",
    FILE_URI = "file://",
    WW_URI = utils.getURIPrefix(),
    _domains = [
        {
            url: LOCAL_URI,
            allowSubDomains: true
        }
    ],
    _webviews = [],
    _isInitialized = false,
    _whitelist = new Whitelist();

function addOriginAccessWhitelistEntry(webview, source, destination, allowSubDomains) {
    webview.addOriginAccessWhitelistEntry(source, destination, !!allowSubDomains);
}

function addDomain(url, allowSubDomains) {
    var parsedUri = utils.parseUri(url);

    allowSubDomains = !!allowSubDomains;

    if (utils.isLocalURI(parsedUri)) {
        url = LOCAL_URI;
    } else if (utils.isFileURI(parsedUri)) {
        url = FILE_URI;
    } else {
        url = parsedUri.source;
    }

    if (_whitelist.isAccessAllowed(url) && !_domains.some(function (domain) {
        return domain.url === url;
    })) {
        _webviews.forEach(function (webview) {
            addOriginAccessWhitelistEntry(webview, url, WW_URI, true);

            _domains.forEach(function (domain) {
                addOriginAccessWhitelistEntry(webview, domain.url, url, allowSubDomains);
                addOriginAccessWhitelistEntry(webview, url, domain.url, domain.allowSubDomains);
            });

        });

        _domains.push({
            url: url,
            allowSubDomains: allowSubDomains
        });
    }
}

function initializeDomains() {
    var accessElements = config.accessList;

    accessElements.forEach(function (element, index, array) {
        var uri = (element.uri === 'WIDGET_LOCAL' ? LOCAL_URI : element.uri);
        addDomain(uri, !!element.allowSubDomain);
    });
}

function initializaWebview(webview) {
    //Always allow file access from local and let the OS deal with permissions
    addOriginAccessWhitelistEntry(webview, LOCAL_URI, FILE_URI, true);
    addOriginAccessWhitelistEntry(webview, FILE_URI, LOCAL_URI, true);
    //Always allow LOCAL access to URIs
    addOriginAccessWhitelistEntry(webview, LOCAL_URI, WW_URI, true);

    _domains.forEach(function (domain, domainIndex, domainArray) {
        var i,
            nextDomain;

        if (domain.uri !== LOCAL_URI) {
            addOriginAccessWhitelistEntry(webview, domain.url, WW_URI, true);
        }

        for (i = domainIndex + 1; i < domainArray.length; i++) {
            nextDomain = domainArray[i];
            addOriginAccessWhitelistEntry(webview, domain.url, nextDomain.url, nextDomain.allowSubDomains);
            addOriginAccessWhitelistEntry(webview, nextDomain.url, domain.url, domain.allowSubDomains);
        }
    });

}

module.exports = {

    addWebView: function (webview) {
        if (_webviews.indexOf(webview) === -1) {
            _webviews.push(webview);
            initializaWebview(webview);
            if (!_isInitialized) {
                initializeDomains();
                _isInitialized = true;
            }
        }
    },

    addOriginAccess: function (origin, allowSubDomains) {
        if (!_isInitialized) {
            initializeDomains();
            _isInitialized = true;
        }
        addDomain(origin, allowSubDomains);
    }
};
