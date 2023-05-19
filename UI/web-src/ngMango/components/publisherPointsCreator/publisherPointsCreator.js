/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

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
        this.errorMap = new WeakMap();
        this.validationMessages = [];

        this.clearDialog();

        // shallow copy validationMessages to notify ma-validation-messages directive
        this.onPaginateBound = () => this.validationMessages = this.validationMessages.slice();
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
            const xidToPublisherPoint = this.maUtil.createMapObject(this.pointsToPublish.values(), 'dataPointXid');

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
        if (this.form.$invalid) return;

        this.validationMessages = [];
        this.pointsToPublish.forEach(p => this.errorMap.delete(p));

        const requests = this.pointsToPublish.map((publishedPoint) => {
            return {
                xid: publishedPoint.getOriginalId() || publishedPoint.xid,
                body: publishedPoint,
                action: 'CREATE'
            };
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
                this.saveMultipleComplete(resource);
            }, (error) => {
                this.notifyBulkEditError(error);
            }).finally(() => {
                delete this.bulkTask;
            });
    }

    saveMultipleComplete(resource) {
        const responses = resource.result.responses;

        const selectedPoints = [];
        const pointsByXid = this.maUtil.createMap(this.points, 'xid');

        for (let i = 0; i < responses.length; i++) {
            const response = responses[i];
            const publishedPoint = this.pointsToPublish[i];

            if (response.error) {
                this.errorMap.set(publishedPoint, response.error);

                if (response.error.mangoStatusName === 'VALIDATION_FAILED' && response.error.result.messages) {
                    const messages = response.error.result.messages;
                    for (const m of messages) {
                        m.xid = publishedPoint.xid;
                        const property = VALIDATION_MESSAGE_PROPERTY_MAP[m.property] || m.property;
                        m.property = publishedPoint.xid + '_' + property;
                        this.validationMessages.push(m);
                    }
                }

                // keep selected in data point selector drop down
                const point = pointsByXid.get(publishedPoint.dataPointXid);
                if (point) {
                    selectedPoints.push(point);
                }
            }
        }

        this.points = selectedPoints;
        // shallow copy to notify ma-validation-messages directive
        this.validationMessages = this.validationMessages.slice();
        // remove all published points which completed successfully
        this.pointsToPublish = this.pointsToPublish.filter((p) => this.errorMap.has(p));
        this.notifyBulkEditComplete(resource);
    }

    hasError(publishedPoint) {
        return this.errorMap.has(publishedPoint);
    }

    getError(publishedPoint) {
        return this.errorMap.get(publishedPoint);
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
                if (!resource.result.hasError) {
                    toastOptions.textTr = ['ui.app.bulkEditSuccess', resource.position];
                    delete toastOptions.classes;
                    this.dialogCancelled();
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

    removeSelectedPoint(point) {
        const index = this.pointsToPublish.indexOf(point);
        this.pointsToPublish.splice(index, 1);
        this.points = this.points.filter((p) => p.xid !== point.dataPointXid);

        this.errorMap.delete(point);
        this.validationMessages = this.validationMessages.filter((vm) => vm.xid !== point.xid);
    }

    /**
     * A method to remove non-existing points in table from points model
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
