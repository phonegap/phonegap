var fs         = require('fs'),
    path       = require('path'),
    shell      = require('shelljs');

var lib_path = path.join(__dirname, '..', 'lib')

function chmod(path) {
    shell.exec('chmod +x "' + path + '"', {silent:true});
}

module.exports = {
    libDirectory:lib_path,
    // Runs up the directory chain looking for a .cordova directory.
    // IF it is found we are in a Cordova project.
    // If not.. we're not.
    isCordova: function isCordova(dir) {
        if (dir) {
            var contents = fs.readdirSync(dir);
            if (contents && contents.length && (contents.indexOf('.cordova') > -1)) {
                return dir;
            } else {
                var parent = path.join(dir, '..');
                if (parent && parent.length > 1) {
                    return isCordova(parent);
                } else return false;
            }
        } else return false;
    },
    // Recursively deletes .svn folders from a target path
    deleteSvnFolders:function(dir) {
        var contents = fs.readdirSync(dir);
        contents.forEach(function(entry) {
            var fullpath = path.join(dir, entry);
            if (fs.statSync(fullpath).isDirectory()) {
                if (entry == '.svn') {
                    shell.rm('-rf', fullpath);
                } else module.exports.deleteSvnFolders(fullpath);
            }
        });
    }
};
