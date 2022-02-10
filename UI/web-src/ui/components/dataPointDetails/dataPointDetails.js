/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';
import dataPointDetailsTemplate from './dataPointDetails.html';
import './dataPointDetails.css';

class DataPointDetailsController {
    static get $$ngIsClass() { return true; }
    static get $inject() { return ['$stateParams', '$state', 'localStorageService', 'maUiDateBar', 'maUser', 'maPoint',
        '$scope', 'maEventDetector']; }
    
    constructor($stateParams, $state, localStorageService, maUiDateBar, User, Point,
            $scope, EventDetector) {
        this.$stateParams = $stateParams;
        this.$state = $state;
        this.localStorageService = localStorageService;
        this.dateBar = maUiDateBar;
        this.User = User;
        this.Point = Point;
        this.$scope = $scope;
        this.EventDetector = EventDetector;
        
        this.chartType = 'smoothedLine';
    }

    $onInit() {
        const $stateParams = this.$stateParams;
        
        if ($stateParams.detectorId) {
            this.getPointByDetectorId($stateParams.detectorId);
        } else if ($stateParams.detectorXid) {
            this.getPointByDetectorXid($stateParams.detectorXid);
        } else if ($stateParams.pointXid) {
            this.getPointByXid($stateParams.pointXid);
        } else if ($stateParams.pointId) {
            this.getPointById($stateParams.pointId);
        } else {
            // Attempt load pointXid from local storage
            const storedPoint = this.localStorageService.get('lastDataPointDetailsItem');
            if (storedPoint && storedPoint.xid) {
                this.getPointByXid(storedPoint.xid);
            }
        }
        
        this.retrievePreferences();

        this.deregister = this.Point.notificationManager.subscribe((event, point, attributes) => {
            if (this.dataPoint && this.dataPoint.id === attributes.itemId) {
                this.$scope.$apply(() => {
                    if (event.name === 'update' || event.name === 'stateChange') {
                        Object.assign(this.dataPoint, point);
                        this.pointUpdated();
                    } else if (event.name === 'delete') {
                        this.dataPoint = null;
                        this.pointChanged();
                    }
                });
            }
        });

        this.dateBar.subscribe(() => {
            if (!this.showCachedData) {
                this.refreshTable = {};
            }
        }, this.$scope);
    }

    $onDestroy() {
        this.deregister();
    }
    
    getPointByXid(xid) {
        return this.Point.get({xid}).$promise.then(dp => {
            if (this.$stateParams.edit) {
                this.editTarget = dp;
                this.showEditDialog = {};
            }
            this.dataPoint = dp;
            this.pointChanged();
        });
    }

    getPointById(id) {
        return this.Point.getById({id}).$promise.then(dp => {
            if (this.$stateParams.edit) {
                this.editTarget = dp;
                this.showEditDialog = {};
            }
            this.dataPoint = dp;
            this.pointChanged();
        });
    }
    
    getPointByDetectorId(id) {
        return this.EventDetector.getById(id).then(detector => {
            this.getPointById(detector.sourceId).then(() => {
                this.openDetectorDialog(detector);
            });
        });
    }
    
    getPointByDetectorXid(xid) {
        return this.EventDetector.get(xid).then(detector => {
            this.getPointById(detector.sourceId).then(() => {
                this.openDetectorDialog(detector);
            });
        });
    }

    pointChanged() {
        delete this.eventDetector;
        delete this.eventDetectors;
        delete this.pointValues;
        delete this.realtimePointValues;
        delete this.statsObj;
        
        if (!this.dataPoint) {
            this.$state.params.pointXid = null;
            this.stateGo();
            this.localStorageService.set('lastDataPointDetailsItem', {xid: null});
            return;
        }

        this.pointUpdated();
    }
    
    pointUpdated() {
        const xid = this.dataPoint.xid;

        this.$state.params.pointId = null;
        this.$state.params.pointXid = xid;
        this.stateGo();
        this.localStorageService.set('lastDataPointDetailsItem', {xid});

        const pointType = this.dataPoint.pointLocator.dataType;
        this.dateBar.rollupTypesFilter = pointType === 'NUMERIC' ? {} : { nonNumeric: true };

        this.chartType = this.dataPoint.amChartsGraphType();
    }

    updatePreferences() {
        const preferences = this.localStorageService.get('uiPreferences') || {};
        preferences.numberOfPointValues = this.numValues;
        preferences.showCachedData = this.showCachedData;
        this.localStorageService.set('uiPreferences', preferences);
    }
    
    retrievePreferences() {
        const defaults = {
            numberOfPointValues: 100,
            showCachedData: true
        };
        const preferences = angular.merge(defaults, this.localStorageService.get('uiPreferences'));
        this.numValues = preferences.numberOfPointValues;
        this.showCachedData = preferences.showCachedData;
    }
    
    openDetectorDialog(detector) {
        this.showDetectorDialog = {};
        this.eventDetector = detector || this.eventDetectors[0] || null;
        this.$state.params.detectorId = null;
        this.$state.params.detectorXid = this.eventDetector && this.eventDetector.getOriginalId() || null;
        this.stateGo();
    }
    
    detectorDialogClosed() {
        delete this.eventDetector;
        this.$state.params.detectorId = null;
        this.$state.params.detectorXid = null;
        this.stateGo();
    }
    
    openEditDialog(target) {
        this.editTarget = target;
        this.$state.params.edit = true;
        this.stateGo();
        this.showEditDialog = {};
    }
    
    editDialogClosed() {
        this.editTarget = null;
        this.$state.params.edit = null;
        this.stateGo();
    }
    
    detectorChanged() {
        this.$state.params.detectorId = null;
        this.$state.params.detectorXid = this.eventDetector && !this.eventDetector.isNew() && this.eventDetector.xid || null;
        this.stateGo();
    }
    
    stateGo() {
        this.$state.go('.', this.$state.params, {location: 'replace', notify: false});
    }
    
    hasEditPermission() {
        return this.dataPoint && this.User.current.hasPermission(this.dataPoint.editPermission);
    }
}

export default {
    controller: DataPointDetailsController,
    template: dataPointDetailsTemplate
};

