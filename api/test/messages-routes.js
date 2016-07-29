var should = require('should');
var mongoose = require('mongoose');
var _ = require('underscore')._;
var async = require('async');
var db = require("../models/db");
var User = require('../models/users').User;
var Message = require('../models/messages').Message;
var Product = require('../models/products').Product;
var Request = require('../models/requests').Request;
var Category = require('../models/categories').Category;
var Conversation = require('../models/conversations').Conversation;
var app = require('../app');
var request = require('request');

var apihost = 'http://localhost';

var apiprefix = app.get('apiprefix');

var testmessage = '';
var testconv = '';

var tooShortId = '008f4fdc09de51d364';
var notExistingId = '008f4fdc09dd8c1c3e51d364';

var users = [];
var messages = [];
var requests = [];
var products = [];
var categories = [];
var conversations = [];


describe('Message Model', function () {

    before(function (done) {
        this.timeout(4000);
        db.connect(function () {

            app.set('port', process.env.PORT || 3000);

            server = app.listen(app.get('port'), function () {

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
                    name: "Guest " + e,
                    address: "Via dei matti 53",
                    password: "pw"

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
                testmessage = messages[_.random(0, 99)];
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
                product.save(function (err, product) {
                    // console.log(err);
                    if (err) throw err;
                    products.push(product._id);
                    cb();

                });

            }, function (err) {
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
                    supplierId: users[_.random(0, 99)],
                    customerId: users[_.random(0, 99)],
                    dateIn: Date.now(),
                    dateValidity: Date.now(),
                    dateEnd: Date.now(),
                    subject: "Subject " + e + " ",
                    completed: true,
                    messages: [messages[_.random(0, 99)],messages[_.random(0, 99)],messages[_.random(0, 99)],messages[_.random(0, 99)]],
                    requests: [requests[_.random(0, 99)],requests[_.random(0, 99)],requests[_.random(0, 99)],requests[_.random(0, 99)]],
                    hidden: false
                });

                conversation.save(function (err, conversation) {
                    if (err) throw err;

                    conversations.push(conversation._id);

                    cb();

                });


            }, function (err) {
                testconv = conversations[_.random(0, 99)];
                console.log(testconv);
                done();
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
//done();
    });

    describe('GET '+ apiprefix + '/conversations/:id/messages', function () {

        it('must return 2 messages and pagination metadata, all fields', function (done) {

            var c = {url: apihost + apiprefix + '/conversations/'+ testconv+'/messages?page=1&limit=2'};

            request.get(c, function (error, response, body) {

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(200);
                    var results = JSON.parse(body);
                    results.should.have.property('total');
                    results.should.have.property('docs');
                    results.docs.length.should.be.equal(2);
                    results.page.should.be.equal(1);
                    results.limit.should.be.equal(2);
                    results.total.should.be.equal(4);

                }

                done();

            });

        });

    });


    describe('POST ' + apiprefix + '/conversations/:id/messages', function () {

        it('must create one message in a conversation with given fields', function (done) {

            var data = {
                senderId: users[_.random(0, 99)],
                dateIn: Date.now(),
                draft: false,
                text: "Message for quote CA",
                attachments: ["http//:url"]
            };
            var c = {
                url: apihost + apiprefix +'/conversations/'+ testconv+'/messages',
                body: JSON.stringify(data),
                headers: {'content-type': 'application/json'}
            };
            console.log(c);

            request.post(c, function (error, response, body) {
                //  console.log(response);

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(201);
                    var results = JSON.parse(body);
                    results.should.have.property('senderId');
                    mongoose.Types.ObjectId(results.senderId).id.should.be.equal(data.senderId.id);
                    results.should.have.property('dateIn');
                    new Date(results.dateIn).toString().should.be.equal(new Date(data.dateIn).toString());
                    results.should.have.property('draft');
                    results.draft.should.be.equal(data.draft);
                    results.should.have.property('text');
                    results.text.should.be.equal(data.text);
                    results.should.have.property('attachments');
                    results.attachments.length.should.be.equal(data.attachments.length);
                    results.should.have.property('_id');

                }
                done();

            });

        });

    });


    describe('POST ' + apiprefix +'/conversations/:id/messages', function () {

        it('must get bad data error (empty request body)', function (done) {

            var c = {url: apihost + apiprefix +'/conversations/'+ testconv+'/messages', body: "", headers: {'content-type': 'application/json'}};

            request.post(c, function (error, response, body) {

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(422); //  bad data
                }
                done();
            });
        });
    });

    describe('POST ' + apiprefix +'/conversations/:id/messages', function () {

        it('must get bad data error (missing data in body req)', function (done) {

            var c = {
                url: apihost + apiprefix +'/conversations/'+ testconv+'/messages',
                body: JSON.stringify({draft:true}),
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


    describe('PUT ' + apiprefix + '/messages/:id', function () {

        it('must update the message with given id', function (done) {
            Message.findOne({}, function (err, msg) {
                if (err) throw err;

                const tstMessageId = msg._id;


                var c = {
                    url: apihost + apiprefix + '/messages/' + tstMessageId,
                    body: JSON.stringify({draft:true}),
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

    describe('PUT ' + apiprefix + '/messages/:id', function () {

        it('must get error updating the message with id=' + testmessage + " (empty body)", function (done) {

            var c = {
                url: apihost + apiprefix + '/messages/' + testmessage,
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
    describe('PATCH ' + apiprefix + '/messages/:id', function () {

        it('must update the message with id=' + testmessage, function (done) {

            var c = {
                url: apihost + apiprefix + '/messages/' + testmessage,
                body: JSON.stringify({draft:true}),
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

    describe('PATCH ' + apiprefix + '/messages/:id', function () {

        it('must return "not found 404" for message with id=' + notExistingId, function (done) {

            var c = {
                url: apihost + apiprefix + '/messages/' + notExistingId,
                body: JSON.stringify({draft:true}),
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

    describe('PATCH ' + apiprefix + '/messages/:id', function () {

        it('must return "bad data 422" for message with id=' + tooShortId, function (done) {

            var c = {
                url: apihost + apiprefix + '/messages/' + tooShortId,
                body: JSON.stringify({draft:true}),
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

    describe('PATCH ' + apiprefix + '/messages/:id', function () {

        it('must update the message with id=' + testmessage, function (done) {

            var c = {
                url: apihost + apiprefix + '/messages/' + testmessage,
                body: JSON.stringify({draft:true}),
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


    describe('GET ' + apihost + apiprefix +'/conversations/:id/messages', function () {

        it('must return the messages for the conversation with id='+testconv, function (done) {

            var c = {url: apihost + apiprefix +'/conversations/'+ testconv+'/messages'};

            request.get(c, function (error, response, body) {

                if (error) throw error;
                else {
                  //  var result = JSON.parse(body);
                    response.statusCode.should.be.equal(200); //  HTTP ok
                }
                done();

            });

        });

    });
    describe('GET ' + apihost + apiprefix +'/messages:id', function () {

        it('must return the message with id='+testmessage, function (done) {

            var c = {url: apihost + apiprefix + '/messages/' + testmessage};

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

    describe('GET ' + apiprefix + '/messages/:id', function () {

        it('must return "not found 404" for message with id=' + notExistingId, function (done) {

            var c = {url: apihost + apiprefix + '/messages/' + notExistingId};

            request.get(c, function (error, response, body) {

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(404); //  NOT FOUND
                }
                done();

            });

        });

    });

    describe('GET ' + apiprefix + '/messages/:id', function () {

        it('must return "bad data 422" for message with id=' + tooShortId + ' (id too short)', function (done) {

            var c = {url: apihost + apiprefix + '/messages/' + tooShortId};

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

    describe('DELETE ' + apiprefix + '/messages/:id', function () {

        it('must delete and return "204 ok" for message with id=' + testmessage, function (done) {

            var c = {url: apihost + apiprefix + '/messages/' + testmessage};

            request.delete(c, function (error, response, body) {

                if (error) throw error;
                else {

                    response.statusCode.should.be.equal(204); //  HTTP ok no body
                }
                done();

            });

        });

    });

}); //end describe*!/

