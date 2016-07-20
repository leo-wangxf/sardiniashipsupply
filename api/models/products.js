var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var User = require('./users').User;
var Category = require('./category').Category;
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


var ProductSchema = new Schema({
    // _id  implicit id
    name: {type: String, required: true},
    description: {type: String},
    supplierId: {type: ObjectId, ref: 'User'},
    categories:[{type: ObjectId, ref: 'Category'}],
    images:[{type: String}]
}, {strict: "throw"});

ProductSchema.plugin(mongoosePaginate);


var Product = mongoose.model('Product', ProductSchema);


exports.ProductSchema = ProductSchema;
exports.Product = Product;