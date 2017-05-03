var app = angular.module('wows-stats', []);

app.controller('InstallCtrl', function ($scope, $http) {
	$scope.api = {};
	$scope.api.err = "Fetching settings...";
	$scope.api.region = [
		{
			name: "Russia",
			url: "http://api.worldofwarships.ru",
			devRoom: "http://ru.wargaming.net/developers/"
		},
		{
			name: "North America",
			url: "http://api.worldofwarships.com",
			devRoom: "http://na.wargaming.net/developers/"
		},
		{
			name: "Europe",
			url: "http://api.worldofwarships.eu",
			devRoom: "http://eu.wargaming.net/developers/"
		},
		{
			name: "Asia",
			url: "http://api.worldofwarships.asia",
			devRoom: "http://asia.wargaming.net/developers/"
		},
	];
	$scope.api.path = {};
	$scope.api.appId = {};
	$scope.api.save = {};

	$http({
		method:'GET',
		url: 'http://localhost:8080/api/env'
	}).success(function(data, status) {
		$scope.path = data.path;
		$scope.key = data.key;
		var regionFound = false;
		for (var i=0; i<$scope.api.region.length; i++) {
			if ($scope.api.region[i].url == data.url) {
				$scope.region = $scope.api.region[i];
				regionFound = true;
				break;
			}
		}
		if (!regionFound)
			$scope.region = $scope.api.region[1];
		$scope.developerRoom = $scope.region.devRoom;
		delete $scope.api.err;
	}).error(function(data, status) {
		$scope.api.err = "Fetch failed.";
	});

	$scope.onPathChange = function() {
		$scope.api.path = {};
		$scope.api.save = {};
	}

	$scope.onAppIdChange = function() {
		$scope.api.appId = {};
		$scope.api.save = {};
	}

	$scope.onRegionChange = function() {
		$scope.developerRoom = $scope.region.devRoom;
		$scope.api.appId = {};
		$scope.api.save = {};
	}

	$scope.api.validateAppId = function() {
		if ($scope.api.loading)
			return;
		$scope.api.loading = true;
		$http({
			method:'GET',
			url: $scope.region.url + '/wows/encyclopedia/info/?application_id=' + $scope.key
		}).success(function(data, status) {
			$scope.api.loading = false;
			if (data.status == "ok") {
				$scope.api.appId.result = "alert-success";
				$scope.api.appId.message = "This is a valid Application ID.";
			}
			else {
				$scope.api.appId.result = "alert alert-danger";
				$scope.api.appId.message = data.error.message;
			}
		}).error(function(data, status) {
			$scope.api.loading = false;
			$scope.api.appId.result = "alert-danger";
			$scope.api.appId.message = data;
		});
	}

	$scope.api.validatePath = function() {
		if ($scope.api.loading)
			return;
		$scope.api.loading = true;
		$http({
			method:'POST',
			url: 'http://localhost:8080/api/path',
			data: { path: $scope.path }
		}).success(function(data, status) {
			$scope.api.loading = false;
			$scope.api.path.result = "alert-success";
			$scope.api.path.message = "Found World_of_Warships.exe at this location.";
		}).error(function(data, status) {
			$scope.api.loading = false;
			$scope.api.path.result = "alert-danger";
			$scope.api.path.message = "World of Warships not found.";
		});
	}

	$scope.api.cancel = function() {
		if ($scope.api.loading)
			return;
		$http({
			method:'POST',
			url: 'http://localhost:8080/api/install',
			data: { action: "cancel" }
		});
		window.location.href="about:blank";
	}

	$scope.api.install = function() {
		if ($scope.api.loading)
			return;
		$http({
			method:'POST',
			url: 'http://localhost:8080/api/install',
			data: { 
				action: "save",
				path: $scope.path,
				url: $scope.region.url,
				key: $scope.key
			}
		}).success(function(data, status) {
			$scope.api.save = {};
			window.location.href="about:blank";
		}).error(function(data, status) {
			$scope.api.save.result = "alert-danger";
			$scope.api.save.message = data;
		});
	}

	window.onbeforeunload = $scope.api.cancel;
});