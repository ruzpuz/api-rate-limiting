(function() {
    'use strict';

    var testConfig = {
        "routes" : '*',
        "calls" : 1,
        "time" : 100,
        "unit" : 'minutes',
        "burst": 10,
        "uniqueField" : {
            "section" : 'header',
            "name" : 'token'
        },
        "cookieParser" : {
            "secret" : '',
            "options" : ''
        }
    },
        units = {
            "seconds": 1,
            "minutes": 60,
            "hours": 3600,
            "days": 86400
        };

    function isInt(value) {
        var x = parseInt(value);

        if(isNaN(x) || isString(value)) {
            return false;
        }
        return (0 | x) === x;
    }
    function isString(element) {
        return (typeof element === 'string' || element instanceof String);
    }
    function invalidConfiguration() {
        throw new Error('Invalid configuration. Please check manual');
    }
    function validate(app, configuration) {
        if( !app ||
            !configuration ||
            !isInt(configuration.calls)||
            !isInt(configuration.time) ||
            !units[configuration.unit]) {
            invalidConfiguration();
        }
        if(!configuration.burst && configuration.burst !== 0) {
            configuration.burst = 0;
        } else if(isInt(!configuration.burst)) {
            invalidConfiguration();
        }
        if(!configuration.routes) {
            configuration.routes = ['*'];
        } else if(Array.isArray(configuration.routes)) {
            configuration.routes.forEach(function(element) {
                if(!isString(element)) { invalidConfiguration(); }
            });
        } else if(isString(configuration.routes)) {
            configuration.routes = [ configuration.routes ];
        } else {
            invalidConfiguration();
        }

        if(!configuration.uniqueField) {
            configuration.uniqueField = {
                "section" : 'ip'
            };
        } else if(!((configuration.uniqueField.section === 'header' && isString(configuration.uniqueField.name)) ||
            (configuration.uniqueField.section === 'cookie' && isString(configuration.uniqueField.name)) ||
            configuration.uniqueField.section === 'ip')){
            invalidConfiguration();
        }

        configuration.time *= units[configuration.unit];
    }
    function configure(app, configuration) {
        validate(app,configuration);

        console.log(configuration);
        console.log('true');
    }
    function test() {
        configure('a', testConfig);
    }
    test();
    module.exports = {
        "configure" :  configure
    };
}());