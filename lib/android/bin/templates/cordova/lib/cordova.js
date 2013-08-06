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

var ROOT  = WScript.ScriptFullName.split('\\cordova\\lib\\cordova.js').join(''),
    shell = WScript.CreateObject("WScript.Shell"),
    fso   = WScript.CreateObject('Scripting.FileSystemObject');
//device_id for targeting specific device
var device_id;
//build types
var NONE = 0,
    DEBUG = '--debug',
    RELEASE = '--release',
    NO_BUILD = '--nobuild';
var build_type = NONE;

//deploy tpyes
var NONE = 0,
    EMULATOR = 1,
    DEVICE = 2,
    TARGET = 3;
var deploy_type = NONE;


// log to stdout or stderr
function Log(msg, error) {
    if (error) {
        WScript.StdErr.WriteLine(msg);
    }
    else {
        WScript.StdOut.WriteLine(msg);
    }
} 

// executes a commmand in the shell, returning stdout
function exec(command) {
    var oExec=shell.Exec(command);
    var output = new String();
    while (oExec.Status == 0) {
        if (!oExec.StdOut.AtEndOfStream) {
            var line = oExec.StdOut.ReadLine();
            output += line;
        }
        WScript.sleep(100);
    }
    return output;
}

// executes a command in the shell, returns stdout or stderr if error
function exec_out(command) {
    var oExec=shell.Exec(command);
    var output = new String();
    while (oExec.Status == 0) {
        if (!oExec.StdOut.AtEndOfStream) {
            var line = oExec.StdOut.ReadLine();
            // XXX: Change to verbose mode 
            // WScript.StdOut.WriteLine(line);
            output += line;
        }
        WScript.sleep(100);
    }
    //Check to make sure our scripts did not encounter an error
    if (!oExec.StdErr.AtEndOfStream) {
        var line = oExec.StdErr.ReadAll();
        return {'error' : true, 'output' : line};
    }
    return {'error' : false, 'output' : output};
}

// executes a commmand in the shell and outputs stdout and fails on stderr
function exec_verbose(command) {
    //Log("Command: " + command);
    var oShell=shell.Exec(command);
    while (oShell.Status == 0) {
        //Wait a little bit so we're not super looping
        WScript.sleep(100);
        //Print any stdout output from the script
        if (!oShell.StdOut.AtEndOfStream) {
            var line = oShell.StdOut.ReadLine();
            Log(line);
        }
    }
    //Check to make sure our scripts did not encounter an error
    if (!oShell.StdErr.AtEndOfStream) {
        var line = oShell.StdErr.ReadAll();
        Log(line, true);
        WScript.Quit(2);
    }
}

function version(path) {
    var cordovajs_path = path + "\\assets\\www\\cordova.js";
    if(fso.FileExists(cordovajs_path)) {
        var f = fso.OpenTextFile(cordovajs_path, 1,2);
        var cordovajs = f.ReadAll();
        f.Close();
        var version_regex = /^.*CORDOVA_JS_BUILD_LABEL.*$/m;
        var version_line = cordovajs.match(version_regex) + "";
        var version = version_line.match(/(\d+)\.(\d+)\.(\d+)(rc\d)?/) + "";
        // TODO : figure out why this isn't matching properly so we can remove this substring workaround.
        Log(version.substr(0, ((version.length/2) -1)));
    } else {
        Log("Error : Could not find cordova js.", true);
        Log("Expected Location : " + cordovajs_path, true);
        WScript.Quit(2);
    }

}

function get_devices() {
    var device_list = []
    var local_devices = shell.Exec("%comspec% /c adb devices").StdOut.ReadAll();
    if (local_devices.match(/\w+\tdevice/)) {
        devices = local_devices.split('\r\n');
        //format (ID DESCRIPTION)
        for (i in devices) {
            if (devices[i].match(/\w+\tdevice/) && !devices[i].match(/emulator/)) {
                device_list.push(devices[i].replace(/\t/, ' '));
            }
        }
    }
    return device_list
}

function list_devices() {
    var devices = get_devices();
    if (devices.length > 0) {
        for (i in devices) {
            Log(devices[i]);
        }
    }
    else {
        Log('No devices found, if your device is connected and not showing,');
        Log(' then try and install the drivers for your device.');
        Log(' http://developer.android.com/tools/extras/oem-usb.html');
    }

}

function get_emulator_images() {
    var avd_list = [];
    var local_emulators = shell.Exec("%comspec% /c android list avds").StdOut.ReadAll();
    if (local_emulators.match(/Name\:/)) {
        emulators = local_emulators.split('\n');
        var count = 0;
        var output = '';
        for (i in emulators) {
            // Find the line with the emulator name.
            if (emulators[i].match(/Name\:/)) {
                // strip description
                var emulator_name = emulators[i].replace(/\s*Name\:\s/, '') + ' ';
                avd_list.push(emulator_name);
            }
        }
    }
    return avd_list;
}

function list_emulator_images() {
    var images = get_emulator_images();
    if (images.length > 0) {
        for(i in images) {
            Log(images[i]);
        }
    }
    else {
        Log('No emulators found, if you would like to create an emulator follow the instructions');
        Log(' provided here : http://developer.android.com/tools/devices/index.html');
        Log(' Or run \'android create avd --name <name> --target <targetID>\' in on the command line.');
    }
}

function get_started_emulators() {
    var started_emulators = [];
    var local_devices = shell.Exec("%comspec% /c adb devices").StdOut.ReadAll();
    if (local_devices.match(/emulator/)) {
        devices = local_devices.split('\r\n');
        //format (ID DESCRIPTION)
        for (i in devices) {
            if (devices[i].match(/\w+\tdevice/) && devices[i].match(/emulator/)) {
                started_emulators.push(devices[i].replace(/\t/, ' '));
            }
        }
    }
    return started_emulators
}

function list_started_emulators() {
    var images = get_started_emulators();
    if (images.length > 0) {
        for(i in images) {
            Log(images[i]);
        }
    }
    else {
        Log('No started emulators found, if you would like to start an emulator call ');
        Log('\'list-emulator-images\'');
        Log(' to get the name of an emulator and then start the emulator with');
        Log('\'start-emulator <Name>\'');
    }
}

function create_emulator() {
    //get targets
    var targets = shell.Exec('android.bat list targets').StdOut.ReadAll().match(/id:\s\d+/g);
    if(targets) {
        exec('%comspec% /c android create avd --name cordova_emulator --target ' + targets[targets.length - 1].replace(/id: /, ""));
    } else {
        Log("You do not have any android targets setup. Please create at least one target with the `android` command so that an emulator can be created.", true);
        WScript.Quit(69);
    }
}

function start_emulator(name) {  
    var emulators = get_emulator_images();
    var started_emulators = get_started_emulators();
    var num_started = started_emulators.length;
    var emulator_name;
    var started = false;
    if (name) {
        for (i in emulators) {
            if (emulators[i].substr(0,name.length) == name) {
                Log("Starting emulator : " + name);
                shell.Exec("%comspec% /c emulator -avd " + name + " &");
                //shell.Run("%comspec% /c start cmd /c emulator -cpu-delay 0 -no-boot-anim -cache %Temp%\cache -avd " + name);
                started = true;
            }
        }
    }
    else {
        if (emulators.length > 0 && started_emulators.length == 0) {
            emulator_name = emulators[0].split(' ', 1)[0];
            start_emulator(emulator_name);
            return;
        } else if (started_emulators.length > 0) {
            Log("Emulator already started : " + started_emulators[0].split(' ', 1));
            return;
        } else {
            Log("Error : unable to start emulator, ensure you have emulators availible by checking \'list-emulator-images\'", true);
            WScript.Quit(2);
        }
    }
    if (!started) {
        Log("Error : unable to start emulator, ensure you have emulators availible by checking \'list-emulator-images\'", true);
        WScript.Quit(2);
    }
    else { 
        // wait for emulator to get the ID
        Log('Waiting for emulator...');
        var boot_anim = null;
        var emulator_ID = null;
        var new_started = null;
        var i = 0;
        while(emulator_ID == null && i < 10) {
            new_started = get_started_emulators();
            if(new_started.length > started_emulators.length) {
                // find new emulator that was just started to get it's ID
                for(var i = 0; i < new_started.length; i++) {
                    if (new_started[i] != started_emulators[i]) {
                        emulator_ID = new_started[i].split(' ', 1)[0];
                        boot_anim = exec_out('%comspec% /c adb -s ' + emulator_ID + ' shell getprop init.svc.bootanim');
                        break;
                    }
                }
            }
        }
        if (i == 10) {
             Log('\nEmulator start timed out.');
             WScript.Quit(2);
        }
        i = 0;
        WScript.Stdout.Write('Booting up emulator (this may take a while).');
        // use boot animation property to tell when boot is complete.
        while (!boot_anim.output.match(/stopped/) && i < 100) {
            boot_anim = exec_out('%comspec% /c adb -s ' + emulator_ID + ' shell getprop init.svc.bootanim');
            i++;
            WScript.Stdout.Write('.');
            WScript.Sleep(2000);
        }

        if (i < 100) {
            Log('\nBoot Complete!');
            // Unlock the device
            shell.Exec("%comspec% /c adb -s " + emulator_ID + " shell input keyevent 82");
        } else {
             Log('\nEmulator boot timed out. Failed to load emulator');
             WScript.Quit(2);
        }
    }
}

function get_apk(path) {
    // check if file .apk has been created
    if (fso.FolderExists(path + '\\bin')) {
        var path_to_apk;
        var out_folder = fso.GetFolder(path + '\\bin');
        var out_files = new Enumerator(out_folder.Files);
        for (;!out_files.atEnd(); out_files.moveNext()) {
            var path = out_files.item() + '';
            if (fso.GetExtensionName(path) == 'apk' && !path.match(/unaligned/)) {
                path_to_apk = out_files.item();
                break;
            }
        }
        if (path_to_apk) {
            return path_to_apk;
        }
        else {
            Log('Failed to find apk, make sure you project is built and there is an ', true);
            Log(' apk in <project>\\bin\\.  To build your project use \'<project>\\cordova\\build\'', true);
            WScript.Quit(2);
        }
    }
}

function install_device(path) {
    var devices = get_devices();
    var use_target = false;
    if (devices.length < 1) {
        Log("Error : No devices found to install to, make sure there are devices", true);
        Log(" availible by checking \'<project_dir>\\cordova\\lib\\list-devices\'", true);
        WScript.Quit(2);
    }
    launch(path, devices[0].split(' ', 1)[0], true);
}

function install_emulator(path) {
    var emulators = get_started_emulators();
    var use_target = false;
    if (emulators.length < 1) {
        Log("Error : No emulators found to install to, make sure there are emulators", true);
        Log(" availible by checking \'<project_dir>\\cordova\\lib\\list-started-emulators\'", true);
        WScript.Quit(2);
    }
    launch(path, emulators[0].split(' ', 1)[0], false);
}

function install_target(path) {
    if(device_id) {
        var device = false;
        var emulators = get_started_emulators();
        var devices = get_devices();
        var exists = false;
        for (i in emulators) {
            if (emulators[i].substr(0,device_id.length) == device_id) {
                exists = true;
                break;
            }
        }
        for (i in devices) {
            if (devices[i].substr(0,device_id.length) == device_id) {
                exists = true;
                device = true
                break;
            }
        }
        if (!exists) {
            Log("Error : Unable to find target " + device_id, true);
            Log("Please ensure the target exists by checking \'<project>\\cordova\\lib\\list-started-emulators'");
            Log(" Or  \'<project>\\cordova\\lib\\list-devices'");
        }
        launch(path, device_id, device);
    }
    else {
        Log("You cannot install to a target without providing a valid target ID.", true);
        WScript.Quit(2);
    }
}

function launch(path, id, device) {
     if(id) {
        var path_to_apk = get_apk(path);
        if (path_to_apk) {
            var launch_name = exec_out("%comspec% /c java -jar "+path+"\\cordova\\appinfo.jar "+path+"\\AndroidManifest.xml");
            if (launch_name.error) {
                Log("Failed to get application name from appinfo.jar + AndroidManifest : ", true);
                Log("Output : " + launch_name.output, true);
                WScript.Quit(2);
            }
            if (device) {
                // install on device (-d)
                Log("Installing app on device...");
            } else {
                // install on emulator (-e)
                Log("Installing app on emulator...");
            }
            var cmd = '%comspec% /c adb -s ' + id + ' install -r ' + path_to_apk;
            var install = exec_out(cmd);
            if ( install.error && install.output.match(/Failure/)) {
                Log("Error : Could not install apk to emulator : ", true);
                Log(install.output, true);
                WScript.Quit(2);
            }
            else {
                Log(install.output);
            }
            // launch the application
            Log("Launching application...");
            cmd = '%comspec% /c adb -s ' + id + ' shell am start -W -a android.intent.action.MAIN -n ' + launch_name.output;
            exec_verbose(cmd);
        }
        else {
            Log('Failed to find apk, make sure you project is built and there is an ', true);
            Log(' apk in <project>\\bin\\.  To build your project use \'<project>\\cordova\\build\'', true);
            WScript.Quit(2);
        }
    }
    else {
        Log("You cannot install to a target without providing a valid target ID.", true);
        WScript.Quit(2);
    }
}

function clean(path) {
    Log("Cleaning project...");
    exec("%comspec% /c ant.bat clean -f "+path+"\\build.xml 2>&1");
}

function log() {
    // filter out nativeGetEnabledTags spam from latest sdk bug.
    shell.Run("%comspec% /c adb logcat | grep -v nativeGetEnabledTags");
}

function build(path) {
    switch (build_type) {
        case DEBUG :
            clean(path);
            Log("Building project...");
            exec_verbose("%comspec% /c ant.bat debug -f "+path+"\\build.xml 2>&1");
            break;
        case RELEASE :
            clean(path);
            Log("Building project...");
            exec_verbose("%comspec% /c ant.bat release -f "+path+"\\build.xml 2>&1");
            break;
        case NO_BUILD :
            Log("Skipping build process.");
            break;
        case NONE :
            clean(path);
            Log("WARNING: [ --debug | --release | --nobuild ] not specified, defaulting to --debug.");
            exec_verbose("%comspec% /c ant.bat debug -f "+path+"\\build.xml 2>&1");
            break;
        default :
            Log("Build option not recognized: " + build_type, true);
            WScript.Quit(2);
            break;
    }
}

function run(path) {
    switch(deploy_type) {
        case EMULATOR :
            build(path);
            if(get_started_emulators().length == 0) {
                start_emulator();
            }
            //TODO : Start emulator if one isn't started, and create one if none exists.
            install_emulator(path);
            break;
        case DEVICE :
            build(path);
            install_device(path);
            break;
        case TARGET :
            build(path);
            install_target(path);
            break;
        case NONE :
            if (get_devices().length > 0) {
                Log("WARNING: [ --target=<ID> | --emulator | --device ] not specified, defaulting to --device");
                deploy_type = DEVICE;
            } else {
                Log("WARNING: [ --target=<ID> | --emulator | --device ] not specified, defaulting to --emulator");
                deploy_type = EMULATOR;
            }
            run(path);
            break;
        default :
            Log("Deploy option not recognized: " + deploy_type, true);
            WScript.Quit(2);
            break;
    }
}


var args = WScript.Arguments;
if (args.count() == 0) {
    Log("Error: no args provided.");
    WScript.Quit(2);
}
else {
    // parse command
    switch(args(0)) {
        case "version" :
            version(ROOT);
            break;
        case "build" :
            if(args.Count() > 1) {
                if (args(1) == "--release") {
                    build_type = RELEASE;
                }
                else if (args(1) == "--debug") {
                    build_type = DEBUG;
                }
                else if (args(1) == "--nobuild") {
                    build_type = NO_BUILD;
                }
                else {
                    Log('Error: \"' + args(i) + '\" is not recognized as a build option', true);
                    WScript.Quit(2);
                }
            }
            build(ROOT);
            break;
        case "clean" :
            clean();
            break;
        case "list-devices" :
            list_devices();
            break;
        case "list-emulator-images" :
            list_emulator_images();
            break;
        case "list-started-emulators" :
            list_started_emulators();
            break;
        case "start-emulator" :
            if (args.Count() > 1) {
                start_emulator(args(1))
            } else {
                start_emulator();
            }
            break;
        case "install-emulator" :
            if (args.Count() == 2) {
                if (args(1).substr(0,9) == "--target=") {
                    device_id = args(1).split('--target=').join('');
                    install_emulator(ROOT);
                } else {
                    Log('Error: \"' + args(1) + '\" is not recognized as an install option', true);
                    WScript.Quit(2);
                }
            } else {
                install_emulator(ROOT);
            }
            break;
        case "install-device" :
            if (args.Count() == 2) {
                if (args(1).substr(0,9) == "--target=") {
                    device_id = args(1).split('--target=').join('');
                    install_target(ROOT);
                } else {
                    Log('Error: \"' + args(1) + '\" is not recognized as an install option', true);
                    WScript.Quit(2);
                }
            } else {
                install_device(ROOT);
            }
            break;
        case "run" :
            //parse args
            for(var i = 1; i < args.Count(); i++) {
                if (args(i) == "--release") {
                    build_type = RELEASE;
                }
                else if (args(i) == "--debug") {
                    build_type = DEBUG;
                }
                else if (args(i) == "--nobuild") {
                    build_type = NO_BUILD;
                }
                else if (args(i) == "--emulator" || args(i) == "-e") {
                    deploy_type = EMULATOR;
                }
                else if (args(i) == "--device" || args(i) == "-d") {
                    deploy_type = DEVICE;
                }
                else if (args(i).substr(0,9) == "--target=") {
                    device_id = args(i).split("--target=").join("");
                    deploy_type = TARGET;
                }
                else {
                    Log('Error: \"' + args(i) + '\" is not recognized as a run option', true);
                    WScript.Quit(2);
                }
            }
            run(ROOT);
            break;
        default :
            Log("Cordova does not regognize the command " + args(0), true);
            WScript.Quit(2);
            break;
    }
}

var PhoneGap = cordova;
