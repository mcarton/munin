/**
 * Main UI script
 *  This file is included in every page
 */

$(document).ready(function() {
	// Navigation toggle on tablets
	$('#navToggle').click(function() {
		var nav = $('#nav');

		if ($(this).hasClass('expanded')) {
			$(this).removeClass('expanded');
			nav.hide();
		} else {
			$(this).addClass('expanded');
			nav.show();
		}
	});

	// Hide filter input, will be shown
	// 	when implemented using prepareFilter
	$('#filter').parent().hide();
});

/**
 * Binds click listener on one switchable (with the data-switch="id" attribute)
 * @param switchId Switch name
 */
function prepareSwitchable(switchId) {
	var switchable = $('.switchable[data-switch=' + switchId + ']');

	switchable.click(function() {
		var switchableContent = $('.switchable_content[data-switch=' + switchId + ']');

		if (switchableContent.is(':visible')) {
			switchableContent.hide();
			return;
		}

		switchableContent.css('left', $(this).position().left);
		switchableContent.css('top', $(this).position().top + $(this).height() + 10);
		switchableContent.show();

		// When clicking outside, hide the div
		$(document).bind('mouseup.switchable', function(e) {
			if (!switchableContent.is(e.target) // If we're neither clicking on switchableContent
				&& switchableContent.has(e.target).length === 0
				&& !switchable.is(e.target) // Same for switchable
				&& switchableContent.has(e.target).length === 0) { // nor on a descendent
				switchableContent.hide();

				// Unbind this event
				$(document).unbind('click.switchable');
			}
		});
	});

	// Gray out current element in switchable_content
	$('.switchable_content[data-switch=' + switchId + ']').children().filter(function() {
		return trim(switchable.text()) == trim($(this).text());
	}).addClass('current');
}

/**
 * Called by each page to setup header filter
 * @param placeholder Input placeholder
 * @param onFilterChange Called each time the input text changes
 */
function prepareFilter(placeholder, onFilterChange) {
	var input = $('#filter');

	// Show the filter input
	input.parent().show();

	// Set placeholder
	input.attr('placeholder', placeholder);

	input.on('keyup', function() {
		var val = $(this).val();

		if (val != '')
			$('#cancelFilter').show();
		else
			$('#cancelFilter').hide();

		onFilterChange(val);
		updateFilterInURL();
	});

	$('#cancelFilter').click(function() {
		input.val('');
		$(this).hide();
		onFilterChange('');
		updateFilterInURL();
	});

	// Register ESC key: same action as cancel filter
	$(document).keyup(function(e) {
		if (e.keyCode == 27 && input.is(':focus') && input.val().length > 0)
			$('#cancelFilter').click();
	});

	// There may be a 'filter' GET parameter in URL: let's apply it
	var qs = new Querystring();
	if (qs.contains('filter')) {
		input.val(qs.get('filter'));
		// Manually trigger the keyUp event on filter input
		input.keyup();
	}
}

/**
 * Returns true whenever a result matches the filter expression
 * @param filterExpr User-typed expression
 * @param result Candidate
 */
function filterMatches(filterExpr, result) {
	return sanitizeFilter(result).indexOf(sanitizeFilter(filterExpr)) != -1;
}

/**
 * Transforms a string to weaken filter
 * 	(= get more filter results)
 * @param filterExpr
 */
function sanitizeFilter(filterExpr) {
	return filterExpr.toLowerCase().trim();
}

/**
 * Adds or updates current filter as GET parameter in URL
 */
function updateFilterInURL() {
	// Put the filter query in the URL (to keep it when refreshing the page)
	var query = $('#filter').val();

	saveState('filter', query);
}

/**
 * Saves a var in URL
 * @param key
 * @param val
 */
function saveState(key, val) {
	// Check if history.pushState is supported by user's browser
	if (!history.pushState)
		return;
	
	// Encode key=val in URL
	var qs = new Querystring();
	qs.set(key, val);

	// Replace URL
	var url = $.param(qs.params);
	var pageName = $(document).find('title').text();
	window.history.replaceState('', pageName, '?' + url);
}

/* Tooltips */
/**
 * Prepares tooltips for current page
 * @param hoverableElements Each element that triggers tooltip fadeIn
 * @param getTooltip Function that returns tooltip for 1st parameter element
 */
function prepareTooltips(hoverableElements, getTooltip) {
    hoverableElements.mouseenter(function() {
        var tooltip = getTooltip($(this));
        var bottom = $(this).position().top + $(this).outerHeight(true);
        tooltip.css('top', bottom);

        if (!tooltip.is('[data-dontsetleft]')) {
            var left = $(this).position().left + $(this).outerWidth() / 2;
            tooltip.css('left', left);
        }
        tooltip.fadeIn(100);
    });
    hoverableElements.mouseleave(function() {
        getTooltip($(this)).fadeOut(100);
    });
}

/**
 * Prepares a modal to be shown later
 */
function prepareModal(modalId, modalHTMLContent) {
	var body = $('body');
	body.append('<div class="modal" data-modalname="' + modalId + '" style="display: none;">'
					+ '<div class="title" style="display:none">'
					+ '    <span></span>'
					+ '    <a href="#close" class="action close"></a>'
					+ '    <a href="#" class="action open" id="modal' + modalId + '-open" style="display: none;"></a>'
					+ '</div>'
					+ modalHTMLContent
				+ '</div>');
	body.append('<div class="modalMask" data-modalname="' + modalId + '" style="display: none;"></div>');

	var modal = $('.modal[data-modalname=' + modalId + ']');

	// Register mask click event to hide the modal...
	$('.modalMask[data-modalname=' + modalId + ']').click(function() {
		hideModal(modalId);
	});
	// ... and also the modal title close button
	modal.find('.title > a.close').click(function(e) {
		e.preventDefault();
		hideModal(modalId);
	});

	return modal;
}

function setModalTitle(modalId, modalTitle) {
	var titleBar = $('[data-modalname=' + modalId + ']').find('.title');
	titleBar.find('span').text(modalTitle);
	titleBar.show();
}

function setModalOpenTarget(modalId, modalTitleOpenTarget) {
	var openLink = $('[data-modalname=' + modalId + ']').find('.open');
	openLink.attr('href', modalTitleOpenTarget);
	openLink.show();
}

function showModal(modalId) {
	// Show modal and mask
	$('[data-modalname=' + modalId + ']').show();

	// Reduce modal size if necessary
	adjustModalSize(modalId);

	// Register ESC keypress to hide the modal
	$(document).on('keyup.modal', function(e) {
		if (e.keyCode == 27)
			hideModal(modalId);
	});
}

/**
 * Reduce modal size if its width/height is wider than available space
 * @param modalId
 */
function adjustModalSize(modalId) {
	var modalMaxWidth = 900;
	var modalMaxHeight = 630;

	var modal = $('.modal[data-modalname=' + modalId + ']');
	modal.css('width', Math.min(modalMaxWidth, $(window).width()));
	modal.css('height', Math.min(modalMaxHeight), $(window).height());
}

function hideModal(modalId) {
	// Hide modal and mask
	$('[data-modalname=' + modalId + ']').hide();

	// Unregister ESC keypress event
	$(document).off('keyup.modal');
}

function trim(str) {
	return str.replace(/^\s+|\s+$/gm,'');
}
