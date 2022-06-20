/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import userEditorTemplate from './userEditor.html';
import './userEditor.css';
import moment from 'moment-timezone';
import angular from "angular";

class UserEditorController {
    static get $$ngIsClass() { return true; }
    static get $inject() { return ['maUser', '$http', '$mdDialog', 'maTranslate', 'maLocales', '$window', '$injector',
        'maDialogHelper', '$scope', '$filter', 'maUtil', 'maMultipleValues']; }
    
    constructor(User, $http, $mdDialog, Translate, maLocales, $window, $injector,
                maDialogHelper, $scope, $filter, maUtil, maMultipleValues) {

        this.User = User;
        this.$http = $http;
        this.timezones = moment.tz.names();
        this.$mdDialog = $mdDialog;
        this.Translate = Translate;
        this.maLocales = maLocales;
        this.$window = $window;
        this.$state = $injector.has('$state') && $injector.get('$state');
        this.maDialogHelper = maDialogHelper;
        this.$scope = $scope;
        this.maUtil = maUtil;
        this.maMultipleValues = maMultipleValues;

        this.maFilter = $filter('maFilter');
        this.formName = '';
        this.showStatus = true;

        this.locales = {};
        this.maLocales.get().then(locales => {
            for (const locale of locales) {
                this.locales[locale.id] = locale;
            }
        });
        this.phonePattern = /^(?:\+?\d{1,3}[ -]?)?(?:\([\d ]+\)[ -]?)?\d+(?:[ -]\d+)*$/;
        this.homeUrlPattern = /^\/(?!\/).*/;
    }

    $onInit() {
        this.ngModelCtrl.$render = () => this.render();
    }

    $onChanges(changes) {
        if (changes.disabledAttr) {
            this.setDisabled();
        }
    }

    setViewValue(viewValue = this.user) {
        this.ngModelCtrl.$setViewValue(viewValue);
    }

    render() {
        this.resetForm();
        const viewValue = this.ngModelCtrl.$viewValue;
        this.users = [];

        if (this.registerMode) {
            this.user = viewValue;
        } else {
            if (Array.isArray(viewValue) && viewValue.length) {
                this.users = viewValue;
                this.user = this.maMultipleValues.fromArray(this.users);
            } else {
                this.user = viewValue instanceof this.User ? viewValue.copy() : null;
            }
        }

        // easy to use reference to the original user, so we can access its permissions
        this.original = viewValue;
        this.setDisabled();

        // autofill organization input based on the organization of the creating user
        if (this.user && this.user.isNew() && this.User.current) {
            this.user.organization = this.User.current.organization;
        }

        this.fixRolesInput();
    }

    resetForm() {
        this.password = '';
        this.confirmPassword = '';

        delete this.validationMessages;

        if (this.userForm) {
            this.userForm.$setPristine();
            this.userForm.$setUntouched();
        }
    }

    save() {
        this.maMultipleValues.checkFormValidity(this.userForm);

        this.userForm.$setSubmitted();
        if (!this.userForm.$valid) {
            this.maDialogHelper.errorToast('ui.components.fixErrorsOnForm');
            return;
        }

        this.saving = true;
        this.errorMessages = [];
        this.validationMessages = [];

        if (this.user.originalId instanceof this.maMultipleValues) {
            this.saveMultiple().then(() => {
                delete this.saving;
            });
            return;
        }

        this.user.save().then(user => {
            this.maDialogHelper.toast(['ui.components.userSaved', user.username]);
            this.ngModelCtrl.$setViewValue(user.copy());
        }, error => {
            if (error.status === 422 && error.data && error.data.result && error.data.result.messages) {
                this.validationMessages = error.data.result.messages;
            }

            this.maDialogHelper.errorToast(['ui.components.errorSavingUser', this.user.originalId || '-',
                error.mangoStatusText]);
        }).finally(() => delete this.saving);
    }

    saveMultiple() {
        const newUsers = this.maMultipleValues.toArray(this.user, this.users.length);
        this.bulkTask = new this.User.bulk({
            action: 'UPDATE',
            requests: newUsers.map(u => ({
                username: u.originalId,
                body: u
            }))
        });

        return this.bulkTask.start(this.$scope).then(resource => {
            this.saveMultipleComplete(resource, newUsers);
        }, error => {
            this.notifyBulkEditError(error);
        }, resource => {
            // progress
        }).finally(() => {
            delete this.bulkTask;
        });
    }

    saveMultipleComplete(resource, savedUsers) {
        const hasError = resource.result.hasError;
        const responses = resource.result.responses;

        responses.forEach((response, i) => {
            const user = savedUsers[i];
            if (response.body && response.action === 'UPDATE') {
                angular.copy(response.body, user);
            }
        });

        if (hasError) {
            const validationMessages = [];

            responses.forEach((response, i) => {
                const message = response.error && response.error.localizedMessage;
                if (message && !this.errorMessages.includes(message)) {
                    this.errorMessages.push(message);
                }

                if (response.httpStatus === 422) {
                    const messages = response.error.result.messages;
                    messages.forEach(m => {
                        const validationMessage = `${m.level}: ${m.message}`;
                        if (!m.property && !this.errorMessages.includes(validationMessage)) {
                            this.errorMessages.push(validationMessage);
                        }

                        const found = validationMessages.find(m2 => {
                            return m.level === m2.level && m.property === m2.property && m.message === m2.message;
                        });

                        if (!found) {
                            validationMessages.push(m);
                        }
                    });
                }
            });
            this.validationMessages = validationMessages;
        } else {
            this.setViewValue(savedUsers);
            this.render();
        }

        this.notifyBulkEditComplete(resource);
    }

    notifyBulkEditComplete(resource) {
        const numErrors = resource.result.responses.reduce((accum, response) => response.error ? accum + 1 : accum, 0);

        const toastOptions = {
            textTr: [null, resource.position, resource.maximum, numErrors],
            hideDelay: 10000,
            classes: 'md-warn'
        };

        switch (resource.status) {
            case 'CANCELLED':
                toastOptions.textTr[0] = 'ui.app.userBulkEditCancelled';
                break;
            case 'TIMED_OUT':
                toastOptions.textTr[0] = 'ui.app.userBulkEditTimedOut';
                break;
            case 'ERROR':
                toastOptions.textTr[0] = 'ui.app.userBulkEditError';
                toastOptions.textTr.push(resource.error.localizedMessage);
                break;
            case 'SUCCESS':
                if (!numErrors) {
                    toastOptions.textTr = ['ui.app.userBulkEditSuccess', resource.position];
                    delete toastOptions.classes;
                } else {
                    toastOptions.textTr[0] = 'ui.app.userBulkEditSuccessWithErrors';
                }
                break;
        }

        this.maDialogHelper.toastOptions(toastOptions);
    }

    notifyBulkEditError(error) {
        this.maDialogHelper.toastOptions({
            textTr: ['ui.app.errorStartingBulkEdit', error.mangoStatusText],
            hideDelay: 10000,
            classes: 'md-warn'
        });
    }

    revert() {
        this.render();
    }

    remove(event) {
        this.deleting = true;

        const confirm = this.$mdDialog.confirm()
            .title(this.Translate.trSync('ui.app.areYouSure'))
            .textContent(this.Translate.trSync('ui.components.confirmDeleteUser'))
            .ariaLabel(this.Translate.trSync('ui.app.areYouSure'))
            .targetEvent(event)
            .ok(this.Translate.trSync('common.ok'))
            .cancel(this.Translate.trSync('common.cancel'))
            .multiple(true);

        this.$mdDialog.show(confirm).then(() => {
            const username = this.user.username;
            this.user.$delete().then(user => {
                this.user = null;
                this.resetForm();
                this.maDialogHelper.toast(['ui.components.userDeleted', username]);
                this.ngModelCtrl.$setViewValue(null);
            }, error => {
                this.maDialogHelper.errorToast(['ui.components.errorDeletingUser', username, error.mangoStatusText]);
            });
        }).catch(e => null).finally(() => delete this.deleting);
    }

    regExpEscape(s) {
        if (!s) return;
        return this.maUtil.escapeRegExp(s);
    }

    passwordChanged() {
        if (this.password && this.password === this.confirmPassword) {
            this.user.password = this.password;
        } else {
            delete this.user.password;
        }
    }

    getLocales(filter) {
        return this.maLocales.get().then(locales => {
            return this.maFilter(locales, filter, ['name', 'native', 'common']);
        });
    }

    showPermissionInputs() {
        if (this.registerMode || !this.original) {
            return false;
        }
        return this.hasPermission();
    }

    setDisabled() {
        if (this.registerMode || !this.original) {
            this.disabled = this.disabledAttr;
            return;
        }
        this.disabled = this.disabledAttr || !this.hasPermission();
    }

    hasPermission() {
        if (this.users && this.users.length) {
            return true;
        }

        const currentUser = this.User.current;
        if (this.original.isNew()) {
            return currentUser.hasSystemPermission('users.create');
        }

        return this.hasEditPermission();
    }

    hasEditPermission() {
        if (this.users && this.users.length) {
            return true;
        }

        if (!this.original) return false;

        const currentUser = this.User.current;
        let result = currentUser.hasPermission(this.original.editPermission);
        if (currentUser.id === this.original.id) {
            result = result || currentUser.hasSystemPermission('permissions.user.editSelf');
        }
        return result;
    }

    isSelfUser() {
        if (!this.user) return false;
        if (this.user.originalId instanceof this.maMultipleValues) {
            return this.user.originalId.has(this.User.current.username);
        }
        return this.user.originalId === this.User.current.username;
    }

    fixRolesInput() {
        if (!this.user) return;

        let userRoles = [];
        if (this.user.roles.some(r => r instanceof this.maMultipleValues)) {
            this.allRoles = new Set();
            this.user.roles.forEach(multipleRoles => {
                const isMultiple = multipleRoles instanceof this.maMultipleValues
                const rolePerUser = isMultiple ? multipleRoles.values : Array(this.users.length).fill(multipleRoles);
                rolePerUser.forEach((role, userIndex) => {
                    userRoles[userIndex] = userRoles[userIndex] || [];
                    userRoles[userIndex].push(role);
                    this.allRoles.add(role);
                });
            });
            this.allRoles = [...this.allRoles];
        } else {
            userRoles = [this.user.roles];
            this.allRoles = [...this.user.roles];
        }

        this.roleSet = [];
        userRoles.forEach(roles => {
            if (this.roleSet.every(r => !this.rolesEqual(r, roles))) {
                this.roleSet.push(roles);
            }
        });

        this.selectedRoles = this.allRoles;
    }

    rolesEqual(a, b) {
        if (a.length !== b.length) return false;
        a.sort();
        b.sort();
        return a.every((val, index) => val === b[index]);
    }

    formatRoles() {
        if (!this.user) return;
        if (this.roleSet.length > 1) {
            return `<<multiple values (${this.roleSet.length})>>`;
        }
        return this.user.formatRoles();
    }

    rolesChanged() {
        if (!this.users.length) {
            this.user.roles = this.selectedRoles;
        } else {
            const diff = this.maUtil.arrayDiff(this.selectedRoles, this.allRoles);
            this.users.forEach(u => {
                diff.added.filter(r => !u.roles.includes(r)).forEach(r => u.roles.push(r));
                u.roles = u.roles.filter(r => !diff.removed.includes(r));
            });
            this.user.roles = this.maMultipleValues.fromArray(this.users.map(u => u.roles));
        }
        this.fixRolesInput();
    }

    sessionExpirationOverrideChanged() {
        if (!this.user.sessionExpirationOverride) return;

        if (this.user.sessionExpirationPeriod instanceof this.maMultipleValues) {
            const periods = this.user.sessionExpirationPeriod.periods.values;
            const types = this.user.sessionExpirationPeriod.type.values;

            this.user.sessionExpirationPeriod.periods.valuesSet = new Set();
            this.user.sessionExpirationPeriod.type.valuesSet = new Set();
            for (let i = 0; i < periods.length; i++) {
                if (periods[i] === undefined || types[i] === undefined) {
                    periods[i] = 1;
                    types[i] = 'DAYS';
                }
                this.user.sessionExpirationPeriod.periods.valuesSet.add(periods[i]);
                this.user.sessionExpirationPeriod.type.valuesSet.add(types[i]);
            }
        } else {
            const expiration = this.user.sessionExpirationPeriod;
            if (!expiration || expiration.type === undefined || expiration.periods === undefined) {
                this.user.sessionExpirationPeriod = {
                    periods: 1,
                    type: 'DAYS'
                };
            }
        }
    }
}

export default {
    controller: UserEditorController,
    template: userEditorTemplate,
    bindings: {
        disabledAttr: '@?disabled',
        registerMode: '<?',
        showStatus: '<?',
        formName: '@?name',
        profileMode: '<?'
    },
    require: {
        ngModelCtrl: 'ngModel'
    }
};
