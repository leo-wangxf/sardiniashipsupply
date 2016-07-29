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

describe('Evaluation Model',  function () {

    before(function (done) {
        db.connect(function (err) {
            if (err)
                console.log("error connecting to db")
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
                    name: "Guest " + e,
                    address: "Maple street " + e,
		    password: "pw" + e
                });

                user.save(function (err, message) {
                    if (err) throw err;
                    users.push(user._id);
                    cb();

                });

            }, function (err) {
                //  console.dir(users);
                callback(null);
            });

        };


	var createConversations = function(callback) {
	    async.each(range, function (e, cb) {
		    conversation = new Conversation({
			    supplierId: users[_.random(0,99)],
			    customerId: users[_.random(0,99)],
			    dateIn: Date.now(),
			    dateValidity: Date.now(),
			    dateEnd: Date.now(),
			    subject: "Subject " + e + " ",
			    completed: true
		    });
		    conversation.save(function( err, conversation) { 
			    if (err) throw err;
			    conversations.push(conversation._id);
			    cb();
		    });

	    }, function (err) {
		    callback(null);
	    });
	};
	var createEvaluations = function() {
		async.each(range, function(e, cb) {
			evaluation = new Evaluation({
				from: users[_.random(0,99)],
				to: users[_.random(0,99)],
				conversationId: conversations[_.random(0,99)],
				overall_rate: 5.0,
			        delivery_rate: 5.0,
				product_rate: 5.0,
				overall_review: "wonderful product!",
				conversation_end_time:Date.now(),
				evaluation_time:Date.now()
			});
			evaluation.save(function (err, evaluation) {
				if (err) throw err;
				evaluations.push(evaluation._id);
				cb();
			});
		}, function (err) {
			done();
		});
	}

	async.waterfall([
		createUsers,
		createConversations
	], createEvaluations);
    });

    afterEach(function(done) {
	    var removeUsers = function(callback) {
		    User.remove(function(err, con) {
			    if (err) throw err;
			    callback(null);
		    });
	    }
            var removeConversations = function() {
		    Conversation.remove(function(err, con) {
			    if (err) throw err;
			    done();
		    });
	    }
            var removeEvaluations = function() {
		    Evaluation.remove(function(err, eva) {
			    if (err) throw err;
			    done();
		    });
	    }
	    async.waterfall([
			    removeUsers,
			    removeConversations
	    ], removeEvaluations);
	    users = [];
	    conversations = [];
	    evaluations = [];
    });
        describe('paginate({page:2, limit:30})', function () {

        it('Pagination test: must include metadata with correct values', function (done) {

            Evaluation.paginate({}, {page: 2, limit: 30}, function (err, results) {

                if (err) throw err;
                else {

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

});
	    
