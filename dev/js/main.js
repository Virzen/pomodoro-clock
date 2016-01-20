(function (doc, win) {
	'use strict';

	let $;

	helpers: {
		// ES6 `Array.from` polyfill
		if (!Array.from) {
			Array.from = function (pseudoArray) {
				return Array.prototype.slice.call(pseudoArray);
			};
		}

		// ES6 `Array.prototype.find` polyfill
		if (!Array.prototype.find) {
			Array.prototype.find = function (filterFunc) {
				return this.filter(filterFunc)[0];
			};
		}

		// universal query selector
		$ = function (selector, root = document) {
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
		let data = {
			timers: [
				{
					id: 0,
					name: 'pomodoro',
					duration: [25, 0]
				},
				{
					id: 1,
					name: 'short break',
					duration: [5, 0]
				},
				{
					id: 2,
					name: 'long break',
					duration: [20, 0]
				}
			],
			lastId: 2,
			currentTimer: null,
			currentTimerId: null,
			currentTimerInterval: null,
		};

		// DOM elements
		////////////////////////
		// containers
		let appBody = $('.app-body');
		let timer = $('.timer', appBody);
		let timersList = $('.timers-list', appBody);

		// elements
		let elems = {
			mainTimer: {
				name: $('.timer__name', timer),
				time: $('.timer__time', timer),
			},
			buttons: {
				start: $('.start-button', appBody),
				stop: $('.stop-button', appBody),
				reset: $('.reset-button', appBody),
			},
			timers: [],
		};

		// methods
		////////////////////////
		let setCurrentTimer = function (timerId, callback) {
			// TODO: validate timerId
			let timerIdNum = parseInt(timerId, 10);
			let currentTimer = data.timers.find(timer => timer.id === timerIdNum);

			data.currentTimerId = timerIdNum;
			data.currentTimer = Object.assign({}, currentTimer);

			if (callback) {
				callback();
			}
		};

		let startTimer = function (timerId = data.currentTimerId) {

		};

		let stopTimer = function (timerId = data.currentTimerId) {

		};

		let resetTimer = function (timerId = data.currentTimerId) {

		};

		let renderMainTimer = function (timerId = data.currentTimerId) {
			// search for timer object with given id
			let currentTimer = currentTimer ||
					data.timers.find(timer => timer.id === timerId);

			if (currentTimer) {
				// set name and time to currentTimer's ones
				elems.mainTimer.name.textContent = currentTimer.name;
				elems.mainTimer.time.textContent =
					`${currentTimer.duration[0] || '00'}:
					${currentTimer.duration[1] || '00'}`;

			} else {
				// display error
				// TODO: throw error
				console.error(`Timer with given id doesn't exist.`);
			}
		};

		let renderTimersListItem = function (item) {
			// create dom elements
			let li = doc.createElement('li');
			let button = doc.createElement('button');

			// add class and data value to the inner element
			button.classList.add('timers-list__item');
			button.dataset.timerId = item.id;

			// set inner element's text
			// example: `pomodoro (25:00)`
			button.textContent = `${item.name} (${item.duration[0] || '00'}:${item.duration[1] || '00'})`;

			// append inner element to the outer one, and outer one to the
			// container
			li.appendChild(button);
			timersList.appendChild(li);

			// add button to the elems object
			// FIXME: refactor this to callback passed as argument
			elems.timers.push(button);
		};

		let renderTimersList = function () {
			data.timers.forEach(renderTimersListItem);
		};

		let init = function () {
			// attach event listeners to clock controls
			elems.buttons.start.addEventListener('click', () => {startTimer();}, false);
			elems.buttons.stop.addEventListener('click', () => {stopTimer();}, false);
			elems.buttons.reset.addEventListener('click', () => {resetTimer();}, false);

			// render timers list from stored data
			// it also adds each element to elems.timers, so it's necessary for
			// the next step
			renderTimersList();

			// call setCurrentTimer on click on timers list's element and use
			// its data-timer-id as timer's id
			elems.timers.forEach(timer => {
				timer.addEventListener('click', ev => {
					setCurrentTimer(ev.target.dataset.timerId, renderMainTimer);
				});
			});

			// set default timer as current one and trigger initial rendering
			// of main timer
			setCurrentTimer(0, renderMainTimer)

		};


		// public part
		////////////////////////
		return {
			data: data,
			elems: elems,
			init: init,
		};
	}());

	win.app = app;
})(document, window);

app.init();
