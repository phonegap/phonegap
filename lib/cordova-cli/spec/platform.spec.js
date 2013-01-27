var cordova = require('../cordova'),
    path = require('path'),
    shell = require('shelljs'),
    request = require('request'),
    fs = require('fs'),
    et = require('elementtree'),
    config_parser = require('../src/config_parser'),
    helper = require('./helper'),
    util = require('../src/util'),
    hooker = require('../src/hooker'),
    platforms = require('../platforms'),
    tempDir = path.join(__dirname, '..', 'temp');
    android_parser = require('../src/metadata/android_parser'),
    ios_parser = require('../src/metadata/ios_parser'),
    blackberry_parser = require('../src/metadata/blackberry_parser');

var cwd = process.cwd();

describe('platform command', function() {
    beforeEach(function() {
        // Make a temp directory
        shell.rm('-rf', tempDir);
        shell.mkdir('-p', tempDir);
    });
    it('should run inside a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        cordova.create(tempDir);

        process.chdir(tempDir);

        expect(function() {
            cordova.platform();
        }).not.toThrow();
    });
    it('should not run outside of a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        process.chdir(tempDir);

        expect(function() {
            cordova.platform();
        }).toThrow();
    });

    describe('`ls`', function() { 
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        it('should list out no platforms for a fresh project', function() {
            expect(cordova.platform('list').length).toEqual(0);
        });

        it('should list out added platforms in a project', function() {
            var cbtwo = jasmine.createSpy();
            var cb = jasmine.createSpy();

            runs(function() {
                cordova.platform('add', 'android', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, "android create callback");
            runs(function() {
                expect(cordova.platform('list')[0]).toEqual('android');
                cordova.platform('add', 'ios', cbtwo);
            });
            waitsFor(function() { return cbtwo.wasCalled; }, "create callback number two");
            runs(function() {
                expect(cordova.platform('list')[1]).toEqual('ios');
            });
        });
    });

    describe('`add`', function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        describe('without any libraries cloned', function() {
            var bkup = path.join(util.libDirectory, '..', 'bkup');
            beforeEach(function() {
                shell.mkdir('-p', bkup);
                shell.mv(util.libDirectory, bkup);
            });
            afterEach(function() {
                shell.mv(path.join(bkup, fs.readdirSync(bkup)[0]), path.join(util.libDirectory, '..'));
                shell.rm('-rf', bkup);
            });
            it('should download the cordova library', function() {
                var s = spyOn(request, 'get');
                try {
                    cordova.platform('add', 'android', function() {});
                } catch(e) {}

                expect(s).toHaveBeenCalled();
                expect(s.calls[0].args[0]).toMatch(/apache.org\/dist\/cordova.*\.zip$/);
            });
        });

        describe('android', function() {
            it('should add a basic android project', function() {
                cordova.platform('add', 'android');
                expect(fs.existsSync(path.join(tempDir, 'platforms', 'android', 'AndroidManifest.xml'))).toBe(true);
            });
            it('should call android_parser\'s update_project', function() {
                var s = spyOn(android_parser.prototype, 'update_project');
                cordova.platform('add', 'android');
                expect(s).toHaveBeenCalled();
            });
        });
        describe('ios', function() {
            it('should add a basic ios project', function() {
                var cb = jasmine.createSpy();

                runs(function() {
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, "platform add ios callback");
                runs(function() {
                    expect(fs.existsSync(path.join(tempDir, 'platforms', 'ios', 'www'))).toBe(true);
                });
            });
            it('should call ios_parser\'s update_project', function() {
                var s = spyOn(ios_parser.prototype, 'update_project');
                cordova.platform('add', 'ios');
                expect(s).toHaveBeenCalled();
            });
            it('should error out if user does not have xcode 4.5 or above installed', function() {
                var s = spyOn(shell, 'exec').andReturn({code:0,output:'Xcode 4.2.1'});
                expect(function() {
                    cordova.platform('add', 'ios');
                }).toThrow();
            });
            it('should error out if user does not have xcode installed at all', function() {
                var s = spyOn(shell, 'exec').andReturn({code:1});
                expect(function() {
                    cordova.platform('add', 'ios');
                }).toThrow();
            });
        });
        describe('blackberry', function() {
            it('should add a basic blackberry project', function() {
                var cb = jasmine.createSpy();
                var s = spyOn(require('prompt'), 'get').andReturn(true);

                runs(function() {
                    cordova.platform('add', 'blackberry', cb);
                    s.mostRecentCall.args[1](null, {}); // fake out prompt
                });
                waitsFor(function() { return cb.wasCalled; }, "platform add blackberry");
                runs(function() {
                    expect(fs.existsSync(path.join(tempDir, 'platforms', 'blackberry', 'www'))).toBe(true);
                });
            });
            it('should call blackberry_parser\'s update_project', function() {
                var s = spyOn(blackberry_parser.prototype, 'update_project');
                cordova.platform('add', 'blackberry');
                expect(s).toHaveBeenCalled();
            });
        });
        it('should handle multiple platforms', function() {
            var cb = jasmine.createSpy();
            runs(function() {
                cordova.platform('add', ['android', 'ios'], cb);
            });
            waitsFor(function() { return cb.wasCalled; }, "platform add ios+android callback");
            runs(function() {
                expect(fs.existsSync(path.join(tempDir, 'platforms', 'android', 'AndroidManifest.xml'))).toBe(true);
                expect(fs.existsSync(path.join(tempDir, 'platforms', 'ios', 'www'))).toBe(true);
            });
        });
    });

    describe('`remove`',function() { 
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        it('should remove a supported and added platform', function() {
            var cb = jasmine.createSpy();

            runs(function() {
                cordova.platform('add', ['android', 'ios'], cb);
            });
            waitsFor(function() { return cb.wasCalled; }, "android+ios platfomr add callback");
            runs(function() {
                cordova.platform('remove', 'android');
                expect(cordova.platform('ls').length).toEqual(1);
                expect(cordova.platform('ls')[0]).toEqual('ios');
            });
        });
        it('should be able to remove multiple platforms', function() {
            var cb = jasmine.createSpy();

            runs(function() {
                cordova.platform('add', ['android', 'ios'], cb);
            });
            waitsFor(function() { return cb.wasCalled; }, "android+ios platfomr add callback");
            runs(function() {
                cordova.platform('remove', ['android','ios']);
                expect(cordova.platform('ls').length).toEqual(0);
            });
        });
    });

    describe('hooks', function() {
        var s;
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
            s = spyOn(hooker.prototype, 'fire').andReturn(true);
        });
        afterEach(function() {
            process.chdir(cwd);
            shell.rm('-rf', tempDir);
        });

        describe('list (ls) hooks', function() {
            it('should fire before hooks through the hooker module', function() {
                cordova.platform();
                expect(s).toHaveBeenCalledWith('before_platform_ls');
            });
            it('should fire after hooks through the hooker module', function() {
                cordova.platform();
                expect(s).toHaveBeenCalledWith('after_platform_ls');
            });
        });
        describe('remove (rm) hooks', function() {
            it('should fire before hooks through the hooker module', function() {
                cordova.platform('rm', 'android');
                expect(s).toHaveBeenCalledWith('before_platform_rm');
            });
            it('should fire after hooks through the hooker module', function() {
                cordova.platform('rm', 'android');
                expect(s).toHaveBeenCalledWith('after_platform_rm');
            });
        });
        describe('add hooks', function() {
            it('should fire before hooks through the hooker module', function() {
                cordova.platform('add', 'android');
                expect(s).toHaveBeenCalledWith('before_platform_add');
            });
            it('should fire after hooks through the hooker module', function() {
                cordova.platform('add', 'android');
                expect(s).toHaveBeenCalledWith('after_platform_add');
            });
        });
    });
});
