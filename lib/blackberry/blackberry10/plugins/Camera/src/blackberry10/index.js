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
var PictureSourceType = {
        PHOTOLIBRARY : 0,    // Choose image from picture library (same as SAVEDPHOTOALBUM for Android)
        CAMERA : 1,          // Take picture from camera
        SAVEDPHOTOALBUM : 2  // Choose image from picture library (same as PHOTOLIBRARY for Android)
    },
    DestinationType = {
        DATA_URL: 0,         // Return base64 encoded string
        FILE_URI: 1,         // Return file uri (content://media/external/images/media/2 for Android)
        NATIVE_URI: 2        // Return native uri (eg. asset-library://... for iOS)
    };

function encodeBase64(filePath, callback) {
    var sandbox = window.qnx.webplatform.getController().setFileSystemSandbox, // save original sandbox value
        errorHandler = function (err) {
            var msg = "An error occured: ";

            switch (err.code) {
            case FileError.NOT_FOUND_ERR:
                msg += "File or directory not found";
                break;

            case FileError.NOT_READABLE_ERR:
                msg += "File or directory not readable";
                break;

            case FileError.PATH_EXISTS_ERR:
                msg += "File or directory already exists";
                break;

            case FileError.TYPE_MISMATCH_ERR:
                msg += "Invalid file type";
                break;

            default:
                msg += "Unknown Error";
                break;
            };

            // set it back to original value
            window.qnx.webplatform.getController().setFileSystemSandbox = sandbox;
            callback(msg);
        },
        gotFile = function (fileEntry) {
            fileEntry.file(function (file) {
                var reader = new FileReader();

                reader.onloadend = function (e) {
                    // set it back to original value
                    window.qnx.webplatform.getController().setFileSystemSandbox = sandbox;
                    callback(this.result);
                };

                reader.readAsDataURL(file);
            }, errorHandler);
        },
        onInitFs = function (fs) {
            window.qnx.webplatform.getController().setFileSystemSandbox = false;
            fs.root.getFile(filePath, {create: false}, gotFile, errorHandler);
        };

    window.webkitRequestFileSystem(window.TEMPORARY, 10 * 1024 * 1024, onInitFs, errorHandler); // set size to 10MB max
}

module.exports = {
    takePicture: function (success, fail, args, env) {
        var destinationType = JSON.parse(decodeURIComponent(args[1])),
            sourceType = JSON.parse(decodeURIComponent(args[2])),
            result = new PluginResult(args, env),
            done = function (data) {
                if (destinationType === DestinationType.FILE_URI) {
                    data = "file://" + data;
                    result.callbackOk(data, false);
                } else {
                    encodeBase64(data, function (data) {
                        if (/^data:/.test(data)) {
                            data = data.slice(data.indexOf(",") + 1);
                            result.callbackOk(data, false);
                        } else {
                            result.callbackError(data, false);
                        }
                    });
                }
            },
            cancel = function (reason) {
                result.callbackError(reason, false);
            },
            invoked = function (error) {
                if (error) {
                    result.callbackError(error, false);
                }
            };

        switch(sourceType) {
        case PictureSourceType.CAMERA:
            window.qnx.webplatform.getApplication().cards.camera.open("photo", done, cancel, invoked);
            break;

        case PictureSourceType.PHOTOLIBRARY:
        case PictureSourceType.SAVEDPHOTOALBUM:
            window.qnx.webplatform.getApplication().cards.filePicker.open({
                mode: "Picker",
                type: ["picture"]
            }, done, cancel, invoked);
            break;
        }

        result.noResult(true);
    }
};
