# api-rate-limiting

Express middleware that will limit API calls as configured. 

### Requirements 

- [redis](https://redis.io/) should be installed on deployment machine. At this point only the default client creation is available. If the [following](https://github.com/NodeRedis/node_redis#rediscreateclient) section applies to your use case than unfortunately you will have to wait for next release. 

### How to use it

- Install it with npm. 
- Pass a configuration object to it and enjoy


    var express = require('express')
    var rateLimiter = require('api-rate-limiting')

    var app = express()
    app.use('/api/path', rateLimiter(configuration))

### How does it work

This middleware will try to distribute API calls per user to be as uniform as possible. In example if we allow 10 calls per 100 seconds middleware will allow 1 call per 10 seconds. Since this rule is too strict we introduce a **burst** variable that will describe how many burst API calls should the middleware allow even in cases that would violate uniform distribution of API calls.
 
So if we configure the middleware to allow 10 calls per 100 seconds with burst of 10 that means that all 10 calls can be served as soon as possible, but the remaining time of 100 seconds the user will get a 429 too many requests error. 
### Configuration
Configuration object will describe limits that will be applied to given path.

    {
        "calls" : 10,
        "time" : 100, 
        "unit" : 'seconds', 
        "burst": 10, 
        "uniqueField" : { 
            "section" : 'header',
            "name" : 'token'
        },
        "cookieParser" : {
            "secret" : '',
            "options" : ''
        }
    }
    
This is an example of a valid configuration object. This configuration will mean that our API should handle 10 calls per 100 seconds. User will be identified by a token attribute in header section. 