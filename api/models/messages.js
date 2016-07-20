var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


var MessageSchema = new Schema({
    // _id  implicit id
    senderId: {type: ObjectId, ref: 'User'},
    dateIn:  {type: Date, required: true},
    draft: {type: Boolean, default: false},
    text:String,
    attachments: {type: String}
}, {strict: "throw", versionKey: false });

MessageSchema.plugin(mongoosePaginate);


var Message = mongoose.model('Message', MessageSchema);


exports.MessageSchema = MessageSchema;
exports.Message = Message;