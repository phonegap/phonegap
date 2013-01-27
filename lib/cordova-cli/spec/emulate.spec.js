var cordova = require('../cordova'),
    et = require('elementtree'),
    shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    config_parser = require('../src/config_parser'),
    android_parser = require('../src/metadata/android_parser'),
    ios_parser = require('../src/metadata/ios_parser'),
    blackberry_parser = require('../src/metadata/blackberry_parser'),
    hooker = require('../src/hooker'),
    tempDir = path.join(__dirname, '..', 'temp');

var cwd = process.cwd();

describe('emulate command', function() {
    beforeEach(function() {
        // Make a temp directory
        shell.rm('-rf', tempDir);
        shell.mkdir('-p', tempDir);
    });

    it('should not run inside a Cordova-based project with no added platforms', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        cordova.create(tempDir);
        process.chdir(tempDir);
        expect(function() {
            cordova.emulate();
        }).toThrow();
    });
    
    it('should run inside a Cordova-based project with at least one added platform', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        var cb = jasmine.createSpy();
        var cbem = jasmine.createSpy();
        var s;

        runs(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
            cordova.platform('add', 'ios', cb);
        });
        waitsFor(function() { return cb.wasCalled; }, 'platform add ios');

        runs(function() {
            s = spyOn(shell, 'exec').andReturn({code:0});
            expect(function() {
                cordova.emulate(cbem);
            }).not.toThrow();
        });
        waitsFor(function() { return cbem.wasCalled; }, 'ios emulate');

        runs(function() {
            expect(s).toHaveBeenCalled();
        });
    });
    
    it('should not run outside of a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        process.chdir(tempDir);

        expect(function() {
            cordova.emulate();
        }).toThrow();
    });
    
    describe('per platform', function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });
        
        describe('Android', function() {
            beforeEach(function() {
                cordova.platform('add', 'android');
            });

            it('should shell out to run command on Android', function() {
                var s = spyOn(require('shelljs'), 'exec').andReturn({code:0});
                cordova.emulate();
                expect(s.mostRecentCall.args[0].match(/android\/cordova\/run/)).not.toBeNull();
            });
            it('should call android_parser\'s update_project', function() {
                spyOn(require('shelljs'), 'exec').andReturn({code:0});
                var s = spyOn(android_parser.prototype, 'update_project');
                cordova.emulate();
                expect(s).toHaveBeenCalled();
            });
        });
        describe('iOS', function() {
            it('should shell out to emulate command on iOS', function() {
                var cb = jasmine.createSpy();
                var buildcb = jasmine.createSpy();
                var s;

                runs(function() {
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, 'platform add ios callback');
                runs(function() {
                    s = spyOn(require('shelljs'), 'exec').andReturn({code:0});
                    cordova.emulate(buildcb);
                });
                waitsFor(function() { return buildcb.wasCalled; }, 'emulate ios');
                runs(function() {
                    expect(s).toHaveBeenCalled();
                    expect(s.mostRecentCall.args[0].match(/ios\/cordova\/emulate/)).not.toBeNull();
                });
            });
            it('should call ios_parser\'s update_project', function() {
                var cb = jasmine.createSpy();
                var buildcb = jasmine.createSpy();
                var s;

                runs(function() {
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, 'platform add ios callback');
                runs(function() {
                    s = spyOn(ios_parser.prototype, 'update_project');
                    cordova.emulate(buildcb);
                    expect(s).toHaveBeenCalled();
                });
            });
        });
        describe('BlackBerry', function() {
            it('should shell out to ant command on blackberry', function() {
                var buildcb = jasmine.createSpy();
                var cb = jasmine.createSpy();
                var s, t = spyOn(require('prompt'), 'get').andReturn(true);

                runs(function() {
                    cordova.platform('add', 'blackberry', cb);
                    // Fake prompt invoking its callback
                    t.mostRecentCall.args[1](null, {});
                });
                waitsFor(function() { return cb.wasCalled; }, 'platform add blackberry');
                runs(function() {
                    s = spyOn(require('shelljs'), 'exec').andReturn({code:0});
                    cordova.emulate(buildcb);
                });
                waitsFor(function() { return buildcb.wasCalled; }, 'build call', 20000);
                runs(function() {
                    expect(s).toHaveBeenCalled();
                    expect(s.mostRecentCall.args[0].match(/ant -f .*build\.xml qnx load-simulator/)).not.toBeNull();
                });
            });
            it('should call blackberry_parser\'s update_project', function() {
                var cb = jasmine.createSpy();
                var buildcb = jasmine.createSpy();
                var s;

                runs(function() {
                    var p = spyOn(require('prompt'), 'get');
                    cordova.platform('add', 'blackberry', cb);
                    p.mostRecentCall.args[1](null, {});
                });
                waitsFor(function() { return cb.wasCalled; }, 'platform add bb');
                runs(function() {
                    s = spyOn(blackberry_parser.prototype, 'update_project');
                    cordova.emulate(buildcb);
                    expect(s).toHaveBeenCalled();
                });
            });
        });
    });
    describe('specifying platforms to emulate', function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
            cordova.platform('add', 'android');
        });

        afterEach(function() {
            process.chdir(cwd);
            shell.rm('-rf', tempDir);
        });
        it('should only emulate the specified platform (array notation)', function() {
            var cb = jasmine.createSpy();
            var buildcb = jasmine.createSpy();
            var s;
            runs(function() {
                cordova.platform('add', 'ios', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, 'platform add ios');
            runs(function() {
                s = spyOn(shell, 'exec').andReturn({code:0});
                cordova.build(['android'], buildcb);
            });
            waitsFor(function() { return buildcb.wasCalled; }, 'emulate android');
            runs(function() {
                expect(s.callCount).toEqual(1);
            });
        });
        it('should only emulate the specified platform (string notation)', function() {
            var cb = jasmine.createSpy();
            var buildcb = jasmine.createSpy();
            var s;
            runs(function() {
                cordova.platform('add', 'ios', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, 'platform add ios');
            runs(function() {
                s = spyOn(shell, 'exec').andReturn({code:0});
                cordova.build('android', buildcb);
            });
            waitsFor(function() { return buildcb.wasCalled; }, 'emulate android');
            runs(function() {
                expect(s.callCount).toEqual(1);
            });
        });
        it('should handle multiple platforms to be emulated', function() {
            var cb = jasmine.createSpy();
            var bbcb = jasmine.createSpy();
            var buildcb = jasmine.createSpy();
            var s;
            runs(function() {
                cordova.platform('add', 'ios', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, 'platform add ios');
            runs(function() {
                var g = spyOn(require('prompt'), 'get');
                cordova.platform('add', 'blackberry', bbcb);
                g.mostRecentCall.args[1](null, {}); // fake out prompt io
            });
            waitsFor(function() { return bbcb.wasCalled; }, 'platform add bb');
            runs(function() {
                s = spyOn(shell, 'exec').andReturn({code:0});
                cordova.build(['android','ios'], buildcb);
            });
            waitsFor(function() { return buildcb.wasCalled; }, 'emulate android+ios');
            runs(function() {
                expect(s.callCount).toEqual(2);
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

        describe('when platforms are added', function() {
            beforeEach(function() {
                cordova.platform('add', 'android');
                spyOn(shell, 'exec').andReturn({code:0});
            });

            it('should fire before hooks through the hooker module', function() {
                cordova.emulate();
                expect(s).toHaveBeenCalledWith('before_emulate');
            });
            it('should fire after hooks through the hooker module', function() {
                cordova.emulate();
                expect(s).toHaveBeenCalledWith('after_emulate');
            });
        });

        describe('with no platforms added', function() {
            it('should not fire the hooker', function() {
                spyOn(shell, 'exec').andReturn({code:0});
                expect(function() {
                    cordova.emulate();
                }).toThrow();
                expect(s).not.toHaveBeenCalledWith('before_emulate');
                expect(s).not.toHaveBeenCalledWith('after_emulate');
            });
        });
    });
});
