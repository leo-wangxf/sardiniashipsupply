var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


var RequestSchema = new Schema({
    // _id  implicit id
    productId: {type: ObjectId, ref: 'Product'},
    status:  {type: String, enum: ['pending', 'accepted', 'rejByC', 'rejByS'], default: 'pending'},
    quantityRequest: Number,
    quantityOffer: Number,
    quoteRequest: Number,
    quoteOffer: Number
}, {strict: "throw"});

RequestSchema.plugin(mongoosePaginate);


var Request = mongoose.model('Request', RequestSchema);


exports.RequestSchema = RequestSchema;
exports.Request = Request;