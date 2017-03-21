var mongoose = require('mongoose');
var Joigoose = require('joigoose')(mongoose);
var Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


var joiCategorySchema = Joi.object({
    level : Joi.number().required(),
    name : Joi.object().required(),
    description : Joi.object().required(),
    unspsc : Joi.object(),
    aida : Joi.object(),
    parent: Joi.objectId(),
    css: Joi.object()
});

var CategorySchema = new Schema(Joigoose.convert(joiCategorySchema),{'strict':'throw'});


CategorySchema.plugin(mongoosePaginate);


var Category = mongoose.model('Category', CategorySchema);


exports.CategorySchema = CategorySchema;
exports.Category = Category;
