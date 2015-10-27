require('dotenv').load();
var express 	= require('express');
var bodyParser 	= require('body-parser');
var request 	= require('request');
var cheerio 	= require('cheerio');
var fs			= require('fs');
var jsonfile 	= require('jsonfile')

var app = express();
var port = process.env.PORT || 8080;
var api_key = process.env.WOWS_API_KEY || "demo";

// static endpoint
app.use(express.static(__dirname + '/static'));

// api endpoint
var router = express.Router();
app.use('/api', router);

// create application/json parser 
var jsonParser = bodyParser.json();

router.get('/', function(req, res) {
	res.json({
		status: "ok",
		name: "wows-stats api",
		version: "v2"
	});
});

// player api
router.get('/player', jsonParser, function(req, res) {
	if (req.query.name) {
		console.log(req.query.name);
		request(process.env.WOWS_API_URL + '/wows/account/list/?application_id=' + api_key + '&search=' + encodeURIComponent(req.query.name), function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var json = JSON.parse(body);
				if (json.status == "ok") {
					if (json.meta.count >= 0) {
						var player = {};
						var playerJson = null;
						for (var i=0; i<json.meta.count; i++) {
							if (json.data[i].nickname == decodeURIComponent(req.query.name)) {
								playerJson = json.data[i];
								break;
							}
						}
						if (playerJson) {
							player.id = playerJson.account_id.toString();
							player.name = playerJson.nickname;
							request(process.env.WOWS_API_URL + '/wows/account/info/?application_id=' + api_key + '&account_id=' + player.id, function (err, rep, statsBody) {
								if (!err && rep.statusCode == 200) {
									var stats = JSON.parse(statsBody);
									if (stats.status == "ok") {
										if (stats.data[player.id] != null) {
											stats = stats.data[player.id];
											player.battles 	= stats.statistics.pvp.battles;
											player.winRate 	= (stats.statistics.pvp.wins / stats.statistics.pvp.battles * 100).toFixed(2) + "%";
											player.avgExp	= (stats.statistics.pvp.xp / stats.statistics.pvp.battles).toFixed();
											player.avgDmg	= (stats.statistics.pvp.damage_dealt / stats.statistics.pvp.battles).toFixed();
											player.kdRatio	= (stats.statistics.pvp.frags / (stats.statistics.pvp.battles - stats.statistics.pvp.survived_battles)).toFixed(2);
											player.raw 		= stats
											res.json(player);
										}
										else
											res.sendStatus(500);
									}
									else
										res.status(400).send(json.error);
								}
								else
									res.sendStatus(rep.statusCode);
							});
						}
						else
							res.sendStatus(404);
					}
					else
						res.sendStatus(404);
				}
				else
					res.status(400).send(json.error);
			}
			else
				res.sendStatus(response.statusCode);
		});
	}
	else
		res.sendStatus(400);
});

// ship api
router.get('/ship', jsonParser, function(req, res) {
	if (req.query.playerId && req.query.shipId) {
		request(process.env.WOWS_API_URL + '/wows/ships/stats/?application_id=' + api_key + '&account_id=' + req.query.playerId + '&ship_id=' + req.query.shipId, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var json = JSON.parse(body);
				if (json.status == "ok") {
					if (json.data[req.query.playerId] != null) {
						var stats = json.data[req.query.playerId][0];
						var ship = {
							"id": 			stats.ship_id,
							"battles": 		stats.pvp.battles,
							"victories": 	stats.pvp.wins,
							"survived": 	stats.pvp.survived_battles,
							"destroyed": 	stats.pvp.frags,
							"avgExp": 		(stats.pvp.xp / stats.pvp.battles).toFixed(),
							"avgDmg": 		(stats.pvp.damage_dealt / stats.pvp.battles).toFixed(),
							"raw": 			stats
						}
						request(process.env.WOWS_API_URL + '/wows/encyclopedia/ships/?application_id=' + api_key + '&ship_id=' + ship.id, function (err, rep, infoBody) {
							if (!err && rep.statusCode == 200) {
								var info = JSON.parse(infoBody);
								if (info.status == "ok") {
									if (info.data[ship.id] != null) {
										info = info.data[ship.id];
										ship.name = info.name;
										ship.img = info.images.small;
										ship.info = info;
										res.json(ship);
									}
									else
										res.sendStatus(500);
								}
								else
									res.status(400).send(json.error);
							}
							else
								res.sendStatus(rep.statusCode);
						});
					}
					else
						res.sendStatus(404);
				}
				else
					res.status(400).send(json.error);
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

app.listen(port);
console.log('wows-stats is running on port: ' + port);

/*
$ = cheerio.load(body);
var mainStatsUri = $('.account-tab').attr('js-tab-lazy-url');
if (mainStatsUri) {
	// returned with profile template page
	var id = mainStatsUri.replace('/' + process.env.WOWS_LANG + '/community/accounts/tab/pvp/overview/','').replace('/', '');
	request(process.env.WOWS_API_URL + mainStatsUri, function (err, resp, stats) {
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
			request(process.env.WOWS_API_URL + profileUri + '#tab=pvp/account-tab-overview-pvp', function (error, response, body) {
				if (!error && response.statusCode == 200) {
					$ = cheerio.load(body);
					var mainStatsUri = $('.account-tab').attr('js-tab-lazy-url');
					if (mainStatsUri) {
						// returned with profile template page
						var id = mainStatsUri.replace('/' + process.env.WOWS_LANG + '/community/accounts/tab/pvp/overview/','').replace('/', '');
						request(process.env.WOWS_API_URL + mainStatsUri, function (err, resp, stats) {
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
	console.log(process.env.WOWS_API_URL + '/' + process.env.WOWS_LANG + '/community/accounts/search/?search=' + req.query.name);
	//res.send(body);
	res.sendStatus(500);
}
*/