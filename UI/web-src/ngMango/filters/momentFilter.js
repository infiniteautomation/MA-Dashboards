/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import moment from 'moment-timezone';

/**
 * @ngdoc filter
 * @name ngMangoFilters.filter:maMoment
 * @function
 * @param {string|date|number} date to be converted to a moment object
 * @param {string} functionName Function name to be called on the moment object
 * @param {any} arg1 Argument 1 for the moment object function
 * @param {any} arg2 Argument 2 for the moment object function
 * @param {any} arg3 Argument 3 for the moment object function
 *
 * @description
 * Converts a timetamp to a <a href="http://momentjs.com/" target="_blank">momentJS</a> object that can be
 formatted and manipulated.
 * - Moment methods can be called using the filter syntax to call functions: 
 *      - <code ng-non-bindable>Three days from now is {{'now' | maMoment:'add':3:'days' | maMoment:'format':'LLL'}}</code>
 *      - <code ng-non-bindable>{{myPoint.time | maMoment:'format':'ll LTS'}}</code>
 * - <a ui-sref="ui.helps.examples.basics.filters">View Filters Demo</a>
 */
function momentFilter(Util) {
    return Util.memoize(function(input, fnName) {
        let m;
        if (input === '' || input == null || (typeof input === 'string' && input.toLowerCase().trim() === 'now')) {
            m = moment().milliseconds(0);
        } else {
            m = moment(input);
        }
        if (!m.isValid()) {
            return input;
        }
        const fnArgs = Array.prototype.slice.call(arguments, 2);
        const fn = m[fnName];
        if (typeof fn !== 'function') return input;
        return fn.apply(m, fnArgs);
    });
}

momentFilter.$inject = ['maUtil'];
export default momentFilter;
