var Mongoose   = require('mongoose');
var Schema     = Mongoose.Schema;

// The data schema for a trend
var trendSchema = new Schema({
  // autocreated id field is implicit
  createdAt   : { type: Date,   required: false, default: Date.now }, // when the record is created
  idCustomer    : { type: String, required: true, trim: true },       // the id of the customer that did the search
  category      : { type: Number, required: true, trim: true },       // the id of the category where search was performed
  keyword       : { type: String, trim: true },                       // the keyword/phrase used for the search
  results       : { type: Number, required: true,trim: true  }        // number or results given by the search
},{
    versionKey: false // You should be aware of the outcome after set to false
});

var trend = Mongoose.model('Trend', trendSchema);

module.exports = {
  Trend: trend
};
