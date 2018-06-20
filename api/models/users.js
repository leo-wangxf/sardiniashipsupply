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
    phone: Joi.string(),
    phoneVerified: Joi.boolean().default(false).required(),
    phoneVerificationCode: Joi.string(),
    description: Joi.string(),
    web: Joi.string().uri(),
    email : Joi.string().email(),
    //////password : Joi.string().required(),
    id: Joi.string().required().meta({ type: 'ObjectId'}),
    status : Joi.string().min(1).max(1),
    //certification: Joi.array().items(Joi.string()),
    certifications: Joi.array().items({date: Joi.string(), name: Joi.string(), description: Joi.string()}),
    categories: Joi.array().items(Joi.object()),
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


var User = mongoose.model('User', UserSchema);






exports.UserSchema = UserSchema;
exports.User = User;
