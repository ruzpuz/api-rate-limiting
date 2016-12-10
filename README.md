# api-rate-limiting

Express middleware that will limit API calls as configured. 

### Requirements 

- [redis](https://redis.io/) should be installed on deployment machine. At this point only the default client creation is available. If the [following](https://github.com/NodeRedis/node_redis#rediscreateclient) section applies to your use case than unfortunately you will have to wait for next release. 

### How to use it

- Install it with npm. 
- Pass a configuration object to it and enjoy


An example: 

    var express = require('express'),
        rateLimiter = require('api-rate-limiting'),
        app = express();
        
    app.use('*', rateLimiter(configuration));


### How does it work

This middleware will try to distribute API calls per user to be as uniform as possible. In example if we allow 10 calls per 100 seconds middleware will allow 1 call per 10 seconds. Since this rule is too strict we introduce a **burst** variable that will describe how many API calls should the middleware allow even in cases that would violate uniform distribution of API calls.
 
So if we configure the middleware to allow 10 calls per 100 seconds with burst of 10 that means that all 10 calls can be served as soon as possible, but the remaining time of 100 seconds the user will get a 429 too many requests error. 

### Configuration

Configuration object should have following attributes:

    calls::Integer
    time::Integer
    unit::String (seconds|minutes|hours|days)
    burst::Integer - optional
    getUserLimitations::Function - optional
    uniqueField::Object - optional
    cookieParser::Object - optional
    
Object **uniqueField** has following attributes
 
    section::String (header|cookie|ip)
    name::String
    
This object will tell the middleware where to search for the field that will identify the user. In example if we provide:
 
    "uniqueField" : {
         "section" : 'header',
         "name" : 'token'
     }
 
The middleware will check for token field in headers. That basically mean that any user identified by token field in header will be treated as above configured. 
 
If unique field's section is set to be cookie then the middleware will try to parse cookies in exactly the same way as [cookie-parser](https://github.com/expressjs/cookie-parser) library. 
 
Object ***cookieParser*** has 'section' and 'secret' fields that are used as described [here](https://github.com/expressjs/cookie-parser#cookieparsersecret-options)

### Different rates per user

If different consumers of API have different rates user can pass a function to middleware that will be called when necessary. The function should asynchronously pass rates of an user back to middleware. 

Arguments passed to getUserLimitations function: 

- token - user's unique identifier
- callback - function that will be called to pass back user-specific configuration to middleware

Callback function should be called with 2 arguments:
- error
- configuration object

Example object

    calls::Integer
    time::Integer
    unit::String (seconds|minutes|hours|days)
    burst::Integer - optional

### Configuration example

This is an example of a valid configuration object. 

    {
        "calls" : 10,
        "time" : 100, 
        "unit" : 'seconds', 
        "burst": 10,
        "uniqueField" : { 
            "section" : 'header',
            "name" : 'token'
        }
    }
    
This configuration will mean that our API should handle 10 calls per 100 seconds. User will be identified by a token attribute in header section. 