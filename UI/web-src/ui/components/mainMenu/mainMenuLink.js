/*
 * Copyright (C) 2023 Radix IoT LLC. All rights reserved.
 */

import mainMenuLinkTemplate from './mainMenuLink.html';

MainMenuLinkController.$inject = ['$state', 'maTranslate'];
function MainMenuLinkController($state, Translate) {
    this.$onInit = function () {
        this.menuLevel = this.parentToggle ? this.parentToggle.menuLevel + 1 : 1;
        this.classes = [];
    };

    this.$onChanges = function (changes) {
        if (changes.item && this.item) {
            if (this.item.href) {
                this.href = this.item.href;
                this.target = this.item.target || '_self';
            } else {
                this.href = $state.href(this.item.name, { helpOpen: null });
                this.target = '_self';
            }

            if (this.item.menuText) {
                this.menuText = this.item.menuText;
            } else if (this.item.menuTr) {
                Translate.tr(this.item.menuTr).then((text) => {
                    this.menuText = text;
                });
            } else {
                this.menuText = this.item.name || '';
            }
        }
    };

    this.$doCheck = function () {
        this.menuActive = $state.includes(this.item.name);
    };

    this.followLink = function ($event) {
        // ignore if it was a middle click, i.e. new tab
        if ($event.which !== 2) {
            $event.preventDefault();
            $state.go(this.item.name, { sidebar: false });
        }
    };
}

export default {
    controller: MainMenuLinkController,
    template: mainMenuLinkTemplate,
    bindings: {
        item: '<menuItem'
    },
    require: {
        parentToggle: '?^^maMenuToggle'
    }
};
