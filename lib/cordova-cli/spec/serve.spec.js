var cordova = require('../cordova'),
    path = require('path'),
    shell = require('shelljs'),
    request = require('request'),
    fs = require('fs'),
    util = require('../src/util'),
    hooker = require('../src/hooker'),
    tempDir = path.join(__dirname, '..', 'temp'),
    http = require('http'),
    android_parser = require('../src/metadata/android_parser'),
    ios_parser = require('../src/metadata/ios_parser'),
    blackberry_parser = require('../src/metadata/blackberry_parser');

var cwd = process.cwd();

describe('serve command', function() {
    beforeEach(function() {
        // Make a temp directory
        shell.rm('-rf', tempDir);
        shell.mkdir('-p', tempDir);
    });
    it('should not run outside of a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        process.chdir(tempDir);

        expect(function() {
            cordova.serve('android');
        }).toThrow();
    });


    describe('`serve`', function() {
        var payloads = {
            android: 'This is the Android test file.',
            ios: 'This is the iOS test file.'
        };

        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
            cordova.platform('add', 'android');
            cordova.platform('add', 'ios');

            // Write testing HTML files into the directory.
            fs.writeFileSync(path.join(tempDir, 'platforms', 'android', 'assets', 'www', 'test.html'), payloads.android);
            fs.writeFileSync(path.join(tempDir, 'platforms', 'ios', 'www', 'test.html'), payloads.ios);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        function test_serve(platform, path, expectedContents, port) {
            return function() {
                var ret;
                runs(function() {
                    ret = port ? cordova.serve(platform, port) : cordova.serve(platform);
                });

                waitsFor(function() {
                    return ret.server;
                }, 'the server should start', 1000);

                var done, errorCB;
                runs(function() {
                    expect(ret.server).toBeDefined();
                    errorCB = jasmine.createSpy();
                    http.get({
                        host: 'localhost',
                        port: port || 8000,
                        path: path
                    }).on('response', function(res) {
                        var response = '';
                        res.on('data', function(data) {
                            response += data;
                        });
                        res.on('end', function() {
                            expect(res.statusCode).toEqual(200);
                            expect(response).toEqual(expectedContents);
                            done = true;
                        });
                    }).on('error', errorCB);
                });

                waitsFor(function() {
                    return done;
                }, 'the HTTP request should complete', 1000);

                runs(function() {
                    expect(done).toBeTruthy();
                    expect(errorCB).not.toHaveBeenCalled();

                    ret.server.close();
                });
            };
        };

        it('should serve from top-level www if the file exists there', function() {
            var payload = 'This is test file.';
            fs.writeFileSync(path.join(tempDir, 'www', 'test.html'), payload);
            test_serve('android', '/test.html', payload)();
        });

        it('should fall back to assets/www on Android', test_serve('android', '/test.html', payloads.android));
        it('should fall back to www on iOS', test_serve('ios', '/test.html', payloads.ios));

        it('should honour a custom port setting', test_serve('android', '/test.html', payloads.android, 9001));
    });
});

