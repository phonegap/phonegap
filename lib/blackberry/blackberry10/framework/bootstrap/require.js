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

var define,
    require;

(function () {
    var unpreparedModules = {},
        readyModules = {},
        ACCEPTABLE_EXTENSIONS = [".js", ".json"],
        DEFAULT_EXTENSION = ".js";

    function hasValidExtension(moduleName) {
        return ACCEPTABLE_EXTENSIONS.some(function (element, index, array) {
            return moduleName.match("\\" + element + "$");
        });
    }


    function normalizeName(originalName, baseName) {
        var nameParts,
            name = originalName.slice(0);
        //remove ^local:// (if it exists) and .js$
        //This will not work for local:// without a trailing js
        name = name.replace(/(?:^local:\/\/)/, "");
        if (name.charAt(0) === '.' && baseName) {
            //Split the baseName and remove the final part (the module name)
            nameParts = baseName.split('/');
            nameParts.pop();
            nameParts = nameParts.concat(name.split('/'));

            name = nameParts.reduce(function (previous, current,  index, array) {
                var returnValue,
                    slashIndex;

                //If previous is a dot, ignore it
                //If previous is ever just .. we're screwed anyway
                if (previous !== '.') {
                    returnValue = previous;
                }

                //If we have a .. then remove a chunk of previous
                if (current === "..") {
                    slashIndex = previous.lastIndexOf('/');
                    //If there's no slash we're either screwed or we remove the final token
                    if (slashIndex !== -1) {
                        returnValue = previous.slice(0, previous.lastIndexOf('/'));
                    } else {
                        returnValue = "";
                    }
                } else if (current !== '.') {
                    //Otherwise simply append anything not a .
                    //Only append a slash if we're not empty
                    if (returnValue.length) {
                        returnValue += "/";
                    }
                    returnValue += current;
                }

                return returnValue;
            });

        }

        //If there is no acceptable extension tack on a .js
        if (!hasValidExtension(name)) {
            name = name + DEFAULT_EXTENSION;
        }

        return name;
    }

    function buildModule(name, dependencies, factory) {
        var module = {exports: {}},
            localRequire = function (moduleName) {
                return require(moduleName, name);
            },
            args = [];
        localRequire.toUrl = function (moduleName, baseName) {
            return require.toUrl(moduleName, baseName || name);
        };
        dependencies.forEach(function (dependency) {
            if (dependency === 'require') {
                args.push(localRequire);
            } else if (dependency === 'exports') {
                args.push(module.exports);
            } else if (dependency === 'module') {
                args.push(module);
            } else {
                //This is because jshint cannot handle out of order functions
                /*global loadModule:false */
                args.push(loadModule(dependency));
                /*global loadModule:true */
            }
        });

        //No need to process dependencies, webworks only has require, exports, module
        factory.apply(this, args);

        //For full AMD we would need logic to also check the return value
        return module.exports;

    }

    function getDefineString(moduleName, body) {
        var evalString = 'define("' + moduleName + '", function (require, exports, module) {',
            isJson = /\.json$/.test(moduleName);

        evalString += isJson ? ' module.exports = ' : '';
        evalString += body.replace(/^\s+|\s+$/g, '');
        evalString += isJson ? ' ;' : '';
        evalString += '});';

        return evalString;
    }

    function loadModule(name, baseName) {
        var normalizedName = normalizeName(name, baseName),
            url,
            xhr,
            loadResult;
        //Always check undefined first, this allows the user to redefine modules
        //(Not used in WebWorks, although it is used in our unit tests)
        if (unpreparedModules[normalizedName]) {
            readyModules[normalizedName] = buildModule(normalizedName, unpreparedModules[normalizedName].dependencies, unpreparedModules[normalizedName].factory);
            delete unpreparedModules[normalizedName];
        }

        //If the module does not exist, load the module from external source
        //Webworks currently only loads APIs from across bridge
        if (!readyModules[normalizedName]) {
            //If the module to be loaded ends in .js then we will define it
            //Also if baseName exists than we have a local require situation
            if (hasValidExtension(name) || baseName) {
                xhr = new XMLHttpRequest();
                url = name;
                //If the module to be loaded starts with local:// go over the bridge
                //Else If the module to be loaded is a relative load it may not have .js extension which is needed
                if (/^local:\/\//.test(name)) {
                    url = "http://localhost:8472/extensions/load/" + normalizedName.replace(/(?:^ext\/)(.+)(?:\/client.js$)/, "$1");

                    xhr.open("GET", url, false);
                    xhr.send(null);
                    try {
                        loadResult = JSON.parse(xhr.responseText);

                        loadResult.dependencies.forEach(function (dep) {
                            /*jshint evil:true */
                            eval(getDefineString(dep.moduleName, dep.body));
                            /*jshint evil:false */
                        });

                        //Trimming responseText to remove EOF chars
                        /*jshint evil:true */
                        eval(getDefineString(normalizedName, loadResult.client));
                        /*jshint evil:false */
                    } catch (err1) {
                        err1.message += ' in ' + url;
                        throw err1;
                    }
                } else {
                    if (baseName) {
                        url = normalizedName;
                    }

                    xhr.open("GET", url, false);
                    xhr.send(null);
                    try {
                        //Trimming responseText to remove EOF chars
                        /*jshint evil:true */
                        eval(getDefineString(normalizedName, xhr.responseText));
                        /*jshint evil:false */
                    } catch (err) {
                        err.message += ' in ' + url;
                        throw err;
                    }
                }

                if (unpreparedModules[normalizedName]) {
                    readyModules[normalizedName] = buildModule(normalizedName, unpreparedModules[normalizedName].dependencies, unpreparedModules[normalizedName].factory);
                    delete unpreparedModules[normalizedName];
                }
            } else {
                throw "module " + name + " cannot be found";
            }

        }

        return readyModules[normalizedName];

    }

    //Use the AMD signature incase we ever want to change.
    //For now we will only be using (name, baseName)
    require = function (dependencies, callback) {
        if (typeof dependencies === "string") {
            //dependencies is the module name and callback is the relName
            //relName is not part of the AMDJS spec, but we use it from localRequire
            return loadModule(dependencies, callback);
        } else if (Array.isArray(dependencies) && typeof callback === 'function') {
            //Call it Asynchronously
            setTimeout(function () {
                buildModule(undefined, dependencies, callback);
            }, 0);
        }
    };

    require.toUrl = function (originalName, baseName) {
        return normalizeName(originalName, baseName);
    };

    //Use the AMD signature incase we ever want to change.
    //For now webworks will only be using (name, factory) signature.
    define = function (name, dependencies, factory) {
        if (typeof name === "string" && typeof dependencies === 'function') {
            factory = dependencies;
            dependencies = ['require', 'exports', 'module'];
        }

        //According to the AMDJS spec we should parse out the require statments
        //from factory.toString and add those to the list of dependencies

        //Normalize the name. Remove local:// and .js
        name = normalizeName(name);
        unpreparedModules[name] = {
            dependencies: dependencies,
            factory: factory
        };
    };
}());

//Export for use in node for unit tests
if (typeof module === "object" && typeof require === "function") {
    module.exports = {
        require: require,
        define: define
    };
}
