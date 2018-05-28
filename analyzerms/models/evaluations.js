var mongoose = require('mongoose');
var Joigoose = require('joigoose')(mongoose);
var Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
var joiEvaluationSchema = Joi.object({
    // _id  implicit id
    from:Joi.objectId().required().meta({type: 'ObjectId', ref: 'User'}),
    to:Joi.objectId().required().meta({type: 'ObjectId', ref: 'User'}),
    conversationId:Joi.objectId().required().meta({type: 'ObjectId', ref: 'Conversation'}),
    overall_rate:Joi.number().required().default(0).min(0).max(5),
    delivery_rate:Joi.number().default(0).min(0).max(5),
    product_rate:Joi.number().default(0).min(0).max(5),
    customer_service_rate:Joi.number().default(0).min(0).max(5),
    price_value_rate:Joi.number().default(0).min(0).max(5),
    pros_review:Joi.string().allow(''),
    cons_review:Joi.string().allow(''),
    conversation_end_time:Joi.date(),
    evaluation_time:Joi.date().default(Date.now, 'time of evaluation'),
}, {strict: "throw", versionKey: false });


var EvaluationSchema = new Schema(Joigoose.convert(joiEvaluationSchema), {strict:"throw"});

EvaluationSchema.plugin(mongoosePaginate);


var Evaluation = require('./db').connections.S3.model('Evaluation', EvaluationSchema);


exports.EvaluationSchema = EvaluationSchema;
exports.Evaluation = Evaluation;
