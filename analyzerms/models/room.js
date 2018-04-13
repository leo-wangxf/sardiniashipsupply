var mongoose = require('mongoose');

var Joigoose = require('joigoose')(mongoose);
var Joi = require('joi');

var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var joiRoomSchema = Joi.object({
    name: Joi.string(),
    members: Joi.array().items(Joi.string()),
});

var RoomSchema = new Schema(Joigoose.convert(joiRoomSchema));

var Room = mongoose.model('Room', RoomSchema);


exports.RoomSchema = RoomSchema;
exports.Room = Room;


