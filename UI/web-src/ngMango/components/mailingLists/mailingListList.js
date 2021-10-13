/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import componentTemplate from './mailingListList.html';

/**
 * @ngdoc directive
 * @name ngMango.directive:maMailingListList
 * @restrict E
 * @description Displays a list of Mailing lists
 */

const $inject = Object.freeze(['$scope', 'maMailingList', 'maDialogHelper']);
class MailingListsListController {
    static get $inject() { return $inject; }

    static get $$ngIsClass() { return true; }

    constructor($scope, maMailingList, maDialogHelper) {
        this.$scope = $scope;
        this.maMailingList = maMailingList;
        this.maDialogHelper = maDialogHelper;
    }

    $onInit() {
        this.ngModelCtrl.$render = () => this.render();
        this.getLists();

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

            this.new = true;
        }, this.$scope, ['create', 'update', 'delete', 'rtDataSaved']);
    }

    $onChanges(changes) {
    }

    setViewValue() {
        this.ngModelCtrl.$setViewValue(this.selectedList);
    }

    render() {
        this.selectedList = this.ngModelCtrl.$viewValue;
    }

    newList() {
        this.new = true;
        this.selectedList = new this.maMailingList();
        this.setViewValue();
    }

    selectList(list) {
        this.new = false;
        this.selectedList = list;
        this.setViewValue();
    }

    getLists() {
        this.maMailingList.list().then(
            (lists) => {
                this.lists = lists;
                this.newList();
            }
        );
    }
}

export default {
    template: componentTemplate,
    controller: MailingListsListController,
    bindings: {},
    require: {
        ngModelCtrl: 'ngModel'
    },
    designerInfo: {
        translation: 'globalScript.list',
        icon: 'list'
    }
};
