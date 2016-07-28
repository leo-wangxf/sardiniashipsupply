var mongoose = require('mongoose');

var Joigoose = require('joigoose')(mongoose);
var Joi = require('joi');

var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


var joiRequestSchema = Joi.object({
    // _id  implicit id
    productId: Joi.string().meta({type: 'ObjectId', ref: 'Product'}),
    status: Joi.string().allow(['pending', 'accepted', 'rejByC', 'rejByS']).default('pending'),
    quantityRequest:  Joi.number(),
    quantityOffer:  Joi.number(),
    quoteRequest:  Joi.number(),
    quoteOffer:  Joi.number()
});

var RequestSchema = new Schema(Joigoose.convert(joiRequestSchema));

RequestSchema.plugin(mongoosePaginate);


var Request = mongoose.model('Request', RequestSchema);


exports.RequestSchema = RequestSchema;
exports.Request = Request;