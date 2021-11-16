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
        if (changes.publisherType && changes.publisherType.currentValue) {
            this.$q.resolve(this.loadColumns()).then(() => {
                this.selectColumns();
            });
        }
    }

    loadSettings() {
        super.loadSettings();
    }

    loadColumns() {
        console.log('pub type', this.publisherType);
        if (this.publisherType) {
            const builtColumns = this.publisherType.pointProperties.map((props) => ({
                name: props.name,
                label: props.translationKey,
                selectedByDefault: true,
                editable: true,
                editorTemplateUrl: props.editorTemplateUrl,
                class: `ma-publisher-point-${props.name}`,
                sortable: false,
                filterable: false
            }));
            this.defaultColumns = [...DEFAULT_COLUMNS, ...builtColumns];
        }
        return super.loadColumns().then(() => {
            this.nonTagColumns = this.columns;
            console.log(this.nonTagColumns);
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

    removePoint({ item, $index }) {
        const pageNumber = $index - ($index % this.pageSize);
        const page = this.pages.get(pageNumber);
        const pointToDeleteIndex = page.items.findIndex((p) => p.dataPointXid === item.dataPointXid);
        page.items.splice(pointToDeleteIndex, 1);

        const point = item;
        point.action = 'DELETE';
        this.modifiedPoint({ $point: point });
    }

    updatePoint({ item }) {
        const point = item;
        point.action = 'UPDATE';
        this.modifiedPoint({ $point: point });
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
        publisherType: '<',
        modifiedPoint: '&'
    }
};
