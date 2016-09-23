var should = require('should');
var _ = require('underscore')._;
var async = require('async');
var db = require("../models/db");

var mongoose = require('mongoose');
var User = require('../models/users').User;
var Conversation = require('../models/conversations').Conversation;
var Evaluation = require('../models/evaluations').Evaluation;

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var users = [];
var conversations = [];
var evaluations = [];

var app = require('../app');
var request = require('request');

var apihost = 'http://localhost';

var apiprefix = app.get('apiprefix');

describe('Evaluation Routes', function () {

    before(function (done) {
        this.timeout(4000);
        db.connect(function () {

            app.set('port', process.env.PORT || 3000);

            server = app.listen(app.get('port'), function () {
                // console.log('TEST Express server listening on port ' + server.address().port);
                apihost += ":" + server.address().port;

                done();
            });

        });

    });

    after(function (done) {

        db.disconnect(function () {
            server.close();
            done();
        });

    });

    beforeEach(function (done) {


        var range = _.range(100);

	function getRandom(min, max) {
		return Math.floor(Math.random() * (max - min) + min);
	};
	var token = function() {
            return '008f4fdc09dd8c1c3e'+getRandom(10,99)+'d36'; // to 
	};
        var t = token() + '' + getRandom(0,9);

        var createUsers = function (callback) {
            async.each(range, function (e, cb) {
                user = new User({
                    id: t,
                    name: "Guest " + e,
                    address: "Maple street " + e,
                    password: "pw" + e
                });
                t = token() + '' + getRandom(0,9);
		user.save(function(err, u) {
                    if (err) throw err;
                    users.push(u.id);
                    cb();

                });

            }, function (err) {
                //  console.dir(users);
                callback(null);
            });

        };


        var createConversations = function (callback) {
            async.each(range, function (e, cb) {
                conversation = new Conversation({
                    supplierId: users[_.random(0, 99)],
                    customerId: users[_.random(0, 99)],
                    dateIn: Date.now(),
                    dateValidity: Date.now(),
                    dateEnd: Date.now(),
                    subject: "Subject " + e + " ",
                    completed: true
                });
                conversation.save(function (err, conversation) {
                    if (err) throw err;
                    conversations.push(conversation._id);
                    cb();
                });

            }, function (err) {
                callback(null);
            });
        };
        var createEvaluations = function () {
            async.each(range, function (e, cb) {
                evaluation = new Evaluation({
                    from: users[0],
                    to: users[1],
                    conversationId: conversations[_.random(0, 99)],
                    overall_rate: 5.0,
                    delivery_rate: 5.0,
                    product_rate: 5.0,
                    overall_review: "wonderful product!",
                    conversation_end_time: Date.now(),
                    evaluation_time: Date.now()
                });
                evaluation.save(function (err, evaluation) {
                    if (err) throw err;
                    evaluations.push(evaluation._id);
                    cb();
                });
            }, function (err) {
		Evaluation.findOne({}, function(err, eval) {
                  if (err) throw err;
		  testEvaluationId = eval._id;
		  testEvaluationFrom = eval.from;
		  testEvaluationTo = eval.to;
		  testOverallRate = eval.overall_rate;
                  done();
		});
            });
        };

        async.waterfall([
            createUsers,
            createConversations
        ], createEvaluations);
    });

    afterEach(function (done) {
        var removeUsers = function (callback) {
            User.remove(function (err, con) {
                if (err) throw err;
                callback(null);
            });
        };
        var removeConversations = function (callback) {
            Conversation.remove(function (err, con) {
                if (err) throw err;
                callback();
            });
        };
        var removeEvaluations = function () {
            Evaluation.remove({}, function (err, eva) {
                if (err) throw err;
                users = [];
                conversations = [];
                evaluations = [];
                done();
            });
        };
        async.waterfall([
            removeUsers,
            removeConversations
        ], removeEvaluations);

    });

    ///////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////// GET TESTS ////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////
    
    describe('GET' + apiprefix + '/evaluations', function() {
	    it('Checks if response status is equal to 200 when requesting all evaluations', function(done) {
	            request.get(apihost + apiprefix + '/evaluations', function(error, response, body) {
		    if (error) throw error;
		    else {
			    response.statusCode.should.be.equal(200);
		    }
                    done(); // meaning: current async test is completed
	    });

	    });
    
    });
    describe('GET' + apiprefix + '/evaluations', function() {
	    it('Must return all 100 test evaluations and pagination metadata', function(done) {
	            request.get(apihost + apiprefix + '/evaluations', function(error, response, body) {
		    if (error) throw error;
		    else {
			    response.statusCode.should.be.equal(200);
			    var results = JSON.parse(body);
			    results.should.have.property('total');
			    results.total.should.be.equal(100);
		    }
		    done();
	    });
	    });
    });
    describe('GET ' + apiprefix + '/evaluations?page=2&limit=30', function () {

        it('Pagination test: must include pagination metadata with correct values', function (done) {

            request.get(apihost + apiprefix + '/evaluations?page=2&limit=30', function (err,response, body) {
                if (err) throw err;
                else {
                    response.statusCode.should.be.equal(200);
                    var results = JSON.parse(body);
                    should.exist(results.docs);
                    results.docs.length.should.be.equal(30);
                    results.page.should.be.equal(2);
                    results.limit.should.be.equal(30);
                    results.should.have.property('total');
                    results.total.should.be.equal(100);
                }
                done();
            });

        });
    });


    describe('GET' + apiprefix + '/evaluations', function() {
	    it('Must return all 100 test evaluations with related values', function(done) {
	            request.get(apihost + apiprefix + '/evaluations', function(error, response, body) {
		    if (error) throw error;
		    else {
			    response.statusCode.should.be.equal(200);
			    var results = JSON.parse(body);
			    results.should.have.property('total');
			    results.total.should.be.equal(100);
		    }
		    done();
	    });
	    });
    });


    ///////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////// POST TESTS ///////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////
    describe('POST' + apiprefix + '/evaluations', function() {
	    it('must create an evaluation with required fields', function(done) {
		var eval_fields = {
                    from: users[_.random(0, 99)],
                    to: users[_.random(0, 99)],
                    conversationId: conversations[_.random(0, 99)],
                    overall_rate: 5.0,
                    delivery_rate: 5.0,
                    product_rate: 5.0,
                    overall_review: "wonderful product!",
                    conversation_end_time: Date.now(),
                    evaluation_time: Date.now()
		};
		var c = {
			url: apihost + apiprefix + '/evaluations',
			body: JSON.stringify(eval_fields),
			headers: {'content-type': 'application/json'}
		};
		request.post(c, function(error, response, body) {
			if(error) throw error;
			else {
				response.statusCode.should.be.equal(201);
				var results = JSON.parse(body);
				results.should.have.property('from');
				mongoose.Types.ObjectId(results.from).id.should.be.equal(eval_fields.from.id);
				results.should.have.property('to');
				mongoose.Types.ObjectId(results.to).id.should.be.equal(eval_fields.to.id);
				results.should.have.property('conversationId');
				results.should.have.property('overall_rate');
				results.overall_rate.should.be.equal(eval_fields.overall_rate);
				results.should.have.property('delivery_rate');
				results.delivery_rate.should.be.equal(eval_fields.delivery_rate);
				results.should.have.property('product_rate');
				results.product_rate.should.be.equal(eval_fields.product_rate);
				results.should.have.property('overall_review');
				results.overall_review.should.be.equal(eval_fields.overall_review);
				results.should.have.property('conversation_end_time');
                                new Date(results.conversation_end_time).toString().should.be.equal(new Date(eval_fields.conversation_end_time).toString());
				results.should.have.property('evaluation_time');
                                new Date(results.evaluation_time).toString().should.be.equal(new Date(eval_fields.evaluation_time).toString());

				//console.log(results);
			};
			done();
		});
	    });
    });

    describe('POST' + apiprefix + '/evaluations', function() {
	    it('must get bad data error because req.body is empty', function(done) {
		var c = {
			url: apihost + apiprefix + '/evaluations',
			body: "",
			headers: {'content-type': 'application/json'}
		};
		request.post(c, function(error, response, body) {
			if (error) throw error;
			else {
				response.statusCode.should.be.equal(422); // bad data error
			};
			done();
		});
	    });
    });
    ///////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////// PUT TESTS ///////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////

});
	    
