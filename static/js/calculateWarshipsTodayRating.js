var calculateWarshipsTodayRating = function(expected, actual) {
	var wins = actual.wins / expected.wins;
	var damage_dealt = actual.damage_dealt / expected.damage_dealt;
	var ship_frags = actual.frags / expected.frags;
	var capture_points = actual.capture_points / expected.capture_points;
	var dropped_capture_points = actual.dropped_capture_points / expected.dropped_capture_points;
	var planes_killed = actual.planes_killed / expected.planes_killed;
	var ship_frags_importance_weight = 10;
	var frags = 1.0;

	// fallback to avoid division by zero
	if (expected.planes_killed + expected.frags > 0) {
		// this should be happening virtually always
		var aircraft_frags_coef = expected.planes_killed / (expected.planes_killed + ship_frags_importance_weight * expected.frags);
		var ship_frags_coef = 1 - aircraft_frags_coef;
		if (aircraft_frags_coef == 1) {
			frags = planes_killed
		} else if (ship_frags_coef == 1) {
			frags = ship_frags;
		} else {
			frags = ship_frags * ship_frags_coef + planes_killed * aircraft_frags_coef;
		}
	}

	var average_level = actual.tier_points / actual.battles;
	var wins_weight = 0.2;
	var damage_weight = 0.5;
	var frags_weight = 0.3;
	var capture_weight = 0.0;
	var dropped_capture_weight = 0.0;

	var fixNaN = function(value) {
		if (isNaN(value)) {
			return 0;
		} else {
			return value;
		}
	};

	var wtr = fixNaN(wins) * wins_weight + fixNaN(damage_dealt) * damage_weight + fixNaN(frags) * frags_weight + fixNaN(capture_points) * capture_weight + fixNaN(dropped_capture_points) * dropped_capture_weight;
	var nominal_rating = 1000.0;

	var adjust = function(value, average_level, base) {
		var neutral_level = 7.5;
		var per_level_bonus = 0.1;
		var adjusted_base = Math.min(value, base);
		var for_adjusting = Math.max(0, value - base);
		var coef = 1 + (average_level - neutral_level) * per_level_bonus;
		return adjusted_base + for_adjusting * coef;
	};

	return adjust(wtr * nominal_rating, average_level, nominal_rating);
};
