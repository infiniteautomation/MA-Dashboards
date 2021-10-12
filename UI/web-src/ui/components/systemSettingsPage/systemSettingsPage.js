/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';
import systemSettingsPageTemplate from './systemSettingsPage.html';

const actions = {
    purgeUsingSettings: {
        confirmTr: 'systemSettings.purgeDataWithPurgeSettingsConfirm',
        descriptionTr: 'ui.app.purgeUsingSettings',
        resultsTr: 'ui.app.purgeSuccess'
    },
    purgeAllEvents: {
        confirmTr: 'systemSettings.purgeAllEventsConfirm',
        descriptionTr: 'ui.app.eventPurge',
        resultsTr: 'ui.app.eventPurgeSuccess'
    },
    backupConfiguration: {
        confirmTr: 'systemSettings.backupNow',
        descriptionTr: 'ui.app.configBackup',
        resultsTr: 'ui.app.configBackupSuccess'
    },
    sqlBackup: {
        confirmTr: 'systemSettings.backupNow',
        descriptionTr: 'ui.app.sqlBackup',
        resultsTr: 'ui.app.sqlBackupSuccess'
    },
    sqlRestore: {
        confirmTr: 'systemSettings.confirmRestoreDatabase',
        descriptionTr: 'ui.app.sqlRestore',
        resultsTr: 'ui.app.sqlRestoreSuccess'
    }
};

class SystemSettingsPageController {
    static get $$ngIsClass() { return true };
    static get $inject() { return ['maSystemSettings', 'maLocales', 'maUser', '$state', 'maUiMenu', '$mdMedia',
        '$scope', '$timeout', 'maSystemActions', 'maDialogHelper', 'maServer', 'maUiServerInfo']; }
    
    constructor(SystemSettings, maLocales, User, $state, maUiMenu, $mdMedia,
            $scope, $timeout, maSystemActions, maDialogHelper, maServer, maUiServerInfo) {
        this.SystemSettings = SystemSettings;
        this.User = User;
        this.$state = $state;
        this.menu = maUiMenu;
        this.$mdMedia = $mdMedia;
        this.$scope = $scope;
        this.$timeout = $timeout;
        this.maSystemActions = maSystemActions;
        this.maDialogHelper = maDialogHelper;
        this.maServer = maServer;
        this.maUiServerInfo = maUiServerInfo;

        maLocales.get().then((locales) => {
            locales.forEach((locale) => {
                locale.id = locale.id.replace('-', '_');
            });
            this.locales = locales;
            this.locales.unshift({ id: null });
        });
        
        this.systemAlarmLevelSettings = SystemSettings.getSystemAlarmLevelSettings();
        this.auditAlarmLevelSettings = SystemSettings.getAuditAlarmLevelSettings();
    }
    
    $onInit() {
        this.$scope.$on('$viewContentLoading', (event, viewName) => {
            if (viewName === '@ui.settings.system') {
                if (this.settingForm) {
                    // set form back to pristine state when changing between sections
                    this.settingForm.$setPristine();
                    this.settingForm.$setUntouched();
                    this.changedValues = {};
                    this.error = null;
                    this.savedMessage = false;
                    this.$timeout.cancel(this.savedMessageTimeout);
                    delete this.savePromise;
                }
            }
        });
    }

    get actions() {
        return actions;
    }
    
    doAction(event, name, data) {
        this.maDialogHelper.confirmSystemAction(angular.extend({event: event, actionName: name, actionData: data}, this.actions[name]));
    }
    
    sendTestEmail() {
        this.User.current.sendTestEmail().then((response) => {
            this.maDialogHelper.toastOptions({
                text: response.data,
                hideDelay: 10000
            });
        }, (error) => {
            this.maDialogHelper.toastOptions({
                textTr: ['ui.components.errorSendingEmail', this.User.current.email, error.mangoStatusText],
                hideDelay: 10000,
                classes: 'md-warn'
            });
        });
    }
    
    confirm(event, onConfirmed, translation) {
        return this.maDialogHelper.confirm(event, translation).then(onConfirmed);
    }
    
    valueChanged(systemSetting) {
        this.changedValues[systemSetting.key] = systemSetting.value;
    }

    get section() {
        return this.$state.current;
    }

    set section(section) {
        this.$state.go(section.name);
    }
    
    saveSection() {
        if (this.savePromise) return;
        
        this.$timeout.cancel(this.savedMessageTimeout);
        this.error = null;
        this.savedMessage = false;
    
        this.savePromise = this.SystemSettings.setValues(this.changedValues).then(() => {
            this.settingForm.$setPristine();
            this.settingForm.$setUntouched();
            
            if (this.changedValues.instanceDescription != null) {
                this.maUiServerInfo.instanceDescription = this.changedValues.instanceDescription;
            }
            
            this.changedValues = {};
            this.savedMessage = true;
            this.savedMessageTimeout = this.$timeout(() => {
                this.savedMessage = false;
            }, 5000);
        }, (e) => {
            this.error = {
                response: e,
                message: e.mangoStatusText
            };
        }).then(() => {
            delete this.savePromise;
        });
    }
    
    currentTime() {
        return Math.floor((new Date()).valueOf() / 1000);
    }
    
    getBackupFiles() {
        return this.maServer.getSystemInfo('sqlDatabaseBackupFileList').then((list) => {
            return (this.backupFiles = list);
        });
    }
}

export default {
    controller: SystemSettingsPageController,
    template: systemSettingsPageTemplate
};

