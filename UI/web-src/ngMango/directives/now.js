/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import moment from 'moment-timezone';

/**
 * @ngdoc directive
 * @name ngMango.directive:maNow
 * @restrict E
 * @description
 * `<ma-now update-interval="1 SECONDS" output="time"></ma-now>`
 * - This directive will output the current browser time as a Moment.js date object.
 * - <a ui-sref="ui.helps.examples.basics.clocksAndTimezones">View Demo</a>
 *
 * @param {expression} output Assignable expression to output the date.
 * @param {boolean=} browserTimezone set to the browsers timezone (guessed)
 * @param {string} update-interval The date will update on this given interval.
 Format the interval duration as a string starting with a number followed by one of these units:
<ul>
    <li>years</li>
    <li>months</li>
    <li>weeks</li>
    <li>days</li>
    <li>hours</li>
    <li>minutes</li>
    <li>seconds</li>
    <li>milliseconds</li>
</ul>
 * @param {string} time-zone The output date will have the given timezone.
 * @param {expression=} on-change Expression which is evaluated when the time updates.
 *     Available scope parameters are `$value` (contains the current time as a moment object) and `$firstTick` (true on the first run).
 *
 * @usage
 * <ma-now update-interval="1 SECONDS" output="time"></ma-now>
 * <ma-clock style="width: 100%; height: 200px;" time="time1" text="Browser timezone">
</ma-clock>
 *
 */
now.$inject = ['maUtil', '$interval'];
function now(maUtil, $interval) {
    
    const parseUpdateInterval = function parseUpdateInterval(updateInterval) {
        if (maUtil.isEmpty(updateInterval)) return;
        const parts = updateInterval.split(' ');
        if (parts.length < 2) return;
        if (maUtil.isEmpty(parts[0]) || maUtil.isEmpty(parts[1])) return;

        const duration = moment.duration(parseFloat(parts[0]), parts[1]);
        return duration.asMilliseconds();
    };
    
    class NowController {
        static get $$ngIsClass() { return true; }
        
        $onInit() {
            this.browserTimezone = moment.tz.guess();
            
        }

        $onChanges(changes) {
            if (changes.updateInterval) {
                this.startUpdateTimer();
            }
        }

        $onDestroy() {
            this.cancelUpdateTimer();
        }

        startUpdateTimer() {
            this.cancelUpdateTimer();
            this.doUpdate(true);

            const millis = parseUpdateInterval(this.updateInterval);

            // dont allow continuous loops
            if (!millis) return;

            this.intervalPromise = $interval(() => this.doUpdate(), millis);
        }

        cancelUpdateTimer() {
            if (this.intervalPromise) {
                $interval.cancel(this.intervalPromise);
                this.intervalPromise = null;
            }
        }
        
        doUpdate(firstTick = false) {
            const m = moment();
            if (this.timeZone) {
                m.tz(this.timeZone);
            }
            this.output = m;
            if (this.onChange) {
                this.onChange({$value: m, $firstTick: firstTick});
            }
        }
    }
    
    return {
        scope: {
            output: '=?',
            browserTimezone: '=?',
            updateInterval: '@',
            timeZone: '@',
            onChange: '&?'
        },
        restrict: 'E',
        controllerAs: '$ctrl',
        bindToController: true,
        controller: NowController,
        designerInfo: {
            translation: 'ui.components.maNow',
            icon: 'av_timer'
        }
    };
}

export default now;
