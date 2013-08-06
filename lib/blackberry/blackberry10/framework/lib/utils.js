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

var self,
    exception = require('./exception');

function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

self = module.exports = {
    validateNumberOfArguments: function (lowerBound, upperBound, numberOfArguments, customExceptionType, customExceptionMessage, customExceptionObject) {

        customExceptionMessage = customExceptionMessage || "";

        if (arguments.length < 3 || arguments.length > 6) {
            exception.raise(exception.types.Argument, "Wrong number of arguments when calling: validateNumberOfArguments()");
        }

        if (isNaN(lowerBound) && isNaN(upperBound) && isNaN(numberOfArguments)) {
            exception.raise(exception.types.ArgumentType, "(validateNumberOfArguments) Arguments are not numbers");
        }

        lowerBound = parseInt(lowerBound, 10);
        upperBound = parseInt(upperBound, 10);
        numberOfArguments = parseInt(numberOfArguments, 10);

        if (numberOfArguments < lowerBound || numberOfArguments > upperBound) {
            exception.raise((customExceptionType || exception.types.ArgumentLength), (customExceptionMessage + "\n\nWrong number of arguments"), customExceptionObject);
        }

    },

    validateArgumentType: function (arg, argType, customExceptionType, customExceptionMessage, customExceptionObject) {
        var invalidArg = false,
            msg;

        switch (argType) {
        case "array":
            if (!arg instanceof Array) {
                invalidArg = true;
            }
            break;
        case "date":
            if (!arg instanceof Date) {
                invalidArg = true;
            }
            break;
        case "integer":
            if (typeof arg === "number") {
                if (arg !== Math.floor(arg)) {
                    invalidArg = true;
                }
            }
            else {
                invalidArg = true;
            }
            break;
        default:
            if (typeof arg !== argType) {
                invalidArg = true;
            }
            break;
        }

        if (invalidArg) {
            msg = customExceptionMessage +  ("\n\nInvalid Argument type. argument: " + arg + " ==> was expected to be of type: " + argType);
            exception.raise((customExceptionType || exception.types.ArgumentType), msg, customExceptionObject);
        }
    },

    validateMultipleArgumentTypes: function (argArray, argTypeArray, customExceptionType, customExceptionMessage, customExceptionObject) {
        for (var i = 0; i < argArray.length; i++) {
            this.validateArgumentType(argArray[i], argTypeArray[i], customExceptionType, customExceptionMessage, customExceptionObject);
        }
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

    some: function (obj, predicate, scope) {
        if (obj instanceof Array) {
            return obj.some(predicate, scope);
        }
        else {
            var values = self.map(obj, predicate, scope);

            return self.reduce(values, function (some, value) {
                return value ? value : some;
            }, false);
        }
    },

    count: function (obj) {
        return self.sum(obj, function (total) {
            return 1;
        });
    },

    sum: function (obj, selector, scope) {
        var values = self.map(obj, selector, scope);
        return self.reduce(values, function (total, value) {
            return total + value;
        });
    },

    max: function (obj, selector, scope) {
        var values = self.map(obj, selector, scope);
        return self.reduce(values, function (max, value) {
            return max < value ? value : max;
        }, Number.MIN_VALUE);
    },

    min: function (obj, selector, scope) {
        var values = self.map(obj, selector, scope);
        return self.reduce(values, function (min, value) {
            return min > value ? value : min;
        }, Number.MAX_VALUE);
    },

    forEach: function (obj, action, scope) {
        if (obj instanceof Array) {
            return obj.forEach(action, scope);
        }
        else {
            self.map(obj, action, scope);
        }
    },

    filter: function (obj, predicate, scope) {
        if (obj instanceof Array) {
            return obj.filter(predicate, scope);
        }
        else {
            var result = [];
            self.forEach(obj, function (value, index) {
                if (predicate.apply(scope, [value, index])) {
                    result.push(value);
                }

            }, scope);

            return result;
        }
    },

    reduce: function (obj, func, init, scope) {
        var i,
            initial = init === undefined ? 0 : init,
            result = initial;


        if (obj instanceof Array) {
            return obj.reduce(func, initial);
        }
        else if (obj instanceof NamedNodeMap) {
            for (i = 0; i < obj.length; i++) {
                result = func.apply(scope, [result, obj[i], i]);
            }
        }
        else {
            for (i in obj) {
                if (obj.hasOwnProperty(i)) {
                    result = func.apply(scope, [result, obj[i], i]);
                }
            }
        }

        return result;

    },

    map: function (obj, func, scope) {
        var i,
            returnVal = null,
            result = [];

        if (obj instanceof Array) {
            return obj.map(func, scope);
        }
        else if (obj instanceof NamedNodeMap) {
            for (i = 0; i < obj.length; i++) {
                returnVal = func.apply(scope, [obj[i], i]);
                result.push(returnVal);
            }
        }
        else {
            for (i in obj) {
                if (obj.hasOwnProperty(i)) {
                    returnVal = func.apply(scope, [obj[i], i]);
                    result.push(returnVal);
                }
            }
        }

        return result;
    },

    series: function (tasks, callback) {

        var execute = function () {
            var args = [],
                task;

            if (tasks.length) {
                task = tasks.shift();
                args = args.concat(task.args).concat(execute);
                task.func.apply(this, args);
            }
            else {
                callback.func.apply(this, callback.args);
            }
        };

        execute();
    },

    regexSanitize: function (regexString) {
        return regexString.replace("^", "\\^")
                    .replace("$", "\\$")
                    .replace("(", "\\(")
                    .replace(")", "\\)")
                    .replace("<", "\\<")
                    .replace("[", "\\[")
                    .replace("{", "\\{")
                    .replace(/\\/, "\\\\")
                    .replace("|", "\\|")
                    .replace(">", "\\>")
                    .replace(".", "\\.")
                    .replace("*", "\\*")
                    .replace("+", "\\+")
                    .replace("?", "\\?");
    },

    find: function (comparison, collection, startInx, endInx, callback) {
        var results = [],
            compare = function (s, pattern) {

                if (typeof(s) !== "string" || pattern === null) {
                    return s === pattern;
                }

                var regex = pattern.replace(/\./g, "\\.")
                                   .replace(/\^/g, "\\^")
                                   .replace(/\*/g, ".*")
                                   .replace(/\\\.\*/g, "\\*");

                regex = "^".concat(regex, "$");

                return !!s.match(new RegExp(regex, "i"));
            };

        self.forEach(collection, function (c) {
            var match,
                fail = false;

            self.forEach(comparison, function (value, key) {
                if (!fail && value !== undefined) {

                    if (compare(c[key], value)) {
                        match = c;
                    }
                    else {
                        fail = true;
                        match = null;
                    }
                }
            });

            if (match) {
                results.push(match);
            }
        });

        if (callback) {
            if (startInx === undefined) {
                startInx = 0;
            }
            if (endInx === undefined) {
                endInx = results.length;
            }
            if (startInx === endInx) {
                endInx = startInx + 1;
            }

            callback.apply(null, [results.slice(startInx, endInx)]);
        }
    },

    mixin: function (mixin, to) {
        Object.getOwnPropertyNames(mixin).forEach(function (prop) {
            if (Object.hasOwnProperty.call(mixin, prop)) {
                Object.defineProperty(to, prop, Object.getOwnPropertyDescriptor(mixin, prop));
            }
        });
        return to;
    },

    copy: function (obj) {
        var i,
            newObj = (obj === null ? false : global.toString.call(obj) === "[object Array]") ? [] : {};

        if (typeof obj === 'number' ||
            typeof obj === 'string' ||
            typeof obj === 'boolean' ||
            obj === null ||
            obj === undefined) {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj);
        }

        if (obj instanceof RegExp) {
            return new RegExp(obj);
        }

        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                if (obj[i] && typeof obj[i] === "object") {
                    if (obj[i] instanceof Date) {
                        newObj[i] = obj[i];
                    }
                    else {
                        newObj[i] = self.copy(obj[i]);
                    }
                }
                else {
                    newObj[i] = obj[i];
                }
            }
        }

        return newObj;
    },

    startsWith : function (str, substr) {
        return str.indexOf(substr) === 0;
    },

    endsWith : function (str, substr) {
        return str.indexOf(substr, str.length - substr.length) !== -1;
    },

    parseUri : function (str) {
        var i, uri = {},
            key = [ "source", "scheme", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor" ],
            matcher = /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/.exec(str);

        for (i = key.length - 1; i >= 0; i--) {
            uri[key[i]] = matcher[i] || "";
        }

        return uri;
    },

    // uri - output from parseUri
    isAbsoluteURI : function (uri) {
        if (uri && uri.source) {
            return uri.relative !== uri.source;
        }

        return false;
    },

    fileNameToImageMIME : function (fileName) {

        var extensionsToMIME = {},
            ext;

        extensionsToMIME.png = 'image/png';
        extensionsToMIME.jpg = 'image/jpeg';
        extensionsToMIME.jpe = 'image/jpeg';
        extensionsToMIME.jpeg = 'image/jpeg';
        extensionsToMIME.gif = 'image/gif';
        extensionsToMIME.bmp = 'image/bmp';
        extensionsToMIME.bm = 'image/bmp';
        extensionsToMIME.svg = 'image/svg+xml';
        extensionsToMIME.tif = 'image/tiff';
        extensionsToMIME.tiff = 'image/tiff';

        ext = fileName.split('.').pop();
        return extensionsToMIME[ext];
    },

    isLocalURI : function (uri) {
        return uri && uri.scheme && "local:///".indexOf(uri.scheme.toLowerCase()) !== -1;
    },

    isFileURI : function (uri) {
        return uri && uri.scheme && "file://".indexOf(uri.scheme.toLowerCase()) !== -1;
    },

    isHttpURI : function (uri) {
        return uri && uri.scheme && "http://".indexOf(uri.scheme.toLowerCase()) !== -1;
    },

    isHttpsURI : function (uri) {
        return uri && uri.scheme && "https://".indexOf(uri.scheme.toLowerCase()) !== -1;
    },

    // Checks if the specified uri starts with 'data:'
    isDataURI : function (uri) {
        return uri && uri.scheme && "data:".indexOf(uri.scheme.toLowerCase()) !== -1;
    },

    performExec : function (featureId, property, args) {
        var result;

        window.webworks.exec(function (data, response) {
            result = data;
        }, function (data, response) {
            throw data;
        }, featureId, property, args, true);

        return result;
    },

    inNode : function () {
        return !!require.resolve;
    },

    requireWebview : function () {
        return require("./webview");
    },
    convertDataToBinary : function (data, dataEncoding) {
        var rawData,
            uint8Array,
            i;

        if (data) {
            if (dataEncoding.toLowerCase() === "base64") {
                rawData = window.atob(data);
            }
            else {
                rawData = data;
            }

            uint8Array = new Uint8Array(new ArrayBuffer(rawData.length));

            for (i = 0; i < uint8Array.length; i++) {
                uint8Array[i] = rawData.charCodeAt(i);
            }

            return uint8Array.buffer;
        }
    },
    getBlobWithArrayBufferAsData : function (data, dataEncoding) {
        var rawData,
            blobBuilderObj = new window.WebKitBlobBuilder();
        rawData = this.convertDataToBinary(data, dataEncoding);
        blobBuilderObj.append(rawData);

        return blobBuilderObj.getBlob("arraybuffer");
    },
    loadModule: function (module) {
        return require(module);
    },
    loadExtensionModule: function (plugin, path) {
        if (plugin && path) {
            return require("../plugin/" + plugin + "/" + path);
        } else {
            return null;
        }
    },
    hasPermission: function (config, permission) {
        if (config && config.permissions && config.permissions.length) {
            return config.permissions.indexOf(permission) >= 0;
        }

        return false;
    },
    guid: function () {
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    },
    getURIPrefix: function () {
        return "http://localhost:8472/";
    },
    translatePath: function (path) {
        if (path.indexOf("local:///") === 0) {
            var sourceDir = window.qnx.webplatform.getApplication().getEnv("HOME"); //leading slashes need to be removed
            path = "file:///" + sourceDir.replace(/^\/*/, '') + "/../app/native/" + path.replace(/local:\/\/\//, '');
        }
        return path;
    },
    invokeInBrowser: function (url) {
        var request = {
            uri: url,
            target: "sys.browser"
        };
        window.qnx.webplatform.getApplication().invocation.invoke(request);
    },
    isPersonal: function () {
        return window.qnx.webplatform.getApplication().getEnv("PERIMETER") === "personal";
    },
    deepclone: function (obj) {
        var newObj = obj instanceof Array ? [] : {},
            key;

        if (typeof obj === 'number' ||
                typeof obj === 'string' ||
                typeof obj === 'boolean' ||
                obj === null ||
                obj === undefined) {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj);
        }

        if (obj instanceof RegExp) {
            return new RegExp(obj);
        }

        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (obj[key] && typeof obj[key] === "object") {
                    newObj[key] = self.deepclone(obj[key]);
                } else {
                    newObj[key] = obj[key];
                }
            }
        }

        return newObj;
    }
};
