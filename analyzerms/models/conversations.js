var mongoose = require('mongoose');
var Joigoose = require('joigoose')(mongoose);
var Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
var _ = require('underscore')._;
//var db_S3 = require('./db').db_S3;
var db_S3 = require('./db').connections.S3;

var mongoosePaginate = require('mongoose-paginate');

var isValid = function(date){
  var now = new Date();
  now.setHours(0,0,0,0);
  return now.getTime() <= new Date(date).getTime();

}


var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


var joiConversationSchema = Joi.object({
    supplier: Joi.objectId().required().meta({type: 'ObjectId', ref: 'User'}),
    customer: Joi.objectId().required().meta({type: 'ObjectId', ref: 'User'}),
    dateIn: Joi.date().default(Date.now, 'time of creation').required(),
    dateValidity: Joi.date().required(),
    dateEnd: Joi.date(),
    subject: Joi.string(),
    completed: Joi.boolean().required().default(false),
    messages:Joi.array().items(Joi.objectId().meta({type: 'ObjectId', ref: 'Message'})),
    requests:Joi.array().items(Joi.objectId().meta({type: 'ObjectId', ref: 'Request'})),
    hidden:  Joi.boolean().default(false)
} , {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }});


var ConversationSchema = new Schema(Joigoose.convert(joiConversationSchema),{strict:"throw"});

ConversationSchema.plugin(mongoosePaginate);

/*ConversationSchema.virtual('expired').get(function () {
  //ConversationSchema.set ('expired', !isValid(this.dateValidity));
  return !isValid(this.dateValidity);
});*/

if (!ConversationSchema.options.toObject) ConversationSchema.options.toObject = {};
if (!ConversationSchema.options.toJSON) ConversationSchema.options.toJSON = {};
ConversationSchema.options.toJSON.transform = ConversationSchema.options.toObject.transform  = function (doc, con, options) {
  // remove the _id of every document before returning the result
  con.expired = !isValid(con.dateValidity);
  var r;
  con.completed = true;
  if(con.requests)
  {
    for(r=0; r<con.requests.length;r++){
      var s = con.requests[r].status;
      if(s=='pending'||s=='acceptedByS')
        con.completed = false;
    }

    return con;
  }
}


var Conversation = db_S3.model('Conversation', ConversationSchema);




Conversation.prototype.getMessagesByQuery = function (query) { //Maybe already in mongoose? NO, it's not.
    return _.filter(this.messages, query);
};

Conversation.prototype.getRequestsByQuery = function (query) { //Maybe already in mongoose? NO, it's not.

    return _.filter(this.requests, query);
};

exports.ConversationSchema = ConversationSchema;
exports.Conversation = Conversation;
