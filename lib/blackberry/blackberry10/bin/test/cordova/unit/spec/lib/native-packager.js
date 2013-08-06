var path = require("path"),
    util = require("util"),
    fs = require("fs"),
    childProcess = require("child_process"),
    wrench = require("wrench"),
    srcPath = __dirname + "/../../../../../templates/project/cordova/lib/",
    nativePkgr = require(srcPath + "/native-packager"),
    pkgrUtils = require(srcPath + "/packager-utils"),
    testUtils = require("./test-utilities"),
    testData = require("./test-data"),
    logger = require(srcPath + "logger"),
    localize = require(srcPath + "/localize"),
    conf = require(srcPath + "./conf"),
    callback,
    config,
    session,
    target,
    result,
    orgDebugEnabled,
    orgDebugTokenPath,
    NL = pkgrUtils.isWindows() ? "\r\n" : "\n";

describe("Native packager", function () {
    beforeEach(function () {
        callback = jasmine.createSpy();
        config = testData.config;
        session = testData.session;
        target = session.targets[0];
        result = {
            stdout: {
                on: jasmine.createSpy()
            },
            stderr: {
                on: jasmine.createSpy()
            },
            on: function (eventName, callback) {
                callback(0);
            }
        };

        // Store original debug token setting and later restore them in afterEach
        // to be able to test positive and negative cases of each.
        orgDebugEnabled = session.debug;
        orgDebugTokenPath = session.conf.DEBUG_TOKEN;

        spyOn(wrench, "readdirSyncRecursive").andReturn(["abc", "xyz"]);
        spyOn(fs, "statSync").andReturn({
            isDirectory: function () {
                return false;
            }
        });
        spyOn(fs, "writeFileSync");
        spyOn(childProcess, "spawn").andReturn(result);
        spyOn(fs, "existsSync").andCallFake(function (path) {
            //Return true if this is the bbndk folder check
            return path.indexOf("bbndk") !== -1;
        });
    });

    afterEach(function () {
        session.debug = orgDebugEnabled;
        session.conf.DEBUG_TOKEN = orgDebugTokenPath;
    });

    it("should not display empty messages in logger", function () {
        spyOn(pkgrUtils, "writeFile");
        spyOn(logger, "warn");
        spyOn(logger, "error");
        spyOn(logger, "info");

        nativePkgr.exec(session, target, testData.config, callback);

        expect(logger.warn).not.toHaveBeenCalledWith("");
        expect(logger.error).not.toHaveBeenCalledWith("");
        expect(logger.info).not.toHaveBeenCalledWith("");
    });

    it("shows debug token warning when path to file is not valid", function () {
        spyOn(pkgrUtils, "writeFile");
        spyOn(logger, "warn");

        session.debug = true;
        //Current time will ensure that the file doesn't exist.
        session.conf.DEBUG_TOKEN = new Date().getTime() + ".bar";

        nativePkgr.exec(session, target, testData.config, callback);

        expect(logger.warn).toHaveBeenCalledWith(localize.translate("EXCEPTION_DEBUG_TOKEN_NOT_FOUND"));
    });

    it("won't show debug token warning when -d options wasn't provided", function () {
        spyOn(pkgrUtils, "writeFile");
        spyOn(logger, "warn");

        session.debug = false;
        //Current time will ensure that the file doesn't exist.
        session.conf.DEBUG_TOKEN = new Date().getTime() + ".bar";

        nativePkgr.exec(session, target, testData.config, callback);

        expect(logger.warn).not.toHaveBeenCalled();
    });

    it("shows debug token warning when debug token not a .bar file", function () {
        spyOn(pkgrUtils, "writeFile");
        spyOn(logger, "warn");

        session.debug = true;
        //Current time will ensure that the file doesn't exist.
        session.conf.DEBUG_TOKEN = new Date().getTime() + ".xyz";

        nativePkgr.exec(session, target, testData.config, callback);
        expect(logger.warn).toHaveBeenCalledWith(localize.translate("EXCEPTION_DEBUG_TOKEN_WRONG_FILE_EXTENSION"));
    });

    it("exec blackberry-nativepackager", function () {
        var bbTabletXML = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
            "<qnx><id>" + config.id + "</id>" +
            "<versionNumber>" + config.version + "</versionNumber>" +
            "<author>" + config.author + "</author>" +
            "<asset entry=\"true\" type=\"qnx/elf\">wwe</asset>" +
            "<asset>abc</asset>" +
            "<asset>xyz</asset>" +
            "<entryPointType>Qnx/WebKit</entryPointType>" +
            "<cascadesTheme>" + config.theme + "</cascadesTheme>" +
            "<initialWindow><systemChrome>none</systemChrome><transparent>true</transparent><autoOrients>true</autoOrients></initialWindow>",
            bbTabletXML2 = "<permission system=\"true\">run_native</permission>" +
            "<permission system=\"false\">access_internet</permission>" +
            "<name>" + config.name['default'] + "</name>" +
            "<description>" + config.description['default'] + "</description></qnx>",
            cmd = "blackberry-nativepackager" + (pkgrUtils.isWindows() ? ".bat" : "");

        spyOn(pkgrUtils, "writeFile").andCallFake(function (sourceDir, outputDir, data) {
            expect(sourceDir).toEqual(session.sourceDir);
            expect(outputDir).toEqual(conf.BAR_DESCRIPTOR);

            //We have to validate the xml data in 2 chucks, because the WEBWORKS_VERSION env variable
            //has a different value for SCM builds and we can't mock the webworks-info file
            expect(data).toContain(bbTabletXML);
            expect(data).toContain(bbTabletXML2);
        });
        nativePkgr.exec(session, target, testData.config, callback);

        expect(fs.writeFileSync).toHaveBeenCalledWith(jasmine.any(String), jasmine.any(String));
        expect(childProcess.spawn).toHaveBeenCalledWith(cmd, ["@options"], {"cwd": session.sourceDir, "env": process.env});
        expect(callback).toHaveBeenCalledWith(0);
    });

    it("makes sure slog2 logging is enabled in debug mode", function () {
        var tabletXMLEntry = "<env value=\"slog2\" var=\"CONSOLE_MODE\"></env>";

        //Silence the logger during unit tests
        spyOn(logger, "warn").andCallFake(function () { });
        spyOn(pkgrUtils, "writeFile").andCallFake(function (sourceDir, outputDir, data) {
            expect(data).toContain(tabletXMLEntry);
        });

        session.debug = true;
        nativePkgr.exec(session, target, testData.config, callback);
    });

    it("makes sure slog2 logging is not enabled when not in debug mode", function () {
        var tabletXMLEntry = "<env value=\"slog2\" var=\"CONSOLE_MODE\"></env>";

        spyOn(pkgrUtils, "writeFile").andCallFake(function (sourceDir, outputDir, data) {
            expect(data).not.toContain(tabletXMLEntry);
        });

        session.debug = false;
        nativePkgr.exec(session, target, testData.config, callback);
    });

    it("can process application name", function () {
        var config = testUtils.cloneObj(testData.config);
        config.name = {"default": "API Smoke Test"};

        spyOn(pkgrUtils, "writeFile").andCallFake(function (fileLocation, fileName, fileData) {
            expect(fileData).toContain("<name>API Smoke Test</name>");
        });

        nativePkgr.exec(session, target, config, callback);

    });

    it("can process localized application name", function () {
        var config = testUtils.cloneObj(testData.config);
        config.name = {"FR": "API Smoke Test - FR"};

        spyOn(pkgrUtils, "writeFile").andCallFake(function (fileLocation, fileName, fileData) {
            expect(fileData).toContain('<name><text xml:lang="FR">API Smoke Test - FR</text></name>');
        });

        nativePkgr.exec(session, target, config, callback);
    });

    it("can process mutiple application names", function () {
        var config = testUtils.cloneObj(testData.config);
        config.name = {
            "default": "API Smoke Test",
            "EN": "API Smoke Test - EN",
            "FR": "API Smoke Test - FR"
        };

        spyOn(pkgrUtils, "writeFile").andCallFake(function (fileLocation, fileName, fileData) {
            expect(fileData).toContain('<name>API Smoke Test<text xml:lang="EN">API Smoke Test - EN</text><text xml:lang="FR">API Smoke Test - FR</text></name>');
        });

        nativePkgr.exec(session, target, config, callback);
    });

    it("can process application description", function () {
        var config = testUtils.cloneObj(testData.config);
        config.description = {"default": "My app description"};

        spyOn(pkgrUtils, "writeFile").andCallFake(function (fileLocation, fileName, fileData) {
            expect(fileData).toContain("<description>My app description</description>");
        });

        nativePkgr.exec(session, target, config, callback);

    });

    it("can process localized application description", function () {
        var config = testUtils.cloneObj(testData.config);
        config.description = {"FR": "My app description - FR"};

        spyOn(pkgrUtils, "writeFile").andCallFake(function (fileLocation, fileName, fileData) {
            expect(fileData).toContain('<description><text xml:lang="FR">My app description - FR</text></description>');
        });

        nativePkgr.exec(session, target, config, callback);
    });

    it("can process mutiple application descriptions", function () {
        var config = testUtils.cloneObj(testData.config);
        config.description = {
            "default": "My app description",
            "EN": "My app description - EN",
            "FR": "My app description - FR"
        };

        spyOn(pkgrUtils, "writeFile").andCallFake(function (fileLocation, fileName, fileData) {
            expect(fileData).toContain('<description>My app description<text xml:lang="EN">My app description - EN</text><text xml:lang="FR">My app description - FR</text></description>');
        });

        nativePkgr.exec(session, target, config, callback);
    });

    it("can process permissions with no attributes", function () {
        var config = testUtils.cloneObj(testData.config);
        config.permissions = ['read_device_identifying_information'];

        spyOn(pkgrUtils, "writeFile").andCallFake(function (fileLocation, fileName, fileData) {
            expect(fileData).toContain("<permission>read_device_identifying_information</permission>");
        });

        nativePkgr.exec(session, target, config, callback);

    });

    it("can process permissions with attributes", function () {
        var config = testUtils.cloneObj(testData.config);
        config.permissions = [{ '#': 'systemPerm', '@': {"system": "true"}}];

        spyOn(pkgrUtils, "writeFile").andCallFake(function (fileLocation, fileName, fileData) {
            expect(fileData).toContain("<permission system=\"true\">systemPerm</permission>");
        });

        nativePkgr.exec(session, target, config, callback);

    });

    it("adds the mandatory permissions for webworks", function () {
        var config = testUtils.cloneObj(testData.config);
        config.permissions = [];

        spyOn(pkgrUtils, "writeFile").andCallFake(function (fileLocation, fileName, fileData) {
            expect(fileData).toContain("<permission system=\"false\">access_internet</permission>");
            expect(fileData).toContain("<permission system=\"true\">run_native</permission>");
        });

        nativePkgr.exec(session, target, config, callback);

    });

    it("omits -devMode when signing and specifying -d", function () {
        testUtils.mockResolve(path);
        spyOn(pkgrUtils, "writeFile");

        var session = testUtils.cloneObj(testData.session),
            config = testUtils.cloneObj(testData.config),
            target = "device",
            optionsFile = "-package" + NL +
                "-buildId" + NL +
                "100" + NL +
                path.normalize("c:/device/Demo.bar") + NL +
                "-barVersion" + NL +
                "1.5" + NL +
                "-C" + NL +
                path.normalize("c:/src/") + NL +
                conf.BAR_DESCRIPTOR + NL +
                path.normalize("c:/src/abc") + NL +
                path.normalize("c:/src/xyz") + NL;

        //Set signing params [-g --buildId]
        session.keystore = path.normalize("c:/author.p12");
        session.storepass = "password";
        config.buildId = "100";

        session.barPath = path.normalize("c:/%s/" + "Demo.bar");
        session.sourceDir = path.normalize("c:/src/");
        session.isSigningRequired = function () {
            return true;
        };

        //Set -d param
        session.debug = "";

        nativePkgr.exec(session, target, config, callback);

        //options file should NOT contain -devMode
        expect(fs.writeFileSync).toHaveBeenCalledWith(jasmine.any(String), optionsFile);
    });

    it("exec blackberry-nativepackager with additional params", function () {
        var cmd = "blackberry-nativepackager" + (pkgrUtils.isWindows() ? ".bat" : "");
        spyOn(pkgrUtils, "writeFile");

        session.getParams = jasmine.createSpy("session getParams").andReturn({
            "-installApp": "",
            "-device": "192.168.1.114",
            "-password": "abc"
        });

        nativePkgr.exec(session, "simulator", testData.config, callback);

        expect(fs.writeFileSync.mostRecentCall.args[0]).toBe(path.resolve(session.sourceDir, "options"));
        expect(fs.writeFileSync.mostRecentCall.args[1]).toContain("-package" + NL);
        expect(fs.writeFileSync.mostRecentCall.args[1]).toContain("-password" + NL);
        expect(fs.writeFileSync.mostRecentCall.args[1]).toContain("abc" + NL);
        expect(fs.writeFileSync.mostRecentCall.args[1]).toContain("-device" + NL);
        expect(fs.writeFileSync.mostRecentCall.args[1]).toContain("192.168.1.114" + NL);
        expect(fs.writeFileSync.mostRecentCall.args[1]).toContain("-installApp" + NL);
        expect(childProcess.spawn).toHaveBeenCalledWith(cmd, ["@options"], {"cwd": session.sourceDir, "env": process.env});
        expect(callback).toHaveBeenCalledWith(0);
    });
});
