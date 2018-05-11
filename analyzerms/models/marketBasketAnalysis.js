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

var joiMBASchema = Joi.object({
    lhs: Joi.array().items(Joi.string()).required(),
    rhs: Joi.array().items(Joi.string()).required(),
    confidence: Joi.number().required(),
    date: Joi.date().default(Date.now, 'time of creation').required(),
    valid: Joi.boolean().default(true).required()
});


var MBASchema = new Schema(Joigoose.convert(joiMBASchema), { collection: 'marketBasketAnalysis' });

var MBA = db_ms.model('marketBasketAnalysis', MBASchema);


exports.MarketBasketAnalysisSchema = MBASchema;
exports.MarketBasketAnalysis = MBA;
