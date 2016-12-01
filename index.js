(function() {
    'use strict';

    var rateLimitingService = require('./rate-limiting/rate-limiting.service.js'),
        rateLimitingMiddleware = require('./rate-limiting/rate-limiting.middleware.js');

    function configure(configuration) {
        rateLimitingService.validate(configuration);
        return rateLimitingMiddleware.createMiddleware(configuration);
    }

    module.exports = configure;

}());