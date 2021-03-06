var mongoose = require('mongoose');
var Joigoose = require('joigoose')(mongoose);
var mongoosePaginate = require('mongoose-paginate');
var User = require('./users').User;
var Category = require('./categories').Category;

var Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);


var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


var joiProductSchema = Joi.object({
    // _id  implicit id
    name: Joi.string().required(),
    description: Joi.string().required(),
    supplierId: Joi.objectId().meta({type: 'ObjectId', ref: 'User'}),
    categories: Joi.array().items(Joi.objectId().meta({type: 'ObjectId', ref: 'Category'}).min(1).max(4)),  
    images:Joi.array().items({imageId:Joi.string().required()}),
    tags: Joi.array().items(Joi.string()),
    price:Joi.number().default(0),
    salesTaxIncluded:Joi.boolean().default(true),
    deliveryIn:Joi.number(),
    minNum:Joi.number().default(0).optional(),
    maxNum:Joi.number().default(0).optional(),
    unit: Joi.string().optional(),
    availability:Joi.number().default(0).optional(),
    language: Joi.string(),
    translation: Joi.array().items({language:Joi.string(), name:Joi.string().empty(''), description:Joi.string().empty('')}),
    rates: Joi.object()
});

var ProductSchema = new Schema(Joigoose.convert(joiProductSchema))

ProductSchema.plugin(mongoosePaginate);


var Product = mongoose.model('Product', ProductSchema);


exports.ProductSchema = ProductSchema;
exports.Product = Product;
