var decodeToken = require('./token').decodeToken;
var Promise = require('bluebird');


exports.tokenMiddleware = function (req,res,next) {
    //console.log(req)
    if (req.headers.hasOwnProperty('audoku') && req.headers.audoku === 'help') {
        next();
        return;
    }
    decodeToken(req.token)
        .then(function (result) {
    //        console.log(result.response.statusCode)
            if(result.response.statusCode == 200 && result.body.valid == true)
            {
                req.user = {};
                req.user.id= result.body.token._id;
                req.user.type= result.body.token.type;
                req.user.email= result.body.token.email;
                next();

            }
            else
            {
                var err = new Error();
                err.message = result.body.error_message;
                err.statusCode = result.response.statusCode;
                return new Promise(function(resolve, reject)
                {
                    return reject(err);
                });
            }

        })
        .catch(function (err){

           // console.log(err);
            if(err.statusCode)
            {
                return res.status(err.statusCode).send(err.message);
            }
            else
            {
                return res.boom.badImplementation(err); // Error 500
            }
        });
}