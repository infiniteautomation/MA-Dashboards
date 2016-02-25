/**
 * Copyright (C) 2015 Deltamation Software. All rights reserved.
 * http://www.deltamation.com.au/
 * @author Jared Wiltshire
 */

define(['amcharts/gauge', 'jquery'], function(AmCharts, $) {
'use strict';

function gaugeChart() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
          value: '=',
          point: '=',
          options: '=?',
          start: '@',
          end: '@',
          band1End: '@',
          band1Color: '@',
          band2End: '@',
          band2Color: '@',
          band3End: '@',
          band3Color: '@',
          interval: '@'
        },
        template: '<div ng-class="classes" class="amchart"></div>',
        link: function ($scope, $element, attributes) {
        	$scope.classes = {};
        	
            var options = defaultOptions();
            if ($scope.start) {
                options.axes[0].startValue = parseFloat($scope.start);
            }
            if ($scope.end) {
            	options.axes[0].endValue = parseFloat($scope.end);
            }
            if ($scope.band1End) {
                var stop1 = parseFloat($scope.band1End);
                options.axes[0].bands.push({
                    id: 'band1',
                    color: $scope.band1Color || "#84b761",
                    startValue: options.axes[0].startValue,
                    endValue: stop1
                });
                if (!$scope.end)
                	options.axes[0].endValue = stop1;
            }
            if ($scope.band2End) {
                var stop2 = parseFloat($scope.band2End);
                options.axes[0].bands.push({
                    id: 'band2',
                    color: $scope.band2Color || "#fdd400",
                    startValue: options.axes[0].bands[0].endValue,
                    endValue: stop2
                });
                if (!$scope.end)
                	options.axes[0].endValue = stop2;
            }
            if ($scope.band3End) {
                var stop3 = parseFloat($scope.band3End);
                options.axes[0].bands.push({
                    id: 'band3',
                    color: $scope.band3Color || "#cc4748",
                    startValue: options.axes[0].bands[1].endValue,
                    endValue: stop3
                });
                if (!$scope.end)
                	options.axes[0].endValue = stop3;
            }
            if ($scope.interval) {
                options.axes[0].valueInterval = parseFloat($scope.interval);
            }

            var chart = AmCharts.makeChart($element[0], $.extend(options, $scope.options));
            
            $scope.$watch('value', function(newValue, oldValue) {
                if (newValue === undefined) return;
                chart.arrows[0].setValue(newValue);
                chart.axes[0].setBottomText(newValue.toFixed(2));
            });
            
            $scope.$watch('point.value', function(newValue, oldValue) {
                if (newValue === undefined) return;
                chart.arrows[0].setValue(newValue);
                chart.axes[0].setBottomText($scope.point.renderedValue);
            });
            
            $scope.$watch('point.xid', function(newValue, oldValue) {
            	if (oldValue) {
            		$scope.point.value = 0;
            		$scope.point.renderedValue = '';
            	}
            });
            
            $scope.$watch('point.enabled', function(newValue) {
            	var disabled = newValue !== undefined && !newValue;
            	$scope.classes['point-disabled'] = disabled;
            });
        }
    };
}

function defaultOptions() {
    return {
        type: "gauge",
        theme: "light",
        addClassNames: true,
        axes: [{
            axisThickness: 1,
            axisAlpha: 0.5,
            tickAlpha: 0.5,
            startValue: 0,
            endValue: 100,
            bands: [],
            bottomText: "",
            bottomTextYOffset: -20
        }],
        arrows: [{}]
    };
}

return gaugeChart;

}); // define
