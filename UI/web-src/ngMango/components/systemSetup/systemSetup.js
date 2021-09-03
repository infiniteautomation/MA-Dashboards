/**
 * Copyright (C) 2021 RadixIot. All rights reserved.
 * @author Mert Cingöz
 */

import componentTemplate from './systemSetup.html';

class SystemSetupController {
    static get $$ngIsClass() {
        return true;
    }

    static get $inject() {
        return ['$state', '$window', 'maUser', 'maDialogHelper', 'maUtil', 'maLocales', '$filter'];
    }

    constructor($state, $window, maUser, maDialogHelper, maUtil, maLocales, $filter) {
        this.$state = $state;
        this.$window = $window;
        this.maUser = maUser;
        this.maDialogHelper = maDialogHelper;
        this.maUtil = maUtil;
        this.maLocales = maLocales;
        this.maFilter = $filter('maFilter');

        this.locales = {};
        this.maLocales.get().then((locales) => {
            locales.forEach((locale) => {
                locale.id = locale.id.replace('-', '_');
                this.locales[locale.id] = locale;
            });
        });

        this.settings = {
            language: null
        };
    }

    resetServerErrors() {
        this.serverErrors = {};
    }

    submit() {
        this.form.$setSubmitted();
        if (this.form.$invalid) return;

        this.disableButton = true;

        const user = this.maUser.current;
        this.maUser.systemSetup({
            password: this.password,
            systemSettings: this.settings
        }).$promise.then((user) => {
            if (typeof this.onSuccess === 'function') {
                this.onSuccess({ $user: user, $password: this.password, $settings: this.settings });
            } else {
                this.$window.location = this.$state.href('ui.settings.home', { helpOpen: true });
            }
        }, (error) => {
            this.disableButton = false;
            if (error.status === 422 && error.data && error.data.result && error.data.result.messages) {
                this.validationMessages = error.data.result.messages;
            } else {
                this.maDialogHelper.errorToast(['systemSetup.failedToSave', error.mangoStatusText]);
            }

            if (typeof this.onError === 'function') {
                this.onError({
                    $user: user,
                    $password: this.password,
                    $settings: this.settings,
                    $error: error
                });
            }
        });
    }

    regExpEscape(s) {
        if (!s) return null;
        return this.maUtil.escapeRegExp(s);
    }

    getLocales(filter) {
        return this.maLocales.get().then(
            (locales) => this.maFilter(locales, filter, ['name', 'native', 'common'])
        );
    }
}

export default {
    controller: SystemSetupController,
    template: componentTemplate,
    bindings: {
        onSuccess: '&?',
        onError: '&?'
    }
};
