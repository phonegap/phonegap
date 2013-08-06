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

var path = require("path"),
    util = require("util"),
    packagerUtils = require("./packager-utils"),
    fs = require("fs"),
    conf = require("./conf"),
    BBWPignore = require('./bbwpignore'),
    wrench = require("wrench"),
    zip = require("zip"),
    localize = require("./localize"),
    logger = require("./logger"),
    CLIENT_JS = "client.js",
    SERVER_JS = "index.js",
    VALID_EXTENSIONS = [".js", ".json"],
    CORDOVA_JS_REGEX = /(cordova-.+js)|cordova\.js/;

function unzip(from, to) {
    var data, entries, p, parent;

    if (fs.existsSync(from)) {
        data = fs.readFileSync(from);
        entries = zip.Reader(data).toObject();

        if (!fs.existsSync(to)) {
            wrench.mkdirSyncRecursive(to, "0755");
        }

        for (p in entries) {
            if (p.indexOf("__MACOSX") >= 0) {
                continue;
            }

            if (p.split("/").length > 1) {
                parent = p.split("/").slice(0, -1).join("/");
                wrench.mkdirSyncRecursive(to + "/" + parent, "0755");
            }

            fs.writeFileSync(to + "/" + p, entries[p]);
        }
    } else {
        throw localize.translate("EXCEPTION_WIDGET_ARCHIVE_NOT_FOUND", from);
    }
}

function copyDirContents(from, to) {
    var files = wrench.readdirSyncRecursive(from),
        bbwpignore,
        bbwpignoreFile = path.join(from, conf.BBWP_IGNORE_FILENAME),
        toBeIgnored = [];

    if (fs.existsSync(bbwpignoreFile)) {
        bbwpignore = new BBWPignore(bbwpignoreFile, files);

        bbwpignore.matchedFiles.forEach(function (i) {
            toBeIgnored.push(from + "/" + i);
        });
        toBeIgnored.push(from + "/" + conf.BBWP_IGNORE_FILENAME); //add the .bbwpignore file to the ignore list
    }
    wrench.copyDirSyncRecursive(from, to, {preserve: true}, function (file) {
        return toBeIgnored.indexOf(file) === -1;
    });
}

function prepare(session) {
    var conf = session.conf,
        dest = session.sourcePaths;

    if (fs.existsSync(session.sourceDir)) {
        wrench.rmdirSyncRecursive(session.sourceDir);
    }

    // unzip archive
    if (fs.existsSync(session.archivePath)) {
        if (session.archivePath.toLowerCase().match("[.]zip$")) {
            unzip(session.archivePath, session.sourceDir);
        } else {
            copyDirContents(session.archivePath, session.sourceDir);
        }
    } else {
        throw localize.translate("EXCEPTION_INVALID_ARCHIVE_PATH", session.archivePath);
    }
}


function getModulesArray(dest, files, baseDir) {
    var modulesList = [],
        EXCLUDE_FILES = ["client.js", "manifest.json"];

    function isExcluded(file) {
        return EXCLUDE_FILES.some(function (element) {
            return path.basename(file) === element;
        });
    }

    files.forEach(function (file) {
        file = path.resolve(baseDir, file);

        if (!fs.statSync(file).isDirectory()) {
            if (baseDir !== dest.EXT || !isExcluded(file)) {
                modulesList.push({name: path.relative(path.normalize(dest.CHROME), file).replace(/\\/g, "/"), file: file});
            }
        }
    });

    return modulesList;
}

function generateFrameworkModulesJS(session) {
    var dest = session.sourcePaths,
        modulesList = [],
        modulesStr = "(function () { ",
        frameworkModulesStr = "window.frameworkModules = [",
        libFiles = wrench.readdirSyncRecursive(dest.LIB),
        extFiles,
        extModules;

    modulesList = modulesList.concat(getModulesArray(dest, libFiles, dest.LIB));

    if (fs.existsSync(dest.EXT)) {
        extFiles = wrench.readdirSyncRecursive(dest.EXT);
        extModules = getModulesArray(dest, extFiles, dest.EXT);
        modulesList = modulesList.concat(extModules);
    }

    modulesList.forEach(function (module, index) {
        modulesStr += "define('" + module.name + "', function (require, exports, module) {\n" +
                      fs.readFileSync(module.file, "utf-8") + "\n" +
                      "});\n";
        frameworkModulesStr += "'" + module.name + "'" +  (index !== modulesList.length-1 ? ", " : "");
    });

    modulesStr += "}());";
    frameworkModulesStr += "];\n";
    fs.writeFileSync(path.normalize(dest.CHROME + "/frameworkModules.js"), frameworkModulesStr + modulesStr);
}

function copyNative(session, target) {
    var src = path.normalize(session.conf.NATIVE + "/" + target),
        dest = path.normalize(session.sourceDir);

    copyDirContents(src, dest);
}

function copyWebworks(session) {
    var srcPath = path.normalize(session.conf.PROJECT_ROOT + "/lib"),
        dest = path.normalize(session.sourceDir),
        srcFiles;

    srcFiles = packagerUtils.listFiles(srcPath, function (file) {
        return CORDOVA_JS_REGEX.test(file);
    });

    if (srcFiles.length === 1) {
        packagerUtils.copyFile(srcFiles[0], dest);

        //Rename file to webworks.js
        fs.renameSync(path.join(dest, path.basename(srcFiles[0])), path.join(dest, "cordova.js"));
    } else {
        throw localize.translate("EXCEPTION_CORDOVA_JS_IN_LIB_DIR", srcFiles.length);
    }
}

function hasValidExtension(file) {
    return VALID_EXTENSIONS.some(function (element, index, array) {
        return path.extname(file) === element;
    });
}

function generateUserConfig(session, config) {
    packagerUtils.writeFile(path.join(session.sourcePaths.LIB, "config"), "user.js", "module.exports = " + JSON.stringify(config, null, "    ") + ";");
}

module.exports = {
    unzip: unzip,

    copyNative: copyNative,

    copyWebworks : copyWebworks,

    prepareOutputFiles: prepare,

    generateFrameworkModulesJS: generateFrameworkModulesJS,

    generateUserConfig: generateUserConfig,

    cleanSource: function (session) {
        if (!session.keepSource) {
            wrench.rmdirSyncRecursive(session.sourceDir);
        }
    },

    copyDirContents: copyDirContents
};
