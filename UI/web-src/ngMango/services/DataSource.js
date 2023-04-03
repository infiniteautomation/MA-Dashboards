/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

/**
* @ngdoc service
* @name ngMangoServices.maDataSource
*
* @description
* Provides a service for getting list of data sources from the Mango system.
* - Used by <a ui-sref="ui.helps.docs.ngMango.maDataSourceList">`<ma-data-source-list>`</a> and
* <a ui-sref="ui.helps.docs.ngMango.maDataSourceQuery">`<ma-data-source-query>`</a> directives.
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
*  const DS = DataSource.getById(xid)
*  DS.name = 'New Name';
*  DS.$save();
* </pre>
*
* You can also access the raw `$http` promise via the `$promise` property on the object returned:
* <pre prettyprint-mode="javascript">
* promise = DataSource.objQuery(value).$promise;
* promise.then(function(dataSources) {
*    $scope.dataSources = dataSources;
*
*    console.log('Data Sources retunrned from server:', dataSources);
* }
* </pre>
*
* Or just assign the return value from a DataSource method to a scope variable:
* <pre prettyprint-mode="javascript">
* $scope.dataSources = DataSource.objQuery(value);
* </pre>
*/


/**
* @ngdoc method
* @methodOf ngMangoServices.maDataSource
* @name DataSource#get
*
* @description
* A default action provided by $resource. Makes a http GET call to the rest endpoint `/rest/latest/data-sources/:xid`
* @param {object} query Object containing a `xid` property which will be used in the query.
* @returns {object} Returns a data source object. Objects will be of the resource class and have resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maDataSource
* @name DataSource#save
*
* @description
* A default action provided by $resource. Makes a http POST call to the rest endpoint `/rest/latest/data-sources/:xid`
* @param {object} query Object containing a `xid` property which will be used in the query.
* @returns {object} Returns a data source object. Objects will be of the resource class and have resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maDataSource
* @name DataSource#remove
*
* @description
* A default action provided by $resource. Makes a http DELETE call to the rest endpoint `/rest/latest/data-sources/:xid`
* @param {object} query Object containing a `xid` property which will be used in the query.
* @returns {object} Returns a data source object. Objects will be of the resource class and have resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maDataSource
* @name DataSource#delete
*
* @description
* A default action provided by $resource. Makes a http DELETE call to the rest endpoint `/rest/latest/data-sources/:xid`
* @param {object} query Object containing a `xid` property which will be used in the query.
* @returns {object} Returns a data source object. Objects will be of the resource class and have resource actions available to them.
*
*/


/**
* @ngdoc method
* @methodOf ngMangoServices.maDataSource
* @name DataSource#query
*
* @description
* Passed an object in the format `{query: 'query', start: 0, limit: 50, sort: ['-xid']}` and returns an Array of datasource objects matching the query.
* @param {object} query xid name for the query. Format: `{query: 'query', start: 0, limit: 50, sort: ['-xid']}`
* @returns {array} Returns an Array of datasource objects matching the query. Objects will be of the resource class and have resource actions available to them.
*
*/


/**
* @ngdoc method
* @methodOf ngMangoServices.maDataSource
* @name DataSource#rql
*
* @description
* Passed a string containing RQL for the query and returns an array of data source objects.
* @param {string} RQL RQL string for the query
* @returns {array} An array of data source objects. Objects will be of the resource class and have resource actions available to them.
*
*/


/**
* @ngdoc method
* @methodOf ngMangoServices.maDataSource
* @name DataSource#getById
*
* @description
* Query the REST endpoint `/rest/latest/data-sources/by-id/:id` with the `GET` method.
* @param {object} query Object containing a `id` property which will be used in the query.
* @returns {object} Returns a data source object. Objects will be of the resource class and have resource actions available to them.
*
*/


/**
* @ngdoc method
* @methodOf ngMangoServices.maDataSource
* @name DataSource#objQuery
*
* @description
* Passed an object in the format `{query: 'query', start: 0, limit: 50, sort: ['-xid']}` and returns an Array of datasource objects matching the query.
* @param {object} query Format: `{query: 'query', start: 0, limit: 50, sort: ['-xid']}`
* @returns {array} Returns an Array of datasource objects matching the query. Objects will be of the resource class and have resource actions available to them.
*
*/

import angular from 'angular';

dataSourceProvider.$inject = [];
function dataSourceProvider() {
    
    const types = [];
    
    this.registerType = function(type) {
        const existing = types.find(t => t.type === type.type);
        if (existing) {
            console.error('Tried to register data source type twice', type);
            return;
        }
        types.push(type);
    };

    this.$get = dataSourceFactory;
    
    dataSourceFactory.$inject = ['$resource', 'maUtil', '$templateCache', '$http', 'maPoint'];
    function dataSourceFactory($resource, Util, $templateCache, $http, Point) {

        const defaultProperties = {
            name: '',
            enabled: false,
            polling: true,
            modelType: 'VIRTUAL',
            descriptionKey: 'VIRTUAL.dataSource',
            pollPeriod: {
                periods: 1,
                type: 'MINUTES'
            },
            editPermission: [],
            purgeSettings: {
                override: false,
                frequency: {
                    periods: 1,
                    type: 'YEARS'
                }
            },
            eventAlarmLevels: [
                {eventType: 'POLL_ABORTED', level: 'INFORMATION', duplicateHandling: 'IGNORE', descriptionKey: 'event.ds.pollAborted'}
            ],
            quantize: false,
            useCron: false
        };
        
        const DataSource = $resource('/rest/latest/data-sources/:xid', {
                xid: data => data && (data.originalId || data.xid)
            }, {
            query: {
                method: 'GET',
                isArray: true,
                transformResponse: Util.transformArrayResponse,
                interceptor: {
                    response: Util.arrayResponseInterceptor
                }
            },
            getById: {
                url: '/rest/latest/data-sources/by-id/:id',
                method: 'GET',
                isArray: false
            },
            save: {
                method: 'POST',
                url: '/rest/latest/data-sources',
                params: {
                    xid: null
                }
            },
            update: {
                method: 'PUT'
            }
        }, {
            defaultProperties,
            xidPrefix: 'DS_'
        });
        
        Object.assign(DataSource.notificationManager, {
            webSocketUrl: '/rest/latest/websocket/data-sources'
        });

        Object.assign(DataSource.prototype, {
            enable(enabled = true, restart = false) {
                this.$enableToggling = true;
                
                const url = '/rest/latest/data-sources/enable-disable/' + encodeURIComponent(this.xid);
                return $http({
                    url,
                    method: 'PUT',
                    params: {
                        enabled: !!enabled,
                        restart
                    }
                }).then(() => {
                    this.enabled = enabled;
                }).finally(() => {
                    delete this.$enableToggling;
                });
            },
            
            getStatus() {
                const url = '/rest/latest/data-sources/status/' + encodeURIComponent(this.xid);
                return $http({
                    url,
                    method: 'GET'
                }).then(response => response.data);
            }
        });

        Object.defineProperty(DataSource.prototype, 'isEnabled', {
            get() {
                return this.enabled;
            },
            
            set(value) {
                this.enable(value);
            }
        });

        class DataSourceType {
            constructor(defaults = {}) {
                Object.assign(this, defaults);

                // put the templates in the template cache so we can ng-include them
                if (this.template && !this.templateUrl) {
                    this.templateUrl = `dataSourceEditor.${this.type}.html`;
                    $templateCache.put(this.templateUrl, this.template);
                }
            }
            
            createDataSource() {
                const properties = {
                    modelType: this.type,
                    name: '',
                    enabled: false,
                    readPermission: [],
                    editPermission: [],
                    purgeSettings: {
                        override: false,
                        frequency: {
                            periods: 1,
                            type: 'YEARS'
                        }
                    },
                    eventAlarmLevels: []
                };

                // can be a function (e.g. virtual DS), but doesn't matter for setting defaults
                if (this.polling) {
                    Object.assign(properties, {
                        pollPeriod: {
                            periods: 1,
                            type: 'MINUTES'
                        },
                        quantize: false,
                        useCron: false
                    });
                }

                if (this.defaultDataSource) {
                    Object.assign(properties, angular.copy(this.defaultDataSource));
                }

                return new DataSource(properties);
            }
            
            createDataPoint() {
                const properties = {
                    dataSourceTypeName: this.type,
                    pointLocator: {
                        modelType: `PL.${this.type}`,
                        dataType: 'NUMERIC'
                    },
                    settable: false
                };

                if (this.defaultDataPoint) {
                    const defaultDataPoint = angular.copy(this.defaultDataPoint);
                    defaultDataPoint.pointLocator = Object.assign(properties.pointLocator, defaultDataPoint.pointLocator);
                    Object.assign(properties, defaultDataPoint);
                }

                // create a new data point with default properties
                const newPoint = new Point();
                
                // set the data type so it gets default properties for that data type
                newPoint.dataType = properties.pointLocator.dataType;
                
                // assign default properties defined by data source type
                Object.assign(newPoint, properties);
                
                return newPoint;
            }
        }

        const typeInstances = types.map(type => Object.freeze(new DataSourceType(type)));
        const typesByName = Util.createMapObject(typeInstances, 'type');
        
        DataSource.types = Object.freeze(typeInstances);
        DataSource.typesByName = Object.freeze(typesByName);

        return DataSource;
    }
}

export default dataSourceProvider;