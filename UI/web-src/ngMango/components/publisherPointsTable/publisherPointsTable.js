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

const VALIDATION_MESSAGE_PROPERTY_MAP = {
    purgeType: 'purgePeriod.type',
    purgePeriod: 'purgePeriod.periods',
    name: 'common.name'
};
class PublisherPointsTableController extends TableController {
    static get $inject() {
        return ['$scope', '$element', '$injector', 'maPublisherPoints', 'maDialogHelper'];
    }

    constructor($scope, $element, $injector, maPublisherPoints, maDialogHelper) {
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

        this.DialogHelper = maDialogHelper;
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
        if (changes.publisherContainer && changes.publisherContainer.currentValue) {
            const { publisher, type } = this.publisherContainer;
            this.publisher = publisher;
            this.publisherType = type;

            this.buildColumns(type);

            this.$q.resolve(this.loadColumns()).then(() => {
                this.selectColumns();
            });
        }
    }

    reloadTable() {
        if (this.selectedColumns) {
            this.filterChanged();
        }
    }

    buildColumns(publisherType) {
        const builtColumns = (publisherType.pointProperties || []).map((props) => ({
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

        return super.doQuery(queryBuilder, opts).then((points) => {
            this.publishedPointsCount = points.$total;
            console.log('points query', points);

            const publishedPointsArr = [...this.pointsToPublish.values()];
            if (publishedPointsArr.length > 0) {
                points.unshift(...publishedPointsArr);
                points.$total += publishedPointsArr.length;
            }
            return points;
        });
    }

    // TODO: Cancel query if pub xid is null
    customizeQuery(queryBuilder) {
        if (typeof this.userCustomizeQuery === 'function') {
            this.userCustomizeQuery({ $queryBuilder: queryBuilder });
        } else if (this.publisher) {
            queryBuilder.eq('publisherXid', this.publisher.xid);
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

    buildPointsToSave(publishedPoint) {
        this.form.$setDirty();
        if (publishedPoint.action === 'DELETE' && publishedPoint.isNew() && this.pointsToPublish.has(publishedPoint.dataPointXid)) {
            this.pointsToPublish.delete(publishedPoint.dataPointXid);
        } else {
            this.pointsToPublish.set(publishedPoint.xid, publishedPoint);
        }
        console.log('point map single', this.pointsToPublish);
    }

    savePoints(event) {
        this.validationMessages = [];
        this.errorMessages = [];

        const allPointsToPublish = [...this.pointsToPublish.values()];

        const requests = allPointsToPublish.map((pPoint) => {
            const request = {
                xid: pPoint.getOriginalId() || pPoint.xid,
                body: pPoint
            };

            if (pPoint.isNew()) {
                request.action = 'CREATE';
            } else {
                request.action = pPoint.action || 'UPDATE';
            }

            return request;
        });

        console.log('requests', requests);

        if (requests.length <= 0) return null;

        this.bulkTask = new this.resourceService.Bulk({
            action: null,
            requests
        });

        return this.bulkTask
            .start(this.$scope)
            .then(
                (resource) => {
                    this.saveMultipleComplete(resource, allPointsToPublish);
                },
                (error) => {
                    this.notifyBulkEditError(error);
                },
                (resource) => {
                    // progress
                }
            )
            .finally(() => {
                delete this.bulkTask;
            });
    }

    saveMultipleComplete(resource, savedPoints) {
        const { hasError } = resource.result;
        const { responses } = resource.result;

        responses.forEach((response, i) => {
            const point = savedPoints[i];
            if (response.body && ['CREATE', 'UPDATE'].includes(response.action)) {
                angular.copy(response.body, point);
            }
        });

        if (hasError) {
            const validationMessages = [];

            responses.forEach((response, i) => {
                const message = response.error && response.error.localizedMessage;
                if (message && !this.errorMessages.includes(message)) {
                    this.errorMessages.push(message);
                }

                if (response.httpStatus === 422) {
                    const { messages } = response.error.result;
                    messages.forEach((m) => {
                        const validationMessage = `${m.level}: ${response.xid} - ${m.message} ${m.property}`;
                        if (!this.errorMessages.includes(validationMessage)) {
                            this.errorMessages.push(validationMessage);
                        }

                        const found = validationMessages.find((m2) => m.level === m2.level && m.property === m2.property && m.message === m2.message);

                        if (!found) {
                            validationMessages.push({ ...m, xid: response.xid });
                        }
                    });
                }
            });
            this.validationMessages = this.fixValidationMessages(validationMessages);
        } else {
            this.pointsToPublish = new Map();
            this.setViewValue(savedPoints);
            this.render();
        }

        this.notifyBulkEditComplete(resource);
    }

    notifyBulkEditComplete(resource) {
        const numErrors = resource.result.responses.reduce((accum, response) => (response.error ? accum + 1 : accum), 0);

        const toastOptions = {
            textTr: [null, resource.position, resource.maximum, numErrors],
            hideDelay: 10000,
            classes: 'md-warn'
        };

        switch (resource.status) {
            case 'CANCELLED':
                toastOptions.textTr[0] = 'ui.app.bulkEditCancelled';
                break;
            case 'TIMED_OUT':
                toastOptions.textTr[0] = 'ui.app.bulkEditTimedOut';
                break;
            case 'ERROR':
                toastOptions.textTr[0] = 'ui.app.bulkEditError';
                toastOptions.textTr.push(resource.error.localizedMessage);
                break;
            case 'SUCCESS':
                if (!numErrors) {
                    toastOptions.textTr = ['ui.app.bulkEditSuccess', resource.position];
                    delete toastOptions.classes;
                    this.errorMessages = [];
                    this.validationMessages = [];
                } else {
                    toastOptions.textTr[0] = 'ui.app.bulkEditSuccessWithErrors';
                }
                break;
            default:
                break;
        }

        this.DialogHelper.toastOptions(toastOptions);
    }

    notifyBulkEditError(error) {
        this.DialogHelper.toastOptions({
            textTr: ['ui.app.errorStartingBulkEdit', error.mangoStatusText],
            hideDelay: 10000,
            classes: 'md-warn'
        });
    }

    fixValidationMessages(validationMessages) {
        validationMessages.forEach((vm) => {
            const newKey = VALIDATION_MESSAGE_PROPERTY_MAP[vm.property];
            if (newKey) {
                vm.property = newKey;
            }
        });
        return validationMessages;
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
        publisherContainer: '<publisher',
        modifiedPoint: '&'
    }
};
