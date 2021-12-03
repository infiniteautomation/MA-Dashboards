/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import publisherPageTemplate from './publisherPage.html';

class PublisherPageController {
    static get $$ngIsClass() {
        return true;
    }

    static get $inject() {
        return ['maPublisher', '$state', '$mdMedia'];
    }

    constructor(maPublisher, $state, $mdMedia) {
        this.maPublisher = maPublisher;
        this.$state = $state;
        this.$mdMedia = $mdMedia;
    }

    $onInit() {
        if (this.$state.params.xid && this.$state.params.xid !== '') {
            this.getPublisher();
        } else {
            this.newPublisher();
        }
    }

    newPublisher() {
        this.publisher = new this.maPublisher();
        this.publisherChanged(false);
    }

    publisherSaved() {
        if (this.publisher == null) {
            // user deleted the publisher
            this.publisher = new this.maPublisher();
        }

        // always update the state params, xids can change
        this.publisherChanged();
    }

    publisherChanged(setState = true) {
        this.$state.params.xid = (this.publisher && this.publisher.getOriginalId()) || null;
        this.$state.go('.', this.$state.params, { location: 'replace', notify: false });
        if (setState && !this.publisher.isNew()) {
            this.getPublisher();
        }
    }

    getPublisher() {
        this.maPublisher.get(this.$state.params.xid).then(
            (item) => {
                this.publisher = item;
            },
            (error) => {
                this.newPublisher();
            }
        );
    }
}

export default {
    template: publisherPageTemplate,
    controller: PublisherPageController,
    bindings: {},
    require: {}
};
