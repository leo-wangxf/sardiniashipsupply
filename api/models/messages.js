var mongoose = require('mongoose');

var Joigoose = require('joigoose')(mongoose);
var Joi = require('joi');

var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


var joiMessageSchema = Joi.object({
    sender: Joi.string().required().meta({type: 'ObjectId', ref: 'User'}),
    msgId: Joi.string().required().meta({type: 'ObjectId'}),
    type:Joi.string().required().allow(['customer', 'supplier']).required(),
    dateIn:  Joi.date().default(Date.now, 'time of creation').required(),
    draft: Joi.boolean().default(false).required(),
    //text: Joi.string().required(),
    automatic: Joi.boolean().default(false).required(),
    attachments: Joi.array().items(Joi.string()),
    link:{url: Joi.string().optional(), info: Joi.string().valid(['accepted','pending', 'rejected']).optional()},
});

var MessageSchema = new Schema(Joigoose.convert(joiMessageSchema));

MessageSchema.plugin(mongoosePaginate);


var Message = mongoose.model('Message', MessageSchema);


exports.MessageSchema = MessageSchema;
exports.Message = Message;


