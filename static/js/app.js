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
						beautify(player);
						if (value.relation == 2) {
							$scope.foe.push(player);
						}
						else {
							$scope.friendly.push(player);
						}
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
						beautify(player);
						if (value.relation == 2) {
							$scope.foe.push(player);
						}
						else {
							$scope.friendly.push(player);
						}
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

	function beautify(player) {
		player.uri = player.id + '-' + encodeURIComponent(player.name);
		var winRate = parseFloat(player.winRate.replace('%', ''));
		if (winRate < 47) {
			player.winRateClass = 'class1';
		}
		else if(winRate < 49) {
			player.winRateClass = 'class2';
		}
		else if(winRate < 52) {
			player.winRateClass = 'class3';
		}
		else if(winRate < 57) {
			player.winRateClass = 'class4';
		}
		else if(winRate < 65) {
			player.winRateClass = 'class5';
		}
		else if(winRate < 101) {
			player.winRateClass = 'class6';
		}
	}

	var timer = setInterval(function() {
		$scope.$apply(updateArea);
	}, 1000);
});