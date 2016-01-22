(function (doc, win) {
	'use strict';

	// Helper functions and polyfills
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

		var isFunction = function (value) {
			if (value && typeof value === 'function') {
				return true;
			}
			else {
				return false;
			}
		};
	}

	// Timer object contructor
	// Tt attaches few methods and properties to objects from model, making
	// it easier to operate application
	// It is called in init function on all timers in model
	let timerConstr = function (spec) {
		let that = {};
		let name = spec.name;
		let duration = Array.from(spec.duration);
		let initialDuration = Array.from(spec.duration);
		let interval = 0;

		// Validate object properties
		let hasDurationNonNumberValues = spec.duration.some(value =>
			typeof value !== 'number');
		if (hasDurationNonNumberValues) {
			throw new Error(`Given object has invalid values.`);
		}

		// Object methods declaration
		// They will be attached to output object later
		// See: 'revealing module pattern'

		// Decrements timer's duration by one second at a time
		let decrementDuration = function () {
			// reverse array for easier access
			let arr = duration.reverse();
			let len = arr.length;

			// TODO: validate durArr

			// iterate through values in array
			for (let i = 0; i < len; i++) {
				// if current value (secs, mins, hours etc.) can be
				// lowered, do it and return
				if (arr[i] > 0) {
					arr[i] -= 1;
					duration = arr.reverse();
					return true;
				}
				// if it can't be lowered, see if the next one can
				// if so, set current one to 59 and let the loop decrement
				// next one in the next step
				else if (arr[i + 1] && arr[i + 1] > 0) {
					arr[i] = 59;
				}
			}

			// this means no value was lowered, none of the values is > 0
			return false;
		};

		// Decrements duration of timer each second
		// Sets `interval` property on object it is called from
		// Executes first callback each second and passes the second one to
		// function fired at timer's finish
		let startTimer = function (intervalCallback, endCallback) {
			interval = setInterval(() => {
				if (!decrementDuration()) {
					if (isFunction(endCallback)) {
						finishTimer(endCallback);
					}
					else {
						finishTimer();
					}
				}
				else {
					if (isFunction(intervalCallback)) {
						intervalCallback();
					}
					console.log('timer tick');
				}
			}, 10);
		};

		// Stops timer by clearing its interval and executes callback afterwards
		let stopTimer = function (callback) {
			if (interval) {
				clearInterval(interval);
			}

			if (isFunction(callback)) {
				callback();
			}
		};

		// Stops timer and resets it by setting duration value back to the
		// initial one, defined at the creation time
		// Executes callback (if any) afterwards
		let resetTimer = function (callback) {
			stopTimer();

			// Set initial duration as the current one
			// It is important to note that initial duration is being cloned
			// instead of being simply assigned. It has to be since assignement
			// would create reference to the initial value. That would cause any
			// change to the current duration be reflected in initial one,
			// rendering it unusable.
			duration = Array.from(initialDuration);

			if (isFunction(callback)) {
				callback();
			}
		};

		// Stops timer, optionally passing callback
		// Executed when timer reaches 00:00
		let finishTimer = function (callback) {
			if (isFunction(callback)) {
				stopTimer(callback);
			}
			else {
				stopTimer();
			}
		};


		// Assign public methods to the new object
		that = {
			get name() {
				return name;
			},
			get duration() {
				return duration;
			}
		};
		that.start = startTimer;
		that.stop = stopTimer;
		that.reset = resetTimer;


		// Return the new object
		return that;
	};


	// application's singleton
	let app = (function () {
		// Spp's model
		// An idea of this object is to be as independent as possible
		// It might be fetched through ajax or localStorage, so it should be
		// JSON compatible (e. g. no methods)
		let data = {
			timers: [
				{
					name: 'pomodoro',
					duration: [25, 0]
				},
				{
					name: 'short break',
					duration: [5, 0]
				},
				{
					name: 'long break',
					duration: [20, 0]
				}
			],
		};

		// State contains application-specific version of the data
		// That might mean objects from data with some added methods
		// Tt might synchronize raw data with model
		// It is initialized in init function
		let state = {
			timers: []
		};


		// DOM elements
		////////////////////////
		// Containers
		let appBody = $('.app-body');
		let mainTimer = $('.timer', appBody);
		let timersList = $('.timers-list', appBody);

		// Elements
		let elems = {
			mainTimer: {
				name: $('.timer__name', mainTimer),
				time: $('.timer__time', mainTimer),
			},
			buttons: {
				start: $('.start-button', appBody),
				stop: $('.stop-button', appBody),
				reset: $('.reset-button', appBody),
			},
			timers: [],
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

			if (isFunction(callback)) {
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
				let name = currentTimer.name;

				// turn numbers into strings and make all of them at least
				// 2 digits long (e. g. 2 -> '02')
				// TODO: move this to separate function
				let time = currentTimer.duration.map(value => {
					let strVal = String(value);
					return (strVal.length === 1) ? '0' + strVal : strVal;
				});

				// set name and time to currentTimer's ones
				elems.mainTimer.name.textContent = name;
				elems.mainTimer.time.textContent = `${time[0]}:${time[1]}`;

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
			state.timers.forEach(renderTimersListItem);
		};

		// TODO: Implement real signalization for timer end
		let signalizeTimerEnd = function () {
			alert('Timer ended!');
		};

		let init = function () {
			// initialize state
			data.timers.forEach(timer => {
				state.timers.push(timerConstr(timer));
			});

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
			timer: timer,
			init: init,
		};
	}());

	win.app = app;
})(document, window);

app.init();
