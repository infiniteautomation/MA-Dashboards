/*
 * Copyright (C) 2023 Radix IoT LLC. All rights reserved.
 */

import eventsTableTemplate from './eventsTable.html';
import './eventsTable.css';
import moment from 'moment-timezone';

/**
 * @ngdoc directive
 * @name ngMango.directive:maEventsTable
 * @restrict E
 * @description
 * `<ma-events-table></ma-events-table>`
 * - Displays a list of Events in a table format.
 * - Allows for filtering of events by several attributes as explained below.
 * - Can be set to query for events within a specific date range.
 * - The table includes the ability to filter and sort by alarm level and timestamp.
 * - Events can be acknowledged one at a time or a button is shown to acknowledge all events matching the query.
 * - Note in usage examples below raw string literals are wrapped in single quotes where as variable names / numbers / booleans are not.
 * - <a ui-sref="ui.examples.utilities.eventsTable">View Demo</a>
 *
 * @param {number=} limit Set the initial limit of the pagination.
 * @param {number[]=} point-ids Only show events for these data point IDs
 * @param {object=} point-tags Only show events for data points which match these tags.
 * Undefined tag values are ignored but null tag values can be queried on.
 * @param {number=} point-id Filter on the id property of a single point
 * @param {number=} event-id Filter on a specific Event Id, should return a single event.
 * @param {expression=} alarm-level Expression which should evaluate to a string. Filter on Alarm Level. Possible values are:
 *     `'NONE'`, `'INFORMATION'`, `'IMPORTANT'`, `'WARNING'`, `'URGENT'`, `'CRITICAL'`, `'LIFE_SAFETY'` or `'any'`.
 * @param {expression=} event-type Expression which should evaluate to a string. Filter on Event Type.
 *     Possible values are: `'DATA_POINT'`, `'DATA_SOURCE'`, `'SYSTEM'` or `'any'`.
 * @param {expression=} acknowledged Expression which should evaluate to a boolean or the string 'any'.
 *     Filter on whether the event has been acknowledged. Possible values are: `true`, `false` or `'any'` for either.
 * @param {string=} active-status Filter on Active Status. Possible values are: `'active'`, `'noRtn'`, `'normal'` or `'any'`.
 * @param {string=} sort Set the initial sorting column of the table. Possible values are:
 *     `'alarmLevel'`, `'activeTimestamp'`, `'message'` or `'acknowledged'`.
 *     Precede value with a negative (eg. `'-activeTimestamp'`) to reverse sorting.
 * @param {expression=} from Should evaluate to a date, moment or time-stamp. From time used for filtering by date range.
 *     Pass the value from a `<ma-date-picker>`.
 * @param {expression=} to Should evaluate to a date, moment or time-stamp. To time used for filtering by date range.
 * @param {boolean=} [date-filter=false] Turn on date filtering of events. Set value to `true` and use with from/to attribute to use.
 * @param {string=} timezone Display the timestamps in this timezone
 * @param {string=} date-format Moment.js format string used to format dates/times
 * @param {boolean=} [hide-event-handlers=false] Hide the event handlers column
 * @param {string[]=} tag-columns Will display a column for each of the supplied tag keys. Cell will be blank for non-datapoint events.
 *
 * @usage
 * <!-- Example Using filters on Table Attributes -->
 * <ma-events-table event-type="'SYSTEM'" alarm-level="'URGENT'" acknowledged="'any'"
 * active-status="'active' date-filter="true" from="fromTime" to="toTime" limit="50"
 * sort="'-alarmLevel'"></ma-events-table>
 *
 * <!-- Example For Restricting Events to those Related to a Data Point -->
 * <ma-events-table point-id="myPoint.id" limit="5" from="fromTime" to="toTime"></ma-events-table>
 *
 * <!-- Show only events for data points with a set of tags -->
 * <ma-events-table point-tags="{site: 'my site'}" limit="10"></ma-events-table>
 */

eventsTable.$inject = ['maEvents', 'maUserNotes', '$mdMedia', '$injector', 'MA_DATE_FORMATS', 'MA_EVENT_LINK_INFO', '$timeout',
    'maEventHandler', 'maTranslate', 'localStorageService'];
function eventsTable(Events, UserNotes, $mdMedia, $injector, mangoDateFormats, MA_EVENT_LINK_INFO, $timeout,
        EventHandler, Translate, localStorageService) {

    const localStorageKey = 'maEventsTable';
    const localStorageDefaults = {csvLimit: 1000};
    const ANY_KEYWORD = 'any';

    class Equals {
        constructor(value, filter) {
            this.value = value;
            this.filter = filter;
        }

        test() {
            if (this.filter == null || this.filter === ANY_KEYWORD)
                return true;
            return this.testOp();
        }

        testOp() {
            return this.value === this.filter;
        }
    }

    class EqualsIgnoreZero extends Equals {
        test() {
            if (this.filter === 0) return true;
            return super.test();
        }
    }

    class StrictEquals extends Equals {
        test() {
            if (this.filter === undefined || this.filter === ANY_KEYWORD)
                return true;
            return this.testOp();
        }
    }

    class GreaterThanEquals extends Equals {
        testOp() {
            return this.value >= this.filter;
        }
    }

    class LessThan extends Equals {
        testOp() {
            return this.value < this.filter;
        }
    }

    class InArray extends Equals {
        testOp() {
            return Array.isArray(this.filter) && this.filter.includes(this.value);
        }
    }

    class EventsTableController {
        static get $$ngIsClass() { return true; }
        static get $inject() { return ['$scope', '$attrs', '$element', 'maEventTypeInfo', '$filter']; }

        constructor($scope, $attrs, $element, EventTypeInfo, $filter) {
            this.$scope = $scope;
            this.$attrs = $attrs;
            this.$element = $element;
            this.maDate = $filter('maDate');

            this.$mdMedia = $mdMedia;
            this.start = 0;
            this.page = 1;
            this.total = 0;
            this.limit = 50;
            this.events = [];
            this.sort = '-activeTimestamp';
            this.totalUnAcknowledged = 0;
            this.linkInfo = MA_EVENT_LINK_INFO;

            this.onPaginateBound = (...args) => this.onPaginate(...args);
            this.onReorderBound = (...args) => this.onReorder(...args);

            this.handlersForType = new EventTypeInfo.EventTypeMap();
            this.fixedCsvLimit = $attrs.hasOwnProperty('csvLimit');

            this.settings = localStorageService.get(localStorageKey) || Object.assign({}, localStorageDefaults);
            this.csvLimit = this.settings.csvLimit;
        }

        $onInit() {
            Events.notificationManager.subscribe((event, mangoEvent) => {
                // temporary fix/work-around for audit events / DO_NOT_LOG events coming through websocket
                if (mangoEvent.id < 0) {
                    return;
                }

                if (event.name === 'ACKNOWLEDGED' && (!this.acknowledged || this.acknowledged === ANY_KEYWORD) &&
                        this.totalUnAcknowledged > 0 && this.eventMatchesFilters(mangoEvent, true)) {
                    this.totalUnAcknowledged--;
                }

                if (this.eventMatchesFilters(mangoEvent)) {
                    // if event is already in current page replace it
                    this.removeEvent(mangoEvent.id, mangoEvent);

                    if (event.name === 'RAISED' && !this.dateFilter) {
                        if (this.sort === '-activeTimestamp' && this.start === 0) {
                            // sorted by descending time and on the first page
                            this.events.unshift(mangoEvent);
                        } else if (this.sort === 'activeTimestamp' && this.events.length < this.limit) {
                            // sorted by ascending time and on the last page
                            this.events.push(mangoEvent);
                        }

                        // ensure that we don't have more items than items per page
                        if (this.events.length > this.limit) {
                            this.events.pop();
                        }

                        this.total++;
                        this.totalUnAcknowledged++;
                    }
                } else {
                    // event may no longer match the filters, remove it if so
                    this.removeEvent(mangoEvent.id);
                }
            }, this.$scope, ['RAISED', 'ACKNOWLEDGED', 'RETURN_TO_NORMAL', 'DEACTIVATED']);

            this.$scope.$maSubscribe('maWatchdog/LOGGED_IN', (event, maWatchdog) => {
                $timeout(() => {
                    this.doQuery();
                }, 5000);
            });

            if (!this.hideEventHandlers) {
                // TODO update with websocket
                // TODO this is a unbounded query
                EventHandler.buildQuery().query().then(handlers => {
                    this.handlers = handlers;
                    this.rebuildHandlersMap();
                });
            }
        }

        $onChanges(changes) {
            const numChanges = Object.keys(changes).length;

            // don't re-query if only the to and from changed and we are not using the date filter
            if ((changes.from || changes.to) && !this.dateFilter) {
                const both = changes.from && changes.to;
                if (both && numChanges === 2 || numChanges === 1) {
                    return;
                }
            }

            if (changes.tagColumns && numChanges === 1) {
                // dont re-query
                return;
            }

            this.doQuery();
        }

        rebuildHandlersMap() {
            this.handlersForType.clear();
            this.handlers.forEach(handler => {
                handler.eventTypes.forEach(et => {
                    this.handlersForType.set(et, handler);
                });
            });
        }

        baseQuery() {
            const queryBuilder = Events.buildQuery();
            queryBuilder.addToRql = function(propertyName, op, propertyValue) {
                if (propertyValue != null && propertyValue !== ANY_KEYWORD) {
                    this[op](propertyName, propertyValue);
                }
            };
            queryBuilder.addToRql('alarmLevel', 'eq', this.alarmLevel);
            queryBuilder.addToRql('id', 'eq', this.eventId);

            if (this.pointId != null && this.pointId !== ANY_KEYWORD) {
                queryBuilder.addToRql('eventType', 'eq', 'DATA_POINT');
                queryBuilder.addToRql('referenceId1', 'eq', this.pointId);
            } else if (Array.isArray(this.pointIds)) {
                queryBuilder.addToRql('eventType', 'eq', 'DATA_POINT');
                queryBuilder.addToRql('referenceId1', 'in', this.pointIds);
            } else if (this.pointTags) {
                queryBuilder.addToRql('eventType', 'eq', 'DATA_POINT');
                Object.entries(this.pointTags).forEach(([key, value]) => {
                    if (value !== undefined && value !== ANY_KEYWORD) {
                        queryBuilder.eq(`tags.${key}`, value);
                    }
                });
            } else if (this.sourceId != null && this.sourceId !== ANY_KEYWORD) {
                queryBuilder.addToRql('eventType', 'eq', 'DATA_SOURCE');
                queryBuilder.addToRql('referenceId1', 'eq', this.sourceId);
            } else {
                const {eventType, subType, referenceId1, referenceId2} = this.eventTypeObject || this;

                queryBuilder.addToRql('eventType', 'eq', eventType);
                queryBuilder.addToRql('subtypeName', 'eq', subType);
                if (!Number.isFinite(referenceId1) || referenceId1 > 0) {
                    queryBuilder.addToRql('referenceId1', 'eq', referenceId1);
                }
                if (!Number.isFinite(referenceId2) || referenceId2 > 0) {
                    queryBuilder.addToRql('referenceId2', 'eq', referenceId2);
                }
            }

            if (this.activeStatus === 'active') {
                queryBuilder.addToRql('active', 'eq', true);
            } else if (this.activeStatus === 'noRtn') {
                queryBuilder.addToRql('rtnApplicable', 'eq', false);
            } else if (this.activeStatus === 'normal') {
                queryBuilder.addToRql('active', 'eq', false);
            }

            if (this.dateFilter) {
                queryBuilder.addToRql('activeTimestamp', 'ge', this.from != null && this.from.valueOf());
                queryBuilder.addToRql('activeTimestamp', 'lt', this.to != null && this.to.valueOf());
            }

            return queryBuilder;
        }

        displayQuery(limit = this.limit, offset = this.start) {
            const queryBuilder = this.baseQuery();

            queryBuilder.addToRql('acknowledged', 'eq', this.acknowledged);

            if (this.sort === 'activeRtn') {
                queryBuilder.sort('rtnTimestamp', 'rtnApplicable');
            } else if (this.sort === '-activeRtn') {
                queryBuilder.sort('-rtnTimestamp', '-rtnApplicable');
            } else if (this.sort != null) {
                if (Array.isArray(this.sort)) {
                    queryBuilder.sort(...this.sort);
                } else {
                    queryBuilder.sort(this.sort);
                }
            }

            if (limit != null) {
                queryBuilder.limit(limit, offset || 0);
            }

            return queryBuilder;
        }

        doQuery() {
            // dont query if element has a pointId attribute but its not defined
            if (this.$attrs.hasOwnProperty('pointId') && this.pointId == null || this.$attrs.hasOwnProperty('sourceId') && this.sourceId == null) {
                this.events = [];
                this.total = 0;
                this.totalUnAcknowledged = 0;
                return;
            }

            // cancel the previous request if its ongoing
            if (this.queryResource) {
                this.queryResource.$cancelRequest();
            }

            const rqlQuery = this.displayQuery().toString();
            const csvQuery = this.displayQuery(this.csvLimit).toString();
            const separator = csvQuery.length ? '&' : '';
            this.csvUrl = `/rest/latest/events?${csvQuery}${separator}format=csv2`;
            this.reducedCsvUrl = `/rest/latest/events/reduced?${csvQuery}${separator}format=csv2`;

            this.queryResource = Events.query({rqlQuery});

            this.tableQueryPromise = this.queryResource.$promise.then(data => {
                // Set Events For Table
                this.events = data;
                this.total = this.events.$total;
                if (!this.hideAckButton) {
                    this.countUnacknowledged();
                }
            });
        }

        /**
         *  Also query with limit(0) with RQLforAcknowldege to get a count of unacknowledged events to display on acknowledgeAll button
         */
        countUnacknowledged() {
            // cancel the previous request if its ongoing
            if (this.countUnacknowledgedResource) {
                this.countUnacknowledgedResource.$cancelRequest();
            }

            if (!this.acknowledged || this.acknowledged === ANY_KEYWORD) {
                const rqlQuery = this.baseQuery()
                    .eq('acknowledged', false)
                    .limit(0)
                    .toString();

                this.countUnacknowledgedResource = Events.query({rqlQuery}, null);
                this.countUnacknowledgedResource.$promise.then(data => {
                    this.totalUnAcknowledged = data.$total;
                });
            } else {
                this.totalUnAcknowledged = 0;
            }
        }

        addNote($event, event) {
            return UserNotes.addNote($event, 'Event', event.id).then((note) => {
                event.comments.push(note);
            });
        }

        onPaginate(page, limit) {
            this.start = (page - 1) * limit;
            this.doQuery();
        }

        onReorder() {
            this.doQuery();
        }

        formatDate(date) {
            return this.maDate(date, this.dateFormat || 'shortDateTimeSeconds', this.timezone);
        }

        removeEvent(eventId, replacement) {
            const index = this.events.findIndex(item => item.id === eventId);
            if (index >= 0) {
                let removed;
                if (replacement) {
                    removed = this.events.splice(index, 1, replacement);
                } else {
                    removed = this.events.splice(index, 1);
                }
                return removed[0];
            }
        }

        // Acknowledge single event
        acknowledgeEvent(event) {
            const didMatchFilters = this.eventMatchesFilters(event);

            event.$acknowledge().then(() => {
                event.acknowledged = true;

                if (!Events.notificationManager.socketConnected()) {
                    if (didMatchFilters && this.totalUnAcknowledged > 0) {
                        this.totalUnAcknowledged--;
                    }

                    if (!this.eventMatchesFilters(event)) {
                        this.removeEvent(event);
                    }
                }
            });
        }

        // Acknowledge multiple events
        acknowledgeEvents(events) {
            events.forEach((event) => {
                this.acknowledgeEvent(event);
            });
        }

        // Acknowledge all matching RQL with button
        acknowledgeAll() {
            const rqlQuery = this.baseQuery()
                .eq('acknowledged', false)
                .toString();

            Events.acknowledgeViaRql({rqlQuery}, null).$promise.then((data) => {
                if (data.count) {
                    // re-query
                    this.doQuery();
                }
            });
        }

        eventMatchesFilters(event, ignoreAckFilter) {
            const tests = [];

            if (this.$attrs.hasOwnProperty('pointId')) {
                if (this.pointId == null) {
                    return false;
                }
                tests.push(new Equals(event.eventType.eventType, 'DATA_POINT'));
            }
            if (this.$attrs.hasOwnProperty('sourceId')) {
                if (this.sourceId == null) {
                    return false;
                }
                tests.push(new Equals(event.eventType.eventType, 'DATA_SOURCE'));
            }

            const {eventType, subType, referenceId1, referenceId2} = this.eventTypeObject || this;

            let active, rtnApplicable;
            switch(this.activeStatus) {
            case 'noRtn':
                rtnApplicable = false;
                break;
            case 'active':
                rtnApplicable = true;
                active = true;
                break;
            case 'normal':
                rtnApplicable = true;
                active = false;
                break;
            }

            tests.push(
                new Equals(event.eventType.eventType, eventType),
                new Equals(event.eventType.subType, subType),
                new EqualsIgnoreZero(event.eventType.referenceId1, referenceId1),
                new EqualsIgnoreZero(event.eventType.referenceId2, referenceId2),
                new Equals(event.alarmLevel, this.alarmLevel),
                new Equals(event.active, active),
                new Equals(event.rtnApplicable, rtnApplicable),
                new Equals(event.eventType.referenceId1, this.pointId),
                new Equals(event.eventType.referenceId1, this.sourceId),
                new Equals(event.id, this.eventId));

            if (Array.isArray(this.pointIds)) {
                tests.push(
                    new Equals(event.eventType.eventType, 'DATA_POINT'),
                    new InArray(event.eventType.referenceId1, this.pointIds));
            } else if (this.pointTags) {
                tests.push(new Equals(event.eventType.eventType, 'DATA_POINT'));

                const point = event.eventType.reference1;
                const tags = point && point.tags || {};
                Object.entries(this.pointTags).forEach(([key, value]) => {
                    tests.push(new StrictEquals(tags[key], value));
                });
            }

            if (!ignoreAckFilter) {
                tests.push(new Equals(event.acknowledged, this.acknowledged));
            }

            if (this.dateFilter) {
                tests.push(
                    new GreaterThanEquals(event.activeTimestamp, this.from != null && this.from.valueOf()),
                    new LessThan(event.activeTimestamp, this.to != null && this.to.valueOf())
                );
            }

            return tests.reduce((accum, test) => {
                return accum && test.test();
            }, true);
        }

        formatDuration(duration) {
            if (duration < 1000) {
                return Translate.trSync('ui.time.milliseconds', [duration]);
            } else if (duration < 5000) {
                return Translate.trSync('ui.time.seconds', [Math.round(duration / 100) / 10]);
            } else if (duration < 60000) {
                return Translate.trSync('ui.time.seconds', [Math.round(duration / 1000)]);
            }
            return moment.duration(duration).humanize();
        }

        saveCsvLimit() {
            this.settings.csvLimit = this.csvLimit;
            localStorageService.set(localStorageKey, this.settings);
        }
    }

    return {
        restrict: 'E',
        template: eventsTableTemplate,
        scope: {},
        controller: EventsTableController,
        controllerAs: '$ctrl',
        bindToController: {
            pointId: '<?',
            pointIds: '<?',
            pointTags: '<?',
            eventId: '<?',
            alarmLevel: '<?',
            eventTypeObject: '<?',
            eventType: '<?',
            subType: '<?',
            referenceId1: '<?',
            referenceId2: '<?',
            acknowledged: '<?',
            activeStatus: '<?',
            limit: '<?',
            sort: '<?',
            from: '<?',
            to: '<?',
            dateFilter: '<?',
            timezone: '@',
            hideLink: '@?',
            hideAckButton: '<?',
            hideCsvButton: '<?',
            sourceId: '<?',
            dateFormat: '@?',
            hideEventHandlers: '<?',
            tagColumns: '<?',
            csvLimit: '<?'
        },
        designerInfo: {
            translation: 'ui.app.eventsTable',
            icon: 'alarm'
        }
    };
}

export default eventsTable;


