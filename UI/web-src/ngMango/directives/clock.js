/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import moment from 'moment-timezone';

 /**
  * @ngdoc directive
  * @name ngMango.directive:maClock
  * @restrict E
  * @description
  * `<ma-clock time="" timezone="" text=""></ma-clock>`
  * - This directive will display an analog style clock.
  * - Note, you will need to set a width and height on the element.
  * - <a ui-sref="ui.helps.examples.basics.clocksAndTimezones">View Demo</a>
  *
  * @param {string} time Takes in a timestamp. The current live time can be provided by the `<ma-now>` directive.
  *     The timestamp can be later be filtered with [momentJs](http://momentjs.com/) to display as a formatted date/time on the page.
  * @param {string=} timezone If provided, will switch which timezone used for displaying the current time.
  *     Can be set as a [TZ string](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) or you can use the timezone of the user
  currently logged into Mango (by evaluating the expression `{{user.getTimezone()}}` to return a string).
  * @param {string=} text Sets the label text
  * @param {boolean=} show-seconds Turns seconds hand on off. (Defaults to `true`)
  * @param {object=} options extend AmCharts configuration object for customizing design of the clock (see [amCharts](https://www.amcharts.com/demos/clock/))
  *
  * @usage
  * <ma-now update-interval="1 SECONDS" output="time"></ma-now>
  * <ma-clock style="width: 100%; height: 200px;" time="time" text="Browser timezone"></ma-clock>
  * <ma-clock style="width: 100%; height: 200px;" time="time" timezone="{{user.getTimezone()}}" text="User timezone"></ma-clock>
  * <ma-clock style="width: 100%; height: 200px;" time="time" timezone="Australia/Sydney" text="Sydney"></ma-clock>
  * <span>{{time|maMoment:'format':'ll LTS Z'}}</span>
  *
  */
clock.$inject = ['MA_DATE_FORMATS', 'maUtil'];
function clock(MA_DATE_FORMATS, maUtil) {

    const defaultOptions = function defaultOptions() {
        return {
            type: 'gauge',
            theme: 'light',
            addClassNames: true,
            startDuration: 0.3,
            marginTop: 0,
            marginBottom: 0,
            axes: [{
                axisAlpha: 0.3,
                endAngle: 360,
                startAngle: 0,
                endValue: 12,
                minorTickInterval: 0.2,
                showFirstLabel: false,
                axisThickness: 1,
                valueInterval: 1
            }],
            arrows: [{
                radius: '50%',
                innerRadius: 0,
                clockWiseOnly: true,
                nailRadius: 10,
                nailAlpha: 1
            }, {
                nailRadius: 0,
                radius: '80%',
                startWidth: 6,
                innerRadius: 0,
                clockWiseOnly: true
            }, {
                color: '#CC0000',
                nailRadius: 4,
                startWidth: 3,
                innerRadius: 0,
                clockWiseOnly: true,
                nailAlpha: 1
            }],
            'export': {
                enabled: false,
                libs: {autoLoad: false},
                dateFormat: MA_DATE_FORMATS.iso,
                fileName: 'mangoChart'
            }
        };
    };
    
    const postLinkImpl = function postLinkImpl($scope, $element, attributes, AmCharts) {
        let chart;
        const options = maUtil.deepMerge(defaultOptions(), $scope.options);
        const showSeconds = $scope.showSeconds !== 'false';
        if (!showSeconds) {
            options.arrows.pop();
        }
        
        // chart.addListener() does not work reliably for init
        const initListener = event => {
            $scope.$watch('text', function(newText) {
                chart.axes[0].setBottomText(newText || '');
            });

            $scope.$watch('time', function(newTime) {
                if (newTime === undefined) return;
                const date = $scope.timezone ? moment.tz(newTime, $scope.timezone) : newTime;

                const hours = date.hours();
                const minutes = date.minutes();
                const seconds = date.seconds();

                chart.arrows[0].setValue(hours + minutes / 60);
                chart.arrows[1].setValue( 12 * (minutes + seconds / 60 ) / 60);
                if (chart.arrows.length > 2) {
                    chart.arrows[2].setValue(12 * seconds / 60);
                }
            });
        };

        if (!Array.isArray(options.listeners)) {
            options.listeners = [];
        }
        options.listeners.push({
            event: 'init',
            method: initListener
        });

        chart = AmCharts.makeChart($element[0], options);
        
        $scope.$on('$destroy', () => {
            chart.clear();
        });
    };
    
    return {
        restrict: 'E',
        designerInfo: {
            translation: 'ui.components.clock',
            icon: 'access_time',
            category: 'timeAndDate'
        },
        scope: {
          options: '=?',
          text: '@',
          timezone: '@',
          showSeconds: '@',
          time: '='
        },
        link: function postLink($scope, $element, $attrs) {
            $element.addClass('amchart');
            $element.addClass('amchart-loading');
            
            const promise = Promise.all([
                import(/* webpackMode: "lazy", webpackChunkName: "amcharts" */ 'amcharts/gauge'),
                import(/* webpackMode: "lazy", webpackChunkName: "amcharts" */ 'amcharts/plugins/export/export'),
                import(/* webpackMode: "lazy", webpackChunkName: "amcharts" */ 'amcharts/plugins/export/export.css')
            ]);
            
            maUtil.toAngularPromise(promise).then(([AmCharts]) => {
                $element.removeClass('amchart-loading');
                postLinkImpl($scope, $element, $attrs, AmCharts);
            });
        }
    };

}

export default clock;


