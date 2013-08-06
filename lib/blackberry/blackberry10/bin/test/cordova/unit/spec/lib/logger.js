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

var srcPath = __dirname + "/../../../../../templates/project/cordova/lib/",
    logger = require(srcPath + "logger");

describe("logger", function () {
    describe("when the log level is verbose", function () {
        beforeEach(function () {
            spyOn(console, "log");
            logger.level('verbose');
        });

        it("logs info messages", function () {
            logger.info("cheese is made from milk");
            expect(console.log).toHaveBeenCalledWith("[INFO]    cheese is made from milk");
        });

        it("logs error messages", function () {
            logger.error("PC LOAD LETTER");
            expect(console.log).toHaveBeenCalledWith("[ERROR]   PC LOAD LETTER");
        });

        it("logs warning messages", function () {
            logger.warn("beware the ides of march");
            expect(console.log).toHaveBeenCalledWith("[WARN]    beware the ides of march");
        });

        it("logs messages", function () {
            logger.log("Hulk Smash!");
            expect(console.log).toHaveBeenCalledWith("[BUILD]   Hulk Smash!");
        });
    });

    describe("when the log level is warn", function () {
        beforeEach(function () {
            spyOn(console, "log");
            logger.level('warn');
        });

        it("doesn't log info messages", function () {
            logger.info("cheese is made from milk");
            expect(console.log).not.toHaveBeenCalledWith("[INFO]    cheese is made from milk");
        });

        it("logs error messages", function () {
            logger.error("PC LOAD LETTER");
            expect(console.log).toHaveBeenCalledWith("[ERROR]   PC LOAD LETTER");
        });

        it("logs warning messages", function () {
            logger.warn("beware the ides of march");
            expect(console.log).toHaveBeenCalledWith("[WARN]    beware the ides of march");
        });

        it("logs messages", function () {
            logger.log("Hulk Smash!");
            expect(console.log).toHaveBeenCalledWith("[BUILD]   Hulk Smash!");
        });
    });

    describe("when the log level is error", function () {
        beforeEach(function () {
            spyOn(console, "log");
            logger.level('error');
        });

        it("doesn't log info messages", function () {
            logger.info("cheese is made from milk");
            expect(console.log).not.toHaveBeenCalledWith("[INFO]    cheese is made from milk");
        });

        it("logs error messages", function () {
            logger.error("PC LOAD LETTER");
            expect(console.log).toHaveBeenCalledWith("[ERROR]   PC LOAD LETTER");
        });

        it("doesn't log warning messages", function () {
            logger.warn("beware the ides of march");
            expect(console.log).not.toHaveBeenCalledWith("[WARN]    beware the ides of march");
        });

        it("logs messages", function () {
            logger.log("Hulk Smash!");
            expect(console.log).toHaveBeenCalledWith("[BUILD]   Hulk Smash!");
        });
    });
});
