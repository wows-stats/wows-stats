require('dotenv').load();
var express 	= require('express');
var bodyParser 	= require('body-parser');
var request 	= require('request');
var fs			= require('fs');
var jsonfile 	= require('jsonfile')

var app = express();
var port = process.env.PORT || 8080;
var api_key = process.env.WOWS_API_KEY || "demo";
var capture_flag = process.env.NODE_CAPTURE;
if (capture_flag === 'true') {
	capture_flag = true;
} else if (capture_flag === 'false') {
	capture_flag = false;
} else {
	capture_flag = true;
}

// create application/json parser
var jsonParser = bodyParser.json();

// Get latest seasons(rank battle) number
var latest_season_num = 0;

function get_season_num() {
	request(process.env.WOWS_API_URL + '/wows/seasons/info/?application_id=' + api_key, function (error, response, body) {
		if ((!error && response.statusCode == 200) || (!error && response.statusCode == 304)) {
			var json = JSON.parse(body);
			if (json.status == "ok") {
				if (json.meta.count >= 0) {
					latest_season_num = json.meta.count;
					console.log('latest season number of rank battle = ' + latest_season_num);
				}
			}
		}
	});
}
get_season_num();

function update_WTRcoefficientsJSON() {
	request('https://asia.wows-numbers.com/personal/rating/expected/json/', function (error, response, body) {
		if ((!error && response.statusCode == 200) || (!error && response.statusCode == 304)) {
//			console.log('Got coefficients json file for WTR.');

			fs.writeFile('static/js/coefficients.json', body, function (err) {
			  	if (!err) {
					console.log('Overwrite ./static/js/coefficients json file.');
			  	}
			  	else {
		  			console.log("Update error ./static/js/coefficients json file. : %s", err);
			  	}
			});
		} else
			console.log('Error getting coefficients data.');
	});
}
update_WTRcoefficientsJSON();

// static endpoint
app.use(express.static(__dirname + '/static'));

// api endpoint
var router = express.Router();
app.use('/api', router);

router.get('/', function(req, res) {
	res.json({
		status: "ok",
		name: "wows-stats-plus api",
		version: "v1"
	});
});

router.get('/env', function(req, res) {
	var env = {};
	env.API_URL = process.env.WOWS_API_URL;
	env.API_KEY = api_key;
	env.CAPTURE_FLAG = capture_flag;
	env.status = "ok";

	res.json(env);
});

// player api
router.get('/player', jsonParser, function(req, res) {
	if (req.query.name) {
		var reg = new RegExp(/^:\w+:$/);
		if (reg.test(req.query.name) == false) {
//			console.log(req.query.name);

			// search and get account_id
			request(process.env.WOWS_API_URL + '/wows/account/list/?application_id=' + api_key + '&search=' + encodeURIComponent(req.query.name), function (error, response, body) {
				if ((!error && response.statusCode == 200) || (!error && response.statusCode == 304)) {
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
								player.pre_rank = '**';
								player.rank = '**';
								player.clan = '';

								// get player info
								request(process.env.WOWS_API_URL + '/wows/account/info/?application_id=' + api_key + '&account_id=' + player.id, function (err, rep, statsBody) {
									if ((!err && rep.statusCode == 200) || (!err && rep.statusCode == 304)) {
										var stats = JSON.parse(statsBody);
										if (stats.status == "ok") {
											if (stats.data[player.id] != null) {
												stats = stats.data[player.id];
												if (stats.statistics != null) {
													player.battles 	= stats.statistics.pvp.battles;
													player.winRate 	= (stats.statistics.pvp.wins / stats.statistics.pvp.battles * 100).toFixed(2) + "%";
													player.avgExp	= (stats.statistics.pvp.xp / stats.statistics.pvp.battles).toFixed();
													player.avgDmg	= (stats.statistics.pvp.damage_dealt / stats.statistics.pvp.battles).toFixed();
													player.kdRatio	= (stats.statistics.pvp.frags / (stats.statistics.pvp.battles - stats.statistics.pvp.survived_battles)).toFixed(2);
													player.raw 		= stats;

													// get player clan info
													request(process.env.WOWS_API_URL + '/wows/clans/accountinfo/?application_id=' + api_key + '&account_id=' + player.id + '&extra=clan', function (cl_error, cl_response, clanBody) {
														if ((!cl_error && cl_response.statusCode == 200) || (!cl_error && cl_response.statusCode == 304)) {
															var clanInfo = JSON.parse(clanBody);
															if (clanInfo.status == "ok") {
//																console.log(clanInfo.data);

																if ((clanInfo.data[player.id] != null) && (clanInfo.data[player.id]['clan'] != null)) {
																	var cstat = clanInfo.data[player.id];
																	player.clan_id = cstat['clan']['clan_id'];
																	player.clan = '[' + cstat['clan']['tag'] + ']';
//																	console.log("%s : %s", player.name, player.clan);
																} else {
																	player.clan_id = '';
																	player.clan = '';
//																	console.log('null clan info data');
																}

																// get player rank battle info
																request(process.env.WOWS_API_URL + '/wows/seasons/accountinfo/?application_id=' + api_key + '&account_id=' + player.id + '&season_id=' + (latest_season_num -1) + '%2C' + latest_season_num, function (rk_error, rk_response, rankBody) {
																	if ((!rk_error && rk_response.statusCode == 200) || (!rk_error && rk_response.statusCode == 304)) {
																		var seasons = JSON.parse(rankBody);
																		if (seasons.status == "ok") {
																			if (seasons.data != null) {
																				if (seasons.data[player.id] != null) {
																					var rstat = seasons.data[player.id];

																					var pre_season = rstat.seasons[(latest_season_num -1)];
																					if (pre_season != null) {
																						if (pre_season.rank_info != null) {

																							player.pre_rank = pre_season.rank_info.max_rank;
//																							console.log(player.pre_rank);
																							if (pre_season.rank_info.max_rank == 0)
																								player.pre_rank = '**';
																						} else {
																							player.pre_rank = '**';
//																							console.log('null pre rank info data');
																						}
																					} else {
																						player.pre_rank = '**';
//																						console.log('null pre rank info data');
																					}

																					var season = rstat.seasons[latest_season_num];
																					if (season != null) {
																						if (season.rank_info != null) {

																							player.rank = season.rank_info.max_rank;
//																							console.log(player.rank);
																							if (season.rank_info.max_rank == 0)
																								player.rank = '**';
																						} else {
																							player.rank = '**';
//																							console.log('null rank info data');
																						}
																					} else {
																						player.rank = '**';
//																						console.log('null rank info data');
																					}
																				} else {
																					player.pre_rank = '**';
																					player.rank = '**';
//																					console.log('null rank info data');
																				}
																			} else {
																				player.pre_rank = '**';
																				player.rank = '**';
//																				console.log('null rank info data');
																			}

																			res.json(player);
																		} else {
//																			console.log('getting rank info status failed');
																			res.status(400).send(json.error);
																		}
																	}
																	else if(rk_response)
																		res.status(rk_response.statusCode);
																	else
																		res.status(500);
																});
															} else {
//																console.log('getting clan info failed');
																res.status(400).send(json.error);
															}
														}
														else if(cl_response)
															res.status(cl_response.statusCode);
														else
															res.status(500);
													});
												}
												else
													res.status(401).send(player);
											}
											else
												res.status(500).send(player);
										}
										else
											res.status(400).send(player);
									}
									else if(rep)
										res.status(rep.statusCode).send(player);
									else
										res.status(500).send(player);
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
				else if(response) {
					res.sendStatus(response.statusCode);
				} else {
					res.sendStatus(500);
				}
			});
		}
		else
			res.sendStatus(400);
	}
	else
		res.sendStatus(400);
});

// ship api
router.get('/ship', jsonParser, function(req, res) {
	if (req.query.playerId && req.query.shipId) {
		request(process.env.WOWS_API_URL + '/wows/encyclopedia/ships/?application_id=' + api_key + '&ship_id=' + req.query.shipId + '&language=en', function (err, rep, infoBody) {
			if ((!err && rep.statusCode == 200) || (!err && rep.statusCode == 304)) {
				var info = JSON.parse(infoBody);
				if (info.status == "ok") {
					if (info.data[req.query.shipId] != null) {
						var ship = {};
						info = info.data[req.query.shipId];
						ship.name = info.name;
						ship.img = info.images.small;
						ship.info = info;
						request(process.env.WOWS_API_URL + '/wows/ships/stats/?application_id=' + api_key + '&account_id=' + req.query.playerId + '&ship_id=' + req.query.shipId, function (error, response, body) {
							if ((!error && response.statusCode == 200) || (!error && response.statusCode == 304)) {
								var json = JSON.parse(body);
								if (json.status == "ok") {
									if (json.data[req.query.playerId] != null) {
										var stats = json.data[req.query.playerId][0];
										ship.id = 			stats.ship_id;
										ship.battles = 		stats.pvp.battles;
										ship.victories = 	stats.pvp.wins;
										ship.survived = 	stats.pvp.survived_battles;
										ship.destroyed = 	stats.pvp.frags;
										ship.avgExp =  		(stats.pvp.xp / stats.pvp.battles).toFixed();
										ship.avgDmg =  		(stats.pvp.damage_dealt / stats.pvp.battles).toFixed();
										ship.raw = 			stats;
										if (stats.pvp.battles == 0)
											ship.noRecord = true;
										res.json(ship);
									}
									else {
										ship.id = req.query.shipId;
										ship.noRecord =	true;
										res.json(ship);
									}
								}
								else
									res.status(400).send(json.error);
							}
							else if(response) {
								res.sendStatus(response.statusCode);
							} else {
								res.sendStatus(500);
							}
						});
					}
					else
						res.sendStatus(404);
				}
				else
					res.status(400).send(info.error);
			}
			else if(rep)
				res.sendStatus(rep.statusCode);
			else
				res.sendStatus(500);
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
console.log('wows-stats-plus is running on port: ' + port);
