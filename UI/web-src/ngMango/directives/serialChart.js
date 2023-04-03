/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';
import moment from 'moment-timezone';

/**
 * @ngdoc directive
 * @name ngMango.directive:maSerialChart
 * @restrict E
 * @description
 * `<ma-serial-chart style="height: 300px; width: 100%" series-1-values="point1Values" series-1-point="point1" default-type="column">
</ma-serial-chart>`
 * - The `<ma-serial-chart>` directive allows you to create line and bar charts.
 * - Many different variations on a chart can be created by customizing the attributes.
 * - Values are provided via `<ma-point-values>`. You can provide your time range and rollup settings to
 *   `<ma-point-values>`, then pass the data to `<ma-serial-chart>`.
 * - In the attributes starting with `series-X-` you will replace `X` with the series number from 1 to 10
 * - Note, you will need to set a width and height on the element.
 * - <a ui-sref="ui.helps.examples.charts.lineChart">View Demo</a> / <a ui-sref="ui.helps.examples.charts.advancedChart">View Advanced Demo</a>
 *
 * @param {object[]} values Inputs an array of value objects generated by `<ma-point-values>`.
 * @param {object[]=} points Inputs an array of points from `<ma-point-query>`.
 *     ([See Example](examples/point-arrays/point-array-line-chart))
 * @param {object[]=} graph-options An array of graph options objects, see [AmGraph](https://docs.amcharts.com/3/javascriptcharts/AmGraph)
 * @param {string=} time-format The moment.js time format to be used in displaying timestamps on the X axis.
 * @param {string=} timezone The timezone to render the date/time in if the time-format option is specified
 * @param {string=} stack-type Stacking mode of the axis. Possible values are: `"none"`, `"regular"`, `"100%"`, `"3d"`.
 * @param {string=} default-type The type of chart used for all graphs. The possible values for chart type are
 *     `"line"`, `"smoothedLine"`, `"column"`, or `"step"`.
 * @param {string=} default-color The default color used for all graphs. Can be a color string or hex value.
 * @param {string=} default-axis The default axis used for all graphs. Can be `"right"`, `"left"`, `"right-2"`, `"left-2"`.
 * @param {string=} default-balloon-text Overides the balloon text with a specified string.
 * @param {object=} default-graph-options Default config object for the all series, see [AmGraph](https://docs.amcharts.com/3/javascriptcharts/AmGraph)
 * @param {object[]} series-X-values Inputs a values array generated by `<ma-point-values>`.
 * @param {object=} series-X-point Inputs a point object from `<ma-point-list>`.
 * @param {string=} series-X-type The type of chart used for the given series (replace `X` with series number starting with 1).
 *     The possible values for chart type are `"line"`, `"smoothedLine"`, `"column"`, or `"step"`.
 * @param {string=} series-X-color The default color used for the given series (replace `X` with series number starting with 1).
 *     Can be a color string or hex value.
 * @param {string=} series-X-axis The defaults axis used for the given series (replace `X` with series number starting with 1).
 *     Can be `"right"`, `"left"`, `"right-2"`, `"left-2"`.
 * @param {string=} series-X-balloon-text Overides the balloon text with a specified string for the given series
 *     (replace `X` with series number starting with 1).
 * @param {string=} series-X-title Sets the text in the legend for the given series (replace `X` with series number starting with 1).
 * @param {object=} series-X-graph-options Config object for the series, see [AmGraph](https://docs.amcharts.com/3/javascriptcharts/AmGraph)
 * @param {boolean=} export If set to true, chart export functionality will be turned on. Defaults to off.
 * @param {boolean=} one-balloon If set to true, display only one balloon at a time. Defaults to all graphs display balloon.
 * @param {string=} bullet Set to add bullets to values on graphs. Options are: `"circle"`, `"square"`, `"diamond"`,
 *     `"triangleUp"`, `"triangleDown"`, `"triangleLeft"`, `"triangleRight"`, `"bubble"`, `"xError"`, and `"yError"`.
 * @param {string=} custom-bullet Set to image path of a custom bullet image.
 * @param {boolean=} legend If set to true, chart's legend will be turned on. Defaults to off.
 * @param {boolean=} annotate-mode If set to true, clicking on value of a graph will open annotation dialog.
 * @param {number=} line-thickness Set to a number to increase/decrease line thickness of each graph. (Defaults to `2.0` for line
 * chart).
 * @param {function=} on-chart-init Set to function call which will be triggered by init chart event. (eg.
 * `on-chart-init="$ctrl.getChart($chart)"`)
 * @param {function=} graph-item-clicked Set to function call which will be triggered by graph click event. (eg.
 * `graph-item-clicked="$ctrl.handleChartClick($chart, $event)"`)
 * @param {object=} trend-lines Set trendlines object. (See
 * [amCharts](https://docs.amcharts.com/3/javascriptcharts/TrendLine))
 * @param {object[]=} guides Category axis guides
 *     (see [amCharts Guide](https://docs.amcharts.com/3/javascriptcharts/Guide))
 * @param {object=} options extend AmCharts configuration object for customizing design of the chart
 *     (see [amCharts](https://docs.amcharts.com/3/javascriptcharts/AmSerialChart))
 * @param {string=} cursor-sync-id If you set two or more charts to the same string value then their cursors and zoom will be synced
 * @param {expression=} point-title The result of evaluating this expression will be used for the point title. Available scope parameters are `$point`.
 * 
 * @usage
 * <ma-serial-chart style="height: 300px; width: 100%" series-1-values="point1Values" series-1-point="point1" default-type="column">
</ma-serial-chart>`
 *
 */
serialChart.$inject = ['MA_AMCHARTS_DATE_FORMATS', 'maUtil', 'MA_DATE_FORMATS', '$timeout', 'maUtil'];
function serialChart(MA_AMCHARTS_DATE_FORMATS, Util, mangoDateFormats, $timeout, maUtil) {

    const MAX_SERIES = 10;
    const defaultOptions = function defaultOptions() {
        return {
            type: 'serial',
            theme: 'light',
            addClassNames: true,
            synchronizeGrid: true,
            valueAxes: [{
                id: 'left',
                position: 'left',
                axisThickness: 2
            },{
                id: 'right',
                position: 'right',
                axisThickness: 2
            },{
                id: 'left-2',
                position: 'left',
                offset: 50,
                axisThickness: 2
            },{
                id: 'right-2',
                position: 'right',
                offset: 50,
                axisThickness: 2
            }],
            categoryAxis: {
                parseDates: true,
                minPeriod: 'fff',
                equalSpacing: false,
                axisThickness: 0,
                dateFormats: MA_AMCHARTS_DATE_FORMATS.categoryAxis,
                firstDayOfWeek: moment.localeData(moment.locale()).firstDayOfWeek()
            },
            chartCursor: {
                categoryBalloonDateFormat: MA_AMCHARTS_DATE_FORMATS.categoryBalloon
            },
            startDuration: 0,
            graphs: [],
            plotAreaFillAlphas: 0.0,
            categoryField: 'timestamp',
            'export': {
                enabled: false,
                libs: {autoLoad: false},
                dateFormat: mangoDateFormats.iso,
                fileName: 'mangoChart',
                menuReviver: function (item, li) {
                      // This function, if "save as.." is selected, override the default XID header with a custom header that is a combination of deviceName and pointName.
                     // https://github.com/amcharts/export#menu-item-reviver
                    if (item.label === "Save as ...") {
                        item.menu = ['CSV', 'XLSX', 'JSON'].map((type) => ({
                            label: type,
                            click: function click() {
                                this.setup.chart.dataProvider.forEach((dataProvider) => {
                                    Object.keys(dataProvider)
                                        .filter((data) => data !== "timestamp")
                                        .forEach((obj) => {
                                            const xid = obj.replace(/_rendered/g, "");
                                            const graph = this.setup.chart.graphs.find(
                                                (item) => item.valueField === xid
                                            );
                                            if (!graph) {
                                                return;
                                            }
                                            const newFieldName = obj.includes("_rendered")
                                                ? `${graph.title}_rendered`
                                                : graph.title;
                                            dataProvider.timestamp = new Date(dataProvider.timestamp).toISOString();
                                            dataProvider[`${newFieldName}`] = dataProvider[obj];
                                            delete dataProvider[obj];
                                        });
                                });
                                this[`to${type}`]({data: this.setup.chart.dataProvider}, function (data) {
                                    this.download(data, this.defaults.formats[type].mimeType, `${this.defaults.fileName}.${this.defaults.formats[type].extension}`);
                                });
                            }
                        }))
                    }
                    return li;
                }
            }
        };
    };

    const cursorSyncCharts = {};
    
    const addCursorSyncChart = (cursorSyncId, chart) => {
        if (!cursorSyncCharts.hasOwnProperty(cursorSyncId)) {
            cursorSyncCharts[cursorSyncId] = [];
        }
        if (cursorSyncCharts[cursorSyncId].includes(chart)) return;
        cursorSyncCharts[cursorSyncId].push(chart);
    };
    
    const removeCursorSyncChart = (cursorSyncId, chart) => {
        const chartsArray = cursorSyncCharts[cursorSyncId];
        if (!chartsArray) return;
        const index = chartsArray.indexOf(chart);
        if (index >= 0) {
            chartsArray.splice(index, 1);
        }
        if (!chartsArray.length) {
            delete cursorSyncCharts[cursorSyncId];
        }
    };
    
    const chartZoomed = (cursorSyncId, event) => {
        const chartsArray = cursorSyncCharts[cursorSyncId];
        if (!chartsArray) return;
        chartsArray.forEach(chart => {
            if (chart.ignoreZoom) {
                chart.ignoreZoom = false;
            }
            if (chart !== event.chart) {
                chart.ignoreZoom = true;
                try {
                    chart.zoomToDates(event.startDate, event.endDate);
                } catch (e) {} // throws error on first run
            }
        });
    };
    
    const cursorChanged = (cursorSyncId, event) => {
        const chartsArray = cursorSyncCharts[cursorSyncId];
        if (!chartsArray) return;
        chartsArray.forEach(chart => {
            if (chart !== event.chart) {
                chart.chartCursor.syncWithCursor(event.chart.chartCursor);
            }
        });
    };
    
    const cursorHidden = (cursorSyncId, event) => {
        const chartsArray = cursorSyncCharts[cursorSyncId];
        if (!chartsArray) return;
        chartsArray.forEach(chart => {
            if (chart.chartCursor.hideCursor) {
                chart.chartCursor.forceShow = false;
                chart.chartCursor.hideCursor(false);
            }
        });
    };

    const afterInit = function afterInit($scope, $element, attrs, chart) {
        const valueArray = !!attrs.values;

        $scope.$on('$destroy', () => {
            chart.clear();
        });
        
        if ($scope.onChartInit) {
            $scope.onChartInit({$chart: chart});
        }
        
        if ($scope.cursorSyncId) {
            addCursorSyncChart($scope.cursorSyncId, chart);
            $scope.$on('$destroy', () => removeCursorSyncChart($scope.cursorSyncId, chart));
        }
        
        chart.addListener('zoomed', event => {
            if ($scope.cursorSyncId) {
                chartZoomed($scope.cursorSyncId, event);
            }
        });
        
        if (chart.chartCursor) {
            chart.chartCursor.addListener('changed', event => {
                if ($scope.cursorSyncId) {
                    cursorChanged($scope.cursorSyncId, event);
                }
            });
    
            chart.chartCursor.addListener('onHideCursor', event => {
                if ($scope.cursorSyncId) {
                    cursorHidden($scope.cursorSyncId, event);
                }
            });
        }

        chart.addListener('changed', event => {
            chart.lastCursorPosition = event.index;
        });
        
        if ($scope.graphItemClicked) {
            chart.addListener('clickGraphItem', event => {
                $scope.graphItemClicked({$chart: chart, $event: event});
            });
        }

        $scope.$watchCollection('trendLines', (newValue, oldValue) => {
            if (newValue === oldValue && newValue === undefined) return;
            $scope.options.trendLines = newValue;
        });

        $scope.$watch('guides', (newValue, oldValue) => {
            if (newValue === oldValue && newValue === undefined) return;
            if (!chart || !chart.categoryAxis) return;

            let guides = newValue;
            if (!Array.isArray(guides)) {
                guides = [];
            }
            // must copy the guides as amCharts turns modifies the guide objects causing infinite digest errors
            chart.categoryAxis.guides = angular.copy(guides);
            chart.validateNow();
        }, true);

        $scope.$watch('options', (newValue, oldValue) => {
            if (!newValue) return;
            
            maUtil.deepMerge(chart, newValue);
            checkForAxisColors();
            watchPointsAndGraphs($scope.graphOptions);
        }, true);

        $scope.$watchGroup([
            'defaultType',
            'defaultColor',
            'defaultAxis',
            'defaultBalloonText',
            'defaultGraphOptions'
        ], graphOptionsChanged.bind(null, null));

        if (valueArray) {
            $scope.$watchCollection('values', watchValues);
            $scope.$watchCollection('points', watchPointsAndGraphs);
            $scope.$watch('graphOptions', watchPointsAndGraphs, true);
        }
        
        const attrPresent = name => attrs.hasOwnProperty(name);

        for (let i = 1; i <= MAX_SERIES; i++) {
            const seriesAttrs = [
                'series' + i + 'Type',
                'series' + i + 'Title',
                'series' + i + 'Color',
                'series' + i + 'Axis',
                'series' + i + 'BalloonText',
                'series' + i + 'GraphOptions'
            ];
            
            if (!valueArray) {
                seriesAttrs.push('series' + i + 'Point');
            }
            
            // create a separate array for watching graph options, don't want values attr in this array
            const graphOptionsAttrs = seriesAttrs.slice();
            
            if (!valueArray) {
                seriesAttrs.push('series' + i + 'Values');
            }
            
            // if any series attribute is present
            if (seriesAttrs.some(attrPresent)) {
                $scope.$watchGroup(graphOptionsAttrs, graphOptionsChanged.bind(null, i));
                if (!valueArray) {
                    $scope.$watchCollection('series' + i + 'Values', valuesChanged.bind(null, i));
                }
            }
        }
        
        function watchValues(newValues, oldValues) {
            if (newValues === oldValues && newValues === undefined) return;
            
            chart.dataProvider = newValues;
            checkEqualSpacing();
            chart.validateData();
        }
        
        let dataEquallySpaced = true;
        function checkEqualSpacing(dataChanged = true) {
            // dont change anything if the user manually specified equalSpacing
            if ($scope.options && $scope.options.categoryAxis && $scope.options.categoryAxis.equalSpacing != null) return;

            const onlyBarCharts = chart.graphs.every(g => g.type === 'column');
            
            if (dataChanged && Array.isArray(chart.dataProvider)) {
                dataEquallySpaced = !chart.dataProvider.map((dataItem, index, array) => {
                    if (index === 0) return null;
                    return dataItem.timestamp - array[index - 1].timestamp;
                }).some((diff, index, array) => {
                    if (index <= 1) return;
                    return diff !== array[index - 1];
                });
            }
            
            chart.categoryAxis.equalSpacing = (onlyBarCharts || !chart.dataProvider) ? true : dataEquallySpaced;
        }

        function watchPointsAndGraphs(newValues, oldValues) {
            if (newValues === oldValues && newValues === undefined) return;
            
            if (!$scope.points && !$scope.graphOptions) {
                chart.graphs = [];
            }

            if (newValues) {
                let numGraphs = $scope.points && $scope.points.length || 0;
                const graphOptionsLength = $scope.graphOptions && $scope.graphOptions.length || 0;
                if (graphOptionsLength > numGraphs) {
                    numGraphs = graphOptionsLength;
                }
                while (chart.graphs.length > numGraphs) {
                    chart.graphs.pop();
                }
                
                for (let i = 0; i < newValues.length; i++) {
                    const val = newValues[i];
                    if (!val) continue;
                    setupGraph(i + 1);
                }
            }

            sortGraphs();
            checkEqualSpacing(false);
            chart.validateNow(true);
        }

        function findGraph(propName, prop, removeGraph) {
            for (let i = 0; i < chart.graphs.length; i++) {
                if (chart.graphs[i][propName] === prop) {
                    const graph = chart.graphs[i];
                    if (removeGraph) chart.graphs.splice(i, 1);
                    return graph;
                }
            }
        }

        function graphOptionsChanged(graphNum, values) {
            if (isAllUndefined(values)) return;

            if (graphNum === null) {
                // update all graphs
                for (let i = 0; i < chart.graphs.length; i++) {
                    setupGraph(chart.graphs[i]);
                }
            } else {
                setupGraph(graphNum);
            }

            sortGraphs();
            chart.validateNow(true);
        }

        function valuesChanged(graphNum, newValues, oldValues) {
            if (newValues === oldValues && newValues === undefined) return;

            if (!newValues) {
                findGraph('graphNum', graphNum, true);
            } else  {
                setupGraph(graphNum);
                sortGraphs();
            }
            updateValuesDebounced();
        }
        
        function getPointForGraph(graphNum) {
            let point = $scope['series' + graphNum + 'Point'];
            if (!point && $scope.points) {
                point = $scope.points[graphNum - 1];
            }
            return point;
        }

        function setupGraph(graphNum, point) {
            let graph;
            
            // first arg can be the graph itself
            if (typeof graphNum === 'object') {
                graph = graphNum;
                graphNum = graph.graphNum;
            } else {
                graph = findGraph('graphNum', graphNum);
            }
            if (!graph) {
                graph = {};
                chart.graphs.push(graph);
            }
            
            const hardDefaults = {
                graphNum: graphNum,
                id: 'series-' + graphNum,
                valueField: 'value_' + graphNum,
                title: 'Series ' + graphNum,
                type: 'smoothedLine',
                valueAxis: 'left',
                clustered: false,
                balloonFunction: function(dataItem, graph) {
                    const valueForBalloon = graph.title + ' \u2014 ' + dataItemToText(dataItem);
                    if ($scope.annotateMode) {
                        return dataItem.dataContext[graph.xid + 'AnnotationBalloonText'] ?
                                dataItem.dataContext[graph.xid + 'AnnotationBalloonText'] :
                                valueForBalloon;
                    } else {
                        return valueForBalloon;
                    }
                }
            };

            let pointDefaults;
            point = point || getPointForGraph(graphNum);
            if (point) {
                pointDefaults = {
                    xid: point.xid,
                    valueField: 'value_' + point.xid,
                    title: point.deviceName + ' - ' + point.name,
                    lineColor: point.chartColour
                };
                
                if ($scope.pointTitle) {
                    pointDefaults.title = $scope.pointTitle({$point: point});
                }
                
                if (typeof point.amChartsGraphType === 'function') {
                    pointDefaults.type = point.amChartsGraphType();
                }
            }

            const defaultAttributes = {
                type: $scope.defaultType,
                lineColor: $scope.defaultColor,
                lineThickness: $scope.lineThickness,
                valueAxis: $scope.defaultAxis,
                bullet: $scope.bullet,
                customBullet: $scope.customBullet
            };
            
            const attributeOptions = {
                title: $scope['series' + graphNum + 'Title'],
                type: $scope['series' + graphNum + 'Type'],
                lineColor: $scope['series' + graphNum + 'Color'],
                valueAxis: $scope['series' + graphNum + 'Axis'],
                balloonText: $scope['series' + graphNum + 'BalloonText']
            };
            
            const graphOptions = $scope['series' + graphNum + 'GraphOptions'] ||
                ($scope.graphOptions && $scope.graphOptions[graphNum - 1]);

            let annotateOptions = {};

            if ($scope.annotateMode) {
                annotateOptions = {
                    labelText: '[[' + graph.xid + 'AnnotationText]]',
                    labelRotation: 0,
                    labelPosition: 'right',
                    labelOffset: 5,
                    labelColorField: graph.xid + 'AnnotationTextColor',
                    bulletSize: 10,
                    bulletSizeField: graph.xid + 'AnnotationBulletSize',
                    bulletHitAreaSize: 14,
                    bulletAlpha: 1,
                    bulletColor: 'rgba(0, 0, 0, 0)',
                    bullet: 'circle',
                    bulletField: graph.xid + 'AnnotationBullet'
                };
            }

            const opts = maUtil.deepMerge({}, hardDefaults, pointDefaults, $scope.defaultGraphOptions,
                    defaultAttributes, attributeOptions, graphOptions, annotateOptions);

            let graphAxis;
            chart.valueAxes.some(axis => {
                if (axis.id === opts.valueAxis) {
                    graphAxis = axis;
                    return true;
                }
            });
            
            if (opts.balloonText)
                delete opts.balloonFunction;
            if (opts.fillAlphas === undefined) {
                const isStacked = graphAxis && graphAxis.stackType && graphAxis.stackType !== 'none';
                if (isStacked || opts.type === 'column') {
                    opts.fillAlphas = 0.7;
                } else {
                    opts.fillAlphas = 0;
                }
            }
            if (opts.lineThickness === undefined) {
                opts.lineThickness = opts.type === 'column' ? 1.0 : 2.0;
            }

            // using smoothing without equal spacing gives strange loopy lines due to bug in amCharts
            // https://stackoverflow.com/questions/45863892/random-curves-in-js-chart-line-graph-by-amcharts
            if (!chart.categoryAxis.equalSpacing && opts.type === 'smoothedLine') {
                opts.type = 'line';
            }

            maUtil.deepMerge(graph, opts);
        
        }
        
        function checkForAxisColors() {
              if ($scope.options && $scope.options.valueAxes) {
                  let customAxisColors = false;
                  $scope.options.valueAxes.some((axis, index, array) => {
                      if (axis.color || axis.axisColor) {
                            // Turn on custom color mode
                            customAxisColors = true;
                            return true;
                      }
                  });
                  if (customAxisColors) {
                      $element.addClass('amcharts-custom-color');
                  } else {
                      $element.removeClass('amcharts-custom-color');
                  }
              }
        }

        function sortGraphs() {
            chart.graphs.sort((a, b) => a.graphNum - b.graphNum);
        }

        function combine(output, newValues, valueField, point) {
            if (!newValues) return;

            for (let i = 0; i < newValues.length; i++) {
                const value = newValues[i];
                let timestamp;
                if ($scope.timeFormat) {
                    const m = $scope.timezone ? moment.tz(value.timestamp, $scope.timezone) : moment(value.timestamp);
                    timestamp = m.format($scope.timeFormat);
                } else {
                    timestamp = value.timestamp;
                }

                if (!output[timestamp]) {
                    output[timestamp] = {timestamp: timestamp};
                }
                
                output[timestamp][valueField] = value.value;
                output[timestamp][valueField + '_rendered'] = value.rendered || Util.pointValueToString(value.value, point);
            }
        }
        
        let updating;
        function updateValuesDebounced() {
            if (!updating) {
                updating = $timeout(() => {
                    updateValues();
                    updating = null;
                }, 500);
            }
        }

        function updateValues() {
            const values = {};

            for (let i = 1; i <= MAX_SERIES; i++) {
                const seriesValues = $scope['series' + i + 'Values'];

                const point = getPointForGraph(i);
                const valueField = 'value_' + (point ? point.xid : i);
                
                combine(values, seriesValues, valueField, point);
            }

            // copy from object into array
            const output = [];
            for (const timestamp in values) {
                output.push(values[timestamp]);
            }

            // sort array of values by timestamp
            if (output.length && typeof output[0].timestamp === 'number') {
                output.sort((a, b) => a.timestamp - b.timestamp);
            }

            chart.dataProvider = output;
            checkEqualSpacing();
            chart.validateNow(true);
        }
    };

    const postLinkImpl = function postLinkImpl($scope, $element, attrs, AmCharts) {
        let options = defaultOptions();

        if ($scope.timeFormat) {
            options.categoryAxis.parseDates = false;
        }

        if ($scope.stackType) {
            options.valueAxes[0].stackType = $scope.stackType;
        }
        
        if ($scope.legend) {
            options.legend = {
                valueWidth: 100,
                valueFunction: dataItemToText
            };
        }
        
        if ($scope['export']) {
            options['export'].enabled = true;
        }
        
        if ($scope.oneBalloon) {
            options.chartCursor = {
                oneBalloonOnly: true
            };
        }

        if ($scope.annotateMode) {
            options.chartCursor = {
                oneBalloonOnly: true,
                graphBulletSize: 2,
                zoomable: false,
                categoryBalloonDateFormat: 'h:mm:ss A - MMM DD, YYYY'
            };
            options.balloon = {
                fillAlpha: 1
            };
        }

        maUtil.deepMerge(options, $scope.options);
        
        options = angular.copy(options);

        if (!Array.isArray(options.listeners)) {
            options.listeners = [];
        }
        options.listeners.push({
            event: 'init',
            method: data => {
                afterInit($scope, $element, attrs, data.chart);
            }
        });
        
        AmCharts.makeChart($element[0], options);
    };

    function isAllUndefined(a) {
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== undefined) return false;
        }
        return true;
    }
    
    function dataItemToText(dataItem) {
        if (dataItem.dataContext) {
            const graph = dataItem.graph;

            const value = extractField(dataItem.dataContext, graph.valueField);
            if (value) return value;
            
//            for (let i = dataItem.index - 1; i >= 0; i--) {
//                value = extractField(chart.dataProvider[i], graph.valueField);
//                if (value) return value;
//            }
        }
        return '';
    }
    
    function extractField(data, fieldName) {
        const rendered = data[fieldName + '_rendered'];
        if (rendered) return rendered;
        
        const value = data[fieldName];
        if (value != null) {
            return Util.pointValueToString(value);
        }
    }

    const bindings = {
        options: '<?',
        timeFormat: '@',
        timezone: '@',
        stackType: '@',
        values: '<?',
        points: '<?',
        graphOptions: '<?',
        defaultType: '@',
        defaultColor: '@',
        defaultAxis: '@',
        defaultBalloonText: '@',
        defaultGraphOptions: '<?',
        'export': '<?',
        oneBalloon: '<?',
        legend: '<?',
        customBullet: '@',
        bullet: '@',
        annotateMode: '<?',
        lineThickness: '@',
        onChartInit: '&?',
        graphItemClicked: '&?',
        trendLines: '<?',
        guides: '<?',
        cursorSyncId: '@?',
        pointTitle: '&?'
    };

    const designerAttributes = {defaultColor: {type: 'color'}};

    // dynamically create attribute bindings for MAX_SERIES series
    for (let j = 1; j <= MAX_SERIES; j++) {
        bindings['series' + j + 'Values'] = '<?';
        bindings['series' + j + 'Type'] = '@';
        bindings['series' + j + 'Title'] = '@';
        bindings['series' + j + 'Color'] = '@';
        bindings['series' + j + 'Axis'] = '@';
        bindings['series' + j + 'BalloonText'] = '@';
        bindings['series' + j + 'Point'] = '<?';
        bindings['series' + j + 'GraphOptions'] = '<?';

        designerAttributes['series' + j + 'Color'] = {type: 'color'};
    }
    
    return {
        restrict: 'E',
        designerInfo: {
            translation: 'ui.components.serialChart',
            icon: 'show_chart',
            category: 'pointValuesAndCharts',
            attributes: designerAttributes,
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
                import(/* webpackMode: "lazy", webpackChunkName: "amcharts" */ 'amcharts/serial'),
                import(/* webpackMode: "lazy", webpackChunkName: "amcharts" */ 'amcharts/plugins/export/export'),
                import(/* webpackMode: "lazy", webpackChunkName: "amcharts" */ 'amcharts/plugins/export/export.css')
            ]);
            
            Util.toAngularPromise(promise).then(([AmCharts]) => {
                $element.removeClass('amchart-loading');
                postLinkImpl($scope, $element, $attrs, AmCharts);
            });
        }
    };
}

export default serialChart;


