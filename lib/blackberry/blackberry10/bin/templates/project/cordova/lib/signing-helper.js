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
var path = require('path'),
    fs = require("fs"),
    os = require('os'),
    childProcess = require("child_process"),
    util = require("util"),
    conf = require("./conf"),
    pkgrUtils = require("./packager-utils"),
    logger = require("./logger"),
    AUTHOR_P12 = "author.p12",
    CSK = "barsigner.csk",
    DB = "barsigner.db",
    _self;

function getDefaultPath(file) {
    // The default location where signing key files are stored will vary based on the OS:
    // Windows XP: %HOMEPATH%\Local Settings\Application Data\Research In Motion
    // Windows Vista and Windows 7: %HOMEPATH%\AppData\Local\Research In Motion
    // Mac OS: ~/Library/Research In Motion
    // UNIX or Linux: ~/.rim
    var p = "";
    if (os.type().toLowerCase().indexOf("windows") >= 0) {
        // Try Windows XP location
        p = process.env.HOMEDRIVE + process.env.HOMEPATH + "\\Local Settings\\Application Data\\Research In Motion\\" + file;
        if (fs.existsSync(p)) {
            return p;
        }

        // Try Windows Vista and Windows 7 location
        p = process.env.HOMEDRIVE + process.env.HOMEPATH + "\\AppData\\Local\\Research In Motion\\" + file;
        if (fs.existsSync(p)) {
            return p;
        }
    } else if (os.type().toLowerCase().indexOf("darwin") >= 0) {
        // Try Mac OS location
        p = process.env.HOME + "/Library/Research In Motion/" + file;
        if (fs.existsSync(p)) {
            return p;
        }
    } else if (os.type().toLowerCase().indexOf("linux") >= 0) {
        // Try Linux location
        p = process.env.HOME + "/.rim/" + file;
        if (fs.existsSync(p)) {
            return p;
        }
    }
}

function execSigner(session, target, callback) {
    var script = "blackberry-signer",
        signer,
        params = session.getParams("blackberry-signer"),
        args = [];

    if (pkgrUtils.isWindows()) {
        script += ".bat";
    }

    args.push("-keystore");
    args.push(session.keystore);
    args.push("-storepass");
    args.push(session.storepass);

    if (params) {
        Object.getOwnPropertyNames(params).forEach(function (p) {
            args.push(p);

            if (params[p]) {
                args.push(params[p]);
            }
        });
    }

    args.push(path.resolve(util.format(session.barPath, target)));

    signer = childProcess.spawn(script, args, {
        "env": process.env
    });

    signer.stdout.on("data", pkgrUtils.handleProcessOutput);

    signer.stderr.on("data", pkgrUtils.handleProcessOutput);

    signer.on("exit", function (code) {
        if (callback && typeof callback === "function") {
            callback(code);
        }
    });
}

_self = {
    getKeyStorePath : function () {
        // Todo: decide where to put sigtool.p12 which is genereated and used in WebWorks SDK for Tablet OS
        return getDefaultPath(AUTHOR_P12);
    },

    getCskPath : function () {
        return getDefaultPath(CSK);
    },

    getDbPath : function () {
        return getDefaultPath(DB);
    },

    execSigner: execSigner
};

module.exports = _self;
