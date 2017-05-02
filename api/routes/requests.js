var express = require('express');
var Message = require('../models/messages').Message;
var Conversation = require('../models/conversations').Conversation;
var Request = require('../models/requests').Request;
//var util = require('util');
var _ = require('underscore')._;
var router = express.Router();
var au = require('audoku');
var email = require('../util/email');
var config = require('../config/default.json');
var Users = require('../models/users').User;

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
            product: {type: 'String', required: true, description: 'Product Id'},
            status: {
                type: 'String',
                description: 'Request Status',
                options: ['pending', 'acceptedByC', 'acceptedByS', 'rejectedByC', 'rejectedByS'],
                default: 'pending',
                required: true
            },
            dateIn:{type: 'Date', description: 'Date Request'},
            'quantity.number': {type: 'Integer', description: 'Request quantity'},
             quantity: {type: 'Number', required: false, description: 'Request quantity'}
        }
    }),
    function (req, res) {

        if (_.isEmpty(req.body))
            return res.boom.badData('Empty body'); // Error 422

        var id = req.params.id.toString();

        var saveResults;
        var newreq;
        Conversation.findById(id, "dateValidity requests supplier subject").then(function (results) {
            saveResults = results;
            if (_.isEmpty(results))
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'no conversation found for request creation, having id ' + id,
                    errorCode: 404
                });
            else if(results.expired){
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

            ///*
            Users.findById(saveResults.supplier, "email").lean().then(function(result){
              var sbj = "You have a new request for conversation \"" + saveResults.subject + "\"";
              var body = "A new request has been added to conversation " + saveResults.subject + "\n";
              

              email.sendMail(result.email, sbj, body, undefined, undefined, "Cagliari Port 2020")
                .then(function(result)
                {
                  console.log(result);
                }).catch(function(err)
                {
                  console.log(err);
                });
            }).catch(function(err){           
              console.log(err);
            });
            //*/
            res.status(201).send(newreq);  // HTTP 201 created


        }).catch(function (err) {
            if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
            else if (err.name === 'ValidationError')
                res.boom.badData(err.message); // Error 422
            else if(err.name === 'ItemGone')
                res.boom.resourceGone('Resource expired'); // Error 410
            else
            {
                res.boom.badImplementation('something blew up, ERROR:' + err);
            } 
                

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


router.post('/conversations/:id_c/requests/:id_r/actions/suppaccept',
    au.doku({
        // json documentation
        title: 'Supplier set quantity and/or acceptance for a request',
        version: '1.0.0',
        name: 'SetQuantityOrQuoteRequestForSupplier',
        group: 'Requests',
        description: 'Supplier set quantity or status in a request',
        params: {
            id_c: {type: 'String', required: true, description: 'The conversation identifier'},
            id_r: {type: 'String', required: true, description: 'The request identifier'}
        },
        bodyFields: {
            quantity: {type: 'Number', required: false, description: 'Request quantity'}
        }
    }),

    function (req, res) {
        var saveResults;
        var edited = false;

        var id_r = req.params['id_r'].toString();
        var id_c = req.params['id_c'].toString();
        var conv;
        var fieldsToChange = _.extend({}, req.body);
        if (fieldsToChange.hasOwnProperty('page')) delete fieldsToChange.page;
        if (fieldsToChange.hasOwnProperty('limit')) delete fieldsToChange.limit;
        var allowedFields = ["quantity"];
        var query = {};
        for (var v in fieldsToChange)
            if (_.contains(allowedFields, v)) {
                if (v === "quantity") {
                    query["quantity"] = fieldsToChange[v];
                    edited = true;
                    continue;

            }
        }

        query["status"] = "acceptedByS";

        Conversation.findById(id_c).populate("customer supplier").then(function (results) {
            saveResults = results;

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
            else if(results.expired){
                return Promise.reject({
                    name: 'ItemGone',
                    message: 'The RFQ is expired',
                    errorCode: 410
                });

            }
            else{
                conv=results;
                return Request.findOneAndUpdate({_id: id_r, status: {$eq: "pending"}}, query, {new: true});
            }


        }).then(function (entity) {

            if (_.isEmpty(entity)) {
                // console.log("empty");
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'No entry with id ' + id_r +' and status pending', // Error 404
                    errorCode: 404
                });
            }
            else{
                entity = entity.toJSON();
                entity.conversation={"_id":conv._id, "completed":conv.completed, "expire":conv.expired,"supplier":conv.supplier, "customer":conv.customer};
                req.app.get("socketio").to(id_c+'_room').emit("request", entity);

                res.status(200).send(entity);
///*
	        Users.findById(saveResults.customer, "email").lean().then(function(result){

                  var sbj;
                  var body;
                 
                  var url = config.frontendUrl + "/page_rfq_single.html?convId=" + saveResults._id;

                  if(edited)
                  {
                    sbj = "A request has been changed";
                    body = `The supplier has updated yor request. You can accept it, refuse it or make a counteroffer.
                            You can access to RFQ by clicking to this link:                            
                           `;
                    body += url + "\n\n";
                           
                  }
                  else
                  {
                    sbj = "A request has been accepted by supplier";
                    body = `The supplier has  accepted yor request. You can confirm it from the RFQ page.
                           `;
                   body += url + "\n\n";
                  }

 
                  console.log("send to: " + result.email);
                  email.sendMail(result.email, sbj, body, undefined, undefined, "Cagliari Port 2020")
                    .then(function(result)
                    {
                     console.log(result);
                    }).catch(function(err)
                    {
                      console.log(err);
                    });
                }).catch(function(err){
                  console.log(err);
                });
//            */


            }

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
        title: 'Customer set quantity or status in a request',
        version: '1.0.0',
        name: 'SetQuantityOrQuoteRequestForCustomer',
        group: 'Requests',
        description: 'Customer set quantity or status in a request after a supplier modify. ' +
        'The Conversation must be valid, not expired',
        params: {
            id_c: {type: 'String', required: true, description: 'The conversation identifier'},
            id_r: {type: 'String', required: true, description: 'The request identifier'}
        },
        bodyFields: {
            quantity: {type: 'Number', required: false, description: 'Request quantity'}
        }
    }),

    function (req, res) {

        if (_.isEmpty(req.body))
            return res.boom.badData('Empty body');

        var id_r = req.params['id'].toString();
        var id_c = req.params['id_c'].toString();
        var conv;
        var saveResults;
        var fieldsToChange = _.extend({}, req.body);
        if (fieldsToChange.hasOwnProperty('page')) delete fieldsToChange.page;
        if (fieldsToChange.hasOwnProperty('limit')) delete fieldsToChange.limit;
        var allowedFields = ["quantity"];
        var query = {};
        for (var v in fieldsToChange)
            if (_.contains(allowedFields, v)) {
                if (v === "quantity") {

                    query["quantity"] = fieldsToChange[v];
                    continue;

            }
        }
        query["status"] = "pending";
        var conv;

        Conversation.findById(id_c).populate("supplier customer").then(function (results) {
            saveResults = results;
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
            else {
                conv = results;
                return Request.findOneAndUpdate({_id: id_r, status: {$eq: "acceptedByS"}}, query, {new: true})
            }

        }).then(function (entity) {

            if (_.isEmpty(entity)) {
                // console.log("empty");
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'No entry with id ' + id_r, // Error 404
                    errorCode: 404
                });
            }
            else{
                entity = entity.toJSON();
                entity.conversation={"_id":conv._id,"completed":conv.completed, "expire":conv.expired,"supplier":conv.supplier, "customer":conv.customer};
                req.app.get("socketio").to(id_c+'_room').emit("request", entity);

	        Users.findById(saveResults.supplier, "email").lean().then(function(result){

                  var sbj;
                  var body;
                 
                  var url = config.frontendUrl + "/page_rfq_single.html?convId=" + saveResults._id;

                  sbj = "A request has been changed";
                  body = `The supplier has updated yor request. You can accept it, refuse it or make a counteroffer.
                          You can access to RFQ by clicking to this link:                            
                           `;
                  body += url + "\n\n";
                           
                  console.log("send to: " + result.email);
                  email.sendMail(result.email, sbj, body, undefined, undefined, "Cagliari Port 2020")
                    .then(function(result)
                    {
                     console.log(result);
                    }).catch(function(err)
                    {
                      console.log(err);
                    });
                }).catch(function(err){
                  console.log(err);
                });

                res.status(200).send(entity);
            }

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
        var conv;

        Conversation.findById(id_c).populate("customer supplier").then(function (results) {
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
            else if(results.expired){
                return Promise.reject({
                    name: 'ItemGone',
                    message: 'The RFQ is expired',
                    errorCode: 410
                });

            }
            else{
                conv = results;
              return Request.findOneAndUpdate(
                  {_id: id_r, status: {$eq: "acceptedByS"}},
                  {"status": 'acceptedByC'}, {new: true}
              )
            }
        }).then(function (entity) {

            if (_.isEmpty(entity)) {
                // console.log("empty");
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'No entry with id ' + id_r, // Error 404
                    errorCode: 404
                });
            }
            else{
                entity = entity.toJSON();
                entity.conversation={"_id":conv._id,"completed":conv.completed, "expire":conv.expired,"supplier":conv.supplier, "customer":conv.customer};

                req.app.get("socketio").to(id_c+'_room').emit("request", entity);


                res.status(200).send(entity);
            }


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
        var conv;

        Conversation.findById(id_c).populate("customer supplier").then(function (results) {
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
            else if(results.expired){
                return Promise.reject({
                    name: 'ItemGone',
                    message: 'The request is expired',
                    errorCode: 410
                });

            }
            else {
                conv = results;

                return Request.findOneAndUpdate(
                    {_id: id_r, status: {$eq: "acceptedByS"}},
                    {"status": 'rejectedByC'}, {new: true}
                )
            }

        }).then(function (entity) {

            if (_.isEmpty(entity)) {
                // console.log("empty");
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'No entry with id ' + id_r, // Error 404
                    errorCode: 404
                });
            }
            else{
                entity = entity.toJSON();
                entity.conversation={"_id":conv._id,"completed":conv.completed, "expire":conv.expired,"supplier":conv.supplier, "customer":conv.customer};


                req.app.get("socketio").to(id_c+'_room').emit("request", entity);


                res.status(200).send(entity);
            }


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
        var conv;

        Conversation.findById(id_c).populate("customer supplier").then(function (results) {
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
            else if(results.expired){
                return Promise.reject({
                    name: 'ItemGone',
                    message: 'The request is expired',
                    errorCode: 410
                });

            }
            else{
                conv=results;
              return Request.findOneAndUpdate(
                {_id: id_r, status: {$eq: "pending"}},
                {"status": 'rejectedByS'}, {new: true}
              )
            }


        }).then(function (entity) {

            if (_.isEmpty(entity)) {
                // console.log("empty");
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'No entry with id ' + id_r, // Error 404
                    errorCode: 404
                });
            }
            else{
                entity = entity.toJSON();

                entity.conversation={"_id":conv._id,"completed":conv.completed, "expire":conv.expired,"supplier":conv.supplier, "customer":conv.customer};

                req.app.get("socketio").to(id_c+'_room').emit("request", entity);


                res.status(200).send(entity);
            }


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
