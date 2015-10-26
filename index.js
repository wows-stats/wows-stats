require('dotenv').load();
var express 	= require('express');
var bodyParser 	= require('body-parser');
var request 	= require('request');
var cheerio 	= require('cheerio');
var fs			= require('fs');
var jsonfile 	= require('jsonfile')

var app = express();
var port = process.env.PORT || 8080;

// static endpoint
app.use(express.static(__dirname + '/static'));

// api endpoint
var router = express.Router();
app.use('/api', router);

// create application/json parser 
var jsonParser = bodyParser.json();

router.get('/', function(req, res) {
	res.json({
		name: "wows-stats api",
		version: "v1"
	});
});

// player api
router.get('/player', jsonParser, function(req, res) {
	if (req.query.name) {
		console.log(req.query.name);
		request('http://worldofwarships.com/en/community/accounts/search/?search=' + encodeURIComponent(req.query.name), function (error, response, body) {
			if (!error && response.statusCode == 200) {
				$ = cheerio.load(body);
				var mainStatsUri = $('.account-tab').attr('js-tab-lazy-url');
				if (mainStatsUri) {
					// returned with profile template page
					var id = mainStatsUri.replace('/en/community/accounts/tab/pvp/overview/','').replace('/', '');
					request('http://worldofwarships.com' + mainStatsUri, function (err, resp, stats) {
						if (!err && resp.statusCode == 200)
							res.json(playerStats(id, stats));
						else 
							res.sendStatus(resp.statusCode);
					});
				}
				else if ($('.account-main-stats-table ._values').children('div').length > 0) {
					// returned with populated profile page
					res.json(playerStats(null, body));
				}
				else if ($('.search-results').length > 0) {
					// returned with search results
					var playerName = decodeURIComponent(req.query.name);
					var players = $('.search-results tbody ._name a');
					for (var i = 0; i < players.length; i++) {
						if (players.eq(i).text() == playerName) {
							var profileUri = players.eq(i).attr('href');
							request('http://worldofwarships.com' + profileUri + '#tab=pvp/account-tab-overview-pvp', function (error, response, body) {
								if (!error && response.statusCode == 200) {
									$ = cheerio.load(body);
									var mainStatsUri = $('.account-tab').attr('js-tab-lazy-url');
									if (mainStatsUri) {
										// returned with profile template page
										var id = mainStatsUri.replace('/en/community/accounts/tab/pvp/overview/','').replace('/', '');
										request('http://worldofwarships.com' + mainStatsUri, function (err, resp, stats) {
											if (!err && resp.statusCode == 200)
												res.json(playerStats(id, stats));
											else 
												res.sendStatus(resp.statusCode);
										});
									}
									else if ($('.account-main-stats-table ._values').children('div').length > 0) {
										// returned with populated profile page
										res.json(playerStats(null, body));
									}
								}
								else {
									res.sendStatus(response.statusCode);
								}
							});
							return;
						}
					}
					console.log('Player not found.');
					//res.send(body);
					res.sendStatus(404);
				}
				else {
					console.log('Unexpected response:');
					console.log('http://worldofwarships.com/en/community/accounts/search/?search=' + req.query.name);
					//res.send(body);
					res.sendStatus(500);
				}
			}
			else {
				res.sendStatus(response.statusCode);
			}
		});
	}
	else if (req.query.id) {
		request('http://worldofwarships.com/en/community/accounts/tab/pvp/overview/' + req.query.id, function (error, response, body) {
			if (!error && response.statusCode == 200)
				res.json(playerStats(req.query.id, body));
			else 
				res.sendStatus(response.statusCode);
		});
	}
	else
		res.sendStatus(400);
});

// ship api
router.get('/ship', jsonParser, function(req, res) {
	if (req.query.playerId) {
		request('http://worldofwarships.com/en/community/accounts/tab/pvp/ships/' + req.query.playerId, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				//res.json(shipStats(req.query.shipId, body));
				var shipStatsJson = shipStats(req.query.shipId, body);
				if (shipStatsJson)
					res.json(shipStatsJson);
				else
					//res.sendStatus(404);
					res.send(body);
			}
			else 
				res.sendStatus(response.statusCode);
		});
	}
	else
		res.sendStatus(400);
});

// arena api
router.get('/arena', jsonParser, function(req, res) {
	if (process.platform == 'win32') {
		arenaJson = process.env.WOWS_PATH + '/replays/tempArenaInfo.json';
		fs.access(arenaJson, fs.R_OK, function (err) {
			if (!err) {
				jsonfile.readFile(arenaJson, function read(error, obj) {
				    if (!error) {
				    	res.json(obj);
				    }
				    else {
				    	res.sendStatus(404);
				    }
				});
			}
			else {
				res.sendStatus(404);
			}
		});
	}
	else
		res.sendStatus(400);
});

function playerStats(id, body) {
	$ = cheerio.load(body);
	var mainStats = $('.account-main-stats-table ._values').children('div');
	return {
		"id": 		id,
		"battles": 	mainStats.eq(0).text(),
		"winRate": 	mainStats.eq(1).text(),
		"avgExp": 	mainStats.eq(2).text(),
		"avgDmg": 	mainStats.eq(3).text(),
		"kdRatio": 	mainStats.eq(4).text()
	}
}

function shipStats(shipId, body) {
	$ = cheerio.load(body);
	var shipInfo = $('.ships-detail-stats tbody[js-extension] tr[js-has-extension]');
	var shipStats = $('.ships-detail-stats tbody[js-extension] tr[js-extension]');
	if (shipInfo.length != shipStats.length)
		return null;
	var parseStats = function(shipId, info, stats) {
		var overall = stats.find('._left ._value span');
		var avg = stats.find('._center ._value span');
		return {
			"id": 			shipId,
			"name": 		info.find('._text').text(),
			"img": 			"http:" + info.find('img').attr('src'),
			"battles": 		overall.eq(0).text(),
			"victories": 	overall.eq(1).text(),
			"survived": 	overall.eq(2).text(),
			"destroyed": 	overall.eq(4).text(),
			"avgExp": 		avg.eq(0).text(),
			"avgDmg": 		avg.eq(1).text()
		}
	}
	if (shipId) {
		var info = shipInfo.filter("[js-has-extension*='" + shipId + "']");
		var stats = shipStats.filter("[js-extension*='" + shipId + "']");
		if (info.length < 1 || stats.length < 1)
			return null;
		else {
			return parseStats(shipId, info, stats);
		}
	}
	else {
		var ships = [];
		for (var i = 0; i < shipInfo.length; i++) {
			var info = shipInfo.eq(i);
			var stats = shipStats.eq(i);
			ships.push(parseStats(info.attr('js-has-extension').split('-')[0], info, stats));
		}
		return ships;
	}
}

app.listen(port);
console.log('wows-stats is running on port: ' + port);