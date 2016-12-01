(function() {
    'use strict';

    var rateLimitingService = require('./rate-limiting/rate-limiting.service'),
        rateLimitingRoute = require('./rate-limiting/rate-limiting.route'),
        testConfig = {
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
    };

    function configure(configuration) {
        rateLimitingService.validate(configuration);

        console.log(configuration);
        console.log('true');
    }

    function test() {
        configure(testConfig);
    }
    test();
    module.exports = {
        "configure" :  configure
    };
}());