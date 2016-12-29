'use strict';

var AWS = require('aws-sdk');
var dynamoDb = new AWS.DynamoDB.DocumentClient();


module.exports.post = function(event, content, cb) {
  var data = JSON.parse(event.body);

  if (!data || !data.urls || !data.links) {
    return cb('Bad Request');
  }

  var params = {
    TableName: 'groupPerfs',
    Item: {
      date: new Date().toISOString(),
      urls: data.urls,
      links: data.links,
    },
  };

  dynamoDb.put(params, function(err, data) {
    if (err) {
			return cb('Unexpected Error - dynamoDb put');
		} else {
			return cb(null);
		}
	});
};
