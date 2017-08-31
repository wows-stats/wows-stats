const wsp_version = '0.6.0';
const MAX_RETRY = 5;

var lang_array = [];
var nameConvert_array = [];
var ship_info = {};
var clanTagList = {};
var ownerName = '';
var ready_lang = false;
var ready_shipinfo = false;
var ready_shipTable = false;
var images_pre = 'images/';
var images_prefix = '.png';
var capture_flag = true;

function get_availableLanguageList() {
//	console.log('Enter get_availableLanguageList');

	var sync_getLang = new Promise (function (resolve, reject) {
		$.getJSON('js/language/languages.json', function(data) {
			if (data.status = 'ok') {
//				console.log(data);
				for (var i = 0; i < data.length; i++) {
					lang_array.push(data[i]);
				}
//				console.log(lang_array);
//				console.log('Success get lang list');
				resolve();
			} else {
//				console.log('Fail get lang list %s', data.status);
				reject();
			}
		});
	});

	sync_getLang.then ( function () {
//		console.log('Exit get_availableLanguageList with success');
		ready_lang = true;
	});
}

function get_shipnameConvertTable() {
//	console.log('Enter get_shipnameConvertTable');

	var sync_getLang = new Promise (function (resolve, reject) {
		$.getJSON('js/language/shipname.json', function(data) {
			if (data.status = 'ok') {
//				console.log(data);
//				for (var i in data) {
					nameConvert_array = data;
//				}
//				console.log(nameConvert_array);
//				console.log('Success get shipname convert table');
				resolve();
			} else {
//				console.log('Fail get shipname convert table %s', data.status);
				reject();
			}
		});
	});

	sync_getLang.then ( function () {
//		console.log('Exit get_shipnameConvertTable with success');
		ready_shipTable = true;
	});
}

var api_url = '';
var api_key = '';

function get_shipinfo(idArray) {
//	console.log('Enter get_shipinfo');

	var sync_getenv = new Promise (function (resolve, reject) {
		$.getJSON('http://localhost:8080/api/env', function(data) {
			if (data.status = 'ok') {
//				console.log(data);
				api_url = data.API_URL;
				api_key = data.API_KEY;
				capture_flag = data.CAPTURE_FLAG;
				resolve();
//				console.log('Success get .env');
			} else {
				reject();
			}
		});
	});

	sync_getenv.then ( function () {
		var sync_getinfo = new Promise (function (resolve, reject) {
				var idString = idArray.join('%2C');
				var api_call = api_url + '/wows/encyclopedia/ships/?application_id=' + api_key + '&fields=name%2Ctier%2Ctype%2Cnation&language=en&ship_id=' + idString;
				ship_info = {};

				jQuery.ajax({
					type: 'GET',
					url: api_call,
//					dataType: 'jsonp',
					jsonpCallback: 'callback',
					success : function(info) {
						if (info.status == "ok") {
							if (info.meta.count > 0) {
								ship_info = info;
//								console.log('Exit get_shipinfo with success');
								resolve();
						    } else {
//								console.log('Exit get_shipinfo with meta.count <= 0');
								reject();
							}
					    } else {
//							console.log('Exit get_shipinfo with status not ok');
							reject();
						}
					},
					error : function(res) {
//						console.log("Exit error of get json");
						reject();
					}
				});
		});

		sync_getinfo.then ( function () {
			ready_shipinfo = true;
//			console.log(ship_info);
		});
	});
}

function getClanList(nArray) {
//	if(Object.keys(clanTagList).length != 0)
//		return;

	var nameList = [];
	var accountIdList = [];
	var idList = [];

	// except co-op bot
	for (var i=0; i<nArray.length; i++) {
		var reg = new RegExp(/^:\w+:$/);
		if (reg.test(nArray[i]) == false)
			nameList.push(nArray[i]);
	}
//	console.log(nameList);

	var sync_getAccountId = new Promise (function (resolve, reject) {
		var nameSrings = nameList.join(',');
		var api_call = api_url + '/wows/account/list/?application_id=' + api_key + '&search=' + encodeURIComponent(nameSrings) + '&type=exact';
//		console.log(api_call);
		jQuery.ajax({
			type: 'GET',
			url: api_call,
//			dataType: 'jsonp',
			jsonpCallback: 'callback',
			success : function(info) {
				if (info.status == "ok") {
					if (info.meta.count > 0) {
//						console.log(info.data);
						for (var c=0; c<nArray.length; c++) {
							var found = false;
							for (var j=0; j<info.meta.count; j++) {
								var name = info.data[j].nickname;
								var id = info.data[j].account_id;
								if (nArray[c] === name) {
									accountIdList.push(id);
									found = true;
									break;
								}
							}
							if (found != true)
								accountIdList.push('');
						}
//						console.log('Exit get account_id with success');
						resolve();
				    } else {
//						console.log('Exit get account_id with meta.count <= 0');
						reject();
					}
			    } else {
//					console.log('Exit get account_id with status not ok');
					reject();
				}
			},
			error : function(res) {
//				console.log("Exit error of get json");
				reject();
			}
		});
	});

	sync_getAccountId.then ( function () {
//		console.log(accountIdList);

		for (var key in clanTagList) {
				delete clanTagList[key];
		}

		// except co-op bot
		for (var i=0; i<accountIdList.length; i++) {
			if (accountIdList[i] != '')
				idList.push(accountIdList[i]);
		}

		var sync_getClanInfo = new Promise (function (resolve, reject) {
			var accountIdSrings = idList.join('%2c');
			var api_call = api_url + '/wows/clans/accountinfo/?application_id=' + api_key + '&account_id=' + accountIdSrings + '&extra=clan';
//			console.log(api_call);
			jQuery.ajax({
				type: 'GET',
				url: api_call,
//				dataType: 'jsonp',
				jsonpCallback: 'callback',
				success : function(info) {
					if (info.status == "ok") {
						if (info.meta.count > 0) {
//							console.log(info.data);
							for (var c=0; c<accountIdList.length; c++) {
								var id = accountIdList[c].toString();
								var tagname = '';
								for (var key in info.data) {
									if (id === key.toString()) {
										if (info.data[key] != null) {
											if (info.data[key].clan != null) {
												tagname = info.data[key].clan.tag;
												break;
											}
										}
									}
								}
								clanTagList[nArray[c]] = tagname;
							}
//							console.log('Exit get clan info with success');
							resolve();
					    } else {
//							console.log('Exit get clan info with meta.count <= 0');
							reject();
						}
				    } else {
//						console.log('Exit get clan info with status not ok');
						reject();
					}
				},
				error : function(res) {
//					console.log("Exit error of get json");
					reject();
				}
			});
		});

		sync_getClanInfo.then ( function () {
//			console.log(clanTagList);
		});
	});
}

function  shiptype(val1,val2,val3,val4) {
	if ( val1 ){
		cv ="none";
	}else {
		cv = "";
	}
	if ( val2 ){
		bb ="none";
	}else {
		bb = "";
	}
	if ( val3 ){
		cl ="none";
	}else {
		cl = "";
	}
	if ( val4 ){
		dd ="none";
	}else {
		dd = "";
	}
	var elements = document.getElementsByName("AirCarrier");
	for (var i=0; i<elements.length ; i++) {
		document .getElementsByName( "AirCarrier" )[i]. style . display = cv;
	}
	var elements = document.getElementsByName("Battleship");
	for (var i=0; i<elements.length ; i++) {
		document .getElementsByName( "Battleship" )[i]. style . display = bb;
	}
	var elements = document.getElementsByName("Cruiser");
	for (var i=0; i<elements.length ; i++) {
		document .getElementsByName( "Cruiser" )[i]. style . display = cl;
	}	var elements = document.getElementsByName("Destroyer");
	for (var i=0; i<elements.length ; i++) {
		document .getElementsByName( "Destroyer" )[i]. style . display = dd;
	}
}

function idhide(status) {
	if ( status ){
		idp ="none";
		buta ="";
	}else {
		idp = "";
		buta ="none";
	}

	var el = document.getElementsByName("user_own");
	for (var i=0; i<el.length ; i++) {
		document .getElementsByName( "user_own" )[i]. style . display = idp;
	}
	var el = document.getElementsByName("user_buta");
	for (var i=0; i<el.length ; i++) {
		document .getElementsByName( "user_buta" )[i]. style . display = buta;
	}
}

function InitViewMode() {
	$("input[name='type']:eq(0)").prop("checked", true);
	$("input:radio[name='type']:checked").change();

	$("input[name='idhi']:eq(0)").prop("checked", false);
	$("input:checkbox[name='idhi']:checked").change();

	$("input[name='knp']:eq(1)").prop("checked", true);
	$("input:radio[name='knp']:checked").change();
}

function UpdateViewMode() {
	var viewmode1 = $("input[name='knp']:checked").val();
	var viewmode2 = $("input[name='idhi']:checked").val();

	switch (viewmode1) {
		case "nm_sw0":
          	shipname_ex(0);
			break;
		case "nm_sw1":
          	shipname_ex(1);
			break;
		default:
			break;
	}

	switch (viewmode2) {
		case "id_pr10":
          	idhide(1,0);
			break;
		default:
			break;
	}
}

var imgFilename = '';
var imgData = {};
function prepare_ss(target) {
	if (capture_flag) {
		var element = $(target)[0];
		delete imgData;

	    html2canvas(element, {background:'#393E46', letterRendering: true, onrendered: function(canvas) {
			var base64data = canvas.toDataURL("image/png").split(",")[1];
			var data = window.atob(base64data);
			var buff = new ArrayBuffer(data.length);
			var array = new Uint8Array(buff);
			for (var i=0; i<data.length; i++) {
				array[i] = data.charCodeAt(i);
			}
			imgData = URL.createObjectURL(new Blob([array]));

			var link = document.createElement("a");
			link.download = imgFilename;
			link.href = imgData;
			document.body.appendChild(link);
			link.click();

			document.body.removeChild(link);
		}});
    }
}

function  shipname_ex(val) {
	if (val == 1) {
		dispeng ="none";
		disptrans="";
	} else {
		dispeng ="";
		disptrans="none";
	}
	var el = document.getElementsByName("shipname_trans");
	for (var i=0; i<el.length ; i++) {
		document .getElementsByName("shipname_trans")[i].style.display = disptrans;
	}
	var el = document.getElementsByName("shipname_eng");
	for (var i=0; i<el.length ; i++) {
		document .getElementsByName("shipname_eng")[i].style.display = dispeng;
	}
}

function myFormatNumber(x) {
	var s = "" + x; 
	var p = s.indexOf("."); 
	if (p < 0) { 
		p = s.length; 
	}
	var r = s.substring(p, s.length);
	for (var i = 0; i < p; i++) {
        var c = s.substring( p- 1 - i, p - 1 - i + 1);
		if (c < "0" || c > "9") {
			r = s.substring(0, p - i) + r;
			break;
 		}
		if (i > 0 && i % 3 == 0) { 
			r = "," + r; 
		}
		r = c + r;
	}
	return r;
}

function localeFormatDate(str, type, lang) {
	var date_time = moment(str, "DD.MM.YYYY HH:mm:ss", true);
	date_time.locale(lang);

	if (type == 'file') {
		return date_time.format("YYYYMMDD_HH-mm-ss");
	} else if (type == 'label') {
		return date_time.format("LL HH:mm:ss");
	} else {
		return 'Invalid timestamp format';
	}
}

function short_id(str) {
	if (str.length < 18) {
		return(str);
	}
	return (str.substring(0,16)+"...");
}

function countLength(str) { 
	function isSurrogatePear(upper, lower) {
		return 0xD800 <= upper && upper <= 0xDBFF && 0xDC00 <= lower && lower <= 0xDFFF;
	}

	var ret = 0;
	for (var i = 0; i < str.length; i++,ret++) {
		var upper = str.charCodeAt(i);
		var lower = str.length > (i + 1) ? str.charCodeAt(i + 1) : 0;

		if (isSurrogatePear(upper, lower)) {
			i++;
		}
	}
	return ret;
} 

// loading language list
get_availableLanguageList();

// loading shipname convert table
get_shipnameConvertTable();

var app = angular.module('wows-stats-plus', ['pascalprecht.translate','ngCookies']);

function getLanguage() {
//	console.log((navigator.languages[0] || navigator.browserLanguage || navigator.language || navigator.userLanguage).substr(0, 2));
	try {
		return ( navigator.browserLanguage || navigator.language || navigator.userLanguage).substr(0, 2);
	} catch (e) {
		return "en";
	}
}

function getPlayerInfoURL() {
	var base_url_part1 = 'http://worldofwarships.';
	var base_url_part2 = '/community/accounts/';
	var user_lang = getLanguage();
	var avarable_lang = 'en';
	var detect_server = api_url.match(/^http:\/\/api\.worldofwarships\.(\w+)$/)[1];

	if (detect_server === 'com') {
		switch (user_lang) {
			case 'es':
				avarable_lang = 'es-mx';
				break;
			case 'pt':
				avarable_lang = 'pt-br';
				break;
			default:
				avarable_lang = 'en';
				break;
		}
	} else if (detect_server === 'asia') {
		switch (user_lang) {
			case 'ja':
				avarable_lang = 'ja';
				break;
			case 'ko':
				avarable_lang = 'ko';
				break;
			case 'th':
				avarable_lang = 'th';
				break;
			case 'zh':
				avarable_lang = 'zh-tw';
				break;
			default:
				avarable_lang = 'en';
				break;
		}
	} else if (detect_server === 'eu') {
		switch (user_lang) {
			case 'cs':
				avarable_lang = 'cs';
				break;
			case 'de':
				avarable_lang = 'de';
				break;
			case 'es':
				avarable_lang = 'es';
				break;
			case 'fr':
				avarable_lang = 'fr';
				break;
			case 'pl':
				avarable_lang = 'pl';
				break;
			case 'tr':
				avarable_lang = 'tr';
				break;
			default:
				avarable_lang = 'en';
				break;
		}
	} else if (detect_server === 'ru') {
		avarable_lang = 'ru';
	}

	return base_url_part1 + detect_server + '/' + avarable_lang + base_url_part2;
}

app.config(['$translateProvider', function($translateProvider) {
	$translateProvider.useStaticFilesLoader({
		prefix : 'js/language/lang_',
		suffix : '.json'
	});

	$translateProvider.preferredLanguage(getLanguage());
	$translateProvider.fallbackLanguage('en');	// for not prepared language
	$translateProvider.useLocalStorage();	// cache language setting
//	$translateProvider.useMissingTranslationHandlerLog();
//	$translateProvider.postProcess(function (translationId, translation, interpolatedTranslation, params, lang) {
//		return translationId + '(' + lang + '): ' + (interpolatedTranslation ? interpolatedTranslation : translation);
//	});
	$translateProvider.useSanitizeValueStrategy('escaped');	// for avoiding security warning
}]);

app.factory('api',['$translate','$rootScope','$http','$q', function($translate, $rootScope, $http, $q) {
	var api = {};
	api.fetchShip = function(player) {
		player.api.ship = api.ship(player);
		player.api.ship.then(function(player) {
			// nothing needs to be done after fetching ship stats
		}, function(player) {
			// retry if rejected
			if (!player.ship)
				player.ship = {};
			if (!player.ship.hasOwnProperty('retry'))
				player.ship.retry = MAX_RETRY;
			if (player.ship.retry > 0) {
				player.ship.retry --; 
				api.fetchShip(player);
			}
			else {
				// report error if max retry reached
				if (player.api.ship.status == 404)
					player.ship.err = "no record";
				else if(player.api.ship.response.message)
					player.ship.err = player.api.ship.response.message;
				else if(player.api.ship.response.error)
					player.ship.err = player.api.ship.response.error.message;
				else
					player.ship.err = player.api.ship.response;
			}
		});
	}

	api.fetchPlayer = function(player) {
		player.api.player = api.player(player);
		player.api.player.then(function(player) {
			// fetch ship stats after player fetching is done so we have the proper playerId
			api.fetchShip(player);
		}, function(player) {
			// retry if rejected
			if (!player.hasOwnProperty('retry'))
				player.retry = MAX_RETRY;

			if (player.retry <= 0 || player.api.status == 401) {
				// report error if max retry reached or player profile is private
				player.ship = {};
				if (player.api.status == 401) {
					player.err = "private";
				}
				else if (player.api.response.message) {
					player.err = player.api.response.message;
				}
				else if(player.api.response.error) {
					player.err = player.api.response.error.message;
				}
				else {
					player.err = player.api.response;
				}

				if (player.api.response.hasOwnProperty("id")){
					// playerId is available
					angular.extend(player, player.api.response);
					player.uri = getPlayerInfoURL() + player.id + '-' + encodeURIComponent(player.name);
					api.fetchShip(player);
				}
				else {
					// report the same error to ship since we can't fetch ship without playerId
					// but fetch ship information for Co-op battle bot
					angular.extend(player, player.api.response);
					player.ship.err = player.err;
					api.fetchShip(player);
				}
			}
			else {
				player.retry --;
				api.fetchPlayer(player);
			}
		});
	}

api.shipnameTranslated = function(value) {
	var currentLang = ($translate.proposedLanguage() || $translate.use());

	var sn_en = [];
	for (var key in nameConvert_array[currentLang]) {
		sn_en.push(key);
	}

	var sn_trans = [];
	for (var key in nameConvert_array[currentLang]) {
		sn_trans.push(nameConvert_array[currentLang][key]);
	}

	for (var i=0; i<sn_en.length ; i++) {
		if (value == sn_en[i]) {
			return sn_trans[i].trim();
			break;
		}
	}
	return value.trim();
}

api.shiptype_s = function(type, value) {
	if (value == 'Destroyer') {
		return 'DD';
	}
	else if(value == 'Cruiser') {
		return 'CA';
	}
	else if(value == 'Battleship') {
		return 'BB';
	}
	else if(value == 'AirCarrier') {
		return 'CV';
	}
	else return value;
}

api.nation_s = function(str) {
var ntname = [
	["japan","JP"] ,["usa","US"] ,["ussr","SU"],["germany","DE"] ,
	["uk","UK"],["france","FR"] ,["poland","PL"],["pan_asia","PA"] ,
	["italy","IT"],["australia","AU"],["commonwealth","CW"],
	["netherlands","NL"],["spain","ES"]
];

	for (var i=0; i<ntname.length ; i++) {
		if (str == ntname[i][0]) {
			return ntname[i][1];
			break;
		}
	}
	return 'other';
}

api.nation_for_sort = function(str) {
var ntname = [
	["japan","japan"] ,["usa","america"] ,["ussr","soviet"],["germany","german"] ,
	["uk","england"],["france","france"] ,["poland","poland"],["pan_asia","panasia"] ,
	["italy","italia"],["australia","austoralia"],["commonwealth","hms"],
	["netherlands","netherlands"],["spain","spain"]
];

	for (var i=0; i<ntname.length ; i++) {
		if (str == ntname[i][0]) {
			return ntname[i][1];
			break;
		}
	}
}

api.shipnamefont = function(value) {
	if (value < 8) { 	
		return 'ship_font_6'; 
	}
	else if(value < 11) {
		return 'ship_font_9'; 
	}
	else if(value < 15) {
		return 'ship_font_14'; 
	}
	else return 'ship_font_20';  
}

api.beautify = function(type, value) {
	// xvm like colorization
	switch(type) {
		case "winRate":
			if	(value < 47) {
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

api.b_beautify = function(type, value) {
	// xvm like colorization for combat power
	switch(type) {
		case "combatPower":
			if	(value < 10000) {
				return 'cp_class1';
			}
			else if(value < 20000) {
				return 'cp_class2';
			}
			else if(value < 30000) {
				return 'cp_class3';
			}
			else if(value < 80000) {
				return 'cp_class4';
			}
			else if(value < 150000) {
				return 'cp_class5';
			}
			else if(value < 1000000) {
				return 'cp_class6';
			}
			else {
				return 'cp_class7';
			}
			break;
		default:
			return null;
			break;
	}
}

api.rank_beautify = function(type, value) {
	switch(type) {
		case "rank":
			if	(value <= 5) {
				return 'rank_premiere';
			}
			else {
				return 'rank_normal';
			}
			break;
		default:
			return null;
			break;
	}
}

api.highlight = function(type, value) {
	switch(type) {
		case "combatPower":
			if(value >= 150000) {
				return 'highlight_danger';
			}
			else {
				return 'highlight_normal';
			}
			break;
		default:
			return null;
			break;
	}
}

api.owner = function(type, value) {
	switch(type) {
		case "owner":
			if(value == ownerName) {
				return 'highlight_owner';
			}
			else {
				return 'highlight_others';
			}
			break;
		default:
			return null;
			break;
	}
}

api.player = function(player) {
	return $q(function(resolve, reject) {
		var reg = new RegExp(/^:\w+:$/);
		if (reg.test(player.name) == false) {
			$http({
				method:'GET',
				url: 'http://localhost:8080/api/player?name=' + encodeURIComponent(player.name)
			}).success(function(data, status) {
				angular.extend(player, data);
				player.uri = getPlayerInfoURL() + player.id + '-' + encodeURIComponent(player.name);
				player.is_bot = false;
				var winRate = parseFloat(player.winRate.replace('%', ''));
				player.preRankClass = api.rank_beautify("rank", player.pre_rank);
				player.RankGap = ' → ';
				player.RankClass = api.rank_beautify("rank", player.rank);
				player.winRateClass = api.beautify("winRate", winRate);
				player.formatbattle = myFormatNumber(parseInt(player.battles));
				player.formatdmg = myFormatNumber(parseInt(player.avgDmg));
				player.formatexp = myFormatNumber(parseInt(player.avgExp));
				resolve(player);
			}).error(function(data, status) {
//				console.log("player api error : %s", status);
				if (status == '401')
					player.is_private = true;
				else
					player.is_private = false;
				player.RankGap = '';
				player.api.response = data;
				player.api.status = status;
				resolve(player);
			});
			player.name_s = short_id(player.name);
		} else {
			player.api.response = '';
			player.api.status = '';
			player.uri = '';
			player.is_bot = true;
			reject(player);
			player.name_s = short_id(player.name);
		}
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
			var kakin = "";
			var svrate= "";
			var svgeta= "";
			if (death == 0 && kill > 0) {
				kdRatio ="∞";
				combatPower = "∞";
			} else if(death == 0 && kill == 0) {
				kdRatio = "－";
				combatPower = "－";
			} else {
				var kdRatio = (kill / death).toFixed(2);
				if (kdRatio == 0) {
					var combatPower = combatPower ="∞";
				} else {
					if (data.info.type == 'Battleship') {
						var type_param = 0.7;
					} else if (data.info.type == 'AirCarrier') {
						var type_param = 0.5;
					} else {
						var type_param = 1.0;
					}

					var combatPower = (data.avgDmg*kdRatio*data.avgExp/800*(1-(0.03*data.info.tier))*type_param).toFixed(0);
				}
			}

			if (data.noRecord !=  true) {
				var atkavg = (parseInt(data.destroyed)/ battles).toFixed(1);
				var sdkavg =  (parseInt(data.raw.pvp.planes_killed)/ battles).toFixed(1);
				if (parseInt(data.raw.pvp.main_battery.shots) != 0){
					var hitm = (parseInt(data.raw.pvp.main_battery.hits) / parseInt(data.raw.pvp.main_battery.shots)*100).toFixed(1);
				}
				else{
					var hitm = "－";
				}
				if (parseInt(data.raw.pvp.torpedoes.shots) != 0){
					var hitt = (parseInt("0"+data.raw.pvp.torpedoes.hits) / parseInt("0"+data.raw.pvp.torpedoes.shots)*100).toFixed(1);
				}
				else{
					var hitt = "－";
				}
				if ( parseInt(data.victories) >10 && (parseInt(data.battles) - parseInt(data.victories)) >10 ){
					var svwin=((parseInt(data.raw.pvp.survived_wins)/parseInt(data.victories))*100).toFixed(0);
					var svlose=(((parseInt(data.raw.pvp.survived_battles)-parseInt(data.raw.pvp.survived_wins))/(parseInt(data.battles) - parseInt(data.victories)))*100).toFixed(0);
					if (parseInt(svlose)<10){
						svgeta = " ";
					}else{
						svgeta = "";
					}
					svrate = svwin + "-" + svgeta + svlose;
				}else{
					svrate = "－";
				}
			}

			if (data.info.is_premium != false){
				kakin ="℗";
			}

			if (data.noRecord != true) {
				player.ship = {
					"shiptia_s": data.info.tier,
					"shipty": data.info.type,
					"shiptype_s": images_pre + api.shiptype_s("shiptype", data.info.type) + images_prefix,
					"shiptype_alt": data.info.type,
					"shipnation_s": images_pre + api.nation_s(data.info.nation) + images_prefix,
					"shipnation_alt": data.info.nation,
					"shipkakin": kakin,
					"name": data.name.toUpperCase(),
					"name_trans": api.shipnameTranslated(data.name),
					"namefont" : api.shipnamefont(countLength(data.name)),
					"namefont_trans" : api.shipnamefont(countLength(api.shipnameTranslated(data.name))),
					"bgcolor" : data.info.type+"_bg",
					"winRate": winRate + "%",
					"winRateClass": api.beautify("winRate", winRate),
					"shfl" : atkavg,
					"ftfl" : sdkavg,
					"hitratem" : hitm ,
					"hitratet" : hitt ,
					"kdRatio": kdRatio,
					"battles": myFormatNumber(battles),
					"avgExp": myFormatNumber(data.avgExp),
					"avgDmg": myFormatNumber(data.avgDmg),
					"combatPower": myFormatNumber(combatPower),
					"combatPowerClass": api.b_beautify("combatPower", combatPower),
					"highlightClass": (player.is_private != true)? api.highlight("combatPower", combatPower):'highlight_private',
					"ownerClass": api.owner("owner", player.name),
					"svrate": svrate
				}
			} else {
				var sid = player.shipId;
				player.ship = {
					"shiptia_s": ship_info.data[sid].tier,
					"shipty": ship_info.data[sid].type,
					"shiptype_s": images_pre + api.shiptype_s("shiptype", ship_info.data[sid].type) + images_prefix,
					"shiptype_alt": ship_info.data[sid].type,
					"shipnation_s": images_pre + api.nation_s(ship_info.data[sid].nation) + images_prefix,
					"shipnation_alt": ship_info.data[sid].nation,
					"shipkakin": kakin,
					"name": ship_info.data[sid].name.toUpperCase(),
					"name_trans": api.shipnameTranslated(ship_info.data[sid].name),
					"namefont" : api.shipnamefont(countLength(ship_info.data[sid].name)),
					"namefont_trans" : api.shipnamefont(countLength(api.shipnameTranslated(ship_info.data[sid].name))),
					"bgcolor" :ship_info.data[sid].type+"_bg",  
					"winRate": '',
					"winRateClass": '',
					"shfl" : '',
					"ftfl" : '',
					"hitratem" : '',
					"hitratet" : '',
					"kdRatio": '',
					"battles": '0',
					"avgExp": '',
					"avgDmg": '',
					"combatPower": '',
					"combatPowerClass": '',
					"highlightClass": (player.is_private != true)? api.highlight("combatPower", combatPower):'highlight_private',
					"ownerClass": '',
					"svrate": ''
				}
				player.ship.err = "no battle record";
			}
			resolve(player);

		}).error(function(data, status) {
			player.api.ship.response = data;
			player.api.ship.status = status;
			reject(player);
		});
	});
}
return api;
}]);

app.controller('TeamStatsCtrl', ['$scope', '$translate', '$filter', '$rootScope', '$http', '$q', 'api', function ($scope, $translate, $filter, $rootScope, $http, $q, api) {
	$scope.version = wsp_version;
	$scope.inGame = false;
	$scope.dateTime = "";
  	$scope.data = {};
  	$scope.players = [];
	$scope.mapDisplayName = "";
  	$scope.gameLogic  = "";
	$scope.translated_gamemapname = "";
	$scope.translated_gameLogic = "";
	$scope.downloadFile = '';
	var kariload = [[]];
	var playerVehicle;
	$scope.options = lang_array;
	$scope.select = $translate.proposedLanguage();
	$scope.captureFlag = capture_flag;

	$translate(['title','numero_sign','btn_top','btn_bottom','game','map','mode','list_label1','list_label2','ui_label']).then(function (translations) {
		$scope.title = translations.title;
		$scope.numero_sign = translations.numero_sign;
		$scope.btn_top = translations.btn_top;
		$scope.btn_bottom = translations.btn_bottom;
		$scope.game = translations.game;
		$scope.map = translations.map;
		$scope.mode = translations.mode;
		$scope.list_label1 = translations.list_label1;
		$scope.list_label2 = translations.list_label2;
		$scope.ui_label = translations.ui_label;
	}, function(translationIds) {
		$scope.title = translationIds.title;
		$scope.numero_sign = translationIds.numero_sign;
		$scope.btn_top = translationIds.btn_top;
		$scope.btn_bottom = translationIds.btn_bottom;
		$scope.game = translationIds.game;
		$scope.map = translationIds.map;
		$scope.mode = translationIds.mode;
		$scope.list_label1 = translationIds.list_label1;
		$scope.list_label2 = translationIds.list_label2;
		$scope.ui_label = translationIds.ui_label;
	});

	$scope.changeLanguage = function () {
		if ($scope.select != '') {
			$translate.use($scope.select);

			var mapstr = 'map.' + $scope.mapDisplayName;
			var reg = new RegExp(/^s\d\d_\w+$/);
			var modestr = 'mode.' + $scope.gameLogic;
			if (reg.test($scope.mapDisplayName))
				modestr = '';
			$translate(['map.' + $scope.mapDisplayName, 'mode.' + $scope.gameLogic]).then(function (translations) {
				$scope.translated_gamemapname = translations[mapstr];
				$scope.translated_gameLogic = ' ('+translations[modestr]+')';
				if (reg.test($scope.mapDisplayName))
					$scope.translated_gameLogic = '';
				imgFilename = "wows_" + localeFormatDate($scope.dateTime, 'file', $scope.select) + "_" + $scope.translated_gamemapname + "_" + $scope.translated_gameLogic +"_" + playerVehicle + ".png";
			}, function (translationId) {
				$scope.translated_gamemapname = translationId[mapstr];
				$scope.translated_gameLogic = ' ('+translationId[modestr]+')';
				if (reg.test($scope.mapDisplayName))
					$scope.translated_gameLogic = '';
				imgFilename = "wows_" + localeFormatDate($scope.dateTime, 'file', $scope.select) + "_" + $scope.translated_gamemapname + "_" + $scope.translated_gameLogic +"_" + playerVehicle + ".png";
			});

			$translate(['list_label1', 'list_label2', 'btn_top', 'btn_bottom', 'ui_label']).then(function (translations) {
				$scope.list_label1 = translations.list_label1;
				$scope.list_label2 = translations.list_label2;
				$scope.btn_top = translations.btn_top;
				$scope.btn_bottom = translations.btn_bottom;
				$scope.ui_label = translations.ui_label;
			}, function (translationId) {
				$scope.list_label1 = translationId.list_label1;
				$scope.list_label2 = translationId.list_label2;
				$scope.btn_top = translationId.btn_top;
				$scope.btn_bottom = translationId.btn_bottom;
				$scope.ui_label = translationId.ui_label;
			});

			$scope.battleTime = localeFormatDate($scope.dateTime, 'label', $scope.select);

			if ((kariload.length > 0) && ($("input[name='knp']:checked").val() == 'nm_sw1')) {
			  	$scope.players.ship = [];
				for (var i=0; i<kariload.length; i++) {
					var sid = kariload[i].shipId;
					kariload[i].ship.name_trans = api.shipnameTranslated(ship_info.data[sid].name);
					kariload[i].ship.namefont_trans = api.shipnamefont(countLength(api.shipnameTranslated(ship_info.data[sid].name)));
					$scope.players.ship.push(kariload[i].ship);
				}
			}
		}
	};

	var updateArena = function() {
		UpdateViewMode();
		$scope.captureFlag = capture_flag;

		// view handling after sync-loaded of languages.json & shipname covert table
		if (ready_lang && ready_shipTable) {

		$http({
			method: 'GET',
			url: 'http://localhost:8080/api/arena'
		}).success(function(data, status) {
			if ($scope.dateTime != data.dateTime) {
				var nameArray = [];
				var idArray = [];
				for (var i=0; i<data.vehicles.length; i++) {
						nameArray[i] = data.vehicles[i].name;
						idArray[i] = data.vehicles[i].shipId;
				}

				// loading ship inforamtion by shipId list
				var shipIdArray = Array.from(new Set(idArray));
				get_shipinfo(shipIdArray);

				// sync loading of ship info
				function getShipInfo() {
					var ds = $q.defer();
					if (ready_shipinfo != false) {
						ds.resolve();
					} else {
						ds.reject();
					}
					return ds.promise;
				}

				var promise_s = getShipInfo();
				promise_s.then( function() {
//					console.log(ship_info);

					getClanList(nameArray);

					// sync loading of clan info
					function getClan() {
						var d = $q.defer();
						if (Object.keys(clanTagList).length != 0) {
							d.resolve();
						} else {
							d.reject();
						}
						return d.promise;
					}

					var promise_c = getClan();
					promise_c.then( function() {
//						console.log(clanTagList);

						$scope.inGame = true;
						$scope.data = data;
						$scope.players = [];
						$scope.dateTime = data.dateTime;
						$scope.mapDisplayName = data.mapDisplayName;
  						$scope.gameLogic = data.scenario;
						ownerName = data.playerName;
						playerVehicle = data.playerVehicle;
						var mapstr = 'map.' + $scope.mapDisplayName;
						var reg = new RegExp(/^s\d\d_\w+$/);
						var modestr = 'mode.' + $scope.gameLogic;
						if (reg.test($scope.mapDisplayName))
							modestr = '';

						$scope.$watch('select', function(newValue, oldValue) {
							$translate(['map.' + $scope.mapDisplayName, 'mode.' + $scope.gameLogic]).then(function (translations) {
								$scope.translated_gamemapname = translations[mapstr];
								$scope.translated_gameLogic = ' ('+translations[modestr]+')';
								if (reg.test($scope.mapDisplayName))
									$scope.translated_gameLogic = '';
								imgFilename = "wows_" + localeFormatDate($scope.dateTime, 'file', $scope.select) + "_" + $scope.translated_gamemapname + "_" + $scope.translated_gameLogic +"_" + playerVehicle + ".png";
							}, function (translationId) {
								$scope.translated_gamemapname = translationId[mapstr];
								$scope.translated_gameLogic = ' ('+translationId[modestr]+')';
								if (reg.test($scope.mapDisplayName))
									$scope.translated_gameLogic = '';
								imgFilename = "wows_" + localeFormatDate($scope.dateTime, 'file', $scope.select) + "_" + $scope.translated_gamemapname + "_" + $scope.translated_gameLogic +"_" + playerVehicle + ".png";
							});
						});
						$scope.$watch('select', function(newValue, oldValue) {
							$translate(['list_label1', 'list_label2', 'btn_top', 'btn_bottom', 'ui_label']).then(function (translations) {
								$scope.list_label1 = translations.list_label1;
								$scope.list_label2 = translations.list_label2;
								$scope.btn_top = translations.btn_top;
								$scope.btn_bottom = translations.btn_bottom;
								$scope.ui_label = translations.ui_label;
							}, function (translationId) {
								$scope.list_label1 = translationId.list_label1;
									$scope.list_label2 = translationId.list_label2;
								$scope.btn_top = translationId.btn_top;
								$scope.btn_bottom = translationId.btn_bottom;
								$scope.ui_label = translationId.ui_label;
							});
						});
						console.log($scope.ui_label.display);
						$scope.battleTime = localeFormatDate($scope.dateTime, 'label', $scope.select);

						for (var key in kariload) {
								delete kariload[key];
						}
						for (var i=0; i<data.vehicles.length; i++) {
								kariload[i] = data.vehicles[i];
						}
//						console.log(kariload);

						// sort data as ship_type > tier > nation > shipID > playername with clan tag
						kariload.sort( function(val1,val2) {
							var shipID1 = val1.shipId;
							var shipID2 = val2.shipId;
							var sinfo1 = ship_info.data[shipID1];
							var sinfo2 = ship_info.data[shipID2];

							try {
								// ship type
								var type1 = ship_info.data[shipID1].type;
								var type2 = ship_info.data[shipID2].type;
								if( type1 > type2 ) return 1;
								if( type1 < type2 ) return -1;

								// Tier
								var tier1 = ship_info.data[shipID1].tier;
								var tier2 = ship_info.data[shipID2].tier;
								if( tier1 < tier2 ) return 1;
								if( tier1 > tier2 ) return -1;

								// Nation
								var nation1 = api.nation_for_sort(ship_info.data[shipID1].nation);
								var nation2 = api.nation_for_sort(ship_info.data[shipID2].nation);
								if( nation1 > nation2 ) return 1;
								if( nation1 < nation2 ) return -1;

							} catch(e) {
								console.log('ileagal ship ID. seems old data-type JSON file');
							}

							// shipID
							if( val1.shipId < val2.shipId ) return 1;
							if( val1.shipId > val2.shipId ) return -1;

							// clan tag
							var clan1 = '[' + clanTagList[val1.name] + ']';
							var clan2 = '[' + clanTagList[val2.name] + ']';

							// player name with clan tag
							var name1 = clan1 + val1.name;
							var name2 = clan2 + val2.name;
							if( name1 > name2 ) return 1;
							if( name1 < name2 ) return -1;

							return 0;
						});

						for (var i=0; i<kariload.length; i++) {
							var player = kariload[i];
							player.api = {};
							$scope.players.push(player);
							api.fetchPlayer(player);
							$scope.link_disabled = function () {
								if (player.is_bot)
									return false;
							}
						}
					});
				});
			}
			// reset ship info
			ready_shipinfo = false;

		}).error(function(data, status) {
//			$scope.dateTime = "";
			$scope.inGame = false;
		});

	}

	}

	var timer = setInterval(function() {
		$scope.$apply(updateArena);
	}, 2000);

	updateArena();
}]);
