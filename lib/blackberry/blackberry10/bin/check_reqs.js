/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var MIN_NODE_VER = "0.9.9";

function isNodeNewerThanMin () {
    //Current version is stored as a String in format "X.X.X"
    //Must be newer than "0.9.9"
    var currentVer = process.versions.node.split(".").map(function (verNumStr) { return parseInt(verNumStr, 10);});
    return (currentVer[0] > 0 || currentVer[1] > 9 || currentVer[1] === 9 && currentVer[2] >= 9);
}

if (!isNodeNewerThanMin()) {
    console.log("Node version '" + process.versions.node + "' is not new enough. Please upgrade to " + MIN_NODE_VER + " or newer. Aborting.");
    process.exit(1);
}

process.exit(0);
