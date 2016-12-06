var mongoose = require('mongoose');
var joigoose = require('joigoose')(mongoose);
var Joi = require('joi');
Joi.objetId = require('joi-objectid')(Joi);

var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
var joiServiceProfileSchema = Joi.object({
	supplierId:Joi.objectId().required().meta({type:'ObjectId', ref:'Supplier'}),
	evaluations:Joi.array().items(Joi.objectId().meta({type:'ObjectId', ref:'Evaluation'}),
}, {strict:"throw", versionKey:false});

var ServicecProfileSchema = new Schema(Joigoose.convert(joiServiceProfileSchema), {strict:"throw"});

ServiceProfileSchema.plugin(mongoosePaginate);

var ServiceProfile = mongoose.model('ServicecProfile', ServiceProfileSchema);

exports.ServiceProfileSchema = ServiceProfileSchema;
exports.ServicecProfile = ServiceProfile;

