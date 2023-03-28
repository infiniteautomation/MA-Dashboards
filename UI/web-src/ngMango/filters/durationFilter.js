/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import moment from 'moment-timezone';

/**
 * @ngdoc filter
 * @name ngMangoFilters.filter:maDuration
 * @function
 * @param {number} ms Milliseconds of duration to be converted to a moment duration object
 * @param {string} functionName Function name to be called on the moment duration object
 * @param {any} arg1 Argument 1 for the moment duration object function
 * @param {any} arg2 Argument 2 for the moment duration object function
 * @param {any} arg3 Argument 3 for the moment duration object function
 *
 *
 * @description
 * Converts an input in milliseconds to a momentJS <a href="http://momentjs.com/docs/#/durations/" target="_blank">duration</a>
 * object that defines a length of time.
 * - MomentJS duration methods can be called using the filter syntax to call functions: 
 *      - <code ng-non-bindable>67223455ms is {{67223455|maDuration:'humanize'}}</code>
 * - <a ui-sref="ui.helps.examples.basics.filters">View Filters Demo</a>
 */
function durationFilter(Util) {
    return Util.memoize(function(input, fnName) {
        const d = moment.duration(input);
        const fnArgs = Array.prototype.slice.call(arguments, 2);
        const fn = d[fnName];
        if (typeof fn !== 'function') return input;
        return fn.apply(d, fnArgs);
    });
}

durationFilter.$inject = ['maUtil'];
export default durationFilter;
