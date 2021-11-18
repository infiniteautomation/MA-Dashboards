/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';
import template from './publisherPointsTab.html';
import './publisherPointsTab.css';

const DEFAULT_COLUMNS = [
    { name: 'xid', label: 'ui.app.xidShort', selectedByDefault: true },
    { name: 'dataPointXid', label: 'ui.components.dataPointXid', selectedByDefault: true },
    { name: 'name', label: 'common.name', selectedByDefault: true, editable: true }
];

class PublisherPointsTabController {
    static get $$ngIsClass() {
        return true;
    }

    static get $inject() {
        return ['maPublisherPoints'];
    }

    constructor(maPublisherPoints) {
        this.PublisherPoints = maPublisherPoints;
    }

    $onChanges(changes) {
        if (changes.publisherInfo && changes.publisherInfo.currentValue) {
            const { publisher, type } = this.publisherInfo;
            this.publisher = publisher;
            this.publisherType = type;

            this.buildColumns(type);
        }
    }

    buildColumns(publisherType) {
        const builtColumns = (publisherType.pointProperties || []).map((props) => ({
            name: props.name,
            label: props.translationKey,
            selectedByDefault: true,
            editable: true,
            editorTemplateUrl: props.editorTemplateUrl,
            class: `ma-publisher-point-${props.name}`,
            sortable: false,
            filterable: false
        }));

        this.customColumns = [...DEFAULT_COLUMNS, ...builtColumns];
    }

    // TODO: Cancel query if pub xid is null
    customizeQuery(queryBuilder) {
        if (this.publisher) {
            queryBuilder.eq('publisherXid', this.publisher.xid);
        }
    }
}

export default {
    template,
    controller: PublisherPointsTabController,
    bindings: {
        publisherInfo: '<'
    }
};
