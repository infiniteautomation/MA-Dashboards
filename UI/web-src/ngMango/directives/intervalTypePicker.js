/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

/**
 * @ngdoc directive
 * @name ngMango.directive:maIntervalTypePicker
 *
 * @description
 * `<ma-interval-type-picker ng-model="updateIntervalType" ng-init="updateIntervalType='MINUTES'"></ma-interval-type-picker>`
 * - This directive generates a dropdown selector for choosing the various interval types to be used with `<ma-date-range-picker>` `update-interval` property.
 * - Also used with `<ma-point-values>` `rollup-interval` property.
 * - Note that in the example below we are also setting the interval duration using a numeric input
 * - <a ui-sref="ui.helps.examples.charts.advancedChart">View Demo</a>
 *
 * @param {object} ng-model The variable to hold the selected interval type
 * @param {expression=} ng-init If provided you can set the `ng-model` variable to one of these strings to set the default selected value (See usage example):
 <ul>
     <li>SECONDS</li>
     <li>MINUTES</li>
     <li>HOURS</li>
     <li>DAYS</li>
     <li>WEEKS</li>
     <li>MONTHS</li>
     <li>YEARS</li>
 <ul>
 *
 * @usage
 <md-input-container>
    <label>Update interval</label>
    <input type="number" step="1" min="1" ng-model="updateInterval" ng-init="updateInterval=1">
 </md-input-container>
 <md-input-container>
      <label>Interval type</label>
     <ma-interval-type-picker ng-model="updateIntervalType" ng-init="updateIntervalType='MINUTES'"></ma-interval-type-picker>
 </md-input-container>
 <md-input-container>
     <label>Date range preset</label>
     <ma-date-range-picker from="from" to="to" preset="LAST_30_MINUTES" update-interval="{{updateInterval}} {{updateIntervalType}}"></ma-date-range-picker>
 </md-input-container>
 *
 */

intervalTypePicker.$inject = ['$injector', 'MA_TIME_PERIOD_TYPES'];
function intervalTypePicker($injector, MA_TIME_PERIOD_TYPES) {
    return {
        restrict: 'E',
        scope: {},
        replace: true,
        require: 'ngModel',
        template: function() {
            if ($injector.has('$mdpDatePicker')) {
                return `
                    <md-select>
                        <md-option ng-value="t.type" ng-repeat="t in types track by t.type"><span ma-tr="{{t.translation}}"></span></md-option>
                    </md-select>`;
            }
            return `<select ng-options="t.type as (t.translation | maTr) for t in types track by t.type"></select>`;
        },
        link: function ($scope, $element, attr) {
            $scope.types = MA_TIME_PERIOD_TYPES;
        },
        designerInfo: {
            translation: 'ui.components.intervalTypePicker',
            icon: 'date_range'
        }
    };
}

export default intervalTypePicker;