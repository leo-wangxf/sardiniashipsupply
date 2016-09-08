var mongoose = require('mongoose');
var Joigoose = require('joigoose')(mongoose);
var Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
var _ = require('underscore')._;

var mongoosePaginate = require('mongoose-paginate');




var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


var joiConversationSchema = Joi.object({
    supplierId: Joi.objectId().required().meta({type: 'ObjectId', ref: 'User'}),
    customerId: Joi.objectId().required().meta({type: 'ObjectId', ref: 'User'}),
    dateIn: Joi.date().default(Date.now, 'time of creation').required(),
    dateValidity: Joi.date().required(),
    dateEnd: Joi.date(),
    subject: Joi.string(),
    completed: Joi.boolean().required().default(false),
    messages:Joi.array().items(Joi.objectId().meta({type: 'ObjectId', ref: 'Message'})),
    requests:Joi.array().items(Joi.objectId().meta({type: 'ObjectId', ref: 'Request'})),
    hidden:  Joi.boolean().default(false)
} );


var ConversationSchema = new Schema(Joigoose.convert(joiConversationSchema),{strict:"throw"});

ConversationSchema.plugin(mongoosePaginate);


var Conversation = mongoose.model('Conversation', ConversationSchema);


Conversation.prototype.getMessagesByQuery = function (query) { //Maybe already in mongoose? NO, it's not.
    return _.filter(this.messages, query);
};

Conversation.prototype.getRequestsByQuery = function (query) { //Maybe already in mongoose? NO, it's not.

    return _.filter(this.requests, query);
};

exports.ConversationSchema = ConversationSchema;
exports.Conversation = Conversation;