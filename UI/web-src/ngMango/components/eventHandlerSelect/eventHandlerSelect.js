/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import eventHandlerSelectTemplate from './eventHandlerSelect.html';

/**
 * @ngdoc directive
 * @name ngMango.directive:maEventHandlerSelect
 * @restrict E
 * @description Displays a drop down select of event handlers
 */

class EventHandlerSelectController {
    static get $$ngIsClass() { return true; }
    static get $inject() { return ['maEventHandler', '$scope']; }

    constructor(maEventHandler, $scope) {
        this.maEventHandler = maEventHandler;
        this.$scope = $scope;

        this.newValue = {};
    }

    $onInit() {
        this.ngModelCtrl.$render = () => this.render();

        this.doQuery();

        this.maEventHandler.subscribe({
            scope: this.$scope,
            handler: (event, item, attributes) => {
                attributes.updateArray(this.eventHandlers, (eh) => {
                    if (!this.eventType) return true;
                    const found = eh || this.eventHandlers.find((i) => i.id === attributes.itemId);
                    if (found) return found.hasEventType(this.eventType.typeId);
                    return false;
                });
            }
        });
    }

    $onChanges(changes) {
        if (changes.eventType && !changes.eventType.isFirstChange()) {
            this.doQuery();
        }
    }

    doQuery() {
        const queryBuilder = this.maEventHandler.buildQuery(); // TODO this is a unbounded query
        return queryBuilder.query().then((eventHandlers) => {
            if (this.eventType) {
                const eventTypeId = this.eventType.typeId;
                this.eventHandlers = eventHandlers.filter((eh) => eh.hasEventType(eventTypeId));
            } else {
                this.eventHandlers = eventHandlers;
            }
            return this.eventHandlers;
        });
    }

    setViewValue() {
        this.ngModelCtrl.$setViewValue(this.selected);
    }

    render() {
        this.selected = this.ngModelCtrl.$viewValue;
    }

    selectEventHandler() {
        if (this.selected === this.newValue) {
            this.selected = this.maEventHandler.create('EMAIL');
            if (this.eventType) {
                this.selected.addEventType(this.eventType);
            }
        }
        this.setViewValue();
    }
}

export default {
    template: eventHandlerSelectTemplate,
    controller: EventHandlerSelectController,
    transclude: {
        labelSlot: '?maLabel'
    },
    bindings: {
        eventType: '<?',
        showNewOption: '<?'
    },
    require: {
        ngModelCtrl: 'ngModel'
    },
    designerInfo: {
        translation: 'ui.components.eventHandlerSelect',
        icon: 'link'
    }
};
