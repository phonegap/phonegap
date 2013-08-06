/*  wrench.js
 *
 *  A collection of various utility functions I've found myself in need of
 *  for use with Node.js (http://nodejs.org/). This includes things like:
 *
 *  - Recursively deleting directories in Node.js (Sync, not Async)
 *  - Recursively copying directories in Node.js (Sync, not Async)
 *  - Recursively chmoding a directory structure from Node.js (Sync, not Async)
 *  - Other things that I'll add here as time goes on. Shhhh...
 *
 *  ~ Ryan McGrath (ryan [at] venodesigns.net)
 */

/* This file is originally licensed under https://raw.github.com/ryanmcgrath/wrench-js/master/LICENSE
 * This code has been copied from https://raw.github.com/ryanmcgrath/wrench-js and modified
 * add the functionality for a callback to the copyDirSyncRecursive method.
 * Modifications have been clearly marked.
 * The callback acts like a filter and you must return true/false from it to include/exclude a file
 */

var wrench = require('wrench'),
    fs = require("fs"),
    _path = require("path");
/*  wrench.copyDirSyncRecursive("directory_to_copy", "new_directory_location", opts);
 *
 *  Recursively dives through a directory and moves all its files to a new location. This is a
 *  Synchronous function, which blocks things until it's done. If you need/want to do this in
 *  an Asynchronous manner, look at wrench.copyDirRecursively() below.
 *
 *  Note: Directories should be passed to this function without a trailing slash.
 */
wrench.copyDirSyncRecursive = function(sourceDir, newDirLocation, opts, callback) {

    /**************************Modification*****************************************/
    if (typeof opts === "function") {
        callback = opts;
        opts = {};
    }
    /**************************Modification End*****************************************/

    if (!opts || !opts.preserve) {
        try {
            if(fs.statSync(newDirLocation).isDirectory()) wrench.rmdirSyncRecursive(newDirLocation);
        } catch(e) { }
    }

    /*  Create the directory where all our junk is moving to; read the mode of the source directory and mirror it */
    var checkDir = fs.statSync(sourceDir);
    try {
        fs.mkdirSync(newDirLocation, checkDir.mode);
    } catch (e) {
        //if the directory already exists, that's okay
        if (e.code !== 'EEXIST') throw e;
    }

    var files = fs.readdirSync(sourceDir);

    for(var i = 0; i < files.length; i++) {
        var currFile = fs.lstatSync(sourceDir + "/" + files[i]);
        /**************************Modified to add if statement*****************************************/
        if (callback && !callback(sourceDir + "/" + files[i], currFile)) {
            continue;
        }
        if(currFile.isDirectory()) {
            /*  recursion this thing right on back. */
            wrench.copyDirSyncRecursive(sourceDir + "/" + files[i], newDirLocation + "/" + files[i], opts, callback);
        } else if(currFile.isSymbolicLink()) {
            var symlinkFull = fs.readlinkSync(sourceDir + "/" + files[i]);
            fs.symlinkSync(symlinkFull, newDirLocation + "/" + files[i]);
        } else {
            /*  At this point, we've hit a file actually worth copying... so copy it on over. */
            var contents = fs.readFileSync(sourceDir + "/" + files[i]);
            fs.writeFileSync(newDirLocation + "/" + files[i], contents);
        }
    }
};


