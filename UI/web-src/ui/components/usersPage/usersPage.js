/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import usersPageTemplate from './usersPage.html';
import './usersPage.css';

class UsersPageController {
    static get $$ngIsClass() { return true; }
    static get $inject() { return ['maUser', '$state', 'maDialogHelper', '$scope', 'maRole']; }

    constructor(User, $state, maDialogHelper, $scope, Role) {
        this.User = User;
        this.$state = $state;
        this.maDialogHelper = maDialogHelper;
        this.$scope = $scope;
        this.Role = Role;
    }

    $onInit() {
        if (this.$state.params.username) {
            this.User.get({username: this.$state.params.username}).$promise.then(user => {
                // causes a stack overflow when we try and deep merge this object later
                delete user.$promise;
                this.editUser(user);
            }, () => {
                this.editUser(null);
            });
        } else {
            this.editUser(null);
        }

        this.Role.get('user').then(userRole => {
            this.selectedRole = userRole;
            this.updateSelectedRoleXids();
        });
    }

    addRole(event) {
        this.editRole(new this.Role(), event);
    }

    editRole(role, event) {
        this.role = role;
        this.$state.go('.', {
            editRole: this.role && !this.role.isNew() && this.role.xid || null
        }, {location: 'replace', notify: false});

        if (role != null && !this.showRoleEditDialog) {
            this.showRoleEditDialog = {event};
        }
    }

    roleEditorClosed() {
        delete this.showRoleEditDialog;
        this.editRole(null);
    }

    addUser(event) {
        this.editUser(new this.User());
    }

    editUser(user) {
        this.user = user;
        this.$state.params.username = this.user && !this.user.isNew() && this.user.username || null;
        this.$state.go('.', this.$state.params, {location: 'replace', notify: false});

        if (user != null && !this.showUserEditDialog) {
            this.showUserEditDialog = {};
        }
    }

    userEditorClosed() {
        delete this.showUserEditDialog;
        this.editUser(null);
        this.userEditorTab = 0;
    }

    deleteUsers(event) {
        const users = this.selectedUsers;
        if (users.find(u => u.username === this.User.current.username)) {
            this.maDialogHelper.errorToast(['users.validate.badDelete']);
            return;
        }

        this.maDialogHelper.confirm(event, ['ui.users.confirmDeleteUsers', users.length]).then(() => {
            const requests = users.map(u => ({username: u.username}));

            const bulkTask = new this.User.bulk({
                action: 'DELETE',
                requests
            });

            bulkTask.start(this.$scope).then(resource => {
                if (resource.status === 'SUCCESS' && !resource.result.hasError) {
                    this.maDialogHelper.toast(['ui.users.usersDeleted', resource.result.responses.length]);
                } else {
                    this.maDialogHelper.errorToast(resource.statusMessage());
                }
            }, error => {
                this.maDialogHelper.errorToast(['ui.bulk.failedToStart', error.mangoStatusText]);
            });
        }, angular.noop);
    }

    rowClicked(event, item, index, tableCtrl) {
        if (event.target.classList.contains('ma-checkbox-column')) {
            tableCtrl.selectRow(event, item, index);
        } else {
            this.editUser(item);
        }
    }

    updateSelectedRoleXids() {
        this.selectedRoleXids = [this.selectedRole.xid];
    }

    editUsers(event) {
        if (this.selectedUsers.length === 1) {
            this.editUser(this.selectedUsers[0]);
        } else {
            this.user = angular.copy(this.selectedUsers);
            this.showUserEditDialog = {};
        }
    }

    hasEditPermissions() {
        const users = this.selectedUsers;

        if (!users || users.length === 0) {
            return false;
        }

        return users.every(u => {
            let selfEdit = false;
            if (u.username === this.User.current.username) {
                selfEdit = this.User.current.hasSystemPermission('permissions.user.editSelf');
            }
            return selfEdit || this.User.current.hasPermission(u.editPermission);
        });
    }

    hasDeletePermissions() {
        const users = this.selectedUsers;

        if (!users || users.length === 0) {
            return false;
        }
        if (users.find(u => u.username === this.User.current.username)) {
            return false;
        }
        return this.hasEditPermissions();
    }
}

export default {
    controller: UsersPageController,
    template: usersPageTemplate
};