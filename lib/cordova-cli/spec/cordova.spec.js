var cordova = require('../cordova'),
    path = require('path'),
    shell = require('shelljs'),
    androidPlugin = path.join(__dirname, 'fixtures', 'plugins', 'android'),
    tempDir = path.join(__dirname, '..', 'temp');

var cwd = process.cwd();

describe('top-level cordova module', function() {
    beforeEach(function() {
        cordova.create(tempDir);
        process.chdir(tempDir);
    });
    afterEach(function() {
        shell.rm('-rf', tempDir);
        process.chdir(cwd);
    });

    describe('hooks/events', function() {
        describe('for build command', function() {
            beforeEach(function() {
                cordova.platform('add', 'android');
            });
            it('should fire before_build event', function() {
                var s = jasmine.createSpy('event listener');
                cordova.on('before_build', s);
                spyOn(shell, 'exec').andReturn({code:0});
                cordova.build();
                expect(s).toHaveBeenCalled();
            });
            it('should fire after_build event', function() {
                var s = jasmine.createSpy('event listener');
                cordova.on('after_build', s);
                spyOn(shell, 'exec').andReturn({code:0});
                cordova.build();
                expect(s).toHaveBeenCalled();
            });
        });
        
        describe('for docs command', function() {
            // TODO how the f do you spy on express? srsly
            xit('should fire before_docs event', function() {
                var s = jasmine.createSpy('event listener');
                cordova.on('before_docs', s);
                cordova.docs();
                expect(s).toHaveBeenCalled();
            });
            xit('should fire after_docs event', function() {
                var s = jasmine.createSpy('event listener');
                cordova.on('after_docs', s);
                cordova.docs();
                expect(s).toHaveBeenCalled();
            });
        });

        describe('for emulate command', function() {
            beforeEach(function() {
                cordova.platform('add', 'android');
            });
            it('should fire before_emulate event', function() {
                var s = jasmine.createSpy('event listener');
                cordova.on('before_emulate', s);
                spyOn(shell, 'exec').andReturn({code:0});
                cordova.emulate();
                expect(s).toHaveBeenCalled();
            });
            it('should fire after_emulate event', function() {
                var s = jasmine.createSpy('event listener');
                cordova.on('after_emulate', s);
                spyOn(shell, 'exec').andReturn({code:0});
                cordova.emulate();
                expect(s).toHaveBeenCalled();
            });
        });

        describe('for platform command', function() {
            describe('`add`', function() {
                it('should fire before_platform_add event', function() {
                    var s = jasmine.createSpy('event listener');
                    cordova.on('before_platform_add', s);
                    cordova.platform('add', 'android');
                    expect(s).toHaveBeenCalled();
                });
                it('should fire after_platform_add event', function() {
                    var s = jasmine.createSpy('event listener');
                    cordova.on('after_platform_add', s);
                    cordova.platform('add', 'android');
                    expect(s).toHaveBeenCalled();
                });
            });
            describe('`rm`', function() {
                beforeEach(function() {
                    cordova.platform('add', 'android');
                });
                it('should fire before_platform_rm event', function() {
                    var s = jasmine.createSpy('event listener');
                    cordova.on('before_platform_rm', s);
                    cordova.platform('rm', 'android');
                    expect(s).toHaveBeenCalled();
                });
                it('should fire after_platform_rm event', function() {
                    var s = jasmine.createSpy('event listener');
                    cordova.on('after_platform_rm', s);
                    cordova.platform('rm', 'android');
                    expect(s).toHaveBeenCalled();
                });
            });
            describe('`ls`', function() {
                it('should fire before_platform_ls event', function() {
                    var s = jasmine.createSpy('event listener');
                    cordova.on('before_platform_ls', s);
                    cordova.platform('ls');
                    expect(s).toHaveBeenCalled();
                });
                it('should fire after_platform_ls event', function() {
                    var s = jasmine.createSpy('event listener');
                    cordova.on('after_platform_ls', s);
                    cordova.platform('ls');
                    expect(s).toHaveBeenCalled();
                });
            });
        });

        describe('for plugin command', function() {
            describe('`add`', function() {
                beforeEach(function() {
                    cordova.platform('add', 'android');
                });
                it('should fire before_plugin_add event', function() {
                    var s = jasmine.createSpy('event listener');
                    cordova.on('before_plugin_add', s);
                    cordova.plugin('add', androidPlugin);
                    expect(s).toHaveBeenCalled();
                });
                it('should fire after_plugin_add event', function() {
                    var s = jasmine.createSpy('event listener');
                    cordova.on('after_plugin_add', s);
                    cordova.plugin('add', androidPlugin);
                    expect(s).toHaveBeenCalled();
                });
            });
            describe('`rm`', function() {
                beforeEach(function() {
                    cordova.platform('add', 'android');
                    cordova.plugin('add', androidPlugin);
                });
                it('should fire before_plugin_rm event', function() {
                    var s = jasmine.createSpy('event listener');
                    cordova.on('before_plugin_rm', s);
                    cordova.plugin('rm', 'android');
                    expect(s).toHaveBeenCalled();
                });
                it('should fire after_plugin_rm event', function() {
                    var s = jasmine.createSpy('event listener');
                    cordova.on('after_plugin_rm', s);
                    cordova.plugin('rm', 'android');
                    expect(s).toHaveBeenCalled();
                });
            });
            describe('`ls`', function() {
                it('should fire before_plugin_ls event', function() {
                    var s = jasmine.createSpy('event listener');
                    cordova.on('before_plugin_ls', s);
                    cordova.plugin('ls');
                    expect(s).toHaveBeenCalled();
                });
                it('should fire after_plugin_ls event', function() {
                    var s = jasmine.createSpy('event listener');
                    cordova.on('after_plugin_ls', s);
                    cordova.plugin('ls');
                    expect(s).toHaveBeenCalled();
                });
            });
        });
    });
});
