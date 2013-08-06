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
/*jshint sub:true*/
var childProcess = require("child_process"),
    fs = require("fs"),
    path = require("path"),
    util = require("util"),
    data2xml = require("../third_party/data2xml/data2xml"),
    wrench = require("wrench"),
    conf = require("./conf"),
    logger = require("./logger"),
    localize = require("./localize"),
    pkgrUtils = require("./packager-utils"),
    i18nMgr = require("./i18n-manager"),
    NL = pkgrUtils.isWindows() ? "\r\n" : "\n";

function generateTabletXMLFile(session, config) {
    var files = wrench.readdirSyncRecursive(session.sourceDir),
        xmlObject = {
            id : config.id,
            versionNumber : config.version,
            author : config.author,
            asset : [{
                _attr : { entry : 'true', type : 'qnx/elf' },
                _value : 'wwe'
            }],
            entryPointType : {
                _value : "Qnx/WebKit"
            },
            cascadesTheme : {
                _value : config.theme
            },
            initialWindow : {
                systemChrome : 'none',
                transparent : 'true',
                autoOrients : 'true'
            },
            env : [{
                _attr : { value : '2.0.0', var : 'WEBWORKS_VERSION'}
            }],
            permission : [{
                _attr : { system : 'true'},
                _value : 'run_native'
            }, {
                // hardcoded access_internet to ensure user has internet (whitelist takes care of security)
                _attr : { system : 'false'},
                _value : 'access_internet'
            }]
        };

    // If appdesc is specified, use it as the bar descriptor
    if (session.appdesc) {
        pkgrUtils.copyFile(session.appdesc, session.sourceDir);
        return;
    }

    //Enable slog2 output if debugging
    if (session.debug) {
        xmlObject.env.push({
            _attr : { value : 'slog2', 'var' : 'CONSOLE_MODE' }
        });
    }

    //Write user specified permissions
    if (config.permissions) {
        config.permissions.forEach(function (permission) {
            var permissionAttr,
                permissionValue;

            if (typeof permission === "string") {
                //Permission with no attributes
                permissionValue = permission;
            } else if (permission["@"] && permission["#"]) {
                //Permission with attributes
                permissionAttr = permission["@"];
                permissionValue = permission["#"];
            }

            if (permissionValue) {
                xmlObject.permission.push({
                    _attr : permissionAttr,
                    _value : permissionValue
                });
            }
        });
    }

    i18nMgr.generateLocalizedText(session, config, xmlObject, "name");

    if (config.description) {
        i18nMgr.generateLocalizedText(session, config, xmlObject, "description");
    }

    i18nMgr.generateLocalizedMetadata(session, config, xmlObject, "icon");
    i18nMgr.generateLocalizedMetadata(session, config, xmlObject, "rim:splash");

    if (config["invoke-target"]) {
        xmlObject["invoke-target"] = [];

        config["invoke-target"].forEach(function (invokeTarget) {

            var xmlInvokeTarget = {
                "_attr" : { id : invokeTarget["@"]["id"] },
                "entry-point" : config.name,
                "type" : invokeTarget["type"]
            };

            if (invokeTarget["require-source-permissions"]) {
                xmlInvokeTarget["require-source-permissions"] = {
                    _value : invokeTarget["require-source-permissions"]
                };
            }

            if (invokeTarget.filter) {
                xmlInvokeTarget.filter = [];
                invokeTarget.filter.forEach(function (filter) {
                    var xmlFilter = {
                        "action" : filter.action,
                        "mime-type": filter["mime-type"]
                    };

                    if (filter.property) {
                        xmlFilter.property = [];
                        filter.property.forEach(function (property) {
                            xmlFilter.property.push({
                                "_attr": { var : property["@"]["var"], value : property["@"].value }
                            });
                        });
                    }

                    xmlInvokeTarget.filter.push(xmlFilter);
                });
            }

            xmlObject["invoke-target"].push(xmlInvokeTarget);

        });
    }

    //buildId
    if (config.buildId) {
        xmlObject.buildId = config.buildId;
    }

    if (files) {
        files.forEach(function (file) {
            file = path.resolve(session.sourceDir, file);

            if (file.indexOf(conf.BAR_DESCRIPTOR) < 0 && !fs.statSync(file).isDirectory()) {
                file = file.replace(/\\/g, "/");
                file = file.split("src/")[1];

                if (path.extname(file) === ".so") {
                    xmlObject.asset.push({
                        _attr : { type : 'qnx/elf' },
                        _value : file
                    });
                } else {
                    xmlObject.asset.push({
                        _value : file
                    });
                }
            }
        });
    }

    //Add orientation mode
    if (config.orientation) {
        xmlObject.initialWindow.aspectRatio = config.orientation;
    }

    //Add auto orientation
    xmlObject.initialWindow.autoOrients = config.autoOrientation;

    pkgrUtils.writeFile(session.sourceDir, conf.BAR_DESCRIPTOR, data2xml('qnx', xmlObject));
}

function generateOptionsFile(session, target, config) {
    var srcFiles = wrench.readdirSyncRecursive(session.sourceDir),
        isSigning = session.isSigningRequired(config),
        optionsStr = "-package" + NL,
        debugToken,
        params = session.getParams("blackberry-nativepackager");

    //if -d was provided and we are not signing [-g], set debugToken
    if (session.debug && !isSigning) {
        if (fs.existsSync(conf.DEBUG_TOKEN)) {
            debugToken = "-debugToken" + NL;
            debugToken += conf.DEBUG_TOKEN + NL;
        } else {
            logger.warn(localize.translate("EXCEPTION_DEBUG_TOKEN_NOT_FOUND"));
        }
    }

    if (target === "device" && isSigning) {
        optionsStr += "-buildId" + NL;
        optionsStr += config.buildId + NL;
    } else if (session.debug) {
        //DebugToken params
        optionsStr += "-devMode" + NL;
        optionsStr += (debugToken ? debugToken : "");
    }

    if (params) {
        Object.getOwnPropertyNames(params).forEach(function (p) {
            optionsStr += p + NL;

            if (params[p]) {
                optionsStr += params[p] + NL;
            }
        });
    }

    optionsStr += path.resolve(util.format(session.barPath, target)) + NL;

    //to supoprt splash screens/icons for multiple resolutions/devices
    optionsStr += "-barVersion" + NL;
    optionsStr += "1.5" + NL;

    optionsStr += "-C" + NL;
    optionsStr += session.sourceDir + NL;
    optionsStr += conf.BAR_DESCRIPTOR + NL;

    srcFiles.forEach(function (file) {
        file = path.resolve(session.sourceDir, file);

        if (file.indexOf(conf.BAR_DESCRIPTOR) < 0 && !fs.statSync(file).isDirectory()) {
            optionsStr += file + NL;
        }
    });

    fs.writeFileSync(path.normalize(session.sourceDir + "/options"), optionsStr);
}

function execNativePackager(session, callback) {
    var script = "blackberry-nativepackager",
        cwd = session.sourceDir,
        nativePkgr;

    if (pkgrUtils.isWindows()) {
        script += ".bat";
    }

    nativePkgr = childProcess.spawn(script, ["@options"], {
        "cwd": cwd,
        "env": process.env
    });

    nativePkgr.stdout.on("data", pkgrUtils.handleProcessOutput);

    nativePkgr.stderr.on("data", pkgrUtils.handleProcessOutput);

    nativePkgr.on("exit", function (code) {
        if (callback && typeof callback === "function") {
            callback(code);
        }
    });
}

module.exports = {
    exec: function (session, target, config, callback) {
        generateOptionsFile(session, target, config);
        generateTabletXMLFile(session, config);
        execNativePackager(session, callback);
    }
};
