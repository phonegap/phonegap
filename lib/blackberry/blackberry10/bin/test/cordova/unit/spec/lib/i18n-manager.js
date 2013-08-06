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
var testData = require("./test-data"),
    i18nMgr = require(testData.libPath + "/i18n-manager"),
    session = testData.session,
    fs = require("fs"),
    wrench = require("wrench"),
    pkgrUtils = require(testData.libPath + "/packager-utils");

function mockOSReturnFiles(files) {
    if (pkgrUtils.isWindows()) {
        var newFiles = [];
        files.forEach(function (f) {
            newFiles.push(session.sourceDir + "\\locales\\" + f.split("/").join("\\"));
        });
        return newFiles;
    } else {
        return files;
    }
}

describe("i18n manager", function () {
    it("generate correct metadata for icon", function () {
        var config = {
                icon: ["logo.png"]
            },
            xmlObject = {};

        spyOn(fs, "existsSync").andReturn(true);
        spyOn(wrench, "readdirSyncRecursive").andReturn(mockOSReturnFiles([
            'fr',
            'fr/logo.png'
        ]));

        i18nMgr.generateLocalizedMetadata(session, config, xmlObject, "icon");

        expect(xmlObject.icon).toBeDefined();
        expect(xmlObject.icon.image).toBeDefined();
        expect(xmlObject.icon.image.length).toBe(2);
        expect(xmlObject.icon.image).toContain({
            _value: "logo.png"
        });
        expect(xmlObject.icon.image).toContain({
            text: {
                _attr: {
                    "xml:lang": "fr"
                },
                _value: "locales/fr/logo.png"
            }
        });
    });

    it("generate correct metadata for icon when locales folder does not exist", function () {
        var config = {
                icon: ["logo.png"]
            },
            xmlObject = {};

        spyOn(fs, "existsSync").andReturn(false);

        i18nMgr.generateLocalizedMetadata(session, config, xmlObject, "icon");

        expect(xmlObject.icon).toBeDefined();
        expect(xmlObject.icon.image).toBeDefined();
        expect(xmlObject.icon.image.length).toBe(1);
        expect(xmlObject.icon.image).toContain({
            _value: "logo.png"
        });
    });

    it("generate correct metadata for icon when locale folder does not contain matching image", function () {
        var config = {
                icon: ["logo.png"]
            },
            xmlObject = {};

        spyOn(fs, "existsSync").andReturn(true);
        spyOn(wrench, "readdirSyncRecursive").andReturn(mockOSReturnFiles([
            'fr',
            'fr/logo-mismatch.png'
        ]));

        i18nMgr.generateLocalizedMetadata(session, config, xmlObject, "icon");

        expect(xmlObject.icon).toBeDefined();
        expect(xmlObject.icon.image).toBeDefined();
        expect(xmlObject.icon.image.length).toBe(1);
        expect(xmlObject.icon.image).toContain({
            _value: "logo.png"
        });
    });

    it("generate correct metadata for icon when image is in subfolder", function () {
        var config = {
                icon: ["assets\\images\\logo.png"]
            },
            xmlObject = {};

        spyOn(fs, "existsSync").andReturn(true);
        spyOn(wrench, "readdirSyncRecursive").andReturn(mockOSReturnFiles([
            'fr',
            'fr/assets/images/logo.png'
        ]));

        i18nMgr.generateLocalizedMetadata(session, config, xmlObject, "icon");

        expect(xmlObject.icon).toBeDefined();
        expect(xmlObject.icon.image).toBeDefined();
        expect(xmlObject.icon.image.length).toBe(2);
        expect(xmlObject.icon.image).toContain({
            _value: "assets/images/logo.png"
        });
        expect(xmlObject.icon.image).toContain({
            text: {
                _attr: {
                    "xml:lang": "fr"
                },
                _value: "locales/fr/assets/images/logo.png"
            }
        });
    });

    it("generate correct metadata for icon when image is in subfolder and OS is windows", function () {
        var config = {
                icon: ["assets\\images\\logo.png"]
            },
            xmlObject = {};

        spyOn(pkgrUtils, 'isWindows').andReturn(true);
        spyOn(fs, "existsSync").andReturn(true);
        spyOn(wrench, "readdirSyncRecursive").andReturn(mockOSReturnFiles([
            'fr',
            'fr\\assets\\images\\logo.png'
        ]));

        i18nMgr.generateLocalizedMetadata(session, config, xmlObject, "icon");

        expect(xmlObject.icon).toBeDefined();
        expect(xmlObject.icon.image).toBeDefined();
        expect(xmlObject.icon.image.length).toBe(1);
        expect(xmlObject.icon.image).toContain({
            _value: "assets/images/logo.png"
        });
    });

    it("generate correct metadata for splash and OS is *nx", function () {
        var config = {
                "rim:splash": ["splash-1280x768.jpg", "splash-768x1280.jpg"]
            },
            xmlObject = {};

        spyOn(pkgrUtils, 'isWindows').andReturn(false);
        spyOn(fs, "existsSync").andReturn(true);
        spyOn(wrench, "readdirSyncRecursive").andReturn(mockOSReturnFiles([
            'fr',
            'fr/splash-1280x768.jpg',
            'fr/splash-768x1280.jpg'
        ]));

        i18nMgr.generateLocalizedMetadata(session, config, xmlObject, "rim:splash");

        expect(xmlObject.splashScreens).toBeDefined();
        expect(xmlObject.splashScreens.image).toBeDefined();
        expect(xmlObject.splashScreens.image.length).toBe(4);
        expect(xmlObject.splashScreens.image).toContain({
            _value: "splash-1280x768.jpg"
        });
        expect(xmlObject.splashScreens.image).toContain({
            _value: "splash-768x1280.jpg"
        });
        expect(xmlObject.splashScreens.image).toContain({
            text: {
                _attr: {
                    "xml:lang": "fr"
                },
                _value: "locales/fr/splash-1280x768.jpg"
            }
        });
        expect(xmlObject.splashScreens.image).toContain({
            text: {
                _attr: {
                    "xml:lang": "fr"
                },
                _value: "locales/fr/splash-768x1280.jpg"
            }
        });
    });

    it("generate correct metadata for splash when locales folder does not exist", function () {
        var config = {
                "rim:splash": ["splash-1280x768.jpg", "splash-768x1280.jpg"]
            },
            xmlObject = {};

        spyOn(fs, "existsSync").andReturn(false);

        i18nMgr.generateLocalizedMetadata(session, config, xmlObject, "rim:splash");

        expect(xmlObject.splashScreens).toBeDefined();
        expect(xmlObject.splashScreens.image).toBeDefined();
        expect(xmlObject.splashScreens.image.length).toBe(2);
        expect(xmlObject.splashScreens.image).toContain({
            _value: "splash-1280x768.jpg"
        });
        expect(xmlObject.splashScreens.image).toContain({
            _value: "splash-768x1280.jpg"
        });
    });

    it("generate correct metadata for splash when locale folder does not contain matching image", function () {
        var config = {
                "rim:splash": ["splash-1280x768.jpg", "splash-768x1280.jpg"]
            },
            xmlObject = {};

        spyOn(fs, "existsSync").andReturn(true);
        spyOn(wrench, "readdirSyncRecursive").andReturn(mockOSReturnFiles([
            'fr',
            'fr/splash-1280x768-mismatch.jpg',
            'fr/splash-768x1280.jpg'
        ]));

        i18nMgr.generateLocalizedMetadata(session, config, xmlObject, "rim:splash");

        expect(xmlObject.splashScreens).toBeDefined();
        expect(xmlObject.splashScreens.image).toBeDefined();
        expect(xmlObject.splashScreens.image.length).toBe(3);
        expect(xmlObject.splashScreens.image).toContain({
            _value: "splash-1280x768.jpg"
        });
        expect(xmlObject.splashScreens.image).toContain({
            _value: "splash-768x1280.jpg"
        });
        expect(xmlObject.splashScreens.image).toContain({
            text: {
                _attr: {
                    "xml:lang": "fr"
                },
                _value: "locales/fr/splash-768x1280.jpg"
            }
        });
    });

    it("generate correct metadata for splash when image is in subfolder", function () {
        var config = {
                "rim:splash": ["assets\\images\\splash-1280x768.jpg", "assets\\images\\splash-768x1280.jpg"]
            },
            xmlObject = {};

        spyOn(fs, "existsSync").andReturn(true);
        spyOn(wrench, "readdirSyncRecursive").andReturn(mockOSReturnFiles([
            'fr',
            'fr/assets/images/splash-1280x768.jpg',
            'fr/assets/images/splash-768x1280.jpg'
        ]));

        i18nMgr.generateLocalizedMetadata(session, config, xmlObject, "rim:splash");

        expect(xmlObject.splashScreens).toBeDefined();
        expect(xmlObject.splashScreens.image).toBeDefined();
        expect(xmlObject.splashScreens.image.length).toBe(4);
        expect(xmlObject.splashScreens.image).toContain({
            _value: "assets/images/splash-1280x768.jpg"
        });
        expect(xmlObject.splashScreens.image).toContain({
            _value: "assets/images/splash-768x1280.jpg"
        });
        expect(xmlObject.splashScreens.image).toContain({
            text: {
                _attr: {
                    "xml:lang": "fr"
                },
                _value: "locales/fr/assets/images/splash-1280x768.jpg"
            }
        });
        expect(xmlObject.splashScreens.image).toContain({
            text: {
                _attr: {
                    "xml:lang": "fr"
                },
                _value: "locales/fr/assets/images/splash-768x1280.jpg"
            }
        });
    });
});
