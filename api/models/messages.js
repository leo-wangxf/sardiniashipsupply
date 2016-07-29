var mongoose = require('mongoose');

var Joigoose = require('joigoose')(mongoose);
var Joi = require('joi');

var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


var joiMessageSchema = Joi.object({
    senderId: Joi.string().required().meta({type: 'ObjectId', ref: 'User'}),
    dateIn:  Joi.date().default(Date.now, 'time of creation'),
    draft: Joi.boolean().default(false),
    text: Joi.string().required(),
    attachments: Joi.array().items(Joi.string())
});

var MessageSchema = new Schema(Joigoose.convert(joiMessageSchema));

MessageSchema.plugin(mongoosePaginate);


var Message = mongoose.model('Message', MessageSchema);


exports.MessageSchema = MessageSchema;
exports.Message = Message;


