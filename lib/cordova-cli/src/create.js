var path          = require('path'),
    fs            = require('fs'),
    shell         = require('shelljs'),
    help          = require('./help'),
    config_parser = require('./config_parser');

var DEFAULT_NAME = "HelloCordova",
    DEFAULT_ID   = "io.cordova.hellocordova";

/**
 * Usage:
 * create(dir) - creates in the specified directory
 * create(dir, name) - as above, but with specified name
 * create(dir, id, name) - you get the gist
 **/
module.exports = function create (dir, id, name) {
    if (dir === undefined) {
        return help();
    }

    // Massage parameters a bit.
    if (id && name === undefined) {
        name = id;
        id = undefined;
    }
    id = id || DEFAULT_ID;
    name = name || DEFAULT_NAME;

    if (!(dir && (dir[0] == '~' || dir[0] == '/'))) {
        dir = dir ? path.join(process.cwd(), dir) : process.cwd();
    }

    var dotCordova = path.join(dir, '.cordova');

    // Check for existing cordova project
    if (fs.existsSync(dotCordova)) {
        throw 'Cordova project already exists at ' + dir + ', aborting.';
    }

    // Create basic project structure.
    shell.mkdir('-p', dotCordova);
    shell.mkdir('-p', path.join(dir, 'platforms'));
    shell.mkdir('-p', path.join(dir, 'plugins'));
    var hooks = path.join(dotCordova, 'hooks');
    shell.mkdir('-p', hooks);

    // Add directories for hooks
    shell.mkdir(path.join(hooks, 'after_build'));
    shell.mkdir(path.join(hooks, 'after_docs'));
    shell.mkdir(path.join(hooks, 'after_emulate'));
    shell.mkdir(path.join(hooks, 'after_platform_add'));
    shell.mkdir(path.join(hooks, 'after_platform_rm'));
    shell.mkdir(path.join(hooks, 'after_platform_ls'));
    shell.mkdir(path.join(hooks, 'after_plugin_add'));
    shell.mkdir(path.join(hooks, 'after_plugin_ls'));
    shell.mkdir(path.join(hooks, 'after_plugin_rm'));
    shell.mkdir(path.join(hooks, 'before_build'));
    shell.mkdir(path.join(hooks, 'before_docs'));
    shell.mkdir(path.join(hooks, 'before_emulate'));
    shell.mkdir(path.join(hooks, 'before_platform_add'));
    shell.mkdir(path.join(hooks, 'before_platform_rm'));
    shell.mkdir(path.join(hooks, 'before_platform_ls'));
    shell.mkdir(path.join(hooks, 'before_plugin_add'));
    shell.mkdir(path.join(hooks, 'before_plugin_ls'));
    shell.mkdir(path.join(hooks, 'before_plugin_rm'));

    // Write out .cordova/config.json file with a simple json manifest
    fs.writeFileSync(path.join(dotCordova, 'config.json'), JSON.stringify({
        id:id,
        name:name
    }));

    // Copy in base template
    shell.cp('-r', path.join(__dirname, '..', 'templates', 'www'), dir);

    // Write out id and name to config.xml
    var configPath = path.join(dir, 'www', 'config.xml');
    var config = new config_parser(configPath);
    config.packageName(id);
    config.name(name);
};
