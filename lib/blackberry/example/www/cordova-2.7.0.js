// Platform: blackberry

// 2.7.0-4-gabc9de8

// File generated at :: Tue Apr 30 2013 10:52:06 GMT-0700 (PDT)

/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at
 
     http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
*/

;(function() {

// file: lib/scripts/require.js

var require,
    define;

(function () {
    var modules = {};
    // Stack of moduleIds currently being built.
    var requireStack = [];
    // Map of module ID -> index into requireStack of modules currently being built.
    var inProgressModules = {};

    function build(module) {
        var factory = module.factory;
        module.exports = {};
        delete module.factory;
        factory(require, module.exports, module);
        return module.exports;
    }

    require = function (id) {
        if (!modules[id]) {
            throw "module " + id + " not found";
        } else if (id in inProgressModules) {
            var cycle = requireStack.slice(inProgressModules[id]).join('->') + '->' + id;
            throw "Cycle in require graph: " + cycle;
        }
        if (modules[id].factory) {
            try {
                inProgressModules[id] = requireStack.length;
                requireStack.push(id);
                return build(modules[id]);
            } finally {
                delete inProgressModules[id];
                requireStack.pop();
            }
        }
        return modules[id].exports;
    };

    define = function (id, factory) {
        if (modules[id]) {
            throw "module " + id + " already defined";
        }

        modules[id] = {
            id: id,
            factory: factory
        };
    };

    define.remove = function (id) {
        delete modules[id];
    };

    define.moduleMap = modules;
})();

//Export for use in node
if (typeof module === "object" && typeof require === "function") {
    module.exports.require = require;
    module.exports.define = define;
}

// file: lib/cordova.js
define("cordova", function(require, exports, module) {


var channel = require('cordova/channel');

/**
 * Listen for DOMContentLoaded and notify our channel subscribers.
 */
document.addEventListener('DOMContentLoaded', function() {
    channel.onDOMContentLoaded.fire();
}, false);
if (document.readyState == 'complete' || document.readyState == 'interactive') {
    channel.onDOMContentLoaded.fire();
}

/**
 * Intercept calls to addEventListener + removeEventListener and handle deviceready,
 * resume, and pause events.
 */
var m_document_addEventListener = document.addEventListener;
var m_document_removeEventListener = document.removeEventListener;
var m_window_addEventListener = window.addEventListener;
var m_window_removeEventListener = window.removeEventListener;

/**
 * Houses custom event handlers to intercept on document + window event listeners.
 */
var documentEventHandlers = {},
    windowEventHandlers = {};

document.addEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    if (typeof documentEventHandlers[e] != 'undefined') {
        documentEventHandlers[e].subscribe(handler);
    } else {
        m_document_addEventListener.call(document, evt, handler, capture);
    }
};

window.addEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    if (typeof windowEventHandlers[e] != 'undefined') {
        windowEventHandlers[e].subscribe(handler);
    } else {
        m_window_addEventListener.call(window, evt, handler, capture);
    }
};

document.removeEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    // If unsubscribing from an event that is handled by a plugin
    if (typeof documentEventHandlers[e] != "undefined") {
        documentEventHandlers[e].unsubscribe(handler);
    } else {
        m_document_removeEventListener.call(document, evt, handler, capture);
    }
};

window.removeEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    // If unsubscribing from an event that is handled by a plugin
    if (typeof windowEventHandlers[e] != "undefined") {
        windowEventHandlers[e].unsubscribe(handler);
    } else {
        m_window_removeEventListener.call(window, evt, handler, capture);
    }
};

function createEvent(type, data) {
    var event = document.createEvent('Events');
    event.initEvent(type, false, false);
    if (data) {
        for (var i in data) {
            if (data.hasOwnProperty(i)) {
                event[i] = data[i];
            }
        }
    }
    return event;
}

if(typeof window.console === "undefined") {
    window.console = {
        log:function(){}
    };
}

var cordova = {
    define:define,
    require:require,
    /**
     * Methods to add/remove your own addEventListener hijacking on document + window.
     */
    addWindowEventHandler:function(event) {
        return (windowEventHandlers[event] = channel.create(event));
    },
    addStickyDocumentEventHandler:function(event) {
        return (documentEventHandlers[event] = channel.createSticky(event));
    },
    addDocumentEventHandler:function(event) {
        return (documentEventHandlers[event] = channel.create(event));
    },
    removeWindowEventHandler:function(event) {
        delete windowEventHandlers[event];
    },
    removeDocumentEventHandler:function(event) {
        delete documentEventHandlers[event];
    },
    /**
     * Retrieve original event handlers that were replaced by Cordova
     *
     * @return object
     */
    getOriginalHandlers: function() {
        return {'document': {'addEventListener': m_document_addEventListener, 'removeEventListener': m_document_removeEventListener},
        'window': {'addEventListener': m_window_addEventListener, 'removeEventListener': m_window_removeEventListener}};
    },
    /**
     * Method to fire event from native code
     * bNoDetach is required for events which cause an exception which needs to be caught in native code
     */
    fireDocumentEvent: function(type, data, bNoDetach) {
        var evt = createEvent(type, data);
        if (typeof documentEventHandlers[type] != 'undefined') {
            if( bNoDetach ) {
              documentEventHandlers[type].fire(evt);
            }
            else {
              setTimeout(function() {
                  // Fire deviceready on listeners that were registered before cordova.js was loaded.
                  if (type == 'deviceready') {
                      document.dispatchEvent(evt);
                  }
                  documentEventHandlers[type].fire(evt);
              }, 0);
            }
        } else {
            document.dispatchEvent(evt);
        }
    },
    fireWindowEvent: function(type, data) {
        var evt = createEvent(type,data);
        if (typeof windowEventHandlers[type] != 'undefined') {
            setTimeout(function() {
                windowEventHandlers[type].fire(evt);
            }, 0);
        } else {
            window.dispatchEvent(evt);
        }
    },

    /**
     * Plugin callback mechanism.
     */
    // Randomize the starting callbackId to avoid collisions after refreshing or navigating.
    // This way, it's very unlikely that any new callback would get the same callbackId as an old callback.
    callbackId: Math.floor(Math.random() * 2000000000),
    callbacks:  {},
    callbackStatus: {
        NO_RESULT: 0,
        OK: 1,
        CLASS_NOT_FOUND_EXCEPTION: 2,
        ILLEGAL_ACCESS_EXCEPTION: 3,
        INSTANTIATION_EXCEPTION: 4,
        MALFORMED_URL_EXCEPTION: 5,
        IO_EXCEPTION: 6,
        INVALID_ACTION: 7,
        JSON_EXCEPTION: 8,
        ERROR: 9
    },

    /**
     * Called by native code when returning successful result from an action.
     */
    callbackSuccess: function(callbackId, args) {
        try {
            cordova.callbackFromNative(callbackId, true, args.status, [args.message], args.keepCallback);
        } catch (e) {
            console.log("Error in error callback: " + callbackId + " = "+e);
        }
    },

    /**
     * Called by native code when returning error result from an action.
     */
    callbackError: function(callbackId, args) {
        // TODO: Deprecate callbackSuccess and callbackError in favour of callbackFromNative.
        // Derive success from status.
        try {
            cordova.callbackFromNative(callbackId, false, args.status, [args.message], args.keepCallback);
        } catch (e) {
            console.log("Error in error callback: " + callbackId + " = "+e);
        }
    },

    /**
     * Called by native code when returning the result from an action.
     */
    callbackFromNative: function(callbackId, success, status, args, keepCallback) {
        var callback = cordova.callbacks[callbackId];
        if (callback) {
            if (success && status == cordova.callbackStatus.OK) {
                callback.success && callback.success.apply(null, args);
            } else if (!success) {
                callback.fail && callback.fail.apply(null, args);
            }

            // Clear callback if not expecting any more results
            if (!keepCallback) {
                delete cordova.callbacks[callbackId];
            }
        }
    },
    addConstructor: function(func) {
        channel.onCordovaReady.subscribe(function() {
            try {
                func();
            } catch(e) {
                console.log("Failed to run constructor: " + e);
            }
        });
    }
};

// Register pause, resume and deviceready channels as events on document.
channel.onPause = cordova.addDocumentEventHandler('pause');
channel.onResume = cordova.addDocumentEventHandler('resume');
channel.onDeviceReady = cordova.addStickyDocumentEventHandler('deviceready');

module.exports = cordova;

});

// file: lib/common/argscheck.js
define("cordova/argscheck", function(require, exports, module) {

var exec = require('cordova/exec');
var utils = require('cordova/utils');

var moduleExports = module.exports;

var typeMap = {
    'A': 'Array',
    'D': 'Date',
    'N': 'Number',
    'S': 'String',
    'F': 'Function',
    'O': 'Object'
};

function extractParamName(callee, argIndex) {
  return (/.*?\((.*?)\)/).exec(callee)[1].split(', ')[argIndex];
}

function checkArgs(spec, functionName, args, opt_callee) {
    if (!moduleExports.enableChecks) {
        return;
    }
    var errMsg = null;
    var typeName;
    for (var i = 0; i < spec.length; ++i) {
        var c = spec.charAt(i),
            cUpper = c.toUpperCase(),
            arg = args[i];
        // Asterix means allow anything.
        if (c == '*') {
            continue;
        }
        typeName = utils.typeName(arg);
        if ((arg === null || arg === undefined) && c == cUpper) {
            continue;
        }
        if (typeName != typeMap[cUpper]) {
            errMsg = 'Expected ' + typeMap[cUpper];
            break;
        }
    }
    if (errMsg) {
        errMsg += ', but got ' + typeName + '.';
        errMsg = 'Wrong type for parameter "' + extractParamName(opt_callee || args.callee, i) + '" of ' + functionName + ': ' + errMsg;
        // Don't log when running jake test.
        if (typeof jasmine == 'undefined') {
            console.error(errMsg);
        }
        throw TypeError(errMsg);
    }
}

function getValue(value, defaultValue) {
    return value === undefined ? defaultValue : value;
}

moduleExports.checkArgs = checkArgs;
moduleExports.getValue = getValue;
moduleExports.enableChecks = true;


});

// file: lib/common/builder.js
define("cordova/builder", function(require, exports, module) {

var utils = require('cordova/utils');

function each(objects, func, context) {
    for (var prop in objects) {
        if (objects.hasOwnProperty(prop)) {
            func.apply(context, [objects[prop], prop]);
        }
    }
}

function clobber(obj, key, value) {
    exports.replaceHookForTesting(obj, key);
    obj[key] = value;
    // Getters can only be overridden by getters.
    if (obj[key] !== value) {
        utils.defineGetter(obj, key, function() {
            return value;
        });
    }
}

function assignOrWrapInDeprecateGetter(obj, key, value, message) {
    if (message) {
        utils.defineGetter(obj, key, function() {
            console.log(message);
            delete obj[key];
            clobber(obj, key, value);
            return value;
        });
    } else {
        clobber(obj, key, value);
    }
}

function include(parent, objects, clobber, merge) {
    each(objects, function (obj, key) {
        try {
          var result = obj.path ? require(obj.path) : {};

          if (clobber) {
              // Clobber if it doesn't exist.
              if (typeof parent[key] === 'undefined') {
                  assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
              } else if (typeof obj.path !== 'undefined') {
                  // If merging, merge properties onto parent, otherwise, clobber.
                  if (merge) {
                      recursiveMerge(parent[key], result);
                  } else {
                      assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
                  }
              }
              result = parent[key];
          } else {
            // Overwrite if not currently defined.
            if (typeof parent[key] == 'undefined') {
              assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
            } else {
              // Set result to what already exists, so we can build children into it if they exist.
              result = parent[key];
            }
          }

          if (obj.children) {
            include(result, obj.children, clobber, merge);
          }
        } catch(e) {
          utils.alert('Exception building cordova JS globals: ' + e + ' for key "' + key + '"');
        }
    });
}

/**
 * Merge properties from one object onto another recursively.  Properties from
 * the src object will overwrite existing target property.
 *
 * @param target Object to merge properties into.
 * @param src Object to merge properties from.
 */
function recursiveMerge(target, src) {
    for (var prop in src) {
        if (src.hasOwnProperty(prop)) {
            if (target.prototype && target.prototype.constructor === target) {
                // If the target object is a constructor override off prototype.
                clobber(target.prototype, prop, src[prop]);
            } else {
                if (typeof src[prop] === 'object' && typeof target[prop] === 'object') {
                    recursiveMerge(target[prop], src[prop]);
                } else {
                    clobber(target, prop, src[prop]);
                }
            }
        }
    }
}

exports.buildIntoButDoNotClobber = function(objects, target) {
    include(target, objects, false, false);
};
exports.buildIntoAndClobber = function(objects, target) {
    include(target, objects, true, false);
};
exports.buildIntoAndMerge = function(objects, target) {
    include(target, objects, true, true);
};
exports.recursiveMerge = recursiveMerge;
exports.assignOrWrapInDeprecateGetter = assignOrWrapInDeprecateGetter;
exports.replaceHookForTesting = function() {};

});

// file: lib/common/channel.js
define("cordova/channel", function(require, exports, module) {

var utils = require('cordova/utils'),
    nextGuid = 1;

/**
 * Custom pub-sub "channel" that can have functions subscribed to it
 * This object is used to define and control firing of events for
 * cordova initialization, as well as for custom events thereafter.
 *
 * The order of events during page load and Cordova startup is as follows:
 *
 * onDOMContentLoaded*         Internal event that is received when the web page is loaded and parsed.
 * onNativeReady*              Internal event that indicates the Cordova native side is ready.
 * onCordovaReady*             Internal event fired when all Cordova JavaScript objects have been created.
 * onCordovaInfoReady*         Internal event fired when device properties are available.
 * onCordovaConnectionReady*   Internal event fired when the connection property has been set.
 * onDeviceReady*              User event fired to indicate that Cordova is ready
 * onResume                    User event fired to indicate a start/resume lifecycle event
 * onPause                     User event fired to indicate a pause lifecycle event
 * onDestroy*                  Internal event fired when app is being destroyed (User should use window.onunload event, not this one).
 *
 * The events marked with an * are sticky. Once they have fired, they will stay in the fired state.
 * All listeners that subscribe after the event is fired will be executed right away.
 *
 * The only Cordova events that user code should register for are:
 *      deviceready           Cordova native code is initialized and Cordova APIs can be called from JavaScript
 *      pause                 App has moved to background
 *      resume                App has returned to foreground
 *
 * Listeners can be registered as:
 *      document.addEventListener("deviceready", myDeviceReadyListener, false);
 *      document.addEventListener("resume", myResumeListener, false);
 *      document.addEventListener("pause", myPauseListener, false);
 *
 * The DOM lifecycle events should be used for saving and restoring state
 *      window.onload
 *      window.onunload
 *
 */

/**
 * Channel
 * @constructor
 * @param type  String the channel name
 */
var Channel = function(type, sticky) {
    this.type = type;
    // Map of guid -> function.
    this.handlers = {};
    // 0 = Non-sticky, 1 = Sticky non-fired, 2 = Sticky fired.
    this.state = sticky ? 1 : 0;
    // Used in sticky mode to remember args passed to fire().
    this.fireArgs = null;
    // Used by onHasSubscribersChange to know if there are any listeners.
    this.numHandlers = 0;
    // Function that is called when the first listener is subscribed, or when
    // the last listener is unsubscribed.
    this.onHasSubscribersChange = null;
},
    channel = {
        /**
         * Calls the provided function only after all of the channels specified
         * have been fired. All channels must be sticky channels.
         */
        join: function(h, c) {
            var len = c.length,
                i = len,
                f = function() {
                    if (!(--i)) h();
                };
            for (var j=0; j<len; j++) {
                if (c[j].state === 0) {
                    throw Error('Can only use join with sticky channels.');
                }
                c[j].subscribe(f);
            }
            if (!len) h();
        },
        create: function(type) {
            return channel[type] = new Channel(type, false);
        },
        createSticky: function(type) {
            return channel[type] = new Channel(type, true);
        },

        /**
         * cordova Channels that must fire before "deviceready" is fired.
         */
        deviceReadyChannelsArray: [],
        deviceReadyChannelsMap: {},

        /**
         * Indicate that a feature needs to be initialized before it is ready to be used.
         * This holds up Cordova's "deviceready" event until the feature has been initialized
         * and Cordova.initComplete(feature) is called.
         *
         * @param feature {String}     The unique feature name
         */
        waitForInitialization: function(feature) {
            if (feature) {
                var c = channel[feature] || this.createSticky(feature);
                this.deviceReadyChannelsMap[feature] = c;
                this.deviceReadyChannelsArray.push(c);
            }
        },

        /**
         * Indicate that initialization code has completed and the feature is ready to be used.
         *
         * @param feature {String}     The unique feature name
         */
        initializationComplete: function(feature) {
            var c = this.deviceReadyChannelsMap[feature];
            if (c) {
                c.fire();
            }
        }
    };

function forceFunction(f) {
    if (typeof f != 'function') throw "Function required as first argument!";
}

/**
 * Subscribes the given function to the channel. Any time that
 * Channel.fire is called so too will the function.
 * Optionally specify an execution context for the function
 * and a guid that can be used to stop subscribing to the channel.
 * Returns the guid.
 */
Channel.prototype.subscribe = function(f, c) {
    // need a function to call
    forceFunction(f);
    if (this.state == 2) {
        f.apply(c || this, this.fireArgs);
        return;
    }

    var func = f,
        guid = f.observer_guid;
    if (typeof c == "object") { func = utils.close(c, f); }

    if (!guid) {
        // first time any channel has seen this subscriber
        guid = '' + nextGuid++;
    }
    func.observer_guid = guid;
    f.observer_guid = guid;

    // Don't add the same handler more than once.
    if (!this.handlers[guid]) {
        this.handlers[guid] = func;
        this.numHandlers++;
        if (this.numHandlers == 1) {
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};

/**
 * Unsubscribes the function with the given guid from the channel.
 */
Channel.prototype.unsubscribe = function(f) {
    // need a function to unsubscribe
    forceFunction(f);

    var guid = f.observer_guid,
        handler = this.handlers[guid];
    if (handler) {
        delete this.handlers[guid];
        this.numHandlers--;
        if (this.numHandlers === 0) {
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};

/**
 * Calls all functions subscribed to this channel.
 */
Channel.prototype.fire = function(e) {
    var fail = false,
        fireArgs = Array.prototype.slice.call(arguments);
    // Apply stickiness.
    if (this.state == 1) {
        this.state = 2;
        this.fireArgs = fireArgs;
    }
    if (this.numHandlers) {
        // Copy the values first so that it is safe to modify it from within
        // callbacks.
        var toCall = [];
        for (var item in this.handlers) {
            toCall.push(this.handlers[item]);
        }
        for (var i = 0; i < toCall.length; ++i) {
            toCall[i].apply(this, fireArgs);
        }
        if (this.state == 2 && this.numHandlers) {
            this.numHandlers = 0;
            this.handlers = {};
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};


// defining them here so they are ready super fast!
// DOM event that is received when the web page is loaded and parsed.
channel.createSticky('onDOMContentLoaded');

// Event to indicate the Cordova native side is ready.
channel.createSticky('onNativeReady');

// Event to indicate that all Cordova JavaScript objects have been created
// and it's time to run plugin constructors.
channel.createSticky('onCordovaReady');

// Event to indicate that device properties are available
channel.createSticky('onCordovaInfoReady');

// Event to indicate that the connection property has been set.
channel.createSticky('onCordovaConnectionReady');

// Event to indicate that all automatically loaded JS plugins are loaded and ready.
channel.createSticky('onPluginsReady');

// Event to indicate that Cordova is ready
channel.createSticky('onDeviceReady');

// Event to indicate a resume lifecycle event
channel.create('onResume');

// Event to indicate a pause lifecycle event
channel.create('onPause');

// Event to indicate a destroy lifecycle event
channel.createSticky('onDestroy');

// Channels that must fire before "deviceready" is fired.
channel.waitForInitialization('onCordovaReady');
channel.waitForInitialization('onCordovaConnectionReady');
channel.waitForInitialization('onDOMContentLoaded');

module.exports = channel;

});

// file: lib/common/commandProxy.js
define("cordova/commandProxy", function(require, exports, module) {


// internal map of proxy function
var CommandProxyMap = {};

module.exports = {

    // example: cordova.commandProxy.add("Accelerometer",{getCurrentAcceleration: function(successCallback, errorCallback, options) {...},...);
    add:function(id,proxyObj) {
        console.log("adding proxy for " + id);
        CommandProxyMap[id] = proxyObj;
        return proxyObj;
    },

    // cordova.commandProxy.remove("Accelerometer");
    remove:function(id) {
        var proxy = CommandProxyMap[id];
        delete CommandProxyMap[id];
        CommandProxyMap[id] = null;
        return proxy;
    },

    get:function(service,action) {
        return ( CommandProxyMap[service] ? CommandProxyMap[service][action] : null );
    }
};
});

// file: lib/blackberry/exec.js
define("cordova/exec", function(require, exports, module) {

var cordova = require('cordova'),
    platform = require('cordova/platform'),
    utils = require('cordova/utils');

/**
 * Execute a cordova command.  It is up to the native side whether this action
 * is synchronous or asynchronous.  The native side can return:
 *      Synchronous: PluginResult object as a JSON string
 *      Asynchronous: Empty string ""
 * If async, the native side will cordova.callbackSuccess or cordova.callbackError,
 * depending upon the result of the action.
 *
 * @param {Function} success    The success callback
 * @param {Function} fail       The fail callback
 * @param {String} service      The name of the service to use
 * @param {String} action       Action to be run in cordova
 * @param {String[]} [args]     Zero or more arguments to pass to the method
 */

module.exports = function(success, fail, service, action, args) {
    try {
        var manager = require('cordova/plugin/' + platform.runtime() + '/manager'),
            v = manager.exec(success, fail, service, action, args);

        // If status is OK, then return value back to caller
        if (v.status == cordova.callbackStatus.OK) {

            // If there is a success callback, then call it now with returned value
            if (success) {
                try {
                    success(v.message);
                }
                catch (e) {
                    console.log("Error in success callback: "+cordova.callbackId+" = "+e);
                }
            }
            return v.message;
        } else if (v.status == cordova.callbackStatus.NO_RESULT) {

        } else {
            // If error, then display error
            console.log("Error: Status="+v.status+" Message="+v.message);

            // If there is a fail callback, then call it now with returned value
            if (fail) {
                try {
                    fail(v.message);
                }
                catch (e) {
                    console.log("Error in error callback: "+cordova.callbackId+" = "+e);
                }
            }
            return null;
        }
    } catch (e) {
        utils.alert("Error: "+e);
    }
};

});

// file: lib/common/modulemapper.js
define("cordova/modulemapper", function(require, exports, module) {

var builder = require('cordova/builder'),
    moduleMap = define.moduleMap,
    symbolList,
    deprecationMap;

exports.reset = function() {
    symbolList = [];
    deprecationMap = {};
};

function addEntry(strategy, moduleName, symbolPath, opt_deprecationMessage) {
    if (!(moduleName in moduleMap)) {
        throw new Error('Module ' + moduleName + ' does not exist.');
    }
    symbolList.push(strategy, moduleName, symbolPath);
    if (opt_deprecationMessage) {
        deprecationMap[symbolPath] = opt_deprecationMessage;
    }
}

// Note: Android 2.3 does have Function.bind().
exports.clobbers = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('c', moduleName, symbolPath, opt_deprecationMessage);
};

exports.merges = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('m', moduleName, symbolPath, opt_deprecationMessage);
};

exports.defaults = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('d', moduleName, symbolPath, opt_deprecationMessage);
};

function prepareNamespace(symbolPath, context) {
    if (!symbolPath) {
        return context;
    }
    var parts = symbolPath.split('.');
    var cur = context;
    for (var i = 0, part; part = parts[i]; ++i) {
        cur = cur[part] = cur[part] || {};
    }
    return cur;
}

exports.mapModules = function(context) {
    var origSymbols = {};
    context.CDV_origSymbols = origSymbols;
    for (var i = 0, len = symbolList.length; i < len; i += 3) {
        var strategy = symbolList[i];
        var moduleName = symbolList[i + 1];
        var symbolPath = symbolList[i + 2];
        var lastDot = symbolPath.lastIndexOf('.');
        var namespace = symbolPath.substr(0, lastDot);
        var lastName = symbolPath.substr(lastDot + 1);

        var module = require(moduleName);
        var deprecationMsg = symbolPath in deprecationMap ? 'Access made to deprecated symbol: ' + symbolPath + '. ' + deprecationMsg : null;
        var parentObj = prepareNamespace(namespace, context);
        var target = parentObj[lastName];

        if (strategy == 'm' && target) {
            builder.recursiveMerge(target, module);
        } else if ((strategy == 'd' && !target) || (strategy != 'd')) {
            if (!(symbolPath in origSymbols)) {
                origSymbols[symbolPath] = target;
            }
            builder.assignOrWrapInDeprecateGetter(parentObj, lastName, module, deprecationMsg);
        }
    }
};

exports.getOriginalSymbol = function(context, symbolPath) {
    var origSymbols = context.CDV_origSymbols;
    if (origSymbols && (symbolPath in origSymbols)) {
        return origSymbols[symbolPath];
    }
    var parts = symbolPath.split('.');
    var obj = context;
    for (var i = 0; i < parts.length; ++i) {
        obj = obj && obj[parts[i]];
    }
    return obj;
};

exports.loadMatchingModules = function(matchingRegExp) {
    for (var k in moduleMap) {
        if (matchingRegExp.exec(k)) {
            require(k);
        }
    }
};

exports.reset();


});

// file: lib/blackberry/platform.js
define("cordova/platform", function(require, exports, module) {

module.exports = {
    id: "blackberry",
    runtime: function () {
        if (navigator.userAgent.indexOf("BB10") > -1) {
            return 'qnx';
        }
        else if (navigator.userAgent.indexOf("PlayBook") > -1) {
            return 'air';
        }
        else if (navigator.userAgent.indexOf("BlackBerry") > -1) {
            return 'java';
        }
        else {
            console.log("Unknown user agent?!?!? defaulting to java");
            return 'java';
        }
    },
    initialize: function() {
        var modulemapper = require('cordova/modulemapper'),
            platform = require('cordova/plugin/' + this.runtime() + '/platform');

        modulemapper.loadMatchingModules(/cordova.*\/symbols$/);
        modulemapper.loadMatchingModules(new RegExp('cordova/.*' + this.runtime() + '/.*bbsymbols$'));
        modulemapper.mapModules(this.contextObj);

        platform.initialize();
    },
    contextObj: this // Used for testing.
};

});

// file: lib/common/plugin/Acceleration.js
define("cordova/plugin/Acceleration", function(require, exports, module) {

var Acceleration = function(x, y, z, timestamp) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.timestamp = timestamp || (new Date()).getTime();
};

module.exports = Acceleration;

});

// file: lib/common/plugin/Camera.js
define("cordova/plugin/Camera", function(require, exports, module) {

var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec'),
    Camera = require('cordova/plugin/CameraConstants'),
    CameraPopoverHandle = require('cordova/plugin/CameraPopoverHandle');

var cameraExport = {};

// Tack on the Camera Constants to the base camera plugin.
for (var key in Camera) {
    cameraExport[key] = Camera[key];
}

/**
 * Gets a picture from source defined by "options.sourceType", and returns the
 * image as defined by the "options.destinationType" option.

 * The defaults are sourceType=CAMERA and destinationType=FILE_URI.
 *
 * @param {Function} successCallback
 * @param {Function} errorCallback
 * @param {Object} options
 */
cameraExport.getPicture = function(successCallback, errorCallback, options) {
    argscheck.checkArgs('fFO', 'Camera.getPicture', arguments);
    options = options || {};
    var getValue = argscheck.getValue;

    var quality = getValue(options.quality, 50);
    var destinationType = getValue(options.destinationType, Camera.DestinationType.FILE_URI);
    var sourceType = getValue(options.sourceType, Camera.PictureSourceType.CAMERA);
    var targetWidth = getValue(options.targetWidth, -1);
    var targetHeight = getValue(options.targetHeight, -1);
    var encodingType = getValue(options.encodingType, Camera.EncodingType.JPEG);
    var mediaType = getValue(options.mediaType, Camera.MediaType.PICTURE);
    var allowEdit = !!options.allowEdit;
    var correctOrientation = !!options.correctOrientation;
    var saveToPhotoAlbum = !!options.saveToPhotoAlbum;
    var popoverOptions = getValue(options.popoverOptions, null);
    var cameraDirection = getValue(options.cameraDirection, Camera.Direction.BACK);

    var args = [quality, destinationType, sourceType, targetWidth, targetHeight, encodingType,
                mediaType, allowEdit, correctOrientation, saveToPhotoAlbum, popoverOptions, cameraDirection];

    exec(successCallback, errorCallback, "Camera", "takePicture", args);
    return new CameraPopoverHandle();
};

cameraExport.cleanup = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, "Camera", "cleanup", []);
};

module.exports = cameraExport;

});

// file: lib/common/plugin/CameraConstants.js
define("cordova/plugin/CameraConstants", function(require, exports, module) {

module.exports = {
  DestinationType:{
    DATA_URL: 0,         // Return base64 encoded string
    FILE_URI: 1,         // Return file uri (content://media/external/images/media/2 for Android)
    NATIVE_URI: 2        // Return native uri (eg. asset-library://... for iOS)
  },
  EncodingType:{
    JPEG: 0,             // Return JPEG encoded image
    PNG: 1               // Return PNG encoded image
  },
  MediaType:{
    PICTURE: 0,          // allow selection of still pictures only. DEFAULT. Will return format specified via DestinationType
    VIDEO: 1,            // allow selection of video only, ONLY RETURNS URL
    ALLMEDIA : 2         // allow selection from all media types
  },
  PictureSourceType:{
    PHOTOLIBRARY : 0,    // Choose image from picture library (same as SAVEDPHOTOALBUM for Android)
    CAMERA : 1,          // Take picture from camera
    SAVEDPHOTOALBUM : 2  // Choose image from picture library (same as PHOTOLIBRARY for Android)
  },
  PopoverArrowDirection:{
      ARROW_UP : 1,        // matches iOS UIPopoverArrowDirection constants to specify arrow location on popover
      ARROW_DOWN : 2,
      ARROW_LEFT : 4,
      ARROW_RIGHT : 8,
      ARROW_ANY : 15
  },
  Direction:{
      BACK: 0,
      FRONT: 1
  }
};

});

// file: lib/common/plugin/CameraPopoverHandle.js
define("cordova/plugin/CameraPopoverHandle", function(require, exports, module) {

var exec = require('cordova/exec');

/**
 * A handle to an image picker popover.
 */
var CameraPopoverHandle = function() {
    this.setPosition = function(popoverOptions) {
        console.log('CameraPopoverHandle.setPosition is only supported on iOS.');
    };
};

module.exports = CameraPopoverHandle;

});

// file: lib/common/plugin/CameraPopoverOptions.js
define("cordova/plugin/CameraPopoverOptions", function(require, exports, module) {

var Camera = require('cordova/plugin/CameraConstants');

/**
 * Encapsulates options for iOS Popover image picker
 */
var CameraPopoverOptions = function(x,y,width,height,arrowDir){
    // information of rectangle that popover should be anchored to
    this.x = x || 0;
    this.y = y || 32;
    this.width = width || 320;
    this.height = height || 480;
    // The direction of the popover arrow
    this.arrowDir = arrowDir || Camera.PopoverArrowDirection.ARROW_ANY;
};

module.exports = CameraPopoverOptions;

});

// file: lib/common/plugin/CaptureAudioOptions.js
define("cordova/plugin/CaptureAudioOptions", function(require, exports, module) {

/**
 * Encapsulates all audio capture operation configuration options.
 */
var CaptureAudioOptions = function(){
    // Upper limit of sound clips user can record. Value must be equal or greater than 1.
    this.limit = 1;
    // Maximum duration of a single sound clip in seconds.
    this.duration = 0;
};

module.exports = CaptureAudioOptions;

});

// file: lib/common/plugin/CaptureError.js
define("cordova/plugin/CaptureError", function(require, exports, module) {

/**
 * The CaptureError interface encapsulates all errors in the Capture API.
 */
var CaptureError = function(c) {
   this.code = c || null;
};

// Camera or microphone failed to capture image or sound.
CaptureError.CAPTURE_INTERNAL_ERR = 0;
// Camera application or audio capture application is currently serving other capture request.
CaptureError.CAPTURE_APPLICATION_BUSY = 1;
// Invalid use of the API (e.g. limit parameter has value less than one).
CaptureError.CAPTURE_INVALID_ARGUMENT = 2;
// User exited camera application or audio capture application before capturing anything.
CaptureError.CAPTURE_NO_MEDIA_FILES = 3;
// The requested capture operation is not supported.
CaptureError.CAPTURE_NOT_SUPPORTED = 20;

module.exports = CaptureError;

});

// file: lib/common/plugin/CaptureImageOptions.js
define("cordova/plugin/CaptureImageOptions", function(require, exports, module) {

/**
 * Encapsulates all image capture operation configuration options.
 */
var CaptureImageOptions = function(){
    // Upper limit of images user can take. Value must be equal or greater than 1.
    this.limit = 1;
};

module.exports = CaptureImageOptions;

});

// file: lib/common/plugin/CaptureVideoOptions.js
define("cordova/plugin/CaptureVideoOptions", function(require, exports, module) {

/**
 * Encapsulates all video capture operation configuration options.
 */
var CaptureVideoOptions = function(){
    // Upper limit of videos user can record. Value must be equal or greater than 1.
    this.limit = 1;
    // Maximum duration of a single video clip in seconds.
    this.duration = 0;
};

module.exports = CaptureVideoOptions;

});

// file: lib/common/plugin/CompassError.js
define("cordova/plugin/CompassError", function(require, exports, module) {

/**
 *  CompassError.
 *  An error code assigned by an implementation when an error has occurred
 * @constructor
 */
var CompassError = function(err) {
    this.code = (err !== undefined ? err : null);
};

CompassError.COMPASS_INTERNAL_ERR = 0;
CompassError.COMPASS_NOT_SUPPORTED = 20;

module.exports = CompassError;

});

// file: lib/common/plugin/CompassHeading.js
define("cordova/plugin/CompassHeading", function(require, exports, module) {

var CompassHeading = function(magneticHeading, trueHeading, headingAccuracy, timestamp) {
  this.magneticHeading = magneticHeading;
  this.trueHeading = trueHeading;
  this.headingAccuracy = headingAccuracy;
  this.timestamp = timestamp || new Date().getTime();
};

module.exports = CompassHeading;

});

// file: lib/common/plugin/ConfigurationData.js
define("cordova/plugin/ConfigurationData", function(require, exports, module) {

/**
 * Encapsulates a set of parameters that the capture device supports.
 */
function ConfigurationData() {
    // The ASCII-encoded string in lower case representing the media type.
    this.type = null;
    // The height attribute represents height of the image or video in pixels.
    // In the case of a sound clip this attribute has value 0.
    this.height = 0;
    // The width attribute represents width of the image or video in pixels.
    // In the case of a sound clip this attribute has value 0
    this.width = 0;
}

module.exports = ConfigurationData;

});

// file: lib/common/plugin/Connection.js
define("cordova/plugin/Connection", function(require, exports, module) {

/**
 * Network status
 */
module.exports = {
        UNKNOWN: "unknown",
        ETHERNET: "ethernet",
        WIFI: "wifi",
        CELL_2G: "2g",
        CELL_3G: "3g",
        CELL_4G: "4g",
        CELL:"cellular",
        NONE: "none"
};

});

// file: lib/common/plugin/Contact.js
define("cordova/plugin/Contact", function(require, exports, module) {

var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec'),
    ContactError = require('cordova/plugin/ContactError'),
    utils = require('cordova/utils');

/**
* Converts primitives into Complex Object
* Currently only used for Date fields
*/
function convertIn(contact) {
    var value = contact.birthday;
    try {
      contact.birthday = new Date(parseFloat(value));
    } catch (exception){
      console.log("Cordova Contact convertIn error: exception creating date.");
    }
    return contact;
}

/**
* Converts Complex objects into primitives
* Only conversion at present is for Dates.
**/

function convertOut(contact) {
    var value = contact.birthday;
    if (value !== null) {
        // try to make it a Date object if it is not already
        if (!utils.isDate(value)){
            try {
                value = new Date(value);
            } catch(exception){
                value = null;
            }
        }
        if (utils.isDate(value)){
            value = value.valueOf(); // convert to milliseconds
        }
        contact.birthday = value;
    }
    return contact;
}

/**
* Contains information about a single contact.
* @constructor
* @param {DOMString} id unique identifier
* @param {DOMString} displayName
* @param {ContactName} name
* @param {DOMString} nickname
* @param {Array.<ContactField>} phoneNumbers array of phone numbers
* @param {Array.<ContactField>} emails array of email addresses
* @param {Array.<ContactAddress>} addresses array of addresses
* @param {Array.<ContactField>} ims instant messaging user ids
* @param {Array.<ContactOrganization>} organizations
* @param {DOMString} birthday contact's birthday
* @param {DOMString} note user notes about contact
* @param {Array.<ContactField>} photos
* @param {Array.<ContactField>} categories
* @param {Array.<ContactField>} urls contact's web sites
*/
var Contact = function (id, displayName, name, nickname, phoneNumbers, emails, addresses,
    ims, organizations, birthday, note, photos, categories, urls) {
    this.id = id || null;
    this.rawId = null;
    this.displayName = displayName || null;
    this.name = name || null; // ContactName
    this.nickname = nickname || null;
    this.phoneNumbers = phoneNumbers || null; // ContactField[]
    this.emails = emails || null; // ContactField[]
    this.addresses = addresses || null; // ContactAddress[]
    this.ims = ims || null; // ContactField[]
    this.organizations = organizations || null; // ContactOrganization[]
    this.birthday = birthday || null;
    this.note = note || null;
    this.photos = photos || null; // ContactField[]
    this.categories = categories || null; // ContactField[]
    this.urls = urls || null; // ContactField[]
};

/**
* Removes contact from device storage.
* @param successCB success callback
* @param errorCB error callback
*/
Contact.prototype.remove = function(successCB, errorCB) {
    argscheck.checkArgs('FF', 'Contact.remove', arguments);
    var fail = errorCB && function(code) {
        errorCB(new ContactError(code));
    };
    if (this.id === null) {
        fail(ContactError.UNKNOWN_ERROR);
    }
    else {
        exec(successCB, fail, "Contacts", "remove", [this.id]);
    }
};

/**
* Creates a deep copy of this Contact.
* With the contact ID set to null.
* @return copy of this Contact
*/
Contact.prototype.clone = function() {
    var clonedContact = utils.clone(this);
    clonedContact.id = null;
    clonedContact.rawId = null;

    function nullIds(arr) {
        if (arr) {
            for (var i = 0; i < arr.length; ++i) {
                arr[i].id = null;
            }
        }
    }

    // Loop through and clear out any id's in phones, emails, etc.
    nullIds(clonedContact.phoneNumbers);
    nullIds(clonedContact.emails);
    nullIds(clonedContact.addresses);
    nullIds(clonedContact.ims);
    nullIds(clonedContact.organizations);
    nullIds(clonedContact.categories);
    nullIds(clonedContact.photos);
    nullIds(clonedContact.urls);
    return clonedContact;
};

/**
* Persists contact to device storage.
* @param successCB success callback
* @param errorCB error callback
*/
Contact.prototype.save = function(successCB, errorCB) {
    argscheck.checkArgs('FFO', 'Contact.save', arguments);
    var fail = errorCB && function(code) {
        errorCB(new ContactError(code));
    };
    var success = function(result) {
        if (result) {
            if (successCB) {
                var fullContact = require('cordova/plugin/contacts').create(result);
                successCB(convertIn(fullContact));
            }
        }
        else {
            // no Entry object returned
            fail(ContactError.UNKNOWN_ERROR);
        }
    };
    var dupContact = convertOut(utils.clone(this));
    exec(success, fail, "Contacts", "save", [dupContact]);
};


module.exports = Contact;

});

// file: lib/common/plugin/ContactAddress.js
define("cordova/plugin/ContactAddress", function(require, exports, module) {

/**
* Contact address.
* @constructor
* @param {DOMString} id unique identifier, should only be set by native code
* @param formatted // NOTE: not a W3C standard
* @param streetAddress
* @param locality
* @param region
* @param postalCode
* @param country
*/

var ContactAddress = function(pref, type, formatted, streetAddress, locality, region, postalCode, country) {
    this.id = null;
    this.pref = (typeof pref != 'undefined' ? pref : false);
    this.type = type || null;
    this.formatted = formatted || null;
    this.streetAddress = streetAddress || null;
    this.locality = locality || null;
    this.region = region || null;
    this.postalCode = postalCode || null;
    this.country = country || null;
};

module.exports = ContactAddress;

});

// file: lib/common/plugin/ContactError.js
define("cordova/plugin/ContactError", function(require, exports, module) {

/**
 *  ContactError.
 *  An error code assigned by an implementation when an error has occurred
 * @constructor
 */
var ContactError = function(err) {
    this.code = (typeof err != 'undefined' ? err : null);
};

/**
 * Error codes
 */
ContactError.UNKNOWN_ERROR = 0;
ContactError.INVALID_ARGUMENT_ERROR = 1;
ContactError.TIMEOUT_ERROR = 2;
ContactError.PENDING_OPERATION_ERROR = 3;
ContactError.IO_ERROR = 4;
ContactError.NOT_SUPPORTED_ERROR = 5;
ContactError.PERMISSION_DENIED_ERROR = 20;

module.exports = ContactError;

});

// file: lib/common/plugin/ContactField.js
define("cordova/plugin/ContactField", function(require, exports, module) {

/**
* Generic contact field.
* @constructor
* @param {DOMString} id unique identifier, should only be set by native code // NOTE: not a W3C standard
* @param type
* @param value
* @param pref
*/
var ContactField = function(type, value, pref) {
    this.id = null;
    this.type = (type && type.toString()) || null;
    this.value = (value && value.toString()) || null;
    this.pref = (typeof pref != 'undefined' ? pref : false);
};

module.exports = ContactField;

});

// file: lib/common/plugin/ContactFindOptions.js
define("cordova/plugin/ContactFindOptions", function(require, exports, module) {

/**
 * ContactFindOptions.
 * @constructor
 * @param filter used to match contacts against
 * @param multiple boolean used to determine if more than one contact should be returned
 */

var ContactFindOptions = function(filter, multiple) {
    this.filter = filter || '';
    this.multiple = (typeof multiple != 'undefined' ? multiple : false);
};

module.exports = ContactFindOptions;

});

// file: lib/common/plugin/ContactName.js
define("cordova/plugin/ContactName", function(require, exports, module) {

/**
* Contact name.
* @constructor
* @param formatted // NOTE: not part of W3C standard
* @param familyName
* @param givenName
* @param middle
* @param prefix
* @param suffix
*/
var ContactName = function(formatted, familyName, givenName, middle, prefix, suffix) {
    this.formatted = formatted || null;
    this.familyName = familyName || null;
    this.givenName = givenName || null;
    this.middleName = middle || null;
    this.honorificPrefix = prefix || null;
    this.honorificSuffix = suffix || null;
};

module.exports = ContactName;

});

// file: lib/common/plugin/ContactOrganization.js
define("cordova/plugin/ContactOrganization", function(require, exports, module) {

/**
* Contact organization.
* @constructor
* @param {DOMString} id unique identifier, should only be set by native code // NOTE: not a W3C standard
* @param name
* @param dept
* @param title
* @param startDate
* @param endDate
* @param location
* @param desc
*/

var ContactOrganization = function(pref, type, name, dept, title) {
    this.id = null;
    this.pref = (typeof pref != 'undefined' ? pref : false);
    this.type = type || null;
    this.name = name || null;
    this.department = dept || null;
    this.title = title || null;
};

module.exports = ContactOrganization;

});

// file: lib/common/plugin/Coordinates.js
define("cordova/plugin/Coordinates", function(require, exports, module) {

/**
 * This class contains position information.
 * @param {Object} lat
 * @param {Object} lng
 * @param {Object} alt
 * @param {Object} acc
 * @param {Object} head
 * @param {Object} vel
 * @param {Object} altacc
 * @constructor
 */
var Coordinates = function(lat, lng, alt, acc, head, vel, altacc) {
    /**
     * The latitude of the position.
     */
    this.latitude = lat;
    /**
     * The longitude of the position,
     */
    this.longitude = lng;
    /**
     * The accuracy of the position.
     */
    this.accuracy = acc;
    /**
     * The altitude of the position.
     */
    this.altitude = (alt !== undefined ? alt : null);
    /**
     * The direction the device is moving at the position.
     */
    this.heading = (head !== undefined ? head : null);
    /**
     * The velocity with which the device is moving at the position.
     */
    this.speed = (vel !== undefined ? vel : null);

    if (this.speed === 0 || this.speed === null) {
        this.heading = NaN;
    }

    /**
     * The altitude accuracy of the position.
     */
    this.altitudeAccuracy = (altacc !== undefined) ? altacc : null;
};

module.exports = Coordinates;

});

// file: lib/common/plugin/DirectoryEntry.js
define("cordova/plugin/DirectoryEntry", function(require, exports, module) {

var argscheck = require('cordova/argscheck'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec'),
    Entry = require('cordova/plugin/Entry'),
    FileError = require('cordova/plugin/FileError'),
    DirectoryReader = require('cordova/plugin/DirectoryReader');

/**
 * An interface representing a directory on the file system.
 *
 * {boolean} isFile always false (readonly)
 * {boolean} isDirectory always true (readonly)
 * {DOMString} name of the directory, excluding the path leading to it (readonly)
 * {DOMString} fullPath the absolute full path to the directory (readonly)
 * TODO: implement this!!! {FileSystem} filesystem on which the directory resides (readonly)
 */
var DirectoryEntry = function(name, fullPath) {
     DirectoryEntry.__super__.constructor.call(this, false, true, name, fullPath);
};

utils.extend(DirectoryEntry, Entry);

/**
 * Creates a new DirectoryReader to read entries from this directory
 */
DirectoryEntry.prototype.createReader = function() {
    return new DirectoryReader(this.fullPath);
};

/**
 * Creates or looks up a directory
 *
 * @param {DOMString} path either a relative or absolute path from this directory in which to look up or create a directory
 * @param {Flags} options to create or exclusively create the directory
 * @param {Function} successCallback is called with the new entry
 * @param {Function} errorCallback is called with a FileError
 */
DirectoryEntry.prototype.getDirectory = function(path, options, successCallback, errorCallback) {
    argscheck.checkArgs('sOFF', 'DirectoryEntry.getDirectory', arguments);
    var win = successCallback && function(result) {
        var entry = new DirectoryEntry(result.name, result.fullPath);
        successCallback(entry);
    };
    var fail = errorCallback && function(code) {
        errorCallback(new FileError(code));
    };
    exec(win, fail, "File", "getDirectory", [this.fullPath, path, options]);
};

/**
 * Deletes a directory and all of it's contents
 *
 * @param {Function} successCallback is called with no parameters
 * @param {Function} errorCallback is called with a FileError
 */
DirectoryEntry.prototype.removeRecursively = function(successCallback, errorCallback) {
    argscheck.checkArgs('FF', 'DirectoryEntry.removeRecursively', arguments);
    var fail = errorCallback && function(code) {
        errorCallback(new FileError(code));
    };
    exec(successCallback, fail, "File", "removeRecursively", [this.fullPath]);
};

/**
 * Creates or looks up a file
 *
 * @param {DOMString} path either a relative or absolute path from this directory in which to look up or create a file
 * @param {Flags} options to create or exclusively create the file
 * @param {Function} successCallback is called with the new entry
 * @param {Function} errorCallback is called with a FileError
 */
DirectoryEntry.prototype.getFile = function(path, options, successCallback, errorCallback) {
    argscheck.checkArgs('sOFF', 'DirectoryEntry.getFile', arguments);
    var win = successCallback && function(result) {
        var FileEntry = require('cordova/plugin/FileEntry');
        var entry = new FileEntry(result.name, result.fullPath);
        successCallback(entry);
    };
    var fail = errorCallback && function(code) {
        errorCallback(new FileError(code));
    };
    exec(win, fail, "File", "getFile", [this.fullPath, path, options]);
};

module.exports = DirectoryEntry;

});

// file: lib/common/plugin/DirectoryReader.js
define("cordova/plugin/DirectoryReader", function(require, exports, module) {

var exec = require('cordova/exec'),
    FileError = require('cordova/plugin/FileError') ;

/**
 * An interface that lists the files and directories in a directory.
 */
function DirectoryReader(path) {
    this.path = path || null;
}

/**
 * Returns a list of entries from a directory.
 *
 * @param {Function} successCallback is called with a list of entries
 * @param {Function} errorCallback is called with a FileError
 */
DirectoryReader.prototype.readEntries = function(successCallback, errorCallback) {
    var win = typeof successCallback !== 'function' ? null : function(result) {
        var retVal = [];
        for (var i=0; i<result.length; i++) {
            var entry = null;
            if (result[i].isDirectory) {
                entry = new (require('cordova/plugin/DirectoryEntry'))();
            }
            else if (result[i].isFile) {
                entry = new (require('cordova/plugin/FileEntry'))();
            }
            entry.isDirectory = result[i].isDirectory;
            entry.isFile = result[i].isFile;
            entry.name = result[i].name;
            entry.fullPath = result[i].fullPath;
            retVal.push(entry);
        }
        successCallback(retVal);
    };
    var fail = typeof errorCallback !== 'function' ? null : function(code) {
        errorCallback(new FileError(code));
    };
    exec(win, fail, "File", "readEntries", [this.path]);
};

module.exports = DirectoryReader;

});

// file: lib/common/plugin/Entry.js
define("cordova/plugin/Entry", function(require, exports, module) {

var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec'),
    FileError = require('cordova/plugin/FileError'),
    Metadata = require('cordova/plugin/Metadata');

/**
 * Represents a file or directory on the local file system.
 *
 * @param isFile
 *            {boolean} true if Entry is a file (readonly)
 * @param isDirectory
 *            {boolean} true if Entry is a directory (readonly)
 * @param name
 *            {DOMString} name of the file or directory, excluding the path
 *            leading to it (readonly)
 * @param fullPath
 *            {DOMString} the absolute full path to the file or directory
 *            (readonly)
 */
function Entry(isFile, isDirectory, name, fullPath, fileSystem) {
    this.isFile = !!isFile;
    this.isDirectory = !!isDirectory;
    this.name = name || '';
    this.fullPath = fullPath || '';
    this.filesystem = fileSystem || null;
}

/**
 * Look up the metadata of the entry.
 *
 * @param successCallback
 *            {Function} is called with a Metadata object
 * @param errorCallback
 *            {Function} is called with a FileError
 */
Entry.prototype.getMetadata = function(successCallback, errorCallback) {
    argscheck.checkArgs('FF', 'Entry.getMetadata', arguments);
    var success = successCallback && function(lastModified) {
        var metadata = new Metadata(lastModified);
        successCallback(metadata);
    };
    var fail = errorCallback && function(code) {
        errorCallback(new FileError(code));
    };

    exec(success, fail, "File", "getMetadata", [this.fullPath]);
};

/**
 * Set the metadata of the entry.
 *
 * @param successCallback
 *            {Function} is called with a Metadata object
 * @param errorCallback
 *            {Function} is called with a FileError
 * @param metadataObject
 *            {Object} keys and values to set
 */
Entry.prototype.setMetadata = function(successCallback, errorCallback, metadataObject) {
    argscheck.checkArgs('FFO', 'Entry.setMetadata', arguments);
    exec(successCallback, errorCallback, "File", "setMetadata", [this.fullPath, metadataObject]);
};

/**
 * Move a file or directory to a new location.
 *
 * @param parent
 *            {DirectoryEntry} the directory to which to move this entry
 * @param newName
 *            {DOMString} new name of the entry, defaults to the current name
 * @param successCallback
 *            {Function} called with the new DirectoryEntry object
 * @param errorCallback
 *            {Function} called with a FileError
 */
Entry.prototype.moveTo = function(parent, newName, successCallback, errorCallback) {
    argscheck.checkArgs('oSFF', 'Entry.moveTo', arguments);
    var fail = errorCallback && function(code) {
        errorCallback(new FileError(code));
    };
    // source path
    var srcPath = this.fullPath,
        // entry name
        name = newName || this.name,
        success = function(entry) {
            if (entry) {
                if (successCallback) {
                    // create appropriate Entry object
                    var result = (entry.isDirectory) ? new (require('cordova/plugin/DirectoryEntry'))(entry.name, entry.fullPath) : new (require('cordova/plugin/FileEntry'))(entry.name, entry.fullPath);
                    successCallback(result);
                }
            }
            else {
                // no Entry object returned
                fail && fail(FileError.NOT_FOUND_ERR);
            }
        };

    // copy
    exec(success, fail, "File", "moveTo", [srcPath, parent.fullPath, name]);
};

/**
 * Copy a directory to a different location.
 *
 * @param parent
 *            {DirectoryEntry} the directory to which to copy the entry
 * @param newName
 *            {DOMString} new name of the entry, defaults to the current name
 * @param successCallback
 *            {Function} called with the new Entry object
 * @param errorCallback
 *            {Function} called with a FileError
 */
Entry.prototype.copyTo = function(parent, newName, successCallback, errorCallback) {
    argscheck.checkArgs('oSFF', 'Entry.copyTo', arguments);
    var fail = errorCallback && function(code) {
        errorCallback(new FileError(code));
    };

        // source path
    var srcPath = this.fullPath,
        // entry name
        name = newName || this.name,
        // success callback
        success = function(entry) {
            if (entry) {
                if (successCallback) {
                    // create appropriate Entry object
                    var result = (entry.isDirectory) ? new (require('cordova/plugin/DirectoryEntry'))(entry.name, entry.fullPath) : new (require('cordova/plugin/FileEntry'))(entry.name, entry.fullPath);
                    successCallback(result);
                }
            }
            else {
                // no Entry object returned
                fail && fail(FileError.NOT_FOUND_ERR);
            }
        };

    // copy
    exec(success, fail, "File", "copyTo", [srcPath, parent.fullPath, name]);
};

/**
 * Return a URL that can be used to identify this entry.
 */
Entry.prototype.toURL = function() {
    // fullPath attribute contains the full URL
    return this.fullPath;
};

/**
 * Returns a URI that can be used to identify this entry.
 *
 * @param {DOMString} mimeType for a FileEntry, the mime type to be used to interpret the file, when loaded through this URI.
 * @return uri
 */
Entry.prototype.toURI = function(mimeType) {
    console.log("DEPRECATED: Update your code to use 'toURL'");
    // fullPath attribute contains the full URI
    return this.toURL();
};

/**
 * Remove a file or directory. It is an error to attempt to delete a
 * directory that is not empty. It is an error to attempt to delete a
 * root directory of a file system.
 *
 * @param successCallback {Function} called with no parameters
 * @param errorCallback {Function} called with a FileError
 */
Entry.prototype.remove = function(successCallback, errorCallback) {
    argscheck.checkArgs('FF', 'Entry.remove', arguments);
    var fail = errorCallback && function(code) {
        errorCallback(new FileError(code));
    };
    exec(successCallback, fail, "File", "remove", [this.fullPath]);
};

/**
 * Look up the parent DirectoryEntry of this entry.
 *
 * @param successCallback {Function} called with the parent DirectoryEntry object
 * @param errorCallback {Function} called with a FileError
 */
Entry.prototype.getParent = function(successCallback, errorCallback) {
    argscheck.checkArgs('FF', 'Entry.getParent', arguments);
    var win = successCallback && function(result) {
        var DirectoryEntry = require('cordova/plugin/DirectoryEntry');
        var entry = new DirectoryEntry(result.name, result.fullPath);
        successCallback(entry);
    };
    var fail = errorCallback && function(code) {
        errorCallback(new FileError(code));
    };
    exec(win, fail, "File", "getParent", [this.fullPath]);
};

module.exports = Entry;

});

// file: lib/common/plugin/File.js
define("cordova/plugin/File", function(require, exports, module) {

/**
 * Constructor.
 * name {DOMString} name of the file, without path information
 * fullPath {DOMString} the full path of the file, including the name
 * type {DOMString} mime type
 * lastModifiedDate {Date} last modified date
 * size {Number} size of the file in bytes
 */

var File = function(name, fullPath, type, lastModifiedDate, size){
    this.name = name || '';
    this.fullPath = fullPath || null;
    this.type = type || null;
    this.lastModifiedDate = lastModifiedDate || null;
    this.size = size || 0;

    // These store the absolute start and end for slicing the file.
    this.start = 0;
    this.end = this.size;
};

/**
 * Returns a "slice" of the file. Since Cordova Files don't contain the actual
 * content, this really returns a File with adjusted start and end.
 * Slices of slices are supported.
 * start {Number} The index at which to start the slice (inclusive).
 * end {Number} The index at which to end the slice (exclusive).
 */
File.prototype.slice = function(start, end) {
    var size = this.end - this.start;
    var newStart = 0;
    var newEnd = size;
    if (arguments.length) {
        if (start < 0) {
            newStart = Math.max(size + start, 0);
        } else {
            newStart = Math.min(size, start);
        }
    }

    if (arguments.length >= 2) {
        if (end < 0) {
            newEnd = Math.max(size + end, 0);
        } else {
            newEnd = Math.min(end, size);
        }
    }

    var newFile = new File(this.name, this.fullPath, this.type, this.lastModifiedData, this.size);
    newFile.start = this.start + newStart;
    newFile.end = this.start + newEnd;
    return newFile;
};


module.exports = File;

});

// file: lib/common/plugin/FileEntry.js
define("cordova/plugin/FileEntry", function(require, exports, module) {

var utils = require('cordova/utils'),
    exec = require('cordova/exec'),
    Entry = require('cordova/plugin/Entry'),
    FileWriter = require('cordova/plugin/FileWriter'),
    File = require('cordova/plugin/File'),
    FileError = require('cordova/plugin/FileError');

/**
 * An interface representing a file on the file system.
 *
 * {boolean} isFile always true (readonly)
 * {boolean} isDirectory always false (readonly)
 * {DOMString} name of the file, excluding the path leading to it (readonly)
 * {DOMString} fullPath the absolute full path to the file (readonly)
 * {FileSystem} filesystem on which the file resides (readonly)
 */
var FileEntry = function(name, fullPath) {
     FileEntry.__super__.constructor.apply(this, [true, false, name, fullPath]);
};

utils.extend(FileEntry, Entry);

/**
 * Creates a new FileWriter associated with the file that this FileEntry represents.
 *
 * @param {Function} successCallback is called with the new FileWriter
 * @param {Function} errorCallback is called with a FileError
 */
FileEntry.prototype.createWriter = function(successCallback, errorCallback) {
    this.file(function(filePointer) {
        var writer = new FileWriter(filePointer);

        if (writer.fileName === null || writer.fileName === "") {
            errorCallback && errorCallback(new FileError(FileError.INVALID_STATE_ERR));
        } else {
            successCallback && successCallback(writer);
        }
    }, errorCallback);
};

/**
 * Returns a File that represents the current state of the file that this FileEntry represents.
 *
 * @param {Function} successCallback is called with the new File object
 * @param {Function} errorCallback is called with a FileError
 */
FileEntry.prototype.file = function(successCallback, errorCallback) {
    var win = successCallback && function(f) {
        var file = new File(f.name, f.fullPath, f.type, f.lastModifiedDate, f.size);
        successCallback(file);
    };
    var fail = errorCallback && function(code) {
        errorCallback(new FileError(code));
    };
    exec(win, fail, "File", "getFileMetadata", [this.fullPath]);
};


module.exports = FileEntry;

});

// file: lib/common/plugin/FileError.js
define("cordova/plugin/FileError", function(require, exports, module) {

/**
 * FileError
 */
function FileError(error) {
  this.code = error || null;
}

// File error codes
// Found in DOMException
FileError.NOT_FOUND_ERR = 1;
FileError.SECURITY_ERR = 2;
FileError.ABORT_ERR = 3;

// Added by File API specification
FileError.NOT_READABLE_ERR = 4;
FileError.ENCODING_ERR = 5;
FileError.NO_MODIFICATION_ALLOWED_ERR = 6;
FileError.INVALID_STATE_ERR = 7;
FileError.SYNTAX_ERR = 8;
FileError.INVALID_MODIFICATION_ERR = 9;
FileError.QUOTA_EXCEEDED_ERR = 10;
FileError.TYPE_MISMATCH_ERR = 11;
FileError.PATH_EXISTS_ERR = 12;

module.exports = FileError;

});

// file: lib/common/plugin/FileReader.js
define("cordova/plugin/FileReader", function(require, exports, module) {

var exec = require('cordova/exec'),
    modulemapper = require('cordova/modulemapper'),
    utils = require('cordova/utils'),
    File = require('cordova/plugin/File'),
    FileError = require('cordova/plugin/FileError'),
    ProgressEvent = require('cordova/plugin/ProgressEvent'),
    origFileReader = modulemapper.getOriginalSymbol(this, 'FileReader');

/**
 * This class reads the mobile device file system.
 *
 * For Android:
 *      The root directory is the root of the file system.
 *      To read from the SD card, the file name is "sdcard/my_file.txt"
 * @constructor
 */
var FileReader = function() {
    this._readyState = 0;
    this._error = null;
    this._result = null;
    this._fileName = '';
    this._realReader = origFileReader ? new origFileReader() : {};
};

// States
FileReader.EMPTY = 0;
FileReader.LOADING = 1;
FileReader.DONE = 2;

utils.defineGetter(FileReader.prototype, 'readyState', function() {
    return this._fileName ? this._readyState : this._realReader.readyState;
});

utils.defineGetter(FileReader.prototype, 'error', function() {
    return this._fileName ? this._error: this._realReader.error;
});

utils.defineGetter(FileReader.prototype, 'result', function() {
    return this._fileName ? this._result: this._realReader.result;
});

function defineEvent(eventName) {
    utils.defineGetterSetter(FileReader.prototype, eventName, function() {
        return this._realReader[eventName] || null;
    }, function(value) {
        this._realReader[eventName] = value;
    });
}
defineEvent('onloadstart');    // When the read starts.
defineEvent('onprogress');     // While reading (and decoding) file or fileBlob data, and reporting partial file data (progress.loaded/progress.total)
defineEvent('onload');         // When the read has successfully completed.
defineEvent('onerror');        // When the read has failed (see errors).
defineEvent('onloadend');      // When the request has completed (either in success or failure).
defineEvent('onabort');        // When the read has been aborted. For instance, by invoking the abort() method.

function initRead(reader, file) {
    // Already loading something
    if (reader.readyState == FileReader.LOADING) {
      throw new FileError(FileError.INVALID_STATE_ERR);
    }

    reader._result = null;
    reader._error = null;
    reader._readyState = FileReader.LOADING;

    if (typeof file == 'string') {
        // Deprecated in Cordova 2.4.
        console.warn('Using a string argument with FileReader.readAs functions is deprecated.');
        reader._fileName = file;
    } else if (typeof file.fullPath == 'string') {
        reader._fileName = file.fullPath;
    } else {
        reader._fileName = '';
        return true;
    }

    reader.onloadstart && reader.onloadstart(new ProgressEvent("loadstart", {target:reader}));
}

/**
 * Abort reading file.
 */
FileReader.prototype.abort = function() {
    if (origFileReader && !this._fileName) {
        return this._realReader.abort();
    }
    this._result = null;

    if (this._readyState == FileReader.DONE || this._readyState == FileReader.EMPTY) {
      return;
    }

    this._readyState = FileReader.DONE;

    // If abort callback
    if (typeof this.onabort === 'function') {
        this.onabort(new ProgressEvent('abort', {target:this}));
    }
    // If load end callback
    if (typeof this.onloadend === 'function') {
        this.onloadend(new ProgressEvent('loadend', {target:this}));
    }
};

/**
 * Read text file.
 *
 * @param file          {File} File object containing file properties
 * @param encoding      [Optional] (see http://www.iana.org/assignments/character-sets)
 */
FileReader.prototype.readAsText = function(file, encoding) {
    if (initRead(this, file)) {
        return this._realReader.readAsText(file, encoding);
    }

    // Default encoding is UTF-8
    var enc = encoding ? encoding : "UTF-8";
    var me = this;
    var execArgs = [this._fileName, enc, file.start, file.end];

    // Read file
    exec(
        // Success callback
        function(r) {
            // If DONE (cancelled), then don't do anything
            if (me._readyState === FileReader.DONE) {
                return;
            }

            // Save result
            me._result = r;

            // If onload callback
            if (typeof me.onload === "function") {
                me.onload(new ProgressEvent("load", {target:me}));
            }

            // DONE state
            me._readyState = FileReader.DONE;

            // If onloadend callback
            if (typeof me.onloadend === "function") {
                me.onloadend(new ProgressEvent("loadend", {target:me}));
            }
        },
        // Error callback
        function(e) {
            // If DONE (cancelled), then don't do anything
            if (me._readyState === FileReader.DONE) {
                return;
            }

            // DONE state
            me._readyState = FileReader.DONE;

            // null result
            me._result = null;

            // Save error
            me._error = new FileError(e);

            // If onerror callback
            if (typeof me.onerror === "function") {
                me.onerror(new ProgressEvent("error", {target:me}));
            }

            // If onloadend callback
            if (typeof me.onloadend === "function") {
                me.onloadend(new ProgressEvent("loadend", {target:me}));
            }
        }, "File", "readAsText", execArgs);
};


/**
 * Read file and return data as a base64 encoded data url.
 * A data url is of the form:
 *      data:[<mediatype>][;base64],<data>
 *
 * @param file          {File} File object containing file properties
 */
FileReader.prototype.readAsDataURL = function(file) {
    if (initRead(this, file)) {
        return this._realReader.readAsDataURL(file);
    }

    var me = this;
    var execArgs = [this._fileName, file.start, file.end];

    // Read file
    exec(
        // Success callback
        function(r) {
            // If DONE (cancelled), then don't do anything
            if (me._readyState === FileReader.DONE) {
                return;
            }

            // DONE state
            me._readyState = FileReader.DONE;

            // Save result
            me._result = r;

            // If onload callback
            if (typeof me.onload === "function") {
                me.onload(new ProgressEvent("load", {target:me}));
            }

            // If onloadend callback
            if (typeof me.onloadend === "function") {
                me.onloadend(new ProgressEvent("loadend", {target:me}));
            }
        },
        // Error callback
        function(e) {
            // If DONE (cancelled), then don't do anything
            if (me._readyState === FileReader.DONE) {
                return;
            }

            // DONE state
            me._readyState = FileReader.DONE;

            me._result = null;

            // Save error
            me._error = new FileError(e);

            // If onerror callback
            if (typeof me.onerror === "function") {
                me.onerror(new ProgressEvent("error", {target:me}));
            }

            // If onloadend callback
            if (typeof me.onloadend === "function") {
                me.onloadend(new ProgressEvent("loadend", {target:me}));
            }
        }, "File", "readAsDataURL", execArgs);
};

/**
 * Read file and return data as a binary data.
 *
 * @param file          {File} File object containing file properties
 */
FileReader.prototype.readAsBinaryString = function(file) {
    if (initRead(this, file)) {
        return this._realReader.readAsBinaryString(file);
    }

    var me = this;
    var execArgs = [this._fileName, file.start, file.end];

    // Read file
    exec(
        // Success callback
        function(r) {
            // If DONE (cancelled), then don't do anything
            if (me._readyState === FileReader.DONE) {
                return;
            }

            // DONE state
            me._readyState = FileReader.DONE;

            me._result = r;

            // If onload callback
            if (typeof me.onload === "function") {
                me.onload(new ProgressEvent("load", {target:me}));
            }

            // If onloadend callback
            if (typeof me.onloadend === "function") {
                me.onloadend(new ProgressEvent("loadend", {target:me}));
            }
        },
        // Error callback
        function(e) {
            // If DONE (cancelled), then don't do anything
            if (me._readyState === FileReader.DONE) {
                return;
            }

            // DONE state
            me._readyState = FileReader.DONE;

            me._result = null;

            // Save error
            me._error = new FileError(e);

            // If onerror callback
            if (typeof me.onerror === "function") {
                me.onerror(new ProgressEvent("error", {target:me}));
            }

            // If onloadend callback
            if (typeof me.onloadend === "function") {
                me.onloadend(new ProgressEvent("loadend", {target:me}));
            }
        }, "File", "readAsBinaryString", execArgs);
};

/**
 * Read file and return data as a binary data.
 *
 * @param file          {File} File object containing file properties
 */
FileReader.prototype.readAsArrayBuffer = function(file) {
    if (initRead(this, file)) {
        return this._realReader.readAsArrayBuffer(file);
    }

    var me = this;
    var execArgs = [this._fileName, file.start, file.end];

    // Read file
    exec(
        // Success callback
        function(r) {
            // If DONE (cancelled), then don't do anything
            if (me._readyState === FileReader.DONE) {
                return;
            }

            // DONE state
            me._readyState = FileReader.DONE;

            me._result = r;

            // If onload callback
            if (typeof me.onload === "function") {
                me.onload(new ProgressEvent("load", {target:me}));
            }

            // If onloadend callback
            if (typeof me.onloadend === "function") {
                me.onloadend(new ProgressEvent("loadend", {target:me}));
            }
        },
        // Error callback
        function(e) {
            // If DONE (cancelled), then don't do anything
            if (me._readyState === FileReader.DONE) {
                return;
            }

            // DONE state
            me._readyState = FileReader.DONE;

            me._result = null;

            // Save error
            me._error = new FileError(e);

            // If onerror callback
            if (typeof me.onerror === "function") {
                me.onerror(new ProgressEvent("error", {target:me}));
            }

            // If onloadend callback
            if (typeof me.onloadend === "function") {
                me.onloadend(new ProgressEvent("loadend", {target:me}));
            }
        }, "File", "readAsArrayBuffer", execArgs);
};

module.exports = FileReader;

});

// file: lib/common/plugin/FileSystem.js
define("cordova/plugin/FileSystem", function(require, exports, module) {

var DirectoryEntry = require('cordova/plugin/DirectoryEntry');

/**
 * An interface representing a file system
 *
 * @constructor
 * {DOMString} name the unique name of the file system (readonly)
 * {DirectoryEntry} root directory of the file system (readonly)
 */
var FileSystem = function(name, root) {
    this.name = name || null;
    if (root) {
        this.root = new DirectoryEntry(root.name, root.fullPath);
    }
};

module.exports = FileSystem;

});

// file: lib/common/plugin/FileTransfer.js
define("cordova/plugin/FileTransfer", function(require, exports, module) {

var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec'),
    FileTransferError = require('cordova/plugin/FileTransferError'),
    ProgressEvent = require('cordova/plugin/ProgressEvent');

function newProgressEvent(result) {
    var pe = new ProgressEvent();
    pe.lengthComputable = result.lengthComputable;
    pe.loaded = result.loaded;
    pe.total = result.total;
    return pe;
}

function getBasicAuthHeader(urlString) {
    var header =  null;

    if (window.btoa) {
        // parse the url using the Location object
        var url = document.createElement('a');
        url.href = urlString;

        var credentials = null;
        var protocol = url.protocol + "//";
        var origin = protocol + url.host;

        // check whether there are the username:password credentials in the url
        if (url.href.indexOf(origin) !== 0) { // credentials found
            var atIndex = url.href.indexOf("@");
            credentials = url.href.substring(protocol.length, atIndex);
        }

        if (credentials) {
            var authHeader = "Authorization";
            var authHeaderValue = "Basic " + window.btoa(credentials);

            header = {
                name : authHeader,
                value : authHeaderValue
            };
        }
    }

    return header;
}

var idCounter = 0;

/**
 * FileTransfer uploads a file to a remote server.
 * @constructor
 */
var FileTransfer = function() {
    this._id = ++idCounter;
    this.onprogress = null; // optional callback
};

/**
* Given an absolute file path, uploads a file on the device to a remote server
* using a multipart HTTP request.
* @param filePath {String}           Full path of the file on the device
* @param server {String}             URL of the server to receive the file
* @param successCallback (Function}  Callback to be invoked when upload has completed
* @param errorCallback {Function}    Callback to be invoked upon error
* @param options {FileUploadOptions} Optional parameters such as file name and mimetype
* @param trustAllHosts {Boolean} Optional trust all hosts (e.g. for self-signed certs), defaults to false
*/
FileTransfer.prototype.upload = function(filePath, server, successCallback, errorCallback, options, trustAllHosts) {
    argscheck.checkArgs('ssFFO*', 'FileTransfer.upload', arguments);
    // check for options
    var fileKey = null;
    var fileName = null;
    var mimeType = null;
    var params = null;
    var chunkedMode = true;
    var headers = null;
    var httpMethod = null;
    var basicAuthHeader = getBasicAuthHeader(server);
    if (basicAuthHeader) {
        options = options || {};
        options.headers = options.headers || {};
        options.headers[basicAuthHeader.name] = basicAuthHeader.value;
    }

    if (options) {
        fileKey = options.fileKey;
        fileName = options.fileName;
        mimeType = options.mimeType;
        headers = options.headers;
        httpMethod = options.httpMethod || "POST";
        if (httpMethod.toUpperCase() == "PUT"){
            httpMethod = "PUT";
        } else {
            httpMethod = "POST";
        }
        if (options.chunkedMode !== null || typeof options.chunkedMode != "undefined") {
            chunkedMode = options.chunkedMode;
        }
        if (options.params) {
            params = options.params;
        }
        else {
            params = {};
        }
    }

    var fail = errorCallback && function(e) {
        var error = new FileTransferError(e.code, e.source, e.target, e.http_status, e.body);
        errorCallback(error);
    };

    var self = this;
    var win = function(result) {
        if (typeof result.lengthComputable != "undefined") {
            if (self.onprogress) {
                self.onprogress(newProgressEvent(result));
            }
        } else {
            successCallback && successCallback(result);
        }
    };
    exec(win, fail, 'FileTransfer', 'upload', [filePath, server, fileKey, fileName, mimeType, params, trustAllHosts, chunkedMode, headers, this._id, httpMethod]);
};

/**
 * Downloads a file form a given URL and saves it to the specified directory.
 * @param source {String}          URL of the server to receive the file
 * @param target {String}         Full path of the file on the device
 * @param successCallback (Function}  Callback to be invoked when upload has completed
 * @param errorCallback {Function}    Callback to be invoked upon error
 * @param trustAllHosts {Boolean} Optional trust all hosts (e.g. for self-signed certs), defaults to false
 * @param options {FileDownloadOptions} Optional parameters such as headers
 */
FileTransfer.prototype.download = function(source, target, successCallback, errorCallback, trustAllHosts, options) {
    argscheck.checkArgs('ssFF*', 'FileTransfer.download', arguments);
    var self = this;

    var basicAuthHeader = getBasicAuthHeader(source);
    if (basicAuthHeader) {
        options = options || {};
        options.headers = options.headers || {};
        options.headers[basicAuthHeader.name] = basicAuthHeader.value;
    }

    var headers = null;
    if (options) {
        headers = options.headers || null;
    }

    var win = function(result) {
        if (typeof result.lengthComputable != "undefined") {
            if (self.onprogress) {
                return self.onprogress(newProgressEvent(result));
            }
        } else if (successCallback) {
            var entry = null;
            if (result.isDirectory) {
                entry = new (require('cordova/plugin/DirectoryEntry'))();
            }
            else if (result.isFile) {
                entry = new (require('cordova/plugin/FileEntry'))();
            }
            entry.isDirectory = result.isDirectory;
            entry.isFile = result.isFile;
            entry.name = result.name;
            entry.fullPath = result.fullPath;
            successCallback(entry);
        }
    };

    var fail = errorCallback && function(e) {
        var error = new FileTransferError(e.code, e.source, e.target, e.http_status, e.body);
        errorCallback(error);
    };

    exec(win, fail, 'FileTransfer', 'download', [source, target, trustAllHosts, this._id, headers]);
};

/**
 * Aborts the ongoing file transfer on this object. The original error
 * callback for the file transfer will be called if necessary.
 */
FileTransfer.prototype.abort = function() {
    exec(null, null, 'FileTransfer', 'abort', [this._id]);
};

module.exports = FileTransfer;

});

// file: lib/common/plugin/FileTransferError.js
define("cordova/plugin/FileTransferError", function(require, exports, module) {

/**
 * FileTransferError
 * @constructor
 */
var FileTransferError = function(code, source, target, status, body) {
    this.code = code || null;
    this.source = source || null;
    this.target = target || null;
    this.http_status = status || null;
    this.body = body || null;
};

FileTransferError.FILE_NOT_FOUND_ERR = 1;
FileTransferError.INVALID_URL_ERR = 2;
FileTransferError.CONNECTION_ERR = 3;
FileTransferError.ABORT_ERR = 4;

module.exports = FileTransferError;

});

// file: lib/common/plugin/FileUploadOptions.js
define("cordova/plugin/FileUploadOptions", function(require, exports, module) {

/**
 * Options to customize the HTTP request used to upload files.
 * @constructor
 * @param fileKey {String}   Name of file request parameter.
 * @param fileName {String}  Filename to be used by the server. Defaults to image.jpg.
 * @param mimeType {String}  Mimetype of the uploaded file. Defaults to image/jpeg.
 * @param params {Object}    Object with key: value params to send to the server.
 * @param headers {Object}   Keys are header names, values are header values. Multiple
 *                           headers of the same name are not supported.
 */
var FileUploadOptions = function(fileKey, fileName, mimeType, params, headers, httpMethod) {
    this.fileKey = fileKey || null;
    this.fileName = fileName || null;
    this.mimeType = mimeType || null;
    this.params = params || null;
    this.headers = headers || null;
    this.httpMethod = httpMethod || null;
};

module.exports = FileUploadOptions;

});

// file: lib/common/plugin/FileUploadResult.js
define("cordova/plugin/FileUploadResult", function(require, exports, module) {

/**
 * FileUploadResult
 * @constructor
 */
var FileUploadResult = function() {
    this.bytesSent = 0;
    this.responseCode = null;
    this.response = null;
};

module.exports = FileUploadResult;

});

// file: lib/common/plugin/FileWriter.js
define("cordova/plugin/FileWriter", function(require, exports, module) {

var exec = require('cordova/exec'),
    FileError = require('cordova/plugin/FileError'),
    ProgressEvent = require('cordova/plugin/ProgressEvent');

/**
 * This class writes to the mobile device file system.
 *
 * For Android:
 *      The root directory is the root of the file system.
 *      To write to the SD card, the file name is "sdcard/my_file.txt"
 *
 * @constructor
 * @param file {File} File object containing file properties
 * @param append if true write to the end of the file, otherwise overwrite the file
 */
var FileWriter = function(file) {
    this.fileName = "";
    this.length = 0;
    if (file) {
        this.fileName = file.fullPath || file;
        this.length = file.size || 0;
    }
    // default is to write at the beginning of the file
    this.position = 0;

    this.readyState = 0; // EMPTY

    this.result = null;

    // Error
    this.error = null;

    // Event handlers
    this.onwritestart = null;   // When writing starts
    this.onprogress = null;     // While writing the file, and reporting partial file data
    this.onwrite = null;        // When the write has successfully completed.
    this.onwriteend = null;     // When the request has completed (either in success or failure).
    this.onabort = null;        // When the write has been aborted. For instance, by invoking the abort() method.
    this.onerror = null;        // When the write has failed (see errors).
};

// States
FileWriter.INIT = 0;
FileWriter.WRITING = 1;
FileWriter.DONE = 2;

/**
 * Abort writing file.
 */
FileWriter.prototype.abort = function() {
    // check for invalid state
    if (this.readyState === FileWriter.DONE || this.readyState === FileWriter.INIT) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    // set error
    this.error = new FileError(FileError.ABORT_ERR);

    this.readyState = FileWriter.DONE;

    // If abort callback
    if (typeof this.onabort === "function") {
        this.onabort(new ProgressEvent("abort", {"target":this}));
    }

    // If write end callback
    if (typeof this.onwriteend === "function") {
        this.onwriteend(new ProgressEvent("writeend", {"target":this}));
    }
};

/**
 * Writes data to the file
 *
 * @param text to be written
 */
FileWriter.prototype.write = function(text) {
    // Throw an exception if we are already writing a file
    if (this.readyState === FileWriter.WRITING) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    // WRITING state
    this.readyState = FileWriter.WRITING;

    var me = this;

    // If onwritestart callback
    if (typeof me.onwritestart === "function") {
        me.onwritestart(new ProgressEvent("writestart", {"target":me}));
    }

    // Write file
    exec(
        // Success callback
        function(r) {
            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileWriter.DONE) {
                return;
            }

            // position always increases by bytes written because file would be extended
            me.position += r;
            // The length of the file is now where we are done writing.

            me.length = me.position;

            // DONE state
            me.readyState = FileWriter.DONE;

            // If onwrite callback
            if (typeof me.onwrite === "function") {
                me.onwrite(new ProgressEvent("write", {"target":me}));
            }

            // If onwriteend callback
            if (typeof me.onwriteend === "function") {
                me.onwriteend(new ProgressEvent("writeend", {"target":me}));
            }
        },
        // Error callback
        function(e) {
            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileWriter.DONE) {
                return;
            }

            // DONE state
            me.readyState = FileWriter.DONE;

            // Save error
            me.error = new FileError(e);

            // If onerror callback
            if (typeof me.onerror === "function") {
                me.onerror(new ProgressEvent("error", {"target":me}));
            }

            // If onwriteend callback
            if (typeof me.onwriteend === "function") {
                me.onwriteend(new ProgressEvent("writeend", {"target":me}));
            }
        }, "File", "write", [this.fileName, text, this.position]);
};

/**
 * Moves the file pointer to the location specified.
 *
 * If the offset is a negative number the position of the file
 * pointer is rewound.  If the offset is greater than the file
 * size the position is set to the end of the file.
 *
 * @param offset is the location to move the file pointer to.
 */
FileWriter.prototype.seek = function(offset) {
    // Throw an exception if we are already writing a file
    if (this.readyState === FileWriter.WRITING) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    if (!offset && offset !== 0) {
        return;
    }

    // See back from end of file.
    if (offset < 0) {
        this.position = Math.max(offset + this.length, 0);
    }
    // Offset is bigger than file size so set position
    // to the end of the file.
    else if (offset > this.length) {
        this.position = this.length;
    }
    // Offset is between 0 and file size so set the position
    // to start writing.
    else {
        this.position = offset;
    }
};

/**
 * Truncates the file to the size specified.
 *
 * @param size to chop the file at.
 */
FileWriter.prototype.truncate = function(size) {
    // Throw an exception if we are already writing a file
    if (this.readyState === FileWriter.WRITING) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    // WRITING state
    this.readyState = FileWriter.WRITING;

    var me = this;

    // If onwritestart callback
    if (typeof me.onwritestart === "function") {
        me.onwritestart(new ProgressEvent("writestart", {"target":this}));
    }

    // Write file
    exec(
        // Success callback
        function(r) {
            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileWriter.DONE) {
                return;
            }

            // DONE state
            me.readyState = FileWriter.DONE;

            // Update the length of the file
            me.length = r;
            me.position = Math.min(me.position, r);

            // If onwrite callback
            if (typeof me.onwrite === "function") {
                me.onwrite(new ProgressEvent("write", {"target":me}));
            }

            // If onwriteend callback
            if (typeof me.onwriteend === "function") {
                me.onwriteend(new ProgressEvent("writeend", {"target":me}));
            }
        },
        // Error callback
        function(e) {
            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileWriter.DONE) {
                return;
            }

            // DONE state
            me.readyState = FileWriter.DONE;

            // Save error
            me.error = new FileError(e);

            // If onerror callback
            if (typeof me.onerror === "function") {
                me.onerror(new ProgressEvent("error", {"target":me}));
            }

            // If onwriteend callback
            if (typeof me.onwriteend === "function") {
                me.onwriteend(new ProgressEvent("writeend", {"target":me}));
            }
        }, "File", "truncate", [this.fileName, size]);
};

module.exports = FileWriter;

});

// file: lib/common/plugin/Flags.js
define("cordova/plugin/Flags", function(require, exports, module) {

/**
 * Supplies arguments to methods that lookup or create files and directories.
 *
 * @param create
 *            {boolean} file or directory if it doesn't exist
 * @param exclusive
 *            {boolean} used with create; if true the command will fail if
 *            target path exists
 */
function Flags(create, exclusive) {
    this.create = create || false;
    this.exclusive = exclusive || false;
}

module.exports = Flags;

});

// file: lib/common/plugin/GlobalizationError.js
define("cordova/plugin/GlobalizationError", function(require, exports, module) {


/**
 * Globalization error object
 *
 * @constructor
 * @param code
 * @param message
 */
var GlobalizationError = function(code, message) {
    this.code = code || null;
    this.message = message || '';
};

// Globalization error codes
GlobalizationError.UNKNOWN_ERROR = 0;
GlobalizationError.FORMATTING_ERROR = 1;
GlobalizationError.PARSING_ERROR = 2;
GlobalizationError.PATTERN_ERROR = 3;

module.exports = GlobalizationError;

});

// file: lib/common/plugin/InAppBrowser.js
define("cordova/plugin/InAppBrowser", function(require, exports, module) {

var exec = require('cordova/exec');
var channel = require('cordova/channel');
var modulemapper = require('cordova/modulemapper');

function InAppBrowser() {
   this.channels = {
        'loadstart': channel.create('loadstart'),
        'loadstop' : channel.create('loadstop'),
        'loaderror' : channel.create('loaderror'),
        'exit' : channel.create('exit')
   };
}

InAppBrowser.prototype = {
    _eventHandler: function (event) {
        if (event.type in this.channels) {
            this.channels[event.type].fire(event);
        }
    },
    close: function (eventname) {
        exec(null, null, "InAppBrowser", "close", []);
    },
    addEventListener: function (eventname,f) {
        if (eventname in this.channels) {
            this.channels[eventname].subscribe(f);
        }
    },
    removeEventListener: function(eventname, f) {
        if (eventname in this.channels) {
            this.channels[eventname].unsubscribe(f);
        }
    },

    executeScript: function(injectDetails, cb) {
        if (injectDetails.code) {
            exec(cb, null, "InAppBrowser", "injectScriptCode", [injectDetails.code, !!cb]);
        } else if (injectDetails.file) {
            exec(cb, null, "InAppBrowser", "injectScriptFile", [injectDetails.file, !!cb]);
        } else {
            throw new Error('executeScript requires exactly one of code or file to be specified');
        }
    },

    insertCSS: function(injectDetails, cb) {
        if (injectDetails.code) {
            exec(cb, null, "InAppBrowser", "injectStyleCode", [injectDetails.code, !!cb]);
        } else if (injectDetails.file) {
            exec(cb, null, "InAppBrowser", "injectStyleFile", [injectDetails.file, !!cb]);
        } else {
            throw new Error('insertCSS requires exactly one of code or file to be specified');
        }
    }
};

module.exports = function(strUrl, strWindowName, strWindowFeatures) {
    var iab = new InAppBrowser();
    var cb = function(eventname) {
       iab._eventHandler(eventname);
    };

    // Don't catch calls that write to existing frames (e.g. named iframes).
    if (window.frames && window.frames[strWindowName]) {
        var origOpenFunc = modulemapper.getOriginalSymbol(window, 'open');
        return origOpenFunc.apply(window, arguments);
    }

    exec(cb, cb, "InAppBrowser", "open", [strUrl, strWindowName, strWindowFeatures]);
    return iab;
};


});

// file: lib/common/plugin/LocalFileSystem.js
define("cordova/plugin/LocalFileSystem", function(require, exports, module) {

var exec = require('cordova/exec');

/**
 * Represents a local file system.
 */
var LocalFileSystem = function() {

};

LocalFileSystem.TEMPORARY = 0; //temporary, with no guarantee of persistence
LocalFileSystem.PERSISTENT = 1; //persistent

module.exports = LocalFileSystem;

});

// file: lib/common/plugin/Media.js
define("cordova/plugin/Media", function(require, exports, module) {

var argscheck = require('cordova/argscheck'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec');

var mediaObjects = {};

/**
 * This class provides access to the device media, interfaces to both sound and video
 *
 * @constructor
 * @param src                   The file name or url to play
 * @param successCallback       The callback to be called when the file is done playing or recording.
 *                                  successCallback()
 * @param errorCallback         The callback to be called if there is an error.
 *                                  errorCallback(int errorCode) - OPTIONAL
 * @param statusCallback        The callback to be called when media status has changed.
 *                                  statusCallback(int statusCode) - OPTIONAL
 */
var Media = function(src, successCallback, errorCallback, statusCallback) {
    argscheck.checkArgs('SFFF', 'Media', arguments);
    this.id = utils.createUUID();
    mediaObjects[this.id] = this;
    this.src = src;
    this.successCallback = successCallback;
    this.errorCallback = errorCallback;
    this.statusCallback = statusCallback;
    this._duration = -1;
    this._position = -1;
    exec(null, this.errorCallback, "Media", "create", [this.id, this.src]);
};

// Media messages
Media.MEDIA_STATE = 1;
Media.MEDIA_DURATION = 2;
Media.MEDIA_POSITION = 3;
Media.MEDIA_ERROR = 9;

// Media states
Media.MEDIA_NONE = 0;
Media.MEDIA_STARTING = 1;
Media.MEDIA_RUNNING = 2;
Media.MEDIA_PAUSED = 3;
Media.MEDIA_STOPPED = 4;
Media.MEDIA_MSG = ["None", "Starting", "Running", "Paused", "Stopped"];

// "static" function to return existing objs.
Media.get = function(id) {
    return mediaObjects[id];
};

/**
 * Start or resume playing audio file.
 */
Media.prototype.play = function(options) {
    exec(null, null, "Media", "startPlayingAudio", [this.id, this.src, options]);
};

/**
 * Stop playing audio file.
 */
Media.prototype.stop = function() {
    var me = this;
    exec(function() {
        me._position = 0;
    }, this.errorCallback, "Media", "stopPlayingAudio", [this.id]);
};

/**
 * Seek or jump to a new time in the track..
 */
Media.prototype.seekTo = function(milliseconds) {
    var me = this;
    exec(function(p) {
        me._position = p;
    }, this.errorCallback, "Media", "seekToAudio", [this.id, milliseconds]);
};

/**
 * Pause playing audio file.
 */
Media.prototype.pause = function() {
    exec(null, this.errorCallback, "Media", "pausePlayingAudio", [this.id]);
};

/**
 * Get duration of an audio file.
 * The duration is only set for audio that is playing, paused or stopped.
 *
 * @return      duration or -1 if not known.
 */
Media.prototype.getDuration = function() {
    return this._duration;
};

/**
 * Get position of audio.
 */
Media.prototype.getCurrentPosition = function(success, fail) {
    var me = this;
    exec(function(p) {
        me._position = p;
        success(p);
    }, fail, "Media", "getCurrentPositionAudio", [this.id]);
};

/**
 * Start recording audio file.
 */
Media.prototype.startRecord = function() {
    exec(null, this.errorCallback, "Media", "startRecordingAudio", [this.id, this.src]);
};

/**
 * Stop recording audio file.
 */
Media.prototype.stopRecord = function() {
    exec(null, this.errorCallback, "Media", "stopRecordingAudio", [this.id]);
};

/**
 * Release the resources.
 */
Media.prototype.release = function() {
    exec(null, this.errorCallback, "Media", "release", [this.id]);
};

/**
 * Adjust the volume.
 */
Media.prototype.setVolume = function(volume) {
    exec(null, null, "Media", "setVolume", [this.id, volume]);
};

/**
 * Audio has status update.
 * PRIVATE
 *
 * @param id            The media object id (string)
 * @param msgType       The 'type' of update this is
 * @param value         Use of value is determined by the msgType
 */
Media.onStatus = function(id, msgType, value) {

    var media = mediaObjects[id];

    if(media) {
        switch(msgType) {
            case Media.MEDIA_STATE :
                media.statusCallback && media.statusCallback(value);
                if(value == Media.MEDIA_STOPPED) {
                    media.successCallback && media.successCallback();
                }
                break;
            case Media.MEDIA_DURATION :
                media._duration = value;
                break;
            case Media.MEDIA_ERROR :
                media.errorCallback && media.errorCallback(value);
                break;
            case Media.MEDIA_POSITION :
                media._position = Number(value);
                break;
            default :
                console.error && console.error("Unhandled Media.onStatus :: " + msgType);
                break;
        }
    }
    else {
         console.error && console.error("Received Media.onStatus callback for unknown media :: " + id);
    }

};

module.exports = Media;

});

// file: lib/common/plugin/MediaError.js
define("cordova/plugin/MediaError", function(require, exports, module) {

/**
 * This class contains information about any Media errors.
*/
/*
 According to :: http://dev.w3.org/html5/spec-author-view/video.html#mediaerror
 We should never be creating these objects, we should just implement the interface
 which has 1 property for an instance, 'code'

 instead of doing :
    errorCallbackFunction( new MediaError(3,'msg') );
we should simply use a literal :
    errorCallbackFunction( {'code':3} );
 */

 var _MediaError = window.MediaError;


if(!_MediaError) {
    window.MediaError = _MediaError = function(code, msg) {
        this.code = (typeof code != 'undefined') ? code : null;
        this.message = msg || ""; // message is NON-standard! do not use!
    };
}

_MediaError.MEDIA_ERR_NONE_ACTIVE    = _MediaError.MEDIA_ERR_NONE_ACTIVE    || 0;
_MediaError.MEDIA_ERR_ABORTED        = _MediaError.MEDIA_ERR_ABORTED        || 1;
_MediaError.MEDIA_ERR_NETWORK        = _MediaError.MEDIA_ERR_NETWORK        || 2;
_MediaError.MEDIA_ERR_DECODE         = _MediaError.MEDIA_ERR_DECODE         || 3;
_MediaError.MEDIA_ERR_NONE_SUPPORTED = _MediaError.MEDIA_ERR_NONE_SUPPORTED || 4;
// TODO: MediaError.MEDIA_ERR_NONE_SUPPORTED is legacy, the W3 spec now defines it as below.
// as defined by http://dev.w3.org/html5/spec-author-view/video.html#error-codes
_MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED = _MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || 4;

module.exports = _MediaError;

});

// file: lib/common/plugin/MediaFile.js
define("cordova/plugin/MediaFile", function(require, exports, module) {

var utils = require('cordova/utils'),
    exec = require('cordova/exec'),
    File = require('cordova/plugin/File'),
    CaptureError = require('cordova/plugin/CaptureError');
/**
 * Represents a single file.
 *
 * name {DOMString} name of the file, without path information
 * fullPath {DOMString} the full path of the file, including the name
 * type {DOMString} mime type
 * lastModifiedDate {Date} last modified date
 * size {Number} size of the file in bytes
 */
var MediaFile = function(name, fullPath, type, lastModifiedDate, size){
    MediaFile.__super__.constructor.apply(this, arguments);
};

utils.extend(MediaFile, File);

/**
 * Request capture format data for a specific file and type
 *
 * @param {Function} successCB
 * @param {Function} errorCB
 */
MediaFile.prototype.getFormatData = function(successCallback, errorCallback) {
    if (typeof this.fullPath === "undefined" || this.fullPath === null) {
        errorCallback(new CaptureError(CaptureError.CAPTURE_INVALID_ARGUMENT));
    } else {
        exec(successCallback, errorCallback, "Capture", "getFormatData", [this.fullPath, this.type]);
    }
};

module.exports = MediaFile;

});

// file: lib/common/plugin/MediaFileData.js
define("cordova/plugin/MediaFileData", function(require, exports, module) {

/**
 * MediaFileData encapsulates format information of a media file.
 *
 * @param {DOMString} codecs
 * @param {long} bitrate
 * @param {long} height
 * @param {long} width
 * @param {float} duration
 */
var MediaFileData = function(codecs, bitrate, height, width, duration){
    this.codecs = codecs || null;
    this.bitrate = bitrate || 0;
    this.height = height || 0;
    this.width = width || 0;
    this.duration = duration || 0;
};

module.exports = MediaFileData;

});

// file: lib/common/plugin/Metadata.js
define("cordova/plugin/Metadata", function(require, exports, module) {

/**
 * Information about the state of the file or directory
 *
 * {Date} modificationTime (readonly)
 */
var Metadata = function(time) {
    this.modificationTime = (typeof time != 'undefined'?new Date(time):null);
};

module.exports = Metadata;

});

// file: lib/common/plugin/Position.js
define("cordova/plugin/Position", function(require, exports, module) {

var Coordinates = require('cordova/plugin/Coordinates');

var Position = function(coords, timestamp) {
    if (coords) {
        this.coords = new Coordinates(coords.latitude, coords.longitude, coords.altitude, coords.accuracy, coords.heading, coords.velocity, coords.altitudeAccuracy);
    } else {
        this.coords = new Coordinates();
    }
    this.timestamp = (timestamp !== undefined) ? timestamp : new Date();
};

module.exports = Position;

});

// file: lib/common/plugin/PositionError.js
define("cordova/plugin/PositionError", function(require, exports, module) {

/**
 * Position error object
 *
 * @constructor
 * @param code
 * @param message
 */
var PositionError = function(code, message) {
    this.code = code || null;
    this.message = message || '';
};

PositionError.PERMISSION_DENIED = 1;
PositionError.POSITION_UNAVAILABLE = 2;
PositionError.TIMEOUT = 3;

module.exports = PositionError;

});

// file: lib/common/plugin/ProgressEvent.js
define("cordova/plugin/ProgressEvent", function(require, exports, module) {

// If ProgressEvent exists in global context, use it already, otherwise use our own polyfill
// Feature test: See if we can instantiate a native ProgressEvent;
// if so, use that approach,
// otherwise fill-in with our own implementation.
//
// NOTE: right now we always fill in with our own. Down the road would be nice if we can use whatever is native in the webview.
var ProgressEvent = (function() {
    /*
    var createEvent = function(data) {
        var event = document.createEvent('Events');
        event.initEvent('ProgressEvent', false, false);
        if (data) {
            for (var i in data) {
                if (data.hasOwnProperty(i)) {
                    event[i] = data[i];
                }
            }
            if (data.target) {
                // TODO: cannot call <some_custom_object>.dispatchEvent
                // need to first figure out how to implement EventTarget
            }
        }
        return event;
    };
    try {
        var ev = createEvent({type:"abort",target:document});
        return function ProgressEvent(type, data) {
            data.type = type;
            return createEvent(data);
        };
    } catch(e){
    */
        return function ProgressEvent(type, dict) {
            this.type = type;
            this.bubbles = false;
            this.cancelBubble = false;
            this.cancelable = false;
            this.lengthComputable = false;
            this.loaded = dict && dict.loaded ? dict.loaded : 0;
            this.total = dict && dict.total ? dict.total : 0;
            this.target = dict && dict.target ? dict.target : null;
        };
    //}
})();

module.exports = ProgressEvent;

});

// file: lib/common/plugin/accelerometer.js
define("cordova/plugin/accelerometer", function(require, exports, module) {

/**
 * This class provides access to device accelerometer data.
 * @constructor
 */
var argscheck = require('cordova/argscheck'),
    utils = require("cordova/utils"),
    exec = require("cordova/exec"),
    Acceleration = require('cordova/plugin/Acceleration');

// Is the accel sensor running?
var running = false;

// Keeps reference to watchAcceleration calls.
var timers = {};

// Array of listeners; used to keep track of when we should call start and stop.
var listeners = [];

// Last returned acceleration object from native
var accel = null;

// Tells native to start.
function start() {
    exec(function(a) {
        var tempListeners = listeners.slice(0);
        accel = new Acceleration(a.x, a.y, a.z, a.timestamp);
        for (var i = 0, l = tempListeners.length; i < l; i++) {
            tempListeners[i].win(accel);
        }
    }, function(e) {
        var tempListeners = listeners.slice(0);
        for (var i = 0, l = tempListeners.length; i < l; i++) {
            tempListeners[i].fail(e);
        }
    }, "Accelerometer", "start", []);
    running = true;
}

// Tells native to stop.
function stop() {
    exec(null, null, "Accelerometer", "stop", []);
    running = false;
}

// Adds a callback pair to the listeners array
function createCallbackPair(win, fail) {
    return {win:win, fail:fail};
}

// Removes a win/fail listener pair from the listeners array
function removeListeners(l) {
    var idx = listeners.indexOf(l);
    if (idx > -1) {
        listeners.splice(idx, 1);
        if (listeners.length === 0) {
            stop();
        }
    }
}

var accelerometer = {
    /**
     * Asynchronously acquires the current acceleration.
     *
     * @param {Function} successCallback    The function to call when the acceleration data is available
     * @param {Function} errorCallback      The function to call when there is an error getting the acceleration data. (OPTIONAL)
     * @param {AccelerationOptions} options The options for getting the accelerometer data such as timeout. (OPTIONAL)
     */
    getCurrentAcceleration: function(successCallback, errorCallback, options) {
        argscheck.checkArgs('fFO', 'accelerometer.getCurrentAcceleration', arguments);

        var p;
        var win = function(a) {
            removeListeners(p);
            successCallback(a);
        };
        var fail = function(e) {
            removeListeners(p);
            errorCallback && errorCallback(e);
        };

        p = createCallbackPair(win, fail);
        listeners.push(p);

        if (!running) {
            start();
        }
    },

    /**
     * Asynchronously acquires the acceleration repeatedly at a given interval.
     *
     * @param {Function} successCallback    The function to call each time the acceleration data is available
     * @param {Function} errorCallback      The function to call when there is an error getting the acceleration data. (OPTIONAL)
     * @param {AccelerationOptions} options The options for getting the accelerometer data such as timeout. (OPTIONAL)
     * @return String                       The watch id that must be passed to #clearWatch to stop watching.
     */
    watchAcceleration: function(successCallback, errorCallback, options) {
        argscheck.checkArgs('fFO', 'accelerometer.watchAcceleration', arguments);
        // Default interval (10 sec)
        var frequency = (options && options.frequency && typeof options.frequency == 'number') ? options.frequency : 10000;

        // Keep reference to watch id, and report accel readings as often as defined in frequency
        var id = utils.createUUID();

        var p = createCallbackPair(function(){}, function(e) {
            removeListeners(p);
            errorCallback && errorCallback(e);
        });
        listeners.push(p);

        timers[id] = {
            timer:window.setInterval(function() {
                if (accel) {
                    successCallback(accel);
                }
            }, frequency),
            listeners:p
        };

        if (running) {
            // If we're already running then immediately invoke the success callback
            // but only if we have retrieved a value, sample code does not check for null ...
            if (accel) {
                successCallback(accel);
            }
        } else {
            start();
        }

        return id;
    },

    /**
     * Clears the specified accelerometer watch.
     *
     * @param {String} id       The id of the watch returned from #watchAcceleration.
     */
    clearWatch: function(id) {
        // Stop javascript timer & remove from timer list
        if (id && timers[id]) {
            window.clearInterval(timers[id].timer);
            removeListeners(timers[id].listeners);
            delete timers[id];
        }
    }
};

module.exports = accelerometer;

});

// file: lib/common/plugin/accelerometer/symbols.js
define("cordova/plugin/accelerometer/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.defaults('cordova/plugin/Acceleration', 'Acceleration');
modulemapper.defaults('cordova/plugin/accelerometer', 'navigator.accelerometer');

});

// file: lib/blackberry/plugin/air/DirectoryEntry.js
define("cordova/plugin/air/DirectoryEntry", function(require, exports, module) {

var DirectoryEntry = require('cordova/plugin/DirectoryEntry'),
    DirectoryReader = require('cordova/plugin/air/DirectoryReader'),
    FileEntry = require('cordova/plugin/FileEntry'),
    FileError = require('cordova/plugin/FileError');

var validFileRe = new RegExp('^[a-zA-Z][0-9a-zA-Z._ ]*$');

module.exports = {
    createReader : function() {
        return new DirectoryReader(this.fullPath);
    },
    /**
     * Creates or looks up a directory; override for BlackBerry.
     *
     * @param path
     *            {DOMString} either a relative or absolute path from this
     *            directory in which to look up or create a directory
     * @param options
     *            {Flags} options to create or exclusively create the directory
     * @param successCallback
     *            {Function} called with the new DirectoryEntry
     * @param errorCallback
     *            {Function} called with a FileError
     */
    getDirectory : function(path, options, successCallback, errorCallback) {
    // create directory if it doesn't exist
        var create = (options && options.create === true) ? true : false,
        // if true, causes failure if create is true and path already exists
        exclusive = (options && options.exclusive === true) ? true : false,
        // directory exists
        exists,
        // create a new DirectoryEntry object and invoke success callback
        createEntry = function() {
            var path_parts = path.split('/'),
                name = path_parts[path_parts.length - 1],
                dirEntry = new DirectoryEntry(name, path);

            // invoke success callback
            if (typeof successCallback === 'function') {
                successCallback(dirEntry);
            }
        };

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // invalid path
        if(!validFileRe.exec(path)){
            fail(FileError.ENCODING_ERR);
            return;
        }

        // determine if path is relative or absolute
        if (!path) {
            fail(FileError.ENCODING_ERR);
            return;
        } else if (path.indexOf(this.fullPath) !== 0) {
            // path does not begin with the fullPath of this directory
            // therefore, it is relative
            path = this.fullPath + '/' + path;
        }

        // determine if directory exists
        try {
            // will return true if path exists AND is a directory
            exists = blackberry.io.dir.exists(path);
        } catch (e) {
            // invalid path
            // TODO this will not work on playbook - need to think how to find invalid urls
            fail(FileError.ENCODING_ERR);
            return;
        }


        // path is a directory
        if (exists) {
            if (create && exclusive) {
                // can't guarantee exclusivity
                fail(FileError.PATH_EXISTS_ERR);
            } else {
                // create entry for existing directory
                createEntry();
            }
        }
        // will return true if path exists AND is a file
        else if (blackberry.io.file.exists(path)) {
            // the path is a file
            fail(FileError.TYPE_MISMATCH_ERR);
        }
        // path does not exist, create it
        else if (create) {
            try {
                // directory path must have trailing slash
                var dirPath = path;
                if (dirPath.substr(-1) !== '/') {
                    dirPath += '/';
                }
                console.log('creating dir path at: ' + dirPath);
                blackberry.io.dir.createNewDir(dirPath);
                createEntry();
            } catch (eone) {
                // unable to create directory
                fail(FileError.NOT_FOUND_ERR);
            }
        }
        // path does not exist, don't create
        else {
            // directory doesn't exist
            fail(FileError.NOT_FOUND_ERR);
        }
    },

    /**
     * Create or look up a file.
     *
     * @param path {DOMString}
     *            either a relative or absolute path from this directory in
     *            which to look up or create a file
     * @param options {Flags}
     *            options to create or exclusively create the file
     * @param successCallback {Function}
     *            called with the new FileEntry object
     * @param errorCallback {Function}
     *            called with a FileError object if error occurs
     */
    getFile : function(path, options, successCallback, errorCallback) {
        // create file if it doesn't exist
        var create = (options && options.create === true) ? true : false,
            // if true, causes failure if create is true and path already exists
            exclusive = (options && options.exclusive === true) ? true : false,
            // file exists
            exists,
            // create a new FileEntry object and invoke success callback
            createEntry = function() {
                var path_parts = path.split('/'),
                    name = path_parts[path_parts.length - 1],
                    fileEntry = new FileEntry(name, path);

                // invoke success callback
                if (typeof successCallback === 'function') {
                    successCallback(fileEntry);
                }
            };

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // invalid path
        if(!validFileRe.exec(path)){
            fail(FileError.ENCODING_ERR);
            return;
        }
        // determine if path is relative or absolute
        if (!path) {
            fail(FileError.ENCODING_ERR);
            return;
        }
        else if (path.indexOf(this.fullPath) !== 0) {
            // path does not begin with the fullPath of this directory
            // therefore, it is relative
            path = this.fullPath + '/' + path;
        }

        // determine if file exists
        try {
            // will return true if path exists AND is a file
            exists = blackberry.io.file.exists(path);
        }
        catch (e) {
            // invalid path
            fail(FileError.ENCODING_ERR);
            return;
        }

        // path is a file
        if (exists) {
            if (create && exclusive) {
                // can't guarantee exclusivity
                fail(FileError.PATH_EXISTS_ERR);
            }
            else {
                // create entry for existing file
                createEntry();
            }
        }
        // will return true if path exists AND is a directory
        else if (blackberry.io.dir.exists(path)) {
            // the path is a directory
            fail(FileError.TYPE_MISMATCH_ERR);
        }
        // path does not exist, create it
        else if (create) {
            // create empty file
            var emptyBlob = blackberry.utils.stringToBlob('');
            blackberry.io.file.saveFile(path,emptyBlob);
            createEntry();
        }
        // path does not exist, don't create
        else {
            // file doesn't exist
            fail(FileError.NOT_FOUND_ERR);
        }
    },

    /**
     * Delete a directory and all of it's contents.
     *
     * @param successCallback {Function} called with no parameters
     * @param errorCallback {Function} called with a FileError
     */
    removeRecursively : function(successCallback, errorCallback) {
        // we're removing THIS directory
        var path = this.fullPath;

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // attempt to delete directory
        if (blackberry.io.dir.exists(path)) {
            // it is an error to attempt to remove the file system root
            //exec(null, null, "File", "isFileSystemRoot", [ path ]) === true
            if (false) {
                fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
            }
            else {
                try {
                    // delete the directory, setting recursive flag to true
                    blackberry.io.dir.deleteDirectory(path, true);
                    if (typeof successCallback === "function") {
                        successCallback();
                    }
                } catch (e) {
                    // permissions don't allow deletion
                    console.log(e);
                    fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
                }
            }
        }
        // it's a file, not a directory
        else if (blackberry.io.file.exists(path)) {
            fail(FileError.TYPE_MISMATCH_ERR);
        }
        // not found
        else {
            fail(FileError.NOT_FOUND_ERR);
        }
    }
};

});

// file: lib/blackberry/plugin/air/DirectoryReader.js
define("cordova/plugin/air/DirectoryReader", function(require, exports, module) {

var FileError = require('cordova/plugin/FileError');

/**
 * An interface that lists the files and directories in a directory.
 */
function DirectoryReader(path) {
    this.path = path || null;
}

/**
 * Returns a list of entries from a directory.
 *
 * @param {Function} successCallback is called with a list of entries
 * @param {Function} errorCallback is called with a FileError
 */
DirectoryReader.prototype.readEntries = function(successCallback, errorCallback) {
    var win = typeof successCallback !== 'function' ? null : function(result) {
        var retVal = [];
        for (var i=0; i<result.length; i++) {
            var entry = null;
            if (result[i].isDirectory) {
                entry = new (require('cordova/plugin/DirectoryEntry'))();
            }
            else if (result[i].isFile) {
                entry = new (require('cordova/plugin/FileEntry'))();
            }
            entry.isDirectory = result[i].isDirectory;
            entry.isFile = result[i].isFile;
            entry.name = result[i].name;
            entry.fullPath = result[i].fullPath;
            retVal.push(entry);
        }
        successCallback(retVal);
    };
    var fail = typeof errorCallback !== 'function' ? null : function(code) {
        errorCallback(new FileError(code));
    };

    var theEntries = [];
    // Entry object is borked - unable to instantiate a new Entry object so just create one
    var anEntry = function (isDirectory, name, fullPath) {
        this.isDirectory = (isDirectory ? true : false);
        this.isFile = (isDirectory ? false : true);
        this.name = name;
        this.fullPath = fullPath;
    };

    if(blackberry.io.dir.exists(this.path)){
        var theDirectories = blackberry.io.dir.listDirectories(this.path);
        var theFiles = blackberry.io.dir.listFiles(this.path);

        var theDirectoriesLength = theDirectories.length;
        var theFilesLength = theFiles.length;
        for(var i=0;i<theDirectoriesLength;i++){
            theEntries.push(new anEntry(true, theDirectories[i], this.path+theDirectories[i]));
        }

        for(var j=0;j<theFilesLength;j++){
            theEntries.push(new anEntry(false, theFiles[j], this.path+theFiles[j]));
        }
        win(theEntries);
    }else{
        fail(FileError.NOT_FOUND_ERR);
    }


};

module.exports = DirectoryReader;

});

// file: lib/blackberry/plugin/air/Entry.js
define("cordova/plugin/air/Entry", function(require, exports, module) {

var FileError = require('cordova/plugin/FileError'),
    LocalFileSystem = require('cordova/plugin/LocalFileSystem'),
    Metadata = require('cordova/plugin/Metadata'),
    resolveLocalFileSystemURI = require('cordova/plugin/air/resolveLocalFileSystemURI'),
    DirectoryEntry = require('cordova/plugin/DirectoryEntry'),
    FileEntry = require('cordova/plugin/FileEntry'),
    requestFileSystem = require('cordova/plugin/air/requestFileSystem');

var recursiveCopy = function(srcDirPath, dstDirPath){
    // get all the contents (file+dir) of the dir
    var files = blackberry.io.dir.listFiles(srcDirPath);
    var dirs = blackberry.io.dir.listDirectories(srcDirPath);

    for(var i=0;i<files.length;i++){
        blackberry.io.file.copy(srcDirPath + '/' + files[i], dstDirPath + '/' + files[i]);
    }

    for(var j=0;j<dirs.length;j++){
        if(!blackberry.io.dir.exists(dstDirPath + '/' + dirs[j])){
            blackberry.io.dir.createNewDir(dstDirPath + '/' + dirs[j]);
        }
        recursiveCopy(srcDirPath + '/' + dirs[j], dstDirPath + '/' + dirs[j]);
    }
};

var validFileRe = new RegExp('^[a-zA-Z][0-9a-zA-Z._ ]*$');

module.exports = {
    getMetadata : function(successCallback, errorCallback){
        var success = typeof successCallback !== 'function' ? null : function(lastModified) {
          var metadata = new Metadata(lastModified);
          successCallback(metadata);
        };
        var fail = typeof errorCallback !== 'function' ? null : function(code) {
          errorCallback(new FileError(code));
        };

        if(this.isFile){
            if(blackberry.io.file.exists(this.fullPath)){
                var theFileProperties = blackberry.io.file.getFileProperties(this.fullPath);
                success(theFileProperties.dateModified);
            }
        }else{
            console.log('Unsupported for directories');
            fail(FileError.INVALID_MODIFICATION_ERR);
        }
    },

    setMetadata : function(successCallback, errorCallback , metadataObject){
        console.log('setMetadata is unsupported for PlayBook');
    },

    moveTo : function(parent, newName, successCallback, errorCallback){
        var fail = function(code) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(code));
            }
        };
        // user must specify parent Entry
        if (!parent) {
            fail(FileError.NOT_FOUND_ERR);
            return;
        }
        // source path
        var srcPath = this.fullPath,
            // entry name
            name = newName || this.name,
            success = function(entry) {
                if (entry) {
                    if (typeof successCallback === 'function') {
                        // create appropriate Entry object
                        var result = (entry.isDirectory) ? new DirectoryEntry(entry.name, entry.fullPath) : new FileEntry(entry.name, entry.fullPath);
                        try {
                            successCallback(result);
                        }
                        catch (e) {
                            console.log('Error invoking callback: ' + e);
                        }
                    }
                }
                else {
                    // no Entry object returned
                    fail(FileError.NOT_FOUND_ERR);
                }
            };


        // Entry object is borked
        var theEntry = {};
        var dstPath = parent.fullPath + '/' + name;

        // invalid path
        if(!validFileRe.exec(name)){
            fail(FileError.ENCODING_ERR);
            return;
        }

        if(this.isFile){
            if(srcPath != dstPath){
                if(blackberry.io.file.exists(dstPath)){
                    blackberry.io.file.deleteFile(dstPath);
                    blackberry.io.file.copy(srcPath,dstPath);
                    blackberry.io.file.deleteFile(srcPath);

                    theEntry.fullPath = dstPath;
                    theEntry.name = name;
                    theEntry.isDirectory = false;
                    theEntry.isFile = true;
                    success(theEntry);
                }else if(blackberry.io.dir.exists(dstPath)){
                    // destination path is a directory
                    fail(FileError.INVALID_MODIFICATION_ERR);
                }else{
                    // make sure the directory that we are moving to actually exists
                    if(blackberry.io.dir.exists(parent.fullPath)){
                        blackberry.io.file.copy(srcPath,dstPath);
                        blackberry.io.file.deleteFile(srcPath);

                        theEntry.fullPath = dstPath;
                        theEntry.name = name;
                        theEntry.isDirectory = false;
                        theEntry.isFile = true;
                        success(theEntry);
                    }else{
                        fail(FileError.NOT_FOUND_ERR);
                    }
                }
            }else{
                // file onto itself
                fail(FileError.INVALID_MODIFICATION_ERR);
            }
        }else{
            if(srcPath != dstPath){
                if(blackberry.io.file.exists(dstPath) || srcPath == parent.fullPath){
                    // destination path is either a file path or moving into parent
                    fail(FileError.INVALID_MODIFICATION_ERR);
                }else{
                    if(!blackberry.io.dir.exists(dstPath)){
                        blackberry.io.dir.createNewDir(dstPath);
                        recursiveCopy(srcPath,dstPath);
                        blackberry.io.dir.deleteDirectory(srcPath, true);
                        theEntry.fullPath = dstPath;
                        theEntry.name = name;
                        theEntry.isDirectory = true;
                        theEntry.isFile = false;
                        success(theEntry);
                    }else{
                        var numOfEntries = 0;
                        numOfEntries += blackberry.io.dir.listDirectories(dstPath).length;
                        numOfEntries += blackberry.io.dir.listFiles(dstPath).length;
                        if(numOfEntries === 0){
                            blackberry.io.dir.createNewDir(dstPath);
                            recursiveCopy(srcPath,dstPath);
                            blackberry.io.dir.deleteDirectory(srcPath, true);
                            theEntry.fullPath = dstPath;
                            theEntry.name = name;
                            theEntry.isDirectory = true;
                            theEntry.isFile = false;
                            success(theEntry);
                        }else{
                            // destination directory not empty
                            fail(FileError.INVALID_MODIFICATION_ERR);
                        }
                    }
                }
            }else{
                // directory onto itself
                fail(FileError.INVALID_MODIFICATION_ERR);
            }
        }

    },

    copyTo : function(parent, newName, successCallback, errorCallback) {
        var fail = function(code) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(code));
            }
        };
        // user must specify parent Entry
        if (!parent) {
            fail(FileError.NOT_FOUND_ERR);
            return;
        }
        // source path
        var srcPath = this.fullPath,
            // entry name
            name = newName || this.name,
            success = function(entry) {
                if (entry) {
                    if (typeof successCallback === 'function') {
                        // create appropriate Entry object
                        var result = (entry.isDirectory) ? new DirectoryEntry(entry.name, entry.fullPath) : new FileEntry(entry.name, entry.fullPath);
                        try {
                            successCallback(result);
                        }
                        catch (e) {
                            console.log('Error invoking callback: ' + e);
                        }
                    }
                }
                else {
                    // no Entry object returned
                    fail(FileError.NOT_FOUND_ERR);
                }
            };

        // Entry object is borked
        var theEntry = {};
        var dstPath = parent.fullPath + '/' + name;

        // invalid path
        if(!validFileRe.exec(name)){
            fail(FileError.ENCODING_ERR);
            return;
        }

        if(this.isFile){
            if(srcPath != dstPath){
                if(blackberry.io.file.exists(dstPath)){
                    if(blackberry.io.dir.exists(dstPath)){
                        blackberry.io.file.copy(srcPath,dstPath);

                        theEntry.fullPath = dstPath;
                        theEntry.name = name;
                        theEntry.isDirectory = false;
                        theEntry.isFile = true;
                        success(theEntry);
                    }else{
                        // destination directory doesn't exist
                        fail(FileError.NOT_FOUND_ERR);
                    }

                }else{
                    blackberry.io.file.copy(srcPath,dstPath);

                    theEntry.fullPath = dstPath;
                    theEntry.name = name;
                    theEntry.isDirectory = false;
                    theEntry.isFile = true;
                    success(theEntry);
                }
            }else{
                // file onto itself
                fail(FileError.INVALID_MODIFICATION_ERR);
            }
        }else{
            if(srcPath != dstPath){
                // allow back up to the root but not child dirs
                if((parent.name != "root" && dstPath.indexOf(srcPath)>=0) || blackberry.io.file.exists(dstPath)){
                    // copying directory into child or is file path
                    fail(FileError.INVALID_MODIFICATION_ERR);
                }else{
                    recursiveCopy(srcPath, dstPath);

                    theEntry.fullPath = dstPath;
                    theEntry.name = name;
                    theEntry.isDirectory = true;
                    theEntry.isFile = false;
                    success(theEntry);
                }
            }else{
                // directory onto itself
                fail(FileError.INVALID_MODIFICATION_ERR);
            }
        }

    },

    remove : function(successCallback, errorCallback) {
        var path = this.fullPath,
            // directory contents
            contents = [];

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // file
        if (blackberry.io.file.exists(path)) {
            try {
                blackberry.io.file.deleteFile(path);
                if (typeof successCallback === "function") {
                    successCallback();
                }
            } catch (e) {
                // permissions don't allow
                fail(FileError.INVALID_MODIFICATION_ERR);
            }
        }
        // directory
        else if (blackberry.io.dir.exists(path)) {
            // it is an error to attempt to remove the file system root
            console.log('entry directory');
            // TODO: gotta figure out how to get root dirs on playbook -
            // getRootDirs doesn't work
            if (false) {
                fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
            } else {
                // check to see if directory is empty
                contents = blackberry.io.dir.listFiles(path);
                if (contents.length !== 0) {
                    fail(FileError.INVALID_MODIFICATION_ERR);
                } else {
                    try {
                        // delete
                        blackberry.io.dir.deleteDirectory(path, false);
                        if (typeof successCallback === "function") {
                            successCallback();
                        }
                    } catch (eone) {
                        // permissions don't allow
                        fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
                    }
                }
            }
        }
        // not found
        else {
            fail(FileError.NOT_FOUND_ERR);
        }
    },
    getParent : function(successCallback, errorCallback) {
        var that = this;

        try {
            // On BlackBerry, the TEMPORARY file system is actually a temporary
            // directory that is created on a per-application basis. This is
            // to help ensure that applications do not share the same temporary
            // space. So we check to see if this is the TEMPORARY file system
            // (directory). If it is, we must return this Entry, rather than
            // the Entry for its parent.
            requestFileSystem(LocalFileSystem.TEMPORARY, 0,
                    function(fileSystem) {
                        if (fileSystem.root.fullPath === that.fullPath) {
                            if (typeof successCallback === 'function') {
                                successCallback(fileSystem.root);
                            }
                        } else {
                            resolveLocalFileSystemURI(blackberry.io.dir
                                    .getParentDirectory(that.fullPath),
                                    successCallback, errorCallback);
                        }
                    }, errorCallback);
        } catch (e) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(FileError.NOT_FOUND_ERR));
            }
        }
    }
};


});

// file: lib/blackberry/plugin/air/File.js
define("cordova/plugin/air/File", function(require, exports, module) {

/**
 * Constructor.
 * name {DOMString} name of the file, without path information
 * fullPath {DOMString} the full path of the file, including the name
 * type {DOMString} mime type
 * lastModifiedDate {Date} last modified date
 * size {Number} size of the file in bytes
 */

var File = function(name, fullPath, type, lastModifiedDate, size){
    this.name = name || '';
    this.fullPath = fullPath || null;
    this.type = type || null;
    this.lastModifiedDate = lastModifiedDate || null;
    this.size = size || 0;
};

module.exports = File;

});

// file: lib/blackberry/plugin/air/FileEntry.js
define("cordova/plugin/air/FileEntry", function(require, exports, module) {

var FileEntry = require('cordova/plugin/FileEntry'),
    Entry = require('cordova/plugin/air/Entry'),
    FileWriter = require('cordova/plugin/air/FileWriter'),
    File = require('cordova/plugin/air/File'),
    FileError = require('cordova/plugin/FileError');

module.exports = {
    /**
     * Creates a new FileWriter associated with the file that this FileEntry represents.
     *
     * @param {Function} successCallback is called with the new FileWriter
     * @param {Function} errorCallback is called with a FileError
     */
    createWriter : function(successCallback, errorCallback) {
        this.file(function(filePointer) {
            var writer = new FileWriter(filePointer);

            if (writer.fileName === null || writer.fileName === "") {
                if (typeof errorCallback === "function") {
                    errorCallback(new FileError(FileError.INVALID_STATE_ERR));
                }
            } else {
                if (typeof successCallback === "function") {
                    successCallback(writer);
                }
            }
        }, errorCallback);
    },

    /**
     * Returns a File that represents the current state of the file that this FileEntry represents.
     *
     * @param {Function} successCallback is called with the new File object
     * @param {Function} errorCallback is called with a FileError
     */
    file : function(successCallback, errorCallback) {
        var win = typeof successCallback !== 'function' ? null : function(f) {
            var file = new File(f.name, f.fullPath, f.type, f.lastModifiedDate, f.size);
            successCallback(file);
        };
        var fail = typeof errorCallback !== 'function' ? null : function(code) {
            errorCallback(new FileError(code));
        };

        if(blackberry.io.file.exists(this.fullPath)){
            var theFileProperties = blackberry.io.file.getFileProperties(this.fullPath);
            var theFile = {};

            theFile.fullPath = this.fullPath;
            theFile.type = theFileProperties.fileExtension;
            theFile.lastModifiedDate = theFileProperties.dateModified;
            theFile.size = theFileProperties.size;
            win(theFile);
        }else{
            fail(FileError.NOT_FOUND_ERR);
        }
    }
};


});

// file: lib/blackberry/plugin/air/FileReader.js
define("cordova/plugin/air/FileReader", function(require, exports, module) {

var FileError = require('cordova/plugin/FileError'),
    ProgressEvent = require('cordova/plugin/ProgressEvent');

/**
 * This class reads the mobile device file system.
 *
 * For Android:
 *      The root directory is the root of the file system.
 *      To read from the SD card, the file name is "sdcard/my_file.txt"
 * @constructor
 */
var FileReader = function() {
    this.fileName = "";

    this.readyState = 0; // FileReader.EMPTY

    // File data
    this.result = null;

    // Error
    this.error = null;

    // Event handlers
    this.onloadstart = null;    // When the read starts.
    this.onprogress = null;     // While reading (and decoding) file or fileBlob data, and reporting partial file data (progress.loaded/progress.total)
    this.onload = null;         // When the read has successfully completed.
    this.onerror = null;        // When the read has failed (see errors).
    this.onloadend = null;      // When the request has completed (either in success or failure).
    this.onabort = null;        // When the read has been aborted. For instance, by invoking the abort() method.
};

// States
FileReader.EMPTY = 0;
FileReader.LOADING = 1;
FileReader.DONE = 2;

/**
 * Abort reading file.
 */
FileReader.prototype.abort = function() {
    this.result = null;

    if (this.readyState == FileReader.DONE || this.readyState == FileReader.EMPTY) {
      return;
    }

    this.readyState = FileReader.DONE;

    // If abort callback
    if (typeof this.onabort === 'function') {
        this.onabort(new ProgressEvent('abort', {target:this}));
    }
    // If load end callback
    if (typeof this.onloadend === 'function') {
        this.onloadend(new ProgressEvent('loadend', {target:this}));
    }
};

/**
 * Read text file.
 *
 * @param file          {File} File object containing file properties
 * @param encoding      [Optional] (see http://www.iana.org/assignments/character-sets)
 */
FileReader.prototype.readAsText = function(file, encoding) {
    // Figure out pathing
    this.fileName = '';
    if (typeof file.fullPath === 'undefined') {
        this.fileName = file;
    } else {
        this.fileName = file.fullPath;
    }

    // Already loading something
    if (this.readyState == FileReader.LOADING) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    // LOADING state
    this.readyState = FileReader.LOADING;

    // If loadstart callback
    if (typeof this.onloadstart === "function") {
        this.onloadstart(new ProgressEvent("loadstart", {target:this}));
    }

    // Default encoding is UTF-8
    var enc = encoding ? encoding : "UTF-8";

    var me = this;
    // Read file
    if(blackberry.io.file.exists(this.fileName)){
        var theText = '';
        var getFileContents = function(path,blob){
            if(blob){

                theText = blackberry.utils.blobToString(blob, enc);
                me.result = theText;

                if (typeof me.onload === "function") {
                    me.onload(new ProgressEvent("load", {target:me}));
                }

                me.readyState = FileReader.DONE;

                if (typeof me.onloadend === "function") {
                    me.onloadend(new ProgressEvent("loadend", {target:me}));
                }
            }
        };
        // setting asynch to off
        blackberry.io.file.readFile(this.fileName, getFileContents, false);

    }else{
        // If DONE (cancelled), then don't do anything
        if (me.readyState === FileReader.DONE) {
            return;
        }

        // DONE state
        me.readyState = FileReader.DONE;

        me.result = null;

        // Save error
        me.error = new FileError(FileError.NOT_FOUND_ERR);

        // If onerror callback
        if (typeof me.onerror === "function") {
            me.onerror(new ProgressEvent("error", {target:me}));
        }

        // If onloadend callback
        if (typeof me.onloadend === "function") {
            me.onloadend(new ProgressEvent("loadend", {target:me}));
        }
    }
};


/**
 * Read file and return data as a base64 encoded data url.
 * A data url is of the form:
 *      data:[<mediatype>][;base64],<data>
 *
 * @param file          {File} File object containing file properties
 */
FileReader.prototype.readAsDataURL = function(file) {
    this.fileName = "";
    if (typeof file.fullPath === "undefined") {
        this.fileName = file;
    } else {
        this.fileName = file.fullPath;
    }

    // Already loading something
    if (this.readyState == FileReader.LOADING) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    // LOADING state
    this.readyState = FileReader.LOADING;

    // If loadstart callback
    if (typeof this.onloadstart === "function") {
        this.onloadstart(new ProgressEvent("loadstart", {target:this}));
    }

    var enc = "BASE64";

    var me = this;

    // Read file
    if(blackberry.io.file.exists(this.fileName)){
        var theText = '';
        var getFileContents = function(path,blob){
            if(blob){
                theText = blackberry.utils.blobToString(blob, enc);
                me.result = "data:text/plain;base64," +theText;

                if (typeof me.onload === "function") {
                    me.onload(new ProgressEvent("load", {target:me}));
                }

                me.readyState = FileReader.DONE;

                if (typeof me.onloadend === "function") {
                    me.onloadend(new ProgressEvent("loadend", {target:me}));
                }
            }
        };
        // setting asynch to off
        blackberry.io.file.readFile(this.fileName, getFileContents, false);

    }else{
        // If DONE (cancelled), then don't do anything
        if (me.readyState === FileReader.DONE) {
            return;
        }

        // DONE state
        me.readyState = FileReader.DONE;

        me.result = null;

        // Save error
        me.error = new FileError(FileError.NOT_FOUND_ERR);

        // If onerror callback
        if (typeof me.onerror === "function") {
            me.onerror(new ProgressEvent("error", {target:me}));
        }

        // If onloadend callback
        if (typeof me.onloadend === "function") {
            me.onloadend(new ProgressEvent("loadend", {target:me}));
        }
    }
};

/**
 * Read file and return data as a binary data.
 *
 * @param file          {File} File object containing file properties
 */
FileReader.prototype.readAsBinaryString = function(file) {
    // TODO - Can't return binary data to browser.
    console.log('method "readAsBinaryString" is not supported at this time.');
};

/**
 * Read file and return data as a binary data.
 *
 * @param file          {File} File object containing file properties
 */
FileReader.prototype.readAsArrayBuffer = function(file) {
    // TODO - Can't return binary data to browser.
    console.log('This method is not supported at this time.');
};

module.exports = FileReader;

});

// file: lib/blackberry/plugin/air/FileTransfer.js
define("cordova/plugin/air/FileTransfer", function(require, exports, module) {

var cordova = require('cordova'),
FileTransferError = require('cordova/plugin/FileTransferError'),
FileUploadResult = require('cordova/plugin/FileUploadResult');

var validURLProtocol = new RegExp('^(https?|ftp):\/\/');

function getParentPath(filePath) {
    var pos = filePath.lastIndexOf('/');
    return filePath.substring(0, pos + 1);
}

function getFileName(filePath) {
    var pos = filePath.lastIndexOf('/');
    return filePath.substring(pos + 1);
}

module.exports = {
    upload: function (args, win, fail) {
        var filePath = args[0],
            server = args[1],
            fileKey = args[2],
            fileName = args[3],
            mimeType = args[4],
            params = args[5],
            trustAllHosts = args[6],
            chunkedMode = args[7],
            headers = args[8];

        if(!validURLProtocol.exec(server)){
            return { "status" : cordova.callbackStatus.ERROR, "message" : new FileTransferError(FileTransferError.INVALID_URL_ERR) };
        }

        window.resolveLocalFileSystemURI(filePath, fileWin, fail);

        function fileWin(entryObject){
            blackberry.io.file.readFile(filePath, readWin, false);
        }

        function readWin(filePath, blobFile){
            var fd = new FormData();

            fd.append(fileKey, blobFile, fileName);
            for (var prop in params) {
                if(params.hasOwnProperty(prop)) {
                    fd.append(prop, params[prop]);
                }
            }

            var xhr = new XMLHttpRequest();
            xhr.open("POST", server);
            xhr.onload = function(evt) {
                if (xhr.status == 200) {
                    var result = new FileUploadResult();
                    result.bytesSent = xhr.response.length;
                    result.responseCode = xhr.status;
                    result.response = xhr.response;
                    win(result);
                } else if (xhr.status == 404) {
                    fail(new FileTransferError(FileTransferError.INVALID_URL_ERR, null, null, xhr.status));
                } else if (xhr.status == 403) {
                    fail(new FileTransferError(FileTransferError.INVALID_URL_ERR, null, null, xhr.status));
                } else {
                    fail(new FileTransferError(FileTransferError.CONNECTION_ERR, null, null, xhr.status));
                }
            };
            xhr.ontimeout = function(evt) {
                fail(new FileTransferError(FileTransferError.CONNECTION_ERR, null, null, xhr.status));
            };

            if(headers){
                for(var i in headers){
                    xhr.setRequestHeader(i, headers[i]);
                }
            }
            xhr.send(fd);
        }

        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },

    download: function(args, win, fail){
        var url = args[0],
            filePath = args[1];

        if(!validURLProtocol.exec(url)){
            return { "status" : cordova.callbackStatus.ERROR, "message" : new FileTransferError(FileTransferError.INVALID_URL_ERR) };
        }

        var xhr = new XMLHttpRequest();

        function writeFile(fileEntry) {
            fileEntry.createWriter(function(writer) {
                writer.onwriteend = function(evt) {
                    if (!evt.target.error) {
                        win(new window.FileEntry(fileEntry.name, fileEntry.toURL()));
                    } else {
                        fail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
                    }
                };

                writer.onerror = function(evt) {
                    fail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
                };

                var blob = blackberry.utils.stringToBlob(xhr.response);
                writer.write(blob);

            },
            function(error) {
                fail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
            });
        }

        xhr.onreadystatechange = function () {
            if (xhr.readyState == xhr.DONE) {
                if (xhr.status == 200 && xhr.response) {
                    window.resolveLocalFileSystemURI(getParentPath(filePath), function(dir) {
                        dir.getFile(getFileName(filePath), {create: true}, writeFile, function(error) {
                            fail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
                        });
                    }, function(error) {
                        fail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
                    });
                } else if (xhr.status == 404) {
                    fail(new FileTransferError(FileTransferError.INVALID_URL_ERR, null, null, xhr.status));
                } else {
                    fail(new FileTransferError(FileTransferError.CONNECTION_ERR, null, null, xhr.status));
                }
            }
        };

        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.send();

        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    }
};

});

// file: lib/blackberry/plugin/air/FileWriter.js
define("cordova/plugin/air/FileWriter", function(require, exports, module) {

var FileError = require('cordova/plugin/FileError'),
    ProgressEvent = require('cordova/plugin/ProgressEvent');

/**
 * @constructor
 * @param file {File} File object containing file properties
 * @param append if true write to the end of the file, otherwise overwrite the file
 */
var FileWriter = function(file) {
    this.fileName = "";
    this.length = 0;
    if (file) {
        this.fileName = file.fullPath || file;
        this.length = file.size || 0;
    }
    // default is to write at the beginning of the file
    this.position = 0;

    this.readyState = 0; // EMPTY

    this.result = null;

    // Error
    this.error = null;

    // Event handlers
    this.onwritestart = null;   // When writing starts
    this.onprogress = null;     // While writing the file, and reporting partial file data
    this.onwrite = null;        // When the write has successfully completed.
    this.onwriteend = null;     // When the request has completed (either in success or failure).
    this.onabort = null;        // When the write has been aborted. For instance, by invoking the abort() method.
    this.onerror = null;        // When the write has failed (see errors).
};

// States
FileWriter.INIT = 0;
FileWriter.WRITING = 1;
FileWriter.DONE = 2;

/**
 * Abort writing file.
 */
FileWriter.prototype.abort = function() {
    // check for invalid state
    if (this.readyState === FileWriter.DONE || this.readyState === FileWriter.INIT) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    // set error
    this.error = new FileError(FileError.ABORT_ERR);

    this.readyState = FileWriter.DONE;

    // If abort callback
    if (typeof this.onabort === "function") {
        this.onabort(new ProgressEvent("abort", {"target":this}));
    }

    // If write end callback
    if (typeof this.onwriteend === "function") {
        this.onwriteend(new ProgressEvent("writeend", {"target":this}));
    }
};

/**
 * Writes data to the file
 *
 * @param text to be written
 */
FileWriter.prototype.write = function(text) {
    // Throw an exception if we are already writing a file
    if (this.readyState === FileWriter.WRITING) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    // WRITING state
    this.readyState = FileWriter.WRITING;

    var me = this;

    // If onwritestart callback
    if (typeof me.onwritestart === "function") {
        me.onwritestart(new ProgressEvent("writestart", {"target":me}));
    }

    var textBlob = blackberry.utils.stringToBlob(text);

    if(blackberry.io.file.exists(this.fileName)){

        var oldText = '';
        var newText = text;

        var getFileContents = function(path,blob){

            if(blob){
                oldText = blackberry.utils.blobToString(blob);
                if(oldText.length>0){
                    newText = oldText.substr(0,me.position) + text;
                }
            }

            var tempFile = me.fileName+'temp';
            if(blackberry.io.file.exists(tempFile)){
                blackberry.io.file.deleteFile(tempFile);
            }

            var newTextBlob = blackberry.utils.stringToBlob(newText);

            // crete a temp file, delete file we are 'overwriting', then rename temp file
            blackberry.io.file.saveFile(tempFile, newTextBlob);
            blackberry.io.file.deleteFile(me.fileName);
            blackberry.io.file.rename(tempFile, me.fileName.split('/').pop());

            me.position = newText.length;
            me.length = me.position;

            if (typeof me.onwrite === "function") {
                me.onwrite(new ProgressEvent("write", {"target":me}));
            }
        };

        // setting asynch to off
        blackberry.io.file.readFile(this.fileName, getFileContents, false);

    }else{

        // file is new so just save it
        blackberry.io.file.saveFile(this.fileName, textBlob);
        me.position = text.length;
        me.length = me.position;
    }

    me.readyState = FileWriter.DONE;

    if (typeof me.onwriteend === "function") {
                me.onwriteend(new ProgressEvent("writeend", {"target":me}));
    }
};

/**
 * Moves the file pointer to the location specified.
 *
 * If the offset is a negative number the position of the file
 * pointer is rewound.  If the offset is greater than the file
 * size the position is set to the end of the file.
 *
 * @param offset is the location to move the file pointer to.
 */
FileWriter.prototype.seek = function(offset) {
    // Throw an exception if we are already writing a file
    if (this.readyState === FileWriter.WRITING) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    if (!offset && offset !== 0) {
        return;
    }

    // See back from end of file.
    if (offset < 0) {
        this.position = Math.max(offset + this.length, 0);
    }
    // Offset is bigger than file size so set position
    // to the end of the file.
    else if (offset > this.length) {
        this.position = this.length;
    }
    // Offset is between 0 and file size so set the position
    // to start writing.
    else {
        this.position = offset;
    }
};

/**
 * Truncates the file to the size specified.
 *
 * @param size to chop the file at.
 */
FileWriter.prototype.truncate = function(size) {
    // Throw an exception if we are already writing a file
    if (this.readyState === FileWriter.WRITING) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    // WRITING state
    this.readyState = FileWriter.WRITING;

    var me = this;

    // If onwritestart callback
    if (typeof me.onwritestart === "function") {
        me.onwritestart(new ProgressEvent("writestart", {"target":this}));
    }

    if(blackberry.io.file.exists(this.fileName)){

        var oldText = '';
        var newText = '';

        var getFileContents = function(path,blob){

            if(blob){
                oldText = blackberry.utils.blobToString(blob);
                if(oldText.length>0){
                    newText = oldText.slice(0,size);
                }else{
                    // TODO: throw error
                }
            }

            var tempFile = me.fileName+'temp';
            if(blackberry.io.file.exists(tempFile)){
                blackberry.io.file.deleteFile(tempFile);
            }

            var newTextBlob = blackberry.utils.stringToBlob(newText);

            // crete a temp file, delete file we are 'overwriting', then rename temp file
            blackberry.io.file.saveFile(tempFile, newTextBlob);
            blackberry.io.file.deleteFile(me.fileName);
            blackberry.io.file.rename(tempFile, me.fileName.split('/').pop());

            me.position = newText.length;
            me.length = me.position;

            if (typeof me.onwrite === "function") {
                 me.onwrite(new ProgressEvent("write", {"target":me}));
            }
        };

        // setting asynch to off - worry about making this all callbacks later
        blackberry.io.file.readFile(this.fileName, getFileContents, false);

    }else{

        // TODO: file doesn't exist - throw error

    }

    me.readyState = FileWriter.DONE;

    if (typeof me.onwriteend === "function") {
                me.onwriteend(new ProgressEvent("writeend", {"target":me}));
    }
};

module.exports = FileWriter;

});

// file: lib/blackberry/plugin/air/battery.js
define("cordova/plugin/air/battery", function(require, exports, module) {

var cordova = require('cordova');

module.exports = {
    start: function (args, win, fail) {
        // Register one listener to each of the level and state change
        // events using WebWorks API.
        blackberry.system.event.deviceBatteryStateChange(function(state) {
            var me = navigator.battery;
            // state is either CHARGING or UNPLUGGED
            if (state === 2 || state === 3) {
                var info = {
                    "level" : me._level,
                    "isPlugged" : state === 2
                };

                if (me._isPlugged !== info.isPlugged && typeof win === 'function') {
                    win(info);
                }
            }
        });
        blackberry.system.event.deviceBatteryLevelChange(function(level) {
            var me = navigator.battery;
            if (level != me._level && typeof win === 'function') {
                win({'level' : level, 'isPlugged' : me._isPlugged});
            }
        });

        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },
    stop: function (args, win, fail) {
        // Unregister battery listeners.
        blackberry.system.event.deviceBatteryStateChange(null);
        blackberry.system.event.deviceBatteryLevelChange(null);
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    }
};

});

// file: lib/blackberry/plugin/air/camera.js
define("cordova/plugin/air/camera", function(require, exports, module) {

var cordova = require('cordova');

module.exports = {
    takePicture: function (args, win, fail) {
        var onCaptured = blackberry.events.registerEventHandler("onCaptured", win),
            onCameraClosed = blackberry.events.registerEventHandler("onCameraClosed", function () {}),
            onError = blackberry.events.registerEventHandler("onError", fail),
            request = new blackberry.transport.RemoteFunctionCall('blackberry/media/camera/takePicture');

        request.addParam("onCaptured", onCaptured);
        request.addParam("onCameraClosed", onCameraClosed);
        request.addParam("onError", onError);

        //HACK: this is a sync call due to:
        //https://github.com/blackberry/WebWorks-TabletOS/issues/51
        request.makeSyncCall();
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    }
};

});

// file: lib/blackberry/plugin/air/capture.js
define("cordova/plugin/air/capture", function(require, exports, module) {

var cordova = require('cordova');

function capture(action, win, fail) {
    var onCaptured = blackberry.events.registerEventHandler("onCaptured", function (path) {
            var file = blackberry.io.file.getFileProperties(path);
            win([{
                fullPath: path,
                lastModifiedDate: file.dateModified,
                name: path.replace(file.directory + "/", ""),
                size: file.size,
                type: file.fileExtension
            }]);
        }),
        onCameraClosed = blackberry.events.registerEventHandler("onCameraClosed", function () {}),
        onError = blackberry.events.registerEventHandler("onError", fail),
        request = new blackberry.transport.RemoteFunctionCall('blackberry/media/camera/' + action);

    request.addParam("onCaptured", onCaptured);
    request.addParam("onCameraClosed", onCameraClosed);
    request.addParam("onError", onError);

    //HACK: this is a sync call due to:
    //https://github.com/blackberry/WebWorks-TabletOS/issues/51
    request.makeSyncCall();
}

module.exports = {
    getSupportedAudioModes: function (args, win, fail) {
        return {"status": cordova.callbackStatus.OK, "message": []};
    },
    getSupportedImageModes: function (args, win, fail) {
        return {"status": cordova.callbackStatus.OK, "message": []};
    },
    getSupportedVideoModes: function (args, win, fail) {
        return {"status": cordova.callbackStatus.OK, "message": []};
    },
    captureImage: function (args, win, fail) {
        if (args[0].limit > 0) {
            capture("takePicture", win, fail);
        }
        else {
            win([]);
        }

        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },
    captureVideo: function (args, win, fail) {
        if (args[0].limit > 0) {
            capture("takeVideo", win, fail);
        }
        else {
            win([]);
        }

        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },
    captureAudio: function (args, win, fail) {
        var onCaptureAudioWin = function(filePath){
        // for some reason the filePath is coming back as a string between two double quotes
        filePath = filePath.slice(1, filePath.length-1);
            var file = blackberry.io.file.getFileProperties(filePath);

            win([{
                fullPath: filePath,
                lastModifiedDate: file.dateModified,
                name: filePath.replace(file.directory + "/", ""),
                size: file.size,
                type: file.fileExtension
            }]);
        };

        var onCaptureAudioFail = function(){
            fail([]);
        };

        if (args[0].limit > 0 && args[0].duration){
            // a sloppy way of creating a uuid since there's no built in date function to get milliseconds since epoch
            // might be better to instead check files within directory and then figure out the next file name should be
            // ie, img000 -> img001 though that would take awhile and would add a whole bunch of checks
            var id = new Date();
            id = (id.getDay()).toString() + (id.getHours()).toString() + (id.getSeconds()).toString() + (id.getMilliseconds()).toString() + (id.getYear()).toString();

            var fileName = blackberry.io.dir.appDirs.shared.music.path+'/audio'+id+'.wav';
            blackberry.media.microphone.record(fileName, onCaptureAudioWin, onCaptureAudioFail);
            // multiple duration by a 1000 since it comes in as seconds
            setTimeout(blackberry.media.microphone.stop,args[0].duration*1000);
        }
        else {
            win([]);
        }
        return {"status": cordova.callbackStatus.NO_RESULT, "message": "WebWorks Is On It"};
    }
};

});

// file: lib/blackberry/plugin/air/device.js
define("cordova/plugin/air/device", function(require, exports, module) {

var channel = require('cordova/channel'),
    cordova = require('cordova');

// Tell cordova channel to wait on the CordovaInfoReady event
channel.waitForInitialization('onCordovaInfoReady');

module.exports = {
    getDeviceInfo : function(args, win, fail){
        //Register an event handler for the networkChange event
        var callback = blackberry.events.registerEventHandler("deviceInfo", function (info) {
                win({
                    platform: "BlackBerry",
                    version: info.version,
                    model: "PlayBook",
                    name: "PlayBook", // deprecated: please use device.model
                    uuid: info.uuid,
                    cordova: "2.7.0"
                });
            }),
            request = new blackberry.transport.RemoteFunctionCall("org/apache/cordova/getDeviceInfo");

        request.addParam("id", callback);
        request.makeSyncCall();

        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "" };
    }
};

});

// file: lib/blackberry/plugin/air/file/bbsymbols.js
define("cordova/plugin/air/file/bbsymbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/air/DirectoryReader', 'DirectoryReader');
modulemapper.clobbers('cordova/plugin/air/File', 'File');
modulemapper.clobbers('cordova/plugin/air/FileReader', 'FileReader');
modulemapper.clobbers('cordova/plugin/air/FileWriter', 'FileWriter');
modulemapper.clobbers('cordova/plugin/air/requestFileSystem', 'requestFileSystem');
modulemapper.clobbers('cordova/plugin/air/resolveLocalFileSystemURI', 'resolveLocalFileSystemURI');
modulemapper.merges('cordova/plugin/air/DirectoryEntry', 'DirectoryEntry');
modulemapper.merges('cordova/plugin/air/Entry', 'Entry');
modulemapper.merges('cordova/plugin/air/FileEntry', 'FileEntry');


});

// file: lib/blackberry/plugin/air/manager.js
define("cordova/plugin/air/manager", function(require, exports, module) {

var cordova = require('cordova'),
    plugins = {
        'Device' : require('cordova/plugin/air/device'),
        'Battery' : require('cordova/plugin/air/battery'),
        'Camera' : require('cordova/plugin/air/camera'),
        'Logger' : require('cordova/plugin/webworks/logger'),
        'Media' : require('cordova/plugin/webworks/media'),
        'Capture' : require('cordova/plugin/air/capture'),
        'Accelerometer' : require('cordova/plugin/webworks/accelerometer'),
        'NetworkStatus' : require('cordova/plugin/air/network'),
        'Notification' : require('cordova/plugin/webworks/notification'),
        'FileTransfer' : require('cordova/plugin/air/FileTransfer')
    };

module.exports = {
    addPlugin: function (key, module) {
        plugins[key] = require(module);
    },
    exec: function (win, fail, clazz, action, args) {
        var result = {"status" : cordova.callbackStatus.CLASS_NOT_FOUND_EXCEPTION, "message" : "Class " + clazz + " cannot be found"};

        if (plugins[clazz]) {
            if (plugins[clazz][action]) {
                result = plugins[clazz][action](args, win, fail);
            }
            else {
                result = { "status" : cordova.callbackStatus.INVALID_ACTION, "message" : "Action not found: " + action };
            }
        }

        return result;
    },
    resume: function () {},
    pause: function () {},
    destroy: function () {}
};

});

// file: lib/blackberry/plugin/air/network.js
define("cordova/plugin/air/network", function(require, exports, module) {

var cordova = require('cordova'),
    connection = require('cordova/plugin/Connection');

module.exports = {
    getConnectionInfo: function (args, win, fail) {
        var connectionType = connection.NONE,
            eventType = "offline",
            callbackID,
            request;

        /**
         * For PlayBooks, we currently only have WiFi connections, so
         * return WiFi if there is any access at all.
         * TODO: update if/when PlayBook gets other connection types...
         */
        if (blackberry.system.hasDataCoverage()) {
            connectionType = connection.WIFI;
            eventType = "online";
        }

        //Register an event handler for the networkChange event
        callbackID = blackberry.events.registerEventHandler("networkChange", function (status) {
            win(status.type);
        });

        //pass our callback id down to our network extension
        request = new blackberry.transport.RemoteFunctionCall("org/apache/cordova/getConnectionInfo");
        request.addParam("networkStatusChangedID", callbackID);
        request.makeSyncCall();

        return { "status": cordova.callbackStatus.OK, "message": connectionType};
    }
};

});

// file: lib/blackberry/plugin/air/platform.js
define("cordova/plugin/air/platform", function(require, exports, module) {

module.exports = {
    id: "playbook",
    initialize:function() {}
};

});

// file: lib/blackberry/plugin/air/requestFileSystem.js
define("cordova/plugin/air/requestFileSystem", function(require, exports, module) {

var DirectoryEntry = require('cordova/plugin/DirectoryEntry'),
FileError = require('cordova/plugin/FileError'),
FileSystem = require('cordova/plugin/FileSystem'),
LocalFileSystem = require('cordova/plugin/LocalFileSystem');

/**
 * Request a file system in which to store application data.
 * @param type  local file system type
 * @param size  indicates how much storage space, in bytes, the application expects to need
 * @param successCallback  invoked with a FileSystem object
 * @param errorCallback  invoked if error occurs retrieving file system
 */
var requestFileSystem = function(type, size, successCallback, errorCallback) {
    var fail = function(code) {
        if (typeof errorCallback === 'function') {
            errorCallback(new FileError(code));
        }
    };

    if (type < 0 || type > 3) {
        fail(FileError.SYNTAX_ERR);
    } else {
        // if successful, return a FileSystem object
        var success = function(file_system) {
            if (file_system) {
                if (typeof successCallback === 'function') {
                    successCallback(file_system);
                }
            }
            else {
                // no FileSystem object returned
                fail(FileError.NOT_FOUND_ERR);
            }
        };

        // guessing the max file size is 2GB - 1 bytes?
        // https://bdsc.webapps.blackberry.com/native/documentation/com.qnx.doc.neutrino.user_guide/topic/limits_filesystems.html

        if(size>=2147483648){
            fail(FileError.QUOTA_EXCEEDED_ERR);
            return;
        }


        var theFileSystem;
        try{
            // is there a way to get space for the app that doesn't point to the appDirs folder?
            if(type==LocalFileSystem.TEMPORARY){
                theFileSystem = new FileSystem('temporary', new DirectoryEntry('root', blackberry.io.dir.appDirs.app.storage.path));
            }else if(type==LocalFileSystem.PERSISTENT){
                theFileSystem = new FileSystem('persistent', new DirectoryEntry('root', blackberry.io.dir.appDirs.app.storage.path));
            }
            success(theFileSystem);
        }catch(e){
            fail(FileError.SYNTAX_ERR);
        }
    }
};
module.exports = requestFileSystem;

});

// file: lib/blackberry/plugin/air/resolveLocalFileSystemURI.js
define("cordova/plugin/air/resolveLocalFileSystemURI", function(require, exports, module) {

var DirectoryEntry = require('cordova/plugin/DirectoryEntry'),
    FileEntry = require('cordova/plugin/FileEntry'),
    FileError = require('cordova/plugin/FileError');

/**
 * Look up file system Entry referred to by local URI.
 * @param {DOMString} uri  URI referring to a local file or directory
 * @param successCallback  invoked with Entry object corresponding to URI
 * @param errorCallback    invoked if error occurs retrieving file system entry
 */
module.exports = function(uri, successCallback, errorCallback) {
    // error callback
    var fail = function(error) {
        if (typeof errorCallback === 'function') {
            errorCallback(new FileError(error));
        }
    };
    // if successful, return either a file or directory entry
    var success = function(entry) {
        var result;

        if (entry) {
            if (typeof successCallback === 'function') {
                // create appropriate Entry object
                result = (entry.isDirectory) ? new DirectoryEntry(entry.name, entry.fullPath) : new FileEntry(entry.name, entry.fullPath);
                try {
                    successCallback(result);
                }
                catch (e) {
                    console.log('Error invoking callback: ' + e);
                }
            }
        }
        else {
            // no Entry object returned
            fail(FileError.NOT_FOUND_ERR);
            return;
        }
    };

    if(!uri || uri === ""){
        fail(FileError.NOT_FOUND_ERR);
        return;
    }

    // decode uri if % char found
    if(uri.indexOf('%')>=0){
        uri = decodeURI(uri);
    }

    // pop the parameters if any
    if(uri.indexOf('?')>=0){
        uri = uri.split('?')[0];
    }

    // check for leading /
    if(uri.indexOf('/')===0){
        fail(FileError.ENCODING_ERR);
        return;
    }

    // Entry object is borked - unable to instantiate a new Entry object so just create one
    var theEntry = {};
    if(blackberry.io.dir.exists(uri)){
        theEntry.isDirectory = true;
        theEntry.name = uri.split('/').pop();
        theEntry.fullPath = uri;

        success(theEntry);
    }else if(blackberry.io.file.exists(uri)){
        theEntry.isDirectory = false;
        theEntry.name = uri.split('/').pop();
        theEntry.fullPath = uri;
        success(theEntry);
        return;
    }else{
        fail(FileError.NOT_FOUND_ERR);
        return;
    }

};

});

// file: lib/common/plugin/battery.js
define("cordova/plugin/battery", function(require, exports, module) {

/**
 * This class contains information about the current battery status.
 * @constructor
 */
var cordova = require('cordova'),
    exec = require('cordova/exec');

function handlers() {
  return battery.channels.batterystatus.numHandlers +
         battery.channels.batterylow.numHandlers +
         battery.channels.batterycritical.numHandlers;
}

var Battery = function() {
    this._level = null;
    this._isPlugged = null;
    // Create new event handlers on the window (returns a channel instance)
    this.channels = {
      batterystatus:cordova.addWindowEventHandler("batterystatus"),
      batterylow:cordova.addWindowEventHandler("batterylow"),
      batterycritical:cordova.addWindowEventHandler("batterycritical")
    };
    for (var key in this.channels) {
        this.channels[key].onHasSubscribersChange = Battery.onHasSubscribersChange;
    }
};
/**
 * Event handlers for when callbacks get registered for the battery.
 * Keep track of how many handlers we have so we can start and stop the native battery listener
 * appropriately (and hopefully save on battery life!).
 */
Battery.onHasSubscribersChange = function() {
  // If we just registered the first handler, make sure native listener is started.
  if (this.numHandlers === 1 && handlers() === 1) {
      exec(battery._status, battery._error, "Battery", "start", []);
  } else if (handlers() === 0) {
      exec(null, null, "Battery", "stop", []);
  }
};

/**
 * Callback for battery status
 *
 * @param {Object} info            keys: level, isPlugged
 */
Battery.prototype._status = function(info) {
    if (info) {
        var me = battery;
    var level = info.level;
        if (me._level !== level || me._isPlugged !== info.isPlugged) {
            // Fire batterystatus event
            cordova.fireWindowEvent("batterystatus", info);

            // Fire low battery event
            if (level === 20 || level === 5) {
                if (level === 20) {
                    cordova.fireWindowEvent("batterylow", info);
                }
                else {
                    cordova.fireWindowEvent("batterycritical", info);
                }
            }
        }
        me._level = level;
        me._isPlugged = info.isPlugged;
    }
};

/**
 * Error callback for battery start
 */
Battery.prototype._error = function(e) {
    console.log("Error initializing Battery: " + e);
};

var battery = new Battery();

module.exports = battery;

});

// file: lib/common/plugin/battery/symbols.js
define("cordova/plugin/battery/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.defaults('cordova/plugin/battery', 'navigator.battery');

});

// file: lib/common/plugin/camera/symbols.js
define("cordova/plugin/camera/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.defaults('cordova/plugin/Camera', 'navigator.camera');
modulemapper.defaults('cordova/plugin/CameraConstants', 'Camera');
modulemapper.defaults('cordova/plugin/CameraPopoverOptions', 'CameraPopoverOptions');

});

// file: lib/common/plugin/capture.js
define("cordova/plugin/capture", function(require, exports, module) {

var exec = require('cordova/exec'),
    MediaFile = require('cordova/plugin/MediaFile');

/**
 * Launches a capture of different types.
 *
 * @param (DOMString} type
 * @param {Function} successCB
 * @param {Function} errorCB
 * @param {CaptureVideoOptions} options
 */
function _capture(type, successCallback, errorCallback, options) {
    var win = function(pluginResult) {
        var mediaFiles = [];
        var i;
        for (i = 0; i < pluginResult.length; i++) {
            var mediaFile = new MediaFile();
            mediaFile.name = pluginResult[i].name;
            mediaFile.fullPath = pluginResult[i].fullPath;
            mediaFile.type = pluginResult[i].type;
            mediaFile.lastModifiedDate = pluginResult[i].lastModifiedDate;
            mediaFile.size = pluginResult[i].size;
            mediaFiles.push(mediaFile);
        }
        successCallback(mediaFiles);
    };
    exec(win, errorCallback, "Capture", type, [options]);
}
/**
 * The Capture interface exposes an interface to the camera and microphone of the hosting device.
 */
function Capture() {
    this.supportedAudioModes = [];
    this.supportedImageModes = [];
    this.supportedVideoModes = [];
}

/**
 * Launch audio recorder application for recording audio clip(s).
 *
 * @param {Function} successCB
 * @param {Function} errorCB
 * @param {CaptureAudioOptions} options
 */
Capture.prototype.captureAudio = function(successCallback, errorCallback, options){
    _capture("captureAudio", successCallback, errorCallback, options);
};

/**
 * Launch camera application for taking image(s).
 *
 * @param {Function} successCB
 * @param {Function} errorCB
 * @param {CaptureImageOptions} options
 */
Capture.prototype.captureImage = function(successCallback, errorCallback, options){
    _capture("captureImage", successCallback, errorCallback, options);
};

/**
 * Launch device camera application for recording video(s).
 *
 * @param {Function} successCB
 * @param {Function} errorCB
 * @param {CaptureVideoOptions} options
 */
Capture.prototype.captureVideo = function(successCallback, errorCallback, options){
    _capture("captureVideo", successCallback, errorCallback, options);
};


module.exports = new Capture();

});

// file: lib/common/plugin/capture/symbols.js
define("cordova/plugin/capture/symbols", function(require, exports, module) {

var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/CaptureError', 'CaptureError');
modulemapper.clobbers('cordova/plugin/CaptureAudioOptions', 'CaptureAudioOptions');
modulemapper.clobbers('cordova/plugin/CaptureImageOptions', 'CaptureImageOptions');
modulemapper.clobbers('cordova/plugin/CaptureVideoOptions', 'CaptureVideoOptions');
modulemapper.clobbers('cordova/plugin/ConfigurationData', 'ConfigurationData');
modulemapper.clobbers('cordova/plugin/MediaFile', 'MediaFile');
modulemapper.clobbers('cordova/plugin/MediaFileData', 'MediaFileData');
modulemapper.clobbers('cordova/plugin/capture', 'navigator.device.capture');

});

// file: lib/common/plugin/compass.js
define("cordova/plugin/compass", function(require, exports, module) {

var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec'),
    utils = require('cordova/utils'),
    CompassHeading = require('cordova/plugin/CompassHeading'),
    CompassError = require('cordova/plugin/CompassError'),
    timers = {},
    compass = {
        /**
         * Asynchronously acquires the current heading.
         * @param {Function} successCallback The function to call when the heading
         * data is available
         * @param {Function} errorCallback The function to call when there is an error
         * getting the heading data.
         * @param {CompassOptions} options The options for getting the heading data (not used).
         */
        getCurrentHeading:function(successCallback, errorCallback, options) {
            argscheck.checkArgs('fFO', 'compass.getCurrentHeading', arguments);

            var win = function(result) {
                var ch = new CompassHeading(result.magneticHeading, result.trueHeading, result.headingAccuracy, result.timestamp);
                successCallback(ch);
            };
            var fail = errorCallback && function(code) {
                var ce = new CompassError(code);
                errorCallback(ce);
            };

            // Get heading
            exec(win, fail, "Compass", "getHeading", [options]);
        },

        /**
         * Asynchronously acquires the heading repeatedly at a given interval.
         * @param {Function} successCallback The function to call each time the heading
         * data is available
         * @param {Function} errorCallback The function to call when there is an error
         * getting the heading data.
         * @param {HeadingOptions} options The options for getting the heading data
         * such as timeout and the frequency of the watch. For iOS, filter parameter
         * specifies to watch via a distance filter rather than time.
         */
        watchHeading:function(successCallback, errorCallback, options) {
            argscheck.checkArgs('fFO', 'compass.watchHeading', arguments);
            // Default interval (100 msec)
            var frequency = (options !== undefined && options.frequency !== undefined) ? options.frequency : 100;
            var filter = (options !== undefined && options.filter !== undefined) ? options.filter : 0;

            var id = utils.createUUID();
            if (filter > 0) {
                // is an iOS request for watch by filter, no timer needed
                timers[id] = "iOS";
                compass.getCurrentHeading(successCallback, errorCallback, options);
            } else {
                // Start watch timer to get headings
                timers[id] = window.setInterval(function() {
                    compass.getCurrentHeading(successCallback, errorCallback);
                }, frequency);
            }

            return id;
        },

        /**
         * Clears the specified heading watch.
         * @param {String} watchId The ID of the watch returned from #watchHeading.
         */
        clearWatch:function(id) {
            // Stop javascript timer & remove from timer list
            if (id && timers[id]) {
                if (timers[id] != "iOS") {
                    clearInterval(timers[id]);
                } else {
                    // is iOS watch by filter so call into device to stop
                    exec(null, null, "Compass", "stopHeading", []);
                }
                delete timers[id];
            }
        }
    };

module.exports = compass;

});

// file: lib/common/plugin/compass/symbols.js
define("cordova/plugin/compass/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/CompassHeading', 'CompassHeading');
modulemapper.clobbers('cordova/plugin/CompassError', 'CompassError');
modulemapper.clobbers('cordova/plugin/compass', 'navigator.compass');

});

// file: lib/common/plugin/console-via-logger.js
define("cordova/plugin/console-via-logger", function(require, exports, module) {

//------------------------------------------------------------------------------

var logger = require("cordova/plugin/logger");
var utils  = require("cordova/utils");

//------------------------------------------------------------------------------
// object that we're exporting
//------------------------------------------------------------------------------
var console = module.exports;

//------------------------------------------------------------------------------
// copy of the original console object
//------------------------------------------------------------------------------
var WinConsole = window.console;

//------------------------------------------------------------------------------
// whether to use the logger
//------------------------------------------------------------------------------
var UseLogger = false;

//------------------------------------------------------------------------------
// Timers
//------------------------------------------------------------------------------
var Timers = {};

//------------------------------------------------------------------------------
// used for unimplemented methods
//------------------------------------------------------------------------------
function noop() {}

//------------------------------------------------------------------------------
// used for unimplemented methods
//------------------------------------------------------------------------------
console.useLogger = function (value) {
    if (arguments.length) UseLogger = !!value;

    if (UseLogger) {
        if (logger.useConsole()) {
            throw new Error("console and logger are too intertwingly");
        }
    }

    return UseLogger;
};

//------------------------------------------------------------------------------
console.log = function() {
    if (logger.useConsole()) return;
    logger.log.apply(logger, [].slice.call(arguments));
};

//------------------------------------------------------------------------------
console.error = function() {
    if (logger.useConsole()) return;
    logger.error.apply(logger, [].slice.call(arguments));
};

//------------------------------------------------------------------------------
console.warn = function() {
    if (logger.useConsole()) return;
    logger.warn.apply(logger, [].slice.call(arguments));
};

//------------------------------------------------------------------------------
console.info = function() {
    if (logger.useConsole()) return;
    logger.info.apply(logger, [].slice.call(arguments));
};

//------------------------------------------------------------------------------
console.debug = function() {
    if (logger.useConsole()) return;
    logger.debug.apply(logger, [].slice.call(arguments));
};

//------------------------------------------------------------------------------
console.assert = function(expression) {
    if (expression) return;

    var message = logger.format.apply(logger.format, [].slice.call(arguments, 1));
    console.log("ASSERT: " + message);
};

//------------------------------------------------------------------------------
console.clear = function() {};

//------------------------------------------------------------------------------
console.dir = function(object) {
    console.log("%o", object);
};

//------------------------------------------------------------------------------
console.dirxml = function(node) {
    console.log(node.innerHTML);
};

//------------------------------------------------------------------------------
console.trace = noop;

//------------------------------------------------------------------------------
console.group = console.log;

//------------------------------------------------------------------------------
console.groupCollapsed = console.log;

//------------------------------------------------------------------------------
console.groupEnd = noop;

//------------------------------------------------------------------------------
console.time = function(name) {
    Timers[name] = new Date().valueOf();
};

//------------------------------------------------------------------------------
console.timeEnd = function(name) {
    var timeStart = Timers[name];
    if (!timeStart) {
        console.warn("unknown timer: " + name);
        return;
    }

    var timeElapsed = new Date().valueOf() - timeStart;
    console.log(name + ": " + timeElapsed + "ms");
};

//------------------------------------------------------------------------------
console.timeStamp = noop;

//------------------------------------------------------------------------------
console.profile = noop;

//------------------------------------------------------------------------------
console.profileEnd = noop;

//------------------------------------------------------------------------------
console.count = noop;

//------------------------------------------------------------------------------
console.exception = console.log;

//------------------------------------------------------------------------------
console.table = function(data, columns) {
    console.log("%o", data);
};

//------------------------------------------------------------------------------
// return a new function that calls both functions passed as args
//------------------------------------------------------------------------------
function wrappedOrigCall(orgFunc, newFunc) {
    return function() {
        var args = [].slice.call(arguments);
        try { orgFunc.apply(WinConsole, args); } catch (e) {}
        try { newFunc.apply(console,    args); } catch (e) {}
    };
}

//------------------------------------------------------------------------------
// For every function that exists in the original console object, that
// also exists in the new console object, wrap the new console method
// with one that calls both
//------------------------------------------------------------------------------
for (var key in console) {
    if (typeof WinConsole[key] == "function") {
        console[key] = wrappedOrigCall(WinConsole[key], console[key]);
    }
}

});

// file: lib/common/plugin/contacts.js
define("cordova/plugin/contacts", function(require, exports, module) {

var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec'),
    ContactError = require('cordova/plugin/ContactError'),
    utils = require('cordova/utils'),
    Contact = require('cordova/plugin/Contact');

/**
* Represents a group of Contacts.
* @constructor
*/
var contacts = {
    /**
     * Returns an array of Contacts matching the search criteria.
     * @param fields that should be searched
     * @param successCB success callback
     * @param errorCB error callback
     * @param {ContactFindOptions} options that can be applied to contact searching
     * @return array of Contacts matching search criteria
     */
    find:function(fields, successCB, errorCB, options) {
        argscheck.checkArgs('afFO', 'contacts.find', arguments);
        if (!fields.length) {
            errorCB && errorCB(new ContactError(ContactError.INVALID_ARGUMENT_ERROR));
        } else {
            var win = function(result) {
                var cs = [];
                for (var i = 0, l = result.length; i < l; i++) {
                    cs.push(contacts.create(result[i]));
                }
                successCB(cs);
            };
            exec(win, errorCB, "Contacts", "search", [fields, options]);
        }
    },

    /**
     * This function creates a new contact, but it does not persist the contact
     * to device storage. To persist the contact to device storage, invoke
     * contact.save().
     * @param properties an object whose properties will be examined to create a new Contact
     * @returns new Contact object
     */
    create:function(properties) {
        argscheck.checkArgs('O', 'contacts.create', arguments);
        var contact = new Contact();
        for (var i in properties) {
            if (typeof contact[i] !== 'undefined' && properties.hasOwnProperty(i)) {
                contact[i] = properties[i];
            }
        }
        return contact;
    }
};

module.exports = contacts;

});

// file: lib/common/plugin/contacts/symbols.js
define("cordova/plugin/contacts/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/contacts', 'navigator.contacts');
modulemapper.clobbers('cordova/plugin/Contact', 'Contact');
modulemapper.clobbers('cordova/plugin/ContactAddress', 'ContactAddress');
modulemapper.clobbers('cordova/plugin/ContactError', 'ContactError');
modulemapper.clobbers('cordova/plugin/ContactField', 'ContactField');
modulemapper.clobbers('cordova/plugin/ContactFindOptions', 'ContactFindOptions');
modulemapper.clobbers('cordova/plugin/ContactName', 'ContactName');
modulemapper.clobbers('cordova/plugin/ContactOrganization', 'ContactOrganization');

});

// file: lib/common/plugin/device.js
define("cordova/plugin/device", function(require, exports, module) {

var argscheck = require('cordova/argscheck'),
    channel = require('cordova/channel'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec');

// Tell cordova channel to wait on the CordovaInfoReady event
channel.waitForInitialization('onCordovaInfoReady');

/**
 * This represents the mobile device, and provides properties for inspecting the model, version, UUID of the
 * phone, etc.
 * @constructor
 */
function Device() {
    this.available = false;
    this.platform = null;
    this.version = null;
    this.name = null;
    this.uuid = null;
    this.cordova = null;
    this.model = null;

    var me = this;

    channel.onCordovaReady.subscribe(function() {
        me.getInfo(function(info) {
            me.available = true;
            me.platform = info.platform;
            me.version = info.version;
            me.name = info.name;
            me.uuid = info.uuid;
            me.cordova = info.cordova;
            me.model = info.model;
            channel.onCordovaInfoReady.fire();
        },function(e) {
            me.available = false;
            utils.alert("[ERROR] Error initializing Cordova: " + e);
        });
    });
}

/**
 * Get device info
 *
 * @param {Function} successCallback The function to call when the heading data is available
 * @param {Function} errorCallback The function to call when there is an error getting the heading data. (OPTIONAL)
 */
Device.prototype.getInfo = function(successCallback, errorCallback) {
    argscheck.checkArgs('fF', 'Device.getInfo', arguments);
    exec(successCallback, errorCallback, "Device", "getDeviceInfo", []);
};

module.exports = new Device();

});

// file: lib/common/plugin/device/symbols.js
define("cordova/plugin/device/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/device', 'device');

});

// file: lib/common/plugin/echo.js
define("cordova/plugin/echo", function(require, exports, module) {

var exec = require('cordova/exec'),
    utils = require('cordova/utils');

/**
 * Sends the given message through exec() to the Echo plugin, which sends it back to the successCallback.
 * @param successCallback  invoked with a FileSystem object
 * @param errorCallback  invoked if error occurs retrieving file system
 * @param message  The string to be echoed.
 * @param forceAsync  Whether to force an async return value (for testing native->js bridge).
 */
module.exports = function(successCallback, errorCallback, message, forceAsync) {
    var action = 'echo';
    var messageIsMultipart = (utils.typeName(message) == "Array");
    var args = messageIsMultipart ? message : [message];

    if (utils.typeName(message) == 'ArrayBuffer') {
        if (forceAsync) {
            console.warn('Cannot echo ArrayBuffer with forced async, falling back to sync.');
        }
        action += 'ArrayBuffer';
    } else if (messageIsMultipart) {
        if (forceAsync) {
            console.warn('Cannot echo MultiPart Array with forced async, falling back to sync.');
        }
        action += 'MultiPart';
    } else if (forceAsync) {
        action += 'Async';
    }

    exec(successCallback, errorCallback, "Echo", action, args);
};


});

// file: lib/common/plugin/file/symbols.js
define("cordova/plugin/file/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper'),
    symbolshelper = require('cordova/plugin/file/symbolshelper');

symbolshelper(modulemapper.defaults);

});

// file: lib/common/plugin/file/symbolshelper.js
define("cordova/plugin/file/symbolshelper", function(require, exports, module) {

module.exports = function(exportFunc) {
    exportFunc('cordova/plugin/DirectoryEntry', 'DirectoryEntry');
    exportFunc('cordova/plugin/DirectoryReader', 'DirectoryReader');
    exportFunc('cordova/plugin/Entry', 'Entry');
    exportFunc('cordova/plugin/File', 'File');
    exportFunc('cordova/plugin/FileEntry', 'FileEntry');
    exportFunc('cordova/plugin/FileError', 'FileError');
    exportFunc('cordova/plugin/FileReader', 'FileReader');
    exportFunc('cordova/plugin/FileSystem', 'FileSystem');
    exportFunc('cordova/plugin/FileUploadOptions', 'FileUploadOptions');
    exportFunc('cordova/plugin/FileUploadResult', 'FileUploadResult');
    exportFunc('cordova/plugin/FileWriter', 'FileWriter');
    exportFunc('cordova/plugin/Flags', 'Flags');
    exportFunc('cordova/plugin/LocalFileSystem', 'LocalFileSystem');
    exportFunc('cordova/plugin/Metadata', 'Metadata');
    exportFunc('cordova/plugin/ProgressEvent', 'ProgressEvent');
    exportFunc('cordova/plugin/requestFileSystem', 'requestFileSystem');
    exportFunc('cordova/plugin/resolveLocalFileSystemURI', 'resolveLocalFileSystemURI');
};

});

// file: lib/common/plugin/filetransfer/symbols.js
define("cordova/plugin/filetransfer/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/FileTransfer', 'FileTransfer');
modulemapper.clobbers('cordova/plugin/FileTransferError', 'FileTransferError');

});

// file: lib/common/plugin/geolocation.js
define("cordova/plugin/geolocation", function(require, exports, module) {

var argscheck = require('cordova/argscheck'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec'),
    PositionError = require('cordova/plugin/PositionError'),
    Position = require('cordova/plugin/Position');

var timers = {};   // list of timers in use

// Returns default params, overrides if provided with values
function parseParameters(options) {
    var opt = {
        maximumAge: 0,
        enableHighAccuracy: false,
        timeout: Infinity
    };

    if (options) {
        if (options.maximumAge !== undefined && !isNaN(options.maximumAge) && options.maximumAge > 0) {
            opt.maximumAge = options.maximumAge;
        }
        if (options.enableHighAccuracy !== undefined) {
            opt.enableHighAccuracy = options.enableHighAccuracy;
        }
        if (options.timeout !== undefined && !isNaN(options.timeout)) {
            if (options.timeout < 0) {
                opt.timeout = 0;
            } else {
                opt.timeout = options.timeout;
            }
        }
    }

    return opt;
}

// Returns a timeout failure, closed over a specified timeout value and error callback.
function createTimeout(errorCallback, timeout) {
    var t = setTimeout(function() {
        clearTimeout(t);
        t = null;
        errorCallback({
            code:PositionError.TIMEOUT,
            message:"Position retrieval timed out."
        });
    }, timeout);
    return t;
}

var geolocation = {
    lastPosition:null, // reference to last known (cached) position returned
    /**
   * Asynchronously acquires the current position.
   *
   * @param {Function} successCallback    The function to call when the position data is available
   * @param {Function} errorCallback      The function to call when there is an error getting the heading position. (OPTIONAL)
   * @param {PositionOptions} options     The options for getting the position data. (OPTIONAL)
   */
    getCurrentPosition:function(successCallback, errorCallback, options) {
        argscheck.checkArgs('fFO', 'geolocation.getCurrentPosition', arguments);
        options = parseParameters(options);

        // Timer var that will fire an error callback if no position is retrieved from native
        // before the "timeout" param provided expires
        var timeoutTimer = {timer:null};

        var win = function(p) {
            clearTimeout(timeoutTimer.timer);
            if (!(timeoutTimer.timer)) {
                // Timeout already happened, or native fired error callback for
                // this geo request.
                // Don't continue with success callback.
                return;
            }
            var pos = new Position(
                {
                    latitude:p.latitude,
                    longitude:p.longitude,
                    altitude:p.altitude,
                    accuracy:p.accuracy,
                    heading:p.heading,
                    velocity:p.velocity,
                    altitudeAccuracy:p.altitudeAccuracy
                },
                (p.timestamp === undefined ? new Date() : ((p.timestamp instanceof Date) ? p.timestamp : new Date(p.timestamp)))
            );
            geolocation.lastPosition = pos;
            successCallback(pos);
        };
        var fail = function(e) {
            clearTimeout(timeoutTimer.timer);
            timeoutTimer.timer = null;
            var err = new PositionError(e.code, e.message);
            if (errorCallback) {
                errorCallback(err);
            }
        };

        // Check our cached position, if its timestamp difference with current time is less than the maximumAge, then just
        // fire the success callback with the cached position.
        if (geolocation.lastPosition && options.maximumAge && (((new Date()).getTime() - geolocation.lastPosition.timestamp.getTime()) <= options.maximumAge)) {
            successCallback(geolocation.lastPosition);
        // If the cached position check failed and the timeout was set to 0, error out with a TIMEOUT error object.
        } else if (options.timeout === 0) {
            fail({
                code:PositionError.TIMEOUT,
                message:"timeout value in PositionOptions set to 0 and no cached Position object available, or cached Position object's age exceeds provided PositionOptions' maximumAge parameter."
            });
        // Otherwise we have to call into native to retrieve a position.
        } else {
            if (options.timeout !== Infinity) {
                // If the timeout value was not set to Infinity (default), then
                // set up a timeout function that will fire the error callback
                // if no successful position was retrieved before timeout expired.
                timeoutTimer.timer = createTimeout(fail, options.timeout);
            } else {
                // This is here so the check in the win function doesn't mess stuff up
                // may seem weird but this guarantees timeoutTimer is
                // always truthy before we call into native
                timeoutTimer.timer = true;
            }
            exec(win, fail, "Geolocation", "getLocation", [options.enableHighAccuracy, options.maximumAge]);
        }
        return timeoutTimer;
    },
    /**
     * Asynchronously watches the geolocation for changes to geolocation.  When a change occurs,
     * the successCallback is called with the new location.
     *
     * @param {Function} successCallback    The function to call each time the location data is available
     * @param {Function} errorCallback      The function to call when there is an error getting the location data. (OPTIONAL)
     * @param {PositionOptions} options     The options for getting the location data such as frequency. (OPTIONAL)
     * @return String                       The watch id that must be passed to #clearWatch to stop watching.
     */
    watchPosition:function(successCallback, errorCallback, options) {
        argscheck.checkArgs('fFO', 'geolocation.getCurrentPosition', arguments);
        options = parseParameters(options);

        var id = utils.createUUID();

        // Tell device to get a position ASAP, and also retrieve a reference to the timeout timer generated in getCurrentPosition
        timers[id] = geolocation.getCurrentPosition(successCallback, errorCallback, options);

        var fail = function(e) {
            clearTimeout(timers[id].timer);
            var err = new PositionError(e.code, e.message);
            if (errorCallback) {
                errorCallback(err);
            }
        };

        var win = function(p) {
            clearTimeout(timers[id].timer);
            if (options.timeout !== Infinity) {
                timers[id].timer = createTimeout(fail, options.timeout);
            }
            var pos = new Position(
                {
                    latitude:p.latitude,
                    longitude:p.longitude,
                    altitude:p.altitude,
                    accuracy:p.accuracy,
                    heading:p.heading,
                    velocity:p.velocity,
                    altitudeAccuracy:p.altitudeAccuracy
                },
                (p.timestamp === undefined ? new Date() : ((p.timestamp instanceof Date) ? p.timestamp : new Date(p.timestamp)))
            );
            geolocation.lastPosition = pos;
            successCallback(pos);
        };

        exec(win, fail, "Geolocation", "addWatch", [id, options.enableHighAccuracy]);

        return id;
    },
    /**
     * Clears the specified heading watch.
     *
     * @param {String} id       The ID of the watch returned from #watchPosition
     */
    clearWatch:function(id) {
        if (id && timers[id] !== undefined) {
            clearTimeout(timers[id].timer);
            timers[id].timer = false;
            exec(null, null, "Geolocation", "clearWatch", [id]);
        }
    }
};

module.exports = geolocation;

});

// file: lib/common/plugin/geolocation/symbols.js
define("cordova/plugin/geolocation/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.defaults('cordova/plugin/geolocation', 'navigator.geolocation');
modulemapper.clobbers('cordova/plugin/PositionError', 'PositionError');
modulemapper.clobbers('cordova/plugin/Position', 'Position');
modulemapper.clobbers('cordova/plugin/Coordinates', 'Coordinates');

});

// file: lib/common/plugin/globalization.js
define("cordova/plugin/globalization", function(require, exports, module) {

var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec'),
    GlobalizationError = require('cordova/plugin/GlobalizationError');

var globalization = {

/**
* Returns the string identifier for the client's current language.
* It returns the language identifier string to the successCB callback with a
* properties object as a parameter. If there is an error getting the language,
* then the errorCB callback is invoked.
*
* @param {Function} successCB
* @param {Function} errorCB
*
* @return Object.value {String}: The language identifier
*
* @error GlobalizationError.UNKNOWN_ERROR
*
* Example
*    globalization.getPreferredLanguage(function (language) {alert('language:' + language.value + '\n');},
*                                function () {});
*/
getPreferredLanguage:function(successCB, failureCB) {
    argscheck.checkArgs('fF', 'Globalization.getPreferredLanguage', arguments);
    exec(successCB, failureCB, "Globalization","getPreferredLanguage", []);
},

/**
* Returns the string identifier for the client's current locale setting.
* It returns the locale identifier string to the successCB callback with a
* properties object as a parameter. If there is an error getting the locale,
* then the errorCB callback is invoked.
*
* @param {Function} successCB
* @param {Function} errorCB
*
* @return Object.value {String}: The locale identifier
*
* @error GlobalizationError.UNKNOWN_ERROR
*
* Example
*    globalization.getLocaleName(function (locale) {alert('locale:' + locale.value + '\n');},
*                                function () {});
*/
getLocaleName:function(successCB, failureCB) {
    argscheck.checkArgs('fF', 'Globalization.getLocaleName', arguments);
    exec(successCB, failureCB, "Globalization","getLocaleName", []);
},


/**
* Returns a date formatted as a string according to the client's user preferences and
* calendar using the time zone of the client. It returns the formatted date string to the
* successCB callback with a properties object as a parameter. If there is an error
* formatting the date, then the errorCB callback is invoked.
*
* The defaults are: formatLenght="short" and selector="date and time"
*
* @param {Date} date
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            formatLength {String}: 'short', 'medium', 'long', or 'full'
*            selector {String}: 'date', 'time', or 'date and time'
*
* @return Object.value {String}: The localized date string
*
* @error GlobalizationError.FORMATTING_ERROR
*
* Example
*    globalization.dateToString(new Date(),
*                function (date) {alert('date:' + date.value + '\n');},
*                function (errorCode) {alert(errorCode);},
*                {formatLength:'short'});
*/
dateToString:function(date, successCB, failureCB, options) {
    argscheck.checkArgs('dfFO', 'Globalization.dateToString', arguments);
    var dateValue = date.valueOf();
    exec(successCB, failureCB, "Globalization", "dateToString", [{"date": dateValue, "options": options}]);
},


/**
* Parses a date formatted as a string according to the client's user
* preferences and calendar using the time zone of the client and returns
* the corresponding date object. It returns the date to the successCB
* callback with a properties object as a parameter. If there is an error
* parsing the date string, then the errorCB callback is invoked.
*
* The defaults are: formatLength="short" and selector="date and time"
*
* @param {String} dateString
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            formatLength {String}: 'short', 'medium', 'long', or 'full'
*            selector {String}: 'date', 'time', or 'date and time'
*
* @return    Object.year {Number}: The four digit year
*            Object.month {Number}: The month from (0 - 11)
*            Object.day {Number}: The day from (1 - 31)
*            Object.hour {Number}: The hour from (0 - 23)
*            Object.minute {Number}: The minute from (0 - 59)
*            Object.second {Number}: The second from (0 - 59)
*            Object.millisecond {Number}: The milliseconds (from 0 - 999),
*                                        not available on all platforms
*
* @error GlobalizationError.PARSING_ERROR
*
* Example
*    globalization.stringToDate('4/11/2011',
*                function (date) { alert('Month:' + date.month + '\n' +
*                    'Day:' + date.day + '\n' +
*                    'Year:' + date.year + '\n');},
*                function (errorCode) {alert(errorCode);},
*                {selector:'date'});
*/
stringToDate:function(dateString, successCB, failureCB, options) {
    argscheck.checkArgs('sfFO', 'Globalization.stringToDate', arguments);
    exec(successCB, failureCB, "Globalization", "stringToDate", [{"dateString": dateString, "options": options}]);
},


/**
* Returns a pattern string for formatting and parsing dates according to the client's
* user preferences. It returns the pattern to the successCB callback with a
* properties object as a parameter. If there is an error obtaining the pattern,
* then the errorCB callback is invoked.
*
* The defaults are: formatLength="short" and selector="date and time"
*
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            formatLength {String}: 'short', 'medium', 'long', or 'full'
*            selector {String}: 'date', 'time', or 'date and time'
*
* @return    Object.pattern {String}: The date and time pattern for formatting and parsing dates.
*                                    The patterns follow Unicode Technical Standard #35
*                                    http://unicode.org/reports/tr35/tr35-4.html
*            Object.timezone {String}: The abbreviated name of the time zone on the client
*            Object.utc_offset {Number}: The current difference in seconds between the client's
*                                        time zone and coordinated universal time.
*            Object.dst_offset {Number}: The current daylight saving time offset in seconds
*                                        between the client's non-daylight saving's time zone
*                                        and the client's daylight saving's time zone.
*
* @error GlobalizationError.PATTERN_ERROR
*
* Example
*    globalization.getDatePattern(
*                function (date) {alert('pattern:' + date.pattern + '\n');},
*                function () {},
*                {formatLength:'short'});
*/
getDatePattern:function(successCB, failureCB, options) {
    argscheck.checkArgs('fFO', 'Globalization.getDatePattern', arguments);
    exec(successCB, failureCB, "Globalization", "getDatePattern", [{"options": options}]);
},


/**
* Returns an array of either the names of the months or days of the week
* according to the client's user preferences and calendar. It returns the array of names to the
* successCB callback with a properties object as a parameter. If there is an error obtaining the
* names, then the errorCB callback is invoked.
*
* The defaults are: type="wide" and item="months"
*
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            type {String}: 'narrow' or 'wide'
*            item {String}: 'months', or 'days'
*
* @return Object.value {Array{String}}: The array of names starting from either
*                                        the first month in the year or the
*                                        first day of the week.
* @error GlobalizationError.UNKNOWN_ERROR
*
* Example
*    globalization.getDateNames(function (names) {
*        for(var i = 0; i < names.value.length; i++) {
*            alert('Month:' + names.value[i] + '\n');}},
*        function () {});
*/
getDateNames:function(successCB, failureCB, options) {
    argscheck.checkArgs('fFO', 'Globalization.getDateNames', arguments);
    exec(successCB, failureCB, "Globalization", "getDateNames", [{"options": options}]);
},

/**
* Returns whether daylight savings time is in effect for a given date using the client's
* time zone and calendar. It returns whether or not daylight savings time is in effect
* to the successCB callback with a properties object as a parameter. If there is an error
* reading the date, then the errorCB callback is invoked.
*
* @param {Date} date
* @param {Function} successCB
* @param {Function} errorCB
*
* @return Object.dst {Boolean}: The value "true" indicates that daylight savings time is
*                                in effect for the given date and "false" indicate that it is not.
*
* @error GlobalizationError.UNKNOWN_ERROR
*
* Example
*    globalization.isDayLightSavingsTime(new Date(),
*                function (date) {alert('dst:' + date.dst + '\n');}
*                function () {});
*/
isDayLightSavingsTime:function(date, successCB, failureCB) {
    argscheck.checkArgs('dfF', 'Globalization.isDayLightSavingsTime', arguments);
    var dateValue = date.valueOf();
    exec(successCB, failureCB, "Globalization", "isDayLightSavingsTime", [{"date": dateValue}]);
},

/**
* Returns the first day of the week according to the client's user preferences and calendar.
* The days of the week are numbered starting from 1 where 1 is considered to be Sunday.
* It returns the day to the successCB callback with a properties object as a parameter.
* If there is an error obtaining the pattern, then the errorCB callback is invoked.
*
* @param {Function} successCB
* @param {Function} errorCB
*
* @return Object.value {Number}: The number of the first day of the week.
*
* @error GlobalizationError.UNKNOWN_ERROR
*
* Example
*    globalization.getFirstDayOfWeek(function (day)
*                { alert('Day:' + day.value + '\n');},
*                function () {});
*/
getFirstDayOfWeek:function(successCB, failureCB) {
    argscheck.checkArgs('fF', 'Globalization.getFirstDayOfWeek', arguments);
    exec(successCB, failureCB, "Globalization", "getFirstDayOfWeek", []);
},


/**
* Returns a number formatted as a string according to the client's user preferences.
* It returns the formatted number string to the successCB callback with a properties object as a
* parameter. If there is an error formatting the number, then the errorCB callback is invoked.
*
* The defaults are: type="decimal"
*
* @param {Number} number
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            type {String}: 'decimal', "percent", or 'currency'
*
* @return Object.value {String}: The formatted number string.
*
* @error GlobalizationError.FORMATTING_ERROR
*
* Example
*    globalization.numberToString(3.25,
*                function (number) {alert('number:' + number.value + '\n');},
*                function () {},
*                {type:'decimal'});
*/
numberToString:function(number, successCB, failureCB, options) {
    argscheck.checkArgs('nfFO', 'Globalization.numberToString', arguments);
    exec(successCB, failureCB, "Globalization", "numberToString", [{"number": number, "options": options}]);
},

/**
* Parses a number formatted as a string according to the client's user preferences and
* returns the corresponding number. It returns the number to the successCB callback with a
* properties object as a parameter. If there is an error parsing the number string, then
* the errorCB callback is invoked.
*
* The defaults are: type="decimal"
*
* @param {String} numberString
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            type {String}: 'decimal', "percent", or 'currency'
*
* @return Object.value {Number}: The parsed number.
*
* @error GlobalizationError.PARSING_ERROR
*
* Example
*    globalization.stringToNumber('1234.56',
*                function (number) {alert('Number:' + number.value + '\n');},
*                function () { alert('Error parsing number');});
*/
stringToNumber:function(numberString, successCB, failureCB, options) {
    argscheck.checkArgs('sfFO', 'Globalization.stringToNumber', arguments);
    exec(successCB, failureCB, "Globalization", "stringToNumber", [{"numberString": numberString, "options": options}]);
},

/**
* Returns a pattern string for formatting and parsing numbers according to the client's user
* preferences. It returns the pattern to the successCB callback with a properties object as a
* parameter. If there is an error obtaining the pattern, then the errorCB callback is invoked.
*
* The defaults are: type="decimal"
*
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            type {String}: 'decimal', "percent", or 'currency'
*
* @return    Object.pattern {String}: The number pattern for formatting and parsing numbers.
*                                    The patterns follow Unicode Technical Standard #35.
*                                    http://unicode.org/reports/tr35/tr35-4.html
*            Object.symbol {String}: The symbol to be used when formatting and parsing
*                                    e.g., percent or currency symbol.
*            Object.fraction {Number}: The number of fractional digits to use when parsing and
*                                    formatting numbers.
*            Object.rounding {Number}: The rounding increment to use when parsing and formatting.
*            Object.positive {String}: The symbol to use for positive numbers when parsing and formatting.
*            Object.negative: {String}: The symbol to use for negative numbers when parsing and formatting.
*            Object.decimal: {String}: The decimal symbol to use for parsing and formatting.
*            Object.grouping: {String}: The grouping symbol to use for parsing and formatting.
*
* @error GlobalizationError.PATTERN_ERROR
*
* Example
*    globalization.getNumberPattern(
*                function (pattern) {alert('Pattern:' + pattern.pattern + '\n');},
*                function () {});
*/
getNumberPattern:function(successCB, failureCB, options) {
    argscheck.checkArgs('fFO', 'Globalization.getNumberPattern', arguments);
    exec(successCB, failureCB, "Globalization", "getNumberPattern", [{"options": options}]);
},

/**
* Returns a pattern string for formatting and parsing currency values according to the client's
* user preferences and ISO 4217 currency code. It returns the pattern to the successCB callback with a
* properties object as a parameter. If there is an error obtaining the pattern, then the errorCB
* callback is invoked.
*
* @param {String} currencyCode
* @param {Function} successCB
* @param {Function} errorCB
*
* @return    Object.pattern {String}: The currency pattern for formatting and parsing currency values.
*                                    The patterns follow Unicode Technical Standard #35
*                                    http://unicode.org/reports/tr35/tr35-4.html
*            Object.code {String}: The ISO 4217 currency code for the pattern.
*            Object.fraction {Number}: The number of fractional digits to use when parsing and
*                                    formatting currency.
*            Object.rounding {Number}: The rounding increment to use when parsing and formatting.
*            Object.decimal: {String}: The decimal symbol to use for parsing and formatting.
*            Object.grouping: {String}: The grouping symbol to use for parsing and formatting.
*
* @error GlobalizationError.FORMATTING_ERROR
*
* Example
*    globalization.getCurrencyPattern('EUR',
*                function (currency) {alert('Pattern:' + currency.pattern + '\n');}
*                function () {});
*/
getCurrencyPattern:function(currencyCode, successCB, failureCB) {
    argscheck.checkArgs('sfF', 'Globalization.getCurrencyPattern', arguments);
    exec(successCB, failureCB, "Globalization", "getCurrencyPattern", [{"currencyCode": currencyCode}]);
}

};

module.exports = globalization;

});

// file: lib/common/plugin/globalization/symbols.js
define("cordova/plugin/globalization/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/globalization', 'navigator.globalization');
modulemapper.clobbers('cordova/plugin/GlobalizationError', 'GlobalizationError');

});

// file: lib/blackberry/plugin/java/Contact.js
define("cordova/plugin/java/Contact", function(require, exports, module) {

var ContactError = require('cordova/plugin/ContactError'),
    ContactUtils = require('cordova/plugin/java/ContactUtils'),
    utils = require('cordova/utils'),
    ContactAddress = require('cordova/plugin/ContactAddress'),
    exec = require('cordova/exec');

// ------------------
// Utility functions
// ------------------

/**
 * Retrieves a BlackBerry contact from the device by unique id.
 *
 * @param uid
 *            Unique id of the contact on the device
 * @return {blackberry.pim.Contact} BlackBerry contact or null if contact with
 *         specified id is not found
 */
var findByUniqueId = function(uid) {
    if (!uid) {
        return null;
    }
    var bbContacts = blackberry.pim.Contact.find(new blackberry.find.FilterExpression("uid", "==", uid));
    return bbContacts[0] || null;
};

/**
 * Creates a BlackBerry contact object from the W3C Contact object and persists
 * it to device storage.
 *
 * @param {Contact}
 *            contact The contact to save
 * @return a new contact object with all properties set
 */
var saveToDevice = function(contact) {

    if (!contact) {
        return;
    }

    var bbContact = null;
    var update = false;

    // if the underlying BlackBerry contact already exists, retrieve it for
    // update
    if (contact.id) {
        // we must attempt to retrieve the BlackBerry contact from the device
        // because this may be an update operation
        bbContact = findByUniqueId(contact.id);
    }

    // contact not found on device, create a new one
    if (!bbContact) {
        bbContact = new blackberry.pim.Contact();
    }
    // update the existing contact
    else {
        update = true;
    }

    // NOTE: The user may be working with a partial Contact object, because only
    // user-specified Contact fields are returned from a find operation (blame
    // the W3C spec). If this is an update to an existing Contact, we don't
    // want to clear an attribute from the contact database simply because the
    // Contact object that the user passed in contains a null value for that
    // attribute. So we only copy the non-null Contact attributes to the
    // BlackBerry contact object before saving.
    //
    // This means that a user must explicitly set a Contact attribute to a
    // non-null value in order to update it in the contact database.
    //
    // name
    if (contact.name !== null) {
        if (contact.name.givenName) {
            bbContact.firstName = contact.name.givenName;
        }
        if (contact.name.familyName) {
            bbContact.lastName = contact.name.familyName;
        }
        if (contact.name.honorificPrefix) {
            bbContact.title = contact.name.honorificPrefix;
        }
    }

    // display name
    if (contact.displayName !== null) {
        bbContact.user1 = contact.displayName;
    }

    // note
    if (contact.note !== null) {
        bbContact.note = contact.note;
    }

    // birthday
    //
    // user may pass in Date object or a string representation of a date
    // if it is a string, we don't know the date format, so try to create a
    // new Date with what we're given
    //
    // NOTE: BlackBerry's Date.parse() does not work well, so use new Date()
    //
    if (contact.birthday !== null) {
        if (utils.isDate(contact.birthday)) {
            bbContact.birthday = contact.birthday;
        } else {
            var bday = contact.birthday.toString();
            bbContact.birthday = (bday.length > 0) ? new Date(bday) : "";
        }
    }

    // BlackBerry supports three email addresses
    if (contact.emails && utils.isArray(contact.emails)) {

        // if this is an update, re-initialize email addresses
        if (update) {
            bbContact.email1 = "";
            bbContact.email2 = "";
            bbContact.email3 = "";
        }

        // copy the first three email addresses found
        var email = null;
        for ( var i = 0; i < contact.emails.length; i += 1) {
            email = contact.emails[i];
            if (!email || !email.value) {
                continue;
            }
            if (bbContact.email1 === "") {
                bbContact.email1 = email.value;
            } else if (bbContact.email2 === "") {
                bbContact.email2 = email.value;
            } else if (bbContact.email3 === "") {
                bbContact.email3 = email.value;
            }
        }
    }

    // BlackBerry supports a finite number of phone numbers
    // copy into appropriate fields based on type
    if (contact.phoneNumbers && utils.isArray(contact.phoneNumbers)) {

        // if this is an update, re-initialize phone numbers
        if (update) {
            bbContact.homePhone = "";
            bbContact.homePhone2 = "";
            bbContact.workPhone = "";
            bbContact.workPhone2 = "";
            bbContact.mobilePhone = "";
            bbContact.faxPhone = "";
            bbContact.pagerPhone = "";
            bbContact.otherPhone = "";
        }

        var type = null;
        var number = null;
        for ( var j = 0; j < contact.phoneNumbers.length; j += 1) {
            if (!contact.phoneNumbers[j] || !contact.phoneNumbers[j].value) {
                continue;
            }
            type = contact.phoneNumbers[j].type;
            number = contact.phoneNumbers[j].value;
            if (type === 'home') {
                if (bbContact.homePhone === "") {
                    bbContact.homePhone = number;
                } else if (bbContact.homePhone2 === "") {
                    bbContact.homePhone2 = number;
                }
            } else if (type === 'work') {
                if (bbContact.workPhone === "") {
                    bbContact.workPhone = number;
                } else if (bbContact.workPhone2 === "") {
                    bbContact.workPhone2 = number;
                }
            } else if (type === 'mobile' && bbContact.mobilePhone === "") {
                bbContact.mobilePhone = number;
            } else if (type === 'fax' && bbContact.faxPhone === "") {
                bbContact.faxPhone = number;
            } else if (type === 'pager' && bbContact.pagerPhone === "") {
                bbContact.pagerPhone = number;
            } else if (bbContact.otherPhone === "") {
                bbContact.otherPhone = number;
            }
        }
    }

    // BlackBerry supports two addresses: home and work
    // copy the first two addresses found from Contact
    if (contact.addresses && utils.isArray(contact.addresses)) {

        // if this is an update, re-initialize addresses
        if (update) {
            bbContact.homeAddress = null;
            bbContact.workAddress = null;
        }

        var address = null;
        var bbHomeAddress = null;
        var bbWorkAddress = null;
        for ( var k = 0; k < contact.addresses.length; k += 1) {
            address = contact.addresses[k];
            if (!address || address.id === undefined || address.pref === undefined || address.type === undefined || address.formatted === undefined) {
                continue;
            }

            if (bbHomeAddress === null && (!address.type || address.type === "home")) {
                bbHomeAddress = createBlackBerryAddress(address);
                bbContact.homeAddress = bbHomeAddress;
            } else if (bbWorkAddress === null && (!address.type || address.type === "work")) {
                bbWorkAddress = createBlackBerryAddress(address);
                bbContact.workAddress = bbWorkAddress;
            }
        }
    }

    // copy first url found to BlackBerry 'webpage' field
    if (contact.urls && utils.isArray(contact.urls)) {

        // if this is an update, re-initialize web page
        if (update) {
            bbContact.webpage = "";
        }

        var url = null;
        for ( var m = 0; m < contact.urls.length; m += 1) {
            url = contact.urls[m];
            if (!url || !url.value) {
                continue;
            }
            if (bbContact.webpage === "") {
                bbContact.webpage = url.value;
                break;
            }
        }
    }

    // copy fields from first organization to the
    // BlackBerry 'company' and 'jobTitle' fields
    if (contact.organizations && utils.isArray(contact.organizations)) {

        // if this is an update, re-initialize org attributes
        if (update) {
            bbContact.company = "";
        }

        var org = null;
        for ( var n = 0; n < contact.organizations.length; n += 1) {
            org = contact.organizations[n];
            if (!org) {
                continue;
            }
            if (bbContact.company === "") {
                bbContact.company = org.name || "";
                bbContact.jobTitle = org.title || "";
                break;
            }
        }
    }

    // categories
    if (contact.categories && utils.isArray(contact.categories)) {
        bbContact.categories = [];
        var category = null;
        for ( var o = 0; o < contact.categories.length; o += 1) {
            category = contact.categories[o];
            if (typeof category == "string") {
                bbContact.categories.push(category);
            }
        }
    }

    // save to device
    bbContact.save();

    // invoke native side to save photo
    // fail gracefully if photo URL is no good, but log the error
    if (contact.photos && utils.isArray(contact.photos)) {
        var photo = null;
        for ( var p = 0; p < contact.photos.length; p += 1) {
            photo = contact.photos[p];
            if (!photo || !photo.value) {
                continue;
            }
            exec(
            // success
            function() {
            },
            // fail
            function(e) {
                console.log('Contact.setPicture failed:' + e);
            }, "Contacts", "setPicture", [ bbContact.uid, photo.type,
                    photo.value ]);
            break;
        }
    }

    // Use the fully populated BlackBerry contact object to create a
    // corresponding W3C contact object.
    return ContactUtils.createContact(bbContact, [ "*" ]);
};

/**
 * Creates a BlackBerry Address object from a W3C ContactAddress.
 *
 * @return {blackberry.pim.Address} a BlackBerry address object
 */
var createBlackBerryAddress = function(address) {
    var bbAddress = new blackberry.pim.Address();

    if (!address) {
        return bbAddress;
    }

    bbAddress.address1 = address.streetAddress || "";
    bbAddress.city = address.locality || "";
    bbAddress.stateProvince = address.region || "";
    bbAddress.zipPostal = address.postalCode || "";
    bbAddress.country = address.country || "";

    return bbAddress;
};

module.exports = {
    /**
     * Persists contact to device storage.
     */
    save : function(success, fail) {
        try {
            // save the contact and store it's unique id
            var fullContact = saveToDevice(this);
            this.id = fullContact.id;

            // This contact object may only have a subset of properties
            // if the save was an update of an existing contact. This is
            // because the existing contact was likely retrieved using a
            // subset of properties, so only those properties were set in the
            // object. For this reason, invoke success with the contact object
            // returned by saveToDevice since it is fully populated.
            if (typeof success === 'function') {
                success(fullContact);
            }
        } catch (e) {
            console.log('Error saving contact: ' + e);
            if (typeof fail === 'function') {
                fail(new ContactError(ContactError.UNKNOWN_ERROR));
            }
        }
    },

    /**
     * Removes contact from device storage.
     *
     * @param success
     *            success callback
     * @param fail
     *            error callback
     */
    remove : function(success, fail) {
        try {
            // retrieve contact from device by id
            var bbContact = null;
            if (this.id) {
                bbContact = findByUniqueId(this.id);
            }

            // if contact was found, remove it
            if (bbContact) {
                console.log('removing contact: ' + bbContact.uid);
                bbContact.remove();
                if (typeof success === 'function') {
                    success(this);
                }
            }
            // attempting to remove a contact that hasn't been saved
            else if (typeof fail === 'function') {
                fail(new ContactError(ContactError.UNKNOWN_ERROR));
            }
        } catch (e) {
            console.log('Error removing contact ' + this.id + ": " + e);
            if (typeof fail === 'function') {
                fail(new ContactError(ContactError.UNKNOWN_ERROR));
            }
        }
    }
};

});

// file: lib/blackberry/plugin/java/ContactUtils.js
define("cordova/plugin/java/ContactUtils", function(require, exports, module) {

var ContactAddress = require('cordova/plugin/ContactAddress'),
    ContactName = require('cordova/plugin/ContactName'),
    ContactField = require('cordova/plugin/ContactField'),
    ContactOrganization = require('cordova/plugin/ContactOrganization'),
    utils = require('cordova/utils'),
    Contact = require('cordova/plugin/Contact');

/**
 * Mappings for each Contact field that may be used in a find operation. Maps
 * W3C Contact fields to one or more fields in a BlackBerry contact object.
 *
 * Example: user searches with a filter on the Contact 'name' field:
 *
 * <code>Contacts.find(['name'], onSuccess, onFail, {filter:'Bob'});</code>
 *
 * The 'name' field does not exist in a BlackBerry contact. Instead, a filter
 * expression will be built to search the BlackBerry contacts using the
 * BlackBerry 'title', 'firstName' and 'lastName' fields.
 */
var fieldMappings = {
    "id" : "uid",
    "displayName" : "user1",
    "name" : [ "title", "firstName", "lastName" ],
    "name.formatted" : [ "title", "firstName", "lastName" ],
    "name.givenName" : "firstName",
    "name.familyName" : "lastName",
    "name.honorificPrefix" : "title",
    "phoneNumbers" : [ "faxPhone", "homePhone", "homePhone2", "mobilePhone",
            "pagerPhone", "otherPhone", "workPhone", "workPhone2" ],
    "phoneNumbers.value" : [ "faxPhone", "homePhone", "homePhone2",
            "mobilePhone", "pagerPhone", "otherPhone", "workPhone",
            "workPhone2" ],
    "emails" : [ "email1", "email2", "email3" ],
    "addresses" : [ "homeAddress.address1", "homeAddress.address2",
            "homeAddress.city", "homeAddress.stateProvince",
            "homeAddress.zipPostal", "homeAddress.country",
            "workAddress.address1", "workAddress.address2", "workAddress.city",
            "workAddress.stateProvince", "workAddress.zipPostal",
            "workAddress.country" ],
    "addresses.formatted" : [ "homeAddress.address1", "homeAddress.address2",
            "homeAddress.city", "homeAddress.stateProvince",
            "homeAddress.zipPostal", "homeAddress.country",
            "workAddress.address1", "workAddress.address2", "workAddress.city",
            "workAddress.stateProvince", "workAddress.zipPostal",
            "workAddress.country" ],
    "addresses.streetAddress" : [ "homeAddress.address1",
            "homeAddress.address2", "workAddress.address1",
            "workAddress.address2" ],
    "addresses.locality" : [ "homeAddress.city", "workAddress.city" ],
    "addresses.region" : [ "homeAddress.stateProvince",
            "workAddress.stateProvince" ],
    "addresses.country" : [ "homeAddress.country", "workAddress.country" ],
    "organizations" : [ "company", "jobTitle" ],
    "organizations.name" : "company",
    "organizations.title" : "jobTitle",
    "birthday" : "birthday",
    "note" : "note",
    "categories" : "categories",
    "urls" : "webpage",
    "urls.value" : "webpage"
};

/*
 * Build an array of all of the valid W3C Contact fields. This is used to
 * substitute all the fields when ["*"] is specified.
 */
var allFields = [];
for ( var key in fieldMappings) {
    if (fieldMappings.hasOwnProperty(key)) {
        allFields.push(key);
    }
}

/**
 * Create a W3C ContactAddress object from a BlackBerry Address object.
 *
 * @param {String}
 *            type the type of address (e.g. work, home)
 * @param {blackberry.pim.Address}
 *            bbAddress a BlackBerry Address object
 * @return {ContactAddress} a contact address object or null if the specified
 *         address is null
 */
var createContactAddress = function(type, bbAddress) {

    if (!bbAddress) {
        return null;
    }

    var address1 = bbAddress.address1 || "";
    var address2 = bbAddress.address2 || "";
    var streetAddress = address1 + ", " + address2;
    var locality = bbAddress.city || "";
    var region = bbAddress.stateProvince || "";
    var postalCode = bbAddress.zipPostal || "";
    var country = bbAddress.country || "";
    var formatted = streetAddress + ", " + locality + ", " + region + ", " + postalCode + ", " + country;

    return new ContactAddress(null, type, formatted, streetAddress, locality,
            region, postalCode, country);
};

module.exports = {
    /**
     * Builds a BlackBerry filter expression for contact search using the
     * contact fields and search filter provided.
     *
     * @param {String[]}
     *            fields Array of Contact fields to search
     * @param {String}
     *            filter Filter, or search string
     * @return filter expression or null if fields is empty or filter is null or
     *         empty
     */
    buildFilterExpression : function(fields, filter) {

        // ensure filter exists
        if (!filter || filter === "") {
            return null;
        }

        if (fields.length == 1 && fields[0] === "*") {
            // Cordova enhancement to allow fields value of ["*"] to indicate
            // all supported fields.
            fields = allFields;
        }

        // BlackBerry API uses specific operators to build filter expressions
        // for
        // querying Contact lists. The operators are
        // ["!=","==","<",">","<=",">="].
        // Use of regex is also an option, and the only one we can use to
        // simulate
        // an SQL '%LIKE%' clause.
        //
        // Note: The BlackBerry regex implementation doesn't seem to support
        // conventional regex switches that would enable a case insensitive
        // search.
        // It does not honor the (?i) switch (which causes Contact.find() to
        // fail).
        // We need case INsensitivity to match the W3C Contacts API spec.
        // So the guys at RIM proposed this method:
        //
        // original filter = "norm"
        // case insensitive filter = "[nN][oO][rR][mM]"
        //
        var ciFilter = "";
        for ( var i = 0; i < filter.length; i++) {
            ciFilter = ciFilter + "[" + filter[i].toLowerCase() + filter[i].toUpperCase() + "]";
        }

        // match anything that contains our filter string
        filter = ".*" + ciFilter + ".*";

        // build a filter expression using all Contact fields provided
        var filterExpression = null;
        if (fields && utils.isArray(fields)) {
            var fe = null;
            for (var f = 0; f < fields.length; f++) {
                if (!fields[f]) {
                    continue;
                }

                // retrieve the BlackBerry contact fields that map to the one
                // specified
                var bbFields = fieldMappings[fields[f]];

                // BlackBerry doesn't support the field specified
                if (!bbFields) {
                    continue;
                }

                if (!utils.isArray(bbFields)) {
                    bbFields = [bbFields];
                }

                // construct the filter expression using the BlackBerry fields
                for (var j = 0; j < bbFields.length; j++) {
                    fe = new blackberry.find.FilterExpression(bbFields[j],
                            "REGEX", filter);
                    if (filterExpression === null) {
                        filterExpression = fe;
                    } else {
                        // combine the filters
                        filterExpression = new blackberry.find.FilterExpression(
                                filterExpression, "OR", fe);
                    }
                }
            }
        }

        return filterExpression;
    },

    /**
     * Creates a Contact object from a BlackBerry Contact object, copying only
     * the fields specified.
     *
     * This is intended as a privately used function but it is made globally
     * available so that a Contact.save can convert a BlackBerry contact object
     * into its W3C equivalent.
     *
     * @param {blackberry.pim.Contact}
     *            bbContact BlackBerry Contact object
     * @param {String[]}
     *            fields array of contact fields that should be copied
     * @return {Contact} a contact object containing the specified fields or
     *         null if the specified contact is null
     */
    createContact : function(bbContact, fields) {

        if (!bbContact) {
            return null;
        }

        // construct a new contact object
        // always copy the contact id and displayName fields
        var contact = new Contact(bbContact.uid, bbContact.user1);

        // nothing to do
        if (!fields || !(utils.isArray(fields)) || fields.length === 0) {
            return contact;
        } else if (fields.length == 1 && fields[0] === "*") {
            // Cordova enhancement to allow fields value of ["*"] to indicate
            // all supported fields.
            fields = allFields;
        }

        // add the fields specified
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];

            if (!field) {
                continue;
            }

            // name
            if (field.indexOf('name') === 0) {
                var formattedName = bbContact.title + ' ' + bbContact.firstName + ' ' + bbContact.lastName;
                contact.name = new ContactName(formattedName,
                        bbContact.lastName, bbContact.firstName, null,
                        bbContact.title, null);
            }
            // phone numbers
            else if (field.indexOf('phoneNumbers') === 0) {
                var phoneNumbers = [];
                if (bbContact.homePhone) {
                    phoneNumbers.push(new ContactField('home',
                            bbContact.homePhone));
                }
                if (bbContact.homePhone2) {
                    phoneNumbers.push(new ContactField('home',
                            bbContact.homePhone2));
                }
                if (bbContact.workPhone) {
                    phoneNumbers.push(new ContactField('work',
                            bbContact.workPhone));
                }
                if (bbContact.workPhone2) {
                    phoneNumbers.push(new ContactField('work',
                            bbContact.workPhone2));
                }
                if (bbContact.mobilePhone) {
                    phoneNumbers.push(new ContactField('mobile',
                            bbContact.mobilePhone));
                }
                if (bbContact.faxPhone) {
                    phoneNumbers.push(new ContactField('fax',
                            bbContact.faxPhone));
                }
                if (bbContact.pagerPhone) {
                    phoneNumbers.push(new ContactField('pager',
                            bbContact.pagerPhone));
                }
                if (bbContact.otherPhone) {
                    phoneNumbers.push(new ContactField('other',
                            bbContact.otherPhone));
                }
                contact.phoneNumbers = phoneNumbers.length > 0 ? phoneNumbers
                        : null;
            }
            // emails
            else if (field.indexOf('emails') === 0) {
                var emails = [];
                if (bbContact.email1) {
                    emails.push(new ContactField(null, bbContact.email1, null));
                }
                if (bbContact.email2) {
                    emails.push(new ContactField(null, bbContact.email2, null));
                }
                if (bbContact.email3) {
                    emails.push(new ContactField(null, bbContact.email3, null));
                }
                contact.emails = emails.length > 0 ? emails : null;
            }
            // addresses
            else if (field.indexOf('addresses') === 0) {
                var addresses = [];
                if (bbContact.homeAddress) {
                    addresses.push(createContactAddress("home",
                            bbContact.homeAddress));
                }
                if (bbContact.workAddress) {
                    addresses.push(createContactAddress("work",
                            bbContact.workAddress));
                }
                contact.addresses = addresses.length > 0 ? addresses : null;
            }
            // birthday
            else if (field.indexOf('birthday') === 0) {
                if (bbContact.birthday) {
                    contact.birthday = bbContact.birthday;
                }
            }
            // note
            else if (field.indexOf('note') === 0) {
                if (bbContact.note) {
                    contact.note = bbContact.note;
                }
            }
            // organizations
            else if (field.indexOf('organizations') === 0) {
                var organizations = [];
                if (bbContact.company || bbContact.jobTitle) {
                    organizations.push(new ContactOrganization(null, null,
                            bbContact.company, null, bbContact.jobTitle));
                }
                contact.organizations = organizations.length > 0 ? organizations
                        : null;
            }
            // categories
            else if (field.indexOf('categories') === 0) {
                if (bbContact.categories && bbContact.categories.length > 0) {
                    contact.categories = bbContact.categories;
                } else {
                    contact.categories = null;
                }
            }
            // urls
            else if (field.indexOf('urls') === 0) {
                var urls = [];
                if (bbContact.webpage) {
                    urls.push(new ContactField(null, bbContact.webpage));
                }
                contact.urls = urls.length > 0 ? urls : null;
            }
            // photos
            else if (field.indexOf('photos') === 0) {
                var photos = [];
                // The BlackBerry Contact object will have a picture attribute
                // with Base64 encoded image
                if (bbContact.picture) {
                    photos.push(new ContactField('base64', bbContact.picture));
                }
                contact.photos = photos.length > 0 ? photos : null;
            }
        }

        return contact;
    }
};

});

// file: lib/blackberry/plugin/java/DirectoryEntry.js
define("cordova/plugin/java/DirectoryEntry", function(require, exports, module) {

var DirectoryEntry = require('cordova/plugin/DirectoryEntry'),
    FileEntry = require('cordova/plugin/FileEntry'),
    FileError = require('cordova/plugin/FileError'),
    exec = require('cordova/exec');

module.exports = {
    /**
     * Creates or looks up a directory; override for BlackBerry.
     *
     * @param path
     *            {DOMString} either a relative or absolute path from this
     *            directory in which to look up or create a directory
     * @param options
     *            {Flags} options to create or exclusively create the directory
     * @param successCallback
     *            {Function} called with the new DirectoryEntry
     * @param errorCallback
     *            {Function} called with a FileError
     */
    getDirectory : function(path, options, successCallback, errorCallback) {
        // create directory if it doesn't exist
        var create = (options && options.create === true) ? true : false,
        // if true, causes failure if create is true and path already exists
        exclusive = (options && options.exclusive === true) ? true : false,
        // directory exists
        exists,
        // create a new DirectoryEntry object and invoke success callback
        createEntry = function() {
            var path_parts = path.split('/'),
                name = path_parts[path_parts.length - 1],
                dirEntry = new DirectoryEntry(name, path);

            // invoke success callback
            if (typeof successCallback === 'function') {
                successCallback(dirEntry);
            }
        };

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // determine if path is relative or absolute
        if (!path) {
            fail(FileError.ENCODING_ERR);
            return;
        } else if (path.indexOf(this.fullPath) !== 0) {
            // path does not begin with the fullPath of this directory
            // therefore, it is relative
            path = this.fullPath + '/' + path;
        }

        // determine if directory exists
        try {
            // will return true if path exists AND is a directory
            exists = blackberry.io.dir.exists(path);
        } catch (e) {
            // invalid path
            fail(FileError.ENCODING_ERR);
            return;
        }

        // path is a directory
        if (exists) {
            if (create && exclusive) {
                // can't guarantee exclusivity
                fail(FileError.PATH_EXISTS_ERR);
            } else {
                // create entry for existing directory
                createEntry();
            }
        }
        // will return true if path exists AND is a file
        else if (blackberry.io.file.exists(path)) {
            // the path is a file
            fail(FileError.TYPE_MISMATCH_ERR);
        }
        // path does not exist, create it
        else if (create) {
            try {
                // directory path must have trailing slash
                var dirPath = path;
                if (dirPath.substr(-1) !== '/') {
                    dirPath += '/';
                }
                blackberry.io.dir.createNewDir(dirPath);
                createEntry();
            } catch (eone) {
                // unable to create directory
                fail(FileError.NOT_FOUND_ERR);
            }
        }
        // path does not exist, don't create
        else {
            // directory doesn't exist
            fail(FileError.NOT_FOUND_ERR);
        }
    },
    /**
     * Create or look up a file.
     *
     * @param path {DOMString}
     *            either a relative or absolute path from this directory in
     *            which to look up or create a file
     * @param options {Flags}
     *            options to create or exclusively create the file
     * @param successCallback {Function}
     *            called with the new FileEntry object
     * @param errorCallback {Function}
     *            called with a FileError object if error occurs
     */
    getFile:function(path, options, successCallback, errorCallback) {
        // create file if it doesn't exist
        var create = (options && options.create === true) ? true : false,
            // if true, causes failure if create is true and path already exists
            exclusive = (options && options.exclusive === true) ? true : false,
            // file exists
            exists,
            // create a new FileEntry object and invoke success callback
            createEntry = function() {
                var path_parts = path.split('/'),
                    name = path_parts[path_parts.length - 1],
                    fileEntry = new FileEntry(name, path);

                // invoke success callback
                if (typeof successCallback === 'function') {
                    successCallback(fileEntry);
                }
            };

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // determine if path is relative or absolute
        if (!path) {
            fail(FileError.ENCODING_ERR);
            return;
        }
        else if (path.indexOf(this.fullPath) !== 0) {
            // path does not begin with the fullPath of this directory
            // therefore, it is relative
            path = this.fullPath + '/' + path;
        }

        // determine if file exists
        try {
            // will return true if path exists AND is a file
            exists = blackberry.io.file.exists(path);
        }
        catch (e) {
            // invalid path
            fail(FileError.ENCODING_ERR);
            return;
        }

        // path is a file
        if (exists) {
            if (create && exclusive) {
                // can't guarantee exclusivity
                fail(FileError.PATH_EXISTS_ERR);
            }
            else {
                // create entry for existing file
                createEntry();
            }
        }
        // will return true if path exists AND is a directory
        else if (blackberry.io.dir.exists(path)) {
            // the path is a directory
            fail(FileError.TYPE_MISMATCH_ERR);
        }
        // path does not exist, create it
        else if (create) {
            // create empty file
            exec(
                function(result) {
                    // file created
                    createEntry();
                },
                fail, "File", "write", [ path, "", 0 ]);
        }
        // path does not exist, don't create
        else {
            // file doesn't exist
            fail(FileError.NOT_FOUND_ERR);
        }
    },

    /**
     * Delete a directory and all of it's contents.
     *
     * @param successCallback {Function} called with no parameters
     * @param errorCallback {Function} called with a FileError
     */
    removeRecursively : function(successCallback, errorCallback) {
        // we're removing THIS directory
        var path = this.fullPath;

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // attempt to delete directory
        if (blackberry.io.dir.exists(path)) {
            // it is an error to attempt to remove the file system root
            if (exec(null, null, "File", "isFileSystemRoot", [ path ]) === true) {
                fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
            }
            else {
                try {
                    // delete the directory, setting recursive flag to true
                    blackberry.io.dir.deleteDirectory(path, true);
                    if (typeof successCallback === "function") {
                        successCallback();
                    }
                } catch (e) {
                    // permissions don't allow deletion
                    console.log(e);
                    fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
                }
            }
        }
        // it's a file, not a directory
        else if (blackberry.io.file.exists(path)) {
            fail(FileError.TYPE_MISMATCH_ERR);
        }
        // not found
        else {
            fail(FileError.NOT_FOUND_ERR);
        }
    }
};

});

// file: lib/blackberry/plugin/java/Entry.js
define("cordova/plugin/java/Entry", function(require, exports, module) {

var FileError = require('cordova/plugin/FileError'),
    LocalFileSystem = require('cordova/plugin/LocalFileSystem'),
    resolveLocalFileSystemURI = require('cordova/plugin/resolveLocalFileSystemURI'),
    requestFileSystem = require('cordova/plugin/requestFileSystem'),
    exec = require('cordova/exec');

module.exports = {
    remove : function(successCallback, errorCallback) {
        var path = this.fullPath,
            // directory contents
            contents = [];

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // file
        if (blackberry.io.file.exists(path)) {
            try {
                blackberry.io.file.deleteFile(path);
                if (typeof successCallback === "function") {
                    successCallback();
                }
            } catch (e) {
                // permissions don't allow
                fail(FileError.INVALID_MODIFICATION_ERR);
            }
        }
        // directory
        else if (blackberry.io.dir.exists(path)) {
            // it is an error to attempt to remove the file system root
            if (exec(null, null, "File", "isFileSystemRoot", [ path ]) === true) {
                fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
            } else {
                // check to see if directory is empty
                contents = blackberry.io.dir.listFiles(path);
                if (contents.length !== 0) {
                    fail(FileError.INVALID_MODIFICATION_ERR);
                } else {
                    try {
                        // delete
                        blackberry.io.dir.deleteDirectory(path, false);
                        if (typeof successCallback === "function") {
                            successCallback();
                        }
                    } catch (eone) {
                        // permissions don't allow
                        fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
                    }
                }
            }
        }
        // not found
        else {
            fail(FileError.NOT_FOUND_ERR);
        }
    },
    getParent : function(successCallback, errorCallback) {
        var that = this;

        try {
            // On BlackBerry, the TEMPORARY file system is actually a temporary
            // directory that is created on a per-application basis. This is
            // to help ensure that applications do not share the same temporary
            // space. So we check to see if this is the TEMPORARY file system
            // (directory). If it is, we must return this Entry, rather than
            // the Entry for its parent.
            requestFileSystem(LocalFileSystem.TEMPORARY, 0,
                    function(fileSystem) {
                        if (fileSystem.root.fullPath === that.fullPath) {
                            if (typeof successCallback === 'function') {
                                successCallback(fileSystem.root);
                            }
                        } else {
                            resolveLocalFileSystemURI(blackberry.io.dir
                                    .getParentDirectory(that.fullPath),
                                    successCallback, errorCallback);
                        }
                    }, errorCallback);
        } catch (e) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(FileError.NOT_FOUND_ERR));
            }
        }
    }
};

});

// file: lib/blackberry/plugin/java/MediaError.js
define("cordova/plugin/java/MediaError", function(require, exports, module) {


// The MediaError object exists on BB OS 6+ which prevents the Cordova version
// from being defined. This object is used to merge in differences between the BB
// MediaError object and the Cordova version.
module.exports = {
        MEDIA_ERR_NONE_ACTIVE : 0,
        MEDIA_ERR_NONE_SUPPORTED : 4
};

});

// file: lib/blackberry/plugin/java/app.js
define("cordova/plugin/java/app", function(require, exports, module) {

var exec = require('cordova/exec'),
    platform = require('cordova/platform'),
    manager = require('cordova/plugin/' + platform.runtime() + '/manager');

module.exports = {
  /**
   * Clear the resource cache.
   */
  clearCache:function() {
      if (typeof blackberry.widgetcache === "undefined" || blackberry.widgetcache === null) {
          console.log("blackberry.widgetcache permission not found. Cache clear request denied.");
          return;
      }
      blackberry.widgetcache.clearAll();
  },

  /**
   * Clear web history in this web view.
   * Instead of BACK button loading the previous web page, it will exit the app.
   */
  clearHistory:function() {
    exec(null, null, "App", "clearHistory", []);
  },

  /**
   * Go to previous page displayed.
   * This is the same as pressing the backbutton on Android device.
   */
  backHistory:function() {
    // window.history.back() behaves oddly on BlackBerry, so use
    // native implementation.
    exec(null, null, "App", "backHistory", []);
  },

  /**
   * Exit and terminate the application.
   */
  exitApp:function() {
      // Call onunload if it is defined since BlackBerry does not invoke
      // on application exit.
      if (typeof window.onunload === "function") {
          window.onunload();
      }

      // allow Cordova JavaScript Extension opportunity to cleanup
      manager.destroy();

      // exit the app
      blackberry.app.exit();
  }
};

});

// file: lib/blackberry/plugin/java/app/bbsymbols.js
define("cordova/plugin/java/app/bbsymbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/java/app', 'navigator.app');

});

// file: lib/blackberry/plugin/java/contacts.js
define("cordova/plugin/java/contacts", function(require, exports, module) {

var ContactError = require('cordova/plugin/ContactError'),
    utils = require('cordova/utils'),
    ContactUtils = require('cordova/plugin/java/ContactUtils');

module.exports = {
    /**
     * Returns an array of Contacts matching the search criteria.
     *
     * @return array of Contacts matching search criteria
     */
    find : function(fields, success, fail, options) {
        // Success callback is required. Throw exception if not specified.
        if (typeof success !== 'function') {
            throw new TypeError(
                    "You must specify a success callback for the find command.");
        }

        // Search qualifier is required and cannot be empty.
        if (!fields || !(utils.isArray(fields)) || fields.length === 0) {
            if (typeof fail == 'function') {
                fail(new ContactError(ContactError.INVALID_ARGUMENT_ERROR));
            }
            return;
        }

        // default is to return a single contact match
        var numContacts = 1;

        // search options
        var filter = null;
        if (options) {
            // return multiple objects?
            if (options.multiple === true) {
                // -1 on BlackBerry will return all contact matches.
                numContacts = -1;
            }
            filter = options.filter;
        }

        // build the filter expression to use in find operation
        var filterExpression = ContactUtils.buildFilterExpression(fields, filter);

        // find matching contacts
        // Note: the filter expression can be null here, in which case, the find
        // won't filter
        var bbContacts = blackberry.pim.Contact.find(filterExpression, null, numContacts);

        // convert to Contact from blackberry.pim.Contact
        var contacts = [];
        for (var i = 0; i < bbContacts.length; i++) {
            if (bbContacts[i]) {
                // W3C Contacts API specification states that only the fields
                // in the search filter should be returned, so we create
                // a new Contact object, copying only the fields specified
                contacts.push(ContactUtils.createContact(bbContacts[i], fields));
            }
        }

        // return results
        success(contacts);
    }

};

});

// file: lib/blackberry/plugin/java/contacts/bbsymbols.js
define("cordova/plugin/java/contacts/bbsymbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.merges('cordova/plugin/java/contacts', 'navigator.contacts');
modulemapper.merges('cordova/plugin/java/Contact', 'Contact');

});

// file: lib/blackberry/plugin/java/file/bbsymbols.js
define("cordova/plugin/java/file/bbsymbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/File', 'File');
modulemapper.merges('cordova/plugin/java/DirectoryEntry', 'DirectoryEntry');
modulemapper.merges('cordova/plugin/java/Entry', 'Entry');


});

// file: lib/blackberry/plugin/java/manager.js
define("cordova/plugin/java/manager", function(require, exports, module) {

var cordova = require('cordova');

function _exec(win, fail, clazz, action, args) {
    var callbackId = clazz + cordova.callbackId++,
        origResult,
        evalResult,
        execResult;

    try {
        if (win || fail) {
            cordova.callbacks[callbackId] = {success: win, fail: fail};
        }

        // Note: Device returns string, but for some reason emulator returns object - so convert to string.
        origResult = "" + org.apache.cordova.JavaPluginManager.exec(clazz, action, callbackId, JSON.stringify(args), true);

        // If a result was returned
        if (origResult.length > 0) {
            evalResult = JSON.parse(origResult);

            // If status is OK, then return evalResult value back to caller
            if (evalResult.status === cordova.callbackStatus.OK) {

                // If there is a success callback, then call it now with returned evalResult value
                if (win) {
                    // Clear callback if not expecting any more results
                    if (!evalResult.keepCallback) {
                        delete cordova.callbacks[callbackId];
                    }
                }
            } else if (evalResult.status === cordova.callbackStatus.NO_RESULT) {

                // Clear callback if not expecting any more results
                if (!evalResult.keepCallback) {
                    delete cordova.callbacks[callbackId];
                }
            } else {
                // If there is a fail callback, then call it now with returned evalResult value
                if (fail) {

                    // Clear callback if not expecting any more results
                    if (!evalResult.keepCallback) {
                        delete cordova.callbacks[callbackId];
                    }
                }
            }
            execResult = evalResult;
        } else {
            // Asynchronous calls return an empty string. Return a NO_RESULT
            // status for those executions.
            execResult = {"status" : cordova.callbackStatus.NO_RESULT,
                    "message" : ""};
        }
    } catch (e) {
        console.log("BlackBerryPluginManager Error: " + e);
        execResult = {"status" : cordova.callbackStatus.ERROR,
                      "message" : e.message};
    }

    return execResult;
}

module.exports = {
    exec: function (win, fail, clazz, action, args) {
        return _exec(win, fail, clazz, action, args);
    },
    resume: org.apache.cordova.JavaPluginManager.resume,
    pause: org.apache.cordova.JavaPluginManager.pause,
    destroy: org.apache.cordova.JavaPluginManager.destroy
};

});

// file: lib/blackberry/plugin/java/media/bbsymbols.js
define("cordova/plugin/java/media/bbsymbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.defaults('cordova/plugin/Media', 'Media');
modulemapper.defaults('cordova/plugin/MediaError', 'MediaError');
// Exists natively on BB OS 6+, merge in Cordova specifics
modulemapper.merges('cordova/plugin/java/MediaError', 'MediaError');

});

// file: lib/blackberry/plugin/java/notification.js
define("cordova/plugin/java/notification", function(require, exports, module) {

var exec = require('cordova/exec');

/**
 * Provides BlackBerry enhanced notification API.
 */
module.exports = {
    activityStart : function(title, message) {
        // If title and message not specified then mimic Android behavior of
        // using default strings.
        if (typeof title === "undefined" && typeof message == "undefined") {
            title = "Busy";
            message = 'Please wait...';
        }

        exec(null, null, 'Notification', 'activityStart', [ title, message ]);
    },

    /**
     * Close an activity dialog
     */
    activityStop : function() {
        exec(null, null, 'Notification', 'activityStop', []);
    },

    /**
     * Display a progress dialog with progress bar that goes from 0 to 100.
     *
     * @param {String}
     *            title Title of the progress dialog.
     * @param {String}
     *            message Message to display in the dialog.
     */
    progressStart : function(title, message) {
        exec(null, null, 'Notification', 'progressStart', [ title, message ]);
    },

    /**
     * Close the progress dialog.
     */
    progressStop : function() {
        exec(null, null, 'Notification', 'progressStop', []);
    },

    /**
     * Set the progress dialog value.
     *
     * @param {Number}
     *            value 0-100
     */
    progressValue : function(value) {
        exec(null, null, 'Notification', 'progressValue', [ value ]);
    }
};

});

// file: lib/blackberry/plugin/java/notification/bbsymbols.js
define("cordova/plugin/java/notification/bbsymbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.merges('cordova/plugin/java/notification', 'navigator.notification');

});

// file: lib/blackberry/plugin/java/platform.js
define("cordova/plugin/java/platform", function(require, exports, module) {

module.exports = {
    id: "blackberry",
    initialize:function() {
        var cordova = require('cordova'),
            exec = require('cordova/exec'),
            channel = require('cordova/channel'),
            platform = require('cordova/platform'),
            manager = require('cordova/plugin/' + platform.runtime() + '/manager'),
            app = require('cordova/plugin/java/app');

        // BB OS 5 does not define window.console.
        if (typeof window.console === 'undefined') {
            window.console = {};
        }

        // Override console.log with native logging ability.
        // BB OS 7 devices define console.log for use with web inspector
        // debugging. If console.log is already defined, invoke it in addition
        // to native logging.
        var origLog = window.console.log;
        window.console.log = function(msg) {
            if (typeof origLog === 'function') {
                origLog.call(window.console, msg);
            }
            org.apache.cordova.Logger.log(''+msg);
        };

        // Mapping of button events to BlackBerry key identifier.
        var buttonMapping = {
            'backbutton'         : blackberry.system.event.KEY_BACK,
            'conveniencebutton1' : blackberry.system.event.KEY_CONVENIENCE_1,
            'conveniencebutton2' : blackberry.system.event.KEY_CONVENIENCE_2,
            'endcallbutton'      : blackberry.system.event.KEY_ENDCALL,
            'menubutton'         : blackberry.system.event.KEY_MENU,
            'startcallbutton'    : blackberry.system.event.KEY_STARTCALL,
            'volumedownbutton'   : blackberry.system.event.KEY_VOLUMEDOWN,
            'volumeupbutton'     : blackberry.system.event.KEY_VOLUMEUP
        };

        // Generates a function which fires the specified event.
        var fireEvent = function(event) {
            return function() {
                cordova.fireDocumentEvent(event, null);
            };
        };

        var eventHandler = function(event) {
            return function() {
                // If we just attached the first handler, let native know we
                // need to override the hardware button.
                if (this.numHandlers) {
                    blackberry.system.event.onHardwareKey(
                            buttonMapping[event], fireEvent(event));
                }
                // If we just detached the last handler, let native know we
                // no longer override the hardware button.
                else {
                    blackberry.system.event.onHardwareKey(
                            buttonMapping[event], null);
                }
            };
        };

        // Inject listeners for buttons on the document.
        for (var button in buttonMapping) {
            if (buttonMapping.hasOwnProperty(button)) {
                var buttonChannel = cordova.addDocumentEventHandler(button);
                buttonChannel.onHasSubscribersChange = eventHandler(button);
            }
        }

        // Fires off necessary code to pause/resume app
        var resume = function() {
            cordova.fireDocumentEvent('resume');
            manager.resume();
        };
        var pause = function() {
            cordova.fireDocumentEvent('pause');
            manager.pause();
        };

        /************************************************
         * Patch up the generic pause/resume listeners. *
         ************************************************/

        // Unsubscribe handler - turns off native backlight change
        // listener
        var onHasSubscribersChange = function() {
            // If we just attached the first handler and there are
            // no pause handlers, start the backlight system
            // listener on the native side.
            if (this.numHandlers && (channel.onResume.numHandlers + channel.onPause.numHandlers === 1)) {
                exec(backlightWin, backlightFail, "App", "detectBacklight", []);
            } else if (channel.onResume.numHandlers === 0 && channel.onPause.numHandlers === 0) {
                exec(null, null, 'App', 'ignoreBacklight', []);
            }
        };

        // Native backlight detection win/fail callbacks
        var backlightWin = function(isOn) {
            if (isOn === true) {
                resume();
            } else {
                pause();
            }
        };
        var backlightFail = function(e) {
            console.log("Error detecting backlight on/off.");
        };

        // Override stock resume and pause listeners so we can trigger
        // some native methods during attach/remove
        channel.onResume = cordova.addDocumentEventHandler('resume');
        channel.onResume.onHasSubscribersChange = onHasSubscribersChange;
        channel.onPause = cordova.addDocumentEventHandler('pause');
        channel.onPause.onHasSubscribersChange = onHasSubscribersChange;

        // Fire resume event when application brought to foreground.
        blackberry.app.event.onForeground(resume);

        // Fire pause event when application sent to background.
        blackberry.app.event.onBackground(pause);

        // Trap BlackBerry WebWorks exit. Allow plugins to clean up before exiting.
        blackberry.app.event.onExit(app.exitApp);
    }
};

});

// file: lib/common/plugin/logger.js
define("cordova/plugin/logger", function(require, exports, module) {

//------------------------------------------------------------------------------
// The logger module exports the following properties/functions:
//
// LOG                          - constant for the level LOG
// ERROR                        - constant for the level ERROR
// WARN                         - constant for the level WARN
// INFO                         - constant for the level INFO
// DEBUG                        - constant for the level DEBUG
// logLevel()                   - returns current log level
// logLevel(value)              - sets and returns a new log level
// useConsole()                 - returns whether logger is using console
// useConsole(value)            - sets and returns whether logger is using console
// log(message,...)             - logs a message at level LOG
// error(message,...)           - logs a message at level ERROR
// warn(message,...)            - logs a message at level WARN
// info(message,...)            - logs a message at level INFO
// debug(message,...)           - logs a message at level DEBUG
// logLevel(level,message,...)  - logs a message specified level
//
//------------------------------------------------------------------------------

var logger = exports;

var exec    = require('cordova/exec');
var utils   = require('cordova/utils');

var UseConsole   = true;
var Queued       = [];
var DeviceReady  = false;
var CurrentLevel;

/**
 * Logging levels
 */

var Levels = [
    "LOG",
    "ERROR",
    "WARN",
    "INFO",
    "DEBUG"
];

/*
 * add the logging levels to the logger object and
 * to a separate levelsMap object for testing
 */

var LevelsMap = {};
for (var i=0; i<Levels.length; i++) {
    var level = Levels[i];
    LevelsMap[level] = i;
    logger[level]    = level;
}

CurrentLevel = LevelsMap.WARN;

/**
 * Getter/Setter for the logging level
 *
 * Returns the current logging level.
 *
 * When a value is passed, sets the logging level to that value.
 * The values should be one of the following constants:
 *    logger.LOG
 *    logger.ERROR
 *    logger.WARN
 *    logger.INFO
 *    logger.DEBUG
 *
 * The value used determines which messages get printed.  The logging
 * values above are in order, and only messages logged at the logging
 * level or above will actually be displayed to the user.  E.g., the
 * default level is WARN, so only messages logged with LOG, ERROR, or
 * WARN will be displayed; INFO and DEBUG messages will be ignored.
 */
logger.level = function (value) {
    if (arguments.length) {
        if (LevelsMap[value] === null) {
            throw new Error("invalid logging level: " + value);
        }
        CurrentLevel = LevelsMap[value];
    }

    return Levels[CurrentLevel];
};

/**
 * Getter/Setter for the useConsole functionality
 *
 * When useConsole is true, the logger will log via the
 * browser 'console' object.  Otherwise, it will use the
 * native Logger plugin.
 */
logger.useConsole = function (value) {
    if (arguments.length) UseConsole = !!value;

    if (UseConsole) {
        if (typeof console == "undefined") {
            throw new Error("global console object is not defined");
        }

        if (typeof console.log != "function") {
            throw new Error("global console object does not have a log function");
        }

        if (typeof console.useLogger == "function") {
            if (console.useLogger()) {
                throw new Error("console and logger are too intertwingly");
            }
        }
    }

    return UseConsole;
};

/**
 * Logs a message at the LOG level.
 *
 * Parameters passed after message are used applied to
 * the message with utils.format()
 */
logger.log   = function(message) { logWithArgs("LOG",   arguments); };

/**
 * Logs a message at the ERROR level.
 *
 * Parameters passed after message are used applied to
 * the message with utils.format()
 */
logger.error = function(message) { logWithArgs("ERROR", arguments); };

/**
 * Logs a message at the WARN level.
 *
 * Parameters passed after message are used applied to
 * the message with utils.format()
 */
logger.warn  = function(message) { logWithArgs("WARN",  arguments); };

/**
 * Logs a message at the INFO level.
 *
 * Parameters passed after message are used applied to
 * the message with utils.format()
 */
logger.info  = function(message) { logWithArgs("INFO",  arguments); };

/**
 * Logs a message at the DEBUG level.
 *
 * Parameters passed after message are used applied to
 * the message with utils.format()
 */
logger.debug = function(message) { logWithArgs("DEBUG", arguments); };

// log at the specified level with args
function logWithArgs(level, args) {
    args = [level].concat([].slice.call(args));
    logger.logLevel.apply(logger, args);
}

/**
 * Logs a message at the specified level.
 *
 * Parameters passed after message are used applied to
 * the message with utils.format()
 */
logger.logLevel = function(level /* , ... */) {
    // format the message with the parameters
    var formatArgs = [].slice.call(arguments, 1);
    var message    = logger.format.apply(logger.format, formatArgs);

    if (LevelsMap[level] === null) {
        throw new Error("invalid logging level: " + level);
    }

    if (LevelsMap[level] > CurrentLevel) return;

    // queue the message if not yet at deviceready
    if (!DeviceReady && !UseConsole) {
        Queued.push([level, message]);
        return;
    }

    // if not using the console, use the native logger
    if (!UseConsole) {
        exec(null, null, "Logger", "logLevel", [level, message]);
        return;
    }

    // make sure console is not using logger
    if (console.__usingCordovaLogger) {
        throw new Error("console and logger are too intertwingly");
    }

    // log to the console
    switch (level) {
        case logger.LOG:   console.log(message); break;
        case logger.ERROR: console.log("ERROR: " + message); break;
        case logger.WARN:  console.log("WARN: "  + message); break;
        case logger.INFO:  console.log("INFO: "  + message); break;
        case logger.DEBUG: console.log("DEBUG: " + message); break;
    }
};


/**
 * Formats a string and arguments following it ala console.log()
 *
 * Any remaining arguments will be appended to the formatted string.
 *
 * for rationale, see FireBug's Console API:
 *    http://getfirebug.com/wiki/index.php/Console_API
 */
logger.format = function(formatString, args) {
    return __format(arguments[0], [].slice.call(arguments,1)).join(' ');
};


//------------------------------------------------------------------------------
/**
 * Formats a string and arguments following it ala vsprintf()
 *
 * format chars:
 *   %j - format arg as JSON
 *   %o - format arg as JSON
 *   %c - format arg as ''
 *   %% - replace with '%'
 * any other char following % will format it's
 * arg via toString().
 *
 * Returns an array containing the formatted string and any remaining
 * arguments.
 */
function __format(formatString, args) {
    if (formatString === null || formatString === undefined) return [""];
    if (arguments.length == 1) return [formatString.toString()];

    if (typeof formatString != "string")
        formatString = formatString.toString();

    var pattern = /(.*?)%(.)(.*)/;
    var rest    = formatString;
    var result  = [];

    while (args.length) {
        var match = pattern.exec(rest);
        if (!match) break;

        var arg   = args.shift();
        rest = match[3];
        result.push(match[1]);

        if (match[2] == '%') {
            result.push('%');
            args.unshift(arg);
            continue;
        }

        result.push(__formatted(arg, match[2]));
    }

    result.push(rest);

    var remainingArgs = [].slice.call(args);
    remainingArgs.unshift(result.join(''));
    return remainingArgs;
}

function __formatted(object, formatChar) {

    try {
        switch(formatChar) {
            case 'j':
            case 'o': return JSON.stringify(object);
            case 'c': return '';
        }
    }
    catch (e) {
        return "error JSON.stringify()ing argument: " + e;
    }

    if ((object === null) || (object === undefined)) {
        return Object.prototype.toString.call(object);
    }

    return object.toString();
}


//------------------------------------------------------------------------------
// when deviceready fires, log queued messages
logger.__onDeviceReady = function() {
    if (DeviceReady) return;

    DeviceReady = true;

    for (var i=0; i<Queued.length; i++) {
        var messageArgs = Queued[i];
        logger.logLevel(messageArgs[0], messageArgs[1]);
    }

    Queued = null;
};

// add a deviceready event to log queued messages
document.addEventListener("deviceready", logger.__onDeviceReady, false);

});

// file: lib/common/plugin/logger/symbols.js
define("cordova/plugin/logger/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/logger', 'cordova.logger');

});

// file: lib/common/plugin/media/symbols.js
define("cordova/plugin/media/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.defaults('cordova/plugin/Media', 'Media');
modulemapper.defaults('cordova/plugin/MediaError', 'MediaError');

});

// file: lib/common/plugin/network.js
define("cordova/plugin/network", function(require, exports, module) {

var exec = require('cordova/exec'),
    cordova = require('cordova'),
    channel = require('cordova/channel'),
    utils = require('cordova/utils');

// Link the onLine property with the Cordova-supplied network info.
// This works because we clobber the naviagtor object with our own
// object in bootstrap.js.
if (typeof navigator != 'undefined') {
    utils.defineGetter(navigator, 'onLine', function() {
        return this.connection.type != 'none';
    });
}

function NetworkConnection() {
    this.type = 'unknown';
}

/**
 * Get connection info
 *
 * @param {Function} successCallback The function to call when the Connection data is available
 * @param {Function} errorCallback The function to call when there is an error getting the Connection data. (OPTIONAL)
 */
NetworkConnection.prototype.getInfo = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, "NetworkStatus", "getConnectionInfo", []);
};

var me = new NetworkConnection();
var timerId = null;
var timeout = 500;

channel.onCordovaReady.subscribe(function() {
    me.getInfo(function(info) {
        me.type = info;
        if (info === "none") {
            // set a timer if still offline at the end of timer send the offline event
            timerId = setTimeout(function(){
                cordova.fireDocumentEvent("offline");
                timerId = null;
            }, timeout);
        } else {
            // If there is a current offline event pending clear it
            if (timerId !== null) {
                clearTimeout(timerId);
                timerId = null;
            }
            cordova.fireDocumentEvent("online");
        }

        // should only fire this once
        if (channel.onCordovaConnectionReady.state !== 2) {
            channel.onCordovaConnectionReady.fire();
        }
    },
    function (e) {
        // If we can't get the network info we should still tell Cordova
        // to fire the deviceready event.
        if (channel.onCordovaConnectionReady.state !== 2) {
            channel.onCordovaConnectionReady.fire();
        }
        console.log("Error initializing Network Connection: " + e);
    });
});

module.exports = me;

});

// file: lib/common/plugin/networkstatus/symbols.js
define("cordova/plugin/networkstatus/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/network', 'navigator.network.connection', 'navigator.network.connection is deprecated. Use navigator.connection instead.');
modulemapper.clobbers('cordova/plugin/network', 'navigator.connection');
modulemapper.defaults('cordova/plugin/Connection', 'Connection');

});

// file: lib/common/plugin/notification.js
define("cordova/plugin/notification", function(require, exports, module) {

var exec = require('cordova/exec');
var platform = require('cordova/platform');

/**
 * Provides access to notifications on the device.
 */

module.exports = {

    /**
     * Open a native alert dialog, with a customizable title and button text.
     *
     * @param {String} message              Message to print in the body of the alert
     * @param {Function} completeCallback   The callback that is called when user clicks on a button.
     * @param {String} title                Title of the alert dialog (default: Alert)
     * @param {String} buttonLabel          Label of the close button (default: OK)
     */
    alert: function(message, completeCallback, title, buttonLabel) {
        var _title = (title || "Alert");
        var _buttonLabel = (buttonLabel || "OK");
        exec(completeCallback, null, "Notification", "alert", [message, _title, _buttonLabel]);
    },

    /**
     * Open a native confirm dialog, with a customizable title and button text.
     * The result that the user selects is returned to the result callback.
     *
     * @param {String} message              Message to print in the body of the alert
     * @param {Function} resultCallback     The callback that is called when user clicks on a button.
     * @param {String} title                Title of the alert dialog (default: Confirm)
     * @param {Array} buttonLabels          Array of the labels of the buttons (default: ['OK', 'Cancel'])
     */
    confirm: function(message, resultCallback, title, buttonLabels) {
        var _title = (title || "Confirm");
        var _buttonLabels = (buttonLabels || ["OK", "Cancel"]);

        // Strings are deprecated!
        if (typeof _buttonLabels === 'string') {
            console.log("Notification.confirm(string, function, string, string) is deprecated.  Use Notification.confirm(string, function, string, array).");
        }

        // Some platforms take an array of button label names.
        // Other platforms take a comma separated list.
        // For compatibility, we convert to the desired type based on the platform.
        if (platform.id == "android" || platform.id == "ios" || platform.id == "windowsphone") {
            if (typeof _buttonLabels === 'string') {
                var buttonLabelString = _buttonLabels;
                _buttonLabels = _buttonLabels.split(","); // not crazy about changing the var type here
            }
        } else {
            if (Array.isArray(_buttonLabels)) {
                var buttonLabelArray = _buttonLabels;
                _buttonLabels = buttonLabelArray.toString();
            }
        }
        exec(resultCallback, null, "Notification", "confirm", [message, _title, _buttonLabels]);
    },

    /**
     * Open a native prompt dialog, with a customizable title and button text.
     * The following results are returned to the result callback:
     *  buttonIndex     Index number of the button selected.
     *  input1          The text entered in the prompt dialog box.
     *
     * @param {String} message              Dialog message to display (default: "Prompt message")
     * @param {Function} resultCallback     The callback that is called when user clicks on a button.
     * @param {String} title                Title of the dialog (default: "Prompt")
     * @param {Array} buttonLabels          Array of strings for the button labels (default: ["OK","Cancel"])
     */
    prompt: function(message, resultCallback, title, buttonLabels) {
        var _message = (message || "Prompt message");
        var _title = (title || "Prompt");
        var _buttonLabels = (buttonLabels || ["OK","Cancel"]);
        exec(resultCallback, null, "Notification", "prompt", [_message, _title, _buttonLabels]);
    },

    /**
     * Causes the device to vibrate.
     *
     * @param {Integer} mills       The number of milliseconds to vibrate for.
     */
    vibrate: function(mills) {
        exec(null, null, "Notification", "vibrate", [mills]);
    },

    /**
     * Causes the device to beep.
     * On Android, the default notification ringtone is played "count" times.
     *
     * @param {Integer} count       The number of beeps.
     */
    beep: function(count) {
        exec(null, null, "Notification", "beep", [count]);
    }
};

});

// file: lib/common/plugin/notification/symbols.js
define("cordova/plugin/notification/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.defaults('cordova/plugin/notification', 'navigator.notification');

});

// file: lib/blackberry/plugin/qnx/InAppBrowser.js
define("cordova/plugin/qnx/InAppBrowser", function(require, exports, module) {

var cordova = require('cordova'),
    modulemapper = require('cordova/modulemapper'),
    origOpen = modulemapper.getOriginalSymbol(window, 'open'),
    browser = {
        close: function () { } //dummy so we don't have to check for undefined
    };

var navigate = {
    "_blank": function (url, whitelisted) {
        return origOpen(url, "_blank");
    },

    "_self": function (url, whitelisted) {
        if (whitelisted) {
            window.location.href = url;
            return window;
        }
        else {
            return origOpen(url, "_blank");
        }
    },

    "_system": function (url, whitelisted) {
        blackberry.invoke.invoke({
            target: "sys.browser",
            uri: url
        }, function () {}, function () {});

        return {
            close: function () { }
        };
    }
};

module.exports = {
    open: function (args, win, fail) {
        var url = args[0],
            target = args[1] || '_self',
            a = document.createElement('a');

        //Make all URLs absolute
        a.href = url;
        url = a.href;

        switch (target) {
            case '_self':
            case '_system':
            case '_blank':
                break;
            default:
                target = '_blank';
                break;
        }

        webworks.exec(function (whitelisted) {
            browser = navigate[target](url, whitelisted);
        }, fail, "org.apache.cordova", "isWhitelisted", [url], true);

        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "" };
    },
    close: function (args, win, fail) {
        browser.close();
        return { "status" : cordova.callbackStatus.OK, "message" : "" };
    }
};

});

// file: lib/blackberry/plugin/qnx/battery.js
define("cordova/plugin/qnx/battery", function(require, exports, module) {

var cordova = require('cordova'),
    interval;

module.exports = {
    start: function (args, win, fail) {
        interval = window.setInterval(function () {
            win({
                level: navigator.webkitBattery.level * 100,
                isPlugged: navigator.webkitBattery.charging
            });
        }, 500);
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },

    stop: function (args, win, fail) {
        window.clearInterval(interval);
        return { "status" : cordova.callbackStatus.OK, "message" : "stopped" };
    }
};

});

// file: lib/blackberry/plugin/qnx/camera.js
define("cordova/plugin/qnx/camera", function(require, exports, module) {

var cordova = require('cordova');

module.exports = {
    takePicture: function (args, win, fail) {
        var noop = function () {};
        blackberry.invoke.card.invokeCamera("photo", function (path) {
            win("file://" + path);
        }, noop, noop);
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    }
};

});

// file: lib/blackberry/plugin/qnx/capture.js
define("cordova/plugin/qnx/capture", function(require, exports, module) {

var cordova = require('cordova');

function capture(action, win, fail) {
    var noop = function () {};

    blackberry.invoke.card.invokeCamera(action, function (path) {
        var sb = blackberry.io.sandbox;
        blackberry.io.sandbox = false;
        window.webkitRequestFileSystem(window.PERSISTENT, 1024, function (fs) {
            fs.root.getFile(path, {}, function (fe) {
                fe.file(function (file) {
                    file.fullPath = fe.fullPath;
                    win([file]);
                    blackberry.io.sandbox = sb;
                }, fail);
            }, fail);
        }, fail);
    }, noop, noop);
}

module.exports = {
    getSupportedAudioModes: function (args, win, fail) {
        return {"status": cordova.callbackStatus.OK, "message": []};
    },
    getSupportedImageModes: function (args, win, fail) {
        return {"status": cordova.callbackStatus.OK, "message": []};
    },
    getSupportedVideoModes: function (args, win, fail) {
        return {"status": cordova.callbackStatus.OK, "message": []};
    },
    captureImage: function (args, win, fail) {
        if (args[0].limit > 0) {
            capture("photo", win, fail);
        }
        else {
            win([]);
        }

        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },
    captureVideo: function (args, win, fail) {
        if (args[0].limit > 0) {
            capture("video", win, fail);
        }
        else {
            win([]);
        }

        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },
    captureAudio: function (args, win, fail) {
        fail("Capturing Audio not supported");
        return {"status": cordova.callbackStatus.NO_RESULT, "message": "WebWorks Is On It"};
    }
};

});

// file: lib/blackberry/plugin/qnx/compass.js
define("cordova/plugin/qnx/compass", function(require, exports, module) {

var exec = require('cordova/exec'),
    utils = require('cordova/utils'),
    CompassHeading = require('cordova/plugin/CompassHeading'),
    CompassError = require('cordova/plugin/CompassError'),
    timers = {},
    listeners = [],
    heading = null,
    running = false,
    start = function () {
        exec(function (result) {
            heading = new CompassHeading(result.magneticHeading, result.trueHeading, result.headingAccuracy, result.timestamp);
            listeners.forEach(function (l) {
                l.win(heading);
            });
        }, function (e) {
            listeners.forEach(function (l) {
                l.fail(e);
            });
        },
        "Compass", "start", []);
        running = true;
    },
    stop = function () {
        exec(null, null, "Compass", "stop", []);
        running = false;
    },
    createCallbackPair = function (win, fail) {
        return {win:win, fail:fail};
    },
    removeListeners = function (l) {
        var idx = listeners.indexOf(l);
        if (idx > -1) {
            listeners.splice(idx, 1);
            if (listeners.length === 0) {
                stop();
            }
        }
    },
    compass = {
        /**
         * Asynchronously acquires the current heading.
         * @param {Function} successCallback The function to call when the heading
         * data is available
         * @param {Function} errorCallback The function to call when there is an error
         * getting the heading data.
         * @param {CompassOptions} options The options for getting the heading data (not used).
         */
        getCurrentHeading:function(successCallback, errorCallback, options) {
            if (typeof successCallback !== "function") {
                throw "getCurrentHeading must be called with at least a success callback function as first parameter.";
            }

            var p;
            var win = function(a) {
                removeListeners(p);
                successCallback(a);
            };
            var fail = function(e) {
                removeListeners(p);
                errorCallback(e);
            };

            p = createCallbackPair(win, fail);
            listeners.push(p);

            if (!running) {
                start();
            }
        },

        /**
         * Asynchronously acquires the heading repeatedly at a given interval.
         * @param {Function} successCallback The function to call each time the heading
         * data is available
         * @param {Function} errorCallback The function to call when there is an error
         * getting the heading data.
         * @param {HeadingOptions} options The options for getting the heading data
         * such as timeout and the frequency of the watch. For iOS, filter parameter
         * specifies to watch via a distance filter rather than time.
         */
        watchHeading:function(successCallback, errorCallback, options) {
            var frequency = (options !== undefined && options.frequency !== undefined) ? options.frequency : 100;
            var filter = (options !== undefined && options.filter !== undefined) ? options.filter : 0;

            // successCallback required
            if (typeof successCallback !== "function") {
              console.log("Compass Error: successCallback is not a function");
              return;
            }

            // errorCallback optional
            if (errorCallback && (typeof errorCallback !== "function")) {
              console.log("Compass Error: errorCallback is not a function");
              return;
            }
            // Keep reference to watch id, and report heading readings as often as defined in frequency
            var id = utils.createUUID();

            var p = createCallbackPair(function(){}, function(e) {
                removeListeners(p);
                errorCallback(e);
            });
            listeners.push(p);

            timers[id] = {
                timer:window.setInterval(function() {
                    if (heading) {
                        successCallback(heading);
                    }
                }, frequency),
                listeners:p
            };

            if (running) {
                // If we're already running then immediately invoke the success callback
                // but only if we have retrieved a value, sample code does not check for null ...
                if(heading) {
                    successCallback(heading);
                }
            } else {
                start();
            }

            return id;
        },

        /**
         * Clears the specified heading watch.
         * @param {String} watchId The ID of the watch returned from #watchHeading.
         */
        clearWatch:function(id) {
            // Stop javascript timer & remove from timer list
            if (id && timers[id]) {
                window.clearInterval(timers[id].timer);
                removeListeners(timers[id].listeners);
                delete timers[id];
            }
        }
    };

module.exports = compass;

});

// file: lib/blackberry/plugin/qnx/compass/bbsymbols.js
define("cordova/plugin/qnx/compass/bbsymbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.merges('cordova/plugin/qnx/compass', 'navigator.compass');

});

// file: lib/blackberry/plugin/qnx/device.js
define("cordova/plugin/qnx/device", function(require, exports, module) {

var channel = require('cordova/channel'),
    cordova = require('cordova');

// Tell cordova channel to wait on the CordovaInfoReady event
channel.waitForInitialization('onCordovaInfoReady');

module.exports = {
    getDeviceInfo : function(args, win, fail){
        win({
            platform: "BlackBerry",
            version: blackberry.system.softwareVersion,
            model: "Dev Alpha",
            name: "Dev Alpha", // deprecated: please use device.model
            uuid: blackberry.identity.uuid,
            cordova: "2.7.0"
        });

        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "Device info returned" };
    }
};

});

// file: lib/blackberry/plugin/qnx/file.js
define("cordova/plugin/qnx/file", function(require, exports, module) {

/*global WebKitBlobBuilder:false */
/*global Blob:false */
var cordova = require('cordova'),
    FileError = require('cordova/plugin/FileError'),
    DirectoryEntry = require('cordova/plugin/DirectoryEntry'),
    FileEntry = require('cordova/plugin/FileEntry'),
    File = require('cordova/plugin/File'),
    FileSystem = require('cordova/plugin/FileSystem'),
    FileReader = require('cordova/plugin/FileReader'),
    nativeRequestFileSystem = window.webkitRequestFileSystem,
    nativeResolveLocalFileSystemURI = function(uri, success, fail) {
        if (uri.substring(0,11) !== "filesystem:") {
            uri = "filesystem:" + uri;
        }
        window.webkitResolveLocalFileSystemURL(uri, success, fail);
    },
    NativeFileReader = window.FileReader;

window.FileReader = FileReader;
window.File = File;

function getFileSystemName(nativeFs) {
    return (nativeFs.name.indexOf("Persistent") != -1) ? "persistent" : "temporary";
}

function makeEntry(entry) {
    if (entry.isDirectory) {
        return new DirectoryEntry(entry.name, decodeURI(entry.toURL()).substring(11));
    }
    else {
        return new FileEntry(entry.name, decodeURI(entry.toURL()).substring(11));
    }
}

module.exports = {
    /* requestFileSystem */
    requestFileSystem: function(args, successCallback, errorCallback) {
        var type = args[0],
            size = args[1];

        nativeRequestFileSystem(type, size, function(nativeFs) {
            successCallback(new FileSystem(getFileSystemName(nativeFs), makeEntry(nativeFs.root)));
        }, function(error) {
            errorCallback(error.code);
        });
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    },

    /* resolveLocalFileSystemURI */
    resolveLocalFileSystemURI: function(args, successCallback, errorCallback) {
        var uri = args[0];

        nativeResolveLocalFileSystemURI(uri, function(entry) {
            successCallback(makeEntry(entry));
        }, function(error) {
            var code = error.code;
            switch (code) {
                case 5:
                    code = FileError.NOT_FOUND_ERR;
                    break;

                case 2:
                    code = FileError.ENCODING_ERR;
                    break;
            }
            errorCallback(code);
        });
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    },

    /* DirectoryReader */
    readEntries: function(args, successCallback, errorCallback) {
        var uri = args[0];

        nativeResolveLocalFileSystemURI(uri, function(dirEntry) {
            var reader = dirEntry.createReader();
            reader.readEntries(function(entries) {
                var retVal = [];
                for (var i = 0; i < entries.length; i++) {
                    retVal.push(makeEntry(entries[i]));
                }
                successCallback(retVal);
            }, function(error) {
                errorCallback(error.code);
            });
        }, function(error) {
            errorCallback(error.code);
        });
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    },

    /* Entry */
    getMetadata: function(args, successCallback, errorCallback) {
        var uri = args[0];

        nativeResolveLocalFileSystemURI(uri, function(entry) {
            entry.getMetadata(function(metaData) {
                successCallback(metaData.modificationTime);
            }, function(error) {
                errorCallback(error.code);
            });
        }, function(error) {
            errorCallback(error.code);
        });
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    },

    moveTo: function(args, successCallback, errorCallback) {
        var srcUri = args[0],
            parentUri = args[1],
            name = args[2];

        nativeResolveLocalFileSystemURI(srcUri, function(source) {
            nativeResolveLocalFileSystemURI(parentUri, function(parent) {
                source.moveTo(parent, name, function(entry) {
                    successCallback(makeEntry(entry));
                }, function(error) {
                    errorCallback(error.code);
                });
            }, function(error) {
                errorCallback(error.code);
            });
        }, function(error) {
            errorCallback(error.code);
        });
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    },

    copyTo: function(args, successCallback, errorCallback) {
        var srcUri = args[0],
            parentUri = args[1],
            name = args[2];

        nativeResolveLocalFileSystemURI(srcUri, function(source) {
            nativeResolveLocalFileSystemURI(parentUri, function(parent) {
                source.copyTo(parent, name, function(entry) {
                    successCallback(makeEntry(entry));
                }, function(error) {
                    errorCallback(error.code);
                });
            }, function(error) {
                errorCallback(error.code);
            });
        }, function(error) {
            errorCallback(error.code);
        });
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    },

    remove: function(args, successCallback, errorCallback) {
        var uri = args[0];

        nativeResolveLocalFileSystemURI(uri, function(entry) {
            if (entry.fullPath === "/") {
                errorCallback(FileError.NO_MODIFICATION_ALLOWED_ERR);
            } else {
                entry.remove(
                    function (success) {
                        if (successCallback) {
                            successCallback(success);
                        }
                    },
                    function(error) {
                        if (errorCallback) {
                            errorCallback(error.code);
                        }
                    }
                );
            }
        }, function(error) {
            errorCallback(error.code);
        });
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    },

    getParent: function(args, successCallback, errorCallback) {
        var uri = args[0];

        nativeResolveLocalFileSystemURI(uri, function(entry) {
            entry.getParent(function(entry) {
                successCallback(makeEntry(entry));
            }, function(error) {
                errorCallback(error.code);
            });
        }, function(error) {
            errorCallback(error.code);
        });
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    },

    /* FileEntry */
    getFileMetadata: function(args, successCallback, errorCallback) {
        var uri = args[0];

        nativeResolveLocalFileSystemURI(uri, function(entry) {
            entry.file(function(file) {
                var retVal = new File(file.name, decodeURI(entry.toURL()), file.type, file.lastModifiedDate, file.size);
                successCallback(retVal);
            }, function(error) {
                errorCallback(error.code);
            });
        }, function(error) {
            errorCallback(error.code);
        });
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    },

    /* DirectoryEntry */
    getDirectory: function(args, successCallback, errorCallback) {
        var uri = args[0],
            path = args[1],
            options = args[2];

        nativeResolveLocalFileSystemURI(uri, function(entry) {
            entry.getDirectory(path, options, function(entry) {
                successCallback(makeEntry(entry));
            }, function(error) {
                if (error.code === FileError.INVALID_MODIFICATION_ERR) {
                    if (options.create) {
                        errorCallback(FileError.PATH_EXISTS_ERR);
                    } else {
                        errorCallback(FileError.ENCODING_ERR);
                    }
                } else {
                    errorCallback(error.code);
                }
            });
        }, function(error) {
            errorCallback(error.code);
        });
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    },

    removeRecursively: function(args, successCallback, errorCallback) {
        var uri = args[0];

        nativeResolveLocalFileSystemURI(uri, function(entry) {
            if (entry.fullPath === "/") {
                errorCallback(FileError.NO_MODIFICATION_ALLOWED_ERR);
            } else {
                entry.removeRecursively(
                    function (success) {
                        if (successCallback) {
                            successCallback(success);
                        }
                    },
                    function(error) {
                        errorCallback(error.code);
                    }
                );
            }
        }, function(error) {
            errorCallback(error.code);
        });
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    },

    getFile: function(args, successCallback, errorCallback) {
        var uri = args[0],
            path = args[1],
            options = args[2];

        nativeResolveLocalFileSystemURI(uri, function(entry) {
            entry.getFile(path, options, function(entry) {
                successCallback(makeEntry(entry));
            }, function(error) {
                if (error.code === FileError.INVALID_MODIFICATION_ERR) {
                    if (options.create) {
                        errorCallback(FileError.PATH_EXISTS_ERR);
                    } else {
                        errorCallback(FileError.NOT_FOUND_ERR);
                    }
                } else {
                    errorCallback(error.code);
                }
            });
        }, function(error) {
            errorCallback(error.code);
        });
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    },

    /* FileReader */
    readAsText: function(args, successCallback, errorCallback) {
        var uri = args[0],
            encoding = args[1];

        nativeResolveLocalFileSystemURI(uri, function(entry) {
            var onLoadEnd = function(evt) {
                    if (!evt.target.error) {
                        successCallback(evt.target.result);
                    }
            },
                onError = function(evt) {
                    errorCallback(evt.target.error.code);
            };

            var reader = new NativeFileReader();

            reader.onloadend = onLoadEnd;
            reader.onerror = onError;
            entry.file(function(file) {
                reader.readAsText(file, encoding);
            }, function(error) {
                errorCallback(error.code);
            });
        }, function(error) {
            errorCallback(error.code);
        });
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    },

    readAsDataURL: function(args, successCallback, errorCallback) {
        var uri = args[0];

        nativeResolveLocalFileSystemURI(uri, function(entry) {
            var onLoadEnd = function(evt) {
                    if (!evt.target.error) {
                        successCallback(evt.target.result);
                    }
            },
                onError = function(evt) {
                    errorCallback(evt.target.error.code);
            };

            var reader = new NativeFileReader();

            reader.onloadend = onLoadEnd;
            reader.onerror = onError;
            entry.file(function(file) {
                reader.readAsDataURL(file);
            }, function(error) {
                errorCallback(error.code);
            });
        }, function(error) {
            errorCallback(error.code);
        });
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    },

    /* FileWriter */
    write: function(args, successCallback, errorCallback) {
        var uri = args[0],
            text = args[1],
            position = args[2];

        nativeResolveLocalFileSystemURI(uri, function(entry) {
            var onWriteEnd = function(evt) {
                    if(!evt.target.error) {
                        successCallback(evt.target.position - position);
                    } else {
                        errorCallback(evt.target.error.code);
                    }
            },
                onError = function(evt) {
                    errorCallback(evt.target.error.code);
            };

            entry.createWriter(function(writer) {
                writer.onwriteend = onWriteEnd;
                writer.onerror = onError;

                writer.seek(position);
                writer.write(new Blob([text], {type: "text/plain"}));
            }, function(error) {
                errorCallback(error.code);
            });
        }, function(error) {
            errorCallback(error.code);
        });
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    },

    truncate: function(args, successCallback, errorCallback) {
        var uri = args[0],
            size = args[1];

        nativeResolveLocalFileSystemURI(uri, function(entry) {
            var onWriteEnd = function(evt) {
                    if(!evt.target.error) {
                        successCallback(evt.target.length);
                    } else {
                        errorCallback(evt.target.error.code);
                    }
            },
                onError = function(evt) {
                    errorCallback(evt.target.error.code);
            };

            entry.createWriter(function(writer) {
                writer.onwriteend = onWriteEnd;
                writer.onerror = onError;

                writer.truncate(size);
            }, function(error) {
                errorCallback(error.code);
            });
        }, function(error) {
            errorCallback(error.code);
        });
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    }
};

});

// file: lib/blackberry/plugin/qnx/fileTransfer.js
define("cordova/plugin/qnx/fileTransfer", function(require, exports, module) {

/*global Blob:false */
var cordova = require('cordova'),
    FileEntry = require('cordova/plugin/FileEntry'),
    FileTransferError = require('cordova/plugin/FileTransferError'),
    FileUploadResult = require('cordova/plugin/FileUploadResult'),
    ProgressEvent = require('cordova/plugin/ProgressEvent'),
    nativeResolveLocalFileSystemURI = function(uri, success, fail) {
        if (uri.substring(0,11) !== "filesystem:") {
            uri = "filesystem:" + uri;
        }
        window.webkitResolveLocalFileSystemURL(uri, success, fail);
    },
    xhr;

function getParentPath(filePath) {
    var pos = filePath.lastIndexOf('/');
    return filePath.substring(0, pos + 1);
}

function getFileName(filePath) {
    var pos = filePath.lastIndexOf('/');
    return filePath.substring(pos + 1);
}

function cleanUpPath(filePath) {
    var pos = filePath.lastIndexOf('/');
    return filePath.substring(0, pos) + filePath.substring(pos + 1, filePath.length);
}

function checkURL(url) {
    return url.indexOf(' ') === -1 ?  true : false;
}

module.exports = {
    abort: function () {
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    },

    upload: function(args, win, fail) {
        var filePath = args[0],
            server = args[1],
            fileKey = args[2],
            fileName = args[3],
            mimeType = args[4],
            params = args[5],
            /*trustAllHosts = args[6],*/
            chunkedMode = args[7],
            headers = args[8];

        if (!checkURL(server)) {
            fail(new FileTransferError(FileTransferError.INVALID_URL_ERR));
        }

        nativeResolveLocalFileSystemURI(filePath, function(entry) {
            entry.file(function(file) {
                function uploadFile(blobFile) {
                    var fd = new FormData();

                    fd.append(fileKey, blobFile, fileName);
                    for (var prop in params) {
                        if(params.hasOwnProperty(prop)) {
                            fd.append(prop, params[prop]);
                        }
                    }

                    xhr = new XMLHttpRequest();
                    xhr.open("POST", server);
                    xhr.onload = function(evt) {
                        if (xhr.status == 200) {
                            var result = new FileUploadResult();
                            result.bytesSent = file.size;
                            result.responseCode = xhr.status;
                            result.response = xhr.response;
                            win(result);
                        } else if (xhr.status == 404) {
                            fail(new FileTransferError(FileTransferError.INVALID_URL_ERR, server, filePath, xhr.status));
                        } else {
                            fail(new FileTransferError(FileTransferError.CONNECTION_ERR, server, filePath, xhr.status));
                        }
                    };
                    xhr.ontimeout = function(evt) {
                        fail(new FileTransferError(FileTransferError.CONNECTION_ERR, server, filePath, xhr.status));
                    };
                    xhr.onerror = function () {
                        fail(new FileTransferError(FileTransferError.CONNECTION_ERR, server, filePath, this.status));
                    };
                    xhr.onprogress = function (evt) {
                        win(evt);
                    };

                    for (var header in headers) {
                        if (headers.hasOwnProperty(header)) {
                            xhr.setRequestHeader(header, headers[header]);
                        }
                    }

                    xhr.send(fd);
                }

                var bytesPerChunk;
                if (chunkedMode === true) {
                    bytesPerChunk = 1024 * 1024; // 1MB chunk sizes.
                } else {
                    bytesPerChunk = file.size;
                }
                var start = 0;
                var end = bytesPerChunk;
                while (start < file.size) {
                    var chunk = file.slice(start, end, mimeType);
                    uploadFile(chunk);
                    start = end;
                    end = start + bytesPerChunk;
                }
            }, function(error) {
                fail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
            });
        }, function(error) {
            fail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
        });

        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    },

    download: function (args, win, fail) {
        var source = args[0],
            target = cleanUpPath(args[1]),
            fileWriter;

        if (!checkURL(source)) {
            fail(new FileTransferError(FileTransferError.INVALID_URL_ERR));
        }

        xhr = new XMLHttpRequest();

        function writeFile(entry) {
            entry.createWriter(function (writer) {
                fileWriter = writer;
                fileWriter.onwriteend = function (evt) {
                    if (!evt.target.error) {
                        win(new FileEntry(entry.name, entry.toURL()));
                    } else {
                        fail(evt.target.error);
                    }
                };
                fileWriter.onerror = function (evt) {
                    fail(evt.target.error);
                };
                fileWriter.write(new Blob([xhr.response]));
            }, function (error) {
                fail(error);
            });
        }

        xhr.onerror = function (e) {
            fail(new FileTransferError(FileTransferError.CONNECTION_ERR, source, target, xhr.status));
        };

        xhr.onload = function () {
            if (xhr.readyState === xhr.DONE) {
                if (xhr.status === 200 && xhr.response) {
                    nativeResolveLocalFileSystemURI(getParentPath(target), function (dir) {
                        dir.getFile(getFileName(target), {create: true}, writeFile, function (error) {
                            fail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
                        });
                    }, function (error) {
                        fail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
                    });
                } else if (xhr.status === 404) {
                    fail(new FileTransferError(FileTransferError.INVALID_URL_ERR, source, target, xhr.status));
                } else {
                    fail(new FileTransferError(FileTransferError.CONNECTION_ERR, source, target, xhr.status));
                }
            }
        };
        xhr.onprogress = function (evt) {
            win(evt);
        };

        xhr.responseType = "blob";
        xhr.open("GET", source, true);
        xhr.send();
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "async"};
    }
};

});

// file: lib/blackberry/plugin/qnx/inappbrowser/bbsymbols.js
define("cordova/plugin/qnx/inappbrowser/bbsymbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/InAppBrowser', 'open');

});

// file: lib/blackberry/plugin/qnx/magnetometer.js
define("cordova/plugin/qnx/magnetometer", function(require, exports, module) {

var cordova = require('cordova'),
    callback;

module.exports = {
    start: function (args, win, fail) {
        window.removeEventListener("deviceorientation", callback);
        callback = function (orientation) {
            var heading = 360 - orientation.alpha;
            win({
                magneticHeading: heading,
                trueHeading: heading,
                headingAccuracy: 0,
                timestamp: orientation.timeStamp
            });
        };

        window.addEventListener("deviceorientation", callback);
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },
    stop: function (args, win, fail) {
        window.removeEventListener("deviceorientation", callback);
        return { "status" : cordova.callbackStatus.OK, "message" : "removed" };
    }
};

});

// file: lib/blackberry/plugin/qnx/manager.js
define("cordova/plugin/qnx/manager", function(require, exports, module) {

var cordova = require('cordova'),
    plugins = {
        'NetworkStatus' : require('cordova/plugin/qnx/network'),
        'Accelerometer' : require('cordova/plugin/webworks/accelerometer'),
        'Device' : require('cordova/plugin/qnx/device'),
        'Battery' : require('cordova/plugin/qnx/battery'),
        'Compass' : require('cordova/plugin/qnx/magnetometer'),
        'Camera' : require('cordova/plugin/qnx/camera'),
        'Capture' : require('cordova/plugin/qnx/capture'),
        'Logger' : require('cordova/plugin/webworks/logger'),
        'Notification' : require('cordova/plugin/webworks/notification'),
        'Media': require('cordova/plugin/webworks/media'),
        'File' : require('cordova/plugin/qnx/file'),
        'InAppBrowser' : require('cordova/plugin/qnx/InAppBrowser'),
        'FileTransfer': require('cordova/plugin/qnx/fileTransfer')
    };

module.exports = {
    addPlugin: function (key, module) {
        plugins[key] = require(module);
    },
    exec: function (win, fail, clazz, action, args) {
        var result = {"status" : cordova.callbackStatus.CLASS_NOT_FOUND_EXCEPTION, "message" : "Class " + clazz + " cannot be found"};

        if (plugins[clazz]) {
            if (plugins[clazz][action]) {
                result = plugins[clazz][action](args, win, fail);
            }
            else {
                result = { "status" : cordova.callbackStatus.INVALID_ACTION, "message" : "Action not found: " + action };
            }
        }

        return result;
    },
    resume: function () {},
    pause: function () {},
    destroy: function () {}
};

});

// file: lib/blackberry/plugin/qnx/network.js
define("cordova/plugin/qnx/network", function(require, exports, module) {

var cordova = require('cordova');

module.exports = {
    getConnectionInfo: function (args, win, fail) {
        return { "status": cordova.callbackStatus.OK, "message": blackberry.connection.type};
    }
};

});

// file: lib/blackberry/plugin/qnx/platform.js
define("cordova/plugin/qnx/platform", function(require, exports, module) {

var cordova = require('cordova');

module.exports = {
    id: "qnx",
    initialize: function () {
        document.addEventListener("deviceready", function () {
            blackberry.event.addEventListener("pause", function () {
                cordova.fireDocumentEvent("pause");
            });
            blackberry.event.addEventListener("resume", function () {
                cordova.fireDocumentEvent("resume");
            });

            window.addEventListener("online", function () {
                cordova.fireDocumentEvent("online");
            });

            window.addEventListener("offline", function () {
                cordova.fireDocumentEvent("offline");
            });
        });
    }
};

});

// file: lib/common/plugin/requestFileSystem.js
define("cordova/plugin/requestFileSystem", function(require, exports, module) {

var argscheck = require('cordova/argscheck'),
    FileError = require('cordova/plugin/FileError'),
    FileSystem = require('cordova/plugin/FileSystem'),
    exec = require('cordova/exec');

/**
 * Request a file system in which to store application data.
 * @param type  local file system type
 * @param size  indicates how much storage space, in bytes, the application expects to need
 * @param successCallback  invoked with a FileSystem object
 * @param errorCallback  invoked if error occurs retrieving file system
 */
var requestFileSystem = function(type, size, successCallback, errorCallback) {
    argscheck.checkArgs('nnFF', 'requestFileSystem', arguments);
    var fail = function(code) {
        errorCallback && errorCallback(new FileError(code));
    };

    if (type < 0 || type > 3) {
        fail(FileError.SYNTAX_ERR);
    } else {
        // if successful, return a FileSystem object
        var success = function(file_system) {
            if (file_system) {
                if (successCallback) {
                    // grab the name and root from the file system object
                    var result = new FileSystem(file_system.name, file_system.root);
                    successCallback(result);
                }
            }
            else {
                // no FileSystem object returned
                fail(FileError.NOT_FOUND_ERR);
            }
        };
        exec(success, fail, "File", "requestFileSystem", [type, size]);
    }
};

module.exports = requestFileSystem;

});

// file: lib/common/plugin/resolveLocalFileSystemURI.js
define("cordova/plugin/resolveLocalFileSystemURI", function(require, exports, module) {

var argscheck = require('cordova/argscheck'),
    DirectoryEntry = require('cordova/plugin/DirectoryEntry'),
    FileEntry = require('cordova/plugin/FileEntry'),
    FileError = require('cordova/plugin/FileError'),
    exec = require('cordova/exec');

/**
 * Look up file system Entry referred to by local URI.
 * @param {DOMString} uri  URI referring to a local file or directory
 * @param successCallback  invoked with Entry object corresponding to URI
 * @param errorCallback    invoked if error occurs retrieving file system entry
 */
module.exports = function(uri, successCallback, errorCallback) {
    argscheck.checkArgs('sFF', 'resolveLocalFileSystemURI', arguments);
    // error callback
    var fail = function(error) {
        errorCallback && errorCallback(new FileError(error));
    };
    // sanity check for 'not:valid:filename'
    if(!uri || uri.split(":").length > 2) {
        setTimeout( function() {
            fail(FileError.ENCODING_ERR);
        },0);
        return;
    }
    // if successful, return either a file or directory entry
    var success = function(entry) {
        var result;
        if (entry) {
            if (successCallback) {
                // create appropriate Entry object
                result = (entry.isDirectory) ? new DirectoryEntry(entry.name, entry.fullPath) : new FileEntry(entry.name, entry.fullPath);
                successCallback(result);
            }
        }
        else {
            // no Entry object returned
            fail(FileError.NOT_FOUND_ERR);
        }
    };

    exec(success, fail, "File", "resolveLocalFileSystemURI", [uri]);
};

});

// file: lib/common/plugin/splashscreen.js
define("cordova/plugin/splashscreen", function(require, exports, module) {

var exec = require('cordova/exec');

var splashscreen = {
    show:function() {
        exec(null, null, "SplashScreen", "show", []);
    },
    hide:function() {
        exec(null, null, "SplashScreen", "hide", []);
    }
};

module.exports = splashscreen;

});

// file: lib/common/plugin/splashscreen/symbols.js
define("cordova/plugin/splashscreen/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/splashscreen', 'navigator.splashscreen');

});

// file: lib/blackberry/plugin/webworks/accelerometer.js
define("cordova/plugin/webworks/accelerometer", function(require, exports, module) {

var cordova = require('cordova'),
    callback;

module.exports = {
    start: function (args, win, fail) {
        window.removeEventListener("devicemotion", callback);
        callback = function (motion) {
            win({
                x: motion.accelerationIncludingGravity.x,
                y: motion.accelerationIncludingGravity.y,
                z: motion.accelerationIncludingGravity.z,
                timestamp: motion.timestamp
            });
        };
        window.addEventListener("devicemotion", callback);
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },
    stop: function (args, win, fail) {
        window.removeEventListener("devicemotion", callback);
        return { "status" : cordova.callbackStatus.OK, "message" : "removed" };
    }
};

});

// file: lib/blackberry/plugin/webworks/logger.js
define("cordova/plugin/webworks/logger", function(require, exports, module) {

var cordova = require('cordova');

module.exports = {
    log: function (args, win, fail) {
        console.log(args);
        return {"status" : cordova.callbackStatus.OK,
                "message" : 'Message logged to console: ' + args};
    }
};

});

// file: lib/blackberry/plugin/webworks/media.js
define("cordova/plugin/webworks/media", function(require, exports, module) {

var cordova = require('cordova'),
    audioObjects = {};

module.exports = {
    create: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            src = args[1];

        if (typeof src == "undefined"){
            audioObjects[id] = new Audio();
        } else {
            audioObjects[id] = new Audio(src);
        }

        return {"status" : 1, "message" : "Audio object created" };
    },
    startPlayingAudio: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (args.length === 1 || typeof args[1] == "undefined" ) {
            return {"status" : 9, "message" : "Media source argument not found"};
        }

        if (audio) {
            audio.pause();
            audioObjects[id] = undefined;
        }

        audio = audioObjects[id] = new Audio(args[1]);
        audio.play();
        return {"status" : 1, "message" : "Audio play started" };
    },
    stopPlayingAudio: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (!audio) {
            return {"status" : 2, "message" : "Audio Object has not been initialized"};
        }

        audio.pause();
        audioObjects[id] = undefined;

        return {"status" : 1, "message" : "Audio play stopped" };
    },
    seekToAudio: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (!audio) {
            result = {"status" : 2, "message" : "Audio Object has not been initialized"};
        } else if (args.length === 1) {
            result = {"status" : 9, "message" : "Media seek time argument not found"};
        } else {
            try {
                audio.currentTime = args[1];
            } catch (e) {
                console.log('Error seeking audio: ' + e);
                return {"status" : 3, "message" : "Error seeking audio: " + e};
            }

            result = {"status" : 1, "message" : "Seek to audio succeeded" };
        }
        return result;
    },
    pausePlayingAudio: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (!audio) {
            return {"status" : 2, "message" : "Audio Object has not been initialized"};
        }

        audio.pause();

        return {"status" : 1, "message" : "Audio paused" };
    },
    getCurrentPositionAudio: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (!audio) {
            return {"status" : 2, "message" : "Audio Object has not been initialized"};
        }

        return {"status" : 1, "message" : audio.currentTime };
    },
    getDuration: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (!audio) {
            return {"status" : 2, "message" : "Audio Object has not been initialized"};
        }

        return {"status" : 1, "message" : audio.duration };
    },
    startRecordingAudio: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        if (args.length <= 1) {
            return {"status" : 9, "message" : "Media start recording, insufficient arguments"};
        }

        blackberry.media.microphone.record(args[1], win, fail);
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },
    stopRecordingAudio: function (args, win, fail) {
    },
    release: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (audio) {
            if(audio.src !== ""){
                audio.src = undefined;
            }
            audioObjects[id] = undefined;
            //delete audio;
        }

        result = {"status" : 1, "message" : "Media resources released"};

        return result;
    }
};

});

// file: lib/blackberry/plugin/webworks/notification.js
define("cordova/plugin/webworks/notification", function(require, exports, module) {

var cordova = require('cordova');

module.exports = {
    alert: function (args, win, fail) {
        if (args.length !== 3) {
            return {"status" : 9, "message" : "Notification action - alert arguments not found"};
        }

        //Unpack and map the args
        var msg = args[0],
            title = args[1],
            btnLabel = args[2];

        blackberry.ui.dialog.customAskAsync.apply(this, [ msg, [ btnLabel ], win, { "title" : title } ]);
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },
    confirm: function (args, win, fail) {
        if (args.length !== 3) {
            return {"status" : 9, "message" : "Notification action - confirm arguments not found"};
        }

        //Unpack and map the args
        var msg = args[0],
            title = args[1],
            btnLabel = args[2],
            btnLabels = btnLabel.split(",");

        blackberry.ui.dialog.customAskAsync.apply(this, [msg, btnLabels, win, {"title" : title} ]);
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    }
};

});

// file: lib/common/symbols.js
define("cordova/symbols", function(require, exports, module) {

var modulemapper = require('cordova/modulemapper');

// Use merges here in case others symbols files depend on this running first,
// but fail to declare the dependency with a require().
modulemapper.merges('cordova', 'cordova');
modulemapper.clobbers('cordova/exec', 'cordova.exec');
modulemapper.clobbers('cordova/exec', 'Cordova.exec');

});

// file: lib/common/utils.js
define("cordova/utils", function(require, exports, module) {

var utils = exports;

/**
 * Defines a property getter / setter for obj[key].
 */
utils.defineGetterSetter = function(obj, key, getFunc, opt_setFunc) {
    if (Object.defineProperty) {
        var desc = {
            get: getFunc,
            configurable: true
        };
        if (opt_setFunc) {
            desc.set = opt_setFunc;
        }
        Object.defineProperty(obj, key, desc);
    } else {
        obj.__defineGetter__(key, getFunc);
        if (opt_setFunc) {
            obj.__defineSetter__(key, opt_setFunc);
        }
    }
};

/**
 * Defines a property getter for obj[key].
 */
utils.defineGetter = utils.defineGetterSetter;

utils.arrayIndexOf = function(a, item) {
    if (a.indexOf) {
        return a.indexOf(item);
    }
    var len = a.length;
    for (var i = 0; i < len; ++i) {
        if (a[i] == item) {
            return i;
        }
    }
    return -1;
};

/**
 * Returns whether the item was found in the array.
 */
utils.arrayRemove = function(a, item) {
    var index = utils.arrayIndexOf(a, item);
    if (index != -1) {
        a.splice(index, 1);
    }
    return index != -1;
};

utils.typeName = function(val) {
    return Object.prototype.toString.call(val).slice(8, -1);
};

/**
 * Returns an indication of whether the argument is an array or not
 */
utils.isArray = function(a) {
    return utils.typeName(a) == 'Array';
};

/**
 * Returns an indication of whether the argument is a Date or not
 */
utils.isDate = function(d) {
    return utils.typeName(d) == 'Date';
};

/**
 * Does a deep clone of the object.
 */
utils.clone = function(obj) {
    if(!obj || typeof obj == 'function' || utils.isDate(obj) || typeof obj != 'object') {
        return obj;
    }

    var retVal, i;

    if(utils.isArray(obj)){
        retVal = [];
        for(i = 0; i < obj.length; ++i){
            retVal.push(utils.clone(obj[i]));
        }
        return retVal;
    }

    retVal = {};
    for(i in obj){
        if(!(i in retVal) || retVal[i] != obj[i]) {
            retVal[i] = utils.clone(obj[i]);
        }
    }
    return retVal;
};

/**
 * Returns a wrapped version of the function
 */
utils.close = function(context, func, params) {
    if (typeof params == 'undefined') {
        return function() {
            return func.apply(context, arguments);
        };
    } else {
        return function() {
            return func.apply(context, params);
        };
    }
};

/**
 * Create a UUID
 */
utils.createUUID = function() {
    return UUIDcreatePart(4) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(6);
};

/**
 * Extends a child object from a parent object using classical inheritance
 * pattern.
 */
utils.extend = (function() {
    // proxy used to establish prototype chain
    var F = function() {};
    // extend Child from Parent
    return function(Child, Parent) {
        F.prototype = Parent.prototype;
        Child.prototype = new F();
        Child.__super__ = Parent.prototype;
        Child.prototype.constructor = Child;
    };
}());

/**
 * Alerts a message in any available way: alert or console.log.
 */
utils.alert = function(msg) {
    if (window.alert) {
        window.alert(msg);
    } else if (console && console.log) {
        console.log(msg);
    }
};


//------------------------------------------------------------------------------
function UUIDcreatePart(length) {
    var uuidpart = "";
    for (var i=0; i<length; i++) {
        var uuidchar = parseInt((Math.random() * 256), 10).toString(16);
        if (uuidchar.length == 1) {
            uuidchar = "0" + uuidchar;
        }
        uuidpart += uuidchar;
    }
    return uuidpart;
}


});


window.cordova = require('cordova');

// file: lib/scripts/bootstrap.js

(function (context) {
    var channel = require('cordova/channel');
    var platformInitChannelsArray = [channel.onNativeReady, channel.onPluginsReady];

    function logUnfiredChannels(arr) {
        for (var i = 0; i < arr.length; ++i) {
            if (arr[i].state != 2) {
                console.log('Channel not fired: ' + arr[i].type);
            }
        }
    }

    window.setTimeout(function() {
        if (channel.onDeviceReady.state != 2) {
            console.log('deviceready has not fired after 5 seconds.');
            logUnfiredChannels(platformInitChannelsArray);
            logUnfiredChannels(channel.deviceReadyChannelsArray);
        }
    }, 5000);

    // Replace navigator before any modules are required(), to ensure it happens as soon as possible.
    // We replace it so that properties that can't be clobbered can instead be overridden.
    function replaceNavigator(origNavigator) {
        var CordovaNavigator = function() {};
        CordovaNavigator.prototype = origNavigator;
        var newNavigator = new CordovaNavigator();
        // This work-around really only applies to new APIs that are newer than Function.bind.
        // Without it, APIs such as getGamepads() break.
        if (CordovaNavigator.bind) {
            for (var key in origNavigator) {
                if (typeof origNavigator[key] == 'function') {
                    newNavigator[key] = origNavigator[key].bind(origNavigator);
                }
            }
        }
        return newNavigator;
    }
    if (context.navigator) {
        context.navigator = replaceNavigator(context.navigator);
    }

    // _nativeReady is global variable that the native side can set
    // to signify that the native code is ready. It is a global since
    // it may be called before any cordova JS is ready.
    if (window._nativeReady) {
        channel.onNativeReady.fire();
    }

    /**
     * Create all cordova objects once native side is ready.
     */
    channel.join(function() {
        // Call the platform-specific initialization
        require('cordova/platform').initialize();

        // Fire event to notify that all objects are created
        channel.onCordovaReady.fire();

        // Fire onDeviceReady event once page has fully loaded, all
        // constructors have run and cordova info has been received from native
        // side.
        // This join call is deliberately made after platform.initialize() in
        // order that plugins may manipulate channel.deviceReadyChannelsArray
        // if necessary.
        channel.join(function() {
            require('cordova').fireDocumentEvent('deviceready');
        }, channel.deviceReadyChannelsArray);

    }, platformInitChannelsArray);

}(window));

// file: lib/scripts/bootstrap-blackberry.js

document.addEventListener("DOMContentLoaded", function () {
    switch(require('cordova/platform').runtime()) {
    case 'qnx':
        var wwjs = document.createElement("script");
        wwjs.src = "local:///chrome/webworks.js";
        wwjs.onload = function () {
            document.addEventListener("webworksready", function () {
                require('cordova/channel').onNativeReady.fire();
            });
        };
        wwjs.onerror = function () {
            console.error('there was a problem loading webworks.js');
        };
        document.head.appendChild(wwjs);
        break;
    case 'air':
        require('cordova/channel').onNativeReady.fire();
        break;
    case 'java':
        //nothing to do for java
        break;
    }
});

// file: lib/scripts/plugin_loader.js

// Tries to load all plugins' js-modules.
// This is an async process, but onDeviceReady is blocked on onPluginsReady.
// onPluginsReady is fired when there are no plugins to load, or they are all done.
(function (context) {
    // To be populated with the handler by handlePluginsObject.
    var onScriptLoadingComplete;

    var scriptCounter = 0;
    function scriptLoadedCallback() {
        scriptCounter--;
        if (scriptCounter === 0) {
            onScriptLoadingComplete && onScriptLoadingComplete();
        }
    }

    // Helper function to inject a <script> tag.
    function injectScript(path) {
        scriptCounter++;
        var script = document.createElement("script");
        script.onload = scriptLoadedCallback;
        script.src = path;
        document.head.appendChild(script);
    }

    // Called when:
    // * There are plugins defined and all plugins are finished loading.
    // * There are no plugins to load.
    function finishPluginLoading() {
        context.cordova.require('cordova/channel').onPluginsReady.fire();
    }

    // Handler for the cordova_plugins.json content.
    // See plugman's plugin_loader.js for the details of this object.
    // This function is only called if the really is a plugins array that isn't empty.
    // Otherwise the XHR response handler will just call finishPluginLoading().
    function handlePluginsObject(modules) {
        // First create the callback for when all plugins are loaded.
        var mapper = context.cordova.require('cordova/modulemapper');
        onScriptLoadingComplete = function() {
            // Loop through all the plugins and then through their clobbers and merges.
            for (var i = 0; i < modules.length; i++) {
                var module = modules[i];
                if (!module) continue;

                if (module.clobbers && module.clobbers.length) {
                    for (var j = 0; j < module.clobbers.length; j++) {
                        mapper.clobbers(module.id, module.clobbers[j]);
                    }
                }

                if (module.merges && module.merges.length) {
                    for (var k = 0; k < module.merges.length; k++) {
                        mapper.merges(module.id, module.merges[k]);
                    }
                }

                // Finally, if runs is truthy we want to simply require() the module.
                // This can be skipped if it had any merges or clobbers, though,
                // since the mapper will already have required the module.
                if (module.runs && !(module.clobbers && module.clobbers.length) && !(module.merges && module.merges.length)) {
                    context.cordova.require(module.id);
                }
            }

            finishPluginLoading();
        };

        // Now inject the scripts.
        for (var i = 0; i < modules.length; i++) {
            injectScript(modules[i].file);
        }
    }


    // Try to XHR the cordova_plugins.json file asynchronously.
    try { // we commented we were going to try, so let us actually try and catch
        var xhr = new context.XMLHttpRequest();
        xhr.onload = function() {
            // If the response is a JSON string which composes an array, call handlePluginsObject.
            // If the request fails, or the response is not a JSON array, just call finishPluginLoading.
            var obj = this.responseText && JSON.parse(this.responseText);
            if (obj && obj instanceof Array && obj.length > 0) {
                handlePluginsObject(obj);
            } else {
                finishPluginLoading();
            }
        };
        xhr.onerror = function() {
            finishPluginLoading();
        };
        xhr.open('GET', 'cordova_plugins.json', true); // Async
        xhr.send();
    }
    catch(err){
        finishPluginLoading();
    }
}(window));



})();var PhoneGap = cordova;
