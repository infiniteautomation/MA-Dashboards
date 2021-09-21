/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import userEditorTemplate from './userEditor.html';
import './userEditor.css';
import moment from 'moment-timezone';

class UserEditorController {
    static get $$ngIsClass() { return true; }
    static get $inject() { return ['maUser', '$http', '$mdDialog', 'maTranslate', 'maLocales', '$window', '$injector',
        'maDialogHelper', '$scope', '$filter', 'maUtil']; }
    
    constructor(User, $http, $mdDialog, Translate, maLocales, $window, $injector,
                maDialogHelper, $scope, $filter, maUtil) {

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

        this.maFilter = $filter('maFilter');
        this.formName = '';
        this.showStatus = true;

        this.locales = {};
        this.maLocales.get().then(locales => {
            for (const locale of locales) {
                this.locales[locale.id] = locale;
            }
        });
    }

    $onInit() {
        this.ngModelCtrl.$render = () => this.render();
    }

    $onChanges(changes) {
        if (changes.disabledAttr) {
            this.setDisabled();
        }
    }

    setDisabled() {
        if (this.registerMode || !this.original) {
            this.disabled = this.disabledAttr;
            return;
        }

        const currentUser = this.User.current;
        let hasPermission = false;
        if (this.original.isNew()) {
            hasPermission = currentUser.hasSystemPermission('users.create');
        } else {
            hasPermission = currentUser.hasPermission(this.user.editPermission);
            if (currentUser.id === this.original.id) {
                hasPermission = hasPermission || currentUser.hasSystemPermission('permissions.user.editSelf');
            }
        }
        this.disabled = this.disabledAttr || !hasPermission;
    }

    render() {
        this.resetForm();
        const viewValue = this.ngModelCtrl.$viewValue;
        if (this.registerMode) {
            this.user = viewValue;
        } else {
            this.user = viewValue instanceof this.User ? viewValue.copy() : null;
        }

        // easy to use reference to the original user so we can access its permissions
        this.original = viewValue;
        this.setDisabled();
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
        this.userForm.$setSubmitted();
        if (!this.userForm.$valid) {
            this.maDialogHelper.errorToast('ui.components.fixErrorsOnForm');
            return;
        }

        this.saving = true;
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
        if (this.user == null || this.registerMode) {
            return false;
        }
        if (this.user.isNew()) {
            return this.User.current.hasSystemPermission('users.create');
        }
        return this.User.current.hasPermission(this.original.editPermission);
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
