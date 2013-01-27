var et = require('elementtree'),
    platforms = require('./../platforms'),
    fs = require('fs');

function plugin_parser(xmlPath) {
    this.path = xmlPath;
    this.doc = new et.ElementTree(et.XML(fs.readFileSync(xmlPath, 'utf-8')));
    this.platforms = this.doc.findall('platform').map(function(p) {
        return p.attrib.name;
    });
}

module.exports = plugin_parser;
