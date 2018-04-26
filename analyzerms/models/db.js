var mongoose = require('mongoose'); 
var conf = require('../config').conf; 
//var app = require('../app'); 
//var request = require('request'); 
var _ = require("underscore"); 
//var util = require("util"); 
var debug = require('debug')('models:db');


//var conn_ms;
//var conn_S3;

const connections = {};

var dbUrl = conf.dbHost + ':' + conf.dbPort + '/' + conf.dbName; 

var options = 
{
	server:
    {
			socketOptions:
      {
				keepAlive:1, connectTimeoutMS:30000 
			}
	  }
}; 

exports.connect = function connect(callback)
{
	mongoose.Promise = require('bluebird').Promise; 
  connections.ms = mongoose.createConnection('mongodb://' + dbUrl);

/*
	mongoose.connect(dbUrl, options, function (err, res)
     
  {
    conn_ms = res;
		if (err)
    {
			debug('Unable to connect to database ' + dbUrl); 
			callback(err); 
		}
		else 
    {
			var msg = 'Connected to database ' + dbUrl; 
			//console.log(msg);
			debug(msg); 
			callback(); 
		}
	}); 
*/
}; 

exports.disconnect = function disconnect(callback)
{
	connections.ms.close(callback);
}; 

var dbS3Url = conf.dbS3Host + ':' + conf.dbS3Port + '/' + conf.dbS3Name; 

var options = 
{
	server:
    {
			socketOptions:
      {
				keepAlive:1, connectTimeoutMS:30000 
			}
	  }
}; 

exports.connectS3 = function connect(callback)
{
	mongoose.Promise = require('bluebird').Promise; 
  connections.S3 = mongoose.createConnection('mongodb://' + dbS3Url);

  /*
	mongoose.connect(dbS3Url, options, function (err, res)
  {

    conn_S3 = res;
    console.log('\ninside connect S3');
    console.log(conn_S3);
		if (err)
    {
			debug('Unable to connect to database ' + dbS3Url); 
			callback(err); 
		}
		else 
    {
			var msg = 'Connected to database ' + dbS3Url; 
			//console.log(msg);
			debug(msg); 
			callback(); 
		}
	}); 
  */
}; 

exports.disconnectS3 = function disconnect(callback)
{
	connections.S3.close(callback);
}; 

exports.connections = connections;
