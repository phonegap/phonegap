/**
 * TEST BOOTSTRAP FILE
 * Runs through any bs to make sure the tests are good to go.
 **/

var util      = require('./src/util'),
    path      = require('path'),
    shell     = require('shelljs'),
    platforms = require('./platforms');

// Create native projects using bin/create
var tempDir = path.join(__dirname, 'spec', 'fixtures', 'projects', 'native');
shell.rm('-rf', tempDir);
shell.mkdir('-p', tempDir);

platforms.forEach(function(platform) {
    var fix_path = path.join(tempDir, platform + '_fixture');
    var create = path.join(util.libDirectory, 'cordova-' + platform, 'bin', 'create'); 
    console.log('Creating cordova-' + platform + ' project using live project lib for tests...');
    var cmd = create + ' "' + fix_path + '" org.apache.cordova.cordovaExample cordovaExample';
    if (platform == 'blackberry') cmd = create + ' "' + fix_path + '" cordovaExample';
    var create_result = shell.exec(cmd, {silent:true});
    if (create_result.code > 0) throw ('Could not create a native ' + platform + ' project test fixture: ' + create_result.output);
    console.log('.. complete.');
});
