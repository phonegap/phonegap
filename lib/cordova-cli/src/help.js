var fs = require('fs'),
    colors = require('colors'),
    path = require('path');

module.exports = function help () {
    var raw = fs.readFileSync(path.join(__dirname, '..', 'doc', 'help.txt')).toString('utf8').split("\n");
    return raw.map(function(line) {
        if (line.match('    ')) {
            var prompt = '    $ ',
                isPromptLine = !(!(line.indexOf(prompt) != -1));
            if (isPromptLine) {
                return prompt.green + line.replace(prompt, '');
            }
            else {
                return line.split(/\./g).map( function(char) { 
                    if (char === '') {
                        return '.'.grey;
                    }
                    else {
                        return char;
                    }
                }).join('');
            }
        }
        else {
            return line.magenta;
        }
    }).join("\n");
};
