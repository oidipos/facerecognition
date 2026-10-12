/*
 * @license GNU AGPL version 3 or any later version
 */

/**
 * Nextcloud 34 no longer ships jQuery, nor the core octemplate and ocdialog
 * jQuery plugins. Bundle jQuery and provide the small subset of those plugins
 * used by FrDialogs.
 */
import { getRequestToken } from '@nextcloud/auth'
import $ from 'jquery'

// Like core jQuery did, send the CSRF token with every same-origin request.
$(document).on('ajaxSend', function (event, xhr, settings) {
	if (settings.crossDomain === false) {
		xhr.setRequestHeader('requesttoken', getRequestToken());
		xhr.setRequestHeader('OCS-APIREQUEST', 'true');
	}
});

function escapeHTML (text) {
	return text.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/**
 * Replace the {key} placeholders of the element html with the escaped vars.
 */
$.fn.octemplate = function (vars) {
	var html = this.get(0).outerHTML.replace(/{([^{}]*)}/g, function (match, key) {
		var value = vars[key];
		if (typeof value === 'string') {
			return escapeHTML(value);
		}
		return typeof value === 'number' ? value : match;
	});
	return $(html);
};

/**
 * Show the element in a modal dialog, or close it with ocdialog('close').
 */
$.fn.ocdialog = function (options) {
	var $content = this.first();
	if (options === 'close') {
		var closeDialog = $content.data('ocdialog-close');
		if (closeDialog !== undefined) {
			closeDialog();
		}
		return this;
	}

	var $dialog = $('<dialog class="fr-dialog"/>').insertBefore($content);
	$('<h2 class="fr-dialog-title"/>').text($content.attr('title')).appendTo($dialog);
	$content.removeAttr('title').appendTo($dialog);

	var $buttonrow = $('<div class="fr-dialog-buttonrow"/>').appendTo($dialog);
	for (var button of options.buttons) {
		$('<button type="button"/>')
			.text(button.text)
			.toggleClass('primary', button.defaultButton === true)
			.on('click', button.click)
			.appendTo($buttonrow);
	}

	// Like core ocdialog, Enter on the only input clicks the default button.
	var $input = $content.find('input');
	if ($input.length === 1) {
		$input.on('keydown', function (event) {
			if (event.key === 'Enter') {
				$buttonrow.find('button.primary').trigger('click');
			}
		});
	}

	// Like core ocdialog, remove the dialog right away but run the close
	// callback only after the button handler that closed it.
	var closed = false;
	var close = function () {
		if (closed) {
			return;
		}
		closed = true;
		$dialog.get(0).close();
		$dialog.remove();
		if (options.close !== undefined) {
			setTimeout(options.close, 0);
		}
	};
	$content.data('ocdialog-close', close);

	$dialog.on('cancel', function (event) {
		event.preventDefault();
		if (options.closeOnEscape) {
			close();
		}
	});
	$dialog.on('close', close);

	$dialog.get(0).showModal();
	return this;
};

export default $;
