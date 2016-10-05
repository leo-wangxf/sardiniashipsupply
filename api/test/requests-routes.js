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

var testmessage, testrequest, testrequest_abs, testrequest_abc= '';

var testconv = '';

var tooShortId = '008f4fdc09de51d364';
var notExistingId = '008f4fdc09dd8c1c3e51d364';
var fakeId = '008f4fdc09dd8c1c3e51d368';

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





describe('Request Model', function () {

    before(function (done) {
        this.timeout(4000);
        db.connect(function () {

            app.set('port', process.env.PORT || 3000);

            server = app.listen(app.get('port'), function () {

                apihost += ":" + server.address().port;

                request.post(options, function(error, response, body)
                {
                    if(error)
                        console.log(error);
                    else{
                        var r = {};
                        r.body = JSON.parse(body);
                        token = r.body.access_credentials.apiKey.token;
                        //console.log(token);
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


        var createUsers = function (callback) {
            async.each(range, function (e, cb) {
                user = new User({
                    id: fakeId,
                    name: "Guest " + e,
                    address: "Via dei matti 53",
                    password: "pw"

                });

                user.save(function (err, request) {
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
                    type: "customer",
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
var count = 0;
        var createRequests = function (callback) {
            async.each(range, function (e, cb) {

                var s = 'pending';
                switch(count){
                    case 0: s = 'acceptedByS'; break;
                    case 1: s = 'acceptedByC'; break;
                    default: s = 'pending';

                }

                var req = new Request({
                    productId: products[_.random(0, 99)],
                    status: s,
                    quantity: e * 100,
                    quote: e * 100,
                });


                switch(count){
                    case 0: testrequest_abs = req; break;
                    case 1: testrequest_abc = req; break;
                    default: testrequest = req; break;
                }


                req.save(function (err, req) {
                    if (err) throw err;
                    requests.push(req._id);
                    cb();

                });
            count ++;
            }, function (err) {
                //console.log(err);
                // console.log(requests);
              //  testrequest = requests[_.random(0, 99)];
               
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
                    requests: [testrequest._id,testrequest_abc._id,testrequest_abs._id,requests[_.random(0, 99)]],
                    hidden: false
                });

                conversation.save(function (err, conversation) {
                    if (err) throw err;

                    conversations.push(conversation._id);

                    cb();

                });


            }, function (err) {
                testconv = conversations[_.random(0, 99)];
            //    console.log(testconv);
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

    describe('GET '+ apiprefix + '/conversations/:id/requests', function () {

        it('must return 2 requests and pagination metadata, all fields', function (done) {

            var c = {url: apihost + apiprefix + '/conversations/'+ testconv+'/requests?page=1&limit=2',headers:headers};

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


    describe('POST ' + apiprefix + '/conversations/:id/requests', function () {

        it('must create one request in a conversation with given fields', function (done) {

            var data = {
                productId: products[_.random(0, 99)],
                status: 'pending',
                quantity: _.random(0, 99) * 100,
                quote: _.random(0, 99) * 100,
            };
            var c = {
                url: apihost + apiprefix +'/conversations/'+ testconv+'/requests',
                body: JSON.stringify(data),
                headers:headers
            };
       //     console.log(c);

            request.post(c, function (error, response, body) {
                //  console.log(response);

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(201);
                    var results = JSON.parse(body);
                    results.should.have.property('productId');
                    mongoose.Types.ObjectId(results.productId).id.should.be.equal(data.productId.id);
                    results.should.have.property('status');
                    results.status.should.be.equal(data.status);
                    results.should.have.property('quantity');
                    results.quantity.should.be.equal(data.quantity);
                    results.should.have.property('quote');
                    results.quote.should.be.equal(data.quote);

                }
                done();

            });

        });

    });


    describe('POST ' + apiprefix +'/conversations/:id/requests', function () {

        it('must get bad data error (empty request body)', function (done) {

            var c = {url: apihost + apiprefix +'/conversations/'+ testconv+'/requests', body: "",headers:headers};

            request.post(c, function (error, response, body) {

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(422); //  bad data
                }
                done();
            });
        });
    });

    describe('POST ' + apiprefix +'/conversations/:id/requests', function () {

        it('must get bad data error (missing data in body req)', function (done) {

            var c = {
                url: apihost + apiprefix +'/conversations/'+ testconv+'/requests',
                body: JSON.stringify({status:'pending'}),headers:headers
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



    describe('GET ' + apihost + apiprefix +'/conversations/:id/requests', function () {

        it('must return the requests for the conversation with id='+testconv, function (done) {

            var c = {url: apihost + apiprefix +'/conversations/'+ testconv+'/requests', headers:headers};

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
    describe('GET ' + apihost + apiprefix +'/requests/:id', function () {

        it('must return the request with id='+testrequest, function (done) {

            var c = {url: apihost + apiprefix + '/requests/' + testrequest._id, headers:headers};

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

    describe('GET ' + apiprefix + '/requests/:id', function () {

        it('must return "not found 404" for request with id=' + notExistingId, function (done) {

            var c = {url: apihost + apiprefix + '/requests/' + notExistingId, headers:headers};

            request.get(c, function (error, response, body) {

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(404); //  NOT FOUND
                }
                done();

            });

        });

    });

    describe('GET ' + apiprefix + '/requests/:id', function () {

        it('must return "bad data 422" for request with id=' + tooShortId + ' (id too short)', function (done) {

            var c = {url: apihost + apiprefix + '/requests/' + tooShortId, headers:headers};

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


    describe('DELETE ' + apihost + apiprefix +'/conversations/:id_c/requests/:id_r', function () {

        it('must delete the requests '+testrequest+' for the conversation with id='+testconv, function (done) {

            var c = {url: apihost + apiprefix +'/conversations/'+ testconv+'/requests/'+testrequest._id, headers:headers};

            request.delete(c, function (error, response, body) {

                if (error) throw error;
                else {
                    //  var result = JSON.parse(body);
                    response.statusCode.should.be.equal(204); //  HTTP ok
                }
                done();

            });

        });

    });



    describe('POST ' + apihost + apiprefix +'/conversations/:id_c/requests/:id_r/actions/suppaccept', function () {

        it('must change one request in a conversation with given fields', function (done) {

            var data = {
                quantity: _.random(0, 99) * 100,
                quote: _.random(0, 99) * 100,
            };
            var c = {url: apihost + apiprefix +'/conversations/'+ testconv+'/requests/'+testrequest._id+'/actions/suppaccept',
                body: JSON.stringify(data), headers:headers
            };
            //     console.log(c);

            request.post(c, function (error, response, body) {

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(200);

                     var results = JSON.parse(body);
                     results.should.have.property('status');
                     results.status.should.be.equal('acceptedByS');
                     results.should.have.property('quantity');
                     results.quantity.should.be.equal(data.quantity);
                     results.should.have.property('quote');
                     results.quote.should.be.equal(data.quote);

                }
                done();

            });

        });

    });


    describe('POST ' + apihost + apiprefix +'/conversations/:id_c/requests/:id_r/actions/custmodify', function () {

        it('must change one request in a conversation with given fields', function (done) {

            var data = {
                quantity: _.random(0, 99) * 100,
                quote: _.random(0, 99) * 100,
            };

            var c = {url: apihost + apiprefix +'/conversations/'+ testconv+'/requests/' + testrequest_abs._id+'/actions/custmodify',
                body: JSON.stringify(data),
                headers:headers
            };
            //     console.log(c);

            request.post(c, function (error, response, body) {

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(200);

                    var results = JSON.parse(body);
                    results.should.have.property('status');
                    results.status.should.be.equal('pending');
                    results.should.have.property('quantity');
                    results.quantity.should.be.equal(data.quantity);
                    results.should.have.property('quote');
                    results.quote.should.be.equal(data.quote);

                }
                done();

            });

        });

    });




    describe('POST ' + apihost + apiprefix +'/conversations/:id_c/requests/:id_r/actions/custaccept', function () {

        it('must change one request in a conversation with given fields', function (done) {

            var c = {url: apihost + apiprefix +'/conversations/'+ testconv+'/requests/' + testrequest_abs._id+'/actions/custaccept',
                //body: JSON.stringify(data),
               headers:headers
            };

            request.post(c, function (error, response, body) {

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(200);

                    var results = JSON.parse(body);
                    results.should.have.property('status');
                    results.status.should.be.equal('acceptedByC');

                }
                done();

            });

        });

    });


    describe('POST ' + apihost + apiprefix +'/conversations/:id_c/requests/:id_r/actions/custreject', function () {

        it('must change one request in a conversation with given fields', function (done) {

            var c = {url:  apihost + apiprefix +'/conversations/'+ testconv+ '/requests/' + testrequest_abs._id+'/actions/custreject',
           //     body: JSON.stringify(data),
                headers:headers
            };

            request.post(c, function (error, response, body) {

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(200);

                    var results = JSON.parse(body);
                    results.should.have.property('status');
                    results.status.should.be.equal('rejectedByC');

                }
                done();

            });

        });

    });


    describe('POST ' + apihost + apiprefix +'/conversations/:id_c/requests/:id_r/actions/suppreject', function () {

        it('must change one request in a conversation with given fields', function (done) {


            var c = {url: apihost + apiprefix +'/conversations/'+ testconv+'/requests/' + testrequest._id+'/actions/suppreject',
               // body: JSON.stringify(data),
                headers:headers
            };

            request.post(c, function (error, response, body) {

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(200);

                    var results = JSON.parse(body);
                    results.should.have.property('status');
                    results.status.should.be.equal('rejectedByS');

                }
                done();

            });

        });

    });


}); //end describe*!/


