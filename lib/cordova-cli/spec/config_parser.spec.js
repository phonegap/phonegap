var cordova = require('../cordova'),
    path = require('path'),
    fs = require('fs'),
    shell = require('shelljs'),
    config_parser = require('../src/config_parser'),
    tempDir = path.join(__dirname, '..', 'temp'),
    et = require('elementtree'),
    xml = path.join(tempDir, 'www', 'config.xml');

describe('config.xml parser', function () {
    beforeEach(function() {
        cordova.create(tempDir);
    });
    afterEach(function() {
        shell.rm('-rf', tempDir);
    });

    it('should create an instance based on an xml file', function() {
        var cfg;
        expect(function () {
            cfg = new config_parser(xml);
        }).not.toThrow();
        expect(cfg).toBeDefined();
        expect(cfg.doc).toBeDefined();
    });

    describe('package name / id', function() {
        var cfg;

        beforeEach(function() {
            cfg = new config_parser(xml);
        });

        it('should get the (default) packagename', function() {
            expect(cfg.packageName()).toEqual('io.cordova.hellocordova');
        });
        it('should allow setting the packagename', function() {
            cfg.packageName('this.is.bat.country');
            expect(cfg.packageName()).toEqual('this.is.bat.country');
        });
        it('should write to disk after setting the packagename', function() {
            cfg.packageName('this.is.bat.country');
            expect(fs.readFileSync(xml, 'utf-8')).toMatch(/id="this\.is\.bat\.country"/);
        });
    });

    describe('app name', function() {
        var cfg;

        beforeEach(function() {
            cfg = new config_parser(xml);
        });

        it('should get the (default) app name', function() {
            expect(cfg.name()).toEqual('HelloCordova');
        });
        it('should allow setting the app name', function() {
            cfg.name('this.is.bat.country');
            expect(cfg.name()).toEqual('this.is.bat.country');
        });
        it('should write to disk after setting the name', function() {
            cfg.name('one toke over the line');
            expect(fs.readFileSync(xml, 'utf-8')).toMatch(/<name>one toke over the line<\/name>/);
        });
    });

    describe('access elements (whitelist)', function() {
        var cfg;

        beforeEach(function() {
            cfg = new config_parser(xml);
        });

        describe('getter', function() {
            it('should get the (default) access element', function() {
                expect(cfg.access.get()[0]).toEqual('*');
            });
            it('should return an array of all access origin uris via access()', function() {
                expect(cfg.access.get() instanceof Array).toBe(true);
            });
        });
        describe('setters', function() {
            it('should allow removing a uri from the access list', function() {
                cfg.access.remove('*');
                expect(cfg.access.get().length).toEqual(0);
            });
            it('should write to disk after removing a uri', function() {
                cfg.access.remove('*');
                expect(fs.readFileSync(xml, 'utf-8')).not.toMatch(/<access.*\/>/);
            });
            it('should allow adding a new uri to the access list', function() {
                cfg.access.add('http://canucks.com');
                expect(cfg.access.get().length).toEqual(2);
                expect(cfg.access.get().indexOf('http://canucks.com') > -1).toBe(true);
            });
            it('should write to disk after adding a uri', function() {
                cfg.access.add('http://cordova.io');
                expect(fs.readFileSync(xml, 'utf-8')).toMatch(/<access origin="http:\/\/cordova\.io/);
            });
            it('should allow removing all access elements when no parameter is specified', function() {
                cfg.access.add('http://cordova.io');
                cfg.access.remove();

                expect(fs.readFileSync(xml, 'utf-8')).not.toMatch(/<access.*\/>/);
            });
        });
    });

    describe('preference elements', function() {
        var cfg;

        beforeEach(function() {
            cfg = new config_parser(xml);
        });

        describe('getter', function() {
            it('should get all preference elements', function() {
                expect(cfg.preference.get()[0].name).toEqual('phonegap-version');
                expect(cfg.preference.get()[0].value).toEqual('1.9.0');
            });
            it('should return an array of all preference name/value pairs', function() {
                expect(cfg.preference.get() instanceof Array).toBe(true);
            });
        });
        describe('setters', function() {
            it('should allow removing a preference by name', function() {
                cfg.preference.remove('phonegap-version');
                expect(cfg.preference.get().length).toEqual(3);
            });
            it('should write to disk after removing a preference', function() {
                cfg.preference.remove('phonegap-version');
                expect(fs.readFileSync(xml, 'utf-8')).not.toMatch(/<preference\sname="phonegap-version"/);
            });
            it('should allow adding a new preference', function() {
                cfg.preference.add({name:'UIWebViewBounce',value:'false'});
                expect(cfg.preference.get().length).toEqual(5);
                expect(cfg.preference.get()[4].value).toEqual('false');
            });
            it('should write to disk after adding a preference', function() {
                cfg.preference.add({name:'UIWebViewBounce',value:'false'});
                expect(fs.readFileSync(xml, 'utf-8')).toMatch(/<preference name="UIWebViewBounce" value="false"/);
            });
            it('should allow removing all preference elements when no parameter is specified', function() {
                cfg.preference.remove();
                expect(fs.readFileSync(xml, 'utf-8')).not.toMatch(/<preference.*\/>/);
            });
        });
    });
});
