/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import moment from 'moment';

/**
 * @ngdoc directive
 * @name ngMango.directive:maDatePicker
 *
 * @description
 * `<ma-date-picker ng-model="time"></ma-date-picker>`
 * - Use the `<ma-date-picker>` directive to display a date/time picker.
 * - Often used in conjunction with `<ma-date-range-picker>`
 * - <a ui-sref="ui.helps.examples.basics.datePresets">View Demo</a>
 * @param {object} ng-model The variable to hold the resulting timestamp
 * @param {string=} format Specifies the formatting of the date/time within the input (using [momentJs](http://momentjs.com/) formatting)
 * @param {string=} timezone Specifies the timezone
 * @param {string=} mode Specify whether to use the date picker to set `date`, `time`, or `both` for both date and time.
 * @param {boolean=} auto-switch-time Whether or not time picker will automatically switch to minute select after selecting
 * hour on clock. (defaults to `true`)
 *
 * @usage
 * <md-input-container>
       <label>From date</label>
       <ma-date-picker ng-model="from" format="MMM-Do-YY" mode="date"></ma-date-picker>
  </md-input-container>
  <md-input-container>
       <label>To date</label>
       <ma-date-picker ng-model="to" format="MMM-Do-YY" mode="date"></ma-date-picker>
  </md-input-container>
 */

datePicker.$inject = ['$injector', 'MA_DATE_FORMATS', '$q'];
function datePicker($injector, mangoDateFormats, $q) {
    return {
        restrict: 'E',
        designerInfo: {
            translation: 'ui.components.datePicker',
            icon: 'date_range',
            category: 'timeAndDate',
            attributes: {
                mode: {options: ['date', 'time', 'both']}
            }
        },
        scope: {
            format: '@',
            timezone: '@',
            mode: '@',
            autoSwitchTime: '<?'
        },
        require: 'ngModel',
        replace: true,
        template: function() {
            if ($injector.has('$mdpDatePicker')) {
                return '<input type="text" ng-click="showPicker($event)">';
            }
            return '<input type="text">';
        },
        compile: function($element, attributes) {
            return link;
        }
    };

    function link($scope, $element, attrs, ngModel) {
        
        $scope.getFormat = function getFormat() {
            if ($scope.format) {
                return mangoDateFormats[$scope.format] || $scope.format;
            } else if ($scope.mode === 'date') {
                return mangoDateFormats.date;
            } else if ($scope.mode === 'time') {
                return mangoDateFormats.time;
            } else {
                return mangoDateFormats.dateTimeSeconds;
            }
        };
        
        $scope.$watch('format + timezone', function(newVal, oldVal) {
            if (newVal === oldVal) return;
            ngModel.$processModelValue();
        });
        
        // formatter converts from Date ($modelValue) into String ($viewValue)
        ngModel.$formatters.push(function(value) {
            if (moment.isDate(value) || moment.isMoment(value)) {
                const m = moment(value);
                if ($scope.timezone) {
                    m.tz($scope.timezone);
                }
                return m.format($scope.getFormat());
            }
            return value;
        });

        // parser converts from String ($viewValue) into Date ($modelValue)
        ngModel.$parsers.push(function(value) {
            if (typeof value === 'string') {
                const initialDate = moment(ngModel.$modelValue);
                let m;
                if ($scope.timezone) {
                    initialDate.tz($scope.timezone);
                    m = moment.tz(value, $scope.getFormat(), true, $scope.timezone);
                } else {
                    m = moment(value, $scope.getFormat(), true);
                }
                
                if ($scope.mode === 'date') {
                    m.hours(initialDate.hours());
                    m.minutes(initialDate.minutes());
                    m.seconds(initialDate.seconds());
                    m.milliseconds(initialDate.milliseconds());
                } else if ($scope.mode === 'time') {
                    m.date(initialDate.date());
                    m.month(initialDate.month());
                    m.year(initialDate.year());
                }
                
                if (m.isValid())
                    return m.toDate();
            }
            return value;
        });

        if ($injector.has('$mdpDatePicker')) {
            const $mdpDatePicker = $injector.get('$mdpDatePicker');
            const $mdpTimePicker = $injector.get('$mdpTimePicker');

            $scope.showPicker = function showPicker(ev) {
                if (ev.altKey) return;
                
                const autoSwitchTime = $scope.autoSwitchTime === undefined ? true : $scope.autoSwitchTime;
                let initialDate;
                
                if ($scope.timezone) {
                    const m = moment(ngModel.$modelValue);
                    const defaultMomentOffset = m.utcOffset();
                    initialDate = m.tz($scope.timezone).utcOffset(defaultMomentOffset, true).toDate();
                } else {
                    initialDate = ngModel.$modelValue;
                }

                let promise;
                if (!$scope.mode || $scope.mode === 'both' || $scope.mode === 'date') {
                    promise = $mdpDatePicker(initialDate, {
                        targetEvent: ev
                    });
                } else {
                    promise = $q.when(initialDate);
                }
                
                if (!$scope.mode || $scope.mode === 'both' || $scope.mode === 'time') {
                    promise = promise.then(function(date) {
                        return $mdpTimePicker(date, {
                            targetEvent: ev,
                            autoSwitch: autoSwitchTime
                        });
                    });
                }
                
                promise.then(function(date) {
                    const stringValue = moment(date).format($scope.getFormat());
                    ngModel.$setViewValue(stringValue, ev);
                    ngModel.$render();
                });
            };
        }
    }
}

export default datePicker;
