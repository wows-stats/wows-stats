const MAX_RETRY = 5;

var app = angular.module('wows-stats', []);

app.factory('api', function($http, $q) {
	var api = {};
	api.fetchShip = function(player) {
		player.api.ship = api.ship(player);
		player.api.ship.then(function(player){
			// nothing needs to be done after fetching ship stats
		}, function(player){
			// retry if rejected
			if (!player.ship.hasOwnProperty('retry'))
				player.ship.retry = MAX_RETRY;
			if (player.ship.retry > 0) {
				player.ship.retry --;
				api.fetchShip(player);
			}
			else {
				// report error if rejected
				if (response.err.status == 404) {
					player.ship.err = "No Record";
				}
			}
		});
	}
	api.fetchPlayer = function(player) {
		player.api.player = api.player(player);
		player.api.player.then(function(player) {
			// fetch ship stats after player fetching is done so we have the proper playerId
			api.fetchShip(player);
		}, function(player, response) {
			// retry if rejected
			if (!player.hasOwnProperty('retry'))
				player.retry = MAX_RETRY;
			if (player.retry > 0) {
				player.retry --;
				api.fetchPlayer(player);
			}
			else {
				// report the same error to ship since we can't fetch ship without playerId
				player.ship = {};
				player.ship.err = player.err;
			}
		});
	}
	api.beautify = function(type, value) {
		// xvm like colorization
		switch(type) {
			case "winRate":
				if (value < 47) {
					return 'class1';
				}
				else if(value < 49) {
					return 'class2';
				}
				else if(value < 52) {
					return 'class3';
				}
				else if(value < 57) {
					return 'class4';
				}
				else if(value < 65) {
					return 'class5';
				}
				else if(value < 101) {
					return 'class6';
				}
				break;
			default:
				return null;
				break;
		}
	}
	api.player = function(player) {
		return $q(function(resolve, reject) {
			$http({
				method:'GET',
				url: 'http://localhost:8080/api/player?name=' + encodeURIComponent(player.name)
			}).success(function(data, status) {
				angular.extend(player, data);
				player.uri = player.id + '-' + encodeURIComponent(player.name);
				var winRate = parseFloat(player.winRate.replace('%', ''));
				player.winRateClass = api.beautify("winRate", winRate);
				resolve(player);
			}).error(function(response) {
				player.err = response;
				reject(player);
			});
		});
	}
	api.ship = function(player) {
		return $q(function(resolve, reject) {
			$http({
				method:'GET',
				url: 'http://localhost:8080/api/ship?playerId=' + player.id + '&shipId=' + player.shipId
			}).success(function(data, status) {
				var battles = parseInt(data.battles);
				var victories = parseInt(data.victories);
				var winRate = (victories / battles * 100).toFixed(2);
				var survived = parseInt(data.survived);
				var kill = parseInt(data.destroyed);
				var death = battles - survived;
				var kdRatio = (kill / death).toFixed(2);
				player.ship = {
					"name": data.name,
					"img": data.img,
					"winRate": winRate + "%",
					"winRateClass": api.beautify("winRate", winRate),
					"kdRatio": kdRatio,
					"battles": battles,
					"avgExp": data.avgExp,
					"avgDmg": data.avgDmg
				}
				if (data.noRecord)
					player.ship.err = "No Record";
				resolve(player);
			}).error(function(response) {
				player.ship = {};
				player.ship.err = response;
				reject(player);
			});
		});
	}
	return api;
});

app.controller('TeamStatsCtrl', function ($scope, $http, api) {
	$scope.inGame = false;
	$scope.dateTime = "";
  	$scope.data = {};
  	$scope.players = [];
	var updateArena = function() {
		$http({
			method: 'GET',
			url: 'http://localhost:8080/api/arena'
		}).success(function(data, status) {
			$scope.inGame = true;
			$scope.data = data;
			if ($scope.dateTime != data.dateTime) {
				// new game
				$scope.players = [];
				$scope.dateTime = data.dateTime;
				for (var i=0; i<data.vehicles.length; i++) {
					var player = data.vehicles[i];
					$scope.players.push(player);
					player.api = {};
					api.fetchPlayer(player);
				}
			}
		}).error(function(data, status) {
			$scope.dateTime = "";
			$scope.inGame = false;
		});
	}

	var timer = setInterval(function() {
		$scope.$apply(updateArena);
	}, 1000);

	updateArena();
});