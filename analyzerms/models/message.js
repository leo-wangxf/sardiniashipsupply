var mongoose = require('mongoose');

var Joigoose = require('joigoose')(mongoose);
var Joi = require('joi');

var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var joiMessageSchema = Joi.object({
    room: Joi.string().required(),
    text: Joi.string().required(),
    aux: Joi.object(),
    date: Joi.date().default(Date.now, 'time of creation').required(),
    sender: Joi.string().required().meta({type: 'ObjectId', ref: 'User'}),
});

var MessageSchema = new Schema(Joigoose.convert(joiMessageSchema));

MessageSchema.plugin(mongoosePaginate);


var Message = mongoose.model('Message', MessageSchema);


exports.MessageSchema = MessageSchema;
exports.Message = Message;


