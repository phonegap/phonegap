/*
* Copyright 2011 Research In Motion Limited.
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
var os = require("os"),
    fs = require('fs'),
    wrench = require("wrench"),
    path = require('path'),
    childProcess = require("child_process");

module.exports = {
    isWindows : function () {
        return os.type().toLowerCase().indexOf("windows") >= 0;
    },

    copyFile: function (srcFile, destDir, baseDir, shouldNotOverwrite) {
        var filename = path.basename(srcFile),
            fileBuffer,
            fileLocation = path.join(destDir, filename);

        //if a base directory was provided, determine
        //folder structure from the relative path of the base folder
        if (baseDir && srcFile.indexOf(baseDir) === 0) {
            fileLocation = srcFile.replace(baseDir, destDir);
            wrench.mkdirSyncRecursive(path.dirname(fileLocation), "0755");
        }

        //By default we should copy
        //ONLY if we should NOT overwrite && the file exists will we skip copying
        if (!shouldNotOverwrite || !path.existsSync(fileLocation)) {
            fileBuffer = fs.readFileSync(srcFile);
            fs.writeFileSync(fileLocation, fileBuffer);
        }

    },

    listFiles: function (directory, filter) {
        var files = wrench.readdirSyncRecursive(directory),
            filteredFiles = [];

        files.forEach(function (file) {
            //On mac wrench.readdirSyncRecursive does not return absolute paths, so resolve one.
            file = path.resolve(directory, file);

            if (filter(file)) {
                filteredFiles.push(file);
            }
        });

        return filteredFiles;
    },

    arrayContains: function (array, obj) {
        var i = array.length;
        while (i--) {
            if (array[i] === obj) {
                return true;
            }
        }
        return false;
    },

    isValidIPAddress: function (ip) {
        var regex = new RegExp("(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$");
        return regex.test(ip);
    },

    trim: function (str) {
        return str.replace(/^\s+|\s+$/g, "");
    },

    displayOutput: function (data) {
        data = data.replace(/^\s+|\s+$/g, "");
        if (data !== "") {
            console.log(data);
        }
    },

    execCommandWithJWorkflow: function (command, options, neverDrop) {
        var displayOutput = this.displayOutput;
        return function (prev, baton) {
            baton.take();
            console.log("EXECUTING " + command);
            options = options || {};
            options.maxBuffer = 1024 * 1024;
            var c = childProcess.exec(command, options, function (error, stdout, stderr) {
                if (error && !neverDrop) {
                    baton.drop(error.code);
                } else {
                    baton.pass(prev);
                }
            });

            c.stdout.on('data', function (data) {
                displayOutput(data);
            });

            c.stderr.on('data', function (data) {
                displayOutput(data);
            });
        };
    },

    copyFolder: function (source, destination) {
        //create the destination folder if it does not exist
        if (!path.existsSync(destination)) {
            wrench.mkdirSyncRecursive(destination, "0755");
        }

        wrench.copyDirSyncRecursive(source, destination);
    },

    isDirectory: function (source) {
        return fs.statSync(source).isDirectory();
    }
};
