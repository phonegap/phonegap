var fs   = require('fs'),
    path = require('path'),
    xcode = require('xcode'),
    util = require('../util'),
    shell = require('shelljs'),
    plist = require('plist'),
    et = require('elementtree'),
    config_parser = require('../config_parser');

var default_prefs = {
    "KeyboardDisplayRequiresUserAction":"true",
    "SuppressesIncrementalRendering":"false",
    "UIWebViewBounce":"true",
    "TopActivityIndicator":"gray",
    "EnableLocation":"false",
    "EnableViewportScale":"false",
    "AutoHideSplashScreen":"true",
    "ShowSplashScreenSpinner":"true",
    "MediaPlaybackRequiresUserAction":"false",
    "AllowInlineMediaPlayback":"false",
    "OpenAllWhitelistURLsInWebView":"false",
    "BackupWebStorage":"cloud"
};

module.exports = function ios_parser(project) {
    try {
        var xcodeproj_dir = fs.readdirSync(project).filter(function(e) { return e.match(/\.xcodeproj$/i); })[0];
        if (!xcodeproj_dir) throw 'The provided path is not a Cordova iOS project.';
        this.xcodeproj = path.join(project, xcodeproj_dir);
        this.originalName = this.xcodeproj.substring(this.xcodeproj.lastIndexOf('/'), this.xcodeproj.indexOf('.xcodeproj'));
        this.cordovaproj = path.join(project, this.originalName);
    } catch(e) {
        throw 'The provided path is not a Cordova iOS project.';
    }
    this.path = project;
    this.pbxproj = path.join(this.xcodeproj, 'project.pbxproj');
    this.config = new config_parser(path.join(this.cordovaproj, 'config.xml'));
};
module.exports.prototype = {
    update_from_config:function(config, callback) {
        if (config instanceof config_parser) {
        } else throw 'update_from_config requires a config_parser object';
        var name = config.name();
        var pkg = config.packageName();

        // Update package id (bundle id)
        var plistFile = path.join(this.cordovaproj, this.originalName + '-Info.plist');
        var infoPlist = plist.parseFileSync(plistFile);
        infoPlist['CFBundleIdentifier'] = pkg;
        var info_contents = plist.build(infoPlist);
        info_contents = info_contents.replace(/<string>[\s\r\n]*<\/string>/g,'<string></string>');
        fs.writeFileSync(plistFile, info_contents, 'utf-8');

        // Update whitelist
        var self = this;
        this.config.access.remove();
        config.access.get().forEach(function(uri) {
            self.config.access.add(uri);
        });
        
        // Update preferences
        this.config.preference.remove();
        var prefs = config.preference.get();
        // write out defaults, unless user has specifically overrode it
        for (var p in default_prefs) if (default_prefs.hasOwnProperty(p)) {
            var override = prefs.filter(function(pref) { return pref.name == p; });
            var value = default_prefs[p];
            if (override.length) {
                // override exists
                value = override[0].value;
                // remove from prefs list so we dont write it out again below
                prefs = prefs.filter(function(pref) { return pref.name != p });
            }
            this.config.preference.add({
                name:p,
                value:value
            });
        }
        prefs.forEach(function(pref) {
            self.config.preference.add({
                name:pref.name,
                value:pref.value
            });
        });
        
        // Update product name
        var proj = new xcode.project(this.pbxproj);
        var parser = this;
        proj.parse(function(err,hash) {
            if (err) throw 'An error occured during parsing of project.pbxproj. Start weeping.';
            else {
                proj.updateProductName(name);
                fs.writeFileSync(parser.pbxproj, proj.writeSync(), 'utf-8');
                if (callback) callback();
            }
        });
    },

    // Returns the platform-specific www directory.
    www_dir:function() {
        return path.join(this.path, 'www');
    },

    update_www:function() {
        var projectRoot = util.isCordova(process.cwd());
        // copy over app www assets
        var www = path.join(projectRoot, 'www');
        shell.cp('-rf', www, this.path);
        var project_www = path.join(this.path, 'www');
        // write out proper cordova.js
        // TODO: this seems bad and brittle..
        var js = fs.readdirSync(project_www).filter(function(e) { return e.match(/\.js$/i); })[0];
        shell.mv('-f', path.join(project_www, js), path.join(project_www, 'cordova.js'));
        util.deleteSvnFolders(project_www);
    },
    update_project:function(cfg, callback) {
        var self = this;
        this.update_from_config(cfg, function() {
            self.update_www();
            if (callback) callback();
        });
    }
};
