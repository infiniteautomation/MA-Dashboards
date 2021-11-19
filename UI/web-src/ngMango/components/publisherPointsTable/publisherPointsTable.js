/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import TableController from '../../classes/TableController';
import publisherPointsTable from './publisherPointsTable.html';
import './publisherPointsTable.css';

const DEFAULT_COLUMNS = [
    // { name: 'xid', label: 'ui.app.xidShort', selectedByDefault: true },
    // { name: 'dataPointXid', label: 'ui.components.dataPointXid', selectedByDefault: true },
    // { name: 'name', label: 'common.name', selectedByDefault: true, editable: true }
    // { name: 'enabled', label: 'common.enabled', selectedByDefault: true }
];

class PublisherPointsTableController extends TableController {
    static get $inject() {
        return ['$scope', '$element', '$injector'];
    }

    constructor($scope, $element, $injector) {
        super({
            $scope,
            $element,
            $injector,

            resourceService: {},
            localStorageKey: 'publisherPointsTable',
            defaultColumns: DEFAULT_COLUMNS,
            disableSortById: true,
            selectMultiple: true
        });
    }

    $onChanges(changes) {
        if ((changes.localStorageKey && changes.localStorageKey.currentValue) || (changes.defaultSort && changes.defaultSort.currentValue)) {
            this.loadSettings();
        }
        if (this.selectedColumns && changes.refreshTable && changes.refreshTable.currentValue) {
            if (this.selectedColumns) {
                this.reloadTable();
            }
        }
        if (changes.customColumns && changes.customColumns.currentValue) {
            this.defaultColumns = this.customColumns;
            this.prepareTable(false);
        }
        if (changes.resourceService && changes.resourceService.currentValue) {
            this.idProperty = this.resourceService.idProperty;
        }
    }

    reloadTable() {
        if (this.selectedColumns) {
            this.filterChanged();
        }
    }

    loadSettings() {
        super.loadSettings();
    }

    prepareTable(withItems = false) {
        // loading the items
        this.loadColumns().then(() => {
            this.selectColumns();
            if (withItems) {
                this.getItems();
            }
        });
    }

    loadColumns() {
        return super.loadColumns().then(() => {
            this.nonTagColumns = this.columns;
        });
    }

    doQuery(queryBuilder, opts) {
        console.log('running query');
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
        resourceService: '<',
        localStorageKey: '<?',
        customColumns: '<?',
        showClear: '<?',
        defaultSort: '<?',
        refreshTable: '<?',
        userCustomizeQuery: '&?customizeQuery',
        exposedDoQuery: '&?doQuery',
        customRowFilter: '&?rowFilter',
        publisherContainer: '<publisher',
        modifiedPoint: '&'
    }
};
