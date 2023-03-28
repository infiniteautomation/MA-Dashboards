/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import deviceNameListMdTemplate from './deviceNameList-md.html';
import deviceNameListTemplate from './deviceNameList.html';

/**
 * @ngdoc directive
 * @name ngMango.directive:maDeviceNameList
 * @restrict E
 * @description
 * `<ma-device-name-list ng-model="myDeviceName" data-source-xid="myDataSource.xid"></ma-device-name-list>`
 * - Displays a list of Mango device names in a drop down selector. The selected device name will be outputed to the
 *   variable specified by the `ng-model` attribute.
 * - In the example below a list a points is generated that have the specified device name.
 * - <a ui-sref="ui.helps.examples.basics.dataSourceAndDeviceList">View Demo</a>
 *
 * @param {object} ng-model Variable to hold the selected device name.
 * @param {boolean=} auto-init Enables auto selecting of the first device name in the list. (Defaults to `true`)
 * @param {expression=} data-source-xid Expression which should evaluate to a string. If provided will filter device names to a specific data source by xid.
 * @param {number=} data-source-id If provided will filter device names to a specific data source by id.
 * @param {expression=} contains Expression which should evaluate to a string. If provided will filter device names to those containing the specified string.
 *     Capitalization sensitive. (eg: `'Meta'`)
 * @param {boolean=} show-clear If set to `true` a clear option will be shown at the top of the the list, allowing you to set
 * the data source to undefined. (Defaults to `false`)
 * @param {expression=} on-query Expression is evaluated when querying starts. Available scope parameters are `$promise`.
 *
 * @usage
 * <md-input-container>
        <label>Device names for selected data source</label>
        <ma-device-name-list ng-model="myDeviceName" data-source-xid="myDataSource.xid"></ma-device-name-list>
    </md-input-container>

    <md-input-container>
        <label>Points for selected device name</label>
        <ma-point-list query="{deviceName: myDeviceName}" limit="100" ng-model="myPoint"></ma-point-list>
    </md-input-container>
 *
 */
deviceNameList.$inject = ['maDeviceName', '$injector'];
function deviceNameList(DeviceName, $injector) {
    return {
        restrict: 'E',
        require: 'ngModel',
        designerInfo: {
            translation: 'ui.components.deviceNameList',
            icon: 'view_list',
            category: 'dropDowns'
        },
        scope: {
            // attributes that start with data- have the prefix stripped
            dataSourceId: '<?sourceId',
            dataSourceXid: '<?sourceXid',
            contains: '<?',
            autoInit: '<?',
            showClear: '<?',
            onQuery: '&?'
        },
        template: function(element, attrs) {
          if ($injector.has('mdSelectDirective') || $injector.has('mdAutocompleteDirective')) {
              return deviceNameListMdTemplate;
          }
          return deviceNameListTemplate;
        },
        replace: true,
        link: function ($scope, $element, attrs, ngModelCtrl) {
            if ($scope.autoInit === undefined) {
                $scope.autoInit = true;
            }

            let promise;
            $scope.onOpen = function onOpen() {
                return promise;
            };

            $scope.$watchGroup(['dataSourceId', 'dataSourceXid', 'contains'], function(value) {
                let queryResult;
                if ($scope.dataSourceId !== undefined) {
                    queryResult = DeviceName.byDataSourceId({id: $scope.dataSourceId, contains: $scope.contains});
                } else if ($scope.dataSourceXid !== undefined) {
                    queryResult = DeviceName.byDataSourceXid({xid: $scope.dataSourceXid, contains: $scope.contains});
                } else {
                    queryResult = DeviceName.query({contains: $scope.contains});
                }

                $scope.deviceNames = [];
                promise = queryResult.$promise.then(function(deviceNames) {
                    $scope.deviceNames = deviceNames;
                    if ($scope.autoInit && deviceNames.length && deviceNames.indexOf(ngModelCtrl.$viewValue) < 0) {
                        ngModelCtrl.$setViewValue(deviceNames[0]);
                    }
                });

                if ($scope.onQuery) {
                    $scope.onQuery({$promise: promise});
                }
            });
        }
    };
}

export default deviceNameList;


