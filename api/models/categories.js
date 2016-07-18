var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


var CategorySchema = new Schema({
    // _id  implicit id
    unspsc: {type: String, index: true, required: true},
    name:  {type: String, required: true},
    description: String
}, {strict: "throw"});

CategorySchema.plugin(mongoosePaginate);


var Category = mongoose.model('Category', CategorySchema);


exports.CategorySchema = CategorySchema;
exports.Category = Category;