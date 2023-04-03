/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */



/**
 * @ngdoc directive 
 * @name ngMango.directive:maPointQuery
 * @restrict E
 * @description
 * `<ma-point-query query="{$and: true, deviceName:dvName, name:ptName}" limit="5" points="points"></ma-point-query>`
 * - Outputs an array of  data points in your Mango system.
 * - The `query` attribute filters the array of points using an object where the keys are
 the property names to filter on, or supply a RQL query string inside single quotes.
 * - All data points added to your Mango system will display by default, unless you set the `limit` property.
 * - <a ui-sref="ui.helps.examples.pointArrays.dataPointTable">View Demo</a>
 *
 * @param {expression} points Assignable expression to output the array of point objects returned by the query.
 * @param {object} query Filters the results by a property of the data points
 *     (eg: `{name: 'meta'}` returns data points containing the string `'meta'` in the `name` property)
 * @param {string[]=} sort Sorts the resulting list by a properties of the data points. Passed as array of strings.
 *     (eg: `['-xid']` sorts descending by xid of the data points. Defaults to `['name']`)
 * @param {number=} start Sets the starting index for the resulting list. Must be used in conjunction with a `limit` value. (Defaults to `0`)
 * @param {number=} limit Limits the results in the list to a specified number of data points. Limit takes place after query and sorting (no limit by defualt)
 * @param {object=} promise Promise object used to tell if query data is being fetched.
 * @param {boolean=} clear-on-query REPLACE
 *
 *
 * @usage
 * <ma-point-query query="{name:query.filter, deviceName:query.filter}" limit="query.limit"
 start="(query.page-1)*query.limit" sort="query.order" points="points" promise="promise"></ma-point-query>
 *
 */
function pointQuery(Point) {
    const DEFAULT_SORT = ['deviceName', 'name'];

    return {
        scope: {
            query: '<?',
            start: '<?',
            limit: '<?',
            sort: '<?',
            points: '=?',
            promise: '=?',
            clearOnQuery: '<?',
            pointsChanged: '&?'
        },
        designerInfo: {
            translation: 'ui.components.pointQuery',
            icon: 'find_in_page',
            category: 'pointValuesAndCharts'
        },
        link: function ($scope, $element, attr) {
            $scope.$watch(function() {
                return {
                    query: $scope.query,
                    start: $scope.start,
                    limit: $scope.limit,
                    sort: $scope.sort
                };
            }, function(value) {
                value.sort = value.sort || DEFAULT_SORT;
                const newPoints = Point.objQuery(value);
                $scope.promise = newPoints.$promise;

                if ($scope.clearOnQuery) {
                    $scope.points = newPoints;
                } else {
                    newPoints.$promise.then(pts => {
                        $scope.points = newPoints;
                    }, e => null);
                }
                
                if (typeof $scope.pointsChanged === 'function') {
                    newPoints.$promise.then(pts => {
                        $scope.pointsChanged({$points: pts});
                    }, e => null);
                }
            }, true);
        }
    };
}

pointQuery.$inject = ['maPoint'];
export default pointQuery;


