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

        this.pointsToPublish = new Map();
        this.pointsToPublishArr = [...this.pointsToPublish.values()];
    }

    $onChanges(changes) {
        if (changes.triggerDialog && changes.triggerDialog.currentValue) {
            this.showDialog = true;
        }
    }

    dialogHidden() {
        this.pointsToPublish = new Map();
        this.showDialog = false;
        this.dialog.hide();
    }

    dialogCancelled() {
        this.pointsToPublish = new Map();
        this.showDialog = false;
        this.dialog.hide();
    }

    getOrderBy(index) {
        // return this.tableBody[index];
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
        // this.reloadTable();
    }

    pointsChanged() {
        // ma-data-point-selector is not part of the form as it is in a drop down dialog, have to manually set the form dirty
        this.form.$setDirty();
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
