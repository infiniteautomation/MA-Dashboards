/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import moment from 'moment-timezone';

/**
 * @ngdoc directive
 * @name ngMango.directive:maPointStatistics
 * @restrict E
 * @description
 * `<ma-point-statistics point="myPoint" from="from" to="to" statistics="statsObj"></ma-point-statistics>`
 * - The `<ma-point-statistics>` directive provides access to historical stats over a time range on a data point.
 * - The object returned by the `statistics` attribute contains `first`, `last`, `minimum`, `maximum`, `average`, `integral`, `sum`, & `count` properties.
 Each of these will have a `value` and a `timestamp`.
 * - If you are interested only in the change in a value between two times you can add the optional `first-last="true"`
 *   attribute to only return the first and last values,
 then simply calculate the difference with `statsObj[1].value - statsObj[0].value`.
 * - <a ui-sref="ui.helps.examples.statistics.getStatistics">View Demo</a>
 *
 * @param {object} point Inputs a `point` object from `<ma-point-list>`.
 * @param {object} from Sets the starting time for the time range which is used in the statistical query.
 * @param {object} to Sets the ending time for the time range which is used in the statistical query.
 * @param {object} statistics Outputs the object containing the statistical information. The object will contain the following
 * properties:
 <ul>
    <li>`first`</li>
    <li>`last`</li>
    <li>`minimum`</li>
    <li>`maximum`</li>
    <li>`average`</li>
    <li>`integral`</li>
    <li>`sum`</li>
    <li>`count`</li>
 </ul>
 Each of these will have a value and a timestamp.
 * @param {boolean=} first-last If you are only interested in calculating the delta value, setting this to `true` will
 run a more efficient query and only return `first` and `last` properties as a two item array. You can then calculate the
 delta with `statsObj[1].value - statsObj[0].value`
 * @param {object[]=} points Alternatively you can input an array of points from `<ma-point-query>`. If used the `statistics` object will output an array.
 * @param {string=} point-xid Alternatively you can pass in the `xid` of a point to use.
 * @param {string=} date-format If you are passing in `to/from` as strings, then you must specify the moment.js format for parsing the values.
 * @param {number=} timeout If provided you can set the timeout (in milliseconds) on the querying of of the statistical provider.
 If not supplied the Mango system default timeout will be used.
 * @param {boolean=} rendered (default true) Return the statistics as a rendered value rather than a number
 * @param {string=} display-mode If you want the directive to display a stat value on the page set this attribute to one of
 * the following values (if `delta` is used `rendered` must be `false`, and `first-last="true"` for all other display modes
 * you should leave `first-last="false"`):
 <ul>
 <li>`first`</li>
 <li>`last`</li>
 <li>`minimum`</li>
 <li>`maximum`</li>
 <li>`average`</li>
 <li>`integral`</li>
 <li>`sum`</li>
 <li>`count`</li>
 <li>`delta`</li>
 </ul>
 *
 * @usage
 * <ma-point-statistics point="myPoint" from="from" to="to" statistics="statsObj">
 </ma-point-statistics>
 The average for the period is {{ statsObj.average.value }} at {{ statsObj.average.timestamp | maMoment:'format':'lll' }}
 *
 */
pointValues.$inject = ['maPoint', 'maUtil', '$q', 'maStatistics'];
function pointValues(Point, Util, $q, statistics) {
    return {
        restrict: 'E',
        designerInfo: {
            translation: 'ui.components.pointStatistics',
            icon: 'format_list_numbered',
            category: 'statistics',
            attributes: {
                from: {defaultValue: 'dateBar.from'},
                to: {defaultValue: 'dateBar.to'},
                firstLast: {type: 'boolean', defaultValue: false},
                rendered: {type: 'boolean', defaultValue: true},
                point: {nameTr: 'ui.app.dataPoint', type: 'datapoint'},
                pointXid: {nameTr: 'ui.components.dataPointXid', type: 'datapoint-xid'},
                displayMode: {type: 'string', options: ['first', 'last', 'minimum', 'maximum', 'average', 'integral', 'sum', 'count', 'delta']}
            }
        },
        scope: {
            point: '<?',
            pointXid: '@',
            points: '<?',
            statistics: '=?',
            from: '<?',
            to: '<?',
            dateFormat: '@',
            timeout: '<?',
            firstLast: '<?',
            rendered: '<?',
            displayMode: '@'
        },
        template: '<span ng-if="displayMode && displayMode !== \'delta\'" ng-bind="displayMode === \'count\' ?' +
        ' statistics[displayMode] :' +
        ' statistics[displayMode].value"></span>' +
        '<span ng-if="displayMode && displayMode === \'delta\'" ng-bind="(statistics[1].value - statistics[0].value) +' +
        ' \' \' + point.unit"></span>',
        link: function ($scope, $element, attrs) {
            let pendingRequest = null;
            const stats = {};
            const singlePoint = !attrs.points;

            $scope.$watch('pointXid', function() {
                if (!$scope.pointXid || $scope.point) return;
                $scope.point = Point.get({xid: $scope.pointXid});
            });

            $scope.$watch('point.xid', function(newValue, oldValue) {
                if (newValue === undefined) return;
                $scope.points = [$scope.point];
            });

            $scope.$watch(function() {
                const xids = [];
                if ($scope.points && $scope.points.length > 0) {
                    for (let i = 0; i < $scope.points.length; i++) {
                        if (!$scope.points[i]) continue;
                        xids.push($scope.points[i].xid);
                    }
                }

                return {
                    xids: xids,
                    from: moment.isMoment($scope.from) ? $scope.from.valueOf() : $scope.from,
                    to: moment.isMoment($scope.to) ? $scope.to.valueOf() : $scope.to
                };
            }, function(newValue, oldValue) {
                let changedXids, i;
                
                // check initialization scenario
                if (newValue === oldValue) {
                    changedXids = {
                        added: newValue.xids || [],
                        removed: []
                    };
                } else {
                    changedXids = Util.arrayDiff(newValue.xids, oldValue.xids);
                }

                for (i = 0; i < changedXids.removed.length; i++) {
                    const removedXid = changedXids.removed[i];

                    // delete stats for removed xid from stats object
                    delete stats[removedXid];

                    // remove old values
                    if (singlePoint) {
                        delete $scope.statistics;
                    }
                }

                if (!$scope.points || !$scope.points.length) return;
                const points = $scope.points.slice(0);

                const promises = [];
                
                // cancel existing requests if there are any
                if (pendingRequest) {
                    pendingRequest.cancel();
                    pendingRequest = null;
                }

                for (i = 0; i < points.length; i++) {
                    if (!points[i] || !points[i].xid) continue;
                    const queryPromise = doQuery(points[i]);
                    promises.push(queryPromise);
                }

                pendingRequest = $q.all(promises).then(function(results) {
                    if (!results.length) return;
                    let i;

                    for (i = 0; i < results.length; i++) {
                        const point = points[i];
                        const pointStats = results[i];
                        stats[point.xid] = pointStats;
                    }

                    if (singlePoint) {
                        $scope.statistics = stats[points[0].xid];
                    } else {
                        const outputStats = [];
                        for (i = 0; i < points.length; i++) {
                            outputStats.push(stats[points[i].xid]);
                        }
                        $scope.statistics = outputStats;
                    }
                }, function(error) {
                    // consume error, most likely a cancel, timeouts will be captured by error interceptor
                }).then(function() {
                    pendingRequest = null;
                });
            }, true);

            function doQuery(point) {
                try {
                    const options = {
                        firstLast: $scope.firstLast,
                        dateFormat: $scope.dateFormat,
                        from: $scope.from,
                        to: $scope.to,
                        timeout: $scope.timeout,
                        rendered: $scope.rendered
                    };
                    
                    return statistics.getStatisticsForXid(point.xid, options).then(function(data) {
                        if (data.startsAndRuntimes) {
                            for (let i = 0; i < data.startsAndRuntimes.length; i++) {
                                const statsObj = data.startsAndRuntimes[i];
                                const rendered = point.getTextRenderer().render(statsObj.value);
                                statsObj.renderedValue = rendered.text;
                                statsObj.renderedColor = rendered.color;
                            }
                        }
                        return data;
                    });
                } catch (error) {
                    return $q.reject(error);
                }
            }
        }
    };
}

export default pointValues;


