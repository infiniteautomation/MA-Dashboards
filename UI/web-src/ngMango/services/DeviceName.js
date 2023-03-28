/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

/**
* @ngdoc service
* @name ngMangoServices.maDeviceName
*
* @description
* Provides a service for getting list of device names from the Mango system.
* - Used by <a ui-sref="ui.helps.docs.ngMango.maDeviceNameList">`<ma-device-name-list>`</a> and
*   <a ui-sref="ui.helps.docs.ngMango.maDeviceNameQuery">`<ma-device-name-query>`</a> directives.
* - All methods return [$resource](https://docs.angularjs.org/api/ngResource/service/$resource) objects that can call the
*   following methods available to those objects:
*   - `$save`
*   - `$remove`
*   - `$delete`
*   - `$get`
*
* # Usage
*
* <pre prettyprint-mode="javascript">
* const queryResult = DeviceName.byDataSourceXid({xid: $scope.dataSourceXid, contains: $scope.contains});
* </pre>
*
* You can also access the raw `$http` promise via the `$promise` property on the object returned:
* <pre prettyprint-mode="javascript">
* promise = queryResult.$promise.then(function(deviceNames) {
    $scope.deviceNames = deviceNames;
    if ($scope.autoInit && deviceNames.length) {
        $scope.ngModel = deviceNames[0];
    }
});
* </pre>
*
*
*/


/**
* @ngdoc method
* @methodOf ngMangoServices.maDeviceName
* @name DeviceName#get
*
* @description
* A default action provided by $resource. Makes a http GET call to the rest endpoint `/rest/latest/device-names`
* @param {object} query Object for the query, can have a `contains` property for querying device names that contain the given string.
* @returns {array} Returns an Array of device name objects matching the query. Objects will be of the resource class and have
*     resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maDeviceName
* @name DeviceName#save
*
* @description
* A default action provided by $resource. Makes a http POST call to the rest endpoint `/rest/latest/device-names`
* @param {object} query Object for the query, can have a `contains` property for querying device names that contain the given string.
* @returns {array} Returns an Array of device name objects matching the query. Objects will be of the resource class and have
*     resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maDeviceName
* @name DeviceName#remove
*
* @description
* A default action provided by $resource. Makes a http DELETE call to the rest endpoint `/rest/latest/device-names`
* @param {object} query Object for the query, can have a `contains` property for querying device names that contain the given string.
* @returns {array} Returns an Array of device name objects matching the query. Objects will be of the resource class and have
*     resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maDeviceName
* @name DeviceName#delete
*
* @description
* A default action provided by $resource. Makes a http DELETE call to the rest endpoint `/rest/latest/device-names`
* @param {object} query Object for the query, can have a `contains` property for querying device names that contain the given string.
* @returns {array} Returns an Array of device name objects matching the query. Objects will be of the resource class and have
*     resource actions available to them.
*
*/


/**
* @ngdoc method
* @methodOf ngMangoServices.maDeviceName
* @name DeviceName#query
*
* @description
* A default action provided by $resource. Makes a http GET call to the rest endpoint `/rest/latest/device-names`
* @param {object} query Object for the query, can have a `contains` property for querying device names that contain the given string.
* @returns {array} Returns an Array of device name objects matching the query. Objects will be of the resource class and have
*     resource actions available to them.
*
*/


/**
* @ngdoc method
* @methodOf ngMangoServices.maDeviceName
* @name DeviceName#byDataSourceId
*
* @description
* Passed a object with the ID of the datasource that the device belongs to and returns a data source object.
* Makes a http GET call to the rest endpoint `/rest/latest/device-names/by-data-source-id/:id'`
* @param {object} Query Object containing an `id` property.
* @returns {array} Returns an Array of device name objects matching the query. Objects will be of the resource class and have
*     resource actions available to them.
*
*/


/**
* @ngdoc method
* @methodOf ngMangoServices.maDeviceName
* @name DeviceName#byDataSourceXid
*
* @description
* Passed an object with the XID of the datasource that the device belongs to and returns a data source object.
* Makes a http GET call to the rest endpoint `/rest/latest/device-names/by-data-source-xid/:id'`
* @param {object} Query Object containing an `xid` property.
* @returns {array} Returns an Array of device name objects matching the query. Objects will be of the resource class and have
*     resource actions available to them.
*
*/


function DeviceNameFactory($resource) {
    const DeviceName = $resource('/rest/latest/device-names', {}, {
        query: {
            method: 'GET',
            isArray: true
        },
        byDataSourceId: {
            url: '/rest/latest/device-names/by-data-source-id/:id',
            method: 'GET',
            isArray: true
        },
        byDataSourceXid: {
            url: '/rest/latest/device-names/by-data-source-xid/:xid',
            method: 'GET',
            isArray: true
        }
    });

    return DeviceName;
}

DeviceNameFactory.$inject = ['$resource'];
export default DeviceNameFactory;


