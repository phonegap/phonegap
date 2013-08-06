var session = require(__dirname + "/../../../../../templates/project/cordova/lib/session"),
    localize = require(__dirname + "/../../../../../templates/project/cordova/lib/localize"),
    testUtils = require("./test-utilities"),
    path = require("path"),
    fs = require("fs"),
    wrench = require("wrench"),
    zipLocation = __dirname + "/../../config.xml";

describe("Session", function () {
    beforeEach(function () {
        //Do not create the source folder
        spyOn(wrench, "mkdirSyncRecursive");
    });

    it("sets the source directory correctly when specified [-s C:/sampleApp/mySource]", function () {
        testUtils.mockResolve(path);

        var data = {
            args: [ 'C:/sampleApp/sample.zip' ],
            output: 'C:/sampleApp/bin',
            source: 'C:/sampleApp/mySource'//equivalent to [-s C:/sampleApp/mySource]
        },
        result = session.initialize(data);

        expect(result.sourceDir).toEqual(path.normalize("C:/sampleApp/mySource/src"));
    });

    it("sets the source directory correctly when unspecified [-s] and output path set [-o]", function () {
        testUtils.mockResolve(path);

        var data = {
            args: [ 'C:/sampleApp/sample.zip' ],
            output: 'C:/sampleApp/bin',
            source: true//equivalent to [-s]
        },
        result = session.initialize(data);

        //src folder should be created in output directory
        expect(result.sourceDir).toEqual(path.normalize("C:/sampleApp/bin/src"));
    });

    it("sets the source directory correctly when unspecified [-s] and no output path is set", function () {
        testUtils.mockResolve(path);

        var data = {
            args: [ zipLocation ],
            source: true//equivalent to [-s]
        },
        result = session.initialize(data);

        //src folder should be created in output directory
        expect(result.sourceDir).toEqual(path.join(path.dirname(zipLocation), "src"));
    });

    it("sets the password when specified using -g", function () {
        var data = {
            args: [ 'C:/sampleApp/sample.zip' ],
            output: 'C:/sampleApp/bin',
            source: 'C:/sampleApp/mySource',//equivalent to [-s C:/sampleApp/mySource]
            password: 'myPassword'
        },
        result = session.initialize(data);
        expect(result.storepass).toEqual('myPassword');
    });

    it("does not set the password when not a string", function () {
        //Commander somtimes improperly sets password to a function, when no value provided
        var data = {
            args: [ 'C:/sampleApp/sample.zip' ],
            output: 'C:/sampleApp/bin',
            source: 'C:/sampleApp/mySource',//equivalent to [-s C:/sampleApp/mySource]
            password: function () {}
        },
        result = session.initialize(data);
        expect(result.storepass).toBeUndefined();
    });

    it("sets the buildId when specified [-buildId]", function () {
        var data = {
            args: [ 'C:/sampleApp/sample.zip' ],
            output: 'C:/sampleApp/bin',
            source: 'C:/sampleApp/mySource',//equivalent to [-s C:/sampleApp/mySource]
            buildId: '100'
        },
        result = session.initialize(data);
        expect(result.buildId).toEqual('100');
    });

    it("sets the appdesc correctly when specified [--appdesc C:/path/bardescriptor.xml]", function () {
        testUtils.mockResolve(path);

        var data = {
            args: [ 'C:/sampleApp/sample.zip' ],
            appdesc: 'C:/path/bardescriptor.xml' //equivalent to [--appdesc C:/path/bardescriptor.xml]
        },
        result = session.initialize(data);

        expect(result.appdesc).toEqual(path.normalize("C:/path/bardescriptor.xml"));
    });

    it("sets the appdesc correctly when not specified", function () {
        testUtils.mockResolve(path);

        var data = {
            args: [ 'C:/sampleApp/sample.zip' ]
        },
        result = session.initialize(data);

        expect(result.appdesc).toBeUndefined();
    });

    it("sets the output directory correctly when specified with a relative path [-o myOutput]", function () {
        var bbwpDir = __dirname + "/../../../../../../",
        data = {
            args: [ 'C:/sampleApp/sample.zip' ],
            output: 'myOutput',
        },
        result = session.initialize(data);

        //output should be set to bbwp location + outputFolder
        expect(result.outputDir).toEqual(path.normalize(path.join(bbwpDir, "myOutput")));
    });

    describe("get params", function () {
        beforeEach(function () {
            delete require.cache[require.resolve(__dirname + "/../../../../../templates/project/cordova/lib/session")];
            session = require(__dirname + "/../../../../../templates/project/cordova/lib/session");
        });

        it("get params from external file", function () {
            var data = {
                    args: [ 'C:/sampleApp/sample.zip' ],
                    params: "params.json"
                },
                result;

            spyOn(path, "resolve").andReturn("bin/test/cordova/unit/params.json");
            spyOn(fs, "existsSync").andReturn(true);

            result = session.initialize(data);

            expect(result.getParams("blackberry-signer")).toEqual({
                "-proxyhost": "abc.com",
                "-proxyport": "80"
            });
        });

        it("get params from non-existent file should throw error", function () {
            var data = {
                    args: [ 'C:/sampleApp/sample.zip' ],
                    params: "blah.json"
                },
                result;

            spyOn(fs, "existsSync").andReturn(false);

            result = session.initialize(data);

            expect(function () {
                result.getParams("blackberry-signer");
            }).toThrow(localize.translate("EXCEPTION_PARAMS_FILE_NOT_FOUND", path.resolve("blah.json")));
        });

        it("get params from bad JSON file should throw error", function () {
            var data = {
                    args: [ 'C:/sampleApp/sample.zip' ],
                    params: "params-bad.json"
                },
                result;

            spyOn(path, "resolve").andReturn("test/params-bad.json");
            spyOn(fs, "existsSync").andReturn(true);

            result = session.initialize(data);

            expect(function () {
                result.getParams("blackberry-signer");
            }).toThrow(localize.translate("EXCEPTION_PARAMS_FILE_ERROR", path.resolve("blah.json")));
        });
    });

    describe("when setting the log level", function () {
        var logger = require(__dirname + "/../../../../../templates/project/cordova/lib/logger");

        beforeEach(function () {
            spyOn(logger, "level");
        });

        it("defaults to verbose with no args", function () {
            session.initialize({args: []});
            expect(logger.level).toHaveBeenCalledWith("verbose");
        });

        it("sets level to verbose", function () {
            session.initialize({args: [], loglevel: 'verbose'});
            expect(logger.level).toHaveBeenCalledWith("verbose");
        });

        it("sets level to warn", function () {
            session.initialize({args: [], loglevel: 'warn'});
            expect(logger.level).toHaveBeenCalledWith("warn");
        });

        it("sets level to error", function () {
            session.initialize({args: [], loglevel: 'error'});
            expect(logger.level).toHaveBeenCalledWith("error");
        });
    });
});
