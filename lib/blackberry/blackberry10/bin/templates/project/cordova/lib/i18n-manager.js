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
var path = require("path"),
    fs = require("fs"),
    wrench = require("wrench"),
    pkgrUtils = require("./packager-utils"),
    LOCALES_DIR = "locales";

// Given a list of locale files (as follows), based on un-localized splash/icon definition, generate
// localized splash/icon metadata.
//
// zh-hans-cn/a.gif
// zh-hans-cn/f.gif
// zh-hans-cn/images/splash-1024x600.png
// zh-hans-cn/images/splash-600x1024.png
// zh-hans/a.gif
// zh-hans/b.gif
// zh/a.gif
// zh/b.gif
// zh/c.gif
function generateLocalizedMetadataForSplashScreenIcon(config, configKey, xmlObject, xmlObjectKey, localeFiles) {
    // localeMap looks like this:
    // {
    //     "zh-hans-cn": ["a.gif", "f.gif", "images/splash-1024x600.png", "images/splash-600x1024.png"],
    //     "zh-hans": ["a.gif", "b.gif"],
    //     "zh": ["a.gif", "b.gif", "c.gif"]
    // }
    var localeMap = {};

    if (localeFiles) {
        localeFiles.forEach(function (path) {
            var splitted = path.replace(/\.\./g, "").split("/"),
                locale;

            splitted = splitted.filter(function (element) {
                return element.length > 0;
            });

            if (splitted.length > 1) {
                locale = splitted[0];

                if (!localeMap[locale]) {
                    localeMap[locale] = [];
                }

                // remove locale subfolder from path
                splitted.splice(0, 1);
                localeMap[locale].push(splitted.join("/"));
            }
        });
    }

    xmlObject[xmlObjectKey] = {};
    xmlObject[xmlObjectKey]["image"] = [];

    if (config[configKey]) {
        config[configKey].forEach(function (imgPath) {
            imgPath = imgPath.replace(/\\/g, "/"); // replace any backslash with forward slash

            Object.getOwnPropertyNames(localeMap).forEach(function (locale) {
                if (localeMap[locale].indexOf(imgPath) !== -1) {
                    // localized image found for locale
                    xmlObject[xmlObjectKey]["image"].push({
                        text: {
                            _attr: {
                                "xml:lang": locale
                            },
                            _value: LOCALES_DIR + "/" + locale + "/" + imgPath
                        }
                    });
                }
            });

            xmlObject[xmlObjectKey]["image"].push({
                _value: imgPath
            });
        });
    }
}

function generateLocalizedText(session, config, xmlObject, key) {
    var localizedText = config[key],
        textElements = [],
        locale;

    for (locale in localizedText) {
        if (localizedText.hasOwnProperty(locale)) {
            //Don't add default locale and don't add locale if it already exists
            if (locale !== 'default' && textElements && textElements.indexOf(locale) === -1) {
                textElements.push({
                    _attr: {
                        "xml:lang": locale
                    },
                    _value: localizedText[locale]
                });
            }
        }
    }

    xmlObject[key] = {
        _value: localizedText['default'],
        text: textElements
    };
}

function generateLocalizedMetadata(session, config, xmlObject, key) {
    if (config.icon || config["rim:splash"]) {
        var localeFiles,
            normalizedLocaleFiles = [];

        if (fs.existsSync(session.sourceDir + "/" + LOCALES_DIR)) {
            localeFiles = wrench.readdirSyncRecursive(session.sourceDir + "/" + LOCALES_DIR);
            if (pkgrUtils.isWindows()) {

                localeFiles.forEach(function (file) {
                    file = path.relative(path.resolve(session.sourceDir, "locales"), file).replace(/\\/g, "/");
                    normalizedLocaleFiles.push(file);
                });
            } else {
                normalizedLocaleFiles = localeFiles;
            }
        }

        generateLocalizedMetadataForSplashScreenIcon(config, key, xmlObject, key === "rim:splash" ? "splashScreens" : key, normalizedLocaleFiles);
    }
}

module.exports = {
    LOCALES_DIR: LOCALES_DIR,
    generateLocalizedMetadata: generateLocalizedMetadata,
    generateLocalizedText: generateLocalizedText
};
