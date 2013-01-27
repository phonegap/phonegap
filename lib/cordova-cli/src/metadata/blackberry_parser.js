var fs   = require('fs'),
    path = require('path'),
    et = require('elementtree'),
    prompt = require('prompt'),
    shell = require('shelljs'),
    util = require('../util'),
    config_parser = require('../config_parser');

module.exports = function blackberry_parser(project) {
    if (!fs.existsSync(path.join(project, 'project.properties')) || !fs.existsSync(path.join(project, 'build.xml'))) {
        throw 'The provided path is not a Cordova BlackBerry WebWorks project.';
    }
    this.path = project;
    this.config_path = path.join(this.path, 'www', 'config.xml');
    this.xml = new config_parser(this.config_path);
};

module.exports.prototype = {
    update_from_config:function(config) {
        if (config instanceof config_parser) {
        } else throw 'update_from_config requires a config_parser object';

        this.xml.name(config.name());
        this.xml.packageName(config.packageName());
        this.xml.access.remove();
        var self = this;
        this.xml.doc.findall('access').forEach(function(a) {
            self.xml.doc.getroot().remove(0, a);
        });
        config.access.get().forEach(function(uri) {
            var el = new et.Element('access');
            el.attrib.uri = uri;
            el.attrib.subdomains = 'true';
            self.xml.doc.getroot().append(el);
        });
        this.xml.update();
    },
    update_project:function(cfg, callback) {
        this.update_from_config(cfg);
        this.update_www();
        var self = this;

        // Do we have BB config?
        var projectRoot = util.isCordova(this.path);
        var dotFile = path.join(projectRoot, '.cordova', 'config.json');
        var dot = JSON.parse(fs.readFileSync(dotFile, 'utf-8'));
        if (dot.blackberry === undefined || dot.blackberry.qnx === undefined) {
            this.get_blackberry_environment(function() {
                // Update project.properties
                self.write_project_properties();

                if (callback) callback();
            });
            return;
        }
        // Write out config stuff to project.properties file
        this.write_project_properties();
        if (callback) callback();
    },

    // Returns the platform-specific www directory.
    www_dir:function() {
        return path.join(this.path, 'www');
    },

    update_www:function() {
        var projectRoot = util.isCordova(this.path);
        var www = path.join(projectRoot, 'www');
        var platformWww = path.join(this.path, 'www');

        // Copy everything over except config.xml
        var cfg_www = path.join(www, 'config.xml');
        var temp_cfg = path.join(projectRoot, 'config.xml');
        shell.mv(cfg_www, temp_cfg);
        shell.cp('-rf', path.join(www, '*'), platformWww);
        shell.mv(temp_cfg, cfg_www);

        // Move the js to just cordova.js
        shell.mv('-f', path.join(platformWww, 'cordova-*.js'), path.join(platformWww, 'cordova.js'));

        // Add the webworks.js script file
        // TODO: assumption that index.html is only file that needs the hot webworks script injection
        // TODO: assumption that index.html is entry point to app
        var index = path.join(platformWww, 'index.html');
        var contents = fs.readFileSync(index, 'utf-8');
        contents = contents.replace(/<script type="text\/javascript" src="cordova\.js"><\/script>/, '<script type="text/javascript" src="js/webworks.js"></script><script type="text/javascript" src="cordova.js"></script>');
        fs.writeFileSync(index, contents, 'utf-8');

        util.deleteSvnFolders(platformWww);
    },
    write_project_properties:function() {
        // TODO: eventually support all blackberry sub-platforms
        var projectRoot = util.isCordova(this.path);

        var projFile = path.join(this.path, 'project.properties');
        var props = fs.readFileSync(projFile, 'utf-8');

        var dotFile = path.join(projectRoot, '.cordova', 'config.json');
        var dot = JSON.parse(fs.readFileSync(dotFile, 'utf-8'));

        props = props.replace(/qnx\.bbwp\.dir=.*\n/, 'qnx.bbwp.dir=' + dot.blackberry.qnx.bbwp + '\n');
        props = props.replace(/qnx\.sigtool\.password=.*\n/, 'qnx.sigtool.password=' + dot.blackberry.qnx.signing_password + '\n');
        props = props.replace(/qnx\.device\.ip=.*\n/, 'qnx.device.ip=' + dot.blackberry.qnx.device_ip + '\n');
        props = props.replace(/qnx\.device\.password=.*\n/, 'qnx.device.password=' + dot.blackberry.qnx.device_password + '\n');
        props = props.replace(/qnx\.sim\.ip=.*\n/, 'qnx.sim.ip=' + dot.blackberry.qnx.sim_ip + '\n');
        props = props.replace(/qnx\.sim\.password=.*\n/, 'qnx.sim.password=' + dot.blackberry.qnx.sim_password + '\n');
        fs.writeFileSync(projFile, props, 'utf-8');
    },
    get_blackberry_environment:function(callback) {
        // TODO: add other blackberry sub-platforms
        var projectRoot = util.isCordova(this.path);
        var dotFile = path.join(projectRoot, '.cordova', 'config.json');
        var dot = JSON.parse(fs.readFileSync(dotFile, 'utf-8'));
        // Let's save relevant BB SDK + signing info to .cordova/config.json
        console.log('Looks like we need some of your BlackBerry development environment information. We\'ll just ask you a few questions and we\'ll be on our way to building.');
        prompt.start();
        prompt.get([{
            name:'bbwp',
            required:true,
            description:'Enter the full path to your BB10 bbwp executable'
        },{
            name:'signing_password',
            required:true,
            description:'Enter your BlackBerry signing password',
            hidden:true
        },{
            name:'device_ip',
            description:'Enter the IP to your BB10 device'
        },{
            name:'device_password',
            description:'Enter the password for your BB10 device'
        },{
            name:'sim_ip',
            description:'Enter the IP to your BB10 simulator'
        },{
            name:'sim_password',
            description:'Enter the password for your BB10 simulator'
        }
        ], function(err, results) {
            if (err) throw 'Error during BlackBerry environment config retrieval';
            // Write out .cordova/config.json file
            if (dot.blackberry === undefined) dot.blackberry = {};
            if (dot.blackberry.qnx === undefined) dot.blackberry.qnx = {};
            dot.blackberry.qnx.bbwp = results.bbwp;
            dot.blackberry.qnx.signing_password = results.signing_password;
            dot.blackberry.qnx.device_ip = results.device_ip;
            dot.blackberry.qnx.device_password = results.device_password;
            dot.blackberry.qnx.sim_ip = results.sim_ip;
            dot.blackberry.qnx.sim_password = results.sim_password;
            fs.writeFileSync(dotFile, JSON.stringify(dot), 'utf-8');
            console.log('Perfect! If you need to change any of these properties, just edit the .cordova/config.json file in the root of your cordova project.');
            if (callback) callback();
        });
    }
};
