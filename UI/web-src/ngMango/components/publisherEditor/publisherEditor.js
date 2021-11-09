/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';
import publisherEditorTemplate from './publisherEditor.html';
import './publisherEditor.css';

/**
 * @ngdoc directive
 * @name ngMango.directive:maPublisherEditor
 * @restrict E
 * @description Editor for a publisher, allows creating, updating or deleting
 */

/**
 * Stores a map of validation property keys that come back from the API and what they actually map to in the model.
 */
const VALIDATION_MESSAGE_PROPERTY_MAP = {
    purgeType: 'purgePeriod.type',
    purgePeriod: 'purgePeriod.periods'
};
class PublisherEditorController {
    static get $$ngIsClass() {
        return true;
    }

    static get $inject() {
        return [
            'maPublisher',
            '$q',
            'maDialogHelper',
            '$scope',
            '$window',
            'maTranslate',
            '$attrs',
            '$parse',
            'maEvents',
            'maPoint',
            'maUtil',
            'maPublisherPoints',
            'maDialogHelper'
        ];
    }

    constructor(
        maPublisher,
        $q,
        maDialogHelper,
        $scope,
        $window,
        maTranslate,
        $attrs,
        $parse,
        Events,
        maPoint,
        maUtil,
        PublisherPoints,
        DialogHelper
    ) {
        this.maPublisher = maPublisher;
        this.$q = $q;
        this.maDialogHelper = maDialogHelper;
        this.$scope = $scope;
        this.$window = $window;
        this.maTranslate = maTranslate;
        this.maUtil = maUtil;
        this.maPoint = maPoint;
        this.PublisherPoints = PublisherPoints;
        this.DialogHelper = DialogHelper;

        this.eventLevels = Events.levels;
        this.publishTypeCodes = maPublisher.publishTypeCodes;
        this.publisherTypes = maPublisher.types;
        this.publisherTypesByName = maPublisher.typesByName;

        this.dynamicHeight = true;
        if ($attrs.hasOwnProperty('dynamicHeight')) {
            this.dynamicHeight = $parse($attrs.dynamicHeight)($scope.$parent);
        }

        this.pointsToPublish = [];
        this.publishedPoints = [];
        this.points = new WeakMap();
    }

    $onInit() {
        this.ngModelCtrl.$render = () => this.render(true);

        this.$scope.$on('$stateChangeStart', (event, toState, toParams, fromState, fromParams) => {
            if (event.defaultPrevented) return;

            if (!this.confirmDiscard('stateChange')) {
                event.preventDefault();
            }
        });

        const oldUnload = this.$window.onbeforeunload;
        this.$window.onbeforeunload = (event) => {
            if (this.form && this.form.$dirty && this.checkDiscardOption('windowUnload')) {
                const text = this.maTranslate.trSync('ui.app.discardUnsavedChanges');
                event.returnValue = text;
                return text;
            }
        };

        this.$scope.$on('$destroy', () => {
            this.$window.onbeforeunload = oldUnload;
        });
    }

    $onChanges(changes) {}

    render(confirmDiscard = false) {
        if (confirmDiscard && !this.confirmDiscard('modelChange')) {
            this.setViewValue();
            return;
        }

        this.validationMessages = [];

        const viewValue = this.ngModelCtrl.$viewValue;
        if (viewValue) {
            if (viewValue instanceof this.maPublisher) {
                this.publisher = viewValue.copy();
            } else {
                this.publisher = new this.maPublisher(viewValue);
            }
            this.publisherType = this.publisherTypesByName[this.publisher.modelType];
        } else {
            this.publisher = null;
            this.publisherType = null;
        }

        // If publisher is new do not requery points table
        if (this.publisher && !this.publisher.isNew()) {
            this.refreshTable = {};
        }

        if (this.publisher && this.publisher.isNew()) {
            this.activeTab = 0;
        }

        if (this.form) {
            this.form.$setPristine();
            this.form.$setUntouched();
        }
    }

    setViewValue() {
        this.ngModelCtrl.$setViewValue(this.publisher);
    }

    saveItem(event) {
        this.form.$setSubmitted();

        // allow resubmitting a form with validationMessage errors by setting them all back to valid
        this.form.setValidationMessageValidity(true);

        if (!this.form.$valid) {
            this.form.activateTabWithClientError();
            this.maDialogHelper.errorToast('ui.components.fixErrorsOnForm');
            return;
        }

        this.validationMessages = [];

        this.savePoints(event);

        this.publisher.save().then(
            (item) => {
                this.setViewValue();
                this.render();
                this.maDialogHelper.toast(['ui.publisher.saved', this.publisher.name || this.publisher.xid]);
            },
            (error) => {
                let statusText = error.mangoStatusText;

                if (error.status === 422) {
                    statusText = error.mangoStatusTextShort;
                    this.validationMessages = error.data.result.messages;
                }

                this.maDialogHelper.errorToast(['ui.publisher.saveError', statusText]);
            }
        );
    }

    revertItem(event) {
        if (this.confirmDiscard('revert')) {
            this.render();
        }
    }

    deleteItem(event) {
        const notifyName = this.publisher.name || this.publisher.getOriginalId();
        this.maDialogHelper.confirm(event, ['ui.publisher.confirmDelete', notifyName]).then(() => {
            this.publisher.delete().then(
                () => {
                    this.maDialogHelper.toast(['ui.publisher.deleted', notifyName]);
                    this.publisher = null;
                    this.setViewValue();
                    this.render();
                },
                (error) => {
                    this.maDialogHelper.errorToast(['ui.publisher.deleteError', notifyName, error.mangoStatusText || `${error}`]);
                }
            );
        }, angular.noop);
    }

    checkDiscardOption(type) {
        return this.discardOptions === true || (this.discardOptions && this.discardOptions[type]);
    }

    confirmDiscard(type) {
        if (this.form && this.form.$dirty && this.checkDiscardOption(type)) {
            return this.$window.confirm(this.maTranslate.trSync('ui.app.discardUnsavedChanges'));
        }
        return true;
    }

    typeChanged() {
        this.publisher = this.publisher.changeType();
        this.publisherType = this.publisherTypesByName[this.publisher.modelType];
    }

    getPoints(queryBuilder, opts) {
        return queryBuilder.query(opts).then((points) => {
            console.log(points);
            if (this.publisher) {
                this.publishedPoints = [...points];
                this.publishedPoints.$total = points.$total;
            }
            if (this.pointsToPublish.length > 0) {
                points.unshift(...this.pointsToPublish);
                points.$total += this.pointsToPublish.length;
            }
            return points;
        });
    }

    editPointQuery(queryBuilder) {
        if (this.publisher) {
            queryBuilder.eq('publisherXid', this.publisher.xid);
        }
    }

    pointsToPublisherPoints(points) {
        if (Array.isArray(points)) {
            // map of XID to existing publisher points
            const xidToPublisherPoint = this.maUtil.createMapObject(this.pointsToPublish, 'dataPointXid');

            this.pointsToPublish = points.map((point) => {
                let publisherPoint = xidToPublisherPoint[point.xid];
                if (!publisherPoint) {
                    publisherPoint = this.publisher.createPublisherPoint(point);
                }
                this.points.set(point, publisherPoint);
                return publisherPoint;
            });

            return this.pointsToPublish;
        }
    }

    pointsChanged() {
        console.log(this.pointsToPublish);
        this.refreshTable = {};
        // ma-data-point-selector is not part of the form as it is in a drop down dialog, have to manually set the form dirty
        this.form.$setDirty();
    }

    savePoints(event) {
        console.log('pointsToPublish', this.pointsToPublish);

        const allPointsToPublish = [...this.pointsToPublish];

        const requests = allPointsToPublish.map((pPoint) => {
            const request = {
                xid: pPoint.originalId,
                body: pPoint
            };

            request.action = pPoint.action || pPoint.isNew() ? 'CREATE' : 'UPDATE';

            return request;
        });

        console.log('requests', requests);

        if (requests.length <= 0) return null;

        this.bulkTask = new this.PublisherPoints.Bulk({
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
                        const validationMessage = `${m.level}: ${m.message}`;
                        if (!m.property && !this.errorMessages.includes(validationMessage)) {
                            this.errorMessages.push(validationMessage);
                        }

                        const found = validationMessages.find((m2) => m.level === m2.level && m.property === m2.property && m.message === m2.message);

                        if (!found) {
                            validationMessages.push(m);
                        }
                    });
                }
            });
            this.validationMessages = this.fixValidationMessages(validationMessages);
        } else {
            this.pointsToPublish = [];
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
    template: publisherEditorTemplate,
    controller: PublisherEditorController,
    bindings: {
        discardOptions: '<?confirmDiscard'
    },
    require: {
        ngModelCtrl: 'ngModel'
    },
    designerInfo: {
        translation: 'ui.components.publisherEditor',
        icon: 'assignment_turned_in'
    }
};
