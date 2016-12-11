(function() {
    'use strict';

    var errorService = require('../common/error.service'),
        events = require('events'),
        eventEmitter = new events.EventEmitter(),
        redisClient = null,
        getUserLimitations = null,
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
    function broadcastLogEvent(level, message) {
        eventEmitter.emit('rate-limiter-info', level, message);
    }
    function invalidConfiguration(details) {
        eventEmitter.emit('rate-limiter-info', 'error', details);
        throw new Error('Invalid configuration. Please check manual. Error: \n' + details);
    }
    function createRedisClient(args) {
        redisClient =  require('redis').createClient.apply(null, args);
    }

    function validate(configuration) {
        if( !configuration ||
            !isInt(configuration.calls) || configuration.calls <= 0 ||
            !isInt(configuration.time) || configuration.time <= 0 ||
            !units[configuration.unit]) {
            invalidConfiguration({
                "message" : 'Variables calls and unit should be  positive integers. Variable unit can be seconds, minutes, hours or days.'
            });
        }
        if(!configuration.burst && configuration.burst !== 0) {
            configuration.burst = 0;
        } else if(isInt(!configuration.burst) || configuration.burst <= 0 ) {
            invalidConfiguration({
                "message" : 'Variable burst should be a positive integer. Default value is 0.'
            });
        }
        if(configuration.redisCreateArguments) {
            if(Array.isArray(configuration.redisCreateArguments)) {
                createRedisClient(configuration.redisCreateArguments);
            } else {
                invalidConfiguration({
                    "message" : 'Arguments for creating of redis client should be in an Array.'
                });
            }
        } else {
            createRedisClient();
        }
        if(configuration.getUserLimitations) {
            if(typeof configuration.getUserLimitations !== 'function') {
                invalidConfiguration({
                    "message" : 'Variable getUserLimitations should be a function. If no function is provided then default configuration is used.'
                });
            } else {
                getUserLimitations = configuration.getUserLimitations;
            }
        }

        if(!configuration.uniqueField) {
            configuration.uniqueField = {
                "section" : 'ip'
            };
        } else if(!((configuration.uniqueField.section === 'header' && isString(configuration.uniqueField.name)) ||
            (configuration.uniqueField.section === 'cookie' && isString(configuration.uniqueField.name)) ||
            configuration.uniqueField.section === 'ip')){
            invalidConfiguration({
                "message" : 'Unable to get uniqueField. This middleware can limit API calls using header, cookie, or IP. IP is default.'
            });
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
        function resetTokenData(error, newConfiguration) {
            if(error) {
                broadcastLogEvent('warn', {
                        "message" : 'getUserLimitations function provided an error object, That means that it was not possible to get user specific limitations. Falling back to default value, but take this error into account.',
                        "details" : error
                    });
                timestamp =  new Date();
                burst =  config.burst;
                available =  config.calls;
            } else if(newConfiguration) {
                if( !isInt(newConfiguration.calls) || newConfiguration.calls <= 0 ||
                    !isInt(newConfiguration.time) || newConfiguration.time <= 0 ||
                    !units[newConfiguration.unit]) {
                    invalidConfiguration({
                        "message" : 'Variables calls and unit should be  positive integers. Variable unit can be seconds, minutes, hours or days.'
                    });
                }
                if(!newConfiguration.burst && newConfiguration.burst !== 0) {
                    newConfiguration.burst = 0;
                } else if(isInt(!newConfiguration.burst) || newConfiguration.burst <= 0 ) {
                    invalidConfiguration({
                        "message" : 'Variable burst should be a positive integer. Default value is 0.'
                    });
                }
                newConfiguration.time *= units[newConfiguration.unit];

            } else {
                timestamp =  new Date();
                burst =  config.burst;
                available =  config.calls;
            }

        }
        function initializeToken() {
            if(getUserLimitations) {
                getUserLimitations(token, resetTokenData);
            } else {
                resetTokenData();
            }
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
                    initializeToken();
                    regularCall();
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
        "validate" : validate,
        "broadcastLogEvent" : broadcastLogEvent,
        "checkApiRate" : checkApiRate
    };

}());