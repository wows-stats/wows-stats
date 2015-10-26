var app = angular.module('wows-stats', []);

app.controller('TeamStatsCtrl', function ($scope, $http) {
	$scope.inGame = false;
	$scope.dateTime = "";
  	$scope.data = {};
  	$scope.friendly = [];
  	$scope.foe = [];
  	$scope.queue = [];
	var updateArea = function() {
		$http({
			method: 'GET',
			url: 'http://localhost:8080/api/arena'
		}).success(function(data, status) {
			$scope.inGame = true;
			$scope.data = data;
			if ($scope.dateTime != data.dateTime) {
				// new game
				$scope.dateTime = data.dateTime;
				angular.forEach(data.vehicles, function(value, key) {
					$http({
						method:'GET',
						url: 'http://localhost:8080/api/player?name=' + encodeURIComponent(value.name)
					}).success(function(stats, statsStatus) {
						var player = {};
						angular.extend(player, value);
						angular.extend(player, stats);
						process(player);
						$http({
							method:'GET',
							url: 'http://localhost:8080/api/ship?playerId=' + player.id + '&shipId=' + value.shipId
						}).success(function(shipStats, shipStatsStatus) {
							var battles = parseInt(shipStats.battles);
							var victories = parseInt(shipStats.victories);
							var winRate = (victories / battles * 100).toFixed(2);
							var survived = parseInt(shipStats.survived);
							var kill = parseInt(shipStats.destroyed);
							var death = battles - survived;
							var kdRatio = (kill / death).toFixed(2);
							player.ship = {
								"name": shipStats.name,
								"img": shipStats.img,
								"winRate": winRate + "%",
								"winRateClass": beautify("winRate", winRate),
								"kdRatio": kdRatio,
								"battles": battles,
								"avgExp": shipStats.avgExp,
								"avgDmg": shipStats.avgDmg
							}
							if (value.relation == 2) {
								$scope.foe.push(player);
							}
							else {
								$scope.friendly.push(player);
							}
						}).error(function(stats, statsStatus) {
							$scope.queue.push(value);
						});
						//console.log(player);
					}).error(function(data, status) {
						$scope.queue.push(value);
						/*
						var player = {};
						angular.extend(player, value);
						if (value.relation == 2) {
							$scope.foe.push(player);
						}
						else {
							$scope.friendly.push(player);
						}
						console.log(player);
						*/
					});
				});
			}
			else if ($scope.queue.length > 0) {
				var queue = [];
				angular.copy($scope.queue, queue);
				angular.forEach(queue, function(value, key) {
					console.log(value);
					$http({
						method:'GET',
						url: 'http://localhost:8080/api/stats?name=' + encodeURIComponent(value.name)
					}).success(function(stats, statsStatus) {
						var player = {};
						angular.extend(player, value);
						angular.extend(player, stats);
						process(player);
						$http({
							method:'GET',
							url: 'http://localhost:8080/api/ship?playerId=' + player.id + '&shipId=' + value.shipId
						}).success(function(shipStats, shipStatsStatus) {
							var battles = parseInt(shipStats.battles);
							var victories = parseInt(shipStats.victories);
							var winRate = (victories / battles * 100).toFixed(2) + "%";
							var survived = parseInt(shipStats.survived);
							var kill = parseInt(shipStats.destroyed);
							var death = battles - survived;
							var kdRatio = (kill / death).toFixed(2);
							player.ship = {
								"name": shipStats.name,
								"img": shipStats.img,
								"winRate": winRate,
								"winRateClass": beautify("winRate", winRate),
								"kdRatio": kdRatio,
								"battles": battles,
								"avgExp": shipStats.avgExp,
								"avgDmg": shipStats.avgDmg
							}
							if (value.relation == 2) {
								$scope.foe.push(player);
							}
							else {
								$scope.friendly.push(player);
							}
						}).error(function(stats, statsStatus) {
							if (value.relation == 2) {
								$scope.foe.push(player);
							}
							else {
								$scope.friendly.push(player);
							}
						});
						//console.log(player);
						$scope.queue.splice($scope.queue.indexOf(value), 1);
					});
				});
			}

		}).error(function(data, status) {
			$scope.dateTime = "";
			$scope.inGame = false;
			$scope.data = {};
			$scope.friendly = [];
		  	$scope.foe = [];
		  	$scope.queue = [];
		});
	}

	function process(player) {
		player.uri = player.id + '-' + encodeURIComponent(player.name);
		var winRate = parseFloat(player.winRate.replace('%', ''));
		player.winRateClass = beautify("winRate", winRate);
	}

	function beautify(type, value) {
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

	var timer = setInterval(function() {
		$scope.$apply(updateArea);
	}, 1000);
});