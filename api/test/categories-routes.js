var should = require('should');
var mongoose = require('mongoose');
var _ = require('underscore')._;
var async = require('async');
var db = require("../models/db");
var Category = require('../models/categories').Category;
var app = require('../app');
var request = require('request');

var apihost = 'http://localhost';

var apiprefix = app.get('apiprefix');

var testCategoryId = '';
var tooShortId = '008f4fdc09de51d364';
var notExistingId = '008f4fdc09dd8c1c3e51d364';

describe('Categories API', function () {

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

        async.each(range, function (e, cb) {
            var cat = new Category({
                unspsc: "23" + e,
                name: "test" + e
            });

            cat.save(function (err, cat) {
                if (err) throw err;
                cb();

            });

        }, function (err) {

            Category.findOne({}, function (err, cat) {
                if (err) throw err;
                testCategoryId = cat._id;
                done();
            });

        });

    });

    afterEach(function (done) {
        Category.remove(function (err, cat) {
            if (err) throw err;
            done();
        });
    });

    describe('GET ' + apiprefix + '/categories', function () {

        it('must return 2 categories and pagination metadata, all fields', function (done) {

            var c = {url: apihost + apiprefix + '/categories?page=1&limit=2'};

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
                    results.total.should.be.equal(100);

                }

                done();

            });

        });

    });

    describe('POST ' + apiprefix + '/categories', function () {

        it('must create one categorie with given fields', function (done) {

            var data = {unspsc: "99999", name: "test_category", description: "test description"};
            var c = {
                url: apihost + apiprefix + '/categories',
                body: JSON.stringify(data),
                headers: {'content-type': 'application/json'}
            };

            request.post(c, function (error, response, body) {
                //  console.log(response);

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(201);
                    var results = JSON.parse(body);
                    results.should.have.property('unspsc');
                    results.unspsc.should.be.equal(data.unspsc);
                    results.should.have.property('name');
                    results.name.should.be.equal(data.name);
                    results.should.have.property('description');
                    results.description.should.be.equal(data.description);
                    results.should.have.property('_id');

                }
                done();

            });

        });

    });


    describe('POST ' + apiprefix + '/categories', function () {

        it('must get bad data error (empty request body)', function (done) {

            var c = {url: apihost + apiprefix + '/categories', body: "", headers: {'content-type': 'application/json'}};

            request.post(c, function (error, response, body) {

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(422); //  bad data
                }
                done();
            });
        });
    });

    describe('POST ' + apiprefix + '/categories', function () {

        it('must get bad data error (missing data in body req)', function (done) {

            var c = {
                url: apihost + apiprefix + '/categories',
                body: JSON.stringify({unspsc: "99999"}),
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


    describe('PUT ' + apiprefix + '/categories/:id', function () {

        it('must update the category with given id', function (done) {
            Category.findOne({}, function (err, cat) {
                if (err) throw err;

                const tstCategoryId = cat._id;



                var c = {
                    url: apihost + apiprefix + '/categories/' + tstCategoryId,
                    body: JSON.stringify({unspsc: "99999"}),
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

    describe('PUT ' + apiprefix + '/categories/:id', function () {

        it('must get error updating the category with id=' + testCategoryId + " (empty body)", function (done) {

            var c = {
                url: apihost + apiprefix + '/categories/' + testCategoryId,
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
    describe('PATCH ' + apiprefix + '/categories/:id', function () {

        it('must update the category with id=' + testCategoryId, function (done) {

            var c = {
                url: apihost + apiprefix + '/categories/' + testCategoryId,
                body: JSON.stringify({unspsc: "99999"}),
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

    describe('PATCH ' + apiprefix + '/categories/:id', function () {

        it('must return "not found 404" for category with id=' + notExistingId, function (done) {

            var c = {
                url: apihost + apiprefix + '/categories/' + notExistingId,
                body: JSON.stringify({unspsc: "99999"}),
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

    describe('PATCH ' + apiprefix + '/categories/:id', function () {

        it('must return "bad data 422" for category with id=' + tooShortId, function (done) {

            var c = {
                url: apihost + apiprefix + '/categories/' + tooShortId,
                body: JSON.stringify({unspsc: "99999"}),
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

    describe('PATCH ' + apiprefix + '/categories/:id', function () {

        it('must update the category with id=' + testCategoryId, function (done) {

            var c = {
                url: apihost + apiprefix + '/categories/' + testCategoryId,
                body: JSON.stringify({unspsc: "99999"}),
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


    describe('GET ' + apiprefix + '/categories/:id', function () {

        it('must return the category with id=' + testCategoryId, function (done) {

            var c = {url: apihost + apiprefix + '/categories/' + testCategoryId};

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

    describe('GET ' + apiprefix + '/categories/:id', function () {

        it('must return "not found 404" for category with id=' + notExistingId, function (done) {

            var c = {url: apihost + apiprefix + '/categories/' + notExistingId};

            request.get(c, function (error, response, body) {

                if (error) throw error;
                else {
                    response.statusCode.should.be.equal(404); //  NOT FOUND
                }
                done();

            });

        });

    });

    describe('GET ' + apiprefix + '/categories/:id', function () {

        it('must return "bad data 422" for category with id=' + tooShortId + ' (id too short)', function (done) {

            var c = {url: apihost + apiprefix + '/categories/' + tooShortId};

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

    describe('DELETE ' + apiprefix + '/categories/:id', function () {

        it('must delete and return "204 ok" for category with id=' + testCategoryId, function (done) {

            var c = {url: apihost + apiprefix + '/categories/' + testCategoryId};

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