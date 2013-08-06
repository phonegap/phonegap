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
    BBWPignore = require(srcPath + "bbwpignore"),
    fs = require('fs');

describe("bbwpignore can match", function () {
    it("a basic file set", function () {
        var bbwpignore;
        spyOn(fs, "readFileSync").andReturn("abc.js\n" +
                                           "x/y/def.js");
        bbwpignore = new BBWPignore("FileNameIgnoreForTests",
                                    ["d/e/abc.js", "abc.js", "ted.js", ".DS_Store",
                                        "x/y/def.js", "x/def.js", "a/b/x/y/def.js"]);
        expect(bbwpignore.matchedFiles.length).toBe(4);
        expect(bbwpignore.matchedFiles.indexOf("d/e/abc.js")).not.toBe(-1);
        expect(bbwpignore.matchedFiles.indexOf("abc.js")).not.toBe(-1);
        expect(bbwpignore.matchedFiles.indexOf("x/y/def.js")).not.toBe(-1);
        expect(bbwpignore.matchedFiles.indexOf("a/b/x/y/def.js")).not.toBe(-1);
    });

    it("a basic file set with directories", function () {
        var bbwpignore;
        spyOn(fs, "readFileSync").andReturn("abc.js\n" +
                                           "x/y/");
        bbwpignore = new BBWPignore("FileNameIgnoreForTests",
                                    ["d/e/abc.js", "abc.js", "ted.js", ".DS_Store",
                                        "x/y/def.js", "x/def.js", "a/b/x/y/def.js"]);

        expect(bbwpignore.matchedFiles.length).toBe(4);
        expect(bbwpignore.matchedFiles.indexOf("d/e/abc.js")).not.toBe(-1);
        expect(bbwpignore.matchedFiles.indexOf("abc.js")).not.toBe(-1);
        expect(bbwpignore.matchedFiles.indexOf("x/y/def.js")).not.toBe(-1);
        expect(bbwpignore.matchedFiles.indexOf("a/b/x/y/def.js")).not.toBe(-1);
    });

    it("a basic file set with directories that being with slash", function () {
        var bbwpignore;
        spyOn(fs, "readFileSync").andReturn("abc.js\n" +
                                           "/x/y/");
        bbwpignore = new BBWPignore("FileNameIgnoreForTests",
                                    ["d/e/abc.js", "abc.js", "ted.js", ".DS_Store",
                                        "x/y/def.js", "x/def.js", "a/b/x/y/def.js"]);
        expect(bbwpignore.matchedFiles.length).toBe(4);
        expect(bbwpignore.matchedFiles.indexOf("d/e/abc.js")).not.toBe(-1);
        expect(bbwpignore.matchedFiles.indexOf("abc.js")).not.toBe(-1);
        expect(bbwpignore.matchedFiles.indexOf("/x/y")).not.toBe(-1);
        expect(bbwpignore.matchedFiles.indexOf("x/y/def.js")).not.toBe(-1);

    });

    it("a basic file set that begin with a slash on the directory", function () {
        var bbwpignore;
        spyOn(fs, "readFileSync").andReturn("abc.js\n" +
                                           "/x/y/def.js");
        bbwpignore = new BBWPignore("FileNameIgnoreForTests",
                                    ["d/e/abc.js", "abc.js", "ted.js", ".DS_Store",
                                        "x/y/def.js", "x/def.js", "a/b/x/y/def.js"]);

        expect(bbwpignore.matchedFiles.length).toBe(3);
        expect(bbwpignore.matchedFiles.indexOf("d/e/abc.js")).not.toBe(-1);
        expect(bbwpignore.matchedFiles.indexOf("abc.js")).not.toBe(-1);
        expect(bbwpignore.matchedFiles.indexOf("x/y/def.js")).not.toBe(-1);

    });

    it("a basic file set that begin with a slash", function () {
        var bbwpignore;
        spyOn(fs, "readFileSync").andReturn("abc.js\n" +
                                           "/def.js");
        bbwpignore = new BBWPignore("FileNameIgnoreForTests",
                                    ["d/e/abc.js", "abc.js", "ted.js", ".DS_Store",
                                        "x/y/def.js", "x/def.js", "a/b/x/y/def.js"]);

        expect(bbwpignore.matchedFiles.length).toBe(2);
        expect(bbwpignore.matchedFiles.indexOf("d/e/abc.js")).not.toBe(-1);
        expect(bbwpignore.matchedFiles.indexOf("abc.js")).not.toBe(-1);

    });

    it("a basic file set that begin with a slash and has a wildcard", function () {
        var bbwpignore;
        spyOn(fs, "readFileSync").andReturn("abcd.js\n" +
                                           "/*.js");
        bbwpignore = new BBWPignore("FileNameIgnoreForTests",
                                    ["d/e/abc.js", "abc.js", "ted.js", ".DS_Store",
                                        "x/y/def.js", "x/def.js", "a/b/x/y/def.js"]);

        expect(bbwpignore.matchedFiles.length).toBe(2);
        expect(bbwpignore.matchedFiles.indexOf("abc.js")).not.toBe(-1);
        expect(bbwpignore.matchedFiles.indexOf("ted.js")).not.toBe(-1);

    });

    it("a basic file set that begin with a slash and has a wildcard", function () {
        var bbwpignore;
        spyOn(fs, "readFileSync").andReturn("abcd.js\n" +
                                           "a*.js");
        bbwpignore = new BBWPignore("FileNameIgnoreForTests",
                                    ["d/e/abc.js", "abc.js", "ted.js", ".DS_Store",
                                        "x/y/def.js", "x/def.js", "a/b/x/y/def.js"]);

        expect(bbwpignore.matchedFiles.length).toBe(2);
        expect(bbwpignore.matchedFiles.indexOf("d/e/abc.js")).not.toBe(-1);
        expect(bbwpignore.matchedFiles.indexOf("abc.js")).not.toBe(-1);

    });

    it("a basic directory set that begin with a slash", function () {
        var bbwpignore;
        spyOn(fs, "readFileSync").andReturn("/simulator/\n" +
                                           "banana.js");
        bbwpignore = new BBWPignore("FileNameIgnoreForTests",
                                    ["simulator/a.js"]);

        expect(bbwpignore.matchedFiles.length).toBe(2);
        expect(bbwpignore.matchedFiles.indexOf("/simulator")).not.toBe(-1);
        expect(bbwpignore.matchedFiles.indexOf("simulator/a.js")).not.toBe(-1);

    });
});
