/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import moment from 'moment-timezone';

function pointValuesProvider() {

    let pointValuesLimit = 5001;
    this.setDefaultLimit = function setDefaultLimit(limit) {
        pointValuesLimit = limit;
    };

    this.$get = pointValuesFactory;
    
    pointValuesFactory.$inject = ['$http', '$q', 'maUtil', '$injector', 'maTemporaryRestResource', 'MA_TIMEOUTS', '$cacheFactory'];
    function pointValuesFactory($http, $q, Util, $injector, TemporaryRestResource, MA_TIMEOUTS, $cacheFactory) {
        const pointValuesCache = $cacheFactory('maPointValues', {capacity: 25});
        
        const pointValuesUrl = '/rest/latest/point-values';
        let maDialogHelper, lastToast;
        
        if ($injector.has('maDialogHelper')) {
            maDialogHelper = $injector.get('maDialogHelper');
        }
        
        const optionsToPostBody = (options, timePeriodObject = true) => {
            const body = {};
            
            if (options.dateTimeFormat ) {
                body.dateTimeFormat = options.dateTimeFormat ;
            }

            if (Array.isArray(options.fields)) {
                body.fields = options.fields;
            }
            
            if (options.latest != null) {
                body.limit = isFinite(options.latest) && options.latest >= 0 && options.latest || 100;
            } else if (options.from !== undefined && options.to !== undefined) {
                const now = new Date();
                const from = Util.toMoment(options.from, now, options.dateFormat);
                const to = Util.toMoment(options.to, now, options.dateFormat);
                const limit = isFinite(options.limit) ? options.limit : pointValuesLimit;

                body.from = from.toISOString();
                body.to = to.toISOString();

                // bookend defaults to true
                if (options.bookend || options.bookend == null) {
                    body.bookend = true;
                }

                if (isFinite(options.simplifyTolerance) && options.simplifyTolerance > 0) {
                    body.simplifyTolerance = options.simplifyTolerance;
                } else if (isFinite(options.simplifyTarget) && options.simplifyTarget > 0) {
                    body.simplifyTarget =  options.simplifyTarget;
                } else if (limit >= 0) {
                    body.limit = limit;
                }

                const timezone = options.timezone || moment().tz();
                if (timezone) {
                    body.timezone = timezone;
                }

                if (typeof options.rollup === 'string' && options.rollup !== 'NONE') {
                    // no bookend when using rollups
                    delete body.bookend;
                    
                    let timePeriodType = 'DAYS';
                    let timePeriods = 1;

                    if (typeof options.rollupInterval === 'string') {
                        const parts = options.rollupInterval.split(' ');
                        if (parts.length === 2 && typeof parts[0] === 'string' && typeof parts[1] === 'string') {
                            timePeriods = parseInt(parts[0], 10);
                            if (!isFinite(timePeriods) || timePeriods <= 0) {
                                throw new Error('options.rollupInterval must be a finite number > 0');
                            }
                            timePeriodType = parts[1].toUpperCase();
                        } else {
                            throw new Error('Error parsing options.rollupInterval');
                        }
                    } else if (isFinite(options.rollupInterval) && options.rollupInterval > 0) {
                        timePeriods = options.rollupInterval;
                    } else {
                        throw new Error('options.rollupInterval must be a string or finite number > 0');
                    }
                    
                    if (options.rollupIntervalType !== undefined) {
                        if (typeof options.rollupIntervalType !== 'string' || Util.isEmpty(options.rollupIntervalType)) {
                            throw new Error('Invalid options.rollupIntervalType');
                        }
                        timePeriodType = options.rollupIntervalType;
                    }
                    
                    if (timePeriodObject) {
                        body.timePeriod = {
                            periods: timePeriods,
                            type: timePeriodType
                        };
                    } else {
                        body.timePeriodType = timePeriodType;
                        body.timePeriods = timePeriods;
                    }
                    
                    if (options.truncate || options.truncate == null) {
                        body.truncate = true;
                    }
                }
            } else {
                throw new Error('Requires options.to and options.from or options.latest');
            }
            
            if (Array.isArray(options.fields)) {
                body.fields = options.fields;
            } else {
                body.fields = ['TIMESTAMP', 'VALUE'];
                if (options.rendered) {
                    body.fields.push('RENDERED');
                }
                if (options.annotation || options.annotation == null) {
                    body.fields.push('ANNOTATION');
                }
                if (body.bookend) {
                    body.fields.push('BOOKEND');
                }
            }

            if (options.useCache != null) {
                if (typeof options.useCache === 'string') {
                    body.useCache = options.useCache;
                } else {
                    body.useCache = options.useCache ? 'CACHE_ONLY' : 'NONE';
                }
            }

            return body;
        };
        
        const pointValues = {
            setDefaultLimit(limit) {
                pointValuesLimit = limit;
            },
            
            getPointValuesForXid(xid, options) {
                try {
                    if (typeof xid !== 'string') throw new Error('Requires xid parameter');
                    if (!options || typeof options !== 'object') throw new Error('Requires options parameter');
        
                    let url = pointValuesUrl;
                    url += options.latest ? '/latest' : '/time-period';
                    url += '/' + encodeURIComponent(xid);

                    if (typeof options.rollup === 'string' && options.rollup !== 'NONE') {
                        url += '/' + encodeURIComponent(options.rollup);
                    }

                    const data = optionsToPostBody(options, false);
                    let reverseData = false;
                    
                    if (options.latest) {
                        reverseData = true;
                    } else if (data.from === data.to) {
                        return $q.when([]);
                    }
        
                    const canceler = $q.defer();
                    const timeout = Number.isFinite(options.timeout) && options.timeout >= 0 ? options.timeout : MA_TIMEOUTS.pointValues;
                    const cancelOrTimeout = Util.cancelOrTimeout(canceler.promise, timeout);
        
                    return $http.get(url, {
                        timeout: cancelOrTimeout,
                        headers: {
                            'Accept': options.mimeType || 'application/json'
                        },
                        responseType: options.responseType,
                        cache: !options.latest ? pointValuesCache : false,
                        params: data
                    }).then(response => {
                        if (options.responseType) {
                            return response.data;
                        }
                        
                        if (!response || !Array.isArray(response.data)) {
                            throw new Error('Incorrect response from REST end point ' + url);
                        }
                        let values = response.data;
                        if (reverseData)
                            values.reverse();
        
                        if (!options.latest && maDialogHelper && values.length >= data.limit) {
                            const now = (new Date()).valueOf();
                            if (!lastToast || (now - lastToast) > 10000) {
                                lastToast = now;
                                maDialogHelper.toastOptions({
                                    textTr: ['ui.app.pointValuesLimited', (data.limit || pointValuesLimit)],
                                    hideDelay: 10000,
                                    classes: 'md-warn'
                                });
                            }
                        }

                        values.$options = options;
                        
                        return values;
                    }).setCancel(canceler.resolve);
                } catch (error) {
                    return $q.reject(error);
                }
            },
        
            getPointValuesForXids(xids, options) {
                try {
                    if (!Array.isArray(xids)) throw new Error('Requires xids parameter');
                    if (!options || typeof options !== 'object') throw new Error('Requires options parameter');
        
                    let url = pointValuesUrl + '/multiple-arrays';
                    url += options.latest ? '/latest' : '/time-period';

                    if (typeof options.rollup === 'string' && options.rollup !== 'NONE') {
                        url += '/' + encodeURIComponent(options.rollup);
                    }
                    
                    const data = optionsToPostBody(options);
                    data.xids = xids;
                    let reverseData = false;
                    
                    if (options.latest) {
                        reverseData = true;
                    } else if (data.from === data.to) {
                        const emptyResponse = xids.reduce((resp, xid) => (resp[xid] = [], resp), {});
                        return $q.when(emptyResponse);
                    }
        
                    const canceler = $q.defer();
                    const cancelOrTimeout = Util.cancelOrTimeout(canceler.promise, options.timeout);
        
                    return $http({
                        method: 'POST',
                        url: url,
                        timeout: cancelOrTimeout,
                        headers: {
                            'Accept': options.mimeType || 'application/json'
                        },
                        data: data,
                        responseType: options.responseType
                    }).then(response => {
                        if (options.responseType) {
                            return response.data;
                        }
                        
                        if (!response || !response.data || typeof response.data !== 'object') {
                            throw new Error('Incorrect response from REST end point ' + url);
                        }
                        
                        const dataByXid = response.data;
                        if (reverseData) {
                            for (const xid in dataByXid) {
                                dataByXid[xid].reverse();
                            }
                        }
                        
                        return dataByXid;
                    }).setCancel(canceler.resolve);
                } catch (error) {
                    return $q.reject(error);
                }
            },
            
            getPointValuesForXidsCombined(xids, options) {
                try {
                    if (!Array.isArray(xids)) throw new Error('Requires xids parameter');
                    if (!options || typeof options !== 'object') throw new Error('Requires options parameter');
        
                    let url = pointValuesUrl + '/single-array';
                    url += options.latest ? '/latest' : '/time-period';

                    const rollup = options.rollup;
                    if (typeof rollup === 'string' && rollup !== 'NONE' && rollup !== 'SIMPLIFY') {
                        url += '/' + encodeURIComponent(rollup);
                    }
                    
                    const data = optionsToPostBody(options);
                    data.xids = xids;
                    let reverseData = false;
                    
                    if (options.latest) {
                        reverseData = true;
                    } else if (data.from === data.to) {
                        return $q.when([]);
                    }
        
                    const canceler = $q.defer();
                    const cancelOrTimeout = Util.cancelOrTimeout(canceler.promise, options.timeout);
        
                    return $http({
                        method: 'POST',
                        url: url,
                        timeout: cancelOrTimeout,
                        headers: {
                            'Accept': options.mimeType || 'application/json'
                        },
                        data: data,
                        responseType: options.responseType
                    }).then(response => {
                        if (options.responseType) {
                            return response.data;
                        }
                        
                        if (!response || !Array.isArray(response.data)) {
                            throw new Error('Incorrect response from REST end point ' + url);
                        }
                        const values = response.data;
                        if (reverseData) {
                            values.reverse();
                        }
                        
                        values.$options = options;
                        
                        return values;
                    }).setCancel(canceler.resolve);
                } catch (error) {
                    return $q.reject(error);
                }
            },

            importFromCsvFile(file, params) {
                return $http({
                    params,
                    data: file,
                    method: 'POST',
                    url: '/rest/latest/point-value-modification/import',
                    headers: {
                        'Content-Type': 'text/csv'
                    },
                    timeout: 0
                }).then((response) => response.data);
            }
        };
        
        /**
         * Options
         * 
         * array<string> xids OR
         * string dataSourceXid
         * boolean purgeAll
         * object duration: {boolean periods, string type (MINUTES, HOURS)}
         * boolean useTimeRange
         * object timeRange: {Date from, Date to}
         * number expiry
         * number timeout
         */
        class PurgeTemporaryResource extends TemporaryRestResource {
            static get baseUrl() {
                return `${pointValuesUrl}/purge`;
            }
            static get resourceType() {
                return 'DATA_POINT_PURGE';
            }
        }
        
        pointValues.PurgeTemporaryResource = PurgeTemporaryResource;

        return Object.freeze(pointValues);
    }
}

export default pointValuesProvider;
