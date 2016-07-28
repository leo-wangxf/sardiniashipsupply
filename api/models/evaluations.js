var mongoose = require('mongoose');
var Joigoose = require('joigoose')(mongoose);
var Joi = require('joi');

var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
var joiEvaluationSchema = Joi.object({
    // _id  implicit id
    from: {type:ObjectId, ref: 'User', required:true},
    to: {type:ObjectId, ref:'User', required:true},
    conversationId:{type:ObjectId, ref:'Conversation', required: true},
    overall_rate:{type:Number, min:0, max:5, default:0},//zero means not evaluated
    delivery_rate:{type:Number, min:0, max:5, default:0},
    product_rate:{type:Number, min:0,max:5,default:0},
    overall_review:{type:String},
    conversation_end_time:{type: Date},
    evaluation_time:{type: Date, default: Date.now}
}, {strict: "throw", versionKey: false });


var EvaluationSchema = new Schema(Joigoose.convert(joiEvaluationSchema));

EvaluationSchema.plugin(mongoosePaginate);


var Evaluation = mongoose.model('Evaluation', EvaluationSchema);


exports.EvaluationSchema = EvaluationSchema;
exports.Evaluation = Evaluation;


EvaluationSchema.plugin(mongoosePaginate);


var Evaluation = mongoose.model('Evaluation', EvaluationSchema);


exports.EvaluationSchema = EvaluationSchema;
exports.Evaluation = Evaluation;


EvaluationSchema.plugin(mongoosePaginate);


var Evaluation = mongoose.model('Evaluation', EvaluationSchema);


exports.EvaluationSchema = EvaluationSchema;
exports.Evaluation = Evaluation;
