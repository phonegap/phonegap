/*jshint sub:true*/

var testData = require("./test-data"),
    configParser = require(testData.libPath + "/config-parser"),
    packagerUtils = require(testData.libPath + "/packager-utils"),
    fileManager = require(testData.libPath + "/file-manager"),
    logger = require(testData.libPath + "./logger"),
    testUtilities = require("./test-utilities"),
    xml2js = require('xml2js'),
    localize = require(testData.libPath + "/localize"),
    path = require("path"),
    fs = require("fs"),
    session = testData.session,
    configPath = path.resolve("bin/test/cordova/unit/config.xml"),
    configBadPath = path.resolve("test2/config.xml"),
    configBareMinimumPath = path.resolve("bin/test/cordova/unit/config-bare-minimum.xml"),
    mockParsing = testUtilities.mockParsing;

describe("config parser", function () {
    beforeEach(function () {
        spyOn(logger, "warn");
        spyOn(packagerUtils, "copyFile");
    });

    it("tries to open a config.xml file that doesn't exist", function () {
        expect(function () {
            configParser.parse(configBadPath, session, {});
        }).toThrow(localize.translate("EXCEPTION_CONFIG_NOT_FOUND"));
    });

    it("parses standard elements in a config.xml", function () {
        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.content).toEqual("local:///startPage.html");
            expect(configObj.id).toEqual("My WidgetId");
            expect(configObj.customHeaders).toEqual({ 'RIM-Widget' : 'rim/widget'});
            expect(configObj.version).toEqual("1.0.0");
            expect(configObj.license).toEqual("My License");
            expect(configObj.licenseURL).toEqual("http://www.apache.org/licenses/LICENSE-2.0");
            expect(configObj.icon).toEqual(["test.png"]);
            expect(configObj.configXML).toEqual("config.xml");
            expect(configObj.author).toEqual("Research In Motion Ltd.");
            expect(configObj.authorURL).toEqual("http://www.rim.com/");
            expect(configObj.copyright).toEqual("No Copyright");
            expect(configObj.authorEmail).toEqual("author@rim.com");
            expect(configObj.name).toEqual({ default : 'Demo' });
            expect(configObj.description).toEqual({ default : 'This app does everything.' });
            expect(configObj.permissions).toContain('access_shared');
            expect(configObj.permissions).toContain('read_geolocation');
            expect(configObj.permissions).toContain('use_camera');
            expect(configObj.enableChildWebView).toBe(false);
            expect(configObj.enableChildWebView).toBe(false);
        });
    });

    it("parses Feature elements in a config.xml", function () {
        var localAccessList,
            accessListFeature;

        configParser.parse(configPath, session, function (configObj) {
            //validate WIDGET_LOCAL accessList
            localAccessList = testUtilities.getAccessListForUri(configObj.accessList, "WIDGET_LOCAL");
            expect(localAccessList).toBeDefined();
            expect(localAccessList.uri).toEqual("WIDGET_LOCAL");
            expect(localAccessList.allowSubDomain).toEqual(true);
        });
    });

    it("parses Access elements a config.xml", function () {
        var customAccessList,
            accessListFeature;

        configParser.parse(configPath, session, function (configObj) {
            //validate http://www.somedomain1.com accessList
            customAccessList = testUtilities.getAccessListForUri(configObj.accessList, "http://www.somedomain1.com");
            expect(customAccessList).toBeDefined();
            expect(customAccessList.uri).toEqual("http://www.somedomain1.com");
            expect(customAccessList.allowSubDomain).toEqual(true);
        });
    });

    it("parses a bare minimum config.xml without error", function () {
        var bareMinimumConfigPath = path.resolve("bin/test/cordova/unit/config-bare-minimum.xml");

        configParser.parse(bareMinimumConfigPath, session, function (configObj) {
            expect(configObj.content).toEqual("local:///startPage.html");
            expect(configObj.version).toEqual("1.0.0");
        });
    });

    it("license url is set even if license body is empty", function () {
        var licenseConfigPath = path.resolve("bin/test/cordova/unit/config-license.xml");

        configParser.parse(licenseConfigPath, session, function (configObj) {
            expect(configObj.license).toEqual("");
            expect(configObj.licenseURL).toEqual("http://www.apache.org/licenses/LICENSE-2.0");
        });
    });

    it("fails when id is undefined", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data["@"].id = undefined;

        mockParsing(data);

        //Should throw an EXCEPTION_INVALID_ID error
        expect(function () {
            configParser.parse(configPath, session, {});
        }).toThrow(localize.translate("EXCEPTION_INVALID_ID"));
    });

    it("fails when id is empty", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data["@"].id = "";

        mockParsing(data);

        //Should throw an EXCEPTION_INVALID_ID error
        expect(function () {
            configParser.parse(configPath, session, {});
        }).toThrow(localize.translate("EXCEPTION_INVALID_ID"));
    });

    it("Fails when no name was provided - single element", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data.name = "";

        mockParsing(data);

        expect(function () {
            configParser.parse(configPath, session, {});
        }).toThrow(localize.translate("EXCEPTION_INVALID_NAME"));
    });

    it("Fails when no name was provided - multiple elements", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data.name = ["",
            { '#': 'API Smoke Test-FR', '@': { 'xml:lang': 'fr' } },
        ];

        mockParsing(data);

        expect(function () {
            configParser.parse(configPath, session, {});
        }).toThrow(localize.translate("EXCEPTION_INVALID_NAME"));
    });

    it("Fails when localized name was provided but empty", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data.name = ["API Smoke Test",
            { '#': '', '@': { 'xml:lang': 'fr' } },
        ];

        mockParsing(data);

        expect(function () {
            configParser.parse(configPath, session, {});
        }).toThrow(localize.translate("EXCEPTION_INVALID_NAME"));
    });

    it("Parses a name element - single element", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data.name = "API Smoke Test";

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.name).toEqual({"default": "API Smoke Test"});
        });
    });

    it("Parses a name element with xml:lang - single element", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data.name = { '#': 'EN VALUE', '@': { 'xml:lang': 'en' } };

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.name).toEqual({"en": "EN VALUE"});
        });
    });

    it("Parses a name element that is not case sensitive", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data.name = { '#': 'EN VALUE', '@': { 'xml:lang': 'eN' } };

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.name).toEqual({"en": "EN VALUE"});
        });
    });

    it("Parses a name element with xml:lang - multi element", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data.name = ['API Smoke Test',
            { '#': 'EN VALUE', '@': { 'xml:lang': 'en' } },
            { '#': 'FR VALUE', '@': { 'xml:lang': 'fr' } }

        ];
        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.name).toEqual({"default": "API Smoke Test", "en": "EN VALUE", "fr": "FR VALUE"});
        });
    });

    it("Fails when localized name was provided but empty", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data.name = ['API Smoke Test',
            { '#': '', '@': { 'xml:lang': 'fr' } },
        ];

        mockParsing(data);

        expect(function () {
            configParser.parse(configPath, session, {});
        }).toThrow(localize.translate("EXCEPTION_INVALID_NAME"));
    });

    it("Parses a description element - single element", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data.description = "This is my app";

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.description).toEqual({"default": "This is my app"});
        });
    });

    it("Parses a description element with xml:lang - single element", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data.description = { '#': 'EN VALUE', '@': { 'xml:lang': 'en' } };

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.description).toEqual({"en": "EN VALUE"});
        });
    });

    it("Parses a description element that is not case sensitive", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data.description = { '#': 'EN VALUE', '@': { 'xml:lang': 'eN' } };

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.description).toEqual({"en": "EN VALUE"});
        });
    });

    it("Parses a description element with xml:lang - multi element", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data.description = ['This is my app',
            { '#': 'EN VALUE', '@': { 'xml:lang': 'en' } },
            { '#': 'FR VALUE', '@': { 'xml:lang': 'fr' } }

        ];
        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.description).toEqual({"default": "This is my app", "en": "EN VALUE", "fr": "FR VALUE"});
        });
    });

    it("Fails when missing content error is not shown", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data.content = "";

        mockParsing(data);

        expect(function () {
            configParser.parse(configPath, session, {});
        }).toThrow(localize.translate("EXCEPTION_INVALID_CONTENT"));
    });

    it("adds local:/// protocol to urls", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data.content["@"].src = "localFile.html";

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.content).toEqual("local:///localFile.html");
        });
    });

    it("cleans source folder on error", function () {
        mockParsing({}, "ERROR");

        spyOn(logger, "error");
        spyOn(fileManager, "cleanSource");

        configParser.parse(configPath, session, function () {});

        expect(fileManager.cleanSource).toHaveBeenCalled();
    });

    it("parses a single permission (comes in as string)", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data['rim:permissions'] = {};
        data['rim:permissions']['rim:permit'] = 'onePermissionNoAttribs';

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.permissions).toContain('onePermissionNoAttribs');
        });
    });

    it("parses a single permission with attribs (comes in as object)", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data['rim:permissions'] = {};
        data['rim:permissions']['rim:permit'] = { '#': 'systemPerm', '@': { system: 'true' } };

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.permissions).toContain({ '#': 'systemPerm', '@': { system: 'true' } });
        });
    });

    it("parses multiple permissions with no attribs (comes in as array)", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data['rim:permissions'] = {};
        data['rim:permissions']['rim:permit'] = [ 'access_shared', 'read_geolocation', 'use_camera' ];

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.permissions).toContain('access_shared');
            expect(configObj.permissions).toContain('read_geolocation');
            expect(configObj.permissions).toContain('use_camera');
        });
    });

    it("parses multiple permissions with attribs (comes in as array)", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data['rim:permissions'] = {};
        data['rim:permissions']['rim:permit'] = [
            { '#': 'systemPerm', '@': { system: 'true' } },
            { '#': 'nonSystemPerm', '@': { system: 'false' } }
        ];

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.permissions).toContain({ '#': 'systemPerm', '@': { system: 'true' } });
            expect(configObj.permissions).toContain({ '#': 'nonSystemPerm', '@': { system: 'false' } });
        });
    });

    it("parses a config with no permissions set", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        delete data['rim:permissions']; //No permissions set in config

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.permissions).toEqual([]);
        });
    });

    it("enables the enable-flash feature when specified", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);

        //Add the enable-flash feature element
        data['feature'] = {'@': {id: 'enable-flash'}};

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.enableFlash).toEqual(true);
        });
    });

    it("does not enable the enable-flash feature when specified in an access element", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);

        //Add the enable-flash to an access element
        data['access'] = {"@" : {"uri" : "http://somewebsite.com"}, "feature" : {"@": {id: 'enable-flash'}}};

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.enableFlash).toEqual(false);
        });
    });

    it("disables the enable-flash feature by default", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data['feature'] = undefined;//no features

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.enableFlash).toEqual(false);
        });
    });

    it("sets autoDeferNetworkingAndJavaScript to false when the blackberry.push feature is specified", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);

        //Add the blackberry.push feature element
        data["rim:permissions"] = {}; // ensure no run_when_backgrounded permission exists
        data['feature'] = {'@': {id: 'blackberry.push'}};

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.autoDeferNetworkingAndJavaScript).toEqual(false);
        });
    });

    it("sets autoDeferNetworkingAndJavaScript to false when the run_when_backgrounded permission is specified", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);

        //Add the run_when_backgrounded permission
        data['feature'] = undefined; // no features
        data["rim:permissions"] = {
            "rim:permit" : [ 'read_geolocation', 'run_when_backgrounded', 'access_internet' ]
        };

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.permissions).toContain('run_when_backgrounded');
            expect(configObj.autoDeferNetworkingAndJavaScript).toEqual(false);
        });
    });

    it("sets autoDeferNetworkingAndJavaScript to true by default", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);

        data['feature'] = undefined; // no features
        data["rim:permissions"] = {}; // ensure no run_when_backgrounded permission exists

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.autoDeferNetworkingAndJavaScript).toEqual(true);
        });
    });

    it("does not throw an exception with empty permit tags", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data['rim:permit'] = ['read_geolocation', {}, 'access_internet' ];

        mockParsing(data);

        expect(function () {
            configParser.parse(configPath, session, function (configObj) {});
        }).not.toThrow();
    });

    it("multi access should be false if no access", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            //hasMultiAccess was set to false
            expect(configObj.hasMultiAccess).toEqual(false);
            expect(configObj.accessList).toEqual([ {
                uri : 'WIDGET_LOCAL',
                allowSubDomain : true
            } ]);
        });
    });

    it("multi access should be false if no uri is equal to *", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data['access'] = {"@" : {"uri" : "http://www.somedomain1.com"}};

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            //hasMultiAccess was set to false
            expect(configObj.hasMultiAccess).toEqual(false);
            expect(configObj.accessList).toEqual([ {
                uri : 'WIDGET_LOCAL',
                allowSubDomain : true
            }, {
                "uri" : "http://www.somedomain1.com"
            } ]);
        });
    });

    it("multi access should be true with the uri being equal to *", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data['access'] = {"@" : {"uri" : "*"}};

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            //hasMultiAccess was set to true
            expect(configObj.hasMultiAccess).toEqual(true);
            expect(configObj.accessList).toEqual([ {
                uri : 'WIDGET_LOCAL',
                allowSubDomain : true
            } ]);
        });
    });

    it("multi access should be true with one uri being equal to *", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data['access'] = [{"@" : {"uri" : "*"}}, {"@" : {"uri" : "http://www.somedomain1.com"}}];

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            //hasMultiAccess was set to true
            expect(configObj.hasMultiAccess).toEqual(true);
            expect(configObj.accessList).toEqual([ {
                uri : 'WIDGET_LOCAL',
                allowSubDomain : true
            }, {
                "uri" : "http://www.somedomain1.com"
            } ]);
        });
    });

    it("should fail when feature is defined with the uri being equal to *", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data['access'] = {"@" : {"uri" : "*"}, "feature" : {"@": {"id": "blackberry.app"}}};

        mockParsing(data);

        expect(function () {
            configParser.parse(configPath, session, function (configObj) {});
        }).toThrow(localize.translate("EXCEPTION_FEATURE_DEFINED_WITH_WILDCARD_ACCESS_URI"));
    });

    it("should fail when multi features are defined with the uri being equal to *", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data['access'] = {"@" : {"uri" : "*"}, "feature" : [{"@": {"id": "blackberry.app"}}, {"@": {"id": "blackberry.system"}}, {"@": {"id": "blackberry.invoke"}}]};

        mockParsing(data);

        expect(function () {
            configParser.parse(configPath, session, function (configObj) {});
        }).toThrow(localize.translate("EXCEPTION_FEATURE_DEFINED_WITH_WILDCARD_ACCESS_URI"));
    });

    it("should fail when the access uri attribute does not specify a protocol", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);

        //Add an access element with one feature
        data['access'] = {
            '@': {
                uri: 'rim.net',
                subdomains: 'true'
            },
            feature: {
                '@': { id: 'blackberry.system' }
            }
        };

        mockParsing(data);

        expect(function () {
            configParser.parse(configPath, session, function (configObj) {});
        }).toThrow(localize.translate("EXCEPTION_INVALID_ACCESS_URI_NO_PROTOCOL", data['access']['@'].uri));
    });

    it("should fail when the access uri attribute does not specify a URN", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);

        //Add an access element with one feature
        data['access'] = {
            '@': {
                uri: 'http://',
                subdomains: 'true'
            },
            feature: {
                '@': { id: 'blackberry.system' }
            }
        };

        mockParsing(data);

        expect(function () {
            configParser.parse(configPath, session, function (configObj) {});
        }).toThrow(localize.translate("EXCEPTION_INVALID_ACCESS_URI_NO_URN", data['access']['@'].uri));
    });

    it("does not fail when there is a single feature element in the access list", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);

        //Add an access element with one feature
        data['access'] = {
            '@': {
                uri: 'http://rim.net',
                subdomains: 'true'
            },
            feature: {
                '@': { id: 'blackberry.system' }
            }
        };

        mockParsing(data);

        expect(function () {
            configParser.parse(configPath, session, function (configObj) {});
        }).not.toThrow();
    });

    it("supports 4 digit version [build id]", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data["@"].version = "1.0.0.50";

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.version).toEqual("1.0.0");
            expect(configObj.buildId).toEqual("50");
        });
    });

    it("uses --buildId when set", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);

        //--buildId 100
        session.buildId = "100";

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.buildId).toEqual("100");
        });
    });

    it("overides the build id specified in version with --buildId flag", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data["@"].version = "1.0.0.50";

        //--buildId 100
        session.buildId = "100";

        mockParsing(data);

        configParser.parse(configPath, session, function (configObj) {
            expect(configObj.version).toEqual("1.0.0");
            expect(configObj.buildId).toEqual("100");
        });
    });

    it("throws a proper error when author tag is empty", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data.author = {};

        mockParsing(data);

        //Should throw an EXCEPTION_INVALID_AUTHOR error
        expect(function () {
            configParser.parse(configPath, session, {});
        }).toThrow(localize.translate("EXCEPTION_INVALID_AUTHOR"));
    });

    it("can parse a standard rim:invoke-target element", function () {

        configParser.parse(configPath, session, function (configObj) {
            var invokeTarget = configObj["invoke-target"][0];

            expect(invokeTarget).toBeDefined();
            expect(invokeTarget["@"]).toBeDefined();
            expect(invokeTarget["@"]["id"]).toBeDefined();
            expect(invokeTarget["@"]["id"]).toEqual("com.domain.subdomain.appname.app1");
            expect(invokeTarget.type).toBeDefined();
            expect(invokeTarget.type).toEqual("APPLICATION");
            expect(invokeTarget["require-source-permissions"]).toBeDefined();
            expect(invokeTarget["require-source-permissions"]).toEqual("invoke_accross_perimeters,access_shared");
            expect(invokeTarget.filter).toBeDefined();
            expect(invokeTarget.filter[0].action).toBeDefined();
            expect(invokeTarget.filter[0].action).toContain("bb.action.VIEW");
            expect(invokeTarget.filter[0].action).toContain("bb.action.SET");
            expect(invokeTarget.filter[0].action).toContain("bb.action.OPEN");
            expect(invokeTarget.filter[0]["mime-type"]).toBeDefined();
            expect(invokeTarget.filter[0]["mime-type"]).toContain("image/*");
            expect(invokeTarget.filter[0]["mime-type"]).toContain("text/*");
            expect(invokeTarget.filter[0].property).toBeDefined();

            invokeTarget.filter[0].property.forEach(function (property) {
                expect(property["@"]).toBeDefined();
                expect(property["@"]["var"]).toBeDefined();
                expect(property["@"]["var"]).toMatch("^(exts|uris)$");
                if (property["@"]["var"] === "uris") {
                    expect(property["@"]["value"]).toMatch("^(ftp|http|https):\/\/$");
                } else if (property["@"]["var"] === "exts") {
                    expect(property["@"]["value"]).toMatch("^(jpg|png|txt|doc)$");
                }
            });
        });
    });

    it("can parse multiple filters in one element", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data["rim:invoke-target"] = {
            "@": {
                "id": "com.domain.subdomain.appName.app"
            },
            "type": "application",
            "filter":  [{
                "action":  "bb.action.OPEN",
                "mime-type": ["text/*", "image/*"]
            }, {
                "action": "bb.action.SET",
                "mime-type": "image/*"
            }]
        };

        mockParsing(data);

        expect(function () {
            configParser.parse(configPath, session, function (configObj) {});
        }).not.toThrow();
    });

    it("can parse multiple invoke targets", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data["rim:invoke-target"] = [{
            "@": {
                "id": "com.domain.subdomain.appName.app"
            },
            "type": "application"
        }, {
            "@": {
                "id": "com.domain.subdomain.appName.viewer"
            },
            "type": "viewer"
        }];

        mockParsing(data);

        expect(function () {
            configParser.parse(configPath, session, function (configObj) {});
        }).not.toThrow();

    });

    it("throws an error when an invoke target doesn't specify an invocation id", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data["rim:invoke-target"] = {
            type: "APPLICATION"
        };

        mockParsing(data);

        expect(function () {
            configParser.parse(configPath, session, function (configObj) {});
        }).toThrow(localize.translate("EXCEPTION_INVOKE_TARGET_INVALID_ID"));
    });

    it("throws and error when an invoke target xml doesn't specify an invocation type", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data["rim:invoke-target"] = {
            "@": {
                "id": "com.domain.subdomain.appName.app"
            },
            type: {}
        };

        mockParsing(data);

        expect(function () {
            configParser.parse(configPath, session, function (configObj) {});
        }).toThrow(localize.translate("EXCEPTION_INVOKE_TARGET_INVALID_TYPE"));
    });

    it("throws an error when an invoke target doesn't specify an invocation type", function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data["rim:invoke-target"] = {
            "@": {
                "id": "com.domain.subdomain.appName.app"
            }
        };

        mockParsing(data);

        expect(function () {
            configParser.parse(configPath, session, function (configObj) {});
        }).toThrow(localize.translate("EXCEPTION_INVOKE_TARGET_INVALID_TYPE"));
    });

    it("throws an error when an invoke target filter doesn't contain an action",  function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data["rim:invoke-target"] = {
            "@": {
                "id": "com.domain.subdomain.appName.app"
            },
            "type": "APPLICATION",
            "filter": {
                "mime-type": "text/*",
                "property": [{
                    "@": {
                        "var": "uris",
                        "value": "https://"
                    }
                }, {
                    "@": {
                        "var": "exts",
                        "value": "html"
                    }
                }, {
                    "@": {
                        "var": "exts",
                        "value": "htm"
                    }
                }]
            }
        };

        mockParsing(data);

        expect(function () {
            configParser.parse(configPath, session, function (configObj) {});
        }).toThrow(localize.translate("EXCEPTION_INVOKE_TARGET_ACTION_INVALID"));
    });

    it("throws an error when a filter doesn't contain a mime-type",  function () {
        var data = testUtilities.cloneObj(testData.xml2jsConfig);
        data["rim:invoke-target"] = {
            "@": {
                "id": "com.domain.subdomain.appName.app"
            },
            "type": "application",
            "filter": {
                "action": "bb.action.OPEN",
                "property": [{
                    "@": {
                        "var": "uris",
                        "value": "https://"
                    }
                }, {
                    "@": {
                        "var": "exts",
                        "value": "html"
                    }
                }]
            }
        };

        mockParsing(data);

        expect(function () {
            configParser.parse(configPath, session, function (configObj) {});
        }).toThrow(localize.translate("EXCEPTION_INVOKE_TARGET_MIME_TYPE_INVALID"));
    });

    describe("splash screen", function () {
        it("throws error when rim:splash element does not contain src attribute", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data["rim:splash"] = {};

            mockParsing(data);

            expect(function () {
                configParser.parse(configPath, session, function (configObj) {});
            }).toThrow(localize.translate("EXCEPTION_INVALID_SPLASH_SRC"));
        });

        it("throws error when rim:splash element contains empty src attribute", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data["rim:splash"] = {
                "@": {
                    "src": ""
                }
            };

            mockParsing(data);

            expect(function () {
                configParser.parse(configPath, session, function (configObj) {});
            }).toThrow(localize.translate("EXCEPTION_INVALID_SPLASH_SRC"));
        });

        it("throws error when one of many rim:splash elements does not contain attribute", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data["rim:splash"] = [{
                "@": {
                    "src": "a.jpg"
                }
            }, {
                "#": "blah"
            }];

            mockParsing(data);

            expect(function () {
                configParser.parse(configPath, session, function (configObj) {});
            }).toThrow(localize.translate("EXCEPTION_INVALID_SPLASH_SRC"));
        });

        it("allow one rim:splash element that contains non-empty src attribute", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data["rim:splash"] = {
                "@": {
                    "src": "a.jpg"
                }
            };

            mockParsing(data);

            expect(function () {
                configParser.parse(configPath, session, function (configObj) {});
            }).not.toThrow();
        });

        it("allow multiple rim:splash elements that contain non-empty src attribute", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data["rim:splash"] = [{
                "@": {
                    "src": "a.jpg"
                }
            }, {
                "@": {
                    "src": "b.jpg"
                }
            }];

            mockParsing(data);

            expect(function () {
                configParser.parse(configPath, session, function (configObj) {});
            }).not.toThrow();
        });

        it("throws error when rim:splash src starts with 'locales' subfolder", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data["rim:splash"] = [{
                "@": {
                    "src": "a.jpg"
                }
            }, {
                "@": {
                    "src": "locales/en/b.jpg"
                }
            }];

            mockParsing(data);

            expect(function () {
                configParser.parse(configPath, session, function (configObj) {});
            }).toThrow(localize.translate("EXCEPTION_INVALID_SPLASH_SRC_LOCALES"));
        });
    });

    describe("icon", function () {
        it("throws error when icon element does not contain src attribute", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data["icon"] = {};

            mockParsing(data);

            expect(function () {
                configParser.parse(configPath, session, function (configObj) {});
            }).toThrow(localize.translate("EXCEPTION_INVALID_ICON_SRC"));
        });

        it("throws error when icon element contains empty src attribute", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data["icon"] = {
                "@": {
                    "src": ""
                }
            };

            mockParsing(data);

            expect(function () {
                configParser.parse(configPath, session, function (configObj) {});
            }).toThrow(localize.translate("EXCEPTION_INVALID_ICON_SRC"));
        });

        it("throws error when one of many icon elements does not contain attribute", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data["icon"] = [{
                "@": {
                    "src": "a.jpg"
                }
            }, {
                "#": "blah"
            }];

            mockParsing(data);

            expect(function () {
                configParser.parse(configPath, session, function (configObj) {});
            }).toThrow(localize.translate("EXCEPTION_INVALID_ICON_SRC"));
        });

        it("allow one icon element that contains non-empty src attribute", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data["icon"] = {
                "@": {
                    "src": "a.jpg"
                }
            };

            mockParsing(data);

            expect(function () {
                configParser.parse(configPath, session, function (configObj) {});
            }).not.toThrow();
        });

        it("allow multiple icon elements that contain non-empty src attribute", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data["icon"] = [{
                "@": {
                    "src": "a.jpg"
                }
            }, {
                "@": {
                    "src": "b.jpg"
                }
            }];

            mockParsing(data);

            expect(function () {
                configParser.parse(configPath, session, function (configObj) {});
            }).not.toThrow();
        });

        it("throws error when icon src starts with 'locales' subfolder", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data["icon"] = [{
                "@": {
                    "src": "a.jpg"
                }
            }, {
                "@": {
                    "src": "locales/en/b.jpg"
                }
            }];

            mockParsing(data);

            expect(function () {
                configParser.parse(configPath, session, function (configObj) {});
            }).toThrow(localize.translate("EXCEPTION_INVALID_ICON_SRC_LOCALES"));
        });

        it("should copy the default icon to the src dir when no icon specified", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            mockParsing(data);

            expect(function () {
                configParser.parse(configPath, session, function (configObj) {});
            }).not.toThrow();

            expect(packagerUtils.copyFile).toHaveBeenCalled();
        });

        it("should use the default icon config when no icon is specified", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);

            mockParsing(data);

            configParser.parse(configBareMinimumPath, session, function (configObj) {
                expect(configObj.icon).toEqual(["default-icon.png"]);
            });
        });

        it("should not use the default icon config when icon is specified", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data["icon"] = {
                "@": {
                    "src": "test.png"
                }
            };

            mockParsing(data);

            configParser.parse(configPath, session, function (configObj) {
                expect(configObj.icon).toEqual(["test.png"]);
                expect(configObj.icon).not.toEqual(["default-icon.png"]);
                expect(configObj.icon).not.toContain("default-icon.png");
            });
        });

        it("sets orientation to landscape when specified", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data['feature'] = { '@': { id: 'blackberry.app', required: true },
                param: { '@': { name: 'orientation', value: 'landscape' } } };

            mockParsing(data);

            configParser.parse(configPath, session, function (configObj) {
                expect(configObj.orientation).toEqual("landscape");
                expect(configObj.autoOrientation).toEqual(false);
            });
        });

        it("sets orientation to portrait when specified", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data['feature'] = { '@': { id: 'blackberry.app', required: true },
                param: { '@': { name: 'orientation', value: 'portrait' } } };

            mockParsing(data);

            configParser.parse(configPath, session, function (configObj) {
                expect(configObj.orientation).toEqual("portrait");
                expect(configObj.autoOrientation).toEqual(false);
            });
        });

        it("sets auto orientation to true by default", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            delete data["feature"];//Remove any orientation data

            mockParsing(data);

            configParser.parse(configPath, session, function (configObj) {
                expect(configObj.autoOrientation).toEqual(true);
            });
        });

        it("throws a warning when blackberry.app.orientation exists", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data['feature'] = { '@': { id: 'blackberry.app.orientation', required: true },
                param: { '@': { name: 'mode', value: 'portrait' } } };

            mockParsing(data);

            configParser.parse(configPath, session, function (configObj) {});
            expect(logger.warn).toHaveBeenCalled();
        });

        it("throws an error when blackberry.app orientation exists with an invalid mode param", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data['feature'] = { '@': { id: 'blackberry.app', required: true },
                param: { '@': { name: 'orientation', value: 'notAValidMode' } } };

            mockParsing(data);

            //Should throw an EXCEPTION_INVALID_ORIENTATION_MODE error
            expect(function () {
                configParser.parse(configPath, session, function (configObj) {});
            }).toThrow(localize.translate("EXCEPTION_INVALID_ORIENTATION_MODE", "notAValidMode"));
        });

        it("sets backgroundColor when specified via blackberry.app namespace", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data['feature'] = { '@': { id: 'blackberry.app', required: true },
                param: { '@': { name: 'backgroundColor', value: '0xffffff' } } };

            mockParsing(data);

            configParser.parse(configPath, session, function (configObj) {
                expect(configObj.backgroundColor).toEqual(16777215);//Decimal value of 0xffffff
            });
        });

        it("throws an error when blackberry.app backgroundColor param is not a number", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data['feature'] = { '@': { id: 'blackberry.app', required: true },
                param: { '@': { name: 'backgroundColor', value: '$UI*@@$' } } };

            mockParsing(data);

            //Should throw an EXCEPTION_BGCOLOR_INVALID error
            expect(function () {
                configParser.parse(configPath, session, {});
            }).toThrow(localize.translate("EXCEPTION_BGCOLOR_INVALID", "$UI*@@$"));
        });

        it("can properly parse the custom RIM-Wiget:rim/wiget element", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            mockParsing(data);

            configParser.parse(configPath, session, function (configObj) {
                expect(configObj.customHeaders).toEqual({ 'RIM-Widget' : 'rim/widget'});
            });
        });

        it("can properly parse the custom attributes but ignores improper headers", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data["@"] = {
                "xmlns": " http://www.w3.org/ns/widgets",
                "xmlns:rim": "http://www.blackberry.com/ns/widgets",
                "version": "1.0.0",
                "id": "myID"
            };

            mockParsing(data);

            configParser.parse(configPath, session, function (configObj) {
                expect(configObj.id).toEqual("myID");
                expect(configObj.customHeaders).toEqual(undefined);
            });
        });

        it("can properly parse the custom attributes but ignores improper headers", function () {
            var data = testUtilities.cloneObj(testData.xml2jsConfig);
            data["@"] = {
                "xmlns": " http://www.w3.org/ns/widgets",
                "xmlns:rim": "http://www.blackberry.com/ns/widgets",
                "version": "1.0.0",
                "id": "myID",
                "rim:userAgent" : "A Test-User-Agent/(Blackberry-Agent)"
            };

            mockParsing(data);

            configParser.parse(configPath, session, function (configObj) {
                expect(configObj.id).toEqual("myID");
                expect(configObj.userAgent).toEqual("A Test-User-Agent/(Blackberry-Agent)");
            });
        });

        describe('disabling childBrowser (childWebView)', function () {

            // { '@': { id: 'blackberry.app', required: true, version: '1.0.0.0' },
            //   param: { '@': { name: 'childBrowser', value: 'disable' } } }


            it("sets enableChildWebView to true when childBrowser value is enable", function () {
                var data = testUtilities.cloneObj(testData.xml2jsConfig);
                data['feature'] = { '@': { id: 'blackberry.app' },
                    param: { '@': { name: 'childBrowser', value: 'enable' } } };

                mockParsing(data);

                configParser.parse(configPath, session, function (configObj) {
                    expect(configObj.enableChildWebView).toBe(true);
                });
            });

            it("sets enableChildWebView to false when value is disable", function () {
                var data = testUtilities.cloneObj(testData.xml2jsConfig);
                data['feature'] = { '@': { id: 'blackberry.app' },
                    param: { '@': { name: 'childBrowser', value: 'disable' } } };

                mockParsing(data);

                configParser.parse(configPath, session, function (configObj) {
                    expect(configObj.enableChildWebView).toBe(false);
                });
            });
        });

        describe('disabling formcontrol', function () {

            it("sets enableFormControl to true when formControl value is enable", function () {
                var data = testUtilities.cloneObj(testData.xml2jsConfig);
                data['feature'] = { '@': { id: 'blackberry.app' },
                    param: { '@': { name: 'formControl', value: 'enable' } } };

                mockParsing(data);

                configParser.parse(configPath, session, function (configObj) {
                    expect(configObj.enableFormControl).toBe(true);
                });
            });

            it("sets enableFormControl to false when value is disable", function () {
                var data = testUtilities.cloneObj(testData.xml2jsConfig);
                data['feature'] = { '@': { id: 'blackberry.app' },
                    param: { '@': { name: 'formControl', value: 'disable' } } };

                mockParsing(data);

                configParser.parse(configPath, session, function (configObj) {
                    expect(configObj.enableFormControl).toBe(false);
                });
            });
        });

        describe('setting theme for some core ui elements', function () {
            function testTheme(themeInConfig, themeParsed) {
                var data = testUtilities.cloneObj(testData.xml2jsConfig);

                if (themeInConfig) {
                    data['feature'] = { '@': { id: 'blackberry.app' },
                        param: { '@': { name: 'theme', value: themeInConfig } } };

                    mockParsing(data);
                }

                configParser.parse(configPath, session, function (configObj) {
                    expect(configObj.theme).toBe(themeParsed);
                });
            }

            it("sets theme to dark when config has theme with dark", function () {
                testTheme("dark", "dark");
            });

            it("sets theme to bright when config has theme with bright", function () {
                testTheme("bright", "bright");
            });

            it("sets theme to inherit when config has theme with inherit", function () {
                testTheme("inherit", "inherit");
            });

            it("sets theme to default when config has theme with default", function () {
                testTheme("default", "default");
            });

            it("sets theme to default when config has unsupported theme", function () {
                testTheme("unsupportedthemename", "default");
            });

            it("sets theme to default when config has no theme provided", function () {
                testTheme(undefined, "default");
            });

            it("sets theme to dark when config has theme with case insensitive dark", function () {
                testTheme("dArK", "dark");
            });

            it("sets theme to bright when config has theme with case insensitive bright", function () {
                testTheme("BriGht", "bright");
            });

            it("sets theme to inherit when config has theme with case insensitive inherit", function () {
                testTheme("inHerIt", "inherit");
            });

            it("sets theme to inherit when config has theme with case insensitive inherit", function () {
                testTheme("DefAulT", "default");
            });

            it("sets theme to default when config has NO theme tag provided", function () {
                configParser.parse(configPath, session, function (configObj) {
                    expect(configObj.theme).toBe("default");
                });
            });
        });

        describe('disabling WebSecurity', function () {

            // { '@': { id: 'blackberry.app', required: true, version: '1.0.0.0' },
            //   param: { '@': { name: 'childBrowser', value: 'disable' } } }


            it("doesn't set enableWebSecurity to anything when param value is anything but disable", function () {
                var data = testUtilities.cloneObj(testData.xml2jsConfig);
                data.feature = { '@': { id: 'blackberry.app' },
                    param: { '@': { name: 'websecurity', value: (new Date()).toString() } } };

                mockParsing(data);

                configParser.parse(configPath, session, function (configObj) {
                    expect(configObj.enableWebSecurity).toBe(undefined);
                    expect(logger.warn).not.toHaveBeenCalledWith(localize.translate("WARNING_WEBSECURITY_DISABLED"));
                });
            });

            it("sets enableWebSecurity to false when value is disable", function () {
                var data = testUtilities.cloneObj(testData.xml2jsConfig);
                data.feature = { '@': { id: 'blackberry.app' },
                    param: { '@': { name: 'websecurity', value: 'disable' } } };

                mockParsing(data);

                configParser.parse(configPath, session, function (configObj) {
                    expect(configObj.enableWebSecurity).toBe(false);
                    expect(logger.warn).toHaveBeenCalledWith(localize.translate("WARNING_WEBSECURITY_DISABLED"));
                });
            });

            it("sets enableWebSecurity to false when value is disable case insensitive", function () {
                var data = testUtilities.cloneObj(testData.xml2jsConfig);
                data.feature = { '@': { id: 'blackberry.app' },
                    param: { '@': { name: 'websecurity', value: 'DisAble' } } };

                mockParsing(data);

                configParser.parse(configPath, session, function (configObj) {
                    expect(configObj.enableWebSecurity).toBe(false);
                    expect(logger.warn).toHaveBeenCalledWith(localize.translate("WARNING_WEBSECURITY_DISABLED"));
                });
            });
        });

        describe('enabling popupBlocker', function () {

            // { '@': { id: 'blackberry.app', required: true, version: '1.0.0.0' },
            //   param: { '@': { name: 'childBrowser', value: 'disable' } } }

            it("sets enableWebSecurity to false when value is disable", function () {
                var data = testUtilities.cloneObj(testData.xml2jsConfig);
                data.feature = { '@': { id: 'blackberry.app' },
                    param: { '@': { name: 'popupBlocker', value: 'enable' } } };

                mockParsing(data);

                configParser.parse(configPath, session, function (configObj) {
                    expect(configObj.enablePopupBlocker).toBe(true);
                });
            });

            it("sets enableWebSecurity to false when value is disable case insensitive", function () {
                var data = testUtilities.cloneObj(testData.xml2jsConfig);
                data.feature = { '@': { id: 'blackberry.app' },
                    param: { '@': { name: 'popupBlocker', value: 'EnAbLe' } } };

                mockParsing(data);

                configParser.parse(configPath, session, function (configObj) {
                    expect(configObj.enablePopupBlocker).toBe(true);
                });
            });
        });
    });
});
