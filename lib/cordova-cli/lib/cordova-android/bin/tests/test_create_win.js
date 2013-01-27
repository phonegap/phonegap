// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

var build_path = __dirname + '/../..'
    project_path = process.env.Temp + '\\example',
    package_name = 'org.apache.cordova.example',
    package_as_path = 'org/apache/cordova/example',
    project_name = 'cordovaExample';

var path = require('path'),
    fs = require('fs'),
    util = require('util'),
    assert = require('assert'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn;

var version = fs.readFileSync(build_path + '/VERSION').toString().replace('\r\n', '');

assert(version !== undefined);
assert(version !== '');

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
    exec('rd /s /q ' + project_path);
});

var create_project = spawn('cscript',
                           [build_path + '/bin/create.js',
                            project_path,
                            package_name,
                            project_name]
                          );

create_project.stderr.on('data', function (data) {
  console.log('ps stderr: ' + data);
});

create_project.stderr.on('data', function(data) {
    console.log(data.toString());
});

create_project.stdout.on('data', function(data) {
    console.log(data.toString());
});

create_project.on('exit', function(code) {
    assert.equal(code, 0, 'Project did not get created');

    // make sure the project was created
    path.exists(project_path, function(exists) {
        assert(exists, 'Project path does not exist');
    });

    // make sure the build directory was cleaned up
   // path.exists(build_path + '/framework/libs', function(exists) {
   //     assert(!exists, 'libs directory did not get cleaned up');
   // });
    path.exists(build_path + util.format('/framework/assets/cordova-%s.js', version), function(exists) {
        assert(!exists, 'javascript file did not get cleaned up');
    });
    path.exists(build_path + util.format('/framework/cordova-%s.jar', version), function(exists) {
        assert(!exists, 'jar file did not get cleaned up');
    });

    // make sure AndroidManifest.xml was added
    path.exists(util.format('%s/AndroidManifest.xml', project_path), function(exists) {
        assert(exists, 'AndroidManifest.xml did not get created');
        // TODO check that the activity name was properly substituted
    });

    // make sure main Activity was added 
    path.exists(util.format('%s/src/%s/%s.java', project_path, package_as_path, project_name), function(exists) {
        assert(exists, 'Activity did not get created');
        // TODO check that package name and activity name were substituted properly
    });
   
    // make sure config.xml was added
    path.exists(util.format('%s/res/xml/config.xml', project_path), function(exists) {
        assert(exists, 'config.xml did not get created');
    });
    
    // make sure cordova.jar was added
    path.exists(util.format('%s/libs/cordova-%s.jar', project_path, version), function(exists) {
        assert(exists, 'cordova.jar did not get added');
    });
    
    // make sure cordova.js was added
    path.exists(util.format('%s/assets/www/cordova-%s.js', project_path, version), function(exists) {
        assert(exists, 'cordova.js did not get added');
    });
    
    // make sure cordova master script was added
    path.exists(util.format('%s/cordova/cordova.bat', project_path), function(exists) {
        assert(exists, 'cordova script did not get added');
    });
    
    // make sure debug script was added
    path.exists(util.format('%s/cordova/debug.bat', project_path), function(exists) {
        assert(exists, 'debug script did not get added');
    });
    
    // make sure BOOM script was added
    path.exists(util.format('%s/cordova/BOOM.bat', project_path), function(exists) {
        assert(exists, 'BOOM script did not get added');
    });
    
    // make sure log script was added
    path.exists(util.format('%s/cordova/log.bat', project_path), function(exists) {
        assert(exists, 'log script did not get added');
    });
    
    // make sure clean script was added
    path.exists(util.format('%s/cordova/clean.bat', project_path), function(exists) {
        assert(exists, 'clean script did not get added');
    });
    
    // make sure emulate script was added
    path.exists(util.format('%s/cordova/emulate.bat', project_path), function(exists) {
        assert(exists, 'emulate script did not get added');
    });
    
    // make sure appinfo.jar script was added
    path.exists(util.format('%s/cordova/appinfo.jar', project_path), function(exists) {
        assert(exists, 'appinfo.jar script did not get added');
    });
  
  // check that project compiles && creates a cordovaExample-debug.apk
  // XXX: !@##!@# WINDOWS
    exec('ant debug -f ' + project_path + "\\build.xml", function(error, stdout, stderr) {
        assert(error == null, "Cordova Android Project does not compile");
        path.exists(util.format('%s/bin/%s-debug.apk', project_path, project_name), 
                    function(exists) {
                        assert(exists, 'Package did not get created');
                        // if project compiles properly just AXE it
                        exec('rd /s /q ' + project_path);
                    });
    });


});

