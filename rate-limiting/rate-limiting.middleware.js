(function() {
    'use strict';

    var rateLimitingController = require('./rate-limiting.controller');


    function createMiddleware(configuration) {
        function handleCall(req, res, next) {
            var uniqueField;

            function  getUniqueField(req) {
                if(configuration.uniqueField.section === 'ip') {
                    uniqueField = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                } else if(configuration.uniqueField.section === 'header') {
                    uniqueField = req.headers[configuration.uniqueField.name];
                } else {
                    require('../common/cookie-parsing.service').parse(req);
                    uniqueField = req.cookies[configuration.uniqueField.name];
                }
            }
            getUniqueField(req);
            rateLimitingController.handleApiCall(uniqueField, configuration, function (error) {
                if(error) {
                    res.status(error.code).json(error.message);
                } else {
                    next();
                }
            });
        }

        return handleCall;
    }

    module.exports = {
        "createMiddleware" : createMiddleware
    };
}());