/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';
import template from './publisherPointsCreator.html';
import './publisherPointsCreator.css';

class PublisherPointsCreatorController {
    static get $$ngIsClass() {
        return true;
    }

    static get $inject() {
        return ['maUtil'];
    }

    constructor(maUtil) {
        this.maUtil = maUtil;

        this.tableOptions = {
            limit: 15,
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
        }
    }
}

export default {
    template,
    controller: PublisherPointsCreatorController,
    bindings: {
        publisher: '<',
        triggerDialog: '<',
        columns: '<'
    }
};
