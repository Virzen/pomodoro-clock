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
		};

		let state = {
			currentTimer: null
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

		// controller
		////////////////////////
		let decrementDuration = function (durArr) {
			// reverse array for easier access
			let revArr = durArr.reverse();
			let len = revArr.length;

			// TODO: validate durArr

			for (let i = 0; i < len; i++) {
				if (revArr[i] > 0) {
					revArr[i] -= 1;
					durArr = revArr.reverse();
					return true;
				}
				else if (revArr[i + 1] && revArr[i + 1] > 0) {
					revArr[i] = 59;
				}
			}

			return false;
		};

		// TODO: Implement real signalization for timer end
		let signalizeTimerEnd = function () {
			alert('Timer ended!');
		};

		let setCurrentTimer = function (timerId, callback = renderMainTimer) {
			// TODO: validate timerId
			let timerIdNum = parseInt(timerId, 10);
			let currentTimer = data.timers.find(timer => timer.id === timerIdNum);

			// copy timer object to state object
			state.currentTimer = Object.assign({}, currentTimer);

			// in result of the operation above, `duration` array is assigned
			// instead of copied, so `state.currentTimer.duration` contains
			// just a reference to the `currentTimer.duration`
			// this behaviour is undesirable, so the line below overrides
			// the referenced array to a copied one
			state.currentTimer.duration = Array.from(currentTimer.duration);

			if (callback) {
				callback();
			}
		};

		let stopTimer = function () {
			// stop current timer by clearing its interval
			if (state.currentTimer.interval) {
				clearInterval(state.currentTimer.interval);
			}
		};

		let endTimer = function () {
			stopTimer();
			signalizeTimerEnd();
		};

		let startTimer = function (timerId, callback = renderMainTimer) {
			// let currentTimer = (timerId) ?
			// 		data.timers.find(timer => timer.id === timerId) :
			// 		state.currentTimer;

			// TODO: validate duration array

			state.currentTimer.interval = setInterval(() => {
				if (!decrementDuration(state.currentTimer.duration)) {
					endTimer();
				}
				else {
					if (callback) {
						callback();
					}
				}
			}, 10);
		};

		let resetTimer = function (timerId = state.currentTimer.id, callback = renderMainTimer) {
			stopTimer();

			// find prototype of the current timer by id
			let currentTimerProto = data.timers.find(timer => timer.id === timerId);

			// set current timer's duration to its protoype's one
			state.currentTimer.duration = Array.from(currentTimerProto.duration);

			if (callback) {
				callback();
			}
		};

		// view
		//////////////////////////
		let renderMainTimer = function (timerId = state.currentTimer.id) {
			// use current timer or search for timer object with given id
			let currentTimer = state.currentTimer ||
					data.timers.find(timer => timer.id === timerId);

			if (currentTimer) {
				// set name and time to currentTimer's ones
				elems.mainTimer.name.textContent = currentTimer.name;
				elems.mainTimer.time.textContent =
					`${state.currentTimer.duration[0] || '00'}:
					${state.currentTimer.duration[1] || '00'}`;

			} else {
				throw new Error(`Given timer doesn't exist.`);
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
			// FIXME: refactor this to be callback passed as argument
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
					setCurrentTimer(ev.target.dataset.timerId);
				});
			});

			// set default timer as current one and trigger initial rendering
			// of main timer (default callback)
			setCurrentTimer(0);

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
