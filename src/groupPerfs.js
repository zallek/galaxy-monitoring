'use strict';

var platform = require('platform');
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

module.exports.stats = function(event, content, cb) {
  var params = {
    TableName: 'galaxy-monitoring-groupPerfs',
  };

  dynamoDb.scan(params, function(err, data) {
    if (err) {
      return cb(new Error('[500] Error on dynamoDb read'));
    } else {
      var stats = {
        count: data.Count,
        urls: { avg: 0, min: 0, max: 0 },
        links: { avg: 0, min: 0, max: 0 },
      };

      var urlsTotal = 0, linksTotal = 0;
      data.Items.forEach(function(item, i) {
        urlsTotal += item.urls;
        stats.urls.max = i ? Math.max(stats.urls.max, item.urls) : item.urls;
        stats.urls.min = i ? Math.min(stats.urls.min, item.urls) : item.urls;

        linksTotal += item.links;
        stats.links.max = i ? Math.max(stats.links.max, item.links) : item.links;
        stats.links.min = i ? Math.min(stats.links.min, item.links) : item.links;
      })
      stats.urls.avg = urlsTotal / stats.count;
      stats.links.avg = linksTotal / stats.count;

      return cb(null, stats);
    }
  });
};


module.exports.create = function(event, content, cb) {
  var data = event.body;
  if (!data || !data.urls || !data.links) {
    return cb(new Error('[400] Missing or invalid urls/links properties in body'));
  }

  var info = platform.parse(event.userAgent);

  var params = {
    TableName: 'galaxy-monitoring-groupPerfs',
    Item: {
      date: new Date().toISOString(),
      urls: Number.parseInt(data.urls, 10),
      links: Number.parseInt(data.links, 10),
      ip: event.ip,
      os: info.os ? info.os.toString() : null,
      browser: info.name + ' ' + info.version,
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
