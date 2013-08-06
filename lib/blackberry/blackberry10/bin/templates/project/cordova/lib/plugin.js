/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var path = require("path"),
    shell = require('shelljs'),
    wrench = require("wrench"),
    fs = require('fs'),
    et   = require('elementtree'),
    escapeStringForShell = require("./packager-utils").escapeStringForShell,
    PROJECT_ROOT = path.join(__dirname, "..", ".."),
    PLUGMAN = escapeStringForShell(path.join(PROJECT_ROOT, "cordova", "node_modules", "plugman", "main.js")),
    GLOBAL_PLUGIN_PATH = require(path.join(PROJECT_ROOT, "project.json")).globalFetchDir,
    LOCAL_PLUGIN_PATH = path.join(PROJECT_ROOT, "plugins"),
    argumentor = {
        action : process.argv[2],
        plugin: process.argv[3],
        args: [],
        reset: function () {
            this.args = [];
            return argumentor;
        },
        setAction: function () {
            this.args.push("--" + this.action);
            return argumentor;
        },
        setPlatform: function () {
            this.args.push("--platform");
            this.args.push("blackberry10");
            return argumentor;
        },
        setProject: function () {
            this.args.push("--project");
            this.args.push(escapeStringForShell(PROJECT_ROOT));
            return argumentor;
        },
        setPlugin: function () {
            var pluginWithoutTrailingSlash = this.plugin.charAt(this.plugin.length - 1) === "/" ? this.plugin.slice(0, -1) : this.plugin;
            this.args.push("--plugin");
            this.args.push(escapeStringForShell(pluginWithoutTrailingSlash));
            return argumentor;
        },
        setPluginsDir: function (isGlobal) {
            this.args.push("--plugins_dir");
            if (isGlobal) {
                this.args.push(escapeStringForShell(GLOBAL_PLUGIN_PATH));
            } else {
                this.args.push(escapeStringForShell(LOCAL_PLUGIN_PATH));
            }
            return argumentor;
        },
        run: function () {
            var cmd = "";
            if (require('os').type().toLowerCase().indexOf("windows") >= 0) {
                cmd += "@node.exe ";
            }
            cmd += PLUGMAN + " " + this.args.join(" ");
            return shell.exec(cmd, {silent: false});
        }
    },
    plugmanInterface= {
        "uninstall": function (plugin) {
                if (plugin) {
                    argumentor.plugin = plugin;
                }
                argumentor.action = "uninstall";
                argumentor.reset().setAction().setPlatform().setProject().setPlugin().setPluginsDir().run();
            },
        "install": function (plugin) {
                if (plugin) {
                    argumentor.plugin = plugin;
                }
                argumentor.reset().setPlatform().setProject().setPlugin().setPluginsDir().run();
            }
    };

function getPluginId(pluginXMLPath) {
    var pluginEt = new et.ElementTree(et.XML(fs.readFileSync(pluginXMLPath, "utf-8")));
    return pluginEt._root.attrib.id;
}

function addPlugin (pluginPath) {
    var plugin = pluginPath || argumentor.plugin,
        pluginDirs = [],
        allFiles;

    //Check if the path they sent in exists
    if (!fs.existsSync(plugin) ) {
        //Check if the plugin has been fetched globally
        plugin = path.resolve(GLOBAL_PLUGIN_PATH, plugin);
        if (!fs.existsSync(plugin)) {
            console.log("Input ", pluginPath || argumentor.plugin, " cannot be resolved as a plugin");
            listHelp();
            process.exit(1);
        }
    }

    allFiles = wrench.readdirSyncRecursive(plugin);
    allFiles.forEach(function (file) {
        var fullPath = path.resolve(plugin, file);

        if (path.basename(file) === "plugin.xml") {
            pluginDirs.push(path.dirname(fullPath));
        }
    });

    if (!pluginDirs.length) {
        console.log("No plugins could be found given the input " + pluginPath || argumentor.plugin);
        listHelp();
        process.exit(1);
    } else {
        pluginDirs.forEach(function (pluginDir) {
            plugmanInterface.install(pluginDir);
        });
    }
}

function removePlugin (pluginPath) {
    var plugin = pluginPath || argumentor.plugin,
        pluginIds = [],
        allFiles;

    //Check if the path they send in exists
    if (!fs.existsSync(plugin) ) {
        //Check if it is the folder name of an installed plugin
        plugin = path.resolve(LOCAL_PLUGIN_PATH, plugin);
        if (!fs.existsSync(plugin)) {
            //Assume that this is a plugin id and continue
            plugin = pluginPath || argumentor.plugin;
        }
    }

    allFiles = wrench.readdirSyncRecursive(plugin);
    allFiles.forEach(function (file) {
        var fullPath = path.resolve(plugin, file),
            pluginEt;

        if (path.basename(file) === "plugin.xml") {
            pluginIds.push(getPluginId(fullPath));
        }
    });

    pluginIds.forEach(function (pluginId) {
        plugmanInterface.uninstall(pluginId);
    });

}

function listPlugins () {
    fs.readdirSync(LOCAL_PLUGIN_PATH).forEach(function (pluginName) {
        //TODO: Parse the plugin.xml and get any extra information ie description
        console.log(pluginName);
    });
}

function listHelp () {
    console.log("\nUsage:");
    console.log("add <plugin_dir> Adds all plugins contained in the given directory");
    console.log("rm <plugin_name> [<plugin_name>] Removes all of the listed plugins");
    console.log("ls Lists all of the currently installed plugins");
}

function cliEntry () {
    switch (argumentor.action) {
        case "add":
            addPlugin();
            break;
        case "rm":
            removePlugin();
            break;
        case "ls":
            listPlugins();
            break;
        default:
            listHelp();
    }
}

module.exports = {
    add: addPlugin,
    rm: removePlugin,
    ls: listPlugins,
    help: listHelp,
    cli: cliEntry
};
