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

describe('Evaluation Model', function () {

    before(function (done) {
        db.connect(function (err) {
            if (err)
                console.log("error connecting to db");
            done();
        });
    });

    after(function (done) {

        db.disconnect(function () {
            done();
        });
    });

    beforeEach(function (done) {


        var range = _.range(100);


        var createUsers = function (callback) {
            async.each(range, function (e, cb) {
                user = new User({
                    id: "008f4fdc09dd8c1c3e51d364",
                    name: "Guest " + e,
                    address: "Maple street " + e,
                    password: "pw" + e
                });

                user.save(function (err, us) {
                    if (err) throw err;
                    users.push(user._id);
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
	// example of correct evaluation
        var createEvaluations = function () {
            async.each(range, function (e, cb) {
                evaluation = new Evaluation({
                    from: users[_.random(0, 99)],
                    to: users[_.random(0, 99)],
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
                done();
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
    describe('paginate({page:2, limit:30})', function () {

        it('Pagination test: must include metadata with correct values', function (done) {

            Evaluation.paginate({}, {page: 2, limit: 30}).then(function (results) {

                results.docs.length.should.be.equal(30);
                results.page.should.be.equal(2);
                results.limit.should.be.equal(30);
                results.should.have.property('total');
                results.total.should.be.equal(100);

                done();

            });

        });

    });
    describe('Try to create an evaluation with more fields than defined', function () {

        it('must not save with more than the fields required', function (done) {
            Evaluation.create({
                from: users[_.random(0, 99)],
                to: users[_.random(0, 99)],
		conversationId: conversations[_.random(0, 99)],
                conversation_end_time:conversations[_.random(0,99)].dateEnd,
		overall_rate:5.0,
		delivery_rate:4.5,
		product_rate:3.8,
		overall_review:"The product was as expected.",
                evaluation_time: Date.now(),
                dummy_field: "Not expected field: a StrictModeError is expected from mongoose"
            }).catch(function (err) {
                should.exist(err); //  err;
		// when mongoose strict mode is enabled, 
		// (defining the mongoose schema with argument
		// strict:"throw"),
		// it throws a StrictModeError whenever a field 
		// is provided that does not exist in the module
		// The problem is that the same error is mistakenly
		// fired also when the field exists in the model,
		// but it has the wrong type. This was an issue of early
		// 2016, remember to check if it has been fixed.
                err.name.should.be.equal('StrictModeError');
                done();
            });


        });

    });
    describe('Try to create an evaluation with an off limit value', function () {

        it('must not save with an off limit value (greater than the max)', function (done) {
            Evaluation.create({
                from: users[_.random(0, 99)],
                to: users[_.random(0, 99)],
		conversationId: conversations[_.random(0, 99)],
                conversation_end_time:conversations[_.random(0,99)].dateEnd,
		overall_rate:8.0,
		delivery_rate:4.5,
		product_rate:3.8,
		overall_review:"The product was as expected.",
                evaluation_time: Date.now(),
            }).catch(function (err) {
                should.exist(err); //  err;
                err.name.should.be.equal('ValidationError');
                done();
            });


        });

    });

    describe('Try to create an evaluation with an off limit value', function () {

        it('must not save with an off limit value (smaller than the min)', function (done) {
            Evaluation.create({
                from: users[_.random(0, 99)],
                to: users[_.random(0, 99)],
		conversationId: conversations[_.random(0, 99)],
                conversation_end_time:conversations[_.random(0,99)].dateEnd,
		overall_rate:5.0,
		delivery_rate:4.5,
		product_rate:-3.8,
		overall_review:"The product was as expected.",
                evaluation_time: Date.now(),
            }).catch(function (err) {
                should.exist(err); //  err;
                err.name.should.be.equal('ValidationError');
                done();
            });


        });

    });

    describe('Try to create an evaluation without a required field', function () {

        it('must not save with an off limit value (smaller than the min)', function (done) {
            Evaluation.create({
                from: users[_.random(0, 99)],
                //to: users[_.random(0, 99)], // required field missing!
		conversationId: conversations[_.random(0, 99)],
                conversation_end_time:conversations[_.random(0,99)].dateEnd,
		overall_rate:5.0,
		delivery_rate:4.5,
		product_rate:3.8,
		overall_review:"The product was as expected.",
                evaluation_time: Date.now(),
            }).catch(function (err) {
                should.exist(err); //  err;
                err.name.should.be.equal('ValidationError');
                done();
            });


        });

    });




});
	    
