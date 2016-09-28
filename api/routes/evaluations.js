var express = require('express');
var Evaluation = require('../models/evaluations.js').Evaluation;
//var util = require('util');
var _ = require('underscore')._;
var router = express.Router();
var au = require('audoku');
var ObjectId = require('mongoose').Types.ObjectId;

router.get('/evaluations',
    au.doku({  // json documentation
        description: 'Get all the evaluations defined in db',
	title: 'Get evaluations',
	name: 'GetEvaluations',
	group: 'Evaluations',
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
        var query = _.extend({}, req.query);
        if (query.hasOwnProperty('page')) delete query.page;
        if (query.hasOwnProperty('limit')) delete query.limit;

	// now prepare a proper query for mongoose ...
	var searchFields = ["from","to", "conversationId", "evaluation_time"]
	for (var searchBy in req.query)
	       if(_.contains(searchFields, searchBy)) {
		       if (searchBy === "evaluation_time") {
                         var eval_time = {};
                         eval_time["$gte"] = new Date(req.query[v]);
                         eval_time["$lt"] = new Date(req.query[v]);
                         eval_time["$lt"].setDate(eval_time["$lt"].getDate() +1);
                         delete query[eval_time];
                         query['evaluation_range_time'] = eval_time ;
                         continue;

		       }
               query[searchBy] = req.query[searchBy];
	       }


        Evaluation.paginate(query, {page: req.query.page, limit: req.query.limit}).then(function (entities) {

            if (entities.total === 0)
                res.boom.notFound("No Evaluations found for query " + JSON.stringify(query)); // Error 404
            else
                res.send(entities); // HTTP 200 ok

        }).catch(function (err) {
            res.boom.badImplementation(err); // Error 500
        });

    });


router.post('/evaluations',
    au.doku({  // json documentation
        description: 'Create an evaluation in db',
        fields: {
            from: {type: "String", required: true, description: "evaluator user (a customer)"},
            to: {type: "String", required: true, description: "evaluated user (a supplier)"},
            conversationId:{type:"String", required: true, description:"Id of related conversation"},
            overall_rate:{type:"Float", required:true, description:"overall user rate"},
            delivery_rate:{type:"Float", required:false, description:"user rate about delivery service"},
            product_rate:{type:"Float", required:false, description:"user rate about product or service quality"},
            overall_review:{type:"String", required:false, description:"overall user textual review"},
            conversation_end_time:{type:"Date", required:true, description:"When the related conversation ended."},
            evaluation_time:{type:"Date", required:true, description:"Time of evaluation."},
            description: {type: "String", required: false}

        }
    }),
    function (req, res) {

        if (_.isEmpty(req.body))
            return res.boom.badData("Empty body"); // Error 422

        Evaluation.create(req.body).then(function (entities) {


            if (!entities)
                return res.boom.badImplementation("Someting strange"); // Error 500
            else
                return res.status(201).send(entities);  // HTTP 201 created
        }).catch(function (err) {
            if (err.name === "ValidationError")
                return res.boom.badData(err.message); // Error 422
            else
                return res.boom.badImplementation(err);// Error 500
        });

    });


router.get('/evaluations/:id',
    au.doku({  // json documentation
        description: 'Get an evaluation by id',
        params: {
            id: {type: "String", required: true}
        }
    }), function (req, res) {
        var id = req.params.id.toString();

        var newVals = req.body; // body already parsed

        Evaluation.findById(id, newVals).then(function (entities) {

            if (_.isEmpty(entities))
                res.boom.notFound("No entry with id " + id); // Error 404
            else
                res.send(entities);  // HTTP 200 ok
        }).catch(function (err) {
            if (err.name === "CastError")
                res.boom.badData("Id malformed"); // Error 422
            else
                res.boom.badImplementation(err);// Error 500
        });
    }
);


var putCallback = function (req, res) {

    if (_.isEmpty(req.body))
        return res.boom.badData("Empty boby"); // Error 422

    var id = req.params.id.toString();

    var newVals = req.body; // body already parsed

    Evaluation.findByIdAndUpdate(id, newVals, {new:true}).then(function (entities) {

        if (_.isEmpty(entities))
            res.boom.notFound("No entry with id " + id); // Error 404
        else
	    //console.log('inside put callback entities are:' + entities);
            res.send(entities);  // HTTP 200 ok
    }).catch(function (err) {
        if (err.name === "ValidationError")
            res.boom.badData(err.message); // Error 422
        else if (err.name === "CastError")
            res.boom.badData("Id malformed"); // Error 422
        else
            res.boom.badImplementation(err);// Error 500
    });

};


router.put('/evaluations/:id',
    au.doku({  // json documentation
        description: 'Update an evaluation by id',
        params: {
            id: {type: "String", required: true}
        },
        fields: {
            from: {type: "String", required: true, description: "evaluator user (a customer)"},
            to: {type: "String", required: true, description: "evaluated user (a supplier)"},
            conversationId:{type:"String", required: true, description:"Id of related conversation"},
            overall_rate:{type:"Float", required:true, description:"overall user rate"},
            delivery_rate:{type:"Float", required:false, description:"user rate about delivery service"},
            product_rate:{type:"Float", required:false, description:"user rate about product or service quality"},
            overall_review:{type:"String", required:false, description:"overall user textual review"},
            conversation_end_time:{type:"Date", required:true, description:"When the related conversation ended."},
            evaluation_time:{type:"Date", required:true, description:"Time of evaluation."},
            description: {type: "String", required: false}
        }
    }), putCallback
);

router.patch('/evaluations/:id',
    au.doku({  // json documentation
        description: 'Update an evaluation by id',
        params: {
            id: {type: "String", required: true}
        },
        fields: {
            from: {type: "String", required: true, description: "evaluator user (a customer)"},
            to: {type: "String", required: true, description: "evaluated user (a supplier)"},
            conversationId:{type:"String", required: true, description:"Id of related conversation"},
            overall_rate:{type:"Float", required:true, description:"overall user rate"},
            delivery_rate:{type:"Float", required:false, description:"user rate about delivery service"},
            product_rate:{type:"Float", required:false, description:"user rate about product or service quality"},
            overall_review:{type:"String", required:false, description:"overall user textual review"},
            conversation_end_time:{type:"Date", required:true, description:"When the related conversation ended."},
            evaluation_time:{type:"Date", required:true, description:"Time of evaluation."},
            description: {type: "String", required: false}
        }
    }), putCallback
);


router.delete('/evaluations/:id',
    au.doku({  // json documentation
	title: 'Delete an evaluation found by id',
        description: 'Delete an evaluation by id',
	group: 'Evaluations',
        params: {
		id: {type: "String", required: true, description: 'Evaluation ID'}
        }
    }),
    function (req, res) {

        var id = req.params.id.toString();

        Evaluation.findByIdAndRemove(id).then(function (entities) {

            res.status(204).send();  // HTTP 204 ok, no body
        }).catch(function (err) {
                if (err.name === "CastError")
                    res.boom.badData("Id malformed"); // Error 422
                else
                    res.boom.badImplementation(err);// Error 500
            }
        );

    });


module.exports = router;
