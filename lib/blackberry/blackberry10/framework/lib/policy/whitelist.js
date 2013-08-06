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

var WebFolderAccess = require("./folderAccess").WebFolderAccess,
    util = require("../utils");

function _isLocalAccess(access) {
    return access && access.uri === "WIDGET_LOCAL";
}

function _isMatch(access, requestURI) {
    // Look for local first
    if (_isLocalAccess(access)) {
        // Local access always allowed
        //THIS USED TO RETURN TRUE FOR FILE ACCESS
        //I HAVE TURNED IT OFF BECAUSE IT MAKES NO SENSE THAT LOCAL ACCESS ALWAYS MATCHES FILE ACCESS
        return (util.isLocalURI(requestURI));
    } else if (util.isDataURI(requestURI)) {
        // Check for data url
        // data urls are allowed
        return true;
    }

    // Based on widgets 1.0 (access control)
    // http://www.w3.org/TR/2009/WD-widgets-access-20090618/#rfc3987
    var refURI = util.parseUri(access.uri),
        allowSub = access.allowSubDomain;

    if (!requestURI.path) {
        requestURI.path = "/";
    }

    // Start comparison based on widget spec.
    // 1. Compare scheme
    if (refURI.scheme.toLowerCase() !== requestURI.scheme.toLowerCase()) {
        return false;
    }

    // 2. Compare host - if subdoman is false, host must match exactly
    // (referenceURI MUST HAVE host specified - not null.)
    // Special Case: Ignore this condition if we are dealing with file://
    if (!requestURI.authority && !util.isFileURI(requestURI)) {
        return false;
    }

    if (!allowSub && refURI.host.toLowerCase() !== requestURI.host.toLowerCase()) {
        return false;
    }

    // 3. Compare host - if subdomain is true, check for subdomain or match
    if (allowSub && !util.endsWith(requestURI.host.toLowerCase(), "." + refURI.host.toLowerCase()) &&
        requestURI.host.toLowerCase() !== refURI.host.toLowerCase()) {
        return false;
    }

    // 4. Compare port
    if (refURI.port && refURI.port !== requestURI.port) {
        return false;
    }

    // 5.  Compare path+query
    if (!util.startsWith(requestURI.path.toLowerCase(), refURI.path.toLowerCase()) && refURI.query !== "*") {
        return false;
    }

    return true;
}

function _getAccessForPathAndQuery(folderAccess, path, query) {
    if (folderAccess) {
        if (!query) {
            return folderAccess.getAccess(path);
        } else {
            return folderAccess.getAccess(path + "?" + query);
        }
    }

    return null;
}

function AccessManager(config) {
    config = config || require("../config");

    this._accessList = config.accessList;
    this._hasGlobalAccess = config.hasMultiAccess;
    this._authorityCollection = null;
    this._localAccess = null;
}

AccessManager.prototype.getFolderAccess = function (scheme, authority) {
    var key = scheme + "://" + authority;
    key = key.toLowerCase();

    if (this._authorityCollection.hasOwnProperty(key)) {
        return this._authorityCollection[key];
    }

    return null;
};

AccessManager.prototype.putFolderAccess = function (scheme, authority, folderAccess) {
    var key = scheme + "://" + authority;
    key = key.toLowerCase();
    this._authorityCollection[key] = folderAccess;
};

AccessManager.prototype.initializeAuthCollection = function () {
    var folderAccess, currentURI, that = this;

    if (!this._authorityCollection) {
        this._authorityCollection = {};

        if (this._accessList) {
            this._accessList.forEach(function (access) {
                if (_isLocalAccess(access)) {
                    that._localAccess = access;
                } else {
                    currentURI = util.parseUri(access.uri);

                    // Check the authority collection to see if the authority item
                    // we want already exists
                    folderAccess = that.getFolderAccess(currentURI.scheme, currentURI.authority) || new WebFolderAccess();

                    // Add folder path access to the authority item
                    if (!currentURI.query) {
                        folderAccess.addAccess(currentURI.path, access);
                    } else {
                        folderAccess.addAccess(currentURI.path + "?" + currentURI.query, access);
                    }

                    that.putFolderAccess(currentURI.scheme, currentURI.authority, folderAccess);
                }
            });
        }
    }
};

AccessManager.prototype.authorityCheck = function (port, scheme, authority) {
    var originalAuthority = authority;

    if (port) {
        // If authority has a specific port, and the collection does not have an access matches
        // the exact authority, strip port from authority to see if there is a match
        if (!this.getFolderAccess(scheme, authority)) {
            authority = authority.slice(0, authority.lastIndexOf(":"));
            authority = this.authorityCheck("", scheme, authority);
        }

        //If no successful match was found without the port, reset the authority and try with it
        if (!this.getFolderAccess(scheme, authority)) {
            authority = originalAuthority;
        }
    }

    if (authority.indexOf(".") === -1) {
        // If authority is computer name, must have exact match in collection
        if (!this.getFolderAccess(scheme, authority)) {
            return "";
        }

        return authority;
    }

    while (authority && !this.getFolderAccess(scheme, authority)) {
        if (authority.indexOf(".") === -1) {
            return "";
        }
        authority = authority.substring(authority.indexOf(".") + 1);
    }

    return authority;
};

AccessManager.prototype.getFromFolderAccess = function (folderAccess, requestURI) {
    var fetchedAccess = null,
        scheme = requestURI.scheme,
        authority = requestURI.authority,
        path = requestURI.path,
        query = requestURI.query,
        prevAuthority;

    if (!path) {
        fetchedAccess = folderAccess.getAccess("/");
    } else {
        fetchedAccess = _getAccessForPathAndQuery(folderAccess, path, query);
    }

    // Make sure we've got the right one
    while (!fetchedAccess || !_isMatch(fetchedAccess, requestURI)) {
        // There was an auth url that matched, but didnt match the folder structure
        // Try the next level up
        prevAuthority = authority;
        authority = authority.substring(authority.indexOf(".") + 1);
        //If authority hasn't changed, then this loop will continue endlessly because nothing else has changed
        //This will happen when an element has the same authority but no folder access.
        if (prevAuthority === authority) {
            return null;
        }

        // Check for an authority string that has an existing key
        authority = this.authorityCheck(requestURI.port, scheme, authority);
        if (!authority) {
            return null;
        }

        // Retrieve access set for the specified authority
        folderAccess = this.getFolderAccess(scheme, authority);

        // Special case: no access element was found for a file protocol request.
        // This is added since file protocol was allowed through the above check
        if (scheme === "file" && !folderAccess) {
            return null;
        }

        fetchedAccess = _getAccessForPathAndQuery(folderAccess, path, query);
    }

    return fetchedAccess;
};

AccessManager.prototype.getAccessByUrl = function (url) {
    var requestURI = util.parseUri(url),
        authority = requestURI.authority,
        scheme = requestURI.scheme,
        folderAccess,
        fetchedAccess;

    if (util.isAbsoluteURI(requestURI)) {
        // Initialize authority collection if it does not yet exist
        this.initializeAuthCollection();

        // Start with the full authority path and check if an access exists for that path
        // If it does not exist, remove the first section of the authority path and try again

        // Check for an authority string that has an existing key
        // Special case: Allow file, and local protocol to proceed without an authority
        authority = this.authorityCheck(requestURI.port, scheme, authority);
        if (!authority && !(scheme === "file" || scheme === "local" || scheme === "data")) {
            return null;
        }
        // Retrieve access set for the specified authority
        folderAccess = this.getFolderAccess(scheme, authority);

        // Special case: no access was found for a file protocol request
        // This is added since file protocol was allowed through the above check
        if (scheme === "file" && !folderAccess) {
            return null;
        } else if (scheme === "local" && !folderAccess) {
            // If no access element is found with local URI, use local access for this request
            return this._localAccess;
        } else if (scheme === "data") {
            // Always allow data-uris
            return true;
        }

        fetchedAccess = this.getFromFolderAccess(folderAccess, requestURI);

        if (fetchedAccess) {
            return fetchedAccess;
        } else if (this._localAccess && _isMatch(this._localAccess, requestURI)) {
            // If we cannot find a more specific access for this local URI, use local access
            return this._localAccess;
        } else if (folderAccess && _isMatch(folderAccess, requestURI)) {
            return folderAccess;
        }
    }

    return null;
};

AccessManager.prototype.hasGlobalAccess = function () {
    return this._hasGlobalAccess;
};

function Whitelist(config) {
    this._mgr = new AccessManager(config);
}

Whitelist.prototype.getFeaturesForUrl = function (url) {
    var access = this._mgr.getAccessByUrl(url),
        featureIds = [];

    if (access && access.features) {
        access.features.forEach(function (elem) {
            featureIds.push(elem.id);
        });
    }

    return featureIds;
};

Whitelist.prototype.isFeatureAllowed = function (url, feature) {
    var features = this.getFeaturesForUrl(url);

    return !!features && features.reduce(function (found, current) {
        return found || current === feature;
    }, false);
};

Whitelist.prototype.isAccessAllowed = function (url, isXHR) {
    return (this._mgr.hasGlobalAccess() && !isXHR) || !!this._mgr.getAccessByUrl(url);
};

exports.Whitelist = Whitelist;
