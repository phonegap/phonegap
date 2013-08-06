var srcPath = __dirname + "/../../../../../templates/project/cordova/lib/",
    localize = require(srcPath + "localize"),
    cmdline = require(srcPath + "cmdline"),
    cmd;

describe("Command line", function () {
    beforeEach(function () {
        cmd = cmdline
                .parse(process.argv)
                .commander;
    });

    it("accepts -o with argument", function () {
        cmd.parseOptions(["-o", "outdir"]);
        expect(cmd.output).toEqual("outdir");
    });

    it("arg following -o is required", function () {
        spyOn(process, "exit");
        spyOn(console, "error");
        cmd.parseOptions(["-o"]);
        expect(console.error).toHaveBeenCalled();
        expect(process.exit).toHaveBeenCalled();
    });

    it("accepts -s without argument", function () {
        cmd.parseOptions(["-s"]);
        expect(cmd.source).toBeTruthy();
    });

    it("accepts -s with argument", function () {
        cmd.parseOptions(["-s", "mySourceDir"]);
        expect(cmd.source).toEqual("mySourceDir");
    });

    it("accepts -d", function () {
        cmd.parseOptions(["-d"]);
        expect(cmd.debug).toBeTruthy();
    });

    it("accepts --loglevel with argument", function () {
        cmd.parseOptions(["--loglevel", "warn"]);
        expect(cmd.loglevel).toBe("warn");
    });

    it("accepts -ll", function () {
        cmd.parseOptions(["-ll", "error"]);
        expect(cmd.loglevel).toBe("error");
    });

    it("accepts -g with argument", function () {
        cmd.parseOptions(["-g", "myPassword"]);
        expect(cmd.password).toEqual("myPassword");
    });

    it("accepts --buildId with argument", function () {
        cmd.parseOptions(["--buildId", "100"]);
        expect(cmd.buildId).toEqual("100");
    });

    it("accepts -buildId with argument", function () {
        cmd.parseOptions(["-buildId", "100"]);
        expect(cmd.buildId).toEqual("100");
    });

    it("accepts --appdesc with argument", function () {
        cmd.parseOptions(["--appdesc", "bardescriptor"]);
        expect(cmd.appdesc).toEqual("bardescriptor");
    });

    it("throws an error for invalid multi-word arguments", function () {
        expect(function () {
            require(srcPath + "cmdline").parse(["--src"]);
        }).toThrow(localize.translate("EXCEPTION_CMDLINE_ARG_INVALID", "--src"));
    });

});
