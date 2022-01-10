/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import TableController from '../../classes/TableController';
import publisherPointsTable from './publisherPointsTable.html';
import './publisherPointsTable.css';

const DEFAULT_COLUMNS = [
    { name: 'xid', label: 'ui.app.xidShort', selectedByDefault: true },
    { name: 'dataPointXid', label: 'ui.components.dataPointXid', selectedByDefault: true },
    { name: 'name', label: 'common.name', selectedByDefault: true, editable: true }
    // { name: 'enabled', label: 'common.enabled', selectedByDefault: true }
];

class PublisherPointsTableController extends TableController {
    static get $inject() {
        return ['$scope', '$element', '$injector', 'maPublisher', 'maPublisherPoints'];
    }

    constructor($scope, $element, $injector, maPublisher, maPublisherPoints) {
        super({
            $scope,
            $element,
            $injector,

            resourceService: maPublisherPoints,
            localStorageKey: 'publisherPointsTable',
            defaultSort: [{columnName: 'name'}],
            // default only, can be changed via attribute
            selectMultiple: true
        });

        this.maPublisher = maPublisher;
    }

    $onChanges(changes) {
        super.$onChanges(changes);

        if (changes.publisher && this.publisher) {
            // table always filters on the publisher XID, clear the cache when the publisher changes
            this.clearCache();

            // setup all the columns for the publisher's type
            this.prepareTable();
        }
    }

    customizeQuery(queryBuilder) {
        if (this.publisher && !this.publisher.isNew()) {
            queryBuilder.eq('publisherXid', this.publisher.xid);
        }
    }

    doQuery(queryBuilder, opts) {
        if (!this.publisher || this.publisher.isNew()) {
            // return an empty array if no publisher is provided
            const empty = [];
            empty.$total = 0;
            return this.$q.resolve(empty);
        }
        return super.doQuery(...arguments);
    }

    get defaultColumns() {
        const publisherTypesByName = this.maPublisher.typesByName;
        const publisherType = this.publisher ? publisherTypesByName[this.publisher.modelType] : null;

        const columns = DEFAULT_COLUMNS.slice();
        if (publisherType && publisherType.pointProperties) {
            for (let property of publisherType.pointProperties) {
                columns.push({
                    name: property.name,
                    label: property.translationKey,
                    selectedByDefault: true,
                    sortable: false,
                    filterable: false
                });
            }
        }

        return columns;
    }
}

export default {
    template: publisherPointsTable,
    controller: PublisherPointsTableController,
    require: {
        ngModelCtrl: 'ngModel'
    },
    bindings: {
        publisher: '<',
        selectMultiple: '<?',
        showClear: '<?'
    }
};
