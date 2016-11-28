(function() {
    'use strict';

    function createError(code, message) {
        return {
            "code" : code,
            "message" : message
        }
    }

    module.exports = {
        "createError" : createError
    };

}());