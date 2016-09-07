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


        var createUsers = function (callback) {
            async.each(range, function (e, cb) {
                user = new User({
                    id: "008f4fdc09dd8c1c3e51d364",
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
    describe('GET ' + apiprefix + '/evaluations?page=2&limit=30', function () {

        it('Pagination test: must include metadata with correct values', function (done) {

            request.get(apihost + apiprefix + '/evaluations?page=2&limit=30', function (err,response, body) {
                if (err) throw err;
                else {
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

});
	    
