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

var util = require("../utils");

// Removes the start and end slashes from the path
function _trimSurroundingSlashes(path) {
    // Trim starting slash
    if (util.startsWith(path, "/")) {
        path = path.substr(1);
    }

    // Trim ending slash
    if (util.endsWith(path, "/")) {
        path = path.substr(0, path.length - 1);
    }

    return path;
}

// Determines the depth of the given path
// Folder path must not include the scheme or the host
function _determineDepth(folderPath) {
    var depthCount = 0;

    // Replace all backslashes with forward slash
    folderPath = folderPath.replace("\\", "/");

    // Special case: "/" is the given path
    if (folderPath === "/") {
        return 0;
    }

    folderPath = _trimSurroundingSlashes(folderPath);

    // Count slashes remaining
    while (folderPath.indexOf("/") !== -1) {
        depthCount = depthCount + 1;

        // Add 1 to skip the slash
        folderPath = folderPath.substring(folderPath.indexOf("/") + 1);
    }

    // Add one more for the remaining folder
    depthCount += 1;

    return depthCount;
}

// Parse a folder path up to the desired depth
function _getPath(folderPath, desiredDepth) {
    var depthCount = 0, builtPath = "";

    // Special case: Desired depth is 0
    if (desiredDepth === 0) {
        return "/";
    }

    // Replace all backslashes with forward slash
    folderPath = folderPath.replace("\\", "/");

    folderPath = _trimSurroundingSlashes(folderPath);

    // Count slashes remaining
    while (depthCount < desiredDepth) {
        depthCount += 1;

        // Add 1 to skip the slash
        builtPath += "/" + folderPath.substring(0, folderPath.indexOf('/'));
        folderPath = folderPath.substring(folderPath.indexOf('/') + 1);
    }

    return builtPath;
}

function WebFolderAccessManager() {
    this._pathCollection = {};
    this._maxPathLength = 0;
}

WebFolderAccessManager.prototype.addAccess = function (folderPath, access) {
    if (!folderPath) {
        folderPath = "/";
    }

    // Trim surrounding slashes for consistency
    // The root "/" is a special case that does not need this trimming
    if (folderPath !== "/") {
        folderPath = "/" + _trimSurroundingSlashes(folderPath);
    }

    folderPath = folderPath.toLowerCase();

    this._pathCollection[folderPath] = access;

    // Determine the depth of the path
    this._maxPathLength = Math.max(this._maxPathLength, _determineDepth(folderPath));
};

WebFolderAccessManager.prototype.getAccess = function (folderPath) {
    var depth = _determineDepth(folderPath);
    return this.getAccessRecursively(folderPath, depth);
};

WebFolderAccessManager.prototype.fetchAccess = function (folderPath) {
    var queryIndex, folderPathWildcard;

    if (!this._pathCollection.hasOwnProperty(folderPath)) {
        // If there isn't an exact match and folderPath contains query string,
        // check if the path collection contains an access with the same folderPath
        // but with wildcard query
        if ((queryIndex = folderPath.indexOf("?")) > -1) {
            folderPathWildcard = folderPath.slice(0, queryIndex + 1) + "*";

            if (this._pathCollection.hasOwnProperty(folderPathWildcard)) {
                return this._pathCollection[folderPathWildcard];
            }
        }

        return null;
    } else {
        return this._pathCollection[folderPath];
    }
};

WebFolderAccessManager.prototype.getAccessRecursively = function (folderPath, pathLength) {
    var fetchedAccess,
        newPathLength,
        newPath;

    if (!folderPath) {
        return null;
    }

    folderPath = folderPath.toLowerCase();

    if (!!(fetchedAccess = this.fetchAccess(folderPath))) {
        return fetchedAccess;
    } else {
        // Truncate the end portion of the path and try again
        newPathLength = Math.min(this._maxPathLength, pathLength - 1);
        newPath = _getPath(folderPath, newPathLength);

        return this.getAccessRecursively(newPath, newPathLength);
    }
};

function WebFolderAccess() {
    this._mgr = new WebFolderAccessManager();
}

// folderPath - folder path must not include the scheme or the host
WebFolderAccess.prototype.addAccess = function (folderPath, access) {
    this._mgr.addAccess(folderPath, access);
};

// folderPath - folder path must not include the scheme or the host
WebFolderAccess.prototype.getAccess = function (folderPath) {
    return this._mgr.getAccess(folderPath);
};

exports.WebFolderAccess = WebFolderAccess;
