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

var jWorkflow = require("jWorkflow"),
    wrench = require("wrench"),
    nativePkgr = require("./native-packager"),
    fileManager = require("./file-manager"),
    localize = require("./localize"),
    logger = require("./logger"),
    signingHelper = require("./signing-helper"),
    targetIdx = 0;

function buildTarget(previous, baton) {
    baton.take();

    var target = this.session.targets[targetIdx++],
        session = this.session,
        config = this.config;

    //Create output folder
    wrench.mkdirSyncRecursive(session.outputDir + "/" + target);

    //Copy resources (could be lost if copying assets from other project)
    fileManager.copyNative(this.session, target);
    //Generate user config here to overwrite default
    fileManager.generateUserConfig(session, config);

    if (config.packageCordovaJs) {
        //Package cordova.js to chrome folder
        fileManager.copyWebworks(this.session);
    }

    //Generate frameworkModules.js (this needs to be done AFTER all files have been copied)
    fileManager.generateFrameworkModulesJS(session);

    //Call native-packager module for target
    nativePkgr.exec(session, target, config, function (code) {
        if (code !== 0) {
            logger.error(localize.translate("EXCEPTION_NATIVEPACKAGER"));
            baton.pass(code);
        } else {
            if (target === "device" && session.isSigningRequired(config)) {
                signingHelper.execSigner(session, target, function (code) {
                    baton.pass(code);
                });
            } else {
                baton.pass(code);
            }
        }
    });
}

function buildWorkflow(session, context) {
    if (session.targets && session.targets.length > 0) {
        var order;

        session.targets.forEach(function (target, idx) {
            if (idx === 0) {
                order = jWorkflow.order(buildTarget, context);
            } else {
                order = order.andThen(buildTarget, context);
            }
        });

        return order;
    } else {
        logger.debug("NOTHING TO BUILD, NO TARGETS");
    }
}

module.exports = {
    build: function (session, config, callback) {
        var context = {
                session: session,
                config: config
            },
            workflow = buildWorkflow(session, context);

        if (workflow) {
            workflow.start({
                "callback": callback
            });
        }
    }
};
