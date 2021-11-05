/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import TableController from '../../classes/TableController';
import publisherPointsTable from './publisherPointsTable.html';
import './publisherPointsTable.css';

const DEFAULT_COLUMNS = [
    { name: 'xid', label: 'ui.app.xidShort', selectedByDefault: true },
    { name: 'dataPointXid', label: 'ui.components.dataPointXid', selectedByDefault: true },
    { name: 'name', label: 'common.name', selectedByDefault: true },
    { name: 'enabled', label: 'common.enabled', selectedByDefault: true }
];

class PublisherPointsTableController extends TableController {
    static get $inject() {
        return ['$scope', '$element', '$injector', 'maPublisherPoints', 'maDataPointTags'];
    }

    constructor ($scope, $element, $injector, maPublisherPoints, maDataPointTags) {
        super({
            $scope,
            $element,
            $injector,

            resourceService: maPublisherPoints,
            localStorageKey: 'publisherPointsTable',
            defaultColumns: DEFAULT_COLUMNS,
            disableSortById: true,
            selectMultiple: true
        });

        this.maDataPointTags = maDataPointTags;
    }

    $onChanges(changes) {
        if ((changes.localStorageKey && changes.localStorageKey.currentValue) || (changes.defaultSort && changes.defaultSort.currentValue)) {
            this.loadSettings();
        }
        if (this.selectedColumns && changes.refreshTable && changes.refreshTable.currentValue) {
            if (this.selectedColumns) {
                this.filterChanged();
            }
        }
    }

    loadSettings() {
        super.loadSettings();
    }

    loadColumns() {
        return super
            .loadColumns()
            .then(() => this.maDataPointTags.keys())
            .then((keys) => {
                const filters = this.settings.filters || {};
                this.tagColumns = keys
                    .filter((k) => !['device', 'name'].includes(k))
                    .map((k, i) => {
                        const name = `tags.${k}`;
                        return this.createColumn({
                            tagKey: k,
                            name,
                            label: 'ui.app.tag',
                            labelArgs: [k],
                            filter: filters[name] || null,
                            order: 500 + i,
                            dateFormat: this.dateFormat
                        });
                    });
                this.nonTagColumns = this.columns;
                this.columns = this.columns.concat(this.tagColumns);
            });
    }

    doQuery(queryBuilder, opts) {
        if (typeof this.exposedDoQuery === 'function') {
            return this.exposedDoQuery({ $queryBuilder: queryBuilder, $opts: opts });
        }
        return super.doQuery(queryBuilder, opts);
    }

    customizeQuery(queryBuilder) {
        if (typeof this.userCustomizeQuery === 'function') {
            this.userCustomizeQuery({ $queryBuilder: queryBuilder });
        }
    }

    rowFilter(rowItem) {
        if (typeof this.customRowFilter === 'function' && rowItem != null) {
            const item = this.customRowFilter({ $item: rowItem });
            return item.rowFilter;
        }
        return true;
    }
}

export default {
    template: publisherPointsTable,
    controller: PublisherPointsTableController,
    require: {
        ngModelCtrl: 'ngModel'
    },
    bindings: {
        localStorageKey: '<?',
        defaultColumns: '<?',
        defaultSort: '<?',
        refreshTable: '<?',
        userCustomizeQuery: '&?customizeQuery',
        exposedDoQuery: '&?doQuery',
        customRowFilter: '&?rowFilter',
        publisherType: '<'
    }
};
