/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import eventHandlerListTemplate from './eventHandlerList.html';

/**
 * @ngdoc directive
 * @name ngMango.directive:maEventHandlerList
 * @restrict E
 * @description Displays a list of event handlers
 */

class EventHandlerListController {
    static get $$ngIsClass() { return true; }
    static get $inject() { return ['maEventHandler', '$scope']; }

    constructor(maEventHandler, $scope) {
        this.maEventHandler = maEventHandler;
        this.$scope = $scope;
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

    selectEventHandler(eventHandler) {
        if (this.selected === eventHandler) {
            // create a shallow copy if this eventHandler is already selected
            // causes the model to update
            this.selected = Object.assign(Object.create(this.maEventHandler.prototype), eventHandler);
        } else {
            this.selected = eventHandler;
        }

        this.setViewValue();
    }

    newEventHandler(event) {
        this.selected = this.maEventHandler.create('EMAIL');
        if (this.eventType) {
            this.selected.addEventType(this.eventType);
        }
        this.setViewValue();
    }
}

export default {
    template: eventHandlerListTemplate,
    controller: EventHandlerListController,
    bindings: {
        eventType: '<?'
    },
    require: {
        ngModelCtrl: 'ngModel'
    },
    designerInfo: {
        translation: 'ui.components.eventHandlerList',
        icon: 'assignment_turned_in'
    }
};
