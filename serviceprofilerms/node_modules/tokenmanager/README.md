# tokenmanager
This module deals with the management of JWT tokens used for the protection of own API.
It enables encoding and decoding of the token itself and the definition of rules that allow
to determine if a token type is enabled or not to access a given resource.


This package and in particular mode  **checkAuthorization** middleware can be used in two modes:

1.  In a distributed architecture calling an external service that manages
    tokens(for example in a microservice architecture)
2.  In a monolithic application managing tokens Locally

If used locally you must manage tokens and authorizations with encode, decode, addRole, upgradeRole
and downgradeRole functions.


 * [Installation](#installation)
 * [Using tokenmanager](#using)
    * [function configure(config)](#configure)
    * [checkAuthorization middleware](#middleware)
    * [manage token](#manage)
        * [function encodeToken(dictionaryToEncode,tokenTypeClass,validFor)](#encode)
        * [function decodeToken(token)](#decode)
        * [URI and token roles](#role)
            * [function addRole(roles)](#addRole)
            * [function upgradeRoles()](#upgradeRoles)
            * [function downgradeRoles()](#downgradeRoles)
            * [function getRoles()](#getRoles)
            * [function resetRoles()](#resetRoles)
            * [function testAuth()](#testAuth)
 * [Examples](#examples)
    * [Used Locally in a monolithic application](#locally)
    * [Used in a microservice architecture](#microservices)


## <a name="installation"></a>Installation
To use **tokenmanager** install it in your Express project by typing:

`npm install tokenmanager`


## <a name="using"></a>Using tokenmanager

### Include tokenmanager

Just require it like a simple package:

```javascript
var tokenManager = require('tokenmanager');
```

### Using tokenmanager

tokenmanager provides a function "configure" for setting customizable tokenmanager params and
a "checkAuthorization" middleware function to manage token request.

Here the function and middleware documentation:

### <a name="configure"></a>`function configure(config)`
This function must be used to define and customize "tokenmanager" package params.

Like this:

```javascript
var router = require('express').Router();
var tokenManager = require('tokenmanager');
tokenManager.configure( {
 "decodedTokenFieldName":"UserToken",
 "authorizationMicroserviceUrl":"http://localhost:3000",
 "authorizationMicroserviceToken":"4343243v3kjh3k4g3j4hk3g43hjk4g3jh41h34g3",
 "exampleUrl":"http://miosito.it",
 "tokenFieldName":"access_token",
 "secret":"secretKey"
});

```
#### configure parameters
The configure argument should be a JSON dictionary containing any of the keys in this example:

```javascript
{
 "decodedTokenFieldName":"UserToken",
 "url":"localhost:3000",
 "authorizationMicroserviceToken":"4343243v3kjh3k4g3j4hk3g43hjk4g3jh41h34g3",
 "exampleUrl":"http://MyDomain.com",
 "tokenFieldName":"access_token",
 "secret":"secretKey"
}
```

##### decodedTokenFieldName (String)
This is the name of the field containing the decoded token that the middleware adds to the request req.
The middleware encodes and verifies the client token and, if valid and authorized, in the request(req) it is added
a field called decodedTokenFieldName, containing the decode result.


##### tokenFieldName (String)
This is the name of the field containing the request token that the middleware must read and encode.
By default the middleware expect that the name is "access_token"


##### secret (String)
If the middleware is used locally( not use an external service that manages tokens) this is the name of the
secret key used to encode/decode token in **encode** and **decode** function


##### url (String)
if the **checkAuthorization** middleware is used to call an external service that manages tokens(for example in
a microservice architecture). It contains the url of this external service.
For example: ```http://example.com:3000/checkIfTokenIsAuth ```

##### authorizationMicroserviceToken (String)
if the middleware is used to call an external service that manages tokens(for example in a microservice architecture)
it contains the token to access this external service

##### exampleUrl (dictionary)
String containing the domain of your application used in middleware response message.


### <a name="middleware"></a>`middleware checkAuthorization`
This middleware must be used to decode, validate, e verify token authorization.
It read the request access_token field sent by header or body or query params, encodes and verifies the client token
and, if valid and authorized, in the request(req) it is added a field (name set in config function "decodedTokenFieldName"),
containing the decode result. If token is not valid or authorized to access the resource the middleware send a response
401 Unauthorized.
If this middleware is not used locally but call an external service that manage tokens, external service must be have
an endpoint in "post" method that accept three body params as this:

  body params: {decode_token: token, URI: URI, method: req.method}

where:
* decode_token: string containing access token used to call the resource in URI with method in field "method"
* URI: String containing the calling resource
* method: String containing the calling method used to access the resource in URI



middleware checkAuthorization example:

```javascript
var router = require('express').Router();
var tokenManager = require('tokenmanager');
tokenManager.configure( {
    "decodedTokenFieldName":"UserToken",
    "authorizationMicroserviceUrl":"localhost:3000",
    "access_token":"4343243v3kjh3k4g3j4hk3g43hjk4g3jh41h34g3jhk4g",
    "exampleUrl":"http://miosito.it"
});

router.get('/resource', tokenManager.checkAuthorization, function(req,res){

    // if you are in here the token is valid and authorized

    console.log("Decoded TOKEN:" + req.UserToken); // print the decode results

});

```


### <a name="manage"></a>`Manage token and resource(Uri) roles`
As described above, the **checkAuthorization** middleware can be used in two modes, so if used locally you need to
manage tokens(encode/decode) and set API endpoints roles. You Can make this with this suite of functions:

*  [function encodeToken(dictionaryToEncode,tokenTypeClass,validFor)](#encode)
*  [function decodeToken(token)](#decode)
*  [function addRole(roles)](#addRole)
*  [function upgradeRoles()](#upgradeRoles)
*  [function downgradeRoles()](#downgradeRoles)
*  [function getRoles()](#getRoles)
*  [function resetRoles()](#resetRoles)
*  [function testAuth()](#testAuth)



#### <a name="encode"></a>`function encodeToken(dictionaryToEncode,tokenTypeClass,validFor)`
This function encodes in a token a given a dictionary *dictionaryToEncode* containing the information to encode.
It accepts 3 parameters:
* **dictionaryToEncode** : Object containing the dictionary to encode inside token. for example:
```javascript
    {
      "userId":"80248",
      "Other" : "........."
    }
```
* **tokenTypeClass** : String containing the encoding token type, for example "admin" for user admin.
* **validFor** : Object containing information about token life information. It has 2 keys called unit and value.
                 Unit is the key of what time you want to add from current time for token life, and value the amount
                 of unit you want to add. The unit possible values are:

| Unit Value    | Shorthand |
| :--------:    | :--------:|
| years         | y         |
| quarters      | Q         |
| months        | M         |
| weeks         | w         |
| days          | d         |
| hours         | h         |
| minutes       | m         |
| seconds       | s         |
| milliseconds  | ms        |


for example :

```javascript
  // this set token life to 7 days
  {
    unit:"days",
    value:7
  }
```

You can use this function to generate your token, like in this example:

```javascript
var router = require('express').Router();
var tokenManager = require('tokenmanager');
tokenManager.configure( {
                         "decodedTokenFieldName":"UserToken",
                         "secret":"MyKey",
                         "exampleUrl":"http://miosito.it"
});

// dictionary to encode inside token
var toTokenize={
        "userId":"80248",
        "Other" : "........."
};

// now create a *TokenTypeOne* that expire within 1 hous.
var mytoken=tokenManager.encodeToken(toTokenize,"TokenTypeOne",{unit:"hours",value:1});



console.log(mytoken); // it prints a token as a string like :
                      //32423JKH43534KJ5H435K3L6H56J6K7657H6J6K576N76JK57
```


#### <a name="decode"></a>`function decodeToken(token)`
This function decode the given token and return the information bundled inside it. The token parameter is a token
generated with encodeToken(....) function

You can use this function if need to unpack the information contained in the token, like in this example:

```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 tokenManager.configure( {
          "decodedTokenFieldName":"UserToken",
          "secret":"MyKey",
          "exampleUrl":"http://miosito.it"
 });

 // dictionary to encode inside token
    var toTokenize={
            "userId":"80248",
            "Other" : "........."
    };

 // now create a *TokenTypeOne* that expire within 1 hous.
 var mytoken=tokenManager.encodeTokentoTokenize,"TokenTypeOne",{unit:"hours",value:1});

 console.log(mytoken); // it prints a token as a string like this:
                       //32423JKH43534KJ5H435K3L6H56J6K7657H6J6K576N76JK57

 // if you need information in the token then you can decode it.
 var decodedToken=tokenManager.decodeToken(mytoken);

 console.log(decodedToken); // it prints the unpack token information:
                            // "userId":"80248", "Other" : "........."

```

#### <a name="role"></a>`URI and token roles`
Set of function to set roles and authorizations

#### <a name="addRole"></a>`function addRole(roles)`
This function must be used to set authorization between tokens and endpoints and add new roles. Roles are
used by  *checkAuthorization* middleware to verify token authorization for particular resources.

The roles param is an array where each element is an object containing a single role.
Single role object is defined as bellow:

```javascript

// *************************************************************************
// defining a role where only  "admin, tokenTypeOne, TokenTypeTwo"
// tokens type are authorized to access the resource
// "/resource" called with method "GET"
// *************************************************************************
    {
        "URI":"/resource",
        "method":"GET",
        "authToken":[admin, tokenTypeOne, TokenTypeTwo],
    }

```

where:
 * URI : A string containing the path of the resource on witch set the role
 * method : A string containing the method on which the role is set.
 * authToken : An array of Strings containing the list of token types authorized to pass the role.


Param roles contain an array of single role defined as above, for example:
```javascript

// *************************************************************************
//  defining a roles where:
//   1. only  "admin, tokenTypeOne, TokenTypeTwo" tokens type are authorized
//      to access the resource "/resource" called with method "GET"
//   2. only  "admin" tokens type are authorized to access the resource
//      "/resource" called with method "POST"
// *************************************************************************
var roles= [
        {
            "URI":"/resource",
            "method":"GET",
            "authToken":["admin","tokenTypeOne","TokenTypeTwo"]
        },
        {
            "URI":"/resource",
            "method":"POST",
            "authToken":["admin"]
        }
];

```


Next an example of function addRole(roles) usage

```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 tokenManager.configure( {
      "decodedTokenFieldName":"UserToken",
      "secret":"MyKey",
      "exampleUrl":"http://miosito.it"
 });


 var roles= [
     {
        "URI":"/resource",
        "method":"GET",
        "authToken":["admin", "tokenTypeOne", "TokenTypeTwo"]
     },
     {
        "URI":"/resource",
        "method":"POST",
        "authToken":["admin"]
     }
 ];
 tokenManager.addRole(roles);


 // dictionary to encode inside token
 var toTokenize={
   "userId":"80248",
    "Other" : "........."
 };

 // now create a token of type  *TokenTypeOne* that expire within 1 hous.
 var mytoken=tokenManager.encodeToken(toTokenize,"TokenTypeOne",{unit:"hours",value:1});




//create authenticated endpoints using checkAuthorization middleware
router.get("/resource",tokenManager.checkAuthorization,function(req,res,next){

// *************************************************************************
// this is an authenticated endpoint, accessible only by
// "admin, tokenTypeOne, TokenTypeTwo" tokens as described by the role
// {"URI":"/resource", "method":"GET","authToken":[admin,tokenTypeOne,TokenTypeTwo]}
// *************************************************************************


 });

 router.post("/resource",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // this is an API authenticated accessible only with "admin" tokens as described
    // by the role
    // {"URI":"/resource","method":"GET","authToken":[admin,tokenTypeOne,TokenTypeTwo]}
    // *********************************************************************************

  });



 router.delete("/resource",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // This point is unreachable due tokenManager.checkAuthorization respond with
    // Unauthorized 401 due no role set for DELETE "/resource"
    // *********************************************************************************
 });


// Unauthenticated endpoint
 router.put("/resource",function(req,res,next){

    // *********************************************************************************
    // this is an endpoint not authenticated so is reachable with or without token.
    // Through no role is set for PUT "/resource", an Unauthorized 401 response is
    // not sent due checkAuthorization middleware is not used, so it is an
    // unauthenticated endpoint
    // *********************************************************************************

 });

```

Attention that in addRole(roles) each role defined in "roles" **override** and not **append**. To upgrade role you must
use **upgradeRole(roles)** function while to downgrade role use **downgradeRole(roles)**.  To override roles  then use
**addRole(roles)** function



#### <a name="upgradeRoles"></a>`function upgradeRole(roles)`
This function must be used to update authorization roles between tokens and endpoints.

The roles param is an array where each element is an object containing a single role.
Single role object is defined as bellow:

```javascript

 // *********************************************************************************
 //  updating a role where only  "tokenTypeOne, TokenTypeTwo" tokens type are
 //  authorized to access the resource  "/resource" called with method "GET"
 // *********************************************************************************
   {
     "URI":"/resource",
     "method":"GET",
     "authToken":[tokenTypeOne, TokenTypeTwo],
   }

```

where:
 * URI : A string containing the path of the resource on witch set the role
 * method : A string containing the method on which the role is set.
 * authToken : An array of Strings containing the list of token types authorized to pass the role.


param roles then contain an array of role defined as above:
```javascript

 // *********************************************************************************
 //  defining a roles where:
 //   1. Only  "admin, tokenTypeOne, TokenTypeTwo" tokens type are authorized to
 //      access the resource "/resource" called with method "GET".
 //   2. Only  "admin" tokens type are authorized to access the resource
 //      "/resource" called with method "POST"
 // *********************************************************************************
 var roles= [
     {
        "URI":"/resource",
        "method":"GET",
        "authToken":["admin", "tokenTypeOne", "TokenTypeTwo"]
     },
     {
        "URI":"/resource",
        "method":"POST",
        "authToken":["admin"]
     }
 ];

```


Next an example of function upgradeRole(roles) usage


```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 tokenManager.configure( {
          "decodedTokenFieldName":"UserToken",
          "secret":"MyKey",
          "exampleUrl":"http://miosito.it"
 });


 var roles= [
     {
        "URI":"/resource",
        "method":"GET",
        "authToken":["admin", "tokenTypeOne", "TokenTypeTwo"]
     },
     {
        "URI":"/resource",
        "method":"POST",
        "authToken":["admin"]
     }
 ];
 tokenManager.addRole(roles);

 tokenManager.upgradeRole(
    { "URI":"/resource", "method":"POST",  "authToken":["newAdmin"]}
 );


 // dictionary to encode inside token
    var toTokenize={
            "userId":"80248",
            "Other" : "........."
    };

 // Create a *TokenTypeOne* that expire within 1 hour.
 var mytoken=tokenManager.encodeToken(toTokenize,"TokenTypeOne",{unit:"hours",value:1});




 //create authenticated endpoints using middleware
 router.get("/resource",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // This is an endpoint authenticated accessible only with
    // "admin, tokenTypeOne, TokenTypeTwo" tokens as described in the role
    // {"URI":"/resource","method":"GET","authToken":["admin","tokenTypeOne","TokenTypeTwo"]}
    // *********************************************************************************


  });


 router.post("/resource",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // This is an API authenticated accessible  with "newAdmin" and "admin" tokens as
    // described by the first and second role
    // { "URI":"/resource", "method":"POST",  "authToken":["admin"]}
    // { "URI":"/resource", "method":"POST",  "authToken":["newAdmin"]}
    // *********************************************************************************

  });
```

#### <a name="downgradeRoles"></a>`function downgradeRole(roles)`
This function must be used to downgrade authorization between tokens and endpoints.

The roles param is an array where each element is an object containing a single role.
Single role object is defined as bellow:

```javascript

 // *********************************************************************************
 //  Updating a role where "tokenTypeOne, TokenTypeTwo" tokens type become not
 //  authorized to access the resource "/resource" called with method "GET"
 // *********************************************************************************
   {
     "URI":"/resource",
     "method":"GET",
     "authToken":["tokenTypeOne", "TokenTypeTwo"],
   }

```


where:
 * URI : A string containing the path of the resource on witch set the role
 * method : A string containing the method on which the role is set.
 * authToken : An array of Strings containing the list of token types authorized to pass the role.


Param roles contain an array of roles defined as above :
```javascript

 // *********************************************************************************
 //  defining a roles where:
 //    1. Remove "tokenTypeOne, TokenTypeTwo" from tokens list authorized to access the
 //       resource "/resource" called with method "GET"
 //    2. Remove  "admin" from tokens type list are authorized to access the
 //       resource "/resource" called with method "POST"
 // *********************************************************************************
 var roles=[
    {"URI":"/resource","method":"GET","authToken":["tokenTypeOne","TokenTypeTwo"]},
    {"URI":"/resource","method":"POST","authToken":["admin"]}
 ];

```

Next an example of function downgradeRole(roles) usage

```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 tokenManager.configure( {
                          "decodedTokenFieldName":"UserToken",
                          "secret":"MyKey",
                          "exampleUrl":"http://miosito.it"
 });


 var roles= [
    {"URI":"/resource","method":"GET","authToken":["admin","tokenTypeOne","TokenTypeTwo"]},
    {"URI":"/resource","method":"POST","authToken":["admin","newAdmin"]}
 ];
 tokenManager.addRole(roles);

 tokenManager.downgradeRole({"URI":"/resource","method":"POST","authToken":["newAdmin"]});


 // dictionary to encode inside token
  var toTokenize={
    "userId":"80248",
    "Other" : "........."
  };


 // Create a *TokenTypeOne*  expiring within 1 hour.
 var mytoken=tokenManager.encodeToken(toTokenize,"TokenTypeOne",{unit:"hours",value:1});


 //create authenticated endpoints using middleware
 router.get("/resource",tokenManager.checkAuthorization,function(req,res,next){
    // *********************************************************************************
    // This is an authenticated endpoint accessible only with
    // "admin, tokenTypeOne, TokenTypeTwo" tokens as described in the role
    // {"URI":"/resource","method":"GET","authToken":["admin","tokenTypeOne","TokenTypeTwo"]}
    // *********************************************************************************
 });

 router.post("/resource",tokenManager.checkAuthorization,function(req,res,next){

     // *********************************************************************************
     // This is an API authenticated accessible only with "admin" tokens due
     // the first role
     // { "URI":"/resource", "method":"POST",  "authToken":["admin","newAdmin"]}
     // is downgraded by second role
     // { "URI":"/resource", "method":"POST",  "authToken":["newAdmin"]}.
     // *********************************************************************************

  });
```


#### <a name="getRoles"></a>`function getRoles()`
This function must be used to get the list of set roles used by checkAuthorization middleware.

Next an example of function getRoles() usage:
```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 tokenManager.configure( {
              "decodedTokenFieldName":"UserToken",
              "secret":"MyKey",
              "exampleUrl":"http://miosito.it"
 });

 var roles= [
    { "URI":"/resource","method":"GET","authToken":["admin","tokenTypeOne","TokenTypeTwo"]},
    { "URI":"/resource", "method":"POST",  "authToken":["admin"]}
 ];
 tokenManager.addRole(roles);


 var rolesList= tokenManager.getRoles();

 console.log(rolesList) // print this:
                        // { "URI":"/resource","method":"GET", "authToken .......
                        // { "URI":"/resource", "method":"POST",  "authToken":["admin"]}

```



#### <a name="resetRoles"></a>`function resetRoles()`
This function must be used to reset authorization roles

Next an example of function resetRoles() usage
```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 tokenManager.configure( {
              "decodedTokenFieldName":"UserToken",
              "secret":"MyKey",
              "exampleUrl":"http://miosito.it"
 });


 var roles= [
    { "URI":"/resource","method":"GET","authToken":["admin","tokenTypeOne","TokenTypeTwo"]},
    { "URI":"/actions/resetRoles","method":"POST","authToken":["admin"]}
 ];

 // set roles
 tokenManager.addRole(roles);

 //reset roles
 tokenManager.resetRoles();

 // dictionary to encode inside token
 var toTokenize={
       "userId":"80248",
        "Other" : "........."
 };

 // now create a *TokenTypeOne* expiring within 1 hour.
 var mytoken=tokenManager.encodeToken(toTokenize,"TokenTypeOne",{unit:"hours",value:1});

 //create authenticated endpoints using middleware
 router.get("/resource",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // This point is unreachable due tokenManager.checkAuthorization respond with
    // Unauthorized 401. No role set for GET "/resource" due resetRoles()
    // reset the role dictionary
    // *********************************************************************************

  });

```

#### <a name="testAuth"></a>`function testAuth(token,URI, method, callback)`
This function must be used to test authorization roles. It test if a token type can access a resource.

Parameters:
    token: String containing token on which test authorization
    URI: String containing resource on which test authorization
    method: String containing http method on which test authorization
    callback: callback function "function(err,responseOBJ)" with two parameters:
                err: String containing http error 400, 401 ... or null if test passed
                responseOBJ:  Object containing response. If test passed (err==null) it contain decoded token information.
                              if test fail (err!=null) it contain an object with error_message field that
                              explain test fail reason.



Next an example of function testAuth() usage:
```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 tokenManager.configure( {
          "decodedTokenFieldName":"UserToken",
          "secret":"MyKey",
          "exampleUrl":"http://miosito.it"
 });

 var roles= [
     { "URI":"/resource","method":"GET","authToken":["admin","tokenTypeOne","TokenTypeTwo"]},
     { "URI":"/actions/resetRoles", "method":"POST",  "authToken":["admin"]}

 ];

 // set roles
 tokenManager.addRole(roles);


 // dictionary to encode inside token
 var toTokenize={
    "userId":"80248",
    "Other" : "........."
};

 // Create a *TokenTypeOne* that expiring in 1 hour.
 var mytoken=tokenManager.encodeToken(toTokenize,"TokenTypeOne",{unit:"hours",value:1});




 //test if mytoken can access resource ""/resource" in get method
 tokenManager.testAuth(mytoken,"/resource","GET",function(err,response){

    if(err) ...... // test failed

    // if you are here test passed, so token is authorized.

    ......YOUR LOGIC ......
 });

```



## <a name="examples"></a> Examples

### <a name="locally"></a> Used locally in a monolithic application

In this example we create a Users.js file to manage Users and tokens creation,
Contents.js file to manage contents and a script that show how is simple to mange tokens
with tokenmanager package. The script simulate how to create content and how to read all contents using
tokens roles defined to authenticate API in User.js and Contents.js. Both User.js and Contents.js
use checkAuthorization middleware.

Users.js --> file to manage Users that uses checkAuthorization middleware and encodeToken function
```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');


 tokenManager.configure( {
    "decodedTokenFieldName":"UserToken", // decoded token is added in UserToken field
    "secret":"MyKey",                    // secret key to encode/decode token
    "exampleUrl":"http://miosito.it"
 });

 // Set roles where only webUIToken token can call login resource and
 // admin, userTypeOne, userTypeTwo token can call get user by Id
 var roles= [
    { "URI":"/:id","method":"GET","authToken":["admin","userTypeOne","userTypeTwo"]},
    { "URI":"/login", "method":"POST",  "authToken":["webUIToken"]}
 ];

 // Set roles
 tokenManager.addRole(roles);



 router.get("/:id",tokenManager.checkAuthorization,function(req,res,next){

  // *********************************************************************************
  // Authenticated endpoints using checkAuthorization middleware
  // reachable only by admin, userTypeOne, userTypeTwo tokens as in set role
  // { "URI":"/:id","method":"GET","authToken":["admin","userTypeOne","userTypeTwo"]}
  // *********************************************************************************

    // return User and unpack token
    res.status(200).send({User:...., unpackedToken:req.UserToken);

   });


  router.post("/login",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // Authenticated endpoints using checkAuthorization middleware
    // reachable only by webUIToken tokens as in set role
    // { "URI":"/login", "method":"POST",  "authToken":["webUIToken"]}
    // *********************************************************************************

    // Login Logic ....

    var user={ content:"info about logged user"};

    // User logged so must return a User token.
    // Now create a userTypeOne token that expire within 1 hour.
    // To do this use tokenManager.encode.
    var token=tokenManager.encodeToken(user,"userTypeOne",{unit:"hours",value:1});

       res.status(200).send({access_token:token}); // return token
    });

```

Contents.js --> File to manage contents. to authenticate API it uses checkAuthorization middleware

```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 tokenManager.configure( {
    "decodedTokenFieldName":"UserToken", // add token in UserToken field
    "exampleUrl":"http://miosito.it"
 });

 // Set roles where only admin token can create contents and
 // admin, userTypeOne, userTypeTwo token can get all contents
 var roles= [
    {"URI":"/contents","method":"GET","authToken":["admin","userTypeOne","userTypeTwo"]},
    {"URI":"/contents","method":"POST","authToken":["admin"]}
 ];

 // set roles
 tokenManager.addRole(roles);


 router.get("/contents",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // Authenticated endpoints using checkAuthorization middleware
    // It is reachable only by admin, userTypeOne, userTypeTwo tokens as set in role
    // {"URI":"/contents","method":"GET","authToken":["admin","userTypeOne","userTypeTwo"]}
    // *********************************************************************************

    // YOUR LOGIC ....

    res.status(200).send("YOUR DATA....");

   });




  router.post("/contents",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // Authenticated endpoints using checkAuthorization middleware
    // It is reachable only by webUIToken tokens as set in role
    // { "URI":"/contents", "method":"POST",  "authToken":["admin"]}
    // *********************************************************************************



    // YOUR LOGIC ....

    // Save the resource
    var resource=new Resource(req.resource);

    res.status(200).send({createdResource:resource}); // return created resource
  });

```

Next a script that explain how call both User and Contents service that use tokenmanger to authenticate API:
this scripts is external to application (User, Contents). To test application could be used an API client like postman
instead this script. Application runs on http://localhost:3000/

Steeps:
   * Create webUIToken mandatory to call user login
   * call  "user/login" to get user token as admin(mandatory to create resource as set in roles)
   * create content as admin user
   * read contents

```javascript

var request=require('request');
var tokenManager = require('tokenmanager');

tokenManager.configure( {
      "secret":"MyKey"  // secret key to encode/decode token
});



// As set in roles we need admin token to create resource and  a webUIToken to login
// admin user and get its token.
// Firstly webUIToken is needed so create this token expiring in 10 seconds
var webUIToken=tokenManager.encodeToken(
        {
            subject:"generate token on fly"},"webUIToken",{unit:"seconds",value:10
});

// request params
var rqparams = {
    url: 'http://localhost:3000/login',
    headers: {
            'Authorization': "Bearer " + webUIToken , // set Token
            'content-type': 'application/json'
    },
    body:JSON.stringify({username:"admin@admin.com",password:"admin"}); //login data
};


var adminToken;
// make a login request
request.post(rqparams, function (error, response, body) {
    if error console.log(error);

    adminToken=JSON.parse(body).access_token; // admin token is now set

});

// You have the token so can create content
// set request to create content
rqparams = {
    url: 'localhost:3000/contents',
    headers: {
        'Authorization': "Bearer " + adminToken , // set admin token
        'content-type': 'application/json'
    },
    body: JSON.stringify({... contents info ...}); // contents to create
};

// make a request to create content
request.post(rqparams, function (error, response, body) {
    if error console.log(error);
    console.log("Contents Created Successfully " + res.createdResource); // created resource
});



// now we can get contents with one of this tokens: 
// admin, userTypeOne, userTypeTwo
// so use admin token. I've already seen a previous login token

rqparams = {
    url: 'localhost:3000/contents',
    headers: {
    'Authorization': "Bearer " + adminToken , // set admin token
    },
};

// Make a request to get all contents
request.get(rqparams, function (error, response, body) {
if error console.log(error);    

    console.log("Contents: " + res.contents);
});

```



### <a name="microservices"></a> tokenmanger used in a distributed architecture(for example microservice architecture).

Suppose we have a microservice architecture:
*   **authms** microservice that manage token for other microservice. it's running on http://authms.com
*   **userms** microservice that manage users. it's running on http://userms.com
*   **contents** microservice  that manage contents. it's running on http://contentsms.com

authms should be a third parts service or you can implement it. This external service as described in
checkAuthorization middleware, must be have an endpoint in "post" method. It is the endpoint that checkAuthorization
middleware call to verify token authorizations. This endpoint must accept three body params as this:

  body params: {decode_token: token, URI: URI, method: req.method}

  where:
  * decode_token: string containing access token used to call the resource in URI with method in field "method"
  * URI: String containing the calling resource
  * method: String containing the calling method used to access the resource in URI

To implements this authms service, if you want, can use tokenmanager package to manage token like in the example bellow.

authms --> Auth.js
```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 tokenManager.configure( {
      "decodedTokenFieldName":"UserToken", // to add token in UserToken field
      "secret":"MyKey",                    // secret key to encode/decode token
      "exampleUrl":"http://miosito.it"
 });


 // set default roles for this ms. where only "msToken" 
 // token can access authms resources
 var roles= [
     {"URI":"/:id","method":"GET","authToken":[admin,userTypeOne,userTypeTwo]},
     {"URI":"/login","method":"POST","authToken":["webUIToken"]}
 ];

 // set roles
 tokenManager.addRole(roles);


 //create authenticated endpoints using checkAuthorization middleware
 //reachable only by "mstoken" tokens.

  
  router.post("/actions/createToken",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // It encode token and wrap tokenManager.encode function  
    // *********************************************************************************
        
    // YOUR LOGIC
        
    var token=tokenManager.encodeToken(req.toTokenize,req.tokenType,req.tokenLife);

    res.status(200).send({access_token:token});

   });


  
  router.post("/actions/addRole",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // It add token roles and wrap tokenManager.addRole function 
    // *********************************************************************************
                
    // YOUR LOGIC
        
    var token=tokenManager.addRole(req.roles);

   res.status(200).send({tokenManager.getRoles()}); // return roles list after new creation
  });


  
  router.post("/actions/upgradeRole",tokenManager.checkAuthorization,function(req,res,next){

    // *********************************************************************************
    // It upgrade token roles and wrap tokenManager.upgradeRole function
    // *********************************************************************************

    // YOUR LOGIC

    var token=tokenManager.addRole(req.roles);

    res.status(200).send({tokenManager.getRoles()}); // return roles list after new creation
  }


  // It downgrade token roles and wrap tokenManager.downgradeRole function
  router.post("/actions/downgradeRole",tokenManager.checkAuthorization,function(req,res,next){
  
    // *********************************************************************************
    // It upgrade token roles and wrap tokenManager.upgradeRole function
    // *********************************************************************************

    // YOUR LOGIC
  
     var token=tokenManager.addRole(req.roles);

    res.status(200).send({tokenManager.getRoles()}); // return roles list after new creation
  }

    //####################
    // Other Logic ......
    // .......
    //####################
 
 

   
   // *********************************************************************************
   // Endpoint that other microservice call to encode and check token authorization
   // *********************************************************************************
   router.post("/checkAuthorization",tokenManager.checkAuthorization,function(req,res,next){

    var tokenToDecode=req.body.decode_token; // get token to decode
    var method=req.body.method; // get method
    var URI=req.body.URI; // get resource URI

    tokenManager.test(tokenToDecode,URI,method,function(err,retValue){
        if(err) return res.status(err).send(retValue);

        if (_.isUndefined(decoded.valid)) {
                return res.status(401).send(retValue);
        } else {
                if (decoded.valid == true) {
                    return res.status(200).send(retValue);
                } else {
                    return res.status(401).send(retValue);
                }
        }
    });

  });

```

Users.js --> File to manage Users in userms microservce. It call authms to get authorizations about tokens

```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 var request=require('request');

 tokenManager.configure( {
      "decodedTokenFieldName":"UserToken", // Add token in UserToken field
      "secret":"MyKey",                    // secret key to encode/decode token
      "exampleUrl":"http://miosito.it",
      "authorizationMicroserviceUrl":"http://authms.com/checkAuthorization"
 });

 // set roles where only webUIToken token can call login resource and
 //  admin, userTypeOne, userTypeTwo token can call get user by id
 var roles= [
     { "URI":"/:id","method":"GET","authToken":["admin","userTypeOne","userTypeTwo"]},
     { "URI":"/login", "method":"POST",  "authToken":["webUIToken"]}
 ];

 // set roles calling msauth
  var rqparams = {
         url: 'http://authms.com/addRole',
         headers: {
                 'Authorization': "Bearer " + MyToken , // set Token
                 'content-type': 'application/json'
         },
         body: JSON.stringify(roles);
  };
  
 // Make request to set roles 
 request.post(rqparams, function (error, response, body) {
     if error console.log(error);

     // Here roles are set

 });

  
 router.get("/:id",tokenManager.checkAuthorization,function(req,res,next){

   // *********************************************************************************
   // Authenticated endpoints using checkAuthorization middleware
   // reachable only by admin, userTypeOne, userTypeTwo tokens
   // *********************************************************************************
    
   // YOUR LOGIC
   
   res.status(200).send({User:...., unpackedToken:req.UserToken); // return User and unpack token
   });

 router.post("/login",tokenManager.checkAuthorization,function(req,res,next){


   // *********************************************************************************
   //create authenticated endpoints using checkAuthorization middleware
   //reachable only by webUIToken tokens   
   // *********************************************************************************
   
   // YOUR LOGIC TO LOGIN
   
   // Here User are logged so User token must returned,
   // Now create a "userTypeOne" token that expire within 1 hous.
   // using tokenManager.encode.

    // encode token calling msauth
    var rqparams = {
         url: 'http://authms.com/createToken',
         headers: {
                 'Authorization': "Bearer " + MyToken , // set Token
                 'content-type': 'application/json'
         },    
         body: JSON.stringify({"toTokenize":user,"tokenType":"user","tokenLife":{unit:"hours",value:1}});
    };
    
    // make a request to create roken and return it.
    request.post(rqparams, function (error, response, body) {
        res.status(200).send({access_token:JSON.parse(body).token}); // return access_token
     });
  });

```

Contents.js --> File to manage contents uses checkAuthorization middleware. It call authms to get authorizations about tokens

```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenmanager');
 
 tokenManager.configure( {
          "decodedTokenFieldName":"UserToken", //  add token in UserToken field
          "authorizationMicroserviceUrl": "localhost:3000", // authms check Authorization url
          "exampleUrl":"http://miosito.it"
 });


 // set roles
 var roles= [
     { "URI":"/contents","method":"GET","authToken":["admin","userTypeOne","userTypeTwo"]},
     { "URI":"/contents","method":"POST","authToken":["admin"]}
 ];


 // set roles calling msauth
 var rqparams = {
     url: 'http://authms.com/addRole',
     headers: {
             'Authorization': "Bearer " + MyToken , // set Token
             'content-type': 'application/json'
     },
     body: JSON.stringify(roles);
  };
 // Make a request to set Roles
 request.post(rqparams, function (error, response, body) {
     if error console.log(error);

    // here role are set
 });


  router.get("/contents",tokenManager.checkAuthorization,function(req,res,next){

        
    // *********************************************************************************
    // Authenticated endpoint using checkAuthorization middleware eachable only by:
    // admin, userTypeOne, userTypeTwo tokens
    // It get all contents    
    // *********************************************************************************
    
    // YOUR LOGIC ... 
    
    res.status(200).send("YOUR DATA....");
   });


  //create authenticated endpoints using checkAuthorization middleware
  //reachable only by webUIToken tokens
  router.post("/contents",tokenManager.checkAuthorization,function(req,res,next){

        
    // *********************************************************************************
    // Authenticated endpoint using checkAuthorization middleware eachable only by:
    // webUIToken tokens.
    // It create new content    
    // *********************************************************************************
        
    // YOUR LOGIC

    var resource=new Resource(req.resource);

    res.status(200).send({createdResource:resource});
  });

```


Next a script that explain how call both User and Contents microservice that use tokenmanger to
authenticate API. This script is external to microservices (autmms, userms, contentsms).
To test application could be used an API client like postman instead this script.
Steeps:
   * Create webUIToken mandatory to call user login
   * call user /login to get user token as admin(mandatory to create resource as set in roles)
   * create content as admin user
   * read contents
   
```javascript
var request=require('request');
var tokenManager = require('tokenmanager');

tokenManager.configure( {
          "secret":"MyKey"  // secret key to encode/decode token
});

// make admin login to get token.
// to make a login webUIToken is needed so create this token that expires in 10 seconds
var webUIToken=tokenManager.encodeToken(
    {subject:"generate token on fly"},"webUIToken",{unit:"seconds",value:10}
);

// Set login request to userms
var rqparams = {
    url: 'http://userms.com/login',
    headers: {
            'Authorization': "Bearer " + webUIToken , // set Token
            'content-type': 'application/json'
    },
    body: JSON.stringify({username:"admin@admin.com" , password:"admin"});
};

var adminToken;
// Make a login request
request.post(rqparams, function (error, response, body) {
    if error console.log(error);

    // set admin token to next calls to contentms
    adminToken=JSON.parse(body).access_token;

});

// now I have the token so can create content

// prepare reqest to create content using admin token
rqparams = {
    url: 'localhost:3000/contents',
    headers: {
    'Authorization': "Bearer " + adminToken , // set admin token, webUIToken is not authorized
                'content-type': 'application/json'
    },
    body: JSON.stringify({... contents info ...});
};

// Make a request to create content
request.post(rqparams, function (error, response, body) {
    if error console.log(error);

    console.log("Contents Created Successfully " + res.createdResource);
});


// now I can get all contents with one of this tokens: admin, userTypeOne, userTypeTwo
// so use admin token. I've already seen a previous login token


// Set request
rqparams = {
    url: 'localhost:3000/contents',
    headers: {
        'Authorization': "Bearer " + adminToken , // set admin token
    },
};

// Make a request to get all contents
request.get(rqparams, function (error, response, body) {
    if error console.log(error);

    console.log("Contents: " + res.contents);
});

```


License - "MIT License"
-----------------------

MIT License

Copyright (c) 2016 aromanino

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.



#Contributors
------------

<table><tbody>
<tr><th align="left">Alessandro Romanino</th><td><a href="https://github.com/aromanino">GitHub/aromanino</a></td><td><a href="mailto:a.romanino@gmail.com">mailto:a.romanino@gmail.com</a></td></tr>
<tr><th align="left">Guido Porruvecchio</th><td><a href="https://github.com/gporruvecchio">GitHub/porruvecchio</a></td><td><a href="mailto:guido.porruvecchio@gmail.com">mailto:guido.porruvecchio@gmail.com</a></td></tr>
</tbody></table>



