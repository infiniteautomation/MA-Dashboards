/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import MultiMap from '../classes/MultiMap';

eventTypeProvider.$inject = [];
function eventTypeProvider() {

    const eventTypeOptions = [];
    this.registerEventTypeOptions = function(options) {
        eventTypeOptions.push(options);
    };

    this.registerEventTypeOptions(['maPoint', function(Point) {
        return {
            typeName: 'DATA_POINT',
            orderBy: ['type.reference1.deviceName', 'type.reference1.name', 'description'],
            icon: 'label',
            getSource() {
                if (!this.type.reference1) {
                    return;
                }
                return Object.assign(Object.create(Point.prototype), this.type.reference1);
            },
            getDescription() {
                if (this.type.reference1 && !this.type.reference2) {
                    const source = this.getSource();
                    return source && source.formatLabel() || this.description;
                }
                return this.description;
            },
            stateName: 'ui.dataPointDetails',
            stateParams() {
                return {
                    pointXid: this.getSource().xid
                };
            }
        };
    }]);

    this.registerEventTypeOptions({
        typeName: 'DATA_SOURCE',
        icon: 'device_hub',
        stateName: 'ui.datacollection.dataSources',
        stateParams() {
            return {
                xid: this.getSource().xid
            };
        }
    });

    this.registerEventTypeOptions({
        typeName: 'PUBLISHER',
        icon: 'cloud_upload'
    });

    this.$get = eventTypeFactory;

    eventTypeFactory.$inject = ['maRestResource', 'maRqlBuilder', 'maUtil'];
    function eventTypeFactory(RestResource, RqlBuilder, Util) {

        const eventTypeOptionsMap = new Map();
        
        /**
         * Injects options, freezes the result so it cant be modified and creates a map of type name to options
         */
        eventTypeOptions.forEach(options => {
            try {
                const injected = Util.inject(options);
                eventTypeOptionsMap.set(injected.typeName, Object.freeze(injected));
            } catch (e) {
                console.error(e);
            }
        });

        const eventTypeBaseUrl = '/rest/latest/event-types';

        class EventType {
            constructor(data) {
                Object.assign(this, data);
                if (!this.subType) {
                    this.subType = this.eventSubtype || null;
                }
                this.typeId = this.getTypeId();
                this.matchingIds = this.getMatchingIds();
            }
            
            getTypeId() {
                return this.constructor.typeId(this);
            }
            
            getMatchingIds() {
                return this.constructor.matchingIds(this);
            }

            static typeId(eventType) {
                const type = eventType.eventType;
                const subType = eventType.subType || eventType.eventSubtype || null;
                const ref1 = eventType.referenceId1 || 0;
                const ref2 = eventType.referenceId2 || 0;
                return `${type}_${subType}_${ref1}_${ref2}`;
            }
            
            static matchingIds(eventType) {
                const ids = [eventType.typeId || this.typeId(eventType)];
                if (eventType.referenceId2) {
                    ids.push(this.typeId({
                        eventType: eventType.eventType,
                        subType: eventType.subType,
                        referenceId1: eventType.referenceId1,
                        referenceId2: 0
                    }));
                }
                if (eventType.referenceId1) {
                    ids.push(this.typeId({
                        eventType: eventType.eventType,
                        subType: eventType.subType,
                        referenceId1: 0,
                        referenceId2: 0
                    }));
                }
                if (eventType.subType) {
                    ids.push(this.typeId({
                        eventType: eventType.eventType,
                        subType: null,
                        referenceId1: 0,
                        referenceId2: 0
                    }));
                }
                return ids;
            }
        }

        class EventTypeMap extends MultiMap {
            set(eventType, value) {
                return super.set(eventType.typeId, value);
            }
            
            get(eventType, exact) {
                const values = new Set();
                
                if (exact) {
                    return super.get(eventType.typeId || EventType.typeId(eventType));
                }
                
                const matchingIds = eventType.matchingIds || EventType.matchingIds(eventType);
                for (let id of matchingIds) {
                    for (let v of super.get(id)) {
                        values.add(v);
                    }
                }
                
                return values;
            }
            
            has(eventType, exact, value) {
                if (exact) {
                    return super.has(eventType.typeId || EventType.typeId(eventType));
                }
                
                const matchingIds = eventType.matchingIds || EventType.matchingIds(eventType);
                for (let id of matchingIds) {
                    if (super.has(id, value)) {
                        return true;
                    }
                }
                return false;
            }
            
            delete(eventType, exact, value) {
                if (exact) {
                    return super.delete(eventType.typeId || EventType.typeId(eventType));
                }
                
                const deleted = new Set();
                const matchingIds = eventType.matchingIds || EventType.matchingIds(eventType);
                for (let id of matchingIds) {
                    for (let d of super.delete(id, value)) {
                        deleted.add(d);
                    }
                }
                return deleted;
            }
            
            count(eventType, exact) {
                return this.get(eventType, exact).size;
            }
            
            /* Not used for now
            deleteMoreSpecific(eventType) {
                // return immediately if eventType is the most specific form
                if (eventType.referenceId1 && eventType.referenceId2) {
                    return;
                }
                
                for (let et of this.values()) {
                    if (et.matchingIds.includes(eventType.typeId)) {
                        this.delete(et);
                    }
                }
            }
            */
        }
        
        class EventTypeInfo extends RestResource {
            static get baseUrl() {
                return eventTypeBaseUrl;
            }
            
            static get idProperty() {
                return null;
            }

            initialize() {
                if (this.type) {
                    this.type = new EventType(this.type);
                    
                    const options = eventTypeOptionsMap.get(this.type.eventType);
                    Object.assign(this, options);
                }
            }
            
            get typeId() {
                return this.type && this.type.typeId;
            }
            
            set typeId(v) {
                // do nothing
            }
            
            handleable() {
                return this.type.eventType && (this.type.subType || !this.supportsSubtype);
            }

            hasChildren() {
                const eventType = this.type;
                if (this.supportsSubtype && !eventType.subType) {
                    return true;
                } else if (this.supportsReferenceId1 && !eventType.referenceId1) {
                    return true;
                } else if (this.supportsReferenceId2 && !eventType.referenceId2) {
                    return true;
                }
                return false;
            }
            
            loadChildren(limit, offset) {
                const eventType = this.type;
                return this.constructor.list({
                    eventType: eventType.eventType,
                    subType: this.supportsSubtype ? eventType.subType || undefined : null,
                    referenceId1: eventType.referenceId1,
                    referenceId2: eventType.referenceId2
                }, limit, offset);
            }

            loadMoreChildren(existing, limit = 100) {
                return this.loadChildren(limit, existing.length).then(results => {
                    existing.push(...results);
                    existing.$total = results.$total;
                    return existing;
                });
            }

            getSource() {
                return this.type.reference2 || this.type.reference1;
            }
            
            getDescription() {
                return this.description;
            }

            static list(eventType, limit, offset = 0, opts = {}) {
                const builder = this.buildQuery(eventType).sort('description');
                if (Number.isFinite(limit)) {
                    builder.limit(limit, offset);
                }
                return builder.query(opts);
            }
            
            static buildQuery(eventType) {
                const builder = new RqlBuilder();
                builder.queryFunction = (queryObj, opts) => {
                    return this.query(eventType, queryObj, opts);
                };
                return builder;
            }

            static query(eventType, queryObject, opts = {}) {
                const params = {};
                
                if (queryObject) {
                    const rqlQuery = queryObject.toString();
                    if (rqlQuery) {
                        params.rqlQuery = rqlQuery;
                    }
                }
                
                let segments = [];
                if (eventType && eventType.eventType) {
                    segments.push(eventType.eventType);
                    if (eventType.subType || eventType.subType === null) {
                        segments.push(eventType.subType);
                        if (eventType.referenceId1) {
                            segments.push(eventType.referenceId1);
                            if (eventType.referenceId2) {
                                segments.push(eventType.referenceId2);
                            }
                        }
                    }
                }
                segments = segments.map(s => this.encodeUriSegment(s));
                segments.unshift(this.baseUrl);

                return this.http({
                    url: segments.join('/'),
                    method: 'GET',
                    params: params
                }, opts).then(response => {
                    if (opts.responseType != null) {
                        return response.data;
                    }
                    
                    const items = response.data.items.map(item => {
                        return new this(item);
                    });
                    items.$total = response.data.total;
                    return items;
                });
            }
        }
        
        EventTypeInfo.EventType = EventType;
        EventTypeInfo.EventTypeMap = EventTypeMap;

        return EventTypeInfo;
    }
}

export default eventTypeProvider;