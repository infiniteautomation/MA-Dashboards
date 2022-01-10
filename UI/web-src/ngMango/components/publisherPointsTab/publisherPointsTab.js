/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';
import template from './publisherPointsTab.html';
import './publisherPointsTab.css';

const VALIDATION_MESSAGE_PROPERTY_MAP = {
    purgeType: 'purgePeriod.type',
    purgePeriod: 'purgePeriod.periods',
    name: 'common.name'
};

class PublisherPointsTabController {
    static get $$ngIsClass() {
        return true;
    }

    static get $inject() {
        return ['maPublisher', 'maPublisherPoints', 'maDialogHelper'];
    }

    constructor(maPublisher, maPublisherPoints, maDialogHelper) {
        this.maPublisher = maPublisher;
        this.PublisherPoints = maPublisherPoints;
        this.DialogHelper = maDialogHelper;

        this.pointsToRemove = [];
    }

    removePoints() {
        this.validationMessages = [];
        this.errorMessages = [];

        const requests = this.pointsToRemove.map((pPoint) => {
            const request = {
                xid: pPoint.getOriginalId() || pPoint.xid,
                body: pPoint
            };

            request.action = 'DELETE';

            return request;
        });

        if (requests.length <= 0) return null;

        this.bulkTask = new this.PublisherPoints.Bulk({
            action: null,
            requests
        });

        return this.bulkTask
            .start(this.$scope)
            .then(
                (resource) => {
                    this.saveMultipleComplete(resource, this.pointsToRemove);
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
                    this.errorMessages = [];
                    this.validationMessages = [];
                    this.pointsToRemove = [];
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
    template,
    controller: PublisherPointsTabController,
    bindings: {
        publisher: '<'
    }
};
