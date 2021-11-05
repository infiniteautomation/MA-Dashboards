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

class PublisherEditorController {
    static get $$ngIsClass() {
        return true;
    }

    static get $inject() {
        return ['maPublisher', '$q', 'maDialogHelper', '$scope', '$window', 'maTranslate', '$attrs', '$parse', 'maEvents', 'maPoint', 'maUtil'];
    }

    constructor (maPublisher, $q, maDialogHelper, $scope, $window, maTranslate, $attrs, $parse, Events, maPoint, maUtil) {
        this.maPublisher = maPublisher;
        this.$q = $q;
        this.maDialogHelper = maDialogHelper;
        this.$scope = $scope;
        this.$window = $window;
        this.maTranslate = maTranslate;
        this.maUtil = maUtil;
        this.maPoint = maPoint;

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

    $onChanges(changes) { }

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
                this.publishedPoints = points;
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
