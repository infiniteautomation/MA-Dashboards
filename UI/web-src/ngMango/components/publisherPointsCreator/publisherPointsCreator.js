/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';
import template from './publisherPointsCreator.html';
import './publisherPointsCreator.css';

const VALIDATION_MESSAGE_PROPERTY_MAP = {
    // Mapped to xid so It can pick up the full table length
    dataPointId: 'xid',
    id: 'xid'
};
class PublisherPointsCreatorController {
    static get $$ngIsClass() {
        return true;
    }

    static get $inject() {
        return ['maUtil', 'maPublisherPoints', 'maDialogHelper'];
    }

    constructor(maUtil, maPublisherPoints, maDialogHelper) {
        this.maUtil = maUtil;
        this.PublisherPoints = maPublisherPoints;
        this.DialogHelper = maDialogHelper;

        this.tableOptions = {
            limit: 5,
            page: 1,
            total: 0
        };

        this.showDialog = false;

        this.clearDialog();
    }

    $onChanges(changes) {
        if (changes.triggerDialog && changes.triggerDialog.currentValue) {
            this.showDialog = true;
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

        console.log('requests', requests);

        if (requests.length <= 0) return null;

        this.bulkTask = new this.PublisherPoints.Bulk({
            action: null,
            requests
        });

        // TODO: Wire up clean up with errors or not on save
        return this.bulkTask
            .start(this.$scope)
            .then(
                (resource) => {
                    this.saveMultipleComplete(resource, this.pointsToPublish);
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
                    this.refreshTable();
                    this.dialogCancelled();
                    this.errorMessages = [];
                    this.validationMessages = [];
                } else {
                    toastOptions.textTr[0] = 'ui.app.bulkEditSuccessWithErrors';
                    this.pruneValidItems();
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

    pruneValidItems() {
        console.log(this.form);
        console.log(this.validationMessages);
    }
}

export default {
    template,
    controller: PublisherPointsCreatorController,
    bindings: {
        publisher: '<',
        triggerDialog: '<',
        columns: '<',
        refreshTable: '&'
    }
};
