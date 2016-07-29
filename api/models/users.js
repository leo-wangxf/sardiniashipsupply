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
    address : Joi.string().required(),
    type : Joi.string(),
    logo : Joi.string().uri(),
    type : Joi.string(),
    phone: Joi.number(),
    description: Joi.string(),
    web: Joi.string().uri(),
    email : Joi.string().email(),
    password : Joi.string().required(),
    status : Joi.string().min(1).max(1),
    favoriteSupplier : Joi.array().items(Joi.string()),
    pIva : Joi.string()
    //certification : Joi.object().keys({})
});


var UserSchema = new Schema(Joigoose.convert(joiUserSchema));
UserSchema.plugin(mongoosePaginate);

var User = mongoose.model('User', UserSchema);






exports.UserSchema = UserSchema;
exports.User = User;