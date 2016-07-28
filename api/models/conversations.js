var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var User = require('./users').User;
var Message = require('./message').Message;
var Request = require('./requests').Request;
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


var ConversationSchema = new Schema({
    // _id  implicit id
    supplierId: {type: ObjectId, ref: 'User'},
    customerId: {type: ObjectId, ref: 'User'},
    dateIn:  {type: Date, required: true},
    dateValidity:  {type: Date, required: true},
    subject: String,
    completed: {type: Boolean, default: false},
    messages:[{type: ObjectId, ref: 'Message'}],
    requests:[{type: ObjectId, ref: 'Request'}],
    hidden:  {type: Boolean, default: false}
}, {strict: "throw", versionKey: false });

ConversationSchema.plugin(mongoosePaginate);


var Conversation = mongoose.model('Conversation', ConversationSchema);


exports.ConversationSchema = ConversationSchema;
exports.Conversation = Conversation;
