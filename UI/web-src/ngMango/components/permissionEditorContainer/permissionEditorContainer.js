/**
 * @copyright 2020 {@link http://infiniteautomation.com|Infinite Automation Systems, Inc.} All rights reserved.
 * @author Jared Wiltshire
 */

import permissionEditorContainerTemplate from './permissionEditorContainer.html';
import './permissionEditorContainer.css';

const localStorageKey = 'maPermissionEditorContainer';

class PermissionEditorContainerController {
    static get $$ngIsClass() { return true; }
    static get $inject() { return ['maPermission', 'localStorageService']; }

    constructor(Permission, localStorageService) {
        this.Permission = Permission;
        this.Minterm = Permission.Minterm;
        this.localStorageService = localStorageService;

        this.editors = new Set();

        this.loadSettings();
        this.minterms = this.settings.minterms.map(t => new this.Minterm(t));
    }

    loadSettings() {
        this.settings = this.localStorageService.get(localStorageKey) || {
            minterms: [['superadmin'], ['user']]
        };
    }

    saveSettings() {
        this.localStorageService.set(localStorageKey, this.settings);
    }

    register(editor) {
        this.editors.add(editor);
    }

    deregister(editor) {
        this.editors.delete(editor);
    }

    addColumn(minterm) {
        const i = this.minterms.findIndex(a => a.equals(minterm));
        if (i < 0) {
            this.minterms.push(minterm);
            this.editors.forEach(editor => editor.render());

            this.settings.minterms = this.minterms.map(t => t.toArray());
            this.saveSettings();
        }
    }

    removeColumn(minterm) {
        const i = this.minterms.findIndex(a => a.equals(minterm));
        if (i >= 0) {
            this.minterms.splice(i, 1);
            this.editors.forEach(editor => editor.render());

            this.settings.minterms = this.minterms.map(t => t.toArray());
            this.saveSettings();
        }
    }

    rolesChanged(dropDown) {
        if (!this.advancedMode) {
            this.addRolesAsColumn(dropDown);
        }
    }

    addRolesAsColumn(dropDown) {
        if (this.roles && this.roles.length) {
            this.addColumn(new this.Minterm(this.roles));
            dropDown.close();
        }
    }

    deleteRoles() {
        delete this.roles;
    }
}

export default {
    transclude: true,
    controller: PermissionEditorContainerController,
    template: permissionEditorContainerTemplate
};
