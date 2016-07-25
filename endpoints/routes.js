module.exports = function(app)
{    
  var bodyParser = require('body-parser')
  var jsonParser = bodyParser.json();

  var users = require('./controllers/users');
  var categories = require('./controllers/categories');
  var products = require('./controllers/products');
  //var certifications = require('./controllers/certifications');
  var attachments = require('./controllers/attachments');
  var favourites = require('./controllers/favourites');

  //var pages = require('./controllers/pages');
  //var tests = require('./controllers/tests');

  //======================================
  //============== users =================
  //======================================
  //app.post("/users/:id/actions/logout", jsonParser, users.logout);
  //app.post("/users/:id/actions/validate", jsonParser, users.validate);
  //app.post("/users/:id/actions/setStatus", jsonParser, users.setStatus);
  //app.post("/users/:id/actions/changePw", jsonParser, users.changePw);
  //app.post("/users/:id/actions/recoveryPw", jsonParser, users.changePw);

  app.get("/users/:page?", jsonParser, users.list);
  app.get("/users/:id/actions/categories", jsonParser, users.getCategories);
  app.get("/users/actions/search/:category", jsonParser, users.search);

  //======================================
  //============ categories ==============
  //======================================
  app.get("/categories/:category?", jsonParser, categories.list);

  //======================================
  //============= products ===============
  //======================================
  app.post("/products", jsonParser, products.add);

  app.put("/products/", jsonParser, products.modify);

  app.get("/products/:user", jsonParser, products.list);

  app.delete("/products/:product", jsonParser, products.remove);

  //======================================
  //=========== certifications ===========
  //======================================
  //app.post("/certifications", jsonParser, certifications.add);

  //app.get("/certifications/:user", jsonParser, certifications.list);

  //app.delete("/certifications/:certification", jsonParser, certifications.remove);


  //======================================
  //============= attachments ============
  //======================================
  app.post("/attachments", jsonParser, attachments.upload);

  app.delete("/attachments/:file", jsonParser, attachments.delete);

  app.get("/attachments/:user/actions/list", jsonParser, attachments.list);
  app.get("/attachments/:user/actions/download/:file", jsonParser, attachments.download);

  //======================================
  //============== favourites ============
  //======================================
  app.get("/favourites", jsonParser, favourites.list);

  app.post("/favourites", jsonParser, favourites.add);

  app.delete("/favourites/:supplier", jsonParser, favourites.remove);


  //======================================
  //================ tests ===============
  //======================================
  //app.get("/test/upload/", jsonParser, pages.upload);
  //app.get("/test/m/", jsonParser, tests.test);

  
}
