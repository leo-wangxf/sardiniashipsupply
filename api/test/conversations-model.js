var should = require('should');
var _ = require('underscore')._;
var async = require('async');
var db = require("../models/db");

var mongoose = require('mongoose');
var User = require('../models/users').User;
var Message = require('../models/messages').Message;
var Product = require('../models/products').Product;
var Request = require('../models/requests').Request;
var Category = require('../models/categories').Category;
var Conversation = require('../models/conversations').Conversation;

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var users = [];
var messages = [];
var requests = [];
var products = [];
var categories = [];
var conversations = [];


describe('Conversation Model', function () {

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
                    supplierId: users[_.random(0, 99)],
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

    });


    describe('paginate({page:2, limit:30})', function () {

        it('must include metadata with correct values', function (done) {

            Conversation.paginate({}, {page: 2, limit: 30}, function (err, results) {

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
    describe('Create with more fields than defined', function () {

        it('must not save with more than the fields required', function (done) {
            Conversation.create({
                supplierId: users[_.random(0, 99)],
                customerId: users[_.random(0, 99)],
                dateIn: Date.now(),
                dateValidity: Date.now(),
                dateEnd: Date.now(),
                subject: "Oggetto",
                messages: [messages[_.random(0, 99)], messages[_.random(0, 99)]],
                requests: [requests[_.random(0, 99)], requests[_.random(0, 99)]],
                vago: "dfsdf"
            }).catch(function (err) {

                should.exist(err); //  err;
                err.name.should.be.equal('StrictModeError');
                done();
            });


        });

    });
})
;
