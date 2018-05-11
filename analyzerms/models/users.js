var mongoose = require('mongoose');
var bluebird = require('bluebird');
var Joigoose = require('joigoose')(mongoose);
var Joi = require('joi');

//mongoose.Promise = bluebird;

var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var joiUserSchema = Joi.object({
    name : Joi.string().required(),
    address : Joi.string(),
    type : Joi.string(),
    logo : Joi.string(),
    phone: Joi.number(),
    description: Joi.string(),
    web: Joi.string().uri(),
    email : Joi.string().email(),
    //////password : Joi.string().required(),
    id: Joi.string().required().meta({ type: 'ObjectId'}),
    status : Joi.string().min(1).max(1),
    //certification: Joi.array().items(Joi.string()),
    certifications: Joi.array().items(Joi.object()),
    categories: Joi.array().items(Joi.string()),
    attachments: Joi.object(),
    favoriteSupplier : Joi.array().items(Joi.string()),
    language: Joi.string(),
    references: Joi.object().keys({name: Joi.string(), surname: Joi.string()}),
    pIva: Joi.string(),
    rates: Joi.object()
    //certification : Joi.object().keys({})
});


var UserSchema = new Schema(Joigoose.convert(joiUserSchema));
UserSchema.plugin(mongoosePaginate);
var User = require('./db').connections.S3.model('User',UserSchema);






exports.UserSchema = UserSchema;
exports.User = User;
