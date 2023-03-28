/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

/**
 * @ngdoc directive 
 * @name ngMango.directive:maPointList
 * @restrict E
 * @description
 * `<ma-point-list limit="200" ng-model="myPoint"></ma-point-list>`
 * - Displays a list of data points which you can select from.
 * - You can optionally supply the `query` attribute to filter the list of points using an object where the keys are
 the property names to filter on, or supply a RQL query string inside single quotes.
 * - All data points added to your Mango system will display by default, unless you set the `limit` property.
 * - <a ui-sref="ui.helps.examples.basics.pointList">View Demo</a>
 *
 * @param {object} ng-model Variable to hold the selected data point.
 * @param {boolean=} init-point Enables auto selecting of the first data point in the list. (Defaults to `true`)
 * @param {object=} query Filters the results by a property of the data points
 *     (eg: `{name: 'meta'}` returns data points containing the string `'meta'` in the `name` property)
 * @param {string[]=} sort Sorts the resulting list by a properties of the data points. Passed as array of strings.
 *     (eg: `['-xid']` sorts descending by xid of the data points. Defaults to `['name']`)
 * @param {number=} start Sets the starting index for the resulting list. Must be used in conjunction with a `limit` value. (Defaults to `0`)
 * @param {number=} limit Limits the results in the list to a specified number of data points. Limit takes place after query and sorting (no limit by defualt)
 *
 * @usage
 * <ma-point-list limit="200" ng-model="myPoint2" query="{name: 'meta'}"></ma-point-list>
 */
function pointList(Point, $injector) {
    const DEFAULT_SORT = ['deviceName', 'name'];

    return {
        restrict: 'E',
        require: 'ngModel',
        designerInfo: {
            translation: 'ui.components.pointList',
            icon: 'view_list',
            category: 'dropDowns'
        },
        scope: {
            ngModel: '=',
            initPoint: '=?',
            query: '=',
            start: '=',
            limit: '=',
            sort: '='
        },
        template: function(element, attrs) {
          let optionsExpr = 'pointLabel(point) for point in points';
          if (attrs.xidAsModel === 'true') {
            optionsExpr = 'point.xid as ' + optionsExpr;
          } else {
            optionsExpr += ' track by point.id';
          }

          if ($injector.has('$mdUtil')) {
              return '<md-select md-on-open="onOpen()">' +
              '<md-option ng-value="point" ng-repeat="point in points track by point.id">{{pointLabel(point)}}</md-option>' +
              '</md-select>';
          }

          return '<select ng-options="' + optionsExpr + '"></select>';
        },
        replace: true,
        link: function ($scope, $element, attrs) {
            if ($scope.initPoint === undefined) {
                $scope.initPoint = true;
            }

            let promise;
            $scope.onOpen = function onOpen() {
                return promise;
            };

            $scope.$watch(function() {
                return {
                    query: $scope.query,
                    start: $scope.start,
                    limit: $scope.limit,
                    sort: $scope.sort
                };
            }, function(value) {
                $scope.points = [];
                value.sort = value.sort || DEFAULT_SORT;
                promise = Point.objQuery(value).$promise;

                promise.then(function(points) {
                    $scope.points = points;

                    if ($scope.initPoint && !$scope.autoInitDone && !$scope.ngModel && $scope.points.length) {
                        $scope.ngModel = $scope.points[0];
                        $scope.autoInitDone = true;
                    }
                });
            }, true);

            $scope.pointLabel = function(point) {
                return point && point.formatLabel();
            };
        }
    };
}

pointList.$inject = ['maPoint', '$injector'];
export default pointList;


