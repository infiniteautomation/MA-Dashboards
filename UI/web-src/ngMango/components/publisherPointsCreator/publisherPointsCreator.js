/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';
import template from './publisherPointsCreator.html';
import './publisherPointsCreator.css';

const DEFAULT_COLUMNS = [
    { name: 'xid', translationKey: 'ui.app.xidShort' },
    { name: 'dataPointXid', translationKey: 'ui.components.dataPointXid' },
    { name: 'name', translationKey: 'common.name', editable: true, required: true }
    // { name: 'enabled', translationKey: 'common.enabled', editable: true }
];

const VALIDATION_MESSAGE_PROPERTY_MAP = {
    // Mapped to xid so It can pick up the full table length
    dataPointId: 'dataPointXid',
    id: 'xid'
};

class PublisherPointsCreatorController {
    static get $$ngIsClass() {
        return true;
    }

    static get $inject() {
        return ['maUtil', 'maPublisherPoints', 'maDialogHelper', '$scope', 'maPublisher'];
    }

    constructor(maUtil, maPublisherPoints, maDialogHelper, $scope, maPublisher) {
        this.maUtil = maUtil;
        this.PublisherPoints = maPublisherPoints;
        this.DialogHelper = maDialogHelper;
        this.$scope = $scope;
        this.maPublisher = maPublisher;

        this.tableOptions = {
            limit: 10,
            page: 1,
            total: 0
        };

        this.showDialog = false;

        this.clearDialog();

        this.onPaginateBound = (...args) => this.onPaginate(...args);
    }

    $onChanges(changes) {
        if (changes.triggerDialog && changes.triggerDialog.currentValue) {
            this.showDialog = true;
        }
        if (changes.publisher) {
            this.createColumns();
        }
    }

    dialogHidden() {
        this.clearDialog();
        this.showDialog = false;
        this.dialog.hide();
    }

    dialogCancelled() {
        this.clearDialog();
        this.showDialog = false;
        this.dialog.hide();
    }

    clearDialog() {
        this.points = [];
        this.pointsToPublish = [];
        this.errorMessages = [];
        this.validationMessages = [];
        if (this.form) {
            this.form.$setUntouched();
            this.form.$setPristine();
        }
    }

    getOrderBy(index) {
        // return this.tableBody[index];
    }

    pointSelectorClosed() {
        // this.reloadTable();
    }

    pointsChanged() {
        // ma-data-point-selector is not part of the form as it is in a drop down dialog, have to manually set the form dirty
        this.form.$setDirty();

        if (Array.isArray(this.points)) {
            // map of XID to existing publisher points
            const xidToPublisherPoint = this.maUtil.createMapObject([...this.pointsToPublish.values()], 'dataPointXid');

            this.pointsToPublish = this.points.map((point) => {
                let publisherPoint = xidToPublisherPoint[point.xid];
                if (!publisherPoint) {
                    publisherPoint = this.publisher.createPublisherPoint(point);
                }
                return publisherPoint;
            });

            this.tableOptions.total = this.pointsToPublish.length;
        }
    }

    addPoints() {
        this.form.$setSubmitted();

        this.validationMessages = [];
        this.errorMessages = [];

        const requests = this.pointsToPublish.map((pPoint) => {
            const request = {
                xid: pPoint.getOriginalId() || pPoint.xid,
                body: pPoint
            };

            request.action = 'CREATE';

            return request;
        });

        if (requests.length <= 0) return null;

        this.bulkTask = new this.PublisherPoints.Bulk({
            action: null,
            requests
        });

        // TODO: Wire up clean up with errors or not on save
        return this.bulkTask
            .start(this.$scope)
            .then((resource) => {
                this.saveMultipleComplete(resource, this.pointsToPublish);
            }, (error) => {
                this.notifyBulkEditError(error);
            }).finally(() => {
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

            responses.forEach((response) => {
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
            this.pruneValidItems(validationMessages);
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
                    this.dialogCancelled();
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

    pruneValidItems(validationMessages) {
        const failedXids = validationMessages.map((vm) => vm.xid);
        this.pointsToPublish = this.pointsToPublish.filter((ptp) => failedXids.includes(ptp.xid));
        this.validationMessages = this.fixValidationMessages(validationMessages, this.pointsToPublish);

        const dpXids = this.pointsToPublish.map((ptp) => ptp.dataPointXid);
        this.editSelectedPoints(dpXids);
    }

    fixValidationMessages(validationMessages, pointsToPublish) {
        validationMessages.forEach((vm) => {
            const pointToPublishIndex = pointsToPublish.findIndex((ptp) => ptp.xid === vm.xid);
            const newKey = VALIDATION_MESSAGE_PROPERTY_MAP[vm.property] || vm.property;
            if (newKey) {
                const [property] = newKey.split('-');
                vm.property = `${property}-${pointToPublishIndex}`;
            }
        });
        return validationMessages;
    }

    removeSelectedPoints(point) {
        const validationMessages = this.validationMessages.filter((vm) => vm.xid !== point.xid);
        delete this.validationMessages;
        this.pointsToPublish = this.pointsToPublish.filter((ptp) => ptp.xid !== point.xid);
        this.points = this.points.filter((p) => p.xid !== point.dataPointXid);
        this.validationMessages = this.fixValidationMessages(validationMessages, this.pointsToPublish);
    }

    /**
     * A method to remove non exisitng points in table from points model
     * @param {*} dpXids array of xids from points that are still shown in table
     */
    editSelectedPoints(dpXids) {
        this.points = this.points.filter((p) => dpXids.includes(p.xid));
    }

    /**
     * Retrieves the DataPoint from the published point
     * Note: used from Publisher modules, do not remove.
     *
     * @param publisherPoint
     * @returns {maPoint}
     */
    getPoint(publisherPoint) {
        return this.points.find((p) => p.xid === publisherPoint.dataPointXid);
    }

    buildColumnName(column, parentIndex) {
        const { limit, page } = this.tableOptions;
        const pageMultiplier = (page - 1) * limit;
        return `${column.name}-${parentIndex + pageMultiplier}`;
    }

    /**
     * Callback Method from onPaginateBound, this method resets validation messages in order
     * to show them in a newer page
     * @param {*} page tables current page
     * @param {*} limit tables current limit
     */
    onPaginate(page, limit) {
        const validationMessages = angular.copy(this.validationMessages);
        delete this.validationMessages;
        this.validationMessages = validationMessages;
    }

    createColumns() {
        const publisherTypesByName = this.maPublisher.typesByName;
        // $ctrl.publisherType is used by the pointProperties templates
        this.publisherType = this.publisher ? publisherTypesByName[this.publisher.modelType] : null;

        this.columns = DEFAULT_COLUMNS.slice();
        if (this.publisherType && this.publisherType.pointProperties) {
            for (let property of this.publisherType.pointProperties) {
                this.columns.push(property);
            }
        }
    }
}

export default {
    template,
    controller: PublisherPointsCreatorController,
    bindings: {
        publisher: '<',
        triggerDialog: '<'
    }
};
