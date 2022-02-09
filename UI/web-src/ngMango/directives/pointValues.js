/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import moment from 'moment-timezone';
import noDataForPeriod from '../img/noDataForPeriod.svg';

/**
 * @ngdoc directive
 * @name ngMango.directive:maPointValues
 *
 * @description
 * `<ma-point-values point="point1" values="point1Values" from="from" to="to" rollup="AVERAGE" rollup-interval="1 minutes">
</ma-point-values>`
 * - The `<ma-point-values>` directive returns an array of historical values on a data point to its `values` attribute.
 * -  `<ma-point-values>` is passed a `to` & `from` values from a date picker.
 * - Additionally, `rollup` & `rollup-interval` can be used to average the data
 * - You can use the `point-xid` property or pass in a point from `<ma-point-list>`.
 * - <a ui-sref="ui.examples.basics.pointValues">View <strong>to/from</strong> Demo</a> /
 *   <a ui-sref="ui.examples.basics.latestPointValues">View <strong>latest values</strong> Demo</a>
 * @param {object} point Inputs a `point` object from `<ma-point-list>`
 * @param {object=} points Alternatively you can input an array of points from `<ma-point-query>`
 * @param {string=} point-xid Alternatively you can pass in the `xid` of a point to use.
 * @param {expression} values Assignable expression to output the array of point values.
 * @param {object} from The starting time to query the point values over a time period.
 * @param {object} to The ending time to query the point values over a time period.
 * @param {number=} latest Rather then `to/from` you can choose to use this property with the latest `X` number of values.
 * @param {boolean=} realtime Used with the `latest` attribute, if set to `true` the latest `X` number of values will update
 *     as new values are pushed to a data point.
 * @param {string=} rollup The statistical operation to apply to the values over the given `rollup-interval`.
 *     This will effect the outputted `values`. Rollup possibilities are:
<ul>
    <li>POINT_DEFAULT</li>
    <li>NONE</li>
    <li>AVERAGE</li>
    <li>DELTA</li>
    <li>MINIMUM</li>
    <li>MAXIMUM</li>
    <li>ACCUMULATOR</li>
    <li>SUM</li>
    <li>FIRST</li>
    <li>LAST</li>
    <li>COUNT</li>
    <li>INTEGRAL</li>
    <li>SIMPLIFY</li>
</ul>
 * @param {string=} rollup-interval The interval used with the rollup. Format the interval duration as a string starting
 *     with a number followed by one of these units:
<ul>
    <li>years</li>
    <li>months</li>
    <li>weeks</li>
    <li>days</li>
    <li>hours</li>
    <li>minutes</li>
    <li>seconds</li>
    <li>milliseconds</li>
</ul>
 * @param {boolean=} rendered If set to `true` the values will be outputted in the points text rendered value format.
 * @param {boolean=} timezone The output date will have the given timezone.
 * @param {boolean=} use-cache Set to true to use cached values.
 * @param {function=} on-values-updated Pass in a function or expression to be evaluated when the values update. (eg.
 *     `on-values-updated="$ctrl.valuesUpdated($values)"`)
 * @param {string=} date-format If you are passing in `to/from` as strings, then you must specify the moment.js format for
 *     parsing the values.
 * @param {number=} timeout If provided you can set the timeout (in milliseconds) on the querying of point values.
 *     If not supplied the Mango system default timeout will be used.
 * @param {boolean=} [auto-rollup-interval=false] If set to `true` the rollup interval will automatically be set based on the
 *     to-from duration and rollup type.  `DELTA` rollup type will have a more chunked rollup interval.
 *     If turned on the manually set `rollup-interval` value will be ignored.
 * @param {number=} simplify-tolerance Only used if rollup is set to SIMPLIFY. Sets the tolerance for the simplify algorithm.
 * @param {number=} [simplify-target=1000] Only used if rollup is set to SIMPLIFY and simplifyTolerance is not set.
 *     Sets the target number of values for the simplify algorithm.
 * @param {boolean=} [bookend=true] Insert bookend values at the start and end of the time range for ease of charting.
 * @usage
 *
<ma-point-values point="point1" values="point1Values" from="from" to="to" rollup="AVERAGE" rollup-interval="1 minutes">
</ma-point-values>
 *
 */
pointValues.$inject = ['$http', 'maPointEventManager', 'maPoint', '$q', 'maUtil', 'maPointValues'];
function pointValues($http, pointEventManager, Point, $q, Util, pointValues) {
    return {
        designerInfo: {
            translation: 'ui.components.pointValues',
            icon: 'list',
            category: 'pointValuesAndCharts',
            attributes: {
                from: {defaultValue: 'dateBar.from'},
                to: {defaultValue: 'dateBar.to'},
                rollup: {
                    defaultValue: '{{dateBar.rollupType}}',
                    options: ['NONE', 'AVERAGE', 'DELTA', 'MINIMUM', 'MAXIMUM', 'ACCUMULATOR',
                        'SUM', 'FIRST', 'LAST', 'COUNT', 'INTEGRAL', 'SIMPLIFY']
                },
                rollupInterval: {defaultValue: '{{dateBar.rollupIntervals + \' \' + dateBar.rollupIntervalPeriod}}'},
                points: {defaultValue: 'designer.points'}
            }
        },
        scope: {
            point: '<?',
            points: '<?',
            pointXid: '@',
            values: '=?',
            from: '<?',
            to: '<?',
            latest: '<?',
            realtime: '<?',
            useCache: '<?',
            rollup: '@',
            rollupInterval: '@',
            rendered: '<?',
            dateFormat: '@',
            timeout: '<?',
            autoRollupInterval: '<?',
            timezone: '@',
            onValuesUpdated: '&?',
            simplifyTolerance: '<?',
            simplifyTarget: '<?',
            bookend: '<?',
            fields: '<?'
        },
        bindToController: {
            refresh: '<?'
        },
        controller: ['$scope', function($scope) {
            $scope.refreshCount = 0;

            this.$onChanges = function(changes) {
                if (changes.refresh) {
                    $scope.refreshCount++;
                }
            };
        }],
        link: function ($scope, $element, attrs) {
            let pendingRequest = null;
            const values = {};
            const tempValues = {};
            const subscriptions = {};

            const singlePoint = !attrs.points;
            if ($scope.realtime === undefined) $scope.realtime = true;

            $scope.$on('$destroy', () => {
                unsubscribe();
            });

            $scope.$watch('realtime', (newValue, oldValue) => {
                if (newValue !== oldValue) {
                    if (newValue) {
                        subscribe();
                    } else {
                        unsubscribe();
                    }
                }
            });

            $scope.$watch(() => {
                const xids = [];
                if ($scope.points) {
                    for (let i = 0; i < $scope.points.length; i++) {
                        if (!$scope.points[i]) continue;
                        xids.push($scope.points[i].xid);
                    }
                }

                return {
                    xids: xids,
                    from: moment.isMoment($scope.from) ? $scope.from.valueOf() : $scope.from,
                    to: moment.isMoment($scope.to) ? $scope.to.valueOf() : $scope.to,
                    latest: $scope.latest,
                    useCache: $scope.useCache,
                    refreshCount: $scope.refreshCount,
                    realtime: $scope.realtime,
                    rollup: $scope.rollup,
                    rollupInterval: $scope.rollupInterval,
                    rendered: $scope.rendered,
                    autoRollupInterval: $scope.autoRollupInterval,
                    simplifyTolerance: $scope.simplifyTolerance,
                    fields: $scope.fields
                };
            }, (newValue, oldValue) => {
                let changedXids;

                // check initialization scenario
                if (newValue === oldValue) {
                    changedXids = {
                        added: newValue.xids || [],
                        removed: []
                    };
                } else {
                    changedXids = Util.arrayDiff(newValue.xids, oldValue.xids);
                }

                for (let i = 0; i < changedXids.removed.length; i++) {
                    const removedXid = changedXids.removed[i];
                    unsubscribe(removedXid);

                    // delete values and temp values if they exist
                    delete values[removedXid];
                    delete tempValues[removedXid];

                    // remove old values
                    if (singlePoint) {
                        delete $scope.values;
                    } else if ($scope.values) {
                        // remove values for xid from combined values
                        for (let j = 0; j < $scope.values.length; j++) {
                            const item = $scope.values[j];
                            delete item['value_' + removedXid];
                            delete item['value_' + removedXid + '_rendered'];
                            // if this was the last value for this timestamp remove
                            // the item from the combined values
                            if (Util.numKeys(item, 'value') === 0) {
                                $scope.values.splice(j--, 1);
                            }
                        }
                    }
                }

                for (let i = 0; i < changedXids.added.length; i++) {
                    if ($scope.realtime && $scope.latest) {
                        subscribe(changedXids.added[i]);
                    }
                }

                if (!$scope.points || !$scope.points.length) return;

                // Calculate rollups automatically based on to/from/type (if turned on)
                if ($scope.autoRollupInterval) {
                    $scope.actualRollupInterval = Util.rollupIntervalCalculator($scope.from, $scope.to, $scope.rollup);
                } else {
                    $scope.actualRollupInterval = $scope.rollupInterval;
                }

                // cancel existing requests if there are any
                if (pendingRequest) {
                    pendingRequest.cancel();
                    pendingRequest = null;
                }

                const points = $scope.points.filter(p => p && p.xid);
                const promises = points.map(p => {
                    if (!p.pointLocator) {
                        return Point.get({xid: p.xid}).$promise.then(doQuery);
                    }
                    return doQuery(p);
                });

                pendingRequest = $q.all(promises).then(results => {
                    if (!results.length) return;

                    for (let i = 0; i < results.length; i++) {
                        const point = points[i];
                        const pointXid = point.xid;
                        const pointValues = results[i];

                        pointValues.concat(tempValues[pointXid]);
                        delete tempValues[pointXid];

                        if ($scope.latest) {
                            limitValues(pointValues);
                        }

                        values[pointXid] = pointValues;
                    }

                    if (singlePoint) {
                        $scope.values = values[points[0].xid];
                        if ($scope.onValuesUpdated)
                            $scope.onValuesUpdated({$values: $scope.values});
                    } else {
                        combineValues();
                    }
                }, error => {
                    // consume error, most likely a cancel, timeouts will be captured by error interceptor
                }).then(() => {
                    pendingRequest = null;
                });

            }, true);

            if (singlePoint) {
                let pointPromise;
                $scope.$watch('pointXid', (newXid, oldXid) => {
                    if (newXid === oldXid && newXid === undefined) return;

                    delete $scope.point;
                    if (pointPromise) {
                        pointPromise.reject();
                        pointPromise = null;
                    }

                    if (!newXid) return;
                    pointPromise = Point.get({xid: newXid}).$promise;
                    pointPromise.then(point => {
                        pointPromise = null;
                        $scope.point = point;
                    });
                });

                $scope.$watch('point.xid', (newValue, oldValue) => {
                    if (newValue === oldValue && newValue === undefined) return;

                    if (newValue) {
                        $scope.points = [$scope.point];
                    } else {
                        $scope.points = [];
                    }
                });
            }

            function combineValues() {
                const combined = {};

                for (const xid in values) {
                    const seriesValues = values[xid];
                    combineInto(combined, seriesValues, xid);
                }

                // convert object into array
                const output = [];
                for (const timestamp in combined) {
                    output.push(combined[timestamp]);
                }

                // sort array by timestamp
                output.sort((a, b) => a.timestamp - b.timestamp);

                $scope.values = output;
                if ($scope.onValuesUpdated)
                    $scope.onValuesUpdated({$values: $scope.values});
            }

            function combineInto(output, newValues, xid) {
                if (!newValues) return;

                for (let i = 0; i < newValues.length; i++) {
                    const value = newValues[i];
                    const timestamp = value.timestamp;

                    if (!output[timestamp]) {
                        output[timestamp] = {timestamp: timestamp};
                    }

                    if ($scope.rollup === 'ALL') {
                        for (const rollupType of Object.keys(value)) {
                            const rollupValue = value[rollupType];
                            if (rollupValue != null && typeof rollupValue === 'object') {
                                const valueField = `${rollupType}_${xid}`;
                                output[timestamp][valueField] = rollupValue.value;
                                if (rollupValue.rendered) {
                                    output[timestamp][valueField + '_rendered'] = rollupValue.rendered;
                                }
                            }
                        }
                    } else {
                        const valueField = `value_${xid}`;
                        output[timestamp][valueField] = value.value;
                        if (value.rendered) {
                            output[timestamp][valueField + '_rendered'] = value.rendered;
                        }
                    }
                }
            }

            function subscribe(xid) {
                if (!xid) {
                    for (let i = 0; i < $scope.points.length; i++) {
                        if (!$scope.points[i]) continue;
                        subscribe($scope.points[i].xid);
                    }
                } else {
                    if (subscriptions[xid]) return;
                    pointEventManager.subscribe(xid, ['UPDATE'], websocketHandler);
                    subscriptions[xid] = true;
                }
            }

            function unsubscribe(xid) {
                if (!xid) {
                    for (const key in subscriptions) {
                        unsubscribe(key);
                    }
                } else if (subscriptions[xid]) {
                    pointEventManager.unsubscribe(xid, ['UPDATE'], websocketHandler);
                    delete subscriptions[xid];
                }
            }

            function websocketHandler(event) {
                const payload = event.payload;
                $scope.$applyAsync(() => {
                    if (!payload.value) return;

                    let xid = payload.xid;
                    let point;
                    if (singlePoint) {
                        if (!$scope.point || $scope.point.xid !== xid) return;
                        point = $scope.point;
                    } else {
                        if (!$scope.points) return;
                        $scope.points.some(pt => {
                            if (pt.xid === xid) {
                                point = pt;
                                return true;
                            }
                        });
                        if (!point) return;
                    }

                    let value;
                    if (payload.convertedValue != null) {
                        value = payload.convertedValue;
                    } else {
                        value = payload.value.value;
                    }

                    const item = {
                        value : value,
                        timestamp : payload.value.timestamp,
                        annotation : payload.value.annotation
                    };

                    if ($scope.rendered) {
                        item.rendered = payload.renderedValue;
                    }

                    if (pendingRequest) {
                        if (!tempValues[xid]) tempValues[xid] = [];
                        tempValues[xid].push(item);
                    } else {
                        values[xid].push(item);
                        if ($scope.latest) {
                            limitValues(values[xid]);
                        }
                        if (!singlePoint) {
                            if ($scope.latest) {
                                combineValues();
                            } else {
                                const last = $scope.values.slice(-1)[0];
                                if (last && last.time === item.timestamp) {
                                    last['value_' + xid] = item.value;
                                    if (item.rendered) {
                                        last['value_' + xid + '_rendered'] = item.rendered;
                                    }
                                } else {
                                    const newVal = {time: item.timestamp};
                                    newVal['value_' + xid] = item.value;
                                    if (item.rendered) {
                                        newVal['value_' + xid + '_rendered'] = item.rendered;
                                    }
                                    $scope.values.push(newVal);
                                }
                                if ($scope.onValuesUpdated)
                                    $scope.onValuesUpdated({$values: $scope.values});
                            }
                        }
                    }
                });
            }

            function limitValues(values) {
                while (values.length > $scope.latest) {
                    values.shift();
                }
            }

            function doQuery(point) {
                try {
                    const dataType = point.pointLocator.dataType;
                    const options = {
                        latest: $scope.latest,
                        useCache: $scope.useCache,
                        dateFormat: $scope.dateFormat,
                        from: $scope.from,
                        to: $scope.to,
                        rollup: $scope.rollup,
                        rendered: $scope.rendered,
                        bookend: $scope.bookend,
                        rollupInterval: $scope.actualRollupInterval,
                        timeout: $scope.timeout,
                        timezone: $scope.timezone,
                        fields: $scope.fields
                    };

                    if (options.rollup === 'POINT_DEFAULT') {
                        options.rollup = point.rollup;

                        if (point.simplifyType === 'TARGET') {
                            options.simplifyTarget = point.simplifyTarget;
                        } else if (point.simplifyType === 'TOLERANCE') {
                            options.simplifyTolerance = point.simplifyTolerance;
                        }
                    } else if (options.rollup === 'SIMPLIFY') {
                        delete options.rollup;

                        if (isFinite($scope.simplifyTolerance) && $scope.simplifyTolerance > 0) {
                            options.simplifyTolerance = $scope.simplifyTolerance;
                        } else if (isFinite($scope.simplifyTarget) && $scope.simplifyTarget > 0) {
                            options.simplifyTarget =  $scope.simplifyTarget;
                        } else {
                            options.simplifyTarget = 1000;
                        }
                    }

                    return pointValues.getPointValuesForXid(point.xid, options);
                } catch (error) {
                    return $q.reject(error);
                }
            }
        } // End link function
    };
}

export default pointValues;


