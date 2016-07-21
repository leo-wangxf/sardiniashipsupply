var mongoose = require("mongoose");
var bluebird = require("bluebird");

var uri = 'mongodb://localhost:3996/cancellami';
//var options = {promiseLibrary: bluebird };

mongoose.Promise = bluebird;
mongoose.connect(uri);

var UserSchema = mongoose.Schema({
  name: String,
  addres: String,
  type: Number,
  logo: String,
  phone: String,
  description: String,
  web: String,
  email: String, 
  password: String,
  status: Number,
  favoriteSupplier : [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
  pIva: Number,
  certification: [Schema.Types.Mixed]
});
var User = mongoose.model("User", UserSchema);

var ProductSchema = mongoose.Schema({
  name: String,
  description: String,
  categories: [Number],
  supplierId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  images: [String]
});

ProductSchema.index({name: "text", description: "text"});
var Product = mongoose.model("Product", ProductSchema);
  
var CategorySchema = mongoose.Schema({
  unspsc: Number,
  name: String,
  description: String
});
var Category = mongoose.model("Category", CategorySchema);

var ConversationSchema = mongoose.Schema({
  supplierId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  customerId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  dateIn: Date,
  dateValidity: Date,
  subject: String,
  completed: Boolean,
  messages: {type: mongoose.Schema.Types.ObjectId, ref: "Message"},
  requests: {type: mongoose.Schema.Types.ObjectId, ref: "Request"},
  hidden: Boolean 
});
var Conversation = mongoose.model("Conversation", ConversationSchema);

var MessageSchema = mongoose.Schema({
  senderId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  dateIn: Date,
  draft: Boolean,
  text: String,
  attachments: [String]
});
var Message = mongoose.model("Message", MessageSchema);

var RequestSchema = mongoose.Schema({
  productId: Number,
  status: Number, 
  quantityRequest: Number,
  quantityOffer: Number,
  quoteRequest: Number,
  quoteOffer: Number,
});
var Request = mongoose.model("Request", RequestSchema);

var RatingSchema = mongoose.Schema({
  conversation: {type: mongoose.Schema.Types.ObjectId, ref: "Conversation"},
  reipientId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  rating: mongoose.Schema.Types.Mixed,
  comment: String
});
var Rating = mongoose.model("Rating", RatingSchema);

exports.ObjectId = mongoose.Types.ObjectId;


exports.user = User;

exports.product = Product;

exports.category = Category;

exports.conversation = Conversation;

exports.message = Message;

exports.request = Request;

exports.rating = Rating;


//var connection = mongoose.createConnection(uri);
var connection = mongoose.connection;

exports.connection = function()
{
  return connection;  
}

exports.schema =  function(opt)
{
  return new mongoose.Schema(opt);
}

exports.model = function(name, schema)
{
  return mongoose.model(name, schema);
}

/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
function loadCategories()
{
  var postgres = require("./db_old.js");

  var con;
  postgres.connect().then(function(connection)
  {
    con = connection;
    return con.client.query("SELECT * from x_category");
  }).then(function(result)
  {
    for(var i in result.rows)
    {
      var c = result.rows[i];
      var cat = new Category({
        unspsc: c.id_category,
        name: c.category               
      });

      cat.save().then(function(doc){
      }).catch(function(e){console.log(e);});      
    }
    console.log("fine");
    con.done();
  });
}


function loadUsers()
{
  var postgres = require("./db_old.js");

  var con;
  postgres.connect().then(function(connection)
  {
    con = connection;
    return con.client.query("SELECT * from dat_user, dat_user_profile WHERE dat_user.id_user = dat_user_profile.id_user");
  }).then(function(result)
  {
    for(var i in result.rows)
    {
      var u = result.rows[i];
      var user  = new User({
        name: u.user_name,
        address: u.address,
        type: u.fk_type,
        email: u.email,
        password: u.password	                       
      });

      user.save().then(function(doc){
      }).catch(function(e){console.log(e);});      
    }
    console.log("fine");
    con.done();
  });
}


//loadCategories();
//loadUsers();
