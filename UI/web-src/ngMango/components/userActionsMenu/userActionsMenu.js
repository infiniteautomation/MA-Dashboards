/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import componentTemplate from './userActionsMenu.html';

class UserActionsMenuController {
    static get $$ngIsClass() { return true; }

    static get $inject() {
        return ['maUser', '$injector', 'maDialogHelper', '$window'];
    }

    constructor(User, $injector, maDialogHelper, $window) {
        this.User = User;
        this.maDialogHelper = maDialogHelper;
        this.$window = $window;
        this.$state = $injector.has('$state') && $injector.get('$state');
    }

    $onInit() {
        const currentUser = this.User.current;
        this.isSuperAdmin = currentUser.hasRole('superadmin');
        this.isCurrentUser = this.user.id === currentUser.id;
        this.hasEditPermission = currentUser.hasPermission(this.user.editPermission);
        if (this.isCurrentUser) {
            this.hasEditPermission = this.hasEditPermission || currentUser.hasSystemPermission('permissions.user.editSelf');
        }
    }

    switchUser(event) {
        const username = this.user.username;
        this.switchingUser = true;
        this.User.switchUser({username}).$promise.then(response => {
            this.maDialogHelper.toast(['ui.components.switchedUser', username]);

            if (this.$state) {
                // reload the resolves and views of this state and its parents
                this.$state.go('.', null, {reload: true});
            } else {
                this.$window.location.reload();
            }
        }, error => {
            this.maDialogHelper.errorToast(['ui.components.errorSwitchingUser', username, error.mangoStatusText]);
        }).finally(() => {
            delete this.switchingUser;
        });
    }

    sendEmailVerification(event) {
        this.sendingEmailVerification = true;

        this.maDialogHelper.prompt({
            event,
            shortTr: ['login.emailVerification.enterEmailAddress', this.user.username],
            longTr: ['login.emailVerification.enterEmailAddressLong', this.user.username],
            placeHolderTr: 'login.email',
            initialValue: this.user.email,
            rejectWithCancelled: true
        }).then(emailAddress => {
            return this.user.sendEmailVerification(emailAddress);
        }).then(response => {
            this.maDialogHelper.toast(['ui.components.emailSent', this.user.email]);
        }, error => {
            if (!this.maDialogHelper.isCancelled(error)) {
                this.maDialogHelper.errorToast(['ui.components.errorSendingEmail', this.user.email, error.mangoStatusText]);
            }
        }).finally(() => {
            delete this.sendingEmailVerification;
        });
    }

    copyUser(event) {
        if (typeof this.onCopy === 'function') {
            const copy = this.user.copy(true);
            this.onCopy({$event: event, $user: copy});
        }
    }
}

export default {
    controller: UserActionsMenuController,
    template: componentTemplate,
    bindings: {
        user: '<?',
        onCopy: '&?'
    }
};
