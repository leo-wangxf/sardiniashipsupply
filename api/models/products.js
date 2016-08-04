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
    description: Joi.string(),
    supplierId: Joi.objectId().meta({type: 'ObjectId', ref: 'User'}),
    categories:[Joi.objectId().meta({type: 'ObjectId', ref: 'Category'})],
    images:[Joi.string()]
});

var ProductSchema = new Schema(Joigoose.convert(joiProductSchema));

ProductSchema.plugin(mongoosePaginate);


var Product = mongoose.model('Product', ProductSchema);


exports.ProductSchema = ProductSchema;
exports.Product = Product;
