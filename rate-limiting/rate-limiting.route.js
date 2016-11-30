(function() {
    'use strict';

    function handleCall(req, res, next) {

    }
    function includeRoute(app, configuration) {

    }
    module.exports = function (app, config) {
        app.use('/api/*', function (req, res, next) {
            require('./rate-limiting.controller').handleApiCall('12345', config, function (error) {
                if(error) {
                    res.status(error.code).json(error.message);
                } else {
                    next();
                }
            });
        });
        app.use('/api/*', function (req, res, next) {
            res.status(200).json('aaa');
        });
    };

}());