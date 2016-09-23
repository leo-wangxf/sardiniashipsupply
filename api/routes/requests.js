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
                    name: 'ItemNotFound',
                    request: 'no conversation found for getting requests, having id ' + id,
                    errorCode: 404
                });
            else {
                query = {"_id": {$in: entities.requests}};
                return Request.paginate(query, {page: req.query.page, limit: req.query.limit});

            }


        }).then(function (results) {
            if (results.total === 0) {
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'No Requests found for query ' + JSON.stringify(query),
                    errorCode: 404
                });
            }
            else {
                res.status(200).send(results); // HTTP 200 ok
            }


        }).catch(function (err) {
            if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
            else if (err.name === 'ValidationError')
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
            status: {
                type: 'String',
                description: 'Request Status',
                options: ['pending', 'acceptedByC', 'acceptedByS', 'rejectedByC', 'rejectedByS'],
                default: 'pending',
                required: true
            },
            quantity: {type: 'Integer', description: 'Request quantity'},
            quote: {type: 'Integer', description: 'Request quote'},
        }
    }),
    function (req, res) {

        if (_.isEmpty(req.body))
            return res.boom.badData('Empty body'); // Error 422

        var id = req.params.id.toString();

        var saveResults;
        var newreq;
        Conversation.findById(id, "dateValidity requests").then(function (results) {
            saveResults = results;
            if (_.isEmpty(results))
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'no conversation found for request creation, having id ' + id,
                    errorCode: 404
                });
            else if(!isValid(results.dateValidity)){
                Request.findOneAndUpdate({_id: id}, {"status":"expired"}, {new: true});
                return Promise.reject({
                    name: 'ItemGone',
                    message: 'The date validity to put a new request is expired',
                    errorCode: 410
                });

            }
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
            else if (err.name === 'ValidationError')
                res.boom.badData(err.message); // Error 422
            else if(err.name === 'ItemGone')
                res.boom.resourceGone('Resource expired'); // Error 410
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


        Request.findById(id, newVals).then(function (entity) {
            if (_.isEmpty(entity)) {
                // console.log("empty");
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'No entry with id ' + id, // Error 404
                    errorCode: 404
                });
            }
            else
                res.send(entity);

        }).catch(function (err) {
            if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
            else if (err.name === 'CastError')
                res.boom.badData('Id malformed'); // Error 422
            else
                res.boom.badImplementation('something blew up, ERROR:' + err);

        })

    }
);


/* DELETE a request in a conversation */
router.delete('/conversations/:id_c/requests/:id_r',
    au.doku({
        // json documentation
        title: 'Delete a request by id ',
        version: '1.0.0',
        name: 'DeleteRequest',
        group: 'Requests',
        description: 'Delete a request by id',
        params: {
            id_c: {type: 'String', required: true, description: 'The conversation identifier'},
            id_r: {type: 'String', required: true, description: 'The request identifier'}
        }
    }),

    function (req, res) {

        var id_c= req.params.id_c.toString();
        var id_r = req.params.id_r.toString();

        //if(Conversation.isExpired(id_c)) return res.boom.('Empty body'); // Error 422;

        /*  if (_.isEmpty(req.body))
         return res.boom.badData('Empty body'); // Error 422
         */
        // var id = req.params.id.toString();

        var saveResults;
        var req;
        Conversation.findById(id_c, "requests").then(function (results) {
            saveResults = results;
            if (_.isEmpty(results.requests)) {

                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'no conversation found for request deletion, having id ' + id_c,
                    errorCode: 404
                });
            }
            else if(results.requests.indexOf(id_r)<0){
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'no request found for conversation having id ' + id_c,
                    errorCode: 404
                });
            }
            else
                return Request.findByIdAndRemove(id_r);
        }).then(function (entity) {
            if (_.isEmpty(entity)) {
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'No entry with id ' + id_r, // Error 404
                    errorCode: 404
                });
            }
            else
                saveResults.requests.pull(id_r);
                req = entity;
            return saveResults.save();

        }).then(function (results) {

            // var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

            //  res.set('Location', fullUrl + "/" + id + '/messages/' + newmessage._id);
            //res.status(201).send(newmessage);
            res.status(204).send(req);  // HTTP 201 deleted

        }).catch(function (err) {
            if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
            else if (err.name === 'ValidationError')
                res.boom.badData(err.message); // Error 422
            else
                res.boom.badImplementation('something blew up, ERROR:' + err);

        });

    })

    var isValid = function(date){
        var now = new Date();
        now.setHours(0,0,0,0);
        return now.getTime() <= new Date(date).getTime();

    }
router.post('/conversations/:id_c/requests/:id_r/actions/suppaccept',
    au.doku({
        // json documentation
        title: 'Supplier set quantity/quote and/or acceptance for a request',
        version: '1.0.0',
        name: 'SetQuantityOrQuoteRequestForSupplier',
        group: 'Requests',
        description: 'Supplier set quantity/quote or status in a request',
        params: {
            id_c: {type: 'String', required: true, description: 'The conversation identifier'},
            id_r: {type: 'String', required: true, description: 'The request identifier'}
        },
        bodyFields: {
            quantity: {type: 'Number', required: false, description: 'The request quantity'},
            quote: {type: 'Number', required: false, description: 'The request quote'}
        }
    }),

    function (req, res) {

        var id_r = req.params['id_r'].toString();
        var id_c = req.params['id_c'].toString();

        var fieldsToChange = _.extend({}, req.body);
        if (fieldsToChange.hasOwnProperty('page')) delete fieldsToChange.page;
        if (fieldsToChange.hasOwnProperty('limit')) delete fieldsToChange.limit;
        var allowedFields = ["quantity", "quote"];
        var query = {};
        for (var v in fieldsToChange) {
            if (_.contains(allowedFields, v)) {
                if (v === "quantity") {

                    query["quantity"] = fieldsToChange[v];
                    continue;
                } else if (v === "quote") {
                    query["quote"] = fieldsToChange[v];
                    continue;
                }
            }
        }
        query["status"] = "acceptedByS";

        Conversation.findById(id_c, "dateValidity requests").then(function (results) {
            if (_.isEmpty(results)) {

                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'no conversation found for request deletion, having id ' + id_c,
                    errorCode: 404
                });
            }
            else if(results.requests.indexOf(id_r)<0){
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'no request found for conversation having id ' + id_c,
                    errorCode: 404
                });
            }
            else if(!isValid(results.dateValidity)){
                Request.findOneAndUpdate({_id: id_r}, {"status":"expired"}, {new: true});
                return Promise.reject({
                    name: 'ItemGone',
                    message: 'The request is expired',
                    errorCode: 410
                });

            }
            else
                return Request.findOneAndUpdate({_id: id_r, status: {$eq: "pending"}}, query, {new: true})
        }).then(function (entity) {

            if (_.isEmpty(entity)) {
                // console.log("empty");
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'No entry with id ' + id_r, // Error 404
                    errorCode: 404
                });
            }
            else
                res.status(200).send(entity);
        }).catch(function (err) {
            if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
            else if (err.name === 'CastError')
                res.boom.badData('Id malformed'); // Error 422
            else if(err.name === 'ItemGone')
                res.boom.resourceGone('Resource expired'); // Error 410
            else
                res.boom.badImplementation('something blew up, ERROR:' + err);

        });

    });


router.post('/conversations/:id_c/requests/:id/actions/custmodify',
    au.doku({
        // json documentation
        title: 'Customer set quantity/quote or status in a request',
        version: '1.0.0',
        name: 'SetQuantityOrQuoteRequestForCustomer',
        group: 'Requests',
        description: 'Customer set quantity/quote or status in a request after a supplier modify. ' +
        'The request must be valid, not expired',
        params: {
            id_c: {type: 'String', required: true, description: 'The conversation identifier'},
            id_r: {type: 'String', required: true, description: 'The request identifier'}
        },
        bodyFields: {
            quantity: {type: 'Number', required: false, description: 'The request quantity'},
            quote: {type: 'Number', required: false, description: 'The request quote'}
        }
    }),

    function (req, res) {
        if (_.isEmpty(req.body))
            return res.boom.badData('Empty body');

        var id_r = req.params['id'].toString();
        var id_c = req.params['id_c'].toString();

        var fieldsToChange = _.extend({}, req.body);
        if (fieldsToChange.hasOwnProperty('page')) delete fieldsToChange.page;
        if (fieldsToChange.hasOwnProperty('limit')) delete fieldsToChange.limit;
        var allowedFields = ["quantity", "quote"];
        var query = {};
        for (var v in fieldsToChange) {
            if (_.contains(allowedFields, v)) {
                if (v === "quantity") {

                    query["quantity"] = fieldsToChange[v];
                    continue;
                } else if (v === "quote") {
                    query["quote"] = fieldsToChange[v];
                    continue;
                }
            }
        }
        query["status"] = "pending";


        Conversation.findById(id_c, "dateValidity requests").then(function (results) {
            if (_.isEmpty(results)) {

                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'no conversation found for request deletion, having id ' + id_c,
                    errorCode: 404
                });
            }
            else if(results.requests.indexOf(id_r)<0){
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'no request found for conversation having id ' + id_c,
                    errorCode: 404
                });
            }
            else if(!isValid(results.dateValidity)){
                Request.findOneAndUpdate({_id: id_r}, {"status":"expired"}, {new: true});
                return Promise.reject({
                    name: 'ItemGone',
                    message: 'The request is expired',
                    errorCode: 410
                });

            }
            else
                return Request.findOneAndUpdate({_id: id_r, status: {$eq: "acceptedByS"}}, query, {new: true})
        }).then(function (entity) {

            if (_.isEmpty(entity)) {
                // console.log("empty");
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'No entry with id ' + id_r, // Error 404
                    errorCode: 404
                });
            }
            else
                res.status(200).send(entity);

        }).catch(function (err) {
            if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
            else if (err.name === 'CastError')
                res.boom.badData('Id malformed'); // Error 422
            else if(err.name === 'ItemGone')
                res.boom.resourceGone('Resource expired'); // Error 410
            else
                res.boom.badImplementation('something blew up, ERROR:' + err);

        });

    });


router.post('/conversations/:id_c/requests/:id/actions/custaccept',
    au.doku({
        // json documentation
        title: 'Customer accept a request',
        version: '1.0.0',
        name: 'SetAcceptionRequestForCustomer',
        group: 'Requests',
        description: 'Customer accept a request after a supplier acceptance ',
        params: {
            id: {type: 'String', required: true, description: 'The request identifier'}
        }
    }),

    function (req, res) {

        var id_r = req.params['id'].toString();
        var id_c = req.params['id_c'].toString();


        Conversation.findById(id_c, "dateValidity requests").then(function (results) {
            if (_.isEmpty(results)) {

                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'no conversation found for request deletion, having id ' + id_c,
                    errorCode: 404
                });
            }
            else if(results.requests.indexOf(id_r)<0){
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'no request found for conversation having id ' + id_c,
                    errorCode: 404
                });
            }
            else if(!isValid(results.dateValidity)){
                Request.findOneAndUpdate({_id: id_r}, {"status":"expired"}, {new: true});
                return Promise.reject({
                    name: 'ItemGone',
                    message: 'The request is expired',
                    errorCode: 410
                });

            }
            else
                return Request.findOneAndUpdate(
                    {_id: id_r, status: {$eq: "acceptedByS"}},
                    {"status": 'acceptedByC'}, {new: true}
                )
        }).then(function (entity) {

            if (_.isEmpty(entity)) {
                // console.log("empty");
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'No entry with id ' + id_r, // Error 404
                    errorCode: 404
                });
            }
            else
                res.status(200).send(entity);


        }).catch(function (err) {
            if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
            else if (err.name === 'CastError')
                res.boom.badData('Id malformed'); // Error 422
            else if(err.name === 'ItemGone')
                res.boom.resourceGone('Resource expired'); // Error 410
            else
                res.boom.badImplementation('something blew up, ERROR:' + err);

        });

    });


router.post('/conversations/:id_c/requests/:id/actions/custreject',
    au.doku({
        // json documentation
        title: 'Customer reject a request',
        version: '1.0.0',
        name: 'SetRejectionRequestForCustomer',
        group: 'Requests',
        description: 'Customer reject a request after a supplier acceptance ',
        params: {
            id: {type: 'String', required: true, description: 'The request identifier'}
        }
    }),

    function (req, res) {

        var id_r = req.params['id'].toString();
        var id_c = req.params['id_c'].toString();
        Conversation.findById(id_c, "dateValidity requests").then(function (results) {
            if (_.isEmpty(results)) {

                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'no conversation found for request deletion, having id ' + id_c,
                    errorCode: 404
                });
            }
            else if(results.requests.indexOf(id_r)<0){
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'no request found for conversation having id ' + id_c,
                    errorCode: 404
                });
            }
            else if(!isValid(results.dateValidity)){
                Request.findOneAndUpdate({_id: id_r}, {"status":"expired"}, {new: true});
                return Promise.reject({
                    name: 'ItemGone',
                    message: 'The request is expired',
                    errorCode: 410
                });

            }
            else
                return Request.findOneAndUpdate(
                    {_id: id_r, status: {$eq: "acceptedByS"}},
                    {"status": 'rejectedByC'}, {new: true}
                )
        }).then(function (entity) {

            if (_.isEmpty(entity)) {
                // console.log("empty");
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'No entry with id ' + id_r, // Error 404
                    errorCode: 404
                });
            }
            else res.status(200).send(entity);


        }).catch(function (err) {
            if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
            else if (err.name === 'CastError')
                res.boom.badData('Id malformed'); // Error 422
            else if(err.name === 'ItemGone')
                res.boom.resourceGone('Resource expired'); // Error 410
            else
                res.boom.badImplementation('something blew up, ERROR:' + err);

        });

    });

router.post('/conversations/:id_c/requests/:id/actions/suppreject',
    au.doku({
        // json documentation
        title: 'Supplier reject a request',
        version: '1.0.0',
        name: 'SetRejectionRequestForSupplier',
        group: 'Requests',
        description: 'Supplier reject a request',
        params: {
            id: {type: 'String', required: true, description: 'The request identifier'}
        }
    }),

    function (req, res) {

        var id_r = req.params['id'].toString();
        var id_c = req.params['id_c'].toString();


        Conversation.findById(id_c, "dateValidity requests").then(function (results) {
            if (_.isEmpty(results)) {

                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'no conversation found for request deletion, having id ' + id_c,
                    errorCode: 404
                });
            }
            else if(results.requests.indexOf(id_r)<0){
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'no request found for conversation having id ' + id_c,
                    errorCode: 404
                });
            }
            else if(!isValid(results.dateValidity)){
                Request.findOneAndUpdate({_id: id_r}, {"status":"expired"}, {new: true});
                return Promise.reject({
                    name: 'ItemGone',
                    message: 'The request is expired',
                    errorCode: 410
                });

            }
            else
                return Request.findOneAndUpdate(
                    {_id: id_r, status: {$eq: "pending"}},
                    {"status": 'rejectedByS'}, {new: true}
                )
        }).then(function (entity) {

            if (_.isEmpty(entity)) {
                // console.log("empty");
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'No entry with id ' + id_r, // Error 404
                    errorCode: 404
                });
            }
            else
                res.status(200).send(entity);


        }).catch(function (err) {
            console.log(err);
            if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
            else if (err.name === 'CastError')
                res.boom.badData('Id malformed'); // Error 422
            else if(err.name === 'ItemGone')
                res.boom.resourceGone('Resource expired'); // Error 410
            else
                res.boom.badImplementation('something blew up, ERROR:' + err);

        });

    });


module.exports = router;