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
    utils = require("./utils"),
    fs = require("fs");

function getToolsDir() {
    if (process.env && process.env.QNX_HOST) {
        var bbndkDir = path.join(process.env.QNX_HOST, "usr");
        if (fs.existsSync(bbndkDir)) {
            //BBNDK exists on path, use its tools
            return bbndkDir;
        }
    }
}

module.exports = {
    ROOT: path.normalize(__dirname + "/../framework"),
    PROJECT_ROOT: path.normalize(__dirname + "/../../"),
    NATIVE: path.normalize(__dirname + "/../../native"),
    JNEXT_AUTH: path.normalize(__dirname + "/../../native/plugins/jnext/auth.txt"),
    BIN: path.normalize(__dirname + "/../framework/bin"),
    LIB: path.normalize(__dirname + "/../framework/lib"),
    EXT: path.normalize(__dirname + "/../../plugins"),
    UI: path.normalize(__dirname + "/../framework/ui-resources"),
    DEPENDENCIES: path.normalize(__dirname + "/../framework/dependencies"),
    DEPENDENCIES_BOOTSTRAP: path.normalize(__dirname + "/../framework/bootstrap"),
    DEPENDENCIES_TOOLS: getToolsDir(),
    DEPENDENCIES_WWE: path.normalize(__dirname + "/../dependencies/%s-wwe"),
    DEBUG_TOKEN: path.normalize(path.join(utils.getCordovaDir(), "blackberry10debugtoken.bar")),
    DEFAULT_ICON: path.normalize(__dirname + "/../default-icon.png"),
    BAR_DESCRIPTOR: "bar-descriptor.xml",
    BBWP_IGNORE_FILENAME: ".bbwpignore"
};
