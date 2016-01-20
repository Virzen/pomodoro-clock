(function (doc, win) {
	'use strict';

	helpers: {
		// ES6 `Array.from` polyfill
		if (!Array.from) {
			Array.from = function (pseudoArray) {
				return Array.prototype.slice.call(pseudoArray);
			};
		}

		// `Array.prototype.find` polyfill
		if (!Array.prototype.find) {
			Array.prototype.find = function (filterFunc) {
				return this.filter(filterFunc)[0];
			};
		}

		// universal query selector
		var $ = function (selector, root = document) {
			if (selector) {
				let elements = root.querySelectorAll(selector);
				return (elements.length === 1) ?
				elements[0] :
				Array.from(elements);
			}
			else {
				return null;
			}
		};
	}

	// application's singleton
	let app = (function () {
		// private part
		let data = {
			timers: [
				{
					id: 0,
					name: 'pomodoro',
					length: [25, 0]
				},
				{
					id: 1,
					name: 'short break',
					length: [5, 0]
				},
				{
					id: 2,
					name: 'long break',
					length: [20, 0]
				}
			],
			lastId: 2,
			currentTimerId: 0,
		};

		let appBody = $('.app-body');
		let elems = {
			timer: $('.timer', appBody),
			timersList: $('.timers-list', appBody),
			buttons: {
				startStop: $('start-stop-button', appBody),
				reset: $('reset-button', appBody),
			},
		};


		// public part
		return {

		};
	}());

	win.app = app;
})(document, window);
