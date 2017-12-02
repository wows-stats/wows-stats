const wsp_version = '1.0.2';
const MAX_RETRY = 5;

// include WTR rating calculation
$.getScript("./js/calculateWarshipsTodayRating.js");

// include PR rating calculation
$.getScript("./js/calculatePersonalRating.js");

// include modal window handling
$.getScript("./js/modalwindow.js");

var settingsCookie = { "shipColumn": 64704, "playerColumn": 52224, "statsSite": 2 };
var lang_array = [];
var site_array = [];
var nameConvert_array = [];
var statsSite_array = [];
var coefficientsList = {};
var ship_info = {};
var clanTagList = {};
var ownerName = '';
var ready_lang = false;
var ready_shipinfo = false;
var ready_shipTable = false;
var ready_siteList = false;
var ready_coefficients = false;
const images_pre = 'images/';
const images_prefix = '.png';
var capture_flag = true;
var Interval_timer;

var api_url = '';
var api_key = '';


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
				nameConvert_array = data;
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

function get_statsSiteList() {
//	console.log('Enter get_statsSiteList');

	var sync_getSite = new Promise (function (resolve, reject) {
		$.getJSON('/js/site.json', function(data) {
			if (data.status = 'ok') {
//				console.log(data);
				statsSite_array = data;
				for (var i = 0; i < data.length; i++) {
					var site_obj = new Object();
					site_obj['value'] = i;
					site_obj['label'] = data[i]['site'];
					site_array.push(site_obj);
				}
//				console.log(site_array);
//				console.log(statsSite_array);
//				console.log('Success get stats site list');
				resolve();
			} else {
//				console.log('Fail get stats site list %s', data.status);
				reject();
			}
		});
	});

	sync_getSite.then ( function () {
//		console.log('Exit get_statsSiteList with success');
		ready_siteList = true;
	});
}

function get_WTRcoefficientsShipList() {
//	console.log('Enter get_WTRcoefficientsShipList');

	var sync_getCoefficientsShipList = new Promise (function (resolve, reject) {
		$.getJSON('js/coefficients.json', function(data) {
			if (data.status = 'ok') {
//				console.log(data);
				coefficientsList = data.expected;
//				console.log(coefficientsList);
//				console.log('Success get coefficients list');
				resolve();
			} else {
//				console.log('Fail get coefficients list %s', data.status);
				reject();
			}
		});
	});

	sync_getCoefficientsShipList.then ( function () {
//		console.log('Exit get_WTRcoefficientsShipList with success');
		ready_coefficients = true;
	});
}

function get_shipinfo(idArray) {
//	console.log('Enter get_shipinfo');

	var sync_getenv = new Promise (function (resolve, reject) {
		$.getJSON('/api/env', function(data) {
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
		document.getElementsByName( "user_own" )[i].style.display = idp;
	}
	var el = document.getElementsByName("user_buta");
	for (var i=0; i<el.length ; i++) {
		document.getElementsByName( "user_buta" )[i].style.display = buta;
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

function shipname_ex(val) {
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
	if (str.length < 20) {
		return(str);
	}
	return (str.substring(0,18)+"...");
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

// loading WTR coefficients table
get_WTRcoefficientsShipList();

// loading stats site list
get_statsSiteList();

var app = angular.module('wows-stats-plus', ['pascalprecht.translate','ngCookies']);

function getLanguage() {
//	console.log((navigator.languages[0] || navigator.browserLanguage || navigator.language || navigator.userLanguage).substr(0, 2));
	try {
		return ( navigator.browserLanguage || navigator.language || navigator.userLanguage).substr(0, 2);
	} catch (e) {
		return "en";
	}
}

function getClanInfoURL(clan_id) {
	if (clan_id != '') {
		var base_url = 'http://vzhabin.ru/US_WoWsStatInfo/clans.php?realm_search=';
		var detect_server = api_url.match(/^http:\/\/api\.worldofwarships\.(\w+)$/)[1];

		return base_url + detect_server + '&clan=' + clan_id;
	} else {
		return '';
	}
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
			if (!player.ship) {
				player.ship = {};
				player.ship.err = '';
			}

			if (!player.ship.hasOwnProperty('retry'))
				player.ship.retry = MAX_RETRY;

			if ((player.ship.retry > 0) && (player.ship.err == '')) {
				player.ship.retry--;
				api.fetchShip(player);
			} else {
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
					player.clan_uri = getClanInfoURL(player.clan_id);
					player.uri = api.getPlayerInfoURL(player.id, player.name);
					api.fetchShip(player);
				} else {
					// report the same error to ship since we can't fetch ship without playerId
					// but fetch ship information for Co-op battle bot
					angular.extend(player, player.api.response);
					player.ship.err = player.err;
					api.fetchShip(player);
				}
			} else {
				player.retry--;
				api.fetchPlayer(player);
			}
		});
	}

api.getPlayerInfoURL  = function(id, name) {
	var site_num = settingsCookie.statsSite;
	var base_array = statsSite_array[site_num];
	var base_uri = base_array.uri;
	var user_lang = getLanguage();
	var avarable_lang = 'en';

	var detect_server = api_url.match(/^http:\/\/api\.worldofwarships\.(\w+)$/)[1];
	if ((site_num == 4) && (detect_server == 'asia')) {
		detect_server = 'sea';
	}

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

	var encode_name = encodeURIComponent(name);

	var regExp_region = new RegExp('%%REGION%%', 'g');
	var regExp_lang = new RegExp('%%LANG%%', 'g');
	var regExp_id = new RegExp('%%ID%%', 'g');
	var regExp_name = new RegExp('%%NAME%%', 'g');
	var output_uri = base_uri.replace(regExp_region, detect_server) ;
	output_uri = output_uri.replace(regExp_lang, avarable_lang) ;
	output_uri = output_uri.replace(regExp_id, id) ;
	output_uri = output_uri.replace(regExp_name, name) ;
//	console.log(output_uri);

	return output_uri;
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
			if ((value === '－') || (value === '？')) {
					return 'cp_class0';
			} else {
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
				} else {
					return 'cp_class7';
				}
			}
			break;
		default:
			return null;
			break;
	}
}

api.w_beautify = function(type, value) {
	// colorization for WTR
	switch(type) {
		case "WTR":
			if	(value < 300) {
				return 'verybad_bg';
			}
			else if(value < 700) {
				return 'bad_bg';
			}
			else if(value < 900) {
				return 'belowaverage_bg';
			}
			else if(value < 1000) {
				return 'average_bg';
			}
			else if(value < 1100) {
				return 'good_bg';
			}
			else if(value < 1200) {
				return 'verygood_bg';
			}
			else if(value < 1400) {
				return 'great_bg';
			}
			else if(value < 1800) {
				return 'unicum_bg';
			}
			else {
				return 'superunicum_bg';
			}
			break;
		default:
			return null;
			break;
	}
}

api.p_beautify = function(type, value) {
	// colorization for PR
	switch(type) {
		case "PR":
			if(value < 750) {
				return 'pr_bad_bg';
			}
			else if(value < 1100) {
				return 'pr_belowaverage_bg';
			}
			else if(value < 1350) {
				return 'pr_average_bg';
			}
			else if(value < 1550) {
				return 'pr_good_bg';
			}
			else if(value < 1750) {
				return 'pr_verygood_bg';
			}
			else if(value < 2100) {
				return 'pr_great_bg';
			}
			else if(value < 2450) {
				return 'pr_unicum_bg';
			}
			else {
				return 'pr_superunicum_bg';
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
			if ((value === '－') || (value === '？')) {
				return 'highlight_normal';
			} else {
				if(value >= 150000) {
					return 'highlight_danger';
				} else if (value >= 0) {
					return 'highlight_normal';
				} else {
					return 'highlight_normal';
				}
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
				url: '/api/player?name=' + encodeURIComponent(player.name)
			}).success(function(data, status) {
				angular.extend(player, data);
				player.clan_uri = getClanInfoURL(player.clan_id);
				player.uri = api.getPlayerInfoURL(player.id, player.name);
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
			player.clan_uri = '';
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
			url: '/api/ship?playerId=' + player.id + '&shipId=' + player.shipId
		}).success(function(data, status) {
			var battles = parseInt(data.battles);
			var victories = "";
			var winRate = "";
			var survived = "";
			var kill = "";
			var death = "";
			var kakin = "";
			var svrate = "";
			var wtr = "";
			var pr = "";
			var combatPower = "";

			if ((data.noRecord !=  true) && (battles > 0)) {
				victories = parseInt(data.victories);
				winRate = (victories / battles * 100).toFixed(2);
				survived = parseInt(data.survived);
				kill = parseInt(data.destroyed);
				death = battles - survived;

				if (death == 0 && kill > 0) {
					kdRatio ="？";
					combatPower = "？";
				} else if(death == 0 && kill == 0) {
					kdRatio = "？";
					combatPower = "？";
				} else {
					var kdRatio = (kill / death).toFixed(2);
					if (kdRatio == 0) {
						combatPower ="？";
					} else {
						if (data.info.type == 'Battleship') {
							var type_param = 0.7;
						} else if (data.info.type == 'AirCarrier') {
							var type_param = 0.5;
						} else {
							var type_param = 1.0;
						}

						combatPower = (data.avgDmg*kdRatio*data.avgExp/800*(1-(0.03*data.info.tier))*type_param).toFixed(0);
					}
				}
			}

			if ((data.noRecord !=  true) && (battles > 0)) {
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

				if (parseInt(data.victories) >1 && (parseInt(data.battles) - parseInt(data.victories)) >1){
					var svwin;
					var svlose;
					if (parseInt(data.raw.pvp.survived_wins) == 0) {
						svwin = "－";
					} else {
						svwin = ((parseInt(data.raw.pvp.survived_wins))*100/parseInt(data.raw.pvp.wins)).toFixed(0) + "%";
					}
					if ((parseInt(data.raw.pvp.battles)-(parseInt(data.raw.pvp.wins))) == 0) {
						svlose = "－";
					} else {
						svlose = (((parseInt(data.raw.pvp.survived_battles))-(parseInt(data.raw.pvp.survived_wins)))*100/((parseInt(data.raw.pvp.battles))-(parseInt(data.raw.pvp.wins)))).toFixed(0) + "%";
					}
					svrate = svwin + " | " + svlose;
				}else{
					svrate = "－";
				}

				// WTR(WarshipsToday Rating) and PR(Personal Rating)
				var expected = {};
				if (coefficientsList != null) {
					for (key in coefficientsList) {
						if (coefficientsList[key].ship_id == player.shipId) {
							expected = coefficientsList[key];
//							console.log("player:%s list:%s", player.shipId, coefficientsList[key].ship_id);
							break;
						}
					}
				}
				if (expected != null) {
					var actual = {};
					actual.capture_points = parseFloat(data.raw.pvp.capture_points / data.raw.pvp.battles);
					actual.damage_dealt = parseFloat(data.raw.pvp.damage_dealt / data.raw.pvp.battles);
					actual.dropped_capture_points = parseFloat(data.raw.pvp.dropped_capture_points / data.raw.pvp.battles);
					actual.frags = parseFloat(data.raw.pvp.frags / data.raw.pvp.battles);
					actual.planes_killed = parseFloat(data.raw.pvp.planes_killed / data.raw.pvp.battles);
					actual.wins = parseFloat(data.raw.pvp.wins / data.raw.pvp.battles);
					wtr = calculateWarshipsTodayRating(expected, actual);
					pr = calculatePersonalRating(expected, actual);
//					console.log(wtr);
//					console.log(pr);
				} else {
					wtr = "－";
					pr = "－";
				}
			}

			if (data.info.is_premium != false){
				kakin ="℗";
			}

			if ((data.noRecord != true) && (battles > 0)) {
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
					"namefont": api.shipnamefont(countLength(data.name)),
					"namefont_trans": api.shipnamefont(countLength(api.shipnameTranslated(data.name))),
					"bgcolor": data.info.type+"_bg",
					"winRate": winRate + "%",
					"winRateClass": api.beautify("winRate", winRate),
					"WTR": myFormatNumber(parseInt(wtr)),
					"WTRClass": api.w_beautify("WTR", wtr),
					"PR": myFormatNumber(parseInt(pr)),
					"PRClass": api.p_beautify("PR", pr),
					"shfl": atkavg,
					"ftfl": sdkavg,
					"hitratem": hitm ,
					"hitratet": hitt ,
					"kdRatio": kdRatio,
					"battles": myFormatNumber(battles),
					"avgExp": myFormatNumber(data.avgExp),
					"avgDmg": myFormatNumber(data.avgDmg),
					"combatPower": myFormatNumber(combatPower),
					"combatPowerClass": api.b_beautify("combatPower", combatPower),
					"highlightClass": (player.is_private != true)? api.highlight("combatPower", combatPower):'highlight_private',
					"ownerClass": api.owner("owner", player.name),
					"svrate": svrate
				};
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
					"namefont": api.shipnamefont(countLength(ship_info.data[sid].name)),
					"namefont_trans": api.shipnamefont(countLength(api.shipnameTranslated(ship_info.data[sid].name))),
					"bgcolor": ship_info.data[sid].type+"_bg",
					"winRate": ((player.is_private != true) && (player.is_bot != true))? '－':'',
					"winRateClass": '',
					"WTR": ((player.is_private != true) && (player.is_bot != true))? '－':'',
					"WTRClass": '',
					"PR": ((player.is_private != true) && (player.is_bot != true))? '－':'',
					"PRClass": '',
					"shfl": ((player.is_private != true) && (player.is_bot != true))? '－':'',
					"ftfl": ((player.is_private != true) && (player.is_bot != true))? '－':'',
					"hitratem": '',
					"hitratet": '',
					"kdRatio": ((player.is_private != true) && (player.is_bot != true))? '－':'',
					"battles": ((player.is_private != true) && (player.is_bot != true))? '0':'',
					"avgExp": ((player.is_private != true) && (player.is_bot != true))? '－':'',
					"avgDmg": ((player.is_private != true) && (player.is_bot != true))? '－':'',
					"combatPower": ((player.is_private != true) && (player.is_bot != true))? '－':'',
					"combatPowerClass": '',
					"highlightClass": (player.is_private != true)? 'highlight_normal':'highlight_private',
					"ownerClass": '',
					"svrate": ((player.is_private != true) && (player.is_bot != true))? '－':''
				};
//				player.ship.err = "no battle record";
			}
			resolve(player);

		}).error(function(data, status) {
			var battles = "";
			var victories = "";
			var winRate = "";
			var survived = "";
			var kill = "";
			var death = "";
			var kakin = "";
			var svrate = "";
			var wtr = "";
			var pr = "";
			var combatPower = "";
			var sid = player.shipId;
			player.ship = {
				"shiptia_s": '',
				"shipty": '',
				"shiptype_s": '',
				"shiptype_alt": '',
				"shipnation_s": '',
				"shipnation_alt": '',
				"shipkakin": '',
				"name": '',
				"name_trans": '',
				"namefont" : '',
				"namefont_trans" : '',
				"bgcolor" : '',
				"winRate": ((player.is_private != true) && (player.is_bot != true))? '－':'',
				"winRateClass": '',
				"WTR": ((player.is_private != true) && (player.is_bot != true))? '－':'',
				"WTRClass": '',
				"PR": ((player.is_private != true) && (player.is_bot != true))? '－':'',
				"PRClass": '',
				"shfl" : ((player.is_private != true) && (player.is_bot != true))? '－':'',
				"ftfl" : ((player.is_private != true) && (player.is_bot != true))? '－':'',
				"hitratem" : '',
				"hitratet" : '',
				"kdRatio": ((player.is_private != true) && (player.is_bot != true))? '－':'',
				"battles": ((player.is_private != true) && (player.is_bot != true))? '0':'',
				"avgExp": ((player.is_private != true) && (player.is_bot != true))? '－':'',
				"avgDmg": ((player.is_private != true) && (player.is_bot != true))? '－':'',
				"combatPower": ((player.is_private != true) && (player.is_bot != true))? '－':'',
				"combatPowerClass": '',
				"highlightClass": (player.is_private != true)? 'highlight_normal':'highlight_private',
				"ownerClass": '',
				"svrate": ((player.is_private != true) && (player.is_bot != true))? '－':''
			};
			player.api.ship.response = data;
			player.api.ship.status = status;
			player.ship.err = "no battle record";
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
	$scope.lang_options = lang_array;
	$scope.site_options = site_array;
	$scope.lang_select = $translate.proposedLanguage();
	$scope.site_select = 0;
	$scope.captureFlag = capture_flag;
	$scope.site_select = 0;

	$.cookie.json = true;
	var tmpCookie = $.cookie('wsp-settings');
	if (tmpCookie != null) {
		if (Object.keys(tmpCookie).length != 0) {
//			console.log(tmpCookie);
			for (key in tmpCookie) {
				settingsCookie[key] = tmpCookie[key];
			}
		}
	}
	$scope.site_select = settingsCookie.statsSite;
//	console.log(settingsCookie.statsSite);

	// switch displaying data column
	var sc = settingsCookie.shipColumn;
	$scope.ship_colList = (new Array(16)).fill(0);
	for(var bit=16; bit>0; bit--) {
		$scope.ship_colList.push((sc & 1));
		sc >>>= 1;
	}
	$scope.ship_colList.reverse();
//	console.log($scope.ship_colList);
	$scope.player_colList = (new Array(16)).fill(0);
	var pc = settingsCookie.playerColumn;
	for(var bit=16; bit>0; bit--) {
		$scope.player_colList.push((pc & 1));
		pc >>>= 1;
	}
	$scope.player_colList.reverse();
//	console.log($scope.player_colList);

	// set colspan
	$scope.ship_span = $scope.ship_colList.reduce((a,x) => a+=x, 0);
	$scope.player_span = $scope.player_colList.reduce((a,x) => a+=x, 0);

	// switch column display
	$scope.disp_column = function (type, col) {
		var list = (type === 's')? $scope.ship_colList : $scope.player_colList;
		if (list[col] == 1) {
			return { 'display': 'table-cell' };
		} else {
			return { 'display': 'none' };
		}
	}

	$scope.pre_setting = function() {
		// set checkbox
//		console.log('Enter display settings.');
		$('input[name="s_items"]').each(function() {
			var s_pos = ($(this).val()).slice(2);
			$('#s_' + s_pos).prop('checked', false);
			if ($scope.ship_colList[s_pos] == 1) {
				$('#s_' + s_pos).prop('checked', true);
				$('#tr_s_' + s_pos).addClass('checked_tr');
//				console.log(s_pos);
			}
		});
		$('input[name="p_items"]').each(function() {
			var p_pos = ($(this).val()).slice(2);
			$('#p_' + p_pos).prop('checked', false);
			if ($scope.player_colList[p_pos] == 1) {
				$('#p_' + p_pos).prop('checked', true);
				$('#tr_p_' + p_pos).addClass('checked_tr');
//				console.log(p_pos);
			}
		});
		$scope.site_select = settingsCookie.statsSite;
	}

	// get checked settings for displaying data column with storing cookie
	$scope.apply_change = function () {
		var check_count_s = $('input[name="s_items"]:checked').length;
		var check_count_p = $('input[name="p_items"]:checked').length;
		if ((check_count_s >= 2) && (check_count_p >= 2)){
			$scope.ship_colList.fill(0);
			$('input[name="s_items"]:checked').each(function() {
				var s_pos = ($(this).val()).slice(2);
				$scope.ship_colList[s_pos] = 1;
			});
			$scope.player_colList.fill(0);
			$('input[name="p_items"]:checked').each(function() {
				var p_pos = ($(this).val()).slice(2);
				$scope.player_colList[p_pos] = 1;
			});

			$scope.ship_span = $scope.ship_colList.reduce((a,x) => a+=x, 0);
			$scope.player_span = $scope.player_colList.reduce((a,x) => a+=x, 0);

			// preparetion to store cookie
			var s_string = '';
			for (var i=0; i<16 ; i++) {
				s_string += $scope.ship_colList[i];
			}
			var p_string = '';
			for (var j=0; j<16 ; j++) {
				p_string += $scope.player_colList[j];
			}

			if ($scope.site_select != '') {
				settingsCookie.statsSite = $scope.site_select;
				if ($scope.players.length > 0) {
					for (var i=0; i<kariload.length; i++) {
						var player = kariload[i];
						$scope.players[i].api.player.uri = api.getPlayerInfoURL(player.id, player.name);
						$("a#link_" + i).attr('href', api.getPlayerInfoURL(player.id, player.name));
					}
				}
			}

			settingsCookie.shipColumn = parseInt(s_string, 2);
			settingsCookie.playerColumn = parseInt(p_string, 2);
			$.cookie('wsp-settings', settingsCookie, {expires: 60});
//			console.log(settingsCookie);
		}
	}

	// initialize traslation labels
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

	// handling language changer menu
	$scope.changeLanguage = function () {
		if ($scope.lang_select != '') {
			$translate.use($scope.lang_select);

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
				imgFilename = "wows_" + localeFormatDate($scope.dateTime, 'file', $scope.lang_select) + "_" + $scope.translated_gamemapname + "_" + $scope.translated_gameLogic +"_" + playerVehicle + ".png";
			}, function (translationId) {
				$scope.translated_gamemapname = translationId[mapstr];
				$scope.translated_gameLogic = ' ('+translationId[modestr]+')';
				if (reg.test($scope.mapDisplayName))
					$scope.translated_gameLogic = '';
				imgFilename = "wows_" + localeFormatDate($scope.dateTime, 'file', $scope.lang_select) + "_" + $scope.translated_gamemapname + "_" + $scope.translated_gameLogic +"_" + playerVehicle + ".png";
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

			$scope.battleTime = localeFormatDate($scope.dateTime, 'label', $scope.lang_select);

			if ((kariload.length > 0) && ($("input[name='knp']:checked").val() == 'nm_sw1')) {
			  	$scope.players.ship = [];
				for (var i=0; i<kariload.length; i++) {
					var sid = kariload[i].shipId;
					kariload[i].ship.namefont_trans = api.shipnamefont(countLength(api.shipnameTranslated(ship_info.data[sid].name)));
					$scope.players.ship.push(kariload[i].ship);
				}
			}
		}
	};

	var updateArena = function() {
		UpdateViewMode();

		$scope.captureFlag = capture_flag;

		// view handling after sync-loaded of languages.json & shipname covert table & stats site list & WTR expected data
		if (ready_lang && ready_shipTable &&  ready_siteList && ready_coefficients) {

		$http({
			method: 'GET',
			url: '/api/arena'
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

						$scope.$watch('lang_select', function(newValue, oldValue) {
							$translate(['map.' + $scope.mapDisplayName, 'mode.' + $scope.gameLogic]).then(function (translations) {
								$scope.translated_gamemapname = translations[mapstr];
								$scope.translated_gameLogic = ' ('+translations[modestr]+')';
								if (reg.test($scope.mapDisplayName))
									$scope.translated_gameLogic = '';
								imgFilename = "wows_" + localeFormatDate($scope.dateTime, 'file', $scope.lang_select) + "_" + $scope.translated_gamemapname + "_" + $scope.translated_gameLogic +"_" + playerVehicle + ".png";
							}, function (translationId) {
								$scope.translated_gamemapname = translationId[mapstr];
								$scope.translated_gameLogic = ' ('+translationId[modestr]+')';
								if (reg.test($scope.mapDisplayName))
									$scope.translated_gameLogic = '';
								imgFilename = "wows_" + localeFormatDate($scope.dateTime, 'file', $scope.lang_select) + "_" + $scope.translated_gamemapname + "_" + $scope.translated_gameLogic +"_" + playerVehicle + ".png";
							});
						});
						$scope.$watch('lang_select', function(newValue, oldValue) {
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
						$scope.battleTime = localeFormatDate($scope.dateTime, 'label', $scope.lang_select);

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
							if (player.is_bot != true)
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
			$scope.dateTime = "";
			$scope.inGame = false;
		});

	}

	}

	Interval_timer = setInterval(function() {
		$scope.$apply(updateArena);
	}, 2000);

	updateArena();
}]);
