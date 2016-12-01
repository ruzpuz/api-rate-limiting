(function() {
    'use strict';

    var rateLimitingService = require('./rate-limiting/rate-limiting.service.js'),
        rateLimitingMiddleware = require('./rate-limiting/rate-limiting.middleware.js'),
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
        return rateLimitingMiddleware.createMiddleware(configuration);
    }

    function test() {
        configure(testConfig);
    }
    test();
    module.exports = {
        "configure" :  configure
    };
}());