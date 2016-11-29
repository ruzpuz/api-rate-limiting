(function() {
    'use strict';

    var testConfig = {
        "routes" : ['*'],
        "calls" : 10,
        "time" : 100,
        "unit" : 'minutes',
        "burst": 10,
        "uniqueField" : {
            "section" : 'header',
            "name" : 'token'
        }
    },
        units = {
            "seconds": 1,
            "minutes": 60,
            "hours": 3600,
            "days": 86400
        };


    function isInt(value) {
        var x;
        return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
    }
    function isString(element) {
        return (typeof element === 'string' || element instanceof String);
    }
    function invalidConfiguration() {
        throw new Error('Invalid configuration. Please check manual');
    }
    function test() {
        configure(null, testConfig);
    }

    //TODO improve routes validation.
    function configure(app, configuration) {
        if(!isInt(configuration.calls) ||
           !isInt(configuration.time) ||
           !isInt(configuration.burst)) {
            invalidConfiguration();
        } else if(!configuration.routes) {
            configuration.routes = ['*'];
        } else if(!units[configuration.unit]) {
            invalidConfiguration();
        } else if(!configuration.uniqueField) {
            invalidConfiguration();
        } else if(((configuration.uniqueField.section === 'header' ||
                        configuration.uniqueField.section === 'cookie') &&
                    !configuration.uniqueField.name) &&
                    configuration.uniqueField.section !== 'ip'){
            invalidConfiguration();
        } else {
            configuration.time *= units[configuration.unit];
            console.log(configuration);
            console.log('true')
        }
    }

    test();
    module.exports = {
        "configure" :  configure
    }
}());