/**
 * @copyright 2018 {@link http://infiniteautomation.com|Infinite Automation Systems, Inc.} All rights reserved.
 * @author Jared Wiltshire
 */

import moment from 'moment-timezone';

/**
 * @ngdoc directive
 * @name ngMango.directive:maStateChart
 * @restrict E
 * @description
 * `<ma-state-chart>
 </ma-state-chart>`
 * - This directive will display a chart showing the proportion of time over a time range a multi-state data point has been in a particular state.
 * - <a ui-sref="ui.examples.charts.stateChart">View Demo</a>

 * @param {object=} options extend AmCharts configuration object for customizing design of the chart
 *     (see [amCharts](https://www.amcharts.com/demos/simple-pie-chart/))
 * @param {expression=} end-date Expression that evaluates to a date, moment or date string. Sets the end date for the chart.
 * @param {object[]} series-X-values Inputs a values array generated by `<ma-point-values>`.
 * @param {string=} series-X-title Sets the text in the legend for the given series (replace `X` with series number starting with 1).
 * @param {object=} series-X-labels Sets for the labels for the different states of a data point.
 *     Should be set to `rendererMap()` property of a multistate point.
 * @usage
 * <ma-state-chart style="height: 500px; width: 100%"
 	series-1-title="{{point1.name}}" series-1-values="point1Values" series-1-labels="point1.rendererMap()"
 	series-2-title="{{point2.name}}" series-2-values="point2Values" series-2-labels="point2.rendererMap()">
 </ma-state-chart>
 *
 */
 
stateChart.$inject = ['MA_DATE_FORMATS', 'MA_AMCHARTS_DATE_FORMATS', 'maUtil'];
function stateChart(mangoDateFormats, MA_AMCHARTS_DATE_FORMATS, maUtil) {
	const MAX_SERIES = 10;

    const defaultOptions = function defaultOptions() {
        return {
            type: 'gantt',
            theme: 'light',
            addClassNames: true,
            columnWidth: 0.8,
            balloonDateFormat: MA_AMCHARTS_DATE_FORMATS.categoryBalloon,
            valueAxis: {
                type: 'date',
                minPeriod: 'fff',
                dateFormats: MA_AMCHARTS_DATE_FORMATS.categoryAxis,
                firstDayOfWeek: moment.localeData(moment.locale()).firstDayOfWeek()
            },
            graph: {
                fillAlphas: 0.85,
                balloonText: '<b>[[task]]</b>:<br>[[startFormatted]]<br>[[duration]]',
                labelText: '[[task]]',
                labelPosition: 'middle',
                showBalloonAt: 'open'
            },
            rotate: true,
            categoryField: 'category',
            segmentsField: 'segments',
            colorField: 'colour',
            startDateField: 'startDate',
            endDateField: 'endDate',
            //durationField: 'duration',
            dataProvider: [],
            chartCursor: {
                valueBalloonsEnabled: false,
                cursorAlpha: 0.2,
                valueLineBalloonEnabled: true,
                valueLineEnabled: true,
                fullWidth: true,
                categoryBalloonEnabled: false,
            },
            'export': {
                enabled: false,
                libs: {autoLoad: false},
                dateFormat: mangoDateFormats.iso,
                fileName: 'mangoChart'
            }
        };
    };
    
    const postLinkImpl = function postLinkImpl($scope, $element, attributes, AmCharts) {
        let options = defaultOptions();
        options = maUtil.deepMerge(options, $scope.options);
        const chart = AmCharts.makeChart($element[0], options);

        $scope.$on('$destroy', () => {
            chart.clear();
        });
        
        for (let i = 1; i <= MAX_SERIES; i++) {
            $scope.$watchCollection('series' + i + 'Values', valuesChanged.bind(null, i));
        }
        
        function valuesChanged(seriesNumber, newValue, oldValue) {
            if (!newValue) removeProvider(seriesNumber);
            else setupProvider(seriesNumber);
            updateValues();
        }
        
        function createLabelFn(labels) {
            return function(value) {
                let label = labels && labels[value] || {};
                
                if (typeof label === 'string') {
                    label = {
                        text: label
                    };
                }
                
                if (!label.text) {
                    label.text = value;
                }
                
                return label;
            };
        }
        
        function removeProvider(graphNum) {
            for (let i = 0; i < chart.dataProvider.length; i++) {
                if (chart.dataProvider[i].id === 'series-' + graphNum) {
                    chart.dataProvider.splice(i, 1);
                    break;
                }
            }
        }
        
        function findProvider(graphNum) {
            let graph;
            for (let i = 0; i < chart.dataProvider.length; i++) {
                if (chart.dataProvider[i].id === 'series-' + graphNum) {
                    graph = chart.dataProvider[i];
                    break;
                }
            }
            return graph;
        }
        
        function setupProvider(graphNum) {
            let graph = findProvider(graphNum);
            
            if (!graph) {
                graph = {
                    id: 'series-' + graphNum
                };
                chart.dataProvider.push(graph);
            }
            
            graph.category = $scope['series' + graphNum + 'Title'] || ('Series ' + graphNum);
            
            chart.dataProvider.sort(function(a, b) {
                if (a.id < b.id)
                    return -1;
                  if (a.id > b.id)
                    return 1;
                  return 0;
            });
        }

        function updateValues() {
            const endDate = moment($scope.endDate);
            
            for (let i = 1; i <= MAX_SERIES; i++) {
                const graph = findProvider(i);
                const values = $scope['series' + i + 'Values'];
                const labels = $scope['series' + i + 'Labels'];
                const labelFn = createLabelFn(labels);
                
                if (graph && values) {
                    const provider = [];

                    for (let j = 0; j < values.length; j++) {
                        const val = values[j];
                        const label = labelFn(val.value);
                        
                        // remove duplicates
                        while ((j+1) < values.length && values[j+1].value === val.value) {
                            values.splice(j+1, 1);
                        }
                        
                        const endTime = (j+1) < values.length ? values[j+1].timestamp : endDate.valueOf();
                        const duration = endTime - val.timestamp;
                        const startMoment = moment(val.timestamp);
                        const startFormatted = startMoment.format(MA_AMCHARTS_DATE_FORMATS.categoryBalloon);
                        
                        provider.push({
                            startDate: new Date(val.timestamp),
                            startFormatted: startFormatted,
                            endDate: new Date(endTime),
                            duration: moment.duration(duration).humanize(),
                            task: label.text,
                            colour: label.colour || getColour(val.value)
                        });
                    }
                    
                    graph.segments = provider;
                }
            }
            chart.validateData();
        }
        
        const colourMap = {};
        let colourIndex = 0;
        function getColour(value) {
            if (colourMap[value]) {
                return colourMap[value];
            }
            const colour = chart.colors[colourIndex++ % chart.colors.length];
            colourMap[value] = colour;
            return colour;
        }
    };
    
    const bindings = {
        options: '=?',
        endDate: '<?'
    };
    
    for (let j = 1; j <= MAX_SERIES; j++) {
        bindings['series' + j + 'Values'] = '=';
        bindings['series' + j + 'Title'] = '@';
        bindings['series' + j + 'Labels'] = '=';
    }

    return {
        restrict: 'E',
        designerInfo: {
            translation: 'ui.components.stateChart',
            icon: 'insert_chart',
            category: 'pointValuesAndCharts',
            size: {
                width: '400px',
                height: '200px'
            }
        },
        scope: bindings,
        link: function postLink($scope, $element, $attrs) {
            $element.addClass('amchart');
            $element.addClass('amchart-loading');
            
            const promise = Promise.all([
                import(/* webpackMode: "lazy", webpackChunkName: "amcharts" */ 'amcharts/gantt'),
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

export default stateChart;


