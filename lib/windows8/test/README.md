## Mobile Spec Suite ##

These specs are designed to run inside the mobile device that implements it - _it will fail in the DESKTOP browser_.

These set of tests is designed to be used with Cordova. You should initialize a fresh Cordova repository for a target platform and then toss these files into the www folder, replacing the
contents. 

Make sure you include cordova-\*.js in the www folder.  You also need to edit cordova.js to reference the version of cordova-\*.js file you are testing.
For example, to test with cordova-0.9.6.1, edit the VERSION variable in the cordova.js file as follows:

    var VERSION='0.9.6.1';

This is done so that you don't have to modify every HTML file when you want to test a new version of Cordova.

The goal is to test mobile device functionality inside a mobile browser.
Where possible, the Cordova API lines up with HTML 5 spec. Maybe down
the road we could use this spec for parts of HTML 5, too :)

### Requirements ###

Various parts of this test suite communicate with external servers.
Therefore, when you wrap up the test suite inside a Cordova application,
make sure you add the following entries to the whitelist!

- audio.ibeat.org
- cordova-filetransfer.jitsu.com
- whatheaders.com
- apache.org (with all subdomains)
- www.google.com
- httpssss://example.com (bad protocol necessary)

