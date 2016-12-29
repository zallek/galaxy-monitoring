'use strict';

var AWS = require('aws-sdk');
var dynamoDb = new AWS.DynamoDB.DocumentClient();


module.exports.get = function(event, content, cb) {
  var params = {
    TableName: 'galaxy-monitoring-groupPerfs',
    Limit: 30,
  };

  dynamoDb.scan(params, function(err, data) {
    if (err) {
      return cb(new Error('[500] Error on dynamoDb read'));
    } else {
      return cb(null, data.Items);
    }
  });
};


module.exports.post = function(event, content, cb) {
  var data = event.body;
  if (!data || !data.urls || !data.links) {
    return cb(new Error('[400] Missing or invalid urls/links properties in body'));
  }

  var params = {
    TableName: 'galaxy-monitoring-groupPerfs',
    Item: {
      date: new Date().toISOString(),
      urls: Number.parseInt(data.urls, 10),
      links: Number.parseInt(data.links, 10)
    },
  };

  dynamoDb.put(params, function(err, data) {
    if (err) {
			return cb(new Error('[500] Error on dynamoDb put'));
		} else {
			return cb(null);
		}
	});
};
