var shell = require('shelljs'),
    util  = require('./util'),
    fs    = require('fs'),
    events= require('./events'),
    path  = require('path');

module.exports = function hooker(root) {
    var r = util.isCordova(root);
    if (!r) throw "Not a Cordova project, can't use hooks.";
    else this.root = r;
}

module.exports.prototype = {
    fire:function fire(hook) {
        var dir = path.join(this.root, '.cordova', 'hooks', hook);
        if (!(fs.existsSync(dir))) return true; // hooks directory got axed post-create; ignore.

        // Fire JS hook/event
        events.emit(hook);

        // Fire script-based hooks
        var contents = fs.readdirSync(dir);
        contents.forEach(function(script) {
            var fullpath = path.join(dir, script);
            if (fs.statSync(fullpath).isDirectory()) return; // skip directories if they're in there.
            var status = shell.exec(fullpath);
            if (status.code != 0) throw 'Script "' + path.basename(script) + '"' + 'in the ' + hook + ' hook exited with non-zero status code. Aborting.';
        });
        return true;
    }
}
