var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


var UserSchema = new Schema({
    // _id  implicit id
    name:  {type: String, required: true}
    //description: String
}, {strict: "throw"});

UserSchema.plugin(mongoosePaginate);


var User = mongoose.model('User', UserSchema);


exports.UserSchema = UserSchema;
exports.User = User;