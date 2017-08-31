$(function() {
	// Add CSS to adjust window width by checking width of scrollbar
	var width = window.innerWidth - document.body.clientWidth;
	var newStyle = document.createElement('style');
	document.head.appendChild(newStyle);
	newStyle.sheet.insertRule('body.enabled_modal { overflow: hidden; }', 0);
	newStyle.sheet.insertRule('body.enabled_modal .fixedlay { padding-right: ' + (width) + 'px; }', 1);

	// Open modal window
	$(document).on('open', '.modalwindow', function() {
		$(this).addClass('is_visible').show().animate({
			opacity: 1
		}, 200).scrollTop(0);
		$('body').addClass('enabled_modal');
	});

	// Close modal window
	$(document).on('close', '.modalwindow:not(.lock)', function() {
		$(this).removeClass('is_visible').animate({
			opacity: 0
		}, 200, function() {
			$(this).hide();
			$('body').removeClass('enabled_modal');
		});
	});

	// when click data-openmodal (open)
	$(document).on('click', '[data-openmodal]', function(e) {
		var targetID = $(this).attr('data-openmodal');
		$('#' + targetID).trigger('open');
	});

	// when click data-openmodal (close)
	$(document).on('click', '[data-closemodal]', function(e) {
		var targetID = $(this).attr('data-closemodal');
		$('#' + targetID).trigger('close');

	});

	// when click overlay (close)
	$(document).on('click', '.modalwindow:not(.no_overlay_close)', function(e) {
		if (e.currentTarget === e.target) {
			$(this).trigger('close');
		}
	});
});
