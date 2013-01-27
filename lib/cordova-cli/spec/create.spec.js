var cordova = require('../cordova'),
    path    = require('path'),
    shell   = require('shelljs'),
    fs      = require('fs'),
    tempDir = path.join(__dirname, '..', 'temp');

describe('create command', function () {
    beforeEach(function() {
        shell.rm('-rf', tempDir);
    });

    it('should print out help txt if no directory is provided', function() {
        expect(cordova.create()).toMatch(/synopsis/i);
    });
    it('should create a cordova project in the specified directory if parameter is provided', function() {
        cordova.create(tempDir);
        var dotc = path.join(tempDir, '.cordova', 'config.json');
        expect(fs.lstatSync(dotc).isFile()).toBe(true);
        expect(JSON.parse(fs.readFileSync(dotc, 'utf8')).name).toBe("HelloCordova");
        var hooks = path.join(tempDir, '.cordova', 'hooks');
        expect(fs.existsSync(hooks)).toBe(true);
        expect(fs.existsSync(path.join(hooks, 'before_platform_add'))).toBe(true);
        expect(fs.existsSync(path.join(hooks, 'after_platform_add'))).toBe(true);
        expect(fs.existsSync(path.join(hooks, 'before_platform_rm'))).toBe(true);
        expect(fs.existsSync(path.join(hooks, 'after_platform_rm'))).toBe(true);
        expect(fs.existsSync(path.join(hooks, 'before_platform_ls'))).toBe(true);
        expect(fs.existsSync(path.join(hooks, 'after_platform_ls'))).toBe(true);
        expect(fs.existsSync(path.join(hooks, 'before_plugin_add'))).toBe(true);
        expect(fs.existsSync(path.join(hooks, 'after_plugin_add'))).toBe(true);
        expect(fs.existsSync(path.join(hooks, 'before_plugin_rm'))).toBe(true);
        expect(fs.existsSync(path.join(hooks, 'after_plugin_rm'))).toBe(true);
        expect(fs.existsSync(path.join(hooks, 'before_plugin_ls'))).toBe(true);
        expect(fs.existsSync(path.join(hooks, 'after_plugin_ls'))).toBe(true);
        expect(fs.existsSync(path.join(hooks, 'before_build'))).toBe(true);
        expect(fs.existsSync(path.join(hooks, 'after_build'))).toBe(true);
        expect(fs.existsSync(path.join(hooks, 'before_emulate'))).toBe(true);
        expect(fs.existsSync(path.join(hooks, 'after_emulate'))).toBe(true);
        expect(fs.existsSync(path.join(hooks, 'before_docs'))).toBe(true);
        expect(fs.existsSync(path.join(hooks, 'after_docs'))).toBe(true);
    });
    it('should throw if the directory is already a cordova project', function() {
        shell.mkdir('-p', path.join(tempDir, '.cordova'));
        
        expect(function() {
            cordova.create(tempDir);
        }).toThrow();
    });
    it('should create a cordova project in the specified dir with specified name if provided', function() {
        cordova.create(tempDir, "balls");

        expect(fs.lstatSync(path.join(tempDir, '.cordova', 'config.json')).isFile()).toBe(true);

        expect(fs.readFileSync(path.join(tempDir, 'www', 'config.xml')).toString('utf8')).toMatch(/<name>balls<\/name>/);
    });
    it('should create a cordova project in the specified dir with specified name and id if provided', function() {
        cordova.create(tempDir, "birdy.nam.nam", "numnum");

        expect(fs.lstatSync(path.join(tempDir, '.cordova', 'config.json')).isFile()).toBe(true);

        var config = fs.readFileSync(path.join(tempDir, 'www', 'config.xml')).toString('utf8');
        expect(config).toMatch(/<name>numnum<\/name>/);
        expect(config).toMatch(/id="birdy\.nam\.nam"/);
    });
});
