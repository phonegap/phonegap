var cordova = require('../cordova'),
    path = require('path'),
    fs = require('fs'),
    plugin_parser = require('../src/plugin_parser'),
    et = require('elementtree'),
    xml = path.join(__dirname, 'fixtures', 'plugins', 'test', 'plugin.xml');

describe('plugin.xml parser', function () {
    it('should read a proper plugin.xml file', function() {
        var cfg;
        expect(function () {
            cfg = new plugin_parser(xml);
        }).not.toThrow();
        expect(cfg).toBeDefined();
        expect(cfg.doc).toBeDefined();
    });
    it('should be able to figure out which platforms the plugin supports', function() {
        var cfg = new plugin_parser(xml);
        expect(cfg.platforms.length).toBe(3);
        expect(cfg.platforms.indexOf('android') > -1).toBe(true);
        expect(cfg.platforms.indexOf('ios') > -1).toBe(true);
        expect(cfg.platforms.indexOf('blackberry') > -1).toBe(true);
    });
});

