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
var positive_reviews = ["everything was OK", "It is a wonderful product!", "this is my favourite supplier", "I will buy again from this supplier", "I recommend this supplier to everybody","very good"];
var negative_reviews = ["everything was terrible", "This supplier is too expensive!", "this is the worse supplier ever", "I will NOT buy again from this supplier", "I do not recommend this supplier!","no, no, no" ];

var app = require('../app');
var request = require('request');

var apihost = 'http://localhost';

var apiprefix = app.get('apiprefix');


var msToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJtb2RlIjoibXMiLCJpc3MiOiJub3QgdXNlZCBmbyBtcyIsImVtYWlsIjoibm90IHVzZWQgZm8gbXMiLCJ0eXBlIjoiYXV0aG1zIiwiZW5hYmxlZCI6dHJ1ZSwiZXhwIjoxNzg1NTc1MjQ3NTY4fQ.Du2bFjd0jB--geRhnNtbiHxcjQHr5AyzIFmTr3NFDcM";

var headers = {'content-type': 'application/json',Authorization : "Bearer "+ msToken};




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
                    supplier: users[_.random(0, 99)],
                    customer: users[_.random(0, 99)],
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
                    overall_rate: _.random(0, 5),
                    delivery_rate: _.random(0,5),
                    product_rate: _.random(0,5),
                    price_value_rate: _.random(0,4),
                    customer_service_rate: _.random(0,4),
                    pros_review: positive_reviews[_.random(0,5)],
                    cons_review: negative_reviews[_.random(0,5)],
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
		    var c = {url:apihost + apiprefix + '/evaluations', headers:headers};
	            request.get(c, function(error, response, body) {
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
		    var c = {url:apihost + apiprefix + '/evaluations', headers:headers};
	            request.get(c, function(error, response, body) {
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

            var c = {url:apihost + apiprefix + '/evaluations?page=2&limit=30', headers:headers};
            request.get(c, function (err,response, body) {
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
            var c = {url:apihost + apiprefix + '/evaluations', headers:headers};
	     request.get(c, function(error, response, body) {
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


    describe('GET' + apiprefix + '/users/supplier/:id/evaluations', function() {
	    it('Must return all the evaluations about a supplier', function(done) {
                    var supplier_id = users[1]; // a test supplier user who has received some test evaluations
                    var c = {url:apihost + apiprefix + '/users/supplier/'+ supplier_id + '/evaluations', headers:headers};
	            request.get(c, function(error, response, body) {
		    if (error) throw error;
		    else {
			    
		            console.log('INSIDE TEST Get users id evaluations');
			    //response.statusCode.should.be.equal(200);
			    var results = JSON.parse(body);
			    results.should.have.property('total');
			    results.total.should.be.equal(100);
			    results.should.have.property('docs');
		            console.log('CLIENT SIDE, results are:' + results);
		            console.log('results total are:' + results.total);
		            console.log('results docs are:' + results.docs);
		            console.log('results docs length is:' + results.docs.length);
			    // in docs there are the evaluations of one page only
                            for (var i=0; i< results.docs.length; i++) {
		                console.log('evaluation id = ' + results.docs[i]._id);
		                console.log('evaluation from = ' + results.docs[i].from);
		                console.log('evaluation to = ' + results.docs[i].to);
		                console.log('evaluation overall rate = ' + results.docs[i].overall_rate);
		            }
			    //results.should.have.property('total');
			    //results.total.should.be.equal(100);
		    }
		    done();
	    });
    });
    });

    describe('GET' + apiprefix + '/users/supplier/:id/evaluations/avg_overall_rate', function() {
	    it('Must return the average overall rate received by a supplier', function(done) {
                    var supplier_id = users[1]; // a test supplier user who has received some test evaluations
		    console.log('CLIENT SIDE supplier id: ' + supplier_id);
                    var c = {url:apihost + apiprefix + '/users/supplier/'+ supplier_id + '/evaluations/avg_overall_rate', headers:headers};
	            request.get(c, function(error, response, body) {
		    if (error) throw error;
		    else {
			    
		            console.log('INSIDE TEST Get average overall rate of a supplier');
			    //response.statusCode.should.be.equal(200);
			    var results = JSON.parse(body);
			    //results.should.have.property('supplier_id');
			    //results.should.have.property('average_overall_rate'); 
		            console.log('CLIENT SIDE, avg_overall_rate result:' + results);
			    Object.getOwnPropertyNames(results).forEach(function(val, idx,array) {
				    console.log(val + ' ---> ' + results[val]);
			    });
		            console.log('CLIENT SIDE, avg_overall_rate result docs:' + results.docs);
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
                    delivery_rate: 4.0,
                    product_rate: 3.0,
                    price_value_rate: 2.0,
                    customer_service_rate: 1.0,
                    pros_review: "It is a wonderful product!",

                    cons_review: "Maybe it is too expensive ...",
                    conversation_end_time: Date.now(),
                    evaluation_time: Date.now()
		};
		var eval = {
			url: apihost + apiprefix + '/evaluations',
			body: JSON.stringify(eval_fields),
			headers: headers 
		};
		request.post(eval, function(error, response, body) {
			if(error) throw error;
			else {
				response.statusCode.should.be.equal(201);
				var results = JSON.parse(body);
				results.should.have.property('from');
				mongoose.Types.ObjectId(results.from).id.should.be.equal(eval_fields.from.id);
				results.should.have.property('to');
				//mongoose.Types.ObjectId(results.to).id.should.be.equal(eval_fields.to.id);
				results.should.have.property('conversationId');
				results.should.have.property('overall_rate');
				results.overall_rate.should.be.equal(eval_fields.overall_rate);
				results.should.have.property('delivery_rate');
				results.delivery_rate.should.be.equal(eval_fields.delivery_rate);
				results.should.have.property('product_rate');
				results.product_rate.should.be.equal(eval_fields.product_rate);
				results.should.have.property('price_value_rate');
				results.price_value_rate.should.be.equal(eval_fields.price_value_rate);
				results.should.have.property('customer_service_rate');
				results.customer_service_rate.should.be.equal(eval_fields.customer_service_rate);
				results.should.have.property('pros_review');
				results.pros_review.should.be.equal(eval_fields.pros_review);
				results.should.have.property('cons_review');
				results.cons_review.should.be.equal(eval_fields.cons_review);
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
		var eval = {
			url: apihost + apiprefix + '/evaluations',
			body: "",
			headers: headers
		};
		request.post(eval, function(error, response, body) {
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
    describe('PUT' + apiprefix + '/evaluations/:id', function() {
        it('must update the evaluation with the id specified in the URL', function(done) {
		Evaluation.findOne({}, function(err, eval) {
			if(err) throw err;
                        const EVAL_ID = eval._id;
			var overall_rate = eval.overall_rate;
			//console.log('eval id = ' + EVAL_ID);
			//console.log('overall_rate = ' + overall_rate);
			var eval = {
				url: apihost + apiprefix + '/evaluations/' + EVAL_ID,
				body: JSON.stringify({overall_rate:3.2}),
				headers: headers
			};
			request.put(eval, function(error, response) {
				if (error) throw error;
				else {
					if(response.statusCode != 200) {
						console.log('Unexpected status code: ' + response.statusCode);
					} else {
					//console.log('response statusCode: ' + response.statusCode);
 					response.statusCode.should.be.equal(200); //http OK
			                var responsebody = JSON.parse(response.body);
			                responsebody.should.have.property('overall_rate');
                                        responsebody.overall_rate.should.be.equal(3.2);
					done();
				}
				};
			});
		});
	});
    });
});	    
