var should = require('should');
var mongoose = require('mongoose');
var _ = require('underscore')._;
var async = require('async');
var db = require("../models/db");
var Conversation = require('../models/conversations').Conversation;
var app = require('../app');
var request = require('request');
var makeid = require('../util/fakeid');

var apihost = 'http://localhost';

var apiprefix = app.get('apiprefix');

var testConversationId = '';
var tooShortId = '008f4fdc09de51d364';
var notExistingId = '008f4fdc09dd8c1c3e51d364';


var User = require('../models/users').User;
var Message = require('../models/messages').Message;
var Product = require('../models/products').Product;
var Request = require('../models/requests').Request;
var Category = require('../models/categories').Category;


var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var users = [];
var messages = [];
var requests = [];
var products = [];
var categories = [];
var conversations = [];


describe('Conversations API', function () {

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
                    name: "Guest " + e
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


        var createMessages = function (callback) {
            async.each(range, function (e, cb) {
                message = new Message({
                    senderId: users[_.random(0, 99)],
                    dateIn: Date.now(),
                    draft: false,
                    text: "AA123 " + e + " CA",
                    attachments: ["http//:url"]
                });


                //console.log(message);
                message.save(function (err, message) {
                    if (err) throw err;
                    messages.push(message._id);
                    cb();

                });

            }, function (err) {
                //  console.dir(messages);
                //  console.log(err);
                callback(null);
            });


        }

        var createCategories = function (callback) {
            async.each(range, function (e, cb) {
                cat = new Category({
                    unspsc: _.random(0, 99),
                    name: "Name " + e + " CAtegoria",
                    description: "Description " + e + " CA"
                });


                // console.log(cat);
                cat.save(function (err, cat) {
                    if (err) throw err;
                    categories.push(cat._id);
                    cb();

                });

            }, function (err) {
                // console.dir(categories);
                //  console.log(err);
                callback(null);
            });


        }

        var createProducts = function (callback) {
            async.each(range, function (e, cb) {
                product = new Product({
                    name: "Name product " + e,
                    description: "Description product " + e,
                    supplierId: users[_.random(0, 99)],
                    categories: [categories[_.random(0, 99)]],
                    images: ["http://ret"]
                });
                //  console.dir(product);
                product.save(function (err, product) {
                    // console.log(err);
                    if (err) throw err;
                    products.push(product._id);
                    cb();

                });

            }, function (err) {
                // console.log(err);
                // console.dir(products);
                callback(null);
            });


        }

        var createRequests = function (callback) {
            async.each(range, function (e, cb) {
                var request = new Request({
                    productId: products[_.random(0, 99)],
                    status: 'pending',
                    quantityRequest: e * 100,
                    quantityOffer: e * 100,
                    quoteRequest: e * 100,
                    quoteOffer: e * 100,
                });

                request.save(function (err, request) {
                    if (err) throw err;
                    requests.push(request._id);
                    cb();

                });

            }, function (err) {
                //console.log(err);
                // console.log(requests);
                callback(null);
            });


        }

        var createConversations = function () {
            async.each(range, function (e, cb) {
                conversation = new Conversation({
                    senderId: users[_.random(0, 99)],
                    customerId: users[_.random(0, 99)],
                    dateIn: Date.now(),
                    dateValidity: Date.now(),
                    dateEnd: Date.now(),
                    subject: "Subject " + e + " ",
                    completed: true,
                    messages: [messages[_.random(0, 99)]],
                    requests: [requests[_.random(0, 99)]],
                    hidden: false
                });

                conversation.save(function (err, conversation) {
                    //    console.log(err);
                    if (err) throw err;
                    conversations.push(conversation._id);
                    cb();

                });


            }, function (err) {
                Conversation.findOne({}, function (err, cat) {
                    if (err) throw err;
                    testConversationId = cat._id;
                    done();
                });
            });

        }


        async.waterfall([
            createUsers,
            createMessages,
            createCategories,
            createProducts,
            createRequests
        ], createConversations);

    });

    afterEach(function (done) {
        var removeUsers = function (callback) {
            User.remove(function (err, con) {
                if (err) throw err;
                callback(null);
            });
        }
        var removeMessages = function (callback) {
            Message.remove(function (err, con) {
                if (err) throw err;
                callback(null);
            });
        }
        var removeCategories = function (callback) {
            Category.remove(function (err, con) {
                if (err) throw err;
                callback(null);
            });
        }
        var removeProducts = function (callback) {
            Product.remove(function (err, con) {
                if (err) throw err;
                callback(null);
            });
        }
        var removeRequests = function (callback) {
            Request.remove(function (err, con) {
                if (err) throw err;
                callback(null);
            });
        }
        var removeConversations = function () {
            Conversation.remove(function (err, con) {
                if (err) throw err;
                done();
            });
        }


        async.waterfall([
            removeUsers,
            removeMessages,
            removeCategories,
            removeProducts,
            removeRequests
        ], removeConversations);

        users = [];
        messages = [];
        requests = [];
        products = [];
        categories = [];
        conversations = [];

    });

    describe('GET ' + apiprefix + '/conversations', function () {

        it('must return 2 conversations and pagination metadata, all fields', function (done) {

            var c = {url: apihost + apiprefix + '/conversations'};
          //  console.log(c);

            request.get(c, function (error, response, body) {
                try {
                  //  console.log(response);

                    if (error) throw error;
                    else {
                        response.statusCode.should.be.equal(200);
                        var results = JSON.parse(body);
                        results.should.have.property('total');
                        results.should.have.property('docs');
                        results.docs.length.should.be.equal(2);
                        results.page.should.be.equal(1);
                        results.limit.should.be.equal(2);
                        results.total.should.be.equal(100);

                    }
                } catch (error) {
                  //  console.log(error);

                    done();

                }
                // done();

            });

        });

    });

    describe('POST ' + apiprefix + '/conversations', function () {

        it('must create one conversation with given fields', function (done) {

            var data = {
                supplierId: users[_.random(0, 99)],
                customerId: users[_.random(0, 99)],
                dateIn: Date.now(),
                dateValidity: Date.now(),
                dateEnd: Date.now(),
                subject: "Subject " + _.random(0, 99) + " ",
                completed: true,
                messages: [messages[_.random(0, 99)]],
                requests: [requests[_.random(0, 99)]],
                hidden: false
            };
            var c = {
                url: apihost + apiprefix + '/conversations',
                body: JSON.stringify(data),
                headers: {'content-type': 'application/json'}
            };

            request.post(c, function (error, response, body) {
           //     console.log("response");
            //    console.log(response);

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(201);
                    var results = JSON.parse(body);
                    //console.log(results)
                     results.should.have.property('supplierId');
                    mongoose.Types.ObjectId(results.supplierId).id.should.be.equal(data.supplierId.id);
                     results.should.have.property('customerId');
                    mongoose.Types.ObjectId(results.customerId).id.should.be.equal(data.customerId.id);
                    results.should.have.property('dateIn');
                    new Date(results.dateIn).toString().should.be.equal(new Date(data.dateIn).toString());
                    results.should.have.property('dateValidity');
                    new Date(results.dateValidity).toString().should.be.equal(new Date(data.dateValidity).toString());
                    results.should.have.property('dateEnd');
                    new Date(results.dateEnd).toString().should.be.equal(new Date(data.dateEnd).toString());
                    results.should.have.property('completed');
                    results.completed.should.be.equal(data.completed);
                    results.should.have.property('messages');
                    results.messages.length.should.be.equal(data.messages.length);
                    results.should.have.property('requests');
                    results.requests.length.should.be.equal(data.requests.length);
                    results.should.have.property('hidden');
                    results.hidden.should.be.equal(data.hidden);
                    results.should.have.property('_id');

                }
                done();

            });

        });

    });


    describe('POST ' + apiprefix + '/conversations', function () {

        it('must get bad data error (empty request body)', function (done) {

            var c = {
                url: apihost + apiprefix + '/conversations',
                body: "",
                headers: {'content-type': 'application/json'}
            };

            request.post(c, function (error, response, body) {

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(422); //  bad data
                }
                done();
            });
        });
    });

    describe('POST ' + apiprefix + '/conversations', function () {

        it('must get bad data error (missing data in body req)', function (done) {

            var c = {
                url: apihost + apiprefix + '/conversations',
                body: JSON.stringify({supplierId: users[_.random(0, 99)]}),
                headers: {'content-type': 'application/json'}
            };

            request.post(c, function (error, response, body) {

                if (error) throw error;
                else {
                    var result = JSON.parse(body);
                    result.statusCode.should.be.equal(422); //  bad data
                }
                done();

            });

        });

    });


    describe('PUT ' + apiprefix + '/conversations/:id', function () {

        it('must update the conversation with given id', function (done) {
            Conversation.findOne({}, function (err, cat) {
                if (err) throw err;

                const tstConversationId = cat._id;
                console.log(testConversationId);
                console.log(cat);

                var c = {
                    url: apihost + apiprefix + '/conversations/' + tstConversationId,
                    body: JSON.stringify({completed: true}),
                    headers: {'content-type': 'application/json'}
                };

                request.put(c, function (error, response) {

                    if (error) throw error;
                    else {
                        //  var result = JSON.parse(body);
                        response.statusCode.should.be.equal(200); //  HTTP ok
                        done();
                    }

                });

            });

        });

    });

    describe('PUT ' + apiprefix + '/conversations/:id', function () {

        it('must get error updating the conversation with id=' + testConversationId + " (empty body)", function (done) {

            var c = {
                url: apihost + apiprefix + '/conversations/' + testConversationId,
                body: "",
                headers: {'content-type': 'application/json'}
            };

            request.put(c, function (error, response, body) {

                if (error) throw error;
                else {
                    var result = JSON.parse(body);
                    response.statusCode.should.be.equal(422); //  Bad Data
                }
                done();

            });

        });

    });
    describe('PATCH ' + apiprefix + '/conversations/:id', function () {

        it('must update the conversation with id=' + testConversationId, function (done) {

            var c = {
                url: apihost + apiprefix + '/conversations/' + testConversationId,
                body: JSON.stringify({completed: true}),
                headers: {'content-type': 'application/json'}
            };

            request.patch(c, function (error, response, body) {

                if (error) throw error;
                else {
                    var result = JSON.parse(body);
                    response.statusCode.should.be.equal(200); //  HTTP ok
                }
                done();

            });

        });

    });

    describe('PATCH ' + apiprefix + '/conversations/:id', function () {

        it('must return "not found 404" for conversation with id=' + notExistingId, function (done) {

            var c = {
                url: apihost + apiprefix + '/conversations/' + notExistingId,
                body: JSON.stringify({subject: "Water emergency"}),
                headers: {'content-type': 'application/json'}
            };

            request.patch(c, function (error, response, body) {

                if (error) throw error;
                else {
                    var result = JSON.parse(body);
                    response.statusCode.should.be.equal(404); //  NOT FOUND
                }
                done();

            });

        });

    });

    describe('PATCH ' + apiprefix + '/conversations/:id', function () {

        it('must return "bad data 422" for conversation with id=' + tooShortId, function (done) {

            var c = {
                url: apihost + apiprefix + '/conversations/' + tooShortId,
                body: JSON.stringify({subject: "Water emergency"}),
                headers: {'content-type': 'application/json'}
            };

            request.patch(c, function (error, response, body) {

                if (error) throw error;
                else {
                    var result = JSON.parse(body);
                    response.statusCode.should.be.equal(422); //  BAD DATA
                }
                done();

            });

        });

    });

    describe('PATCH ' + apiprefix + '/conversations/:id', function () {

        it('must update the conversation with id=' + testConversationId, function (done) {

            var c = {
                url: apihost + apiprefix + '/conversations/' + testConversationId,
                body: JSON.stringify({subject: "Water emergency"}),
                headers: {'content-type': 'application/json'}
            };

            request.patch(c, function (error, response, body) {

                if (error) throw error;
                else {
                    var result = JSON.parse(body);
                    response.statusCode.should.be.equal(200); //  HTTP ok
                }
                done();

            });

        });

    });


    describe('GET ' + apiprefix + '/conversations/:id', function () {

        it('must return the conversation with id=' + testConversationId, function (done) {

            var c = {url: apihost + apiprefix + '/conversations/' + testConversationId};

            request.get(c, function (error, response, body) {

                if (error) throw error;
                else {
                    var result = JSON.parse(body);
                    response.statusCode.should.be.equal(200); //  HTTP ok
                }
                done();

            });

        });

    });

    describe('GET ' + apiprefix + '/conversations/:id', function () {

        it('must return "not found 404" for conversation with id=' + notExistingId, function (done) {

            var c = {url: apihost + apiprefix + '/conversations/' + notExistingId};

            request.get(c, function (error, response, body) {

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(404); //  NOT FOUND
                }
                done();

            });

        });

    });

    describe('GET ' + apiprefix + '/conversations/:id', function () {

        it('must return "bad data 422" for conversation with id=' + tooShortId + ' (id too short)', function (done) {

            var c = {url: apihost + apiprefix + '/conversations/' + tooShortId};

            request.get(c, function (error, response, body) {

                if (error) throw error;
                else {
                    var result = JSON.parse(body);
                    response.statusCode.should.be.equal(422); //  BAD DATA
                }
                done();

            });

        });

    });

    describe('DELETE ' + apiprefix + '/conversations/:id', function () {

        it('must delete and return "204 ok" for conversation with id=' + testConversationId, function (done) {

            var c = {url: apihost + apiprefix + '/conversations/' + testConversationId};

            request.delete(c, function (error, response, body) {

                if (error) throw error;
                else {

                    response.statusCode.should.be.equal(204); //  HTTP ok no body
                }
                done();

            });

        });

    });

}); //end describe