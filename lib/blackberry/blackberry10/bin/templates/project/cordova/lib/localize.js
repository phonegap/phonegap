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

var Localize = require("localize"),
    loc = new Localize({
        "EXCEPTION_NATIVEPACKAGER": {
            "en": "Native Packager exception occurred"
        },
        "EXCEPTION_WIDGET_ARCHIVE_NOT_FOUND": {
            "en": "Failed to find WebWorks archive: $[1]"
        },
        "EXCEPTION_MISSING_SIGNING_KEY_FILE": {
            "en": "Cannot sign application - failed to find signing key file: $[1]"
        },
        "WARNING_MISSING_SIGNING_KEY_FILE": {
            "en": "Build ID set in config.xml [version], but signing key file was not found: $[1]"
        },
        "EXCEPTION_MISSING_SIGNING_PASSWORD": {
            "en": "Cannot sign application - No signing password provided [-g]"
        },
        "WARNING_SIGNING_PASSWORD_EXPECTED": {
            "en": "Build ID set in config.xml [version], but no signing password was provided [-g]. Bar will be unsigned"
        },
        "EXCEPTION_MISSING_SIGNING_BUILDID": {
            "en": "Cannot sign application - No buildId provided [--buildId]"
        },
        "EXCEPTION_DEBUG_TOKEN_NOT_FOUND": {
            "en": "Failed to find debug token"
        },
        "EXCEPTION_DEBUG_TOKEN_WRONG_FILE_EXTENSION": {
            "en": "Specified debug token not a .bar extension"
        },
        "PROGRESS_SESSION_CONFIGXML": {
            "en": "Parsing config.xml"
        },
        "PROGRESS_FILE_POPULATING_SOURCE": {
            "en": "Populating application source"
        },
        "PROGRESS_GEN_OUTPUT": {
            "en": "Generating output files"
        },
        "PROGRESS_PACKAGING": {
            "en": "Packaging the BAR file"
        },
        "PROGRESS_COMPLETE": {
            "en": "BAR packaging complete"
        },
        "EXCEPTION_PARSING_XML": {
            "en": "An error has occurred parsing the config.xml. Please ensure that it is syntactically correct"
        },
        "EXCEPTION_INVALID_VERSION": {
            "en": "Please enter a valid application version"
        },
        "EXCEPTION_INVALID_NAME": {
            "en": "Please enter a valid application name"
        },
        "EXCEPTION_INVALID_AUTHOR": {
            "en": "Please enter an author for the application"
        },
        "EXCEPTION_INVALID_ID": {
            "en": "Please enter an application id"
        },
        "EXCEPTION_INVALID_CONTENT": {
            "en": "Invalid config.xml - failed to parse the <content> element(Invalid source or the source is not specified.)"
        },
        "EXCEPTION_INVALID_FEATURE_ID": {
            "en": "Invalid <feature> element - failed to find the id attribute"
        },
        "EXCEPTION_BUFFER_ERROR": {
            "en": "ERROR in bufferToString(): Buffer length must be even"
        },
        "EXCEPTION_FEATURE_DEFINED_WITH_WILDCARD_ACCESS_URI": {
            "en": "Invalid config.xml - no <feature> tags are allowed for this <access> element"
        },
        "EXCEPTION_INVALID_ACCESS_URI_NO_PROTOCOL": {
            "en": "Invalid URI attribute in the access element - protocol required($[1])"
        },
        "EXCEPTION_INVALID_ACCESS_URI_NO_URN": {
            "en": "Failed to parse the URI attribute in the access element($[1])"
        },
        "EXCEPTION_CMDLINE_ARG_INVALID": {
            "en": "Invalid command line argument \"$[1]\""
        },
        "EXCEPTION_INVOKE_TARGET_INVALID_ID": {
            "en": "Each rim:invoke-target element must specify a valid id attribute"
        },
        "EXCEPTION_INVOKE_TARGET_INVALID_TYPE": {
            "en": "rim:invoke-target element must be specified and cannot be empty"
        },
        "EXCEPTION_INVOKE_TARGET_ACTION_INVALID": {
            "en": "Each filter element must specify at least one valid action"
        },
        "EXCEPTION_INVOKE_TARGET_MIME_TYPE_INVALID": {
            "en": "Each filter element must specify at least one valid mime-type"
        },
        "EXCEPTION_INVOKE_TARGET_FILTER_PROPERTY_INVALID": {
            "en": "At least one property element in an invoke filter is invalid"
        },
        "EXCEPTION_INVALID_ICON_SRC": {
            "en": "Icon src cannot be empty"
        },
        "EXCEPTION_INVALID_SPLASH_SRC": {
            "en": "Splash src cannot be empty"
        },
        "EXCEPTION_INVALID_ICON_SRC_LOCALES": {
            "en": "Icon src should not point to files under \"locales\" folder, bbwp will perform folder-based localization"
        },
        "EXCEPTION_INVALID_SPLASH_SRC_LOCALES": {
            "en": "Splash src should not point to files under \"locales\" folder, bbwp will perform folder-based localization"
        },
        "EXCEPTION_EXTENSION_CIRCULAR_DEPENDENCY": {
            "en": "Circular dependency detected for extension: \"$[1]\""
        },
        "EXCEPTION_EXTENSION_NOT_FOUND": {
            "en": "Extension \"$[1]\" not found in \"ext\" folder"
        },
        "EXCEPTION_PARAMS_FILE_ERROR": {
            "en": "An error has occurred parsing \"$[1]\""
        },
        "EXCEPTION_PARAMS_FILE_NOT_FOUND": {
            "en": "\"$[1]\" does not exist"
        },
        "EXCEPTION_MISSING_TOOLS": {
            "en": "BBNDK tools could not be found. Please ensure you have installed the BlackBerry Native SDK [http://developer.blackberry.com/native/] and have the PATH configured via bbndk-env script."
        },
        "EXCEPTION_INVALID_ORIENTATION_MODE": {
            "en": "\"$[1]\" is not a valid orientation mode"
        },
        "EXCEPTION_EMPTY_ORIENTATION_MODE": {
            "en": "blackberry.app.orientation parameter \"mode\" missing"
        },
        "EXCEPTION_BGCOLOR_INVALID" : {
            "en": "Background color \"$[1]\" is not a valid number"
        },
        "EXCEPTION_CONFIG_NOT_FOUND" : {
            "en": "No config.xml file was found at the root of the .zip file"
        },
        "EXCEPTION_CORDOVA_JS_IN_LIB_DIR" : {
            "en": "$[1] cordova.js files found in lib"
        },
        "WARN_CORDOVA_JS_PACKAGED" : {
            "en": "cordova.js is now packaged as local:///chrome/cordova.js"
        },
        "WARN_WEBPLATFORM_JS_PACKAGED" : {
            "en": "webplatform.js has been packaged as an alternative to the on device version"
        },
        "WARN_WEBPLATFORM_I18N_PACKAGED" : {
            "en": "i18n.js has been packaged as an alternative to the on device version"
        },
        "EXCEPTION_INVALID_ARCHIVE_PATH" : {
            "en": "An archive or directory does not exist at the path specified: \"$[1]\""
        },
        "EXCEPTION_APPDESC_NOT_FOUND" : {
            "en": "The bar descriptor file does not exist at the path specified: \"$[1]\""
        },
        "WARNING_ORIENTATION_DEPRECATED": {
            "en": "blackberry.app.orientation has been deprecated, please use blackberry.app instead"
        },
        "WARNING_WEBSECURITY_DISABLED": {
            "en": "You have disabled all web security in this WebWorks application"
        },
        "PROGRESS_DEBUG_TOKEN_IS_VALID": {
            "en": "The existing debug token is valid"
        },
        "WARN_TARGET_NOT_EXIST": {
            "en": "The target \"$[1]\" does not exist"
        },
        "WARN_IP_NOT_DEFINED": {
            "en": "IP is not defined in target \"$[1]\""
        },
        "WARN_PASSWORD_NOT_DEFINED": {
            "en": "Password is not defined in target \"$[1]\""
        },
        "PROGRESS_DEPLOYING_DEBUG_TOKEN": {
            "en": "Deploying debug token to target \"$[1]\""
        },
        "WARN_NO_DEVICE_PIN_FOUND": {
            "en": "No device PIN found, will omit debug token generation"
        },
        "WARN_NO_SIGNING_PASSWORD_PROVIDED": {
            "en": "No signing password provided, will omit debug token generation"
        },
        "PROGRESS_GENERATING_DEBUG_TOKEN": {
            "en": "Generating debug token"
        }

    }, "", ""); // TODO maybe a bug in localize, must set default locale to "" in order get it to work

loc.setLocale("en");

module.exports = loc;
