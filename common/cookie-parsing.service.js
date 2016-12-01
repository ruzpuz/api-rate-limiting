(function () {
   'use strict';

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    * This is a port (better say a rip-off) of a cookie-parser middleware made by ExpressJs team
    * It is made on a First of December. If anything significantly change in future releases of
    * cookie-parser middleware I will try to be prompt in propagating changes to this project
    * If any issues are found please email me asap.
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    var cookie = require('cookie'),
        signature = require('cookie-signature');

    function signedCookie (str, secret) {
        var secrets = !secret || Array.isArray(secret) ? (secret || []) : [secret];
        if (typeof str !== 'string') {
            return undefined;
        }

        if (str.substr(0, 2) !== 's:') {
            return str;
        }


        for (var i = 0; i < secrets.length; i += 1) {
            var val = signature.unsign(str.slice(2), secrets[i]);

            if (val !== false) {
                return val;
            }
        }

        return false;
    }
    function signedCookies (obj, secret) {
        var cookies = Object.keys(obj),
            dec,
            key,
            ret = Object.create(null),
            val;

        for (var i = 0; i < cookies.length; i += 1) {
            key = cookies[i];
            val = obj[key];
            dec = signedCookie(val, secret);

            if (val !== dec) {
                ret[key] = dec;
                delete obj[key];
            }
        }

        return ret;
    }
    function jsonCookie (str) {
        if (typeof str !== 'string' || str.substr(0, 2) !== 'j:') {
            return undefined;
        }

        try {
            return JSON.parse(str.slice(2));
        } catch (err) {
            return undefined;
        }
    }
    function jsonCookies (obj) {
        var cookies = Object.keys(obj),
            key,
            val;

        for (var i = 0; i < cookies.length; i += 1) {
            key = cookies[i];
            val = jsonCookie(obj[key]);

            if (val) {
                obj[key] = val;
            }
        }

        return obj;
    }

    function parse(req, secret, options) {
        if (req.cookies) {
            return;
        }
        var cookies = req.headers.cookie,
            secrets = !secret || Array.isArray(secret) ? (secret || []) : [secret];

        req.secret = secrets[0];
        req.cookies = Object.create(null);
        req.signedCookies = Object.create(null);

        if (!cookies) {
            return;
        }
        req.cookies = cookie.parse(cookies, options);
        if (secrets.length !== 0) {
            req.signedCookies = signedCookies(req.cookies, secrets);
            req.signedCookies = jsonCookies(req.signedCookies);
        }
        req.cookies = jsonCookies(req.cookies);
    }

    module.exports = {
        "parse" : parse
    };

}());