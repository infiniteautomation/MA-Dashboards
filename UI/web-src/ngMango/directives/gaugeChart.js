/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';
import gaugeChartTemplate from './gaugeChart.html';

/**
 * @ngdoc directive
 * @name ngMango.directive:maGaugeChart
 * @restrict E
 * @description
 * `<ma-gauge-chart point="myPoint" style="width:100%; height:200px"></ma-gauge-chart>`
 * - This directive will display a gauge that can be tied to a data point's live value.
 * - Note, you will need to set a width and height on the element.
 * - Options have been exposed via attributes, allowing you to set colors and ranges of multiple bands.
 * - <a ui-sref="ui.helps.examples.singleValueDisplays.gauges">View Demo</a>
 *

 * @param {object=} point A data point object from a watch list, point query, point drop-down, `maPoint` service, or `<ma-get-point-value>` component.
 * @param {string=} point-xid Instead of supplying a data point object, you can supply it's XID.
 * @param {number=} value Allows you to set the gauge to a value that is not provided by the `point` attribute.
 * Only use without the `point` or `point-xid` attribute.
 * @param {number=} start Sets the starting value for the gauge.
 * @param {number=} end Sets the ending value for the gauge.
 * @param {boolean=} auto-start Set to `true` to enable auto selecting a `start` value for the gauge based on minimum value
 * from past week.
 * @param {boolean=} auto-end Set to `true` to enable auto selecting an `end` value for the gauge based on maximum value
 * from past week.
 * @param {number=} band-1-end Sets the ending value for the first band.
 * @param {string=} band-1-color Sets the color for the first band.
 * @param {number=} band-2-end Sets the ending value for the second band.
 * @param {string=} band-2-color Sets the color for the second band.
 * @param {number=} band-3-end Sets the ending value for the third band.
 * @param {string=} band-3-color Sets the color for the third band.
 * @param {object[]=} bands Array of band configurations. Takes precedence over the `band-x-end` and `band-x-color` attributes.
 * @param {number=} radius Sets the radius of the axis circled around the gauge. (default: 95%)
 * @param {number=} value-offset Sets the vertical offset of the value text. Negative moves the value up. (default: -20)
 * @param {number=} value-font-size Sets the fontsize of the value text. (default: 12)
 * @param {number=} axis-label-font-size Sets the fontsize of the labels around the axis.
 * @param {number=} axis-thickness Sets the thickness of the axis circle. (default: 1)
 * @param {number=} interval Sets the interval for each numbered tick on the gauge. (default: 6 evenly distributed numbered ticks)
 * @param {number=} tick-interval Sets the interval for the minor ticks. Divide this number into the numbered tick interval to
 *     get the number of minor ticks per numbered interval. (default: 5 evenly distributed minor ticks per numbered interval)
 * @param {number=} arrow-inner-radius Radius of the ring the arrow is attached to. (default: 8)
 * @param {number=} arrow-alpha Opacity of the arrow and the arrow ring. Ranges 0-1 as a decimal. (default: 1)
 * @param {number=} axis-alpha Opacity of the circular axis. Ranges 0-1 as a decimal. (default: 0.5)
 * @param {object=} options Extend [amCharts](https://www.amcharts.com/demos/angular-gauge/) configuration object for customizing design of the gauge.
 * @param {string} label Displays a label next to the point value. Three special options are available:
 *      NAME, DEVICE_AND_NAME, and DEVICE_AND_NAME_WITH_TAGS
 * @param {expression=} label-expression Expression that is evaluated to set the label. Gives more control for formatting the label.
 *     Takes precedence over the label attribute. Available locals are $point (Data point object).
 *
 * @usage
 * 
<md-input-container flex>
    <label>Choose a point</label>
    <ma-point-list limit="200" ng-model="myPoint"></ma-point-list>
</md-input-container>

<ma-get-point-value point="myPoint"></ma-get-point-value>

<p>Basic (defaults to 0-100)</p>
<ma-gauge-chart point="myPoint" style="width:100%; height:200px"></ma-gauge-chart>

<p>Set axis interval and start and end value</p>
<ma-gauge-chart point="myPoint" interval="10" start="-20" end="120"
style="width:100%; height:200px"></ma-gauge-chart>

<p>Set color bands</p>
<ma-gauge-chart point="myPoint" start="-20" interval="20" band-1-end="20"
band-2-end="80" band-2-color="yellow" band-3-end="100" style="width:100%; height:200px">
</ma-gauge-chart>

 *
 */
gaugeChart.$inject = ['maPointValueController', 'maUtil'];
function gaugeChart(PointValueController, maUtil) {

    const asNumber = function asNumber(value, defaultValue) {
        if (typeof value === 'number' && isFinite(value)) {
            return value;
        } else if (typeof value === 'string') {
            try {
                return parseFloat(value);
            } catch (e) {}
        }
        return defaultValue || 0;
    };

    const defaultOptions = function defaultOptions() {
        return {
            type: 'gauge',
            theme: 'light',
            addClassNames: true,
            axes: [{
                startValue: 0,
                endValue: 100,
                bands: [],
                bottomText: ''
            }],
            arrows: [{
                nailAlpha: 0,
                borderAlpha: 0,
                nailBorderThickness: 6
            }]
        };
    };

    class GaugeChartController extends PointValueController {
        constructor() {
            super(...arguments);

            this.chartOptions = defaultOptions();
        }

        $onInit() {
            this.updateChart();
            this.loadAmCharts();

            if (this.autoStart || this.autoEnd) {
                this.$scope.$watch('$ctrl.pointStats', (newValue, oldValue) => {
                    if (newValue === undefined) return;
    
                    if (this.autoStart) {
                        this.start = Math.floor(newValue.minimum.value / 10) * 10;
                    }
                    if (this.autoEnd) {
                        this.end =  Math.ceil(newValue.maximum.value / 10) * 10;
                    }
                    this.updateChart();
                });
            }
        }
    
        $onChanges(changes) {
            super.$onChanges(...arguments);
            
            let optionsChanged = false;
            for (const key in changes) {
                if (key !== 'point' && key !== 'pointXid' && key !== 'value' && !changes[key].isFirstChange()) {
                    optionsChanged = true;
                    break;
                }
            }
            
            let bandsChanged = false;
            if (changes.bands && !changes.bands.isFirstChange()) {
                bandsChanged = true;
            }
            
            if (optionsChanged || bandsChanged) {
                this.updateChart();
            }
        }
        
        loadAmCharts() {
            const promise = Promise.all([
                import(/* webpackMode: "lazy", webpackChunkName: "amcharts" */ 'amcharts/gauge'),
                import(/* webpackMode: "lazy", webpackChunkName: "amcharts" */ 'amcharts/plugins/export/export'),
                import(/* webpackMode: "lazy", webpackChunkName: "amcharts" */ 'amcharts/plugins/export/export.css')
            ]);
            
            maUtil.toAngularPromise(promise).then(([AmCharts]) => {
                const $chartElement = this.$element.maFind('.amchart');
                $chartElement.removeClass('amchart-loading');

                const options = this.chartOptions;
                if (!Array.isArray(options.listeners)) {
                    options.listeners = [];
                }
                options.listeners.push({
                    event: 'init',
                    method: this.chartInitialized.bind(this)
                });
                
                const chart = AmCharts.makeChart($chartElement[0], options);
                this.$scope.$on('$destroy', () => {
                    chart.clear();
                });
            });
        }
    
        valueChangeHandler() {
            super.valueChangeHandler(...arguments);
            this.updateChartValue();
        }
    
        updateChartValue() {
            if (!this.chart) return;
            
            const value = this.getValue();
            const textValue = this.getTextValue();
            
            this.chart.arrows[0].setValue(value || 0);
            this.chart.axes[0].setBottomText(textValue);
        }
    
        updateChart() {
            const options = angular.merge(this.chartOptions, this.options);
            const axis = options.axes[0];
            const arrow = options.arrows[0];
            
            axis.bands = [];
            axis.startValue = asNumber(this.start);
            axis.endValue = asNumber(this.end, 100);
    
            if (this.band1End != null) {
                const stop1 = asNumber(this.band1End);
                axis.bands.push({
                    id: 'band1',
                    color: this.band1Color || '#84b761',
                    startValue: axis.startValue,
                    endValue: stop1
                });
                if (!this.end)
                    axis.endValue = stop1;
            }
            if (this.band1End != null && this.band2End != null) {
                const stop2 = asNumber(this.band2End);
                axis.bands.push({
                    id: 'band2',
                    color: this.band2Color || '#fdd400',
                    startValue: axis.bands[0].endValue,
                    endValue: stop2
                });
                if (!this.end)
                    axis.endValue = stop2;
            }
            if (this.band1End != null && this.band2End != null && this.band3End != null) {
                const stop3 = asNumber(this.band3End);
                axis.bands.push({
                    id: 'band3',
                    color: this.band3Color || '#cc4748',
                    startValue: axis.bands[1].endValue,
                    endValue: stop3
                });
                if (!this.end)
                    axis.endValue = stop3;
            }
            
            if (Array.isArray(this.bands)) {
                axis.bands = this.bands;
                this.bands.forEach((band, i, array) => {
                    if (!band.id) {
                        band.id = `band${i}`;
                    }
                    if (!isFinite(band.startValue)) {
                        const prevBand = i > 0 && array[i - 1];
                        if (prevBand && isFinite(prevBand.endValue)) {
                            band.startValue = prevBand.endValue;
                        } else {
                            band.startValue = 0;
                        }
                    }
                    if (!isFinite(band.endValue)) {
                        const nextBand = array.length > i + 1 && array[i + 1];
                        if (nextBand && isFinite(nextBand.startValue)) {
                            band.endValue = nextBand.startValue;
                        } else {
                            band.endValue = 100;
                        }
                    }
                });
                
                if (axis.bands.length) {
                    if (this.start == null) {
                        axis.startValue = axis.bands[0].startValue;
                    }
                    if (this.end == null) {
                        axis.endValue = axis.bands[axis.bands.length - 1].endValue;
                    }
                }
            }
            
            axis.valueInterval = asNumber(this.interval, (axis.endValue - axis.startValue) / 5);
            
            axis.radius = this.radius || '100%';
            axis.bottomTextYOffset =  asNumber(this.valueOffset, -20);
            axis.bottomTextFontSize =  asNumber(this.valueFontSize, 12);
            axis.axisThickness =  asNumber(this.axisThickness, 1);
            axis.axisAlpha =  asNumber(this.axisAlpha, 0.5);
            axis.tickAlpha =  asNumber(this.axisAlpha, 0.5);
            
            if (this.axisLabelFontSize != null) {
                axis.fontSize = asNumber(this.axisLabelFontSize);
            }
            if (this.tickInterval != null) {
                axis.minorTickInterval = asNumber(this.tickInterval);
            }
            
            arrow.nailRadius = asNumber(this.arrowInnerRadius, 8);
            arrow.innerRadius = arrow.nailRadius + 3;
            arrow.alpha = asNumber(this.arrowAlpha, 1);
            arrow.nailBorderAlpha = arrow.alpha;

            if (this.chart) {
                this.chart.validateNow();
            }
        }
        
        chartInitialized(event) {
            this.chart = event.chart;
            this.updateChartValue();
        }
    }
    
    return {
        restrict: 'E',
        template: gaugeChartTemplate,
        scope: {},
        controller: GaugeChartController,
        controllerAs: '$ctrl',
        bindToController: {
          point: '<?',
          pointXid: '@?',
          start: '<?',
          end: '<?',
          autoStart: '<?',
          autoEnd: '<?',
          interval: '<?',
          band1End: '<?',
          band1Color: '@',
          band2End: '<?',
          band2Color: '@',
          band3End: '<?',
          band3Color: '@',
          bands: '<?',
          radius: '@',
          valueOffset: '<?',
          valueFontSize: '<?',
          axisLabelFontSize: '<?',
          axisThickness: '<?',
          tickInterval: '<?',
          arrowInnerRadius: '<?',
          arrowAlpha: '<?',
          axisAlpha: '<?',
          options: '<?',
          value: '<?',
          renderValue: '&?',
          labelAttr: '@?label',
          labelExpression: '&?'
        },
        designerInfo: {
            translation: 'ui.components.gaugeChart',
            icon: 'donut_large',
            category: 'pointValue',
            size: {
                width: '200px',
                height: '200px'
            },
            attributes: {
                point: {nameTr: 'ui.app.dataPoint', type: 'datapoint'},
                pointXid: {nameTr: 'ui.components.dataPointXid', type: 'datapoint-xid'},
                band1Color: {type: 'color'},
                band2Color: {type: 'color'},
                band3Color: {type: 'color'},
                autoStart: {type: 'boolean'},
                autoEnd: {type: 'boolean'},
                label: {options: ['NAME', 'DEVICE_AND_NAME', 'DEVICE_AND_NAME_WITH_TAGS']}
            }
        }
    };
}

export default gaugeChart;


