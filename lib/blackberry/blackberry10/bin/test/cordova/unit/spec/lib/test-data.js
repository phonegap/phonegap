var path = require("path"),
    outputDir = path.resolve("../packager.test"),
    libPath = __dirname + "/../../../../../templates/project/cordova/lib/",
    barConf = require(libPath + "/bar-conf"),
    configPath = path.resolve("test") + "/config.xml";

module.exports = {
    libPath: libPath,
    configPath: configPath,
    session: {
        "barPath": outputDir + "/%s/" + "Demo.bar",
        "outputDir": outputDir,
        "sourceDir": path.resolve(outputDir + "/src"),
        "sourcePaths": {
            "ROOT": path.resolve(outputDir + "/src"),
            "CHROME": path.normalize(path.resolve(outputDir + "/src") + barConf.CHROME),
            "LIB": path.normalize(path.resolve(outputDir + "/src") + barConf.LIB),
            "UI": path.normalize(path.resolve(outputDir + "/src") + barConf.UI),
            "EXT": path.normalize(path.resolve(outputDir + "/src") + barConf.EXT),
            "PLUGINS": path.normalize(path.resolve(outputDir + "/src") + barConf.PLUGINS),
            "JNEXT_PLUGINS": path.normalize(path.resolve(outputDir + "/src") + barConf.JNEXT_PLUGINS)
        },
        "archivePath": path.resolve("bin/test/cordova/unit/test.zip"),
        "conf": require(path.resolve(libPath + "/conf")),
        "targets": ["simulator"],
        isSigningRequired: function () {
            return false;
        },
        getParams: function () {
            return null;
        }
    },
    config: {
        "id": 'Demo',
        "name": { 'default': 'Demo' },
        "version": '1.0.0',
        "author": 'Research In Motion Ltd.',
        "description": { 'default': 'This is a test!' },
        "image": 'test.png',
        "autoOrientation": true,
        "theme": "default"
    },
    accessList: [{
        uri: "http://google.com",
        allowSubDomain: false,
        features: [{
            id: "blackberry.app",
            required: true,
            version: "1.0.0"
        }, {
            id: "blackberry.system",
            required:  true,
            version: "1.0.0"
        }]
    }, {
        uri: "WIDGET_LOCAL",
        allowSubDomain: false,
        features: [{
            id: "blackberry.system",
            required: true,
            version: "1.0.0"
        }]
    }],
    xml2jsConfig: {
        "@": {
            "xmlns": " http://www.w3.org/ns/widgets",
            "xmlns:rim": "http://www.blackberry.com/ns/widgets",
            "version": "1.0.0",
            "id": "myID",
            "rim:header" : "RIM-Widget:rim/widget",
            "rim:userAgent" : "A Test-User-Agent/(Blackberry-Agent)"
        },
        "name": "Demo",
        "content": {
            "@": {
                "src": "local:///startPage.html"
            }
        },
        "author": "Research In Motion Ltd.",
        "license": {
            "#": "Licensed under the Apache License, Version 2.0 (the \"License\"); #you may not use this file except in compliance with the License. #You may obtain a copy of the License at # #http://www.apache.org/licenses/LICENSE-2.0 # #Unless required by applicable law or agreed to in writing, software #distributed under the License is distributed on an \"AS IS\" BASIS, #WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. #See the License for the specific language governing permissions and limitations under the License.",
            "@": {
                "href": "http://www.apache.org/licenses/LICENSE-2.0"
            }
        }
    }
};
