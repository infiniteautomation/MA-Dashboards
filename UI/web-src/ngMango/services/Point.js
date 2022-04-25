/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

/**
* @ngdoc service
* @name ngMangoServices.maPoint
*
* @description
* Provides service for getting and and updating a list of points.
* - Used by <a ui-sref="ui.docs.ngMango.maPointList">`<ma-point-list>`</a> and
*   <a ui-sref="ui.docs.ngMango.maFilteringPointList">`<ma-filtering-point-list>`</a> directives.
* - All methods return [$resource](https://docs.angularjs.org/api/ngResource/service/$resource) objects that can call the following
*   methods available to those objects:
*   - `$save`
*   - `$remove`
*   - `$delete`
*   - `$get`
*
* # Usage
*
* <pre prettyprint-mode="javascript">
*  Point.query({rqlQuery: 'limit(1)'}).$promise.then(function(item) {
    $scope.ngModel = item[0];
});
* </pre>
*/

/**
 * @ngdoc method
 * @methodOf ngMangoServices.maPoint
 * @name Point#get
 *
 * @description
 * A default action provided by $resource. Makes a http GET call to the rest endpoint `/rest/latest/data-points/:xid`
 * @param {object} query Object containing a `xid` property which will be used in the query.
 * @returns {object} Returns a data point object. Objects will be of the resource class and have resource actions available to them.
 *
 */

/**
 * @ngdoc method
 * @methodOf ngMangoServices.maPoint
 * @name Point#save
 *
 * @description
 * A default action provided by $resource. Makes a http POST call to the rest endpoint `/rest/latest/data-points/:xid`
 * @param {object} query Object containing a `xid` property which will be used in the query.
 * @returns {object} Returns a data point object. Objects will be of the resource class and have resource actions available to them.
 *
 */

/**
 * @ngdoc method
 * @methodOf ngMangoServices.maPoint
 * @name Point#remove
 *
 * @description
 * A default action provided by $resource. Makes a http DELETE call to the rest endpoint `/rest/latest/data-points/:xid`
 * @param {object} query Object containing a `xid` property which will be used in the query.
 * @returns {object} Returns a data point object. Objects will be of the resource class and have resource actions available to them.
 *
 */

/**
 * @ngdoc method
 * @methodOf ngMangoServices.maPoint
 * @name Point#delete
 *
 * @description
 * A default action provided by $resource. Makes a http DELETE call to the rest endpoint `/rest/latest/data-points/:xid`
 * @param {object} query Object containing a `xid` property which will be used in the query.
 * @returns {object} Returns a data point object. Objects will be of the resource class and have resource actions available to them.
 *
 */

/**
 * @ngdoc method
 * @methodOf ngMangoServices.maPoint
 * @name Point#query
 *
 * @description
 * Passed an object in the format `{query: 'query', start: 0, limit: 50, sort: ['-xid']}` and returns an Array of point objects matching the query.
 * @param {object} query xid name for the query. Format: `{query: 'query', start: 0, limit: 50, sort: ['-xid']}`
 * @returns {array} Returns an Array of point objects matching the query. Objects will be of the resource class and have resource actions available to them.
 *
 */

/**
 * @ngdoc method
 * @methodOf ngMangoServices.maPoint
 * @name Point#rql
 *
 * @description
 * Passed a string containing RQL for the query and returns an array of data point objects. Queries the endpoint `/rest/latest/data-points?:query`
 * @param {string} RQL RQL string for the query
 * @returns {array} An array of data point objects. Objects will be of the resource class and have resource actions available to them.
 *
 */

/**
 * @ngdoc method
 * @methodOf ngMangoServices.maPoint
 * @name Point#getById
 *
 * @description
 * Query the REST endpoint `/rest/latest/data-points/by-id/:id` with the `GET` method.
 * @param {object} query Object containing a `id` property which will be used in the query.
 * @returns {object} Returns a data point object. Objects will be of the resource class and have resource actions available to them.
 *
 */

/**
 * @ngdoc method
 * @methodOf ngMangoServices.maPoint
 * @name Point#objQuery
 *
 * @description
 * Passed an object in the format `{query: 'query', start: 0, limit: 50, sort: ['-xid']}` and returns an Array of point objects matching the query.
 * @param {object} query Format: `{query: 'query', start: 0, limit: 50, sort: ['-xid']}`
 * @returns {array} Returns an Array of point objects matching the query. Objects will be of the resource class and have resource actions available to them.
 *
 */

/**
 * @ngdoc method
 * @methodOf ngMangoServices.maPoint
 * @name Point#setValue
 *
 * @description
 * Method for setting the value of a settable data point.
 * @param {number} value New value to set on the data point.
 * @param {object=} options Optional object for setting converted property.
 * @returns {object} Returns promise object from $http.put at `/rest/latest/point-values/`
 *
 */

/**
* @ngdoc method
* @methodOf ngMangoServices.maPoint
* @name Point#setValueResult
*
* @description
* Method calls setValue but provides handling of the promise and returns a result object.
Used by `<set-point-value>` directive.
* @param {number} value New value to set on the data point.
* @param {number=} holdTimeout Optional timeout value, defaults to 3000.
* @returns {object} Returns `result` object with `pending`, `success`, and error `properties`
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maPoint
* @name Point#toggleValue
*
* @description
* When called this method will flip the value of a binary data point.
See <a ui-sref="ui.examples.settingPointValues.toggle">Toggle Binary</a> example.
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maPoint
* @name Point#valueFn
*
* @description
* This method will either call setValue internally or return the points value object.
See how it is used with `<md-checkbox>` and `<md-switch>` in the <a ui-sref="ui.examples.settingPointValues.toggle">Toggle Binary</a> example.
* @param {number=} setValue If provided setValue method will be called with this value.
* @returns {object} Returns a points value object if no parameter is provided when the method is called.
*/

/**
 * @ngdoc method
 * @methodOf ngMangoServices.maPoint
 * @name Point#getTextRenderer
 *
 * @returns {object} Returns an TextRenderer object which can render values for binary or multistate points.
 *     Call `render(value)` on the renderer to render the value.
 *     A binary or multistate text renderer has a `values` property for accessing configured renderer mappings.
 */

import angular from 'angular';
import TextRenderer from './TextRenderer';
import {
    defaultProperties,
    defaultPropertiesForDataTypes
} from './PointDefaults';

dataPointProvider.$inject = [];
function dataPointProvider() {
    const types = [];

    this.registerType = function (type) {
        const existing = types.find((t) => t.type === type.type);
        if (existing) {
            console.error('Tried to register data point type twice', type);
            return;
        }
        types.push(type);
    };

    this.$get = dataPointFactory;

    /*
     * Provides service for getting list of points and create, update, delete
     */
    dataPointFactory.$inject = [
        '$resource',
        '$http',
        '$timeout',
        'maUtil',
        'maUser',
        'maTemporaryRestResource',
        'maRqlBuilder',
        'maRestResource',
        '$templateCache',
        'MA_ROLLUP_TYPES',
        'MA_CHART_TYPES',
        'MA_SIMPLIFY_TYPES',
        '$injector',
        '$rootScope',
        '$q'
    ];
    function dataPointFactory(
        $resource,
        $http,
        $timeout,
        Util,
        User,
        TemporaryRestResource,
        RqlBuilder,
        RestResource,
        $templateCache,
        MA_ROLLUP_TYPES,
        MA_CHART_TYPES,
        MA_SIMPLIFY_TYPES,
        $injector,
        $rootScope,
        $q
    ) {
        types.forEach((type) => {
            // put the templates in the template cache so we can ng-include them
            if (type.template && !type.templateUrl) {
                type.templateUrl = `dataPointEditor.${type.type}.html`;
                $templateCache.put(type.templateUrl, type.template);
            }
            Object.freeze(type);
        });
        Object.freeze(types);

        const typesByName = Object.freeze(Util.createMapObject(types, 'type'));

        const realtimeUrl = '/rest/latest/realtime';

        class BulkDataPointTemporaryResource extends TemporaryRestResource {
            static get baseUrl() {
                return '/rest/latest/data-points/bulk';
            }

            static get resourceType() {
                return 'BULK_DATA_POINT';
            }
        }

        class DataPointRestResource extends RestResource {
            static get baseUrl() {
                return '/rest/latest/data-points';
            }

            static get defaultProperties() {
                return defaultProperties;
            }

            static pointsForWatchList(xid, opts = {}) {
                return this.http(
                    {
                        url: `/rest/latest/watch-lists/${encodeURIComponent(
                            xid
                        )}/data-points`,
                        method: 'GET'
                    },
                    opts
                ).then((response) => {
                    if (opts.responseType != null) {
                        return response.data;
                    }

                    const items = response.data.items.map(
                        (item) => new this(item)
                    );
                    items.$total = response.data.total;
                    return items;
                });
            }
        }

        // stores an array of active events by point id
        const activeEventsMap = new Map();

        const Point = $resource(
            '/rest/latest/data-points/:xid',
            {
                xid: (data) => data && (data.originalId || data.xid)
            },
            {
                query: {
                    method: 'GET',
                    isArray: true,
                    transformResponse: Util.transformArrayResponse,
                    interceptor: {
                        response: Util.arrayResponseInterceptor
                    }
                },
                getById: {
                    url: '/rest/latest/data-points/by-id/:id',
                    method: 'GET',
                    isArray: false
                },
                save: {
                    method: 'POST',
                    url: '/rest/latest/data-points',
                    params: {
                        xid: null
                    }
                },
                update: {
                    method: 'PUT'
                }
            },
            {
                defaultProperties,
                xidPrefix: 'DP_'
            }
        );

        Object.assign(Point.notificationManager, {
            webSocketUrl: '/rest/latest/websocket/data-points'
        });

        Object.assign(Point, {
            buildRealtimeQuery() {
                const builder = new RqlBuilder();
                builder.queryFunction = (queryObj, opts) =>
                    this.realtimeQuery(queryObj, opts);
                return builder;
            },

            realtimeQuery(queryObject, opts = {}) {
                const params = {};

                if (queryObject) {
                    const rqlQuery = queryObject.toString();
                    if (rqlQuery) {
                        params.rqlQuery = rqlQuery;
                    }
                }

                return $http({
                    url: realtimeUrl,
                    method: 'GET',
                    params
                }).then((response) => {
                    const items = response.data.items.map(
                        (item) => new this(item)
                    );
                    items.$total = response.data.total;
                    return items;
                });
            },

            buildPostQuery() {
                const builder = new RqlBuilder();
                builder.queryFunction = (queryObj, opts) =>
                    this.postQuery(queryObj.root, opts);
                return builder;
            },

            postQuery(queryObject, opts = {}) {
                return $http({
                    url: '/rest/latest/data-points/query',
                    method: 'POST',
                    data: queryObject
                }).then((response) => {
                    const items = response.data.items.map(
                        (item) => new this(item)
                    );
                    items.$total = response.data.total;
                    return items;
                });
            },

            bulk: BulkDataPointTemporaryResource,
            restResource: DataPointRestResource,

            get types() {
                return types;
            },

            get typesByName() {
                return typesByName;
            },

            dataTypes: Object.freeze([
                {
                    key: 'BINARY',
                    translation: 'common.dataTypes.binary',
                    value: 1
                },
                {
                    key: 'MULTISTATE',
                    translation: 'common.dataTypes.multistate',
                    value: 2
                },
                {
                    key: 'NUMERIC',
                    translation: 'common.dataTypes.numeric',
                    value: 3
                },
                {
                    key: 'ALPHANUMERIC',
                    translation: 'common.dataTypes.alphanumeric',
                    value: 4
                }
            ]),

            dataTypeId(stringValue) {
                if (typeof stringValue !== 'string') {
                    return stringValue;
                }

                const type = this.dataTypes.find(
                    (dt) => dt.key === stringValue
                );
                if (type) {
                    return type.value;
                }
            },

            loggingTypes: Object.freeze([
                {
                    type: 'ON_CHANGE',
                    translation: 'pointEdit.logging.type.change'
                },
                { type: 'ALL', translation: 'pointEdit.logging.type.all' },
                { type: 'NONE', translation: 'pointEdit.logging.type.never' },
                {
                    type: 'INTERVAL',
                    translation: 'pointEdit.logging.type.interval'
                },
                {
                    type: 'ON_TS_CHANGE',
                    translation: 'pointEdit.logging.type.tsChange'
                },
                {
                    type: 'ON_CHANGE_INTERVAL',
                    translation: 'pointEdit.logging.type.changeInterval'
                }
            ]),

            intervalLoggingValueTypes: Object.freeze([
                {
                    type: 'INSTANT',
                    translation: 'pointEdit.logging.valueType.instant',
                    dataTypes: new Set([
                        'BINARY',
                        'ALPHANUMERIC',
                        'MULTISTATE',
                        'NUMERIC'
                    ])
                },
                {
                    type: 'MAXIMUM',
                    translation: 'pointEdit.logging.valueType.maximum',
                    dataTypes: new Set(['BINARY', 'MULTISTATE', 'NUMERIC'])
                },
                {
                    type: 'MINIMUM',
                    translation: 'pointEdit.logging.valueType.minimum',
                    dataTypes: new Set(['BINARY', 'MULTISTATE', 'NUMERIC'])
                },
                {
                    type: 'AVERAGE',
                    translation: 'pointEdit.logging.valueType.average',
                    dataTypes: new Set(['BINARY', 'MULTISTATE', 'NUMERIC'])
                }
            ]),

            textRendererTypes: Object.freeze([
                {
                    type: 'textRendererPlain',
                    translation: 'textRenderer.plain',
                    dataTypes: new Set([
                        'BINARY',
                        'ALPHANUMERIC',
                        'MULTISTATE',
                        'NUMERIC'
                    ]),
                    suffix: true
                },
                {
                    type: 'textRendererAnalog',
                    translation: 'textRenderer.analog',
                    dataTypes: new Set(['NUMERIC']),
                    suffix: true,
                    format: true
                },
                {
                    type: 'textRendererRange',
                    translation: 'textRenderer.range',
                    dataTypes: new Set(['NUMERIC']),
                    format: true
                },
                {
                    type: 'textRendererBinary',
                    translation: 'textRenderer.binary',
                    dataTypes: new Set(['BINARY'])
                },
                {
                    type: 'textRendererTime',
                    translation: 'textRenderer.time',
                    dataTypes: new Set(['NUMERIC']),
                    format: true
                },
                {
                    type: 'textRendererMultistate',
                    translation: 'textRenderer.multistate',
                    dataTypes: new Set(['MULTISTATE'])
                }
            ]),

            rollupTypes: MA_ROLLUP_TYPES,
            chartTypes: MA_CHART_TYPES,
            simplifyTypes: MA_SIMPLIFY_TYPES
        });

        const superCopyMethod = Point.prototype.copy;

        Object.assign(Point.prototype, {
            forceRead() {
                const url = `/rest/latest/runtime-manager/force-refresh/${encodeURIComponent(
                    this.xid
                )}`;
                return $http.put(url, null);
            },

            enable(enabled = true, restart = false) {
                this.$enableToggling = true;

                const url = `/rest/latest/data-points/enable-disable/${encodeURIComponent(
                    this.xid
                )}`;
                return $http({
                    url,
                    method: 'PUT',
                    params: {
                        enabled: !!enabled,
                        restart
                    }
                })
                    .then(() => {
                        this.enabled = enabled;
                    })
                    .finally(() => {
                        delete this.$enableToggling;
                    });
            },

            restart() {
                return this.enable(true, true);
            },

            setValue(value, options) {
                const params = {};
                const data = {};

                if (value != null && typeof value === 'object') {
                    Object.assign(data, value);
                } else {
                    data.value = value;
                }

                if (!data.dataType) {
                    data.dataType = this.dataType;
                }
                if (!data.annotation) {
                    data.annotation = `Set from web by user: ${User.current.username}`;
                }

                if (data.dataType === 'NUMERIC') {
                    if (typeof data.value === 'string') {
                        data.value = Number(data.value);
                    }
                    params.unitConversion =
                        options && 'converted' in options
                            ? !!options.converted
                            : true;
                } else if (data.dataType === 'MULTISTATE') {
                    if (
                        typeof data.value === 'string' &&
                        /^\d+$/.test(data.value)
                    ) {
                        data.value = Number.parseInt(data.value, 10);
                    }
                }

                return $http({
                    method: 'PUT',
                    url: `/rest/latest/point-values/${encodeURIComponent(
                        this.xid
                    )}`,
                    data,
                    params
                });
            },

            setValueResult(value, holdTimeout = 3000) {
                return this.promiseResult(
                    () => this.setValue(value),
                    holdTimeout
                );
            },

            relinquish() {
                const xid = encodeURIComponent(this.xid);
                return $http({
                    url: `/rest/latest/runtime-manager/relinquish/${xid}`,
                    method: 'POST'
                });
            },

            relinquishResult(holdTimeout = 3000) {
                return this.promiseResult(() => this.relinquish(), holdTimeout);
            },

            promiseResult(action, holdTimeout) {
                const result = {
                    pending: true
                };

                result.promise = action().then(
                    (data) => {
                        delete result.pending;
                        result.success = true;
                        result.data = data;

                        $timeout(() => {
                            delete result.success;
                        }, holdTimeout);

                        return result;
                    },
                    (data) => {
                        delete result.pending;
                        result.error = data;
                        result.data = data;

                        $timeout(() => {
                            delete result.error;
                        }, holdTimeout);

                        return $q.reject(result);
                    }
                );

                return result;
            },

            toggleValue() {
                const { dataType } = this.pointLocator;
                if (dataType === 'BINARY' && this.value !== undefined) {
                    this.setValue(!this.value);
                }
            },

            valueFn(setValue) {
                if (setValue === undefined) return this.value;
                this.setValue(setValue);
            },

            getTextRenderer() {
                if (this._textRenderer) {
                    return this._textRenderer;
                }
                return (this._textRenderer = TextRenderer.forPoint(this));
            },

            getRenderedText(value) {
                return this.getTextRenderer().render(value).text;
            },

            getRenderedColor(value) {
                return this.getTextRenderer().render(value).color;
            },

            websocketHandler(payload, eventType) {
                if (payload.xid !== this.xid) return;

                // short circuit, reduce processing if we get the same payload multiple times as we do currently
                if (this.lastPayload === payload) return;
                this.lastPayload = payload;

                // these fields are not accurate for ATTRIBUTE_CHANGE events
                if (eventType !== 'ATTRIBUTE_CHANGE') {
                    this.enabled = !!payload.pointEnabled;
                    this.running = !!payload.enabled;
                }

                if (payload.value != null) {
                    const rendered = this.getTextRenderer().render(
                        payload.value.value
                    );

                    this.value = payload.value.value;
                    this.time = payload.value.timestamp;
                    this.renderedColor = rendered.color;

                    this.convertedValue = payload.convertedValue;
                    this.renderedValue = payload.renderedValue;
                }

                if (payload.attributes && payload.attributes.hasOwnProperty('UNRELIABLE')) {
                    this.unreliable = !!payload.attributes.UNRELIABLE;
                }

                this.attributes = payload.attributes || {};
            },

            amChartsGraphType() {
                if (!this.plotType) return null;

                const type = this.plotType.toLowerCase();
                // change mango plotType to amCharts graphType
                // step and line are equivalent
                switch (type) {
                    case 'spline':
                        return 'smoothedLine';
                    case 'bar':
                        return 'column';
                    default:
                        return type;
                }
            },

            getTags() {
                const tags = { ...this.tags };
                if (!tags.hasOwnProperty('device') && this.deviceName) {
                    tags.device = this.deviceName;
                }
                if (!tags.hasOwnProperty('name') && this.name) {
                    tags.name = this.name;
                }
                return tags;
            },

            getTag(tagKey) {
                if (tagKey === 'device') {
                    return this.deviceName;
                }
                if (tagKey === 'name') {
                    return this.name;
                }
                if (this.tags && this.tags.hasOwnProperty(tagKey)) {
                    return this.tags[tagKey];
                }
            },

            hasTags() {
                return !!Object.keys(this.tags || {}).length;
            },

            formatTags(tagsToInclude) {
                const tags = tagsToInclude ? this.getTags() : this.tags || {};

                let tagKeys = Object.keys(tags);
                if (Array.isArray(tagsToInclude)) {
                    tagKeys = tagKeys.filter((k) => tagsToInclude.includes(k));
                } else if (tagsToInclude && typeof tagsToInclude === 'object') {
                    tagKeys = tagKeys.filter((k) => tagsToInclude[k]);
                }

                return tagKeys.map((key) => `${key}=${tags[key]}`).join(', ');
            },

            formatLabel(includeTags = true) {
                // use the name formatted by the backend
                if (includeTags) {
                    return this.extendedName;
                }

                let label = `${this.deviceName} \u2014 ${this.name}`;
                if (includeTags && this.hasTags()) {
                    const tagsString = this.formatTags(
                        typeof includeTags === 'object'
                            ? includeTags
                            : undefined
                    );
                    label += ` [${tagsString}]`;
                }
                return label;
            },
            dataTypeChanged() {
                const dataTypeDefaults =
                    defaultPropertiesForDataTypes[this.dataType];

                // we could try and keep some properties as per previous code in data point editor
                /*
                const rollupType = this.constructor.rollupTypes.find(t => t.type === this.rollup);
                if (!rollupType.dataTypes.has(this.dataType)) {
                    this.rollup = dataTypeDefaults.rollup;
                }
                
                const simplifyType = this.constructor.simplifyTypes.find(t => t.type === this.simplifyType);
                if (!simplifyType.dataTypes.has(this.dataType)) {
                    this.simplifyType = dataTypeDefaults.simplifyType;
                    this.simplifyTolerance = dataTypeDefaults.simplifyTolerance;
                    this.simplifyTarget = dataTypeDefaults.simplifyTarget;
                }

                const textRendererType = this.textRenderer && this.textRenderer.type;
                const textRendererTypeDef = this.constructor.textRendererTypes.find(t => t.type === textRendererType);
                if (!textRendererTypeDef || !textRendererTypeDef.dataTypes.has(this.dataType)) {
                    this.textRenderer = angular.copy(dataTypeDefaults.textRenderer);
                }

                this.loggingProperties = angular.copy(dataTypeDefaults.loggingProperties);
                */

                Object.assign(this, angular.copy(dataTypeDefaults));
            },
            subscribeToEvents($scope) {
                let activeEventInfo;
                if (activeEventsMap.has(this.id)) {
                    // already subscribed
                    activeEventInfo = activeEventsMap.get(this.id);
                } else {
                    // first subscription for this id, create new active event info query

                    // prevents circular dependency
                    const Events = $injector.get('maEvents');
                    activeEventInfo = Events.notificationManager
                        .buildActiveQuery()
                        .eq('eventType.eventType', 'DATA_POINT')
                        .eq('eventType.referenceId1', this.id)
                        .activeEvents((event) => {
                            const type = event.eventType;
                            return (
                                type.eventType === 'DATA_POINT' &&
                                type.referenceId1 === this.id
                            );
                        });

                    activeEventsMap.set(this.id, activeEventInfo);
                }
                activeEventInfo.addSubscriber($scope);

                let deregisterScopeOnDestroy;
                const destroy = () => {
                    deregisterScopeOnDestroy();
                    const lastSubscriber = activeEventInfo.removeSubscriber(
                        $scope
                    );
                    if (lastSubscriber) {
                        activeEventsMap.delete(this.id);
                    }
                };

                deregisterScopeOnDestroy = $scope.$on('$destroy', destroy);
                return destroy;
            },
            resetCache() {
                const xid = encodeURIComponent(this.xid);
                return $http({
                    url: `/rest/latest/runtime-manager/reset-cache/${xid}`,
                    method: 'POST'
                });
            },

            copy(createWithNewId = false) {
                const copy = superCopyMethod.apply(this, arguments);
                if (createWithNewId) {
                    copy.seriesId = null;
                }
                return copy;
            }
        });

        Object.defineProperty(Point.prototype, 'activeEvents', {
            get() {
                const info = activeEventsMap.get(this.id);
                if (info) {
                    return info.events;
                }
            },
            set(value) {}
        });

        Object.defineProperty(Point.prototype, 'activeEventCounts', {
            get() {
                const info = activeEventsMap.get(this.id);
                if (info) {
                    return info.counts;
                }
            },
            set(value) {}
        });

        Object.defineProperty(Point.prototype, 'tagsString', {
            get() {
                return this.formatTags();
            },
            set(value) {}
        });

        Object.defineProperty(Point.prototype, 'isEnabled', {
            get() {
                return this.enabled;
            },
            set(value) {
                this.enable(value);
            }
        });

        Object.defineProperty(Point.prototype, 'valueGetterSetter', {
            get() {
                return this.value;
            },
            set(value) {
                this.setValue(value);
            }
        });

        Object.defineProperty(Point.prototype, 'dataType', {
            get() {
                if (!this.pointLocator) {
                    this.pointLocator = {};
                }
                return this.pointLocator.dataType;
            },
            set(value) {
                if (!this.pointLocator) {
                    this.pointLocator = {};
                }
                this.pointLocator.dataType = value;
                this.dataTypeChanged();
            }
        });

        return Point;
    }
}

export default dataPointProvider;
