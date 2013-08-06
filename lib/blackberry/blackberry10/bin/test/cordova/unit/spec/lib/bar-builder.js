var srcPath = __dirname + "/../../../../../templates/project/cordova/lib/",
    path = require("path"),
    wrench = require("wrench"),
    barBuilder = require(srcPath + "bar-builder"),
    fileMgr = require(srcPath + "file-manager"),
    nativePkgr = require(srcPath + "native-packager"),
    logger = require(srcPath + "logger"),
    testData = require("./test-data"),
    extManager = null;

describe("BAR builder", function () {
    it("build() create BAR for specified session", function () {
        var callback = jasmine.createSpy(),
            session = testData.session,
            config = testData.config,
            target = session.targets[0];

        wrench.mkdirSyncRecursive(path.join(session.sourcePaths.LIB, "config"));

        spyOn(wrench, "mkdirSyncRecursive");
        spyOn(fileMgr, "copyWebworks");
        spyOn(fileMgr, "generateFrameworkModulesJS");
        spyOn(nativePkgr, "exec").andCallFake(function (session, target, config, callback) {
            callback(0);
        });

        barBuilder.build(session, testData.config, callback);

        expect(wrench.mkdirSyncRecursive).toHaveBeenCalledWith(session.outputDir + "/" + target);
        expect(fileMgr.generateFrameworkModulesJS).toHaveBeenCalledWith(session);
        expect(nativePkgr.exec).toHaveBeenCalledWith(session, target, config, jasmine.any(Function));
        expect(callback).toHaveBeenCalledWith(0);
    });
});
