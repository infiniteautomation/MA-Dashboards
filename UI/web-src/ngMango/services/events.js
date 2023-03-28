/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

/**
* @ngdoc service
* @name ngMangoServices.maEvents
*
* @description
* Provides a service for retrieving, adding, and acknowledging events/alarms
* - Used by <a ui-sref="ui.helps.docs.ngMango.maEventsTable">`<ma-events-table>`</a>
*
*
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maEvents
* @name Events#get
*
* @description
* A default action provided by $resource. Makes a http GET call to the rest endpoint `/rest/latest/events`
* @returns {array} Returns an Array of event objects matching the query. Objects will be of the resource class and have resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maEvents
* @name Events#save
*
* @description
* A default action provided by $resource. Makes a http POST call to the rest endpoint `/rest/latest/events`
* @returns {array} Returns an Array of event objects matching the query. Objects will be of the resource class and have resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maEvents
* @name Events#remove
*
* @description
* A default action provided by $resource. Makes a http DELETE call to the rest endpoint `/rest/latest/events`
* @returns {array} Returns an Array of event objects matching the query. Objects will be of the resource class and have resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maEvents
* @name Events#delete
*
* @description
* A default action provided by $resource. Makes a http DELETE call to the rest endpoint `/rest/latest/events`
* @param {object} query Object for the query, can have a `contains` property for querying events that contain the given string.
* @returns {array} Returns an Array of event objects matching the query. Objects will be of the resource class and have resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maEvents
* @name Events#query
*
* @description
* A default action provided by $resource. Makes a http GET call to the rest endpoint `/rest/latest/events`
* @param {object} query Object for the query, can have a `contains` property for querying events that contain the given string.
* @returns {array} Returns an Array of event objects matching the query. Objects will be of the resource class and have resource actions available to them.
*
*/


/**
* @ngdoc method
* @methodOf ngMangoServices.maEvents
* @name Events#objQuery
*
* @description
* Can be passed an object with an rql string or object with values to build query
* @param {object} query Object for the query, can have a `query` property set to an RQL string or set to an object with keys and values.
* @returns {array} Returns an Array of event objects matching the query. Objects will be of the resource class and have resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maEvents
* @name Events#getActiveSummary
*
* @description
* Returns a list of counts for all active events by type and the most recent active alarm for each.

* @returns {array} Returns an Array of counts for all active events by type and the most recent active alarm for each.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maEvents
* @name Events#getUnacknowledgedSummary
*
* @description
* Returns a list of counts for all unacknowledged events by type and the most recent active alarm for each.

* @returns {array} Returns an Array of counts for all unacknowledged events by type and the most recent active alarm for each.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maEvents
* @name Events#acknowledge
*
* @description
* Acknowledges a single event by passing in an event id.
* @param {object} id Passed in an object with an id property cooresponding to the event id.
* @returns {object} Returns an event object with an id property if successful.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maEvents
* @name Events#acknowledgeViaRql
*
* @description
* Acknowledge many events using an RQL string as a parameter
* @param {object} rql Object with an rql string property equal to the rql used to find all the events that you wish to acknowledge.
* @returns {object} Returns an object with a count property equal to the number of events acknowledged.
*
*/

eventsFactory.$inject = ['$resource', 'maUtil', 'maEventTypeInfo', 'maRqlBuilder', '$rootScope', '$http'];
function eventsFactory($resource, Util, EventTypeInfo, RqlBuilder, $rootScope, $http) {
    const Events = $resource('/rest/latest/events', {
        id: '@id'
    }, {
        query: {
            method: 'GET',
            isArray: true,
            transformResponse: Util.transformArrayResponse,
            interceptor: {
                response: Util.arrayResponseInterceptor
            }
        },
        acknowledge: {
            method: 'PUT',
            url: '/rest/latest/events/acknowledge/:id',
            transformRequest: (data, headersGetter) => {
                return null;
            }
        },
        acknowledgeViaRql: {
            method: 'POST',
            url: '/rest/latest/events/acknowledge'
        },
        getActiveSummary: {
            url: '/rest/latest/events/active-summary',
            method: 'GET',
            isArray: true
        },
        getUnacknowledgedSummary: {
            url: '/rest/latest/events/unacknowledged-summary',
            method: 'GET',
            isArray: true
        }
    }, {
        idProperty: 'id'
    });

    class ActiveEventInfo {
        constructor(queryBuilder) {
            this.subscribers = new Set();
            this.events = [];
            this.counts = {};
            this.updateCounts();

            this.queryFilter = queryBuilder.createFilter();
            this.loading = true;
            queryBuilder.query().then(events => {
                events.forEach(e => this.eventUpdated(e));
                this.updateCounts();
                this.notifySubscribers();
            }).finally(() => {
                this.loading = false;
            });

            this.deregister = Events.notificationManager.subscribe({
                handler: this.notifyHandler.bind(this),
                eventTypes: ['RAISED', 'RETURN_TO_NORMAL', 'DEACTIVATED']
            });
        }

        notifyHandler(event, mangoEvent) {
            if (this.queryFilter.test(mangoEvent)) {
                $rootScope.$apply(() => {
                    this.eventUpdated(mangoEvent);
                    this.updateCounts();
                    this.notifySubscribers();
                });
            }
        }

        eventUpdated(event) {
            const index = this.events.findIndex(e => e.id === event.id);
            if (event.active && index < 0) {
                // note that it would be possible to receive a subscription notification saying an event
                // was deactivated then retrieve the same event from the query with an active status
                // could keep a list of recently seen deactivated events to mitigate this

                const outOfOrder = !!this.events.length && this.events[this.events.length - 1].activeTimestamp > event.activeTimestamp;
                this.events.push(event);

                // this is not common but could occur if we got an event via notify before the query
                // completed
                if (outOfOrder) {
                    this.events.sort((a, b) => a.activeTimestamp - b.activeTimestamp);
                }
            } else if (!event.active && index >= 0) {
                this.events.splice(index, 1);
            }
        }

        notifySubscribers() {
            for (const subscriber of this.subscribers) {
                if (typeof subscriber === 'function') {
                    subscriber.call(this);
                }
            }
        }

        updateCounts() {
            Events.levels.forEach(l => this.counts[l.key] = 0);
            this.events.forEach(e => this.counts[e.alarmLevel]++);
        }

        /**
         * @param {object} subscriber An object representing a subscriber, can be a $scope, controller or function.
         * If a function is passed in, it will be called every time the active events are updated.
         */
        addSubscriber(subscriber) {
            this.subscribers.add(subscriber);
        }

        /**
         * @param subscriber
         * @returns {boolean} true if subscriber was the last one and deregister was called
         */
        removeSubscriber(subscriber) {
            const removed = this.subscribers.delete(subscriber);
            if (removed && !this.subscribers.size) {
                this.deregister();
                return true;
            }
        }
    }

    Object.assign(Events.notificationManager, {
        webSocketUrl: '/rest/latest/websocket/events',
        sendSubscription(levels = ['LIFE_SAFETY', 'CRITICAL', 'URGENT', 'WARNING', 'IMPORTANT', 'INFORMATION', 'NONE'],
                actions = ['RAISED', 'ACKNOWLEDGED', 'RETURN_TO_NORMAL', 'DEACTIVATED']) {

            return this.sendRequest({
                requestType: 'SUBSCRIPTION',
                actions,
                levels,
                // sendActiveSummary: true,
                // sendUnacknowledgedSummary: true
            });
        },

        buildActiveQuery() {
            const builder = new RqlBuilder();
            builder.query = (opts) => {
                const queryNode = builder.build();
                return this.openSocket().then(() => {
                    return this.sendRequest({
                        requestType: 'ACTIVE_EVENTS_QUERY',
                        query: queryNode.toString()
                    });
                }).then(response => {
                    const items = response.items.map(e => this.transformObject(e));
                    items.$total = response.total;
                    return items;
                });
            };

            // add another function which returns the active event info
            builder.activeEvents = function() {
                return new ActiveEventInfo(this);
            };

            return builder;
        }
    });

    const levels = Util.freezeAll([
        {key: 'NONE', classes: 'fa-flag ma-alarm-level-none', translation: 'common.alarmLevel.none',
            materialIcon: 'flag', materialClasses: 'ma-alarm-level-none', value: 0},
        {key: 'INFORMATION', classes: 'fa-flag ma-alarm-level-information', translation: 'common.alarmLevel.info',
            materialIcon: 'flag', materialClasses: 'ma-alarm-level-information', value: 1},
        {key: 'IMPORTANT', classes: 'fa-flag ma-alarm-level-important', translation: 'common.alarmLevel.important',
            materialIcon: 'flag', materialClasses: 'ma-alarm-level-important', value: 2},
        {key: 'WARNING', classes: 'fa-flag ma-alarm-level-warning', translation: 'common.alarmLevel.warning',
            materialIcon: 'flag', materialClasses: 'ma-alarm-level-warning', value: 3},
        {key: 'URGENT', classes: 'fa-flag ma-alarm-level-urgent', translation: 'common.alarmLevel.urgent',
            materialIcon: 'flag', materialClasses: 'ma-alarm-level-urgent', value: 4},
        {key: 'CRITICAL', classes: 'fa-flag ma-alarm-level-critical', translation: 'common.alarmLevel.critical',
            materialIcon: 'flag', materialClasses: 'ma-alarm-level-critical', value: 5},
        {key: 'LIFE_SAFETY', classes: 'fa-flag ma-alarm-level-life-safety', translation: 'common.alarmLevel.lifeSafety',
            materialIcon: 'flag', materialClasses: 'ma-alarm-level-life-safety', value: 6},
        {key: 'DO_NOT_LOG', classes: 'fa-times-circle ma-alarm-level-do-not-log', translation: 'common.alarmLevel.doNotLog',
            materialIcon: 'cancel', materialClasses: 'ma-alarm-level-do-not-log', value: -2},
        {key: 'IGNORE', classes: 'fa-times ma-alarm-level-ignore', translation: 'common.alarmLevel.ignore',
            materialIcon: 'block', materialClasses: 'ma-alarm-level-ignore', value: -3}
    ]);
    const levelsMap = Object.freeze(Util.createMapObject(levels, 'key'));

    const superBuildQuery = Events.buildQuery;
    Object.assign(Events, {
        levels,
        levelsMap,

        buildQuery() {
            const builder = superBuildQuery.apply(this, arguments);
            builder.visitorOptions = {
                // maps properties from the RQL query to the actual properties in the returned model
                propertyNameMap: {
                    eventType: 'eventType.eventType',
                    subType: 'eventType.subType',
                    referenceId1: 'eventType.referenceId1',
                    referenceId2: 'eventType.referenceId2'
                }
            };
            return builder;
        },

        buildCountQuery() {
            const builder = this.buildQuery();
            builder.query = periodBoundaries => this.queryCounts(builder.build(), periodBoundaries);
            return builder;
        },

        queryCounts(queryNode, periodBoundaries) {
            return $http({
                method: 'POST',
                url: '/rest/latest/events/counts',
                params: {rqlQuery: queryNode.toString()},
                data: periodBoundaries
            }).then(r => r.data);
        }
    });

    Object.defineProperty(Events.prototype, 'duration', {
        get: function() {
            if (!this.rtnApplicable) return null;

            if (this.rtnTimestamp != null) {
                return this.rtnTimestamp - this.activeTimestamp;
            } else {
                // event is still active, return an ongoing duration

                // round to prevent infinite digests
                const time = Math.floor(new Date().valueOf() / 1000) * 1000;
                const duration = time - this.activeTimestamp;
                // duration can be negative if there is a clock mismatch between backend and browser
                return duration < 0 ? 0 : duration;
            }
        }
    });

    Object.defineProperty(Events.prototype, 'typeId', {
        get: function() {
            return this.eventType && this.getEventType().typeId;
        }
    });

    Object.assign(Events.prototype, {
        getEventType() {
            if (this.eventType && !(this.eventType instanceof EventTypeInfo.EventType)) {
                this.eventType = new EventTypeInfo.EventType(this.eventType);
            }
            return this.eventType;
        },

        getAlarmLevel() {
            return levelsMap[this.alarmLevel];
        }
    });

    return Events;
}

export default eventsFactory;

