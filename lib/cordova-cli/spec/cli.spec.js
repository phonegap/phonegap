var shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    cordova = require('../cordova'),
    tempDir = path.join(__dirname, '..', 'temp'),
    plugins = path.join(__dirname, 'fixtures', 'plugins'),
    androidPlugin = path.join(plugins, 'android'),
    testPlugin = path.join(plugins, 'test'),
    bin = path.join(__dirname, '..', 'bin', 'cordova');

var cwd = process.cwd();

describe('cli interface', function() {
    beforeEach(function() {
        shell.rm('-rf', tempDir);
    });
    afterEach(function() {
        shell.rm('-rf', tempDir);
    });

    it('should print out version with -v', function() {
        var cmd = bin + ' -v';
        var output = shell.exec(cmd, {silent:true}).output;
        expect(output.indexOf(require('../package').version)).toBe(0);
    });
    
    describe('create', function() {
        it('should create a project when only dir is specified', function() {
            var cmd = bin + ' create ' + tempDir;
            var result = shell.exec(cmd, {silent:true});
            expect(result.code).toEqual(0);
            expect(fs.existsSync(path.join(tempDir, '.cordova'))).toBe(true);
        });
        it('should create a project when dir + name are specified', function() {
            var cmd = bin + ' create ' + tempDir + ' foobar';
            var result = shell.exec(cmd, {silent:true});
            expect(result.code).toEqual(0);
            expect(fs.existsSync(path.join(tempDir, '.cordova'))).toBe(true);
            expect(fs.readFileSync(path.join(tempDir, 'www', 'config.xml'), 'utf-8')).toMatch(/<name>foobar/i);
        });
        it('should create a project when all parameters are specified', function() {
            var cmd = bin + ' create ' + tempDir + ' ca.filmaj.foobar foobar';
            var result = shell.exec(cmd, {silent:true});
            expect(result.code).toEqual(0);
            expect(fs.existsSync(path.join(tempDir, '.cordova'))).toBe(true);
            var config = fs.readFileSync(path.join(tempDir, 'www', 'config.xml'), 'utf-8');
            expect(config).toMatch(/<name>foobar/i);
            expect(config).toMatch(/id="ca.filmaj.foobar"/i);
        });
    });

    describe('help', function() {
        it('should print out docs as default command', function() {
            var result = shell.exec(bin, {silent:true});
            expect(result.code).toEqual(0);
            expect(result.output).toMatch(new RegExp(fs.readFileSync(path.join(__dirname, '..', 'doc', 'help.txt'), 'utf-8').split('\n')[0]));
        });
        it('should print out docs when explicitly specified', function() {
            var result = shell.exec(bin + ' help', {silent:true});
            expect(result.code).toEqual(0);
            expect(result.output).toMatch(new RegExp(fs.readFileSync(path.join(__dirname, '..', 'doc', 'help.txt'), 'utf-8').split('\n')[0]));
        });
    });

    describe('platform', function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        describe('add', function() {
            it('should be able to add multiple platforms from a single invocation', function() {
                var cmd = bin + ' platform add android ios';
                var result = shell.exec(cmd, {silent:true});
                expect(result.code).toEqual(0);
                var platforms = fs.readdirSync(path.join(tempDir, 'platforms'));
                expect(platforms.length).toEqual(2);
                expect(platforms.indexOf('ios') > -1).toBe(true);
                expect(platforms.indexOf('android') > -1).toBe(true);
            });
            it('should be able to add a single platform', function() {
                var cmd = bin + ' platform add android';
                var result = shell.exec(cmd, {silent:true});
                expect(result.code).toEqual(0);
                var platforms = fs.readdirSync(path.join(tempDir, 'platforms'));
                expect(platforms.length).toEqual(1);
                expect(platforms.indexOf('android') > -1).toBe(true);
            });
        });
        describe('remove', function() {
            beforeEach(function() {
                cordova.platform('add', 'android');
            });
            it('should be able to remove multiple platforms from a single invocation', function() {
                var cb = jasmine.createSpy();
                runs(function() {
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, 'add ios');
                runs(function() {
                    var result = shell.exec(bin + ' platform rm ios android', {silent:true});
                    expect(result.code).toEqual(0);
                    expect(fs.readdirSync(path.join(tempDir, 'platforms')).length).toEqual(0);
                });
            });
            it('should be able to remove a single platform', function() {
                var result = shell.exec(bin + ' platform rm android', {silent:true});
                expect(result.code).toEqual(0);
                expect(fs.readdirSync(path.join(tempDir, 'platforms')).length).toEqual(0);
            });
        });
        describe('ls', function() {
            beforeEach(function() {
                cordova.platform('add', 'android');
            });
            it('should be able to list platforms with no sub-command specified', function() {
                var result = shell.exec(bin + ' platform', {silent:true});
                expect(result.code).toEqual(0);
                expect(result.output).toMatch(/android/);
            });
            it('should be able to list platforms with sub-command specified', function() {
                var result = shell.exec(bin + ' platform ls', {silent:true});
                expect(result.code).toEqual(0);
                expect(result.output).toMatch(/android/);
            });
        });
    });

    describe('plugin', function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
            cordova.platform('add', 'android');
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        describe('add', function() {
            it('should be able to add multiple plugins from a single invocation', function() {
                var cmd = bin + ' plugin add ' + testPlugin + ' ' + androidPlugin;
                var result = shell.exec(cmd, {silent:true});
                expect(result.code).toEqual(0);
                var addedPlugins = fs.readdirSync(path.join(tempDir, 'plugins'));
                expect(addedPlugins.length).toEqual(2);
                expect(addedPlugins.indexOf('android') > -1).toBe(true);
                expect(addedPlugins.indexOf('test') > -1).toBe(true);
            });
            it('should be able to add a single plugin', function() {
                var cmd = bin + ' plugin add ' + testPlugin;
                var result = shell.exec(cmd, {silent:true});
                expect(result.code).toEqual(0);
                var addedPlugins = fs.readdirSync(path.join(tempDir, 'plugins'));
                expect(addedPlugins.length).toEqual(1);
                expect(addedPlugins.indexOf('test') > -1).toBe(true);
            });
        });
        describe('remove', function() {
            beforeEach(function() {
                cordova.plugin('add', [testPlugin, androidPlugin]);
            });
            it('should be able to remove multiple plugins from a single invocation', function() {
                var cmd = bin + ' plugin rm test android';
                var result = shell.exec(cmd, {silent:true});
                expect(result.code).toEqual(0);
                var addedPlugins = fs.readdirSync(path.join(tempDir, 'plugins'));
                expect(addedPlugins.length).toEqual(0);
            });
            it('should be able to remove a single plugin', function() {
                var cmd = bin + ' plugin rm test';
                var result = shell.exec(cmd, {silent:true});
                expect(result.code).toEqual(0);
                var addedPlugins = fs.readdirSync(path.join(tempDir, 'plugins'));
                expect(addedPlugins.length).toEqual(1);
                expect(addedPlugins.indexOf('android') > -1).toBe(true);
            });
        });
        describe('ls', function() {
            beforeEach(function() {
                cordova.plugin('add', androidPlugin);
            });
            it('should be able to list plugins with no sub-command specified', function() {
                var result = shell.exec(bin + ' plugin', {silent:true});
                expect(result.code).toEqual(0);
                expect(result.output).toMatch(/android/);
            });
            it('should be able to list plugins with sub-command specified', function() {
                var result = shell.exec(bin + ' plugin list', {silent:true});
                expect(result.code).toEqual(0);
                expect(result.output).toMatch(/android/);
            });
        });
    });

    describe('build', function() {
        xit('should be able to build all platforms when none are specified');
        xit('should be able to build a specific single platform');
        xit('should be able to build multiple, specific platforms from a single invocation');
    });

    describe('emulate', function() {
        xit('should be able to emulate all platforms when none are specified');
        xit('should be able to emulate a specific single platform');
        xit('should be able to emulate multiple, specific platforms from a single invocation');
    });
});
