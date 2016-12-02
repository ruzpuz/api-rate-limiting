(function() {
    'use strict';

    var errorService = require('../common/error.service'),
        redisClient = require('redis').createClient(),
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

    function validate(configuration) {
        if( !configuration ||
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
    function checkApiRate(token, config, callback) {
        var timestamp,
            available,
            burst,
            now = new Date();

        function saveRedisData() {
            function burstCallback(error) {
                if(error) {
                    callback(errorService.createError(500, "Redis writing error - timestamp "));
                }else {
                    callback(null);
                }
            }
            function availableCallback(error) {
                if(error) {
                    callback(errorService.createError(500, "Redis writing error - timestamp "));
                }else {
                    redisClient.set(token + '_burst', burst, burstCallback);
                }
            }
            function timestampCallback(error) {
                if(error) {
                    callback(errorService.createError(500, "Redis writing error - timestamp "));
                }else {
                    redisClient.set(token + '_available', available, availableCallback);
                }
            }

            redisClient.set(token + '_timestamp', timestamp.toISOString(), timestampCallback);
        }
        function resetTokenData() {
            timestamp =  new Date();
            burst =  config.burst;
            available =  config.calls;
        }
        function initializeToken() {
            resetTokenData();
            saveRedisData();
        }
        function regularCall() {
            if(available > 0) {
                if(available === burst) {
                    burst -= 1;
                }
                available -= 1;
                timestamp = now;
                saveRedisData();
            } else {
                callback(errorService.createError(429, "Please try again later"));
            }
        }
        function burstCall() {
            if(burst > 0) {
                available -= 1;
                burst -= 1;
                timestamp = now;
                saveRedisData();
            } else {
                callback(errorService.createError(429, "Please try again later"));
            }
        }

        function checkAvailability() {
            console.log( timestamp + ' ' +available + ' ' + burst );
            console.log(config);

            var previousTimeSeconds = timestamp.getHours() * 3600 + timestamp.getMinutes() * 60 + timestamp.getSeconds(),
                currentTimeSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
            if((now - timestamp) > (1000 * config.time/config.calls)) {
                if(Math.floor(previousTimeSeconds/config.time) < Math.floor(currentTimeSeconds/config.time)) {
                    resetTokenData();
                }
                regularCall();
            } else {
                burstCall();
            }
        }
        function getRedisData() {
            function burstCallback(error, value) {
                if(error) {
                    callback(errorService.createError(500, "Redis reading error - available burst API calls"));
                } else {
                    burst = value;
                    checkAvailability();
                }
            }
            function availableCallback(error, value) {
                if(error) {
                    callback(errorService.createError(500, "Redis reading error - available API calls"));
                } else {
                    available = value;
                    redisClient.get(token + '_burst', burstCallback);
                }
            }
            function timestampCallback(error, value) {
                if(error) {
                    callback(errorService.createError(500, "Redis reading error - timestamp "));
                } else if(!value) {
                    initializeToken(token, callback);
                } else {
                    timestamp = new Date(value);
                    redisClient.get(token + '_available', availableCallback);
                }
            }

            redisClient.get(token + '_timestamp', timestampCallback);
        }
        getRedisData();

    }

    module.exports = {
        "checkApiRate" : checkApiRate,
        "validate" : validate
    };

}());