var Mongoose   = require('mongoose');
var Schema     = Mongoose.Schema;

// The data schema for a search
var trendSchema = new Schema({
  // autocreated id field is implicit
  createdAt   : { type: Date,   required: false, default: Date.now },
  idCustomer    : { type: String, required: true, trim: true },
  category      : { type: Number, required: true, trim: true },
  keyword       : { type: String, trim: true },
  results       : { type: Number, required: true,trim: true  }
},{
    versionKey: false // You should be aware of the outcome after set to false
});

var trend = Mongoose.model('Trend', trendSchema);

module.exports = {
  Trend: trend
};
