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

var fs = require("fs"),
    path = require("path"),
    BBWPignore;

function getDirectory(file) {
    if (file.match("/$")) {
        return file;
    } else if (file.indexOf("/") === -1) {
        return "";
    } else {
        return file.substring(0, file.lastIndexOf("/"));
    }
}

function trim(str) {
    return str.replace(/^\s+|\s+$/g, "");
}

BBWPignore = function (bbwpIgnoreFile, filesToMatch) {
    var comments = [],
        directories = [],
        wildcardEntries = [],
        files = [],
        split,
        matched = [],
        i,
        temparr,
        tempFiles = [];
    temparr = fs.readFileSync(bbwpIgnoreFile, "utf-8").split('\n');

    //switch all the paths to relative, so if someone has passed absolute paths convert them to relative to .bbwpignore
    filesToMatch.forEach(function (file) {
        if (file === path.resolve(file)) { //if path is absolute
            tempFiles.push(path.relative(path.dirname(bbwpIgnoreFile), file));
        } else {
            tempFiles.push(file);
        }
    });
    filesToMatch = tempFiles;

    //run through all the patterns in the bbwpignore and put them in appropriate arrays
    for (i = 0; i < temparr.length; i++) {
        temparr[i] = trim(temparr[i]);
        if (temparr[i] !== "") {
            if (temparr[i].match("^#")) {
                comments.push(temparr[i]);
            } else if (temparr[i].match("^/") && temparr[i].match("/$")) {
                directories.push(temparr[i]);
            } else if (temparr[i].indexOf("*") !== -1) {
                split = temparr[i].split("/");
                if (split[split.length - 1].indexOf("*") !== -1) { // only wildcards in the file name are supported, not in directory names
                    wildcardEntries.push(temparr[i]);
                } else {
                    files.push(temparr[i]);
                }
            } else {
                files.push(temparr[i]);
            }
        }
    }

    //run through all the files and check it against each of the patterns collected earlier
    filesToMatch.forEach(function (fileToMatch) {
        var directory,
            dirOrig = getDirectory(fileToMatch),
            isMatch = false;
        //match directories
        directory = "/" + dirOrig + "/";
        if (directories.indexOf(directory) !== -1) {
            matched.push(fileToMatch);
            //add the directory to the list as well but only check
            if (matched.indexOf("/" + dirOrig) === -1) {
                matched.push("/" + dirOrig);
            }
            isMatch = true;
        } else {
            //handle special case when match patterns begin with /
            //match wildCards
            wildcardEntries.forEach(function (wildcard) {
                if (wildcard.match("^/")) { // special case looking for exact match
                    wildcard = "^" + wildcard.replace("*", "[^\/]*");
                    if (("/" + fileToMatch).match(wildcard)) {
                        matched.push(fileToMatch);
                        isMatch = true;
                    }
                } else {
                    wildcard = wildcard.replace("*", "[^\/]*");
                    if (fileToMatch.match(wildcard)) {
                        matched.push(fileToMatch);
                        isMatch = true;
                    }
                }
            });
            if (!isMatch) { //must be a file
                files.forEach(function (file) {
                    if (file.match("^/")) { // special case looking for exact match
                        if (file === ("/" + fileToMatch)) {
                            matched.push(fileToMatch);
                            isMatch = true;
                        }
                    } else if (fileToMatch.match(file)) {
                        matched.push(fileToMatch);
                        isMatch = true;
                    }
                });

            }
        }
    });
    this.matchedFiles = matched;
};

module.exports = BBWPignore;
