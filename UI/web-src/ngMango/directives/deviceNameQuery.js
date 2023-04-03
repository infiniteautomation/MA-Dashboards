/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */


/**
 * @ngdoc directive
 * @name ngMango.directive:maDeviceNameQuery
 * @restrict E
 * @description
 * `<ma-device-name-query device-names="deviceNames" contains="'meter'"></ma-device-name-query>`
 * - Outputs an array of Mango device names.
 * - In the example below the list is filtered to those containing a specified string and the resulting array is printed to the screen.
 * - <a ui-sref="ui.helps.examples.basics.dataSourceAndDeviceList">View Demo</a>
 *
 * @param {expression} device-names Assignable expression. Outputs the device names as an array of strings.
 * @param {expression=} data-source-xid Expression which should evaluate to a string. If provided will filter device names to a specific data source by xid.
 * @param {number=} data-source-id If provided will filter device names to a specific data source by id.
 * @param {expression=} contains Expression which should evaluate to a string. If provided will filter device names to those containing the specified string.
 *     Capitalization sensitive. (eg: `'Meta'`)
 *
 * @usage
 * <h2>Device names containing 'meter'</h2>
    <ma-device-name-query device-names="deviceNames" contains="'meter'"></ma-device-name-query>
    <pre ng-bind="deviceNames | json"></pre>
 *
 */
function deviceNameQuery(DeviceName) {
    return {
        scope: {
            // attributes that start with data- have the prefix stripped
            dataSourceId: '<?sourceId',
            dataSourceXid: '<?sourceXid',
            contains: '<?',
            deviceNames: '=?'
        },
        link: function ($scope, $element, attrs) {
            $scope.$watchGroup(['dataSourceId', 'dataSourceXid', 'contains'], function(value) {
                let queryResult;
                if (!($element.attr('data-source-id') || $element.attr('data-source-xid') )) {
                    queryResult = DeviceName.query({contains: $scope.contains});
                } else if ($scope.dataSourceId !== undefined) {
                    queryResult = DeviceName.byDataSourceId({id: $scope.dataSourceId, contains: $scope.contains});
                } else if ($scope.dataSourceXid !== undefined) {
                    queryResult = DeviceName.byDataSourceXid({xid: $scope.dataSourceXid, contains: $scope.contains});
                } else {
                    return;
                }

                $scope.deviceNames = queryResult;
            });
        },
        designerInfo: {
            translation: 'ui.components.deviceNameQuery',
            icon: 'device_hub'
        }
    };
}

deviceNameQuery.$inject = ['maDeviceName'];
export default deviceNameQuery;


