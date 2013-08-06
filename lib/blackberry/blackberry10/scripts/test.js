/*
 *  Copyright 2013 Research In Motion Limited.
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

module.exports = function (done, custom) {
    var jasmine = require('jasmine-node'),
        fs = require('fs'),
        specs = (custom !== null && fs.existsSync(custom)) ? [custom]  :
            [
                "framework/test",
                "bin/test/cordova/integration",
                "bin/test/cordova/unit",
                "bin/test/plugins"
            ];
    //console.log(specs);
    jasmine.executeSpecsInFolder({
        'specFolders': specs,
        'onComplete': function (runner) {
            var failedCount = runner.results().failedCount;
            ((done && typeof done === "function") ?  done : process.exit)(failedCount);
        }, 
        'isVerbose': false,
        'showColors': true
    });
};
