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
var fs = require("fs"),
    util = require('util'),
    xml2js = require('xml2js'),
    packagerUtils = require('./packager-utils'),
    check = require('validator').check,
    sanitize = require('validator').sanitize,
    localize = require("./localize"),
    logger = require("./logger"),
    fileManager = require("./file-manager"),
    utils = require("./packager-utils"),
    i18nMgr = require("./i18n-manager"),
    _self,
    _predefinedFeatures,
    _hybridFeatures;

//This function will convert a wc3 paramObj with a list of
//<param name="" value=""> elements into a single object
function processParamObj(paramObj) {
    var processedObj = {},
        attribs,
        paramName,
        paramValue;

    if (paramObj) {
        //Convert to array for single param entries where only an object is created
        if (!Array.isArray(paramObj)) {
            paramObj = [paramObj];
        }

        paramObj.forEach(function (param) {
            attribs = param["@"];

            if (attribs) {
                paramName = attribs["name"];
                paramValue = attribs["value"];

                if (paramName && paramValue) {
                    //Add the key/value pair to the processedObj
                    processedObj[paramName] = paramValue;
                }
            }
        });
    }

    return processedObj;
}

function processFeatures(featuresArray, widgetConfig, processPredefinedFeatures) {
    var features = [],
        attribs;
    if (featuresArray) {
        featuresArray.forEach(function (feature) {
            attribs = feature["@"];
            if (attribs) {
                attribs.required = packagerUtils.toBoolean(attribs.required, true);

                // We do NOT want to auto defer networking and JavaScript if the
                // blackberry.push feature is being used
                if (attribs.id === "blackberry.push") {
                    widgetConfig.autoDeferNetworkingAndJavaScript = false;
                }

                if (_predefinedFeatures[attribs.id]) {
                    //Handle features that do NOT contain an API namespace
                    if (processPredefinedFeatures) {
                        _predefinedFeatures[attribs.id](feature, widgetConfig);
                    }
                } else {
                    //Handle features that contain both a namespace and custom params
                    if (_hybridFeatures[attribs.id]) {
                        _hybridFeatures[attribs.id](feature, widgetConfig);
                    }
                    features.push(attribs);
                }
            } else {
                features.push(attribs);
            }
        });
    }

    return features;
}

function createAccessListObj(uri, allowSubDomain) {
    return {
        uri: uri,
        allowSubDomain: allowSubDomain
    };
}

function processVersion(widgetConfig) {
    if (widgetConfig.version) {
        var versionArray = widgetConfig.version.split(".");

        //if 4rth number in version exists, extract for build id
        if (versionArray.length > 3) {
            widgetConfig.buildId = versionArray[3];
            widgetConfig.version = widgetConfig.version.substring(0, widgetConfig.version.lastIndexOf('.'));
        }
    }
}

function processBuildID(widgetConfig, session) {
    if (session.buildId) {
        //user specified a build id (--buildId), overide any previously set build id
        widgetConfig.buildId = session.buildId;
    }
}

function processWidgetData(data, widgetConfig, session) {
    var attribs, featureArray, header;

    if (data["@"]) {
        widgetConfig.version = data["@"].version;
        widgetConfig.id = data["@"].id;

        if (data["@"]["rim:header"]) {
            widgetConfig.customHeaders = {};
            header = data["@"]["rim:header"].split(":");
            // Just set it for now, in the future we can append them
            widgetConfig.customHeaders[header[0]] = header[1];
        }

        if (data["@"]["rim:userAgent"]) {
            widgetConfig.userAgent = data["@"]["rim:userAgent"];
        }
    }

    //Default values
    widgetConfig.hasMultiAccess = false;
    widgetConfig.accessList = [];
    widgetConfig.enableFlash = false;
    widgetConfig.autoOrientation = true;
    widgetConfig.autoDeferNetworkingAndJavaScript = true;
    widgetConfig.theme = "default";
    widgetConfig.autoHideSplashScreen = "true";

    //set locally available features to access list
   if (data.feature) {
        featureArray = packagerUtils.isArray(data.feature) ? data.feature : [data.feature];
    }

    //Handle features that do not have source code
    featureArray = processFeatures(featureArray, widgetConfig, true);

    //Push empty WIDGET_LOCAL access obj until whitelisting is cleaned up
    widgetConfig.accessList.push(createAccessListObj("WIDGET_LOCAL", true));

    //add whitelisted features to access list
    if (data.access) {
        //If there is only one access list element, it will be parsed as an object and not an array
        if (!packagerUtils.isArray(data.access)) {
            data.access = [data.access];
        }

        data.access.forEach(function (accessElement) {
            attribs = accessElement["@"];

            if (attribs) {
                if (attribs.uri === "*") {
                    if (accessElement.feature) {
                        throw localize.translate("EXCEPTION_FEATURE_DEFINED_WITH_WILDCARD_ACCESS_URI");
                    }

                    widgetConfig.hasMultiAccess = true;
                } else {
                    attribs.subdomains = packagerUtils.toBoolean(attribs.subdomains);
                    widgetConfig.accessList.push(createAccessListObj(attribs.uri, attribs.subdomains));
                }
            }
        });
    }
}

function trim(obj) {
    return (typeof obj === "string" ? obj.trim() : obj);
}

function processSplashScreenIconSrc(data, widgetConfig, key) {
    if (data[key]) {
        widgetConfig[key] = [];

        if (!(data[key] instanceof Array)) {
            data[key] = [data[key]];
        }

        data[key].forEach(function (obj) {
            if (obj["@"]) {
                widgetConfig[key].push(obj["@"].src);
            } else {
                widgetConfig[key].push(obj);
            }
        });
    }
}

function processSplashScreenData(data, widgetConfig) {
    //
    // This takes config.xml markup in the form of:
    //
    // <rim:splash src="splash-1280x768.jpg" />
    // <rim:splash src="splash-768x1280.jpg" />
    // <rim:splash src="splash-1024x600.jpg" />
    // <rim:splash src="splash-600x1024.jpg" />
    //
    // and turns it into:
    //
    // icon: ["splash-1280x768.jpg", "splash-768x1280.jpg", "splash-1024x600.jpg", "splash-600x1024.jpg"]
    //
    // Folder-based localization now done in i18n-manager
    //
    processSplashScreenIconSrc(data, widgetConfig, "rim:splash");
}

function processIconData(data, widgetConfig, session) {
    //
    // This takes config.xml markup in the form of:
    //
    // <icon src="icon-86.png" />
    // <icon src="icon-150.png" />
    //
    // and turns it into:
    //
    // icon: ["icon-86.png", "icon-150.png"]
    //
    // Folder-based localization now done in i18n-manager
    //
    var default_icon_filename = "default-icon.png",
        default_icon_src = session.conf.DEFAULT_ICON,
        default_icon_dst = session.sourceDir;

    processSplashScreenIconSrc(data, widgetConfig, "icon");

    if (!widgetConfig.icon) {
        packagerUtils.copyFile(default_icon_src, default_icon_dst);

        widgetConfig["icon"] = [];
        widgetConfig["icon"].push(default_icon_filename);
    }
}

function validateSplashScreensIcon(widgetConfig, key) {
    if (widgetConfig[key]) {
        var msg = localize.translate(key === "icon" ? "EXCEPTION_INVALID_ICON_SRC" : "EXCEPTION_INVALID_SPLASH_SRC");

        if (widgetConfig[key].length === 0) {
            // element without src attribute
            throw msg;
        } else {
            widgetConfig[key].forEach(function (src) {
                var msg2 = localize.translate(key === "icon" ? "EXCEPTION_INVALID_ICON_SRC_LOCALES" : "EXCEPTION_INVALID_SPLASH_SRC_LOCALES");

                // check that src attribute is specified and is not empty
                check(src, msg).notNull();

                // check that src attribute does not start with reserved locales folder
                src = src.replace(/\\/g, "/");
                check(src, msg2).notRegex("^" + i18nMgr.LOCALES_DIR + "\/");
            });
        }

    }
}

function processAuthorData(data, widgetConfig) {
    if (data.author) {
        var attribs = data.author["@"];

        if (!attribs && typeof data.author === "string") {
            //do not sanitize empty objects {} (must be string)
            widgetConfig.author = sanitize(data.author).trim();
        } else if (data.author["#"]) {
            widgetConfig.author = sanitize(data.author["#"]).trim();
        }

        if (attribs) {
            widgetConfig.authorURL = attribs.href;
            widgetConfig.copyright = attribs["rim:copyright"];
            widgetConfig.authorEmail = attribs.email;
        }
    }
}

function processLicenseData(data, widgetConfig) {
    if (data.license && data.license["#"]) {
        widgetConfig.license = data.license["#"];
    } else {
        widgetConfig.license = "";
    }

    if (data.license && data.license["@"]) {
        widgetConfig.licenseURL = data.license["@"].href;
    } else {
        widgetConfig.licenseURL = "";
    }
}

function processContentData(data, widgetConfig) {
    if (data.content) {
        var attribs  = data.content["@"],
            startPage;
        if (attribs) {
            widgetConfig.content = attribs.src;

            startPage = packagerUtils.parseUri(attribs.src);

            // if start page is local but does not start with local:///, will prepend it
            // replace any backslash with forward slash
            if (!packagerUtils.isAbsoluteURI(startPage) && !packagerUtils.isLocalURI(startPage)) {
                if (!startPage.relative.match(/^\//)) {
                    widgetConfig.content = "local:///" + startPage.relative.replace(/\\/g, "/");
                } else {
                    widgetConfig.content = "local://" + startPage.relative.replace(/\\/g, "/");
                }
            }

            widgetConfig.foregroundSource = attribs.src;
            widgetConfig.contentType = attribs.type;
            widgetConfig.contentCharSet = attribs.charset;
            widgetConfig.allowInvokeParams = attribs["rim:allowInvokeParams"];
            //TODO content rim:background
        }
    }
}

function processPermissionsData(data, widgetConfig) {
    if (data["rim:permissions"] && data["rim:permissions"]["rim:permit"]) {
        var permissions = data["rim:permissions"]["rim:permit"];

        if (permissions instanceof Array) {
            widgetConfig.permissions = permissions;
        } else {
            //user entered one permission and it comes in as an object
            widgetConfig.permissions = [permissions];
        }
    } else {
        widgetConfig.permissions = [];
    }

    // We do NOT want to auto defer networking and JavaScript if the
    // run_when_backgrounded permission is set
    if (widgetConfig.permissions.indexOf("run_when_backgrounded") >= 0) {
        widgetConfig.autoDeferNetworkingAndJavaScript = false;
    }
}

function processInvokeTargetsData(data, widgetConfig) {

    if (data["rim:invoke-target"]) {
        widgetConfig["invoke-target"] = data["rim:invoke-target"];

        //If invoke-target is not an array, wrap the invoke-target in an array
        utils.wrapPropertyInArray(widgetConfig, "invoke-target");

        widgetConfig["invoke-target"].forEach(function (invokeTarget) {
            if (invokeTarget.type && !packagerUtils.isEmpty(invokeTarget.type)) {
                invokeTarget.type = invokeTarget.type.toUpperCase();
            }

            if (invokeTarget.filter) {
                utils.wrapPropertyInArray(invokeTarget, "filter");

                invokeTarget.filter.forEach(function (filter) {

                    if (filter["action"]) {
                        utils.wrapPropertyInArray(filter, "action");
                    }

                    if (filter["mime-type"]) {
                        utils.wrapPropertyInArray(filter, "mime-type");
                    }

                    if (filter["property"]) {
                        utils.wrapPropertyInArray(filter, "property");
                    }
                });
            }
        });
    }
}

function validateConfig(widgetConfig) {
    check(widgetConfig.version, localize.translate("EXCEPTION_INVALID_VERSION"))
        .notNull()
        .regex("^[0-9]{1,3}([.][0-9]{1,3}){2,3}$");

    for (var prop in widgetConfig.name) {
        if (widgetConfig.name.hasOwnProperty(prop)) {
            check(widgetConfig.name[prop], localize.translate("EXCEPTION_INVALID_NAME")).notEmpty();
        }
    }

    check(widgetConfig.author, localize.translate("EXCEPTION_INVALID_AUTHOR")).notNull();
    check(widgetConfig.id, localize.translate("EXCEPTION_INVALID_ID")).notNull().notEmpty();
    check(widgetConfig.content, localize.translate("EXCEPTION_INVALID_CONTENT"))
        .notNull()
        .notEmpty();

    validateSplashScreensIcon(widgetConfig, "rim:splash");

    validateSplashScreensIcon(widgetConfig, "icon");

    if (widgetConfig.accessList) {
        widgetConfig.accessList.forEach(function (access) {
            if (access.uri) {
                if (access.uri !== "WIDGET_LOCAL") {
                    check(access.uri, localize.translate("EXCEPTION_INVALID_ACCESS_URI_NO_PROTOCOL", access.uri))
                        .regex("^[a-zA-Z]+:\/\/");
                    check(access.uri, localize.translate("EXCEPTION_INVALID_ACCESS_URI_NO_URN", access.uri))
                        .notRegex("^[a-zA-Z]+:\/\/$");
                }
            }

            if (access.features) {
                // Assert each feature has a proper ID and is not empty
                access.features.forEach(function (feature) {
                    if (!feature) {
                        throw localize.translate("EXCEPTION_INVALID_FEATURE_ID");
                    }
                    check(feature.id, localize.translate("EXCEPTION_INVALID_FEATURE_ID")).notNull().notEmpty();
                });
            }

        });
    }

    if (widgetConfig["invoke-target"]) {

        widgetConfig["invoke-target"].forEach(function (invokeTarget) {

            check(typeof invokeTarget["@"] === "undefined",
                    localize.translate("EXCEPTION_INVOKE_TARGET_INVALID_ID"))
                .equals(false);
            check(invokeTarget["@"].id, localize.translate("EXCEPTION_INVOKE_TARGET_INVALID_ID"))
                .notNull()
                .notEmpty();
            check(invokeTarget.type, localize.translate("EXCEPTION_INVOKE_TARGET_INVALID_TYPE"))
                .notNull()
                .notEmpty();

            if (invokeTarget.filter) {

                invokeTarget.filter.forEach(function (filter) {

                    check(filter["action"] && filter["action"] instanceof Array && filter["action"].length > 0,
                            localize.translate("EXCEPTION_INVOKE_TARGET_ACTION_INVALID"))
                        .equals(true);

                    check(filter["mime-type"] && filter["mime-type"] instanceof Array && filter["mime-type"].length > 0,
                            localize.translate("EXCEPTION_INVOKE_TARGET_MIME_TYPE_INVALID"))
                        .equals(true);

                    if (filter.property) {
                        filter.property.forEach(function (property) {
                            check(property["@"] && property["@"]["var"] && typeof property["@"]["var"] === "string",
                                    localize.translate("EXCEPTION_INVOKE_TARGET_FILTER_PROPERTY_INVALID"))
                                .equals(true);
                        });
                    }
                });
            }
        });
    }
}

function processLocalizedText(tag, data, widgetConfig) {
    var tagData = data[tag],
        DEFAULT = 'default';

    function processLanguage(tagElement) {
        var attribs = tagElement['@'],
            language;

        if (attribs) {
            language = attribs['xml:lang'] || DEFAULT;
            widgetConfig[tag][language.toLowerCase()] = tagElement['#'];
        } else {
            widgetConfig[tag][DEFAULT] = tagElement;
        }
    }

    if (Array.isArray(tagData)) {
        //i.e. <element xml:lang="en">english value</element>
        //     <element xml:lang="fr">french value</element>
        tagData.forEach(processLanguage);
    } else if (tagData instanceof Object) {
        //i.e. <element xml:lang="en">english value</element>
        processLanguage(tagData);
    } else {
        //i.e <element>value</element>
        widgetConfig[tag][DEFAULT] = tagData;
    }
}

function processNameAndDescription(data, widgetConfig) {
    widgetConfig.name = {};
    widgetConfig.description = {};

    processLocalizedText('name', data, widgetConfig);
    processLocalizedText('description', data, widgetConfig);
}

function processCordovaPreferences(data, widgetConfig) {
    if (data.preference) {
        var preference = processParamObj(data.preference);
        widgetConfig.packageCordovaJs = preference.packageCordovaJs === "enable";
        widgetConfig.autoHideSplashScreen = preference.AutoHideSplashScreen !== "false";
    }
}

function processResult(data, session) {
    var widgetConfig = {};

    processWidgetData(data, widgetConfig, session);
    processIconData(data, widgetConfig, session);
    processAuthorData(data, widgetConfig);
    processLicenseData(data, widgetConfig);
    processContentData(data, widgetConfig);
    processPermissionsData(data, widgetConfig);
    processInvokeTargetsData(data, widgetConfig);
    processSplashScreenData(data, widgetConfig);
    processNameAndDescription(data, widgetConfig);
    processCordovaPreferences(data, widgetConfig);

    widgetConfig.configXML = "config.xml";

    //validate the widgetConfig
    validateConfig(widgetConfig);

    //special handling for version and grabbing the buildId if specified (4rth number)
    processVersion(widgetConfig);

    //if --buildId was specified, it takes precedence
    processBuildID(widgetConfig, session);

    return widgetConfig;
}

function init() {
    //Predefined features are features that do NOT contain an API namespace
    _predefinedFeatures = {
        "enable-flash" : function (feature, widgetConfig) {
            widgetConfig.enableFlash = true;
        },
        "blackberry.app.orientation": function (feature, widgetConfig) {
            if (feature) {
                var params = processParamObj(feature.param),
                    mode = params.mode;

                if (!mode) {
                    //No mode provided, throw error
                    throw localize.translate("EXCEPTION_EMPTY_ORIENTATION_MODE", mode);
                } else if (mode === "landscape" || mode === "portrait" || mode === "north") {
                    widgetConfig.autoOrientation = false;//Overwrites default value
                    widgetConfig.orientation = mode;
                } else if (mode !== "auto") {
                    //Mode invalid, throw error
                    throw localize.translate("EXCEPTION_INVALID_ORIENTATION_MODE", mode);
                }

                // Throw a warning since this feature is deprecated
                logger.warn(localize.translate("WARNING_ORIENTATION_DEPRECATED"));
            }
        }
    };

    //Hybrid features are features that have both an API namespace and custom parameters
    _hybridFeatures = {
        "blackberry.app": function (feature, widgetConfig) {
            if (feature) {
                var params = processParamObj(feature.param),
                    bgColor = params.backgroundColor,
                    childBrowser = params.childBrowser,
                    formControl = params.formControl,
                    orientation = params.orientation,
                    theme = params.theme,
                    popupBlocker = params.popupBlocker,
                    websecurity = params.websecurity;

                if (bgColor) {
                    //Convert bgColor to a number
                    bgColor = parseInt(bgColor, 16);

                    if (isNaN(bgColor)) {
                        //bgcolor is not a number, throw error
                        throw localize.translate("EXCEPTION_BGCOLOR_INVALID", params.backgroundColor);
                    } else {
                        widgetConfig.backgroundColor = bgColor;
                    }
                }

                if (childBrowser) {
                    widgetConfig.enableChildWebView = ((childBrowser + '').toLowerCase() === 'disable') === false;
                }

                if (formControl) {
                    widgetConfig.enableFormControl = ((formControl + '').toLowerCase() === 'disable') === false;
                }

                if (popupBlocker) {
                    widgetConfig.enablePopupBlocker = ((popupBlocker + '').toLowerCase() === 'enable') === true;
                }

                if (orientation) {
                    if (orientation ===  "landscape" || orientation === "portrait" || orientation === "north") {
                        widgetConfig.autoOrientation = false;
                        widgetConfig.orientation = orientation;
                    } else if (orientation !== "auto") {
                        throw localize.translate("EXCEPTION_INVALID_ORIENTATION_MODE", orientation);
                    }
                }

                if (theme && (typeof theme === "string")) {
                    theme = theme.toLowerCase();

                    if (theme ===  "bright" || theme === "dark" || theme === "inherit" || theme ===  "default") {
                        widgetConfig.theme = theme;
                    }
                }

                if (websecurity && (typeof websecurity === "string") && (websecurity.toLowerCase() === "disable")) {
                    widgetConfig.enableWebSecurity = false;
                    logger.warn(localize.translate("WARNING_WEBSECURITY_DISABLED"));
                }
            }
        }
    };
}

_self = {
    parse: function (xmlPath, session, callback) {
        if (!fs.existsSync(xmlPath)) {
            throw localize.translate("EXCEPTION_CONFIG_NOT_FOUND");
        }

        var fileData = fs.readFileSync(xmlPath),
            xml = utils.bufferToString(fileData),
            parser = new xml2js.Parser({trim: true, normalize: true, explicitRoot: false});

        init();

        //parse xml file data
        parser.parseString(xml, function (err, result) {
            if (err) {
                logger.error(localize.translate("EXCEPTION_PARSING_XML"));
                fileManager.cleanSource(session);
            } else {
                callback(processResult(result, session));
            }
        });
    }
};

module.exports = _self;
