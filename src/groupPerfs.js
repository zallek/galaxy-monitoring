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

function computeStats(items) {
  var nbRecords = items.length;
  var urls = { avg: 0, min: 0, max: 0 };
  var links = { avg: 0, min: 0, max: 0 };

  var urlsTotal = 0, linksTotal = 0;
  items.forEach(function(item, i) {
    urlsTotal += item.urls;
    urls.max = i ? Math.max(urls.max, item.urls) : item.urls;
    urls.min = i ? Math.min(urls.min, item.urls) : item.urls;

    linksTotal += item.links;
    links.max = i ? Math.max(links.max, item.links) : item.links;
    links.min = i ? Math.min(links.min, item.links) : item.links;
  })
  urls.avg = urlsTotal / nbRecords;
  links.avg = linksTotal / nbRecords;

  return {
    nbRecords: nbRecords,
    stats: {
      urls: urls,
      links: links,
    },
  };
}

module.exports.stats = function(event, content, cb) {
  var params = {
    TableName: 'galaxy-monitoring-groupPerfs',
  };

  dynamoDb.scan(params, function(err, data) {
    if (err) {
      return cb(new Error('[500] Error on dynamoDb read'));
    } else {
      var itemsByAnalysis = {};
      data.Items.forEach(function(item) {
        if (!itemsByAnalysis[item.analysisId]) {
          itemsByAnalysis[item.analysisId] = [];
        }
        itemsByAnalysis[item.analysisId].push(item);
      });

      var stats = {};
      Object.keys(itemsByAnalysis).forEach(function(key) {
        stats[key] = computeStats(itemsByAnalysis[key]);
      });

      return cb(null, stats);
    }
  });
};


module.exports.create = function(event, content, cb) {
  var data = event.body;
  if (!data || !data.analysisId || !data.urls || !data.links) {
    return cb(new Error('[400] Missing analysisId, urls or links properties in body'));
  }

  var info = platform.parse(event.userAgent);

  var params = {
    TableName: 'galaxy-monitoring-groupPerfs',
    Item: {
      date: new Date().toISOString(),
      analysisId: data.analysisId,
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
