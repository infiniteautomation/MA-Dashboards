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

        this.pointsToPublish = new Map();
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
            this.$q.resolve(this.loadColumns()).then(() => {
                this.selectColumns();
            });
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

    loadColumns() {
        return super.loadColumns().then(() => {
            this.nonTagColumns = this.columns;
        });
    }

    doQuery(queryBuilder, opts) {
        if (typeof this.exposedDoQuery === 'function') {
            return this.exposedDoQuery({ $queryBuilder: queryBuilder, $opts: opts });
        }

        return super.doQuery(queryBuilder, opts);
        // .then((points) => {
        //     this.publishedPointsCount = points.$total;
        //     console.log('points query', points);

        //     const publishedPointsArr = [...this.pointsToPublish.values()];
        //     if (publishedPointsArr.length > 0) {
        //         points.unshift(...publishedPointsArr);
        //         points.$total += publishedPointsArr.length;
        //     }
        //     return points;
        // });
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

    removePoint({ item, $index }) {
        const pageNumber = $index - ($index % this.pageSize);
        const page = this.pages.get(pageNumber);
        const pointToDeleteIndex = page.items.findIndex((p) => p.dataPointXid === item.dataPointXid);
        page.items.splice(pointToDeleteIndex, 1);

        const point = item;
        point.action = 'DELETE';
        this.buildPointsToSave(point);
    }

    updatePoint({ item }) {
        const point = item;
        point.action = 'UPDATE';
        this.buildPointsToSave(point);
    }

    // TODO: Remove this method as queries for each single point
    publisherPointsToPoints(publishedPoints) {
        console.log('publishedPoints', publishedPoints);
        // return publishedPoints.map((publisherPoint) => new this.maPoint({ xid: publisherPoint.dataPointXid }));
    }

    pointsToPublisherPoints(points) {
        if (Array.isArray(points)) {
            // map of XID to existing publisher points
            const xidToPublisherPoint = this.maUtil.createMapObject([...this.pointsToPublish.values()], 'dataPointXid');

            points.forEach((point) => {
                let publisherPoint = xidToPublisherPoint[point.xid];
                if (!publisherPoint) {
                    publisherPoint = this.publisher.createPublisherPoint(point);
                }
                this.pointsToPublish.set(publisherPoint.xid, publisherPoint);
            });

            console.log('point map all', this.pointsToPublish);
            return [...this.pointsToPublish.values()];
        }
    }

    pointSelectorClosed() {
        this.reloadTable();
    }

    pointsChanged() {
        // ma-data-point-selector is not part of the form as it is in a drop down dialog, have to manually set the form dirty
        this.form.$setDirty();
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
