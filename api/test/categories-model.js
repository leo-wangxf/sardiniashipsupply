var should = require('should');
var _ = require('underscore')._;
var async = require('async');
var db = require("../models/db");
var Category = require('../models/categories').Category;


describe('Category Model', function () {

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
            if (err) throw err;
            done();

        });

    });

    afterEach(function (done) {
        Category.remove(function (err, cat) {
            if (err) throw err;
            done();
        });
    });


    describe('paginate({page:2, limit:30})', function () {

        it('must include metadata with correct values', function (done) {

            Category.paginate({}, {page: 2, limit: 30}, function (err, results) {

                if (err) console.log(err);
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

        it('must not save with the unknown fields', function (done) {

            Category.create({
                unspsc: '834284032',
                name: 'dfadfsa',
                title: true
            }).catch(function (err) {

                err.name.should.be.equal('StrictModeError');
                err.message.should.be.equal('Field `title` is not in schema and strict mode is set to throw.');

                done();
            });

        });
    });

});