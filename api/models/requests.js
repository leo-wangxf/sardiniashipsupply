var mongoose = require('mongoose');

var Joigoose = require('joigoose')(mongoose);
var Joi = require('joi');

var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


var joiRequestSchema = Joi.object({
    // _id  implicit id
    product: Joi.string().meta({type: 'ObjectId', ref: 'Product', required:true}),
    status: Joi.string().valid(['pending', 'acceptedByS','acceptedByC', 'rejectedByC', 'rejectedByS']).default('pending'),
    quantity: {number: Joi.number().optional(), unity: Joi.string().valid(['--','unty', 'ltr', 'kg','g','mtr', 'fot','lbr'])},
    quote:  Joi.number().optional(),
    dateIn:Joi.date().default(Date.now, 'time of creation').required()
});

var RequestSchema = new Schema(Joigoose.convert(joiRequestSchema));

RequestSchema.plugin(mongoosePaginate);


var Request = mongoose.model('Request', RequestSchema);




exports.RequestSchema = RequestSchema;
exports.Request = Request;
