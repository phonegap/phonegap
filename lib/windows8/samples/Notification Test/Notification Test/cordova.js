(function () {

    var VERSION = '2.7.0',
        currentScript = 'cordova-' + VERSION + '.js',
        scripts = document.getElementsByTagName('script');

    for (var n = 0; n < scripts.length; n++) {
        if (scripts[n].src.indexOf('cordova.js') > -1) {
            var cordovaPath = scripts[n].src.replace('cordova.js', currentScript);
            var scriptElem = document.createElement("script");
            scriptElem.src = cordovaPath;
            document.head.appendChild(scriptElem);
        }
    }

})();

function backHome() {
	if (window.device && device.platform && device.platform.toLowerCase() == 'android') {
            navigator.app.backHistory();
	}
	else {
	    window.history.go(-1);
	}
}

window.alert = window.alert || function (msg, title, btn) { console.log("Alert::" + msg); };
