var should = require('should');
var mongoose = require('mongoose');
var _ = require('underscore')._;
var async = require('async');
var db = require("../models/db");
var Category = require('../models/categories').Category;
var app = require('../app');
var request = require('request');

var apihost = "http://localhost";

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

            done();

        });

    });

    afterEach(function (done) {
        Category.remove(function (err, cat) {
            if (err) throw err;
            done();
        });
    });

    describe('GET /api/categories', function () {

        it('must return 2 categories and pagination metadata, all fields', function (done) {

            var c = {url: apihost + '/api/categories?page=1&limit=2'};

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


});