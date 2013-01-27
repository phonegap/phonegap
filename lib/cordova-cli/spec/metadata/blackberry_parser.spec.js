var blackberry_parser = require('../../src/metadata/blackberry_parser'),
    config_parser = require('../../src/config_parser'),
    path = require('path'),
    et = require('elementtree'),
    shell = require('shelljs'),
    cordova = require('../../cordova'),
    fs = require('fs'),
    tempDir = path.join(__dirname, '..', '..', 'temp'),
    tempBb = path.join(tempDir, 'platforms', 'blackberry'),
    cfg_path = path.join(__dirname, '..', 'fixtures', 'projects', 'test', 'www', 'config.xml'),
    blackberry_path = path.join(__dirname, '..', 'fixtures', 'projects', 'native', 'blackberry_fixture'),
    blackberry_config = path.join(blackberry_path, 'www', 'config.xml');

var cwd = process.cwd();

var original_config = fs.readFileSync(blackberry_config, 'utf-8');
var orig_www_config = fs.readFileSync(cfg_path, 'utf-8');

describe('blackberry project parser', function() {
    it('should throw an exception with a path that is not a native blackberry project', function() {
        expect(function() {
            var project = new blackberry_parser(cwd);
        }).toThrow();
    });
    it('should accept a proper native blackberry project path as construction parameter', function() {
        var project;
        expect(function() {
            project = new blackberry_parser(blackberry_path);
        }).not.toThrow();
        expect(project).toBeDefined();
    });

    describe('update_from_config method', function() {
        var project, config;

        beforeEach(function() {
            project = new blackberry_parser(blackberry_path);
            config = new config_parser(cfg_path);
        });
        afterEach(function() {
            fs.writeFileSync(blackberry_config, original_config, 'utf-8');
            fs.writeFileSync(cfg_path, orig_www_config, 'utf-8');
        });
        it('should throw an exception if a non config_parser object is passed into it', function() {
            expect(function() {
                project.update_from_config({});
            }).toThrow();
        });
        it('should update the application name properly', function() {
            config.name('bond. james bond.');
            project.update_from_config(config);

            var bb_cfg = new config_parser(blackberry_config);

            expect(bb_cfg.name()).toBe('bond. james bond.');
        });
        it('should update the application package name properly', function() {
            config.packageName('sofa.king.awesome');
            project.update_from_config(config);

            var bb_cfg = new config_parser(blackberry_config);
            expect(bb_cfg.packageName()).toBe('sofa.king.awesome');
        });
        describe('whitelist', function() {
            it('should update the whitelist when using access elements with origin attribute', function() {
                config.access.remove('*');
                config.access.add('http://blackberry.com');
                config.access.add('http://rim.com');
                project.update_from_config(config);

                var bb_cfg = new et.ElementTree(et.XML(fs.readFileSync(blackberry_config, 'utf-8')));
                var as = bb_cfg.getroot().findall('access');
                expect(as.length).toEqual(2);
                expect(as[0].attrib.uri).toEqual('http://blackberry.com');
                expect(as[1].attrib.uri).toEqual('http://rim.com');
            });
            it('should update the whitelist when using access elements with uri attributes', function() {
                fs.writeFileSync(cfg_path, fs.readFileSync(cfg_path, 'utf-8').replace(/origin="\*/,'uri="http://rim.com'), 'utf-8');
                config = new config_parser(cfg_path);
                project.update_from_config(config);

                var bb_cfg = new et.ElementTree(et.XML(fs.readFileSync(blackberry_config, 'utf-8')));
                var as = bb_cfg.getroot().findall('access');
                expect(as.length).toEqual(1);
                expect(as[0].attrib.uri).toEqual('http://rim.com');
            });
        });
    });

    describe('update_www method', function() {
        var s, parser;
        beforeEach(function() {
            shell.rm('-rf', tempDir);
            cordova.create(tempDir);
            shell.mkdir('-p', tempBb);
            shell.cp('-rf', path.join(blackberry_path, '*'), tempBb); 
            parser = new blackberry_parser(tempBb);
        });

        it('should update all www assets', function() {
            var newFile = path.join(tempDir, 'www', 'somescript.js');
            fs.writeFileSync(newFile, 'alert("sup");', 'utf-8');
            parser.update_www();
            expect(fs.existsSync(path.join(tempBb, 'www', 'somescript.js'))).toBe(true);
        });
        it('should not overwrite the blackberry-specific config.xml', function() {
            var www_cfg = fs.readFileSync(path.join(tempDir, 'www', 'config.xml'), 'utf-8');
            parser.update_www();
            var bb_cfg = fs.readFileSync(path.join(tempBb, 'www', 'config.xml'), 'utf-8');
            expect(bb_cfg).not.toBe(www_cfg);
        });
        it('should inject a reference to webworks.js in index.html', function() {
            parser.update_www();
            var index = fs.readFileSync(path.join(tempBb, 'www', 'index.html'), 'utf-8');
            expect(index).toMatch(/<script type="text\/javascript" src="js\/webworks.js">/i);
        });
    });

    describe('update_project method', function() {
        var parser, cfg, s,
            ioFake = function() { s.mostRecentCall.args[1](null, {}); };
        beforeEach(function() {
            shell.rm('-rf', tempDir);
            cordova.create(tempDir);
            s = spyOn(require('prompt'), 'get').andReturn(true);
            shell.mkdir('-p', tempBb);
            shell.cp('-rf', path.join(blackberry_path, '*'), tempBb); 
            parser = new blackberry_parser(tempBb);
            cfg = new config_parser(path.join(tempDir, 'www', 'config.xml'));
        });

        it('should invoke update_www', function() {
            var spyWww = spyOn(parser, 'update_www');
            parser.update_project(cfg);
            ioFake();
            expect(spyWww).toHaveBeenCalled();
        });
        it('should invoke update_from_config', function() {
            var spyConfig = spyOn(parser, 'update_from_config');
            parser.update_project(cfg);
            ioFake();
            expect(spyConfig).toHaveBeenCalled();
        });
        it('should invoke get_blackberry_environment if .cordova/config.json file has no BB config', function() {
            var spyEnv = spyOn(parser, 'get_blackberry_environment');
            parser.update_project(cfg);
            expect(spyEnv).toHaveBeenCalled();
        });
        it('should not invoke get_blackberry_environment if .cordova/config.json file has BB config', function() {
            var spyEnv = spyOn(parser, 'get_blackberry_environment');
            fs.writeFileSync(path.join(tempDir, '.cordova', 'config.json'), JSON.stringify({
                blackberry:{
                    qnx:{
                    }
                }
            }), 'utf-8');
            parser.update_project(cfg);
            expect(spyEnv).not.toHaveBeenCalled();
        });
        it('should write out project properties with no BB config in .cordova/config.json', function() {
            var spyProps = spyOn(parser, 'write_project_properties');
            var cb = jasmine.createSpy();
            runs(function() {
                parser.update_project(cfg, cb);
                ioFake();
            });
            waitsFor(function() { return cb.wasCalled; }, 'update project');
            runs(function() {
                expect(spyProps).toHaveBeenCalled();
            });
        });
        it('should write out project properties with BB config in .cordova/config.json', function() {
            var spyProps = spyOn(parser, 'write_project_properties');
            var cb = jasmine.createSpy();
            fs.writeFileSync(path.join(tempDir, '.cordova/config.json'), JSON.stringify({
                blackberry:{
                    qnx:{
                    }
                }
            }), 'utf-8');
            parser.update_project(cfg, cb);
            expect(spyProps).toHaveBeenCalled();
        });
    });

    describe('write_project_properties method', function() {
    });

    describe('get_blackberry_environment method', function() {
    });
});
