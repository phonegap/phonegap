/*
 * Copyright 2010-2011 Research In Motion Limited.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var audioObjects = {},
    mediaErrorsHandled = false;

// There is a bug in the webplatform handling of media error
// dialogs prior to 10.2. This function needs to be run once
// on the webview which plays audio to prevent freezing.
function handleMediaErrors() {
    var webview = qnx.webplatform.getWebViews()[0],
        handler = webview.onDialogRequested;
    if (!mediaErrorsHandled) {
        webview.allowWebEvent("DialogRequested");
        webview.onDialogRequested = undefined;
        webview.onDialogRequested = function (eventArgs) {
            var parsedArgs = JSON.parse(eventArgs);
            if (parsedArgs.dialogType === 'MediaError') {
                return '{"setPreventDefault": true}';
            }
            handler(eventArgs);
        };
        mediaErrorsHandled = true;
    }
}

module.exports = {

    create: function (success, fail, args, env) {
        var result = new PluginResult(args, env),
            id;

        if (!args[0]) {
            result.error("Media Object id was not sent in arguments");
            return;
        }

        id = JSON.parse(decodeURIComponent(args[0]));

        if (!args[1]){
            audioObjects[id] = new Audio();
        } else {
            audioObjects[id] = new Audio(JSON.parse(decodeURIComponent(args[1])));
        }

        handleMediaErrors();

        result.ok();
    },

    startPlayingAudio: function (success, fail, args, env) {

        var audio,
            id,
            result = new PluginResult(args, env);

        if (!args[0]) {
            result.error("Media Object id was not sent in arguments");
            return;
        }

        id = JSON.parse(decodeURIComponent(args[0]));

        audio = audioObjects[id];

        if (!audio) {
            result.error("Audio object has not been initialized");
        } else {
            audio.play();
            result.ok();
        }
    },

    stopPlayingAudio: function (success, fail, args, env) {

        var audio,
            id,
            result = new PluginResult(args, env);

        if (!args[0]) {
            result.error("Media Object id was not sent in arguments");
            return;
        }

        id = JSON.parse(decodeURIComponent(args[0]));

        audio = audioObjects[id];

        if (!audio) {
            result.error("Audio Object has not been initialized");
            return;
        }

        audio.pause();
        audio.currentTime = 0;

        result.ok();
    },

    seekToAudio: function (success, fail, args, env) {

        var audio,
            result = new PluginResult(args, env);

        if (!args[0]) {
            result.error("Media Object id was not sent in arguments");
            return;
        }

        audio = audioObjects[JSON.parse(decodeURIComponent(args[0]))];

        if (!audio) {
            result.error("Audio Object has not been initialized");
        } else if (!args[1]) {
            result.error("Media seek time argument not found");
        } else {
            try {
                audio.currentTime = JSON.parse(decodeURIComponent(args[1])) / 1000;
                result.ok();
            } catch (e) {
                result.error("Error seeking audio: " + e);
            }
        }
    },

    pausePlayingAudio: function (success, fail, args, env) {

        var audio,
            result = new PluginResult(args, env);

        if (!args[0]) {
            result.error("Media Object id was not sent in arguments");
            return;
        }

        audio = audioObjects[JSON.parse(decodeURIComponent(args[0]))];

        if (!audio) {
            result.error("Audio Object has not been initialized");
            return;
        }

        audio.pause();
    },

    getCurrentPositionAudio: function (success, fail, args, env) {

        var audio,
            result = new PluginResult(args, env);

        if (!args[0]) {
            result.error("Media Object id was not sent in arguments");
            return;
        }

        audio = audioObjects[JSON.parse(decodeURIComponent(args[0]))];

        if (!audio) {
            result.error("Audio Object has not been initialized");
            return;
        }

        result.ok(audio.currentTime);
    },

    getDuration: function (success, fail, args, env) {

        var audio,
            result = new PluginResult(args, env);

        if (!args[0]) {
            result.error("Media Object id was not sent in arguments");
            return;
        }

        audio = audioObjects[JSON.parse(decodeURIComponent(args[0]))];

        if (!audio) {
            result.error("Audio Object has not been initialized");
            return;
        }

        result.ok(audio.duration);
    },

    startRecordingAudio: function (success, fail, args, env) {
        var result = new PluginResult(args, env);
        result.error("Not supported");
    },

    stopRecordingAudio: function (success, fail, args, env) {
        var result = new PluginResult(args, env);
        result.error("Not supported");
    },

    release: function (success, fail, args, env) {
        var audio,
            id,
            result = new PluginResult(args, env);

        if (!args[0]) {
            result.error("Media Object id was not sent in arguments");
            return;
        }

        id = JSON.parse(decodeURIComponent(args[0]));

        audio = audioObjects[id];

        if (audio) {
            if(audio.src !== ""){
                audio.src = undefined;
            }
            audioObjects[id] = undefined;
        }

        result.ok();
    }
};
