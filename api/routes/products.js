var express = require('express');
var Product = require('../models/products').Product;
var User = require('../models/users').User;
//var util = require('util');
var _ = require('underscore')._;
var router = express.Router();
var au = require('audoku');
var mongoose = require('mongoose');
var tokenMiddleware = require('../util/middlewares').tokenMiddleware;

// INSERT PRODUCT

router.post('/products',[tokenMiddleware,
    au.doku({  // json documentation

        description: 'Insert a new product',
        title: 'Insert a new product',
        version: '1.0.0',
        name: 'products',
        group: 'Products',
        bodyFields: {
            name: {type: 'String', required: true, description: 'Name of product'},
            description: {type: 'String', required: true, description: 'Description of product'},
            //supplierId: {type: 'ObjectId', required: true, description: 'Owner of the product [supplier Id]'},
            categories: {type: 'Array', required: true, description: 'Product categories'},
            images: {type: 'Array', required: false, description: 'Product images'},
            tags: {type: 'Array', required: false, description: 'Product tags'}
        }
    })],
    function (req, res) {

        if (_.isEmpty(req.body))
            return res.boom.badData('Empty body'); // Error 422

        if(req.user.type != "supplier")
        {
          return res.boom.forbidden("Only supplier can use this function");          
        }

        req.body.supplierId = require("mongoose").Types.ObjectId(req.user.id);


        Product.create(req.body).then(function (entities) {

            if (_.isEmpty(entities))
                res.boom.badImplementation('Something strange'); // Error 500
            else
                return res.status(201).send(entities);  // HTTP 201 created

        }).catch(function (err) {
            if (err.name === 'ValidationError') {
                console.log(err);
                return res.boom.badData(err);
            }
            // Error 422
            else
                return res.boom.badImplementation(err);// Error 500
        });

    });


// GET ALL PRODUCT
/*
 router.get('/products',
 au.doku({  // json documentation
 title: 'Get all product',
 version: '1.0.0',
 name: 'GetAllProducts',
 group: 'Products',
 description: 'Get all the products defined in db',
 fields: {
 page: {
 description: 'The current page for pagination',
 type: 'integer', required: false
 },
 limit: {
 description: 'The current limit for pagination',
 type: 'integer', required: false
 }
 }
 }),
 function (req, res) {

 var query = _.extend({}, req.query);
 if (query.hasOwnProperty('page')) delete query.page;
 if (query.hasOwnProperty('limit')) delete query.limit;

 Product.paginate(query, {page: req.query.page, limit: req.query.limit}, function (err, entities) {
 if (err) return res.boom.badImplementation(err); // Error 500

 if (entities.total === 0)
 res.boom.notFound("No Products found for query " + JSON.stringify(query)); // Error 404
 else
 res.send(entities); // HTTP 200 ok

 });

 });
 */




// UPDATE

router.put('/products/:id',[tokenMiddleware,
    au.doku({  // json documentation
        title: 'Update a product by id',
        version: '1.0.0',
        name: 'UpdateProduct',
        group: 'Products',
        description: 'Update a product by id',
        params: {
            id: {type: 'String', required: true, description: 'The product identifier'}
        },
        bodyFields: {
            name: {type: 'String', required: true, description: 'Name of product'},
            description: {type: 'String', required: true, description: 'Description of product'},
            supplierId: {type: 'ObjectId', required: true, description: 'Owner of the product [supplier Id]'},
            categories: {type: 'Array', required: true, description: 'Product categories'},
            images: {type: 'Array', required: false, description: 'Product images'},
            tags: {type: 'Array', required: false, description: 'Product tags'}
        }
    })],
    function (req, res) {

        if (_.isEmpty(req.body))
            return res.boom.badData('Empty boby'); // Error 422

        var id = req.params.id;

        var newVals = req.body; // body already parsed

        var supId = require("mongoose").Types.ObjectId(req.user.id);


        //Product.findByIdAndUpdate(id, newVals).then(function (entities) {
        Product.findOneAndUpdate({_id: id, supplierId:  supId}, newVals).then(function (entities) {

            if (_.isEmpty(entities))
                res.boom.notFound('No entry with id ' + id); // Error 404
            else
                res.send(entities);  // HTTP 200 ok
        }).catch(function (err) {
            if (err.name === 'ValidationError')
                res.boom.badData(err.message); // Error 422
            else if (err.name === 'CastError')
                res.boom.badData('Id malformed'); // Error 422
            else
                res.boom.badImplementation(err);// Error 500
        });

    }
);


// DELETE
router.delete('/products/:id',[tokenMiddleware,
    au.doku({  // json documentation
        title: 'Delete a product by id',
        version: '1.0.0',
        name: 'DeleteProduct',
        group: 'Products',
        description: 'Deletea product by id',
        params: {
            id: {type: 'String', required: true, description: 'The product identifier'}
        }
    })],
    function (req, res) {

        var id = req.params.id;

        var supId = require("mongoose").Types.ObjectId(req.user.id);

        //Product.findByIdAndUpdate(id, newVals).then(function (entities) {
        Product.findOneAndRemove({_id: id, supplierId:  supId}).then(function (entities) {

            if (_.isEmpty(entities))
                res.boom.notFound('No entry with id ' + id); // Error 404
            else
                res.send(entities);  // HTTP 200 ok
        }).catch(function (err) {
            if (err.name === 'ValidationError')
                res.boom.badData(err.message); // Error 422
            else if (err.name === 'CastError')
                res.boom.badData('Id malformed'); // Error 422
            else
                res.boom.badImplementation(err);// Error 500
        });

    }
);



// SEARCH

router.get('/products',
    au.doku({  // json documentation
        title: 'Search products defined in db by name or only category',
        version: '1.0.0',
        name: 'SearchProduct',
        group: 'Products',
        description: 'Search products defined in db by name, category, supplierId and tags',
        fields: {
            name: {
                description: 'string contained in the name, description or tag of the product',
                type: 'string', required: false
            },
            id_category: {
                description: 'id of the category',
                type: 'string', required: false
            },
            cat_type: {
                description: 'type of the category',
                type: 'integer', required: false
            },
            supplierId: {
                description: 'id of the supplier',
                type: 'string', required: false
            },
            tags: {
                description: 'tags associated',
                type: 'string', required: false
            },
            type_search: {
                description: 'type of serch, define joins with other collections',
                type: 'string', required: false
            },
            lang: {
                description: 'language',
                type: 'string', required: false
            },
            tags: {
                description: 'tags associated',
                type: 'string', required: false
            },
            page: {
                description: 'The current page for pagination',
                type: 'integer', required: false
            },
            limit: {
                description: 'The current limit for pagination',
                type: 'integer', required: false
            }
        }
    }),
    function (req, res) {
        
        var query = _.extend({}, req.query);
        
        if (query.hasOwnProperty('page')) delete query.page;
        if (query.hasOwnProperty('limit')) delete query.limit;
        //query.name = new RegExp(req.query.name, "i");
        
        
        //* option definition
        var option = {
                populate: 'categories'
                , page: req.query.page
                , limit: req.query.limit
                };
        
        
        if (req.query.type_search)
        {
            option.populate = option.populate + ' supplierId'; 
        }
        
        
        var param = {};
        
        if (query.name)
        {
            
            switch (req.query.lang)
                {
                    case 'en':
                        query.lang = "english";
                    break;
                    case 'it':
                        query.lang = "italian";
                    break;
                    default:
                        query.lang = "italian"; 
                } 
             
            
            //query = {$text: {$search: query.name}};
            param = {$text: {$search: query.name, $language: query.lang}};
            score = {"score": {"$meta": "textScore"}};
            option['select'] = score;
            option['sort'] =  score;
        }
        else
            option['sort'] =  'name';
        
        
        //* param definition
        
        
        if (req.query.supplierId && mongoose.Types.ObjectId.isValid(req.query.supplierId))
        {
            param.supplierId = req.query.supplierId;
        }
        
        
        // categories
        if (query.id_category && mongoose.Types.ObjectId.isValid(query.id_category))
        {
            var arr_param =  [];
            arr_param.push(mongoose.Types.ObjectId(query.id_category));
            param.categories = {$in: arr_param};
            delete(query.id_category);
        }
        
        
        
        // tags
        if (req.query.tags)
        {
            var arr_tags =  [];
            
            if (Array.isArray(req.query.tags))
                arr_tags = req.query.tags;
            else
                arr_tags.push(req.query.tags);
            
            param.tags = {$in: arr_tags};
        }

        
        if (req.query.cat_type && Number(req.query.cat_type) && typeof param.categories == 'undefined')
        {
           var Category = require('../models/categories').Category;

            Category.find({"type": req.query.cat_type}, '_id').lean().then(function (result) {
                param.categories = {'$in': result}; 
                
                
                return Product.paginate(
                    param,
                    option)
                .then(function(result){
                 //console.log(JSON.stringify(param));
                    res.send(result);
                 }).catch(function (err) {
                    console.log(err);    
                    if (err) return res.boom.badImplementation(err); // Error 500
                        else return res.boom.badImplementation(); // Error 500
            });

            }).catch(function (err) {
                if (err) return res.boom.badImplementation(err); // Error 500
                else return res.boom.badImplementation(); // Error 500
            });
            
            
        }
        else
        {
            return Product.paginate(
                param,
                option)
            .then(function(result){
             //console.log(JSON.stringify(result));
                res.send(result);
             }).catch(function (err) {
                console.log(err);    
                if (err) return res.boom.badImplementation(err); // Error 500
                    else return res.boom.badImplementation(); // Error 500
        });
        }

        
        
        
        
        
  
  /*
        Product.paginate(
                param,
                option)
        .then(function (entities) {
            if (entities.total === 0)
                return res.boom.notFound('No Products found for query ' + JSON.stringify(query)); // Error 404
            else
                return res.send(entities); // HTTP 200 ok
        }).catch(function (err) {
            if (err) return res.boom.badImplementation(err); // Error 500
            else return res.boom.badImplementation(); // Error 500
        });
     */   
    });
    
    

/*
router.get('/search',
    au.doku({  // json documentation
        title: 'Search products defined in db by name or only category',
        version: '1.0.0',
        name: 'SearchProduct',
        group: 'Products',
        description: 'Search products defined in db by name, category, supplierId and tags',
        fields: {
            name: {
                description: 'name of the product',
                type: 'string', required: false
            },
            category: {
                description: 'id of the category',
                type: 'string', required: false
            },
            supplierId: {
                description: 'id of the supplier',
                type: 'string', required: false
            },
            tags: {
                description: 'tags associated',
                type: 'string', required: false
            },
            page: {
                description: 'The current page for pagination',
                type: 'integer', required: false
            },
            limit: {
                description: 'The current limit for pagination',
                type: 'integer', required: false
            }
        }
    }),
    function (req, res) {

        var query = _.extend({}, req.query);
        if (query.hasOwnProperty('page')) delete query.page;
        if (query.hasOwnProperty('limit')) delete query.limit;

        query.name = new RegExp(req.query.name, "i");



        Product.find().then(function (products) {

            var suppliersIds = _.map(products, function (el) {

                return el._doc.supplierId+'';
            });

            suppliersIds = _.unique(suppliersIds);



            if (_.isEmpty(suppliersIds))
                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'No Requests found for query ' + JSON.stringify(query),
                    errorCode: 404
                });
            else {
                return User.paginate(
                    {
                        _id: {$in: suppliersIds}
                    },
                    {
                        page: req.query.page,
                        limit: req.query.limit
                    });
            }

        }).then(function (entities) {

            if (entities.total === 0)
                return res.boom.notFound('No items found for query ' + JSON.stringify(query)); // Error 404
            else
                return res.send(entities); // HTTP 200 ok
        }).catch(function (err) {

            if (err.errorCode) return res.status(err.errorCode).send(err); // Error 500
            else return res.boom.badImplementation(); // Error 500
        });

    });
*/



router.get('/products/supplier',
    au.doku({  // json documentation
        title: 'Search suppliers from products defined in db by string contained in name, description or tags, category',
        version: '1.0.0',
        name: 'SearchProduct',
        group: 'Products',
        description: 'Search products defined in db by name, category, supplierId and tags',
        fields: {
            name: {
                description: 'string  contained in title, description, tags of the product (words in the string are in OR clause)',
                type: 'string', required: false
            },
            id_category: {
                description: 'id of the category (search into array)',
                type: 'string', required: false
            },
            cat_type: {
                description: 'type of the category',
                type: 'integer', required: false
            },
            
            supplierId: {
                description: 'id of the supplier',
                type: 'string', required: false
            },
            tags: {
                description: 'tags associated (search into array)',
                type: 'string', required: false
            },
            page: {
                description: 'The current page for pagination',
                type: 'integer', required: false
            },
            limit: {
                description: 'The current limit for pagination',
                type: 'integer', required: false
            }
        }
    }),
    function (req, res) {

    

    var query = _.extend({}, req.query);
    if (query.hasOwnProperty('page')) delete query.page;
    if (query.hasOwnProperty('limit')) delete query.limit;

    /*
    if (query.name)
        query.name = new RegExp(req.query.name, "i");
    */



    
var param = {};

// name
if (query.name)
    param = {$text: {$search: query.name}};
    
// categories
if (query.id_category && mongoose.Types.ObjectId.isValid(query.id_category))
{
    var arr_param =  [];
    arr_param.push(mongoose.Types.ObjectId(query.id_category));
    param.categories = {$in: arr_param};
}


// tags
if (query.tags)
{
    var arr_tags =  [];
    console.log(query.tags);
    arr_tags.push(query.tags);
    param.tags = {$in: query.tags};
}


if (req.query.cat_type && Number(req.query.cat_type) && typeof param.categories == 'undefined')
        {
            console.log('--------------------------------------------');
            
            var Category = require('../models/categories').Category;

            Category.find({"type": req.query.cat_type}, '_id').lean().then(function (result) {
                //param.categories = {'$in': result};
                
                let cat  = [];
                
                result.forEach(element => {
                    cat.push(element._id);
                }); 

                param.categories = {'$in': cat};

                    
                Product.aggregate(                                                                      
                    {$match: param},
                    { $group : {_id: {supplierId: "$supplierId"}
                    , count : { $sum : 1 } 
                    // , max : {$max: { $meta: "textScore" }}
                    } } 
                                    
                ).then(function (result){
                    var suppliersIds = _.map(result, function (el) {
                            return el._id.supplierId+'';
                            });
   
    
                                return User.paginate(
                                            {
                                                _id: {$in: suppliersIds}
                                            },
                                            {
                                                page: req.query.page,
                                                limit: req.query.limit,
                                                sort:{
                                                    'rates.overall_rate': -1,        
                                                    name: 1
                                                            
                                                    }
                                            });
                            }).then(function(result){
                                res.send(result);
                                    }).catch(function (err) {
                                                if (err) return res.boom.badImplementation(err); // Error 500
                                                else return res.boom.badImplementation(); // Error 500
                                    });




                

            }).catch(function (err) {
                if (err) return res.boom.badImplementation(err); // Error 500
                else return res.boom.badImplementation(); // Error 500
            });
             
}

else
{


Product.aggregate(                                                                      
                    {$match: param},
                    { $group : {_id: {supplierId: "$supplierId"}
                    , count : { $sum : 1 } 
                    // , max : {$max: { $meta: "textScore" }}
                    } } 
                                    
                )
.then(function (result){
    
   var suppliersIds = _.map(result, function (el) {
        return el._id.supplierId+'';
        });
   
    
    return User.paginate(
                {
                    _id: {$in: suppliersIds}
                },
                {
                    page: req.query.page,
                    limit: req.query.limit,
                    sort:{
                        'rates.overall_rate': -1,        
                        name: 1
                                 
                         }
                });
}).then(function(result){
      res.send(result);
        }).catch(function (err) {
                    if (err) return res.boom.badImplementation(err); // Error 500
                    else return res.boom.badImplementation(); // Error 500
        });
    }        


});




// GET PRODUCT

router.get('/products/:id',
    au.doku({  // json documentation
        title: 'Get a product by id',
        version: '1.0.0',
        name: 'GetProduct',
        group: 'Products',
        description: 'Get a product by id',
        params: {
            id: {type: 'String', required: true, description: 'The product identifier'}
        }

    }), function (req, res) {
        var id = req.params.id.toString();

        var newVals = req.body; // body already parsed

        Product.findById(id, newVals).then(function (entities) {

            if (_.isEmpty(entities))
                res.boom.notFound('No entry with id ' + id); // Error 404
            else
                res.send(entities);  // HTTP 200 ok
        }).catch(function (err) {
            if (err.name === 'CastError')
                res.boom.badData('Id malformed'); // Error 422
            else
                res.boom.badImplementation(err);// Error 500
        });
    }
);









module.exports = router;




