require('dotenv').load();
var express 	= require('express');
var bodyParser 	= require('body-parser');
var fs			= require('fs');
var request 	= require('request');

var app = express();
var port = process.env.PORT || 8080;

// static endpoint
app.use(express.static(__dirname + '/install'));

// api endpoint
var router = express.Router();
app.use('/api', router);

// create application/json parser 
var jsonParser = bodyParser.json();

router.get('/', function(req, res) {
	res.json({
		status: "ok",
		name: "wows-stats installer api",
		version: "v1"
	});
});

router.get('/env', function(req, res) {
	var env = {};
	if (process.env.WOWS_PATH)
		env.path = process.env.WOWS_PATH;
	if (process.env.WOWS_API_URL)
		env.url = process.env.WOWS_API_URL;
	if (process.env.WOWS_API_KEY)
		env.key = process.env.WOWS_API_KEY;
	res.json(env);
});

router.post('/path', jsonParser, function(req, res) {
	if (req.body.path) {
		fs.access(req.body.path + "/WorldOfWarships.exe", fs.R_OK, function (err) {
			if (!err)
				res.sendStatus(200);
			else
				res.sendStatus(404);
		});
	}
	else
		res.sendStatus(400);
});

router.post('/install', jsonParser, function(req, res) {
	if (req.body.action) {
		if (req.body.action == "cancel") {
			res.sendStatus(200);
			console.log("User cancelled wows-stats installation.")
			process.exit(1);
		}
		else if(req.body.action == "save") {

			var validation = {};

			validation.checkPath = function() {
				if (req.body.path) {
					fs.access(req.body.path + "/WorldOfWarships.exe", fs.R_OK, function (err) {
						if (err)
							return res.status(400).send("World Of Warships not found.");
						else 
							validation.checkKey();
					});
				}
				else
					return res.sendStatus(400);
			}

			validation.checkKey = function() {
				if (req.body.key) {
					request(req.body.url + '/wows/encyclopedia/info/?application_id=' + req.body.key, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							var data = JSON.parse(body);
							if (data.status == 'ok')
								return validation.save();
							else
								return res.status(400).send(data.error.message);
						}
						else
							return res.status(response.statusCode).send(error);
					});
				}
				else
					return validation.save();
			}

			validation.save = function() {
				fs.writeFile('.env', 
					'WOWS_PATH="' + req.body.path + '"\n' +
					'WOWS_API_URL="' + req.body.url + '"\n' + 
					(req.body.key ? ('WOWS_API_KEY=' + req.body.key):''),
					function (err) {
					  	if (!err) {
					  		res.sendStatus(200);
					  		process.exit(0);
					  		return;
					  	}
					  	else {
					  		console.log(err);
					  		return res.sendStatus(500);
					  	}
				});
			}

			validation.checkPath();
		}
	}
	else
		res.sendStatus(400);
});

app.listen(port);
console.log('wows-stats installer is running on port: ' + port);