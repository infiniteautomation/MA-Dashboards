/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import changePasswordTemplate from './changePassword.html';

class ChangePasswordController {
    static get $$ngIsClass() {
        return true;
    }

    static get $inject() {
        return ['maUser', 'maDialogHelper', 'maUtil', '$injector'];
    }

    constructor(maUser, maDialogHelper, maUtil, $injector) {
        this.maUser = maUser;
        this.maDialogHelper = maDialogHelper;
        this.maUtil = maUtil;
        this.$state = $injector.has('$state') && $injector.get('$state');
        this.$stateParams = $injector.has('$stateParams') && $injector.get('$stateParams');
        this.maUiLoginRedirector = $injector.has('maUiLoginRedirector') && $injector.get('maUiLoginRedirector');
    }

    $onInit() {
        if (this.$stateParams) {
            if (this.$stateParams.credentialsExpired) {
                this.credentialsExpired = true;
            }
            if (this.$stateParams.username) {
                this.username = this.$stateParams.username;
            }
            if (this.$stateParams.password) {
                this.password = this.$stateParams.password;
            }
        }
    }

    resetServerErrors() {
        delete this.serverError;
        this.form.newPassword.$setValidity('passwordChangeError', true);
        if (this.form.username) {
            this.form.username.$setValidity('badCredentials', true);
        }
        if (this.form.password) {
            this.form.password.$setValidity('badCredentials', true);
        }
    }

    changePassword() {
        this.form.$setSubmitted();
        if (this.form.$invalid) return;

        this.disableButton = true;
        this.maUser.login({
            username: this.username,
            password: this.password,
            newPassword: this.newPassword
        }).$promise.then((user) => {
            this.maDialogHelper.toastOptions({
                textTr: ['login.passwordChanged', this.username],
                hideDelay: 10000
            });

            if (typeof this.onSuccess === 'function') {
                this.onSuccess({ $user: this.user, $state: this.$state });
            } else if (this.maUiLoginRedirector) {
                this.maUiLoginRedirector.redirect(user);
            }
        }, (error) => {
            this.disableButton = false;

            this.serverError = error;

            if (error.status === 401 && error.data && error.data.mangoStatusName === 'PASSWORD_CHANGE_FAILED') {
                this.form.newPassword.$setValidity('passwordChangeError', false);
            } else if (error.status === 401 && error.data && error.data.mangoStatusName === 'BAD_CREDENTIALS') {
                if (this.form.username) {
                    this.form.username.$setValidity('badCredentials', false);
                }
                if (this.form.password) {
                    this.form.password.$setValidity('badCredentials', false);
                }
            } else {
                this.maDialogHelper.toastOptions({
                    textTr: ['login.errorChangingPassword', error.mangoStatusText],
                    hideDelay: 10000,
                    classes: 'md-warn'
                });
            }
            if (typeof this.onError === 'function') {
                this.onError({ $username: this.username, $error: error, $state: this.$state });
            }
        });
    }

    regExpEscape(s) {
        if (!s) return null;
        return this.maUtil.escapeRegExp(s);
    }
}

export default {
    controller: ChangePasswordController,
    template: changePasswordTemplate,
    bindings: {
        onSuccess: '&?',
        onError: '&?'
    },
    transclude: {
        links: '?a'
    }
};
