var mongoose = require('mongoose');
var Joigoose = require('joigoose')(mongoose);
var Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
var _ = require('underscore')._;
//var db_S3 = require('./db').db_S3;
var db_ms = require('./db').connections.ms;

var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var joiLDASchema = Joi.object({
    supplier: Joi.objectId().required(),
    pros_topics: Joi.array(),
    cons_topics: Joi.array(),
    date: Joi.date().default(Date.now, 'time of creation').required(),
    valid: Joi.boolean().default(true).required()
});


var LDASchema = new Schema(Joigoose.convert(joiLDASchema), { collection: 'lda' });

var LDA = db_ms.model('lda', LDASchema);


exports.LDASchema = LDASchema;
exports.LDA = LDA;
