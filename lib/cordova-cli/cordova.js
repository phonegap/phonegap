var cordova_events = require('./src/events');

module.exports = {
    help:     require('./src/help'),
    create:   require('./src/create'),
    platform: require('./src/platform'),
    platforms: require('./src/platform'),
    build:    require('./src/build'),
    emulate:  require('./src/emulate'),
    plugin:   require('./src/plugin'),
    plugins:   require('./src/plugin'),
    serve:    require('./src/serve'),
    on:       function() {
        cordova_events.on.apply(cordova_events, arguments);
    },
    emit:     function() {
        cordova_events.emit.apply(cordova_events, arguments);
    }
};
