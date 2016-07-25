var mongoose = require('mongoose');
var Joigoose = require('joigoose')(mongoose);
var Joi = require('joi');

var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


var joiCategorySchema = Joi.object({
    unspsc : Joi.string().required().meta({index: true}),
    name : Joi.string().required(),
    description : Joi.string()
});


var CategorySchema = new Schema(Joigoose.convert(joiCategorySchema));


CategorySchema.plugin(mongoosePaginate);


var Category = mongoose.model('Category', CategorySchema);


exports.CategorySchema = CategorySchema;
exports.Category = Category;