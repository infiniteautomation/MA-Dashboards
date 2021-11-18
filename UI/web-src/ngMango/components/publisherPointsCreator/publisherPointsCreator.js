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
        return [];
    }

    constructor() {
        this.pointsToPublish = new Map();
        // .then((points) => {
        //     this.publishedPointsCount = points.$total;
        //     console.log('points query', points);

        //     const publishedPointsArr = [...this.pointsToPublish.values()];
        //     if (publishedPointsArr.length > 0) {
        //         points.unshift(...publishedPointsArr);
        //         points.$total += publishedPointsArr.length;
        //     }
        //     return points;
        // });

        this.showDialog = false;
    }

    $onChanges(changes) {
        if (changes.triggerDialog && changes.triggerDialog.currentValue) {
            this.showDialog = true;
        }
    }

    dialogHidden() {
        // this.revertItem();
        this.showDialog = false;
        this.dialog.hide();
    }

    dialogCancelled() {
        // this.revertItem();
        this.showDialog = false;
        this.dialog.hide();
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
}

export default {
    template,
    controller: PublisherPointsCreatorController,
    bindings: {
        triggerDialog: '<'
    }
};
