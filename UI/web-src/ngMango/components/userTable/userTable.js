/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import userTableTemplate from './userTable.html';
import './userTable.css';
import TableController from '../../classes/TableController';

const defaultColumns = [
    {name: 'username', label: 'users.username', selectedByDefault: true},
    {name: 'name', label: 'users.name', selectedByDefault: true},
    {name: 'email', label: 'users.email', selectedByDefault: true},
    {name: 'phone', label: 'users.phone'},
    {name: 'organization', label: 'users.organization'},
    {name: 'organizationalRole', label: 'users.organizationalRole'},
    {name: 'permissions', label: 'users.roles', sortable: false, type: 'array'},
    {name: 'disabled', label: 'common.disabled', type: 'boolean'},
    {name: 'muted', label: 'users.muted', type: 'boolean'},
    {name: 'created', label: 'ui.app.userCreated', type: 'date'},
    {name: 'emailVerified', label: 'ui.app.userEmailVerified', type: 'date'},
    {name: 'lastLogin', label: 'ui.app.lastLoginStatic', type: 'date'},
    {name: 'lastPasswordChange', label: 'ui.app.lastPasswordChangeStatic', type: 'date'},
    {name: 'passwordLocked', label: 'users.passwordLocked', filterable: false, sortable: false, type: 'boolean'},
    {name: 'locale', label: 'users.locale'},
    {name: 'timezone', label: 'users.timezone'},
    {name: 'homeUrl', label: 'users.homeURL'},
    {name: 'receiveAlarmEmails', label: 'users.receiveAlarmEmails', type: 'enum'},
    {name: 'receiveOwnAuditEvents', label: 'users.receiveOwnAuditEvents', type: 'boolean'}
];

class UserTableController extends TableController {
    static get $inject() { return ['maUser', '$scope', '$element', '$injector']; }

    constructor(maUser, $scope, $element, $injector) {
        super({
            $scope,
            $element,
            $injector,

            resourceService: maUser,
            localStorageKey: 'userTable',
            defaultColumns,
            defaultSort: [{columnName: 'username'}]
        });
    }

    $onChanges(changes) {
        super.$onChanges(changes);

        if (changes.roles && !changes.roles.isFirstChange()) {
            this.clearCache(false);
        }
    }

    customizeQuery(queryBuilder) {
        if (Array.isArray(this.roles)) {
            for (const role of this.roles) {
                queryBuilder.contains('inheritedRoles', role);
            }
        }
    }

    hasPermission(user) {
        return user && this.hasEditPermission(user) && this.hasDeletePermission(user);
    }

    hasEditPermission(user) {
        let selfEdit = false;
        if (user.username === this.resourceService.current.username) {
            selfEdit = this.resourceService.current.hasSystemPermission('permissions.user.editSelf');
        }
        return selfEdit || this.resourceService.current.hasPermission(user.editPermission);
    }

    hasDeletePermission(user) {
        if (user.username === this.resourceService.current.username) {
            return false;
        }
        return this.hasEditPermission(user);
    }
}

export default {
    template: userTableTemplate,
    controller: UserTableController,
    require: {
        ngModelCtrl: '?ngModel'
    },
    bindings: {
        localStorageKey: '<?',
        selectMultiple: '<?',
        showClear: '<?',
        showActions: '<?',
        dateFormat: '@?',
        rowClicked: '&?',
        onCopy: '&?',
        roles: '<?'
    }
};
