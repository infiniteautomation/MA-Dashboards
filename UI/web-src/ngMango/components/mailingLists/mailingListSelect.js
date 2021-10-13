/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import componentTemplate from './mailingListSelect.html';

/**
 * @ngdoc directive
 * @name ngMango.directive:maMailingListSelect
 * @restrict E
 * @description Displays a select drop down of Mailing Lists
 */

const $inject = Object.freeze(['$scope', 'maMailingList']);
class MailingListSelectController {
    static get $inject() { return $inject; }

    static get $$ngIsClass() { return true; }

    constructor($scope, maMailingList) {
        this.$scope = $scope;
        this.maMailingList = maMailingList;
    }

    $onInit() {
        this.ngModelCtrl.$render = () => this.render();
        this.getLists();
        this.newList();

        this.maMailingList.subscribe((event, item, attributes) => {
            if (!this.lists) return;

            const index = this.lists.findIndex((list) => list.id === attributes.itemId);
            if (index >= 0) {
                if (event.name === 'update' || event.name === 'create' || event.name === 'rtDataSaved') {
                    this.lists[index] = item;
                } else if (event.name === 'delete') {
                    this.lists.splice(index, 1);
                }
            } else if (event.name === 'update' || event.name === 'create' || event.name === 'rtDataSaved') {
                this.lists.push(item);
            }
        }, this.$scope, ['create', 'update', 'delete', 'rtDataSaved']);
    }

    $onChanges(changes) {
    }

    setViewValue() {
        this.ngModelCtrl.$setViewValue(this.selected);
    }

    render() {
        this.selected = this.ngModelCtrl.$viewValue;
    }

    getLists() {
        this.maMailingList.list().then(
            (lists) => {
                this.lists = lists;
            }
        );
    }

    newList() {
        this.new = true;
        this.selected = new this.maMailingList();
        this.setViewValue();
    }
}

export default {
    template: componentTemplate,
    controller: MailingListSelectController,
    bindings: {
        selectMultiple: '<?'
    },
    require: {
        ngModelCtrl: 'ngModel'
    },
    transclude: {
        labelSlot: '?maLabel'
    },
    designerInfo: {
        translation: 'ui.app.mailingLists.select',
        icon: 'list'
    }
};
