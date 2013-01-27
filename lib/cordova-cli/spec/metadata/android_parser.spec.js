var android_parser = require('../../src/metadata/android_parser'),
    config_parser = require('../../src/config_parser'),
    util = require('../../src/util'),
    path = require('path'),
    shell = require('shelljs'),
    fs = require('fs'),
    et = require('elementtree'),
    tempDir = path.join(__dirname, '..', '..', 'temp'),
    cordova = require('../../cordova');
    cfg_path = path.join(__dirname, '..', 'fixtures', 'projects', 'test', 'www', 'config.xml'),
    android_path = path.join(__dirname, '..', 'fixtures', 'projects', 'native', 'android_fixture'),
    create = path.join(__dirname, '..', '..', 'lib', 'android', 'bin', 'create');

var cwd = process.cwd();

var android_strings = path.join(android_path, 'res', 'values', 'strings.xml');
var android_manifest = path.join(android_path, 'AndroidManifest.xml');
var android_config = path.join(android_path, 'res', 'xml', 'config.xml');
var original_strings = fs.readFileSync(android_strings, 'utf-8');
var original_manifest = fs.readFileSync(android_manifest, 'utf-8');
var original_config = fs.readFileSync(cfg_path, 'utf-8');
var original_android_config = fs.readFileSync(android_config, 'utf-8');

describe('android project parser', function() {
    it('should throw an exception with a path that is not a native android project', function() {
        expect(function() {
            var project = new android_parser(cwd);
        }).toThrow();
    });
    it('should accept a proper native android project path as construction parameter', function() {
        var project;
        expect(function() {
            project = new android_parser(android_path);
        }).not.toThrow();
        expect(project).toBeDefined();
    });

    describe('update_from_config method', function() {
        var project, config;

        beforeEach(function() {
            project = new android_parser(android_path);
            config = new config_parser(cfg_path);
        });
        afterEach(function() {
            fs.writeFileSync(android_strings, original_strings, 'utf-8');
            fs.writeFileSync(android_manifest, original_manifest, 'utf-8');
            fs.writeFileSync(cfg_path, original_config, 'utf-8');
            fs.writeFileSync(android_config, original_android_config, 'utf-8');
        });
        it('should throw an exception if a non config_parser object is passed into it', function() {
            expect(function() {
                project.update_from_config({});
            }).toThrow();
        });
        it('should update the application name properly', function() {
            config.name('bond. james bond.');
            project.update_from_config(config);

            var strings = new et.ElementTree(et.XML(fs.readFileSync(android_strings, 'utf-8')));
            var app_name = strings.find('string[@name="app_name"]').text;

            expect(app_name).toBe('bond. james bond.');
        });
        it('should update the application package name properly', function() {
            var javs = path.join(android_path, 'src', 'ca', 'filmaj', 'dewd', 'cordovaExample.java');
            var orig_javs = path.join(android_path, 'src', 'org', 'apache', 'cordova', 'cordovaExample', 'cordovaExample.java');
            var orig_contents = fs.readFileSync(orig_javs, 'utf-8');
            this.after(function() {
                fs.writeFileSync(orig_javs, orig_contents, 'utf-8');
                shell.rm('-rf', path.join(android_path, 'src', 'ca'));
            });
            config.packageName('ca.filmaj.dewd');
            project.update_from_config(config);

            var manifest = new et.ElementTree(et.XML(fs.readFileSync(android_manifest, 'utf-8')));
            expect(manifest.getroot().attrib.package).toEqual('ca.filmaj.dewd');

            expect(fs.existsSync(javs)).toBe(true);
            expect(fs.readFileSync(javs, 'utf-8')).toMatch(/package ca.filmaj.dewd/i);
        });
        it('should update the whitelist properly', function() {
            config.access.remove('*');
            config.access.add('http://apache.org');
            config.access.add('http://github.com');
            project.update_from_config(config);

            var native_config = new et.ElementTree(et.XML(fs.readFileSync(android_config, 'utf-8')));
            var as = native_config.findall('access');
            expect(as.length).toEqual(2);
            expect(as[0].attrib.origin).toEqual('http://apache.org');
            expect(as[1].attrib.origin).toEqual('http://github.com');
        });
        describe('preferences', function() {
            it('should not change default project preferences and copy over additional project preferences to platform-level config.xml', function() {
                config.preference.add({name:'henrik',value:'sedin'});
                project.update_from_config(config);

                var native_config = new et.ElementTree(et.XML(fs.readFileSync(android_config, 'utf-8')));
                var ps = native_config.findall('preference');
                expect(ps.length).toEqual(3);
                expect(ps[0].attrib.name).toEqual('useBrowserHistory');
                expect(ps[0].attrib.value).toEqual('true');
                expect(ps[2].attrib.name).toEqual('henrik');
                expect(ps[2].attrib.value).toEqual('sedin');
            });
            it('should override a default project preference if applicable', function() {
                config.preference.add({name:'useBrowserHistory',value:'false'});
                project.update_from_config(config);

                var native_config = new et.ElementTree(et.XML(fs.readFileSync(android_config, 'utf-8')));
                var ps = native_config.findall('preference');
                expect(ps.length).toEqual(2);
                expect(ps[0].attrib.name).toEqual('useBrowserHistory');
                expect(ps[0].attrib.value).toEqual('false');
            });
        });
    });

    describe('update_www method', function() {
        var parser, android_platform;

        beforeEach(function() {
            shell.rm('-rf', tempDir);
            cordova.create(tempDir);
            process.chdir(tempDir);
            cordova.platform('add', 'android');
            android_platform = path.join(tempDir, 'platforms', 'android');
            parser = new android_parser(android_platform);
        });
        afterEach(function() {
            process.chdir(cwd);
        });

        it('should update all www assets', function() {
            var newFile = path.join(tempDir, 'www', 'somescript.js');
            fs.writeFileSync(newFile, 'alert("sup");', 'utf-8');
            parser.update_www();
            expect(fs.existsSync(path.join(android_platform, 'assets', 'www', 'somescript.js'))).toBe(true);
        });
        it('should write out android js to cordova.js', function() {
            parser.update_www();
            expect(fs.readFileSync(path.join(android_platform, 'assets', 'www', 'cordova.js'),'utf-8')).toBe(fs.readFileSync(path.join(util.libDirectory, 'cordova-android', 'framework', 'assets', 'js', 'cordova.android.js'), 'utf-8'));
        });
    });

    describe('update_project method', function() {
        var parser, android_platform, cfg;

        beforeEach(function() {
            shell.rm('-rf', tempDir);
            cordova.create(tempDir);
            process.chdir(tempDir);
            cordova.platform('add', 'android');
            android_platform = path.join(tempDir, 'platforms', 'android');
            parser = new android_parser(android_platform);
            cfg = new config_parser(cfg_path);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        it('should invoke update_www', function() {
            var spyWww = spyOn(parser, 'update_www');
            parser.update_project(cfg);
            expect(spyWww).toHaveBeenCalled();
        });
        it('should invoke update_from_config', function() {
            var spyConfig = spyOn(parser, 'update_from_config');
            parser.update_project(cfg);
            expect(spyConfig).toHaveBeenCalled();
        });
    });
});
