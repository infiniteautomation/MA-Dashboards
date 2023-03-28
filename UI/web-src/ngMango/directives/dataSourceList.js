/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

/**
 * @ngdoc directive
 * @name ngMango.directive:maDataSourceList
 * @restrict E
 * @description
 * `<ma-data-source-list ng-model="myDataSource"></ma-data-source-list>`
 * - Displays a list of Mango data sources in a drop down selector. The selected data source will be outputed to the
 *     variable specified by the `ng-model` attribute.
 * - <a ui-sref="ui.helps.examples.basics.dataSourceAndDeviceList">View Demo</a>
 *
 * @param {object} ng-model Declare a variable to hold the selected data source object.
 * @param {boolean=} auto-init Enables auto selecting of the first data source in the list (Defaults to `true`)
 * @param {object=} query Filters the results by a property of the data source object (eg: `{name: 'meta'}` returns data
 *     sources containing the string `'meta'` in the `name` property)
 * @param {string[]=} sort Sorts the resulting list by a property of the data source object. Passed as array of strings.
 *     (eg: `['-xid']` sorts descending by xid of data sources. Defaults to `['name']`)
 * @param {number=} start Sets the starting index for the resulting list. Must be used in conjunction with a `limit` value. (Defaults to `0`)
 * @param {number=} limit Limits the results in the list to a specified number of data sources. Limit takes place after query
 * and sorting (no limit by default)
 * @param {boolean=} show-clear If set to `true` a clear option will be shown at the top of the the list, allowing you to set
 * the data source to undefined. (Defaults to `false`)
 * @param {expression=} on-query Expression is evaluated when querying for watch lists. Available scope parameters are `$promise`.
 *
 * @usage
 <md-input-container>
      <label>Choose a data source</label>
      <ma-data-source-list ng-model="myDataSource" auto-init="false" query="{name: 'meta'}" sort="['-name']" start="3"
 limit="6" show-clear="true"></ma-data-source-list>
 </md-input-container>
 
 <p>You have chosen data source "{{myDataSource.name}}". It is {{myDataSource.enabled ? 'enabled' : 'disabled'}} and has an XID of {{myDataSource.xid}}.</p>
 
 */
dataSourceList.$inject = ['maDataSource', '$injector', '$filter', 'maUser'];
function dataSourceList(DataSource, $injector, $filter, User) {
    const DEFAULT_SORT = ['name'];

    return {
        restrict: 'E',
        require: 'ngModel',
        designerInfo: {
            translation: 'ui.components.dataSourceList',
            icon: 'view_list',
            category: 'dropDowns'
        },
        scope: {
            autoInit: '<?',
            query: '<?',
            start: '<?',
            limit: '<?',
            sort: '<?',
            showClear: '<?',
            showNew: '<?',
            onQuery: '&?'
        },
        template: function(element, attrs) {
            if ($injector.has('$mdUtil')) {
                return `<md-select md-on-open="onOpen()" ng-model-options="{trackBy: '$value.xid'}">
                    <md-option ng-if="showClear" ng-value="undefined" md-option-empty><md-icon>clear</md-icon> <em ma-tr="ui.app.clear"></em></md-option>
                    <md-option ng-if="showNew && User.current.hasSystemPermission('permissionDatasource')"
                        ng-value="newValue"><em ma-tr="dsList.createDataSource"></em></md-option>
                    <md-option ng-value="dataSource" ng-repeat="dataSource in dataSources track by dataSource.xid">
                    <span ng-bind="dataSourceLabel(dataSource)"></span>
                </md-option></md-select>`;
            }
            return '<select ng-options="dataSourceLabel(dataSource) for dataSource in dataSources track by dataSource.xid"></select>';
        },
        replace: true,
        link: function ($scope, $element, attrs, ngModelCtrl) {
            $scope.User = User;
            
            DataSource.notificationManager.subscribe((event, item, attributes) => {
                if (Array.isArray($scope.dataSources) && !$scope.query && $scope.start == null && $scope.limit == null) {
                    attributes.updateArray($scope.dataSources);
                    $scope.dataSources = $filter('orderBy')($scope.dataSources, $scope.sort || DEFAULT_SORT);
                }
            }, $scope);
            
            $scope.newValue = {};

            ngModelCtrl.$formatters.push(value => {
                if (value instanceof DataSource && value.isNew()) {
                    return $scope.newValue;
                }
                return value;
            });
            ngModelCtrl.$parsers.push(value => {
                if (value === $scope.newValue) {
                    return new DataSource();
                }
                return value;
            });
            
            if ($scope.autoInit === undefined) {
                $scope.autoInit = true;
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
                $scope.dataSources = [];
                value.sort = value.sort || DEFAULT_SORT;
                promise = DataSource.objQuery(value).$promise;
                
                const finishedPromise = promise.then(function(dataSources) {
                    $scope.dataSources = dataSources;
                    
                    if ($scope.autoInit && $scope.dataSources.length) {
                        let doSet = true;
                        if (ngModelCtrl.$viewValue && ngModelCtrl.$viewValue.xid) {
                            doSet = !dataSources.some(function(ds) {
                                return ds.xid === ngModelCtrl.$viewValue.xid;
                            });
                        }
                        
                        if (doSet) {
                            ngModelCtrl.$setViewValue($scope.dataSources[0]);
                        }
                    }
                });
                

                if ($scope.onQuery) {
                    $scope.onQuery({$promise: finishedPromise});
                }
                
            }, true);

            $scope.dataSourceLabel = function(dataSource) {
                return dataSource.name;
            };
        }
    };
}

export default dataSourceList;


