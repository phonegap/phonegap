var cordova_util  = require('./util'),
    path          = require('path'),
    config_parser = require('./config_parser'),
    platform     = require('./platform'),
    fs            = require('fs'),
    shell         = require('shelljs'),
    ls            = fs.readdirSync,
    et            = require('elementtree'),
    android_parser= require('./metadata/android_parser'),
    blackberry_parser= require('./metadata/blackberry_parser'),
    ios_parser    = require('./metadata/ios_parser'),
    hooker        = require('./hooker'),
    n             = require('ncallbacks'),
    prompt        = require('prompt'),
    util          = require('util');

function shell_out_to_debug(projectRoot, platform) {
    var cmd = path.join(projectRoot, 'platforms', platform);
    // TODO: wait for https://issues.apache.org/jira/browse/CB-1548 to be fixed before we axe this
    // TODO: this is bb10 only for now
    // TODO: PLATFORM LIBRARY INCONSISTENCY
    if (platform == 'blackberry') {
        cmd = 'ant -f "' + path.join(cmd, 'build.xml') + '" qnx load-device';
    } else {
        cmd = '"' + cmd + '/cordova/build"';
    }
    var response = shell.exec(cmd, {silent:true});
    if (response.code > 0) throw 'An error occurred while building the ' + platform + ' project. ' + response.output;
}

module.exports = function build (platforms, callback) {
    var projectRoot = cordova_util.isCordova(process.cwd());

    if (!projectRoot) {
        throw 'Current working directory is not a Cordova-based project.';
    }

    var xml = path.join(projectRoot, 'www', 'config.xml');
    var assets = path.join(projectRoot, 'www');
    var cfg = new config_parser(xml);

    if (arguments.length === 0 || (platforms instanceof Array && platforms.length === 0)) {
        platforms = ls(path.join(projectRoot, 'platforms'));
    } else if (typeof platforms == 'string') platforms = [platforms];
    else if (platforms instanceof Function && callback === undefined) {
        callback = platforms;
        platforms = ls(path.join(projectRoot, 'platforms'));
    }

    if (platforms.length === 0) throw 'No platforms added to this project. Please use `cordova platform add <platform>`.';

    var hooks = new hooker(projectRoot);
    if (!(hooks.fire('before_build'))) {
        throw 'before_build hooks exited with non-zero code. Aborting.';
    }

    var end = n(platforms.length, function() {
        if (!(hooks.fire('after_build'))) {
            throw 'after_build hooks exited with non-zero code. Aborting.';
        }
        if (callback) callback();
    });

    // Iterate over each added platform 
    platforms.forEach(function(platform) {
        // Figure out paths based on platform
        var parser, platformPath;
        switch (platform) {
            case 'android':
                platformPath = path.join(projectRoot, 'platforms', 'android');
                parser = new android_parser(platformPath);

                // Update the related platform project from the config
                parser.update_project(cfg);
                shell_out_to_debug(projectRoot, 'android');
                end();
                break;
            case 'blackberry':
                platformPath = path.join(projectRoot, 'platforms', 'blackberry');
                parser = new blackberry_parser(platformPath);
                
                // Update the related platform project from the config
                parser.update_project(cfg, function() {
                    // Shell it
                    shell_out_to_debug(projectRoot, 'blackberry');
                    end();
                });
                break;
            case 'ios':
                platformPath = path.join(projectRoot, 'platforms', 'ios');
                parser = new ios_parser(platformPath);

                // Update the related platform project from the config
                parser.update_project(cfg, function() {
                    shell_out_to_debug(projectRoot, 'ios');
                    end();
                });
                break;
        }
    });
};
