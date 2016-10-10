var should = require('should');
var mongoose = require('mongoose');
var _ = require('underscore')._;
var async = require('async');
var db = require("../models/db");
var Conversation = require('../models/conversations').Conversation;
var app = require('../app');
var request = require('request');
var Promise = require('bluebird');

var apihost = 'http://localhost';

var apiprefix = app.get('apiprefix');

var testConversationId, testConversationOpId = '';
var testSupplierId = '';
var testCustomerId = '';
var tooShortId = '008f4fdc09de51d364';
var notExistingId = '008f4fdc09dd8c1c3e51d364';
var fakeId = '008f4fdc09dd8c1c3e51d368';

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

var token = "";

var msToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJtb2RlIjoibXMiLCJpc3MiOiJub3QgdXNlZCBmbyBtcyIsImVtYWlsIjoibm90IHVzZWQgZm8gbXMiLCJ0eXBlIjoiYXV0aG1zIiwiZW5hYmxlZCI6dHJ1ZSwiZXhwIjoxNzg1NTc1MjQ3NTY4fQ.Du2bFjd0jB--geRhnNtbiHxcjQHr5AyzIFmTr3NFDcM";

var username ="davide85@gmail.com";
var password ="password";
var userUrl = "http://seidue.crs4.it:3008/users/signin";

var headers = {'content-type': 'application/json',Authorization : "Bearer "+ msToken};

var options =
{
    url: userUrl,
    body:JSON.stringify( {
    "username" : username,
        "password" : password
    }),
    headers: headers
};





describe('Conversations API', function () {

    before(function (done) {

        this.timeout(4000);
        db.connect(function () {

            app.set('port', process.env.PORT || 3000);

            server = app.listen(app.get('port'), function () {

                apihost += ":" + server.address().port;

                // request.post({url : userUrl, body :
                //
                // )
                request.post(options, function(error, response, body)
                {
                    if(error)
                        console.log(error);
                    else{
                        var r = {};
                        r.body = JSON.parse(body);
                        token = r.body.access_credentials.apiKey.token;
                        console.log(token);
                        r.response = response;
                    }
                    done();

                });

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
        }
        var token = function() {
            return '008f4fdc09dd8c1c3e'+getRandom(10,99)+'d36'; // to make it longer
        };
        var t = token() +''+ getRandom(0,9);
        var createUsers = function (callback) {


            async.each(range, function (e, cb) {

                user = new User({
                 //   _id: t,
                    id: t,
                    name: "Guest " + e,
                    address : "Via dei matti 53",
                    password:"pw"
                });
                t = token() +''+ getRandom(0,9);
                user.save(function (err, us) {
                    if (err) throw err;
                    users.push(us._id);
                    cb();

                });

            }, function (err) {
                callback(null);
            });

        };


        var createMessages = function (callback) {
            async.each(range, function (e, cb) {
                message = new Message({
                    sender: users[_.random(0, 99)],
                    type:"customer",
                    dateIn: Date.now(),
                    draft: false,
                    text: "AA123 " + e + " CA",
                    attachments: ["http//:url"]
                });


                message.save(function (err, message) {
                    if (err) throw err;
                    messages.push(message._id);
                    cb();

                });

            }, function (err) {
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


                cat.save(function (err, cat) {
                    if (err) throw err;
                    categories.push(cat._id);
                    cb();

                });

            }, function (err) {
                callback(null);
            });


        }

        var createProducts = function (callback) {
            async.each(range, function (e, cb) {
                product = new Product({
                    name: "Name product " + e,
                    description: "Description product " + e,
                    supplier: users[_.random(0, 99)],
                    categories: [categories[_.random(0, 99)]],
                    images: ["http://ret"]
                });
                product.save(function (err, product) {
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
                    product: products[_.random(0, 99)],
                    status: 'pending',
                    quantity: e * 100,
                    quote: e * 100,
                    dateIn:new Date()
                });

                request.save(function (err, request) {
                    if (err) throw err;
                    requests.push(request._id);
                    cb();

                });

            }, function (err) {
                callback(null);
            });


        }

        var createConversations = function () {

            var conversationOpen = new Conversation({
                supplier: users[0],
                customer: users[1],
                dateIn: Date.now(),
                dateValidity: Date.now(),
                dateEnd: Date.now(),
                subject: "Subject ",
                completed: false,
                messages: [messages[_.random(0, 99)]],
                requests: [requests[_.random(0, 99)]],
                hidden: false
            });
            conversationOpen.save(function (err, conversation) {
                if (err) throw err;
                conversations.push(conversationOpen._id);

            });
            testConversationOpId = conversationOpen._id;
            async.each(range, function (e, cb) {
                conversation = new Conversation({
                    supplier: users[0],
                    customer: users[1],
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
                    if (err) throw err;
                    conversations.push(conversation._id);
                    cb();

                });


            }, function (err) {
                Conversation.findOne({}, function (err, cat) {
                    if (err) throw err;
                    console.log(cat.supplier);
                    testConversationId = cat._id;
                    testSupplierId = cat.supplier;
                    testCustomerId = cat.customer;
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

    describe('GET ' + apiprefix + '/conversations?page=1&limit=2', function () {

        it('must return 2 conversations and pagination metadata, all fields', function (done) {

            var c = {url: apihost + apiprefix + '/conversations?page=1&limit=2', headers:headers};

            request.get(c, function (error, response, body) {
             //   console.log(response)
                    if (error) throw error;
                    else {
                        response.statusCode.should.be.equal(200);
                        var results = JSON.parse(body);
                        results.should.have.property('total');
                        results.should.have.property('docs');
                        results.docs.length.should.be.equal(2);
                        results.page.should.be.equal(1);
                        results.limit.should.be.equal(2);
                        results.total.should.be.equal(101);
                    }

                    done();

            });

        });

    });

    describe('GET ' + apiprefix + '/conversations', function () {

        it('must return  conversations and pagination metadata with date_in= '+new Date().toDateString()+' and user id= '+ testSupplierId +', all fields', function (done) {
            var date = (new Date());
            var c = {url: apihost + apiprefix + '/conversations?date_in='+date.toDateString()+
            '&by_uid='+testSupplierId,headers:headers};
            
            request.get(c, function (error, response, body) {

                    if (error) throw error;
                    else {

                        response.statusCode.should.be.equal(200);
                        var results = JSON.parse(body);
                        results.should.have.property('total');
                        results.should.have.property('docs');
                        results.docs[0].should.have.property('supplier');
                        console.log(results.docs[0]);
                        mongoose.Types.ObjectId(results.docs[0].supplier._id).id.should.be.equal(testSupplierId.id);
                        results.docs[0].should.have.property('dateIn');
                        new Date(results.docs[0].dateIn).toDateString().should.be.equal(new Date(date).toDateString());
                        /* results.should.have.property('supplierId');
                        results.should.have.property('supplierId');
                       /* results.docs.length.should.be.equal(10);
                        results.page.should.be.equal(1);
                        results.limit.should.be.equal(10);
                        results.total.should.be.equal(100);*/
                    }

                    done();

            });

        });

    });

    describe('POST ' + apiprefix + '/conversations', function () {

        it('must create one conversation with given fields', function (done) {
          //  console.log(apihost);
            var data = {
                supplier: users[_.random(0, 99)],
                customer: users[_.random(0, 99)],
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
                headers: {'content-type': 'application/json', Authorization : "Bearer "+ token}
            };

            request.post(c, function (error, response, body) {

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(201);
                    var results = JSON.parse(body);
                     results.should.have.property('supplier');
                    mongoose.Types.ObjectId(results.supplier).id.should.be.equal(data.supplier.id);
                     results.should.have.property('customer');
                    mongoose.Types.ObjectId(results.customer).id.should.be.equal(data.customer.id);
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
                headers: {'content-type': 'application/json',Authorization : "Bearer "+ token}
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
                body: JSON.stringify({supplier: users[_.random(0, 99)]}),
                headers: {'content-type': 'application/json',Authorization : "Bearer "+ token}
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

    describe('POST ' + apiprefix + '/conversations/:id/actions/close', function () {

        it('must set a conversation with a completed status', function (done) {

            var c = {
                url: apihost + apiprefix + '/conversations/'+testConversationOpId+'/actions/close',
                body: '',
                headers: {'content-type': 'application/json',Authorization : "Bearer "+ token}
            };
            request.post(c, function (error, response, body) {
                if (error) throw error;
                else {
                    var results = JSON.parse(body);
                    //results.statusCode.should.be.equal(200); // ok data
                    results.should.have.property('completed');
                    results.completed.should.be.equal(true);
                }
                done();

            });

        });

    });


    describe('GET ' + apiprefix + '/conversations/:id', function () {

        it('must return the conversation with id=' + testConversationId, function (done) {

            var c = {url: apihost + apiprefix + '/conversations/' + testConversationId, headers: {'content-type': 'application/json',Authorization : "Bearer "+ token}};

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

            var c = {url: apihost + apiprefix + '/conversations/' + notExistingId, headers: headers};

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

            var c = {url: apihost + apiprefix + '/conversations/' + tooShortId, headers: headers};

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

        it('must delete and return "204 ok" for conversation ', function (done) {

            var c = {url: apihost + apiprefix + '/conversations/' + testConversationId, headers: headers};

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
