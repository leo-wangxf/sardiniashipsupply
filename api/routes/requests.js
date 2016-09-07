var express = require('express');
var Message = require('../models/messages').Message;
var Conversation = require('../models/conversations').Conversation;
var Request = require('../models/requests').Request;
//var util = require('util');
var _ = require('underscore')._;
var router = express.Router();
var au = require('audoku');

/* GET all requests  */

router.get('/conversations/:id/requests',
    au.doku({  // json documentation
        description: 'Get all the requests defined in db',
        title: 'Get requests',
        version: '1.0.0',
        name: 'GetRequest',
        group: 'Requests',
        fields: {
            page: {
                description: 'The current page for pagination',
                type: 'integer', required: false
            },
            limit: {
                description: 'The current limit for pagination',
                type: 'integer', required: false
            }
        }
    }),
    function (req, res) {
        // console.log("GET Requests");
        var query = _.extend({}, req.query);
        if (query.hasOwnProperty('page')) delete query.page;
        if (query.hasOwnProperty('limit')) delete query.limit;
        // console.log(query);


        var id = req.params.id.toString();

        Conversation.findById(id, "requests").then(function (entities) {
            if (_.isEmpty(entities))
                return Promise.reject({
                    name:'ItemNotFound',
                    request: 'no conversation found for getting requests, having id ' + id,
                    errorCode: 404
                });
            else
                return entities.getRequestsByQuery(query);


        }).then(function (filtEntity) {
             if (_.isEmpty(filtEntity))
                return Promise.reject("something strange");
             else {
                query = {"_id": {$in: filtEntity}};
                return Request.paginate(query, {page: req.query.page, limit: req.query.limit});

             }


        }).then(function (results){
            if (results.total === 0){
                return Promise.reject({
                    name:'ItemNotFound',
                    message: 'No Requests found for query ' + JSON.stringify(query),
                    errorCode: 404
                });
            }
            else{
                res.status(200).send(results); // HTTP 200 ok
            }


        }).catch(function (err) {
            if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
            else  if (err.name === 'ValidationError')
                res.boom.badData(err.message); // Error 422
            else
                res.boom.badImplementation('something blew up, ERROR:' + err);

        });


    });

/* POST new request in a conversation */
router.post('/conversations/:id/requests',
    au.doku({  // json documentation

        description: 'Create a request in db for a specific conversation',
        title: 'Create a request',
        version: '1.0.0',
        name: 'PostRequests',
        group: 'Requests',
        bodyFields: {
            productId: {type: 'String', required: true, description: 'Product Id'},
            status: {type: 'String', description: 'Request Status', options: ['pending', 'accepted', 'rejByC', 'rejByS'], default:'pending', required: true},
            quantityRequest: {type: 'Integer', description: 'Request quantity'},
            quantityOffer: {type: 'Integer', description: 'Offer quantity'},
            quoteRequest: {type: 'Integer', description: 'Request quote'},
            quoteOffer: {type: 'Integer', description: 'Offer quote'},
        }
    }),
    function (req, res) {
        console.log("POST Request");

        if (_.isEmpty(req.body))
            return res.boom.badData('Empty body'); // Error 422

        var id = req.params.id.toString();

        var saveResults;
        var newreq;
        Conversation.findById(id, "requests").then(function (results) {
            saveResults = results;
            if (_.isEmpty(results))
                return Promise.reject({
                    name:'ItemNotFound',
                    message: 'no conversation found for request creation, having id ' + id,
                    errorCode: 404
                });
            else
                return Request.create(req.body);


        }).then(function (newrequest) {


            if (_.isEmpty(newrequest))
                return Promise.reject("something strange");
            else {
                saveResults.requests.push(newrequest._id);
                newreq = newrequest;
                return saveResults.save();

            }

        }).then(function (results) {

            // var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

            //  res.set('Location', fullUrl + "/" + id + '/requests/' + newrequest._id);
            //res.status(201).send(newrequest);
            res.status(201).send(newreq);  // HTTP 201 created

        }).catch(function (err) {
            if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
            else  if (err.name === 'ValidationError')
                res.boom.badData(err.message); // Error 422
            else
                res.boom.badImplementation('something blew up, ERROR:' + err);

        });

    });
/* GET a request   */
router.get('/requests/:id',
    au.doku({  // json documentation
        title: 'Get a request by id',
        version: '1.0.0',
        name: 'GetRequest',
        group: 'Requests',
        description: 'Get a request by id',
        params: {
            id: {type: 'String', required: true, description: 'The request identifier'}
        }

    }), function (req, res) {
        var id = req.params.id.toString();

        var newVals = req.body; // body already parsed

       /* Request.findById(id, newVals, function (err, entities) {

            if (err) {
                if (err.name === 'CastError')
                    return res.boom.badData('Id malformed'); // Error 422
                else
                    return res.boom.badImplementation(err);// Error 500
            }

            if (_.isEmpty(entities))
                return res.boom.notFound('No entry with id ' + id); // Error 404
            else
                return res.send(entities);  // HTTP 200 ok
        });*/
        Request.findById(id, newVals).then(function(entity){
            if (_.isEmpty(entity)){
               // console.log("empty");
                return Promise.reject({
                    name:'ItemNotFound',
                    message: 'No entry with id '+ id, // Error 404
                    errorCode: 404
                });
            }
            else
                res.send(entity);

        }).catch(function (err) {
            if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
            else   if (err.name === 'CastError')
                res.boom.badData('Id malformed'); // Error 422
            else
                res.boom.badImplementation('something blew up, ERROR:' + err);

        })

    }
);


var putCallback = function (req, res) {

    if (_.isEmpty(req.body))
        return res.boom.badData('Empty boby'); // Error 422

    var id = req.params.id.toString();

    var newVals = req.body; // body already parsed

/*    Request.findByIdAndUpdate(id, newVals, function (err, entities) {

        if (err) {
            if (err.name === 'ValidationError')
                return res.boom.badData(err.message); // Error 422
            else if (err.name === 'CastError')
                return res.boom.badData('Id malformed'); // Error 422
            else
                return res.boom.badImplementation(err);// Error 500
        }
        if (_.isEmpty(entities))
            return res.boom.notFound('No entry with id ' + id); // Error 404
        else
            return res.send(entities);  // HTTP 200 ok
    });
*/




    Request.findByIdAndUpdate(id, newVals).then(function(entity){
        if (_.isEmpty(entity)){
            // console.log("empty");
            return Promise.reject({
                name:'ItemNotFound',
                message: 'No entry with id '+ id, // Error 404
                errorCode: 404
            });
        }
        else
            res.send(entity);

    }).catch(function (err) {
        if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
        else   if(err.name === 'ValidationError')
             res.boom.badData(err.message); // Error 422
        else if (err.name === 'CastError')
             res.boom.badData('Id malformed'); // Error 422
        else
             res.boom.badImplementation(err);// Error 500

    })






};


router.put('/requests/:id',
    au.doku({  // json documentation
        title: 'Update a request by id',
        version: '1.0.0',
        name: 'UpdateRequest',
        group: 'Requests',
        description: 'Update a request by id',
        params: {
            id: {type: 'String', required: true, description: 'The request identifier'}
        },
        bodyFields: {
            productId: {type: 'String', required: true, description: 'Product Id'},
            status: {type: 'String', description: 'Request Status', required: true, options: ['pending', 'accepted', 'rejByC', 'rejByS'], default:'pending'},
            quantityRequest: {type: 'Integer', description: 'Request quantity'},
            quantityOffer: {type: 'Integer', description: 'Offer quantity'},
            quoteRequest: {type: 'Integer', description: 'Request quote'},
            quoteOffer: {type: 'Integer', description: 'Offer quote'},
        }
    }), putCallback
);

router.patch('/requests/:id',
    au.doku({  // json documentation
        title: 'Update a request by id (patch)',
        version: '1.0.0',
        name: 'UpdateRequest (patch)',
        group: 'Requests',
        description: 'Update a request by id',
        params: {
            id: {type: 'String', required: true}
        },
        bodyFields: {
            productId: {type: 'String', required: true, description: 'Product Id'},
            status: {type: 'String', description: 'Request Status', required: true, options: ['pending', 'accepted', 'rejByC', 'rejByS'], default:'pending'},
            quantityRequest: {type: 'Integer', description: 'Request quantity'},
            quantityOffer: {type: 'Integer', description: 'Offer quantity'},
            quoteRequest: {type: 'Integer', description: 'Request quote'},
            quoteOffer: {type: 'Integer', description: 'Offer quote'},
        }
    }), putCallback
);


router.delete('/requests/:id',
    au.doku({
        // json documentation
        title: 'Delete a request by id ',
        version: '1.0.0',
        name: 'DeleteRequest',
        group: 'Requests',
        description: 'Delete a request by id',
        params: {
            id: {type: 'String', required: true, description: 'The request identifier'}
        }
    }),

    function (req, res) {

        var id = req.params['id'].toString();

        Request.findByIdAndRemove(id).then( function (entity) {

            if (_.isEmpty(entity)){
                // console.log("empty");
                return Promise.reject({
                    name:'ItemNotFound',
                    message: 'No entry with id '+ id, // Error 404
                    errorCode: 404
                });
            }
            else
                res.status(204).send(entity);

        }).catch(function (err) {
            if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
            else if (err.name === 'CastError')
                res.boom.badData('Id malformed'); // Error 422
            else
                res.boom.badImplementation('something blew up, ERROR:' + err);

        })



            /*

            if (err) {
                if (err.name === 'CastError')
                    return res.boom.badData('Id malformed'); // Error 422
                else
                    return res.boom.badImplementation(err);// Error 500
            } else
                return res.status(204).send();  // HTTP 204 ok, no body
        });*/

    });


module.exports = router;