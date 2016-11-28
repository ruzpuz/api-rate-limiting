(function() {
    'use strict';

    var errorService = require('../common/error.service'),
        rateLimitingService = require('./rate-limiting.service');

    function handleApiCall(token, config, callback) {
        if(!token) {
            callback(errorService.createError(400, "No token found"));
        } else {
            rateLimitingService.checkApiRate(token, config, callback);
        }
    }

    module.exports = {
        "handleApiCall" : handleApiCall
    };

}());