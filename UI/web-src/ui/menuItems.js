/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';
import StackTrace from 'stacktrace-js';

const helpTemplate = function (fileName) {
    return function () {
        return import(/* webpackMode: "lazy-once", webpackChunkName: "ui.help" */ './views/help/' + fileName);
    };
};

const systemSettingsTemplate = function (fileName) {
    return function () {
        return import(/* webpackMode: "lazy-once", webpackChunkName: "ui.settings" */ './systemSettings/' + fileName);
    };
};

const systemStatusTemplate = function (fileName) {
    return function () {
        return import(/* webpackMode: "lazy-once", webpackChunkName: "ui.settings" */ './systemStatus/' + fileName);
    };
};

const examplesTemplate = function (fileName) {
    return function () {
        return import(/* webpackMode: "lazy-once", webpackChunkName: "ui.examples" */ './views/examples/' + fileName);
    };
};

// TODO Mango 4.0 remove permission references and use systemPermission

export default [
    {
        url: '/admin',
        name: 'ui.admin',
        menuIcon: 'svg_administration',
        menuTr: 'ui.dox.administration',
        template: '<div flex="noshrink" layout="column" ui-view></div>',
        abstract: true,
        weight: 1
    },
    {
        name: 'ui.admin.home',
        url: '/home',
        template: '<ma-ui-admin-home-page></ma-ui-admin-home-page>',
        menuTr: 'ui.dox.home',
        menuIcon: 'home',
        params: {
            dateBar: { rollupControls: true },
            helpPage: 'ui.helps.help.gettingStarted'
        },
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/adminHomePage/adminHomePage'
                    ).then((adminHomePage) => {
                        angular.module('maUiAdminHomePage', []).component('maUiAdminHomePage', adminHomePage.default);
                        $injector.loadNewModules(['maUiAdminHomePage']);
                    });
                }
            ]
        },
        weight: 990,
        permission: ['superadmin']
    },
    {
        url: '/setting',
        name: 'ui.uiSettings',
        menuIcon: 'svg_UI_settings',
        menuTr: 'ui.dox.uiSettings',
        template: '<div flex="noshrink" layout="column" ui-view></div>',
        abstract: true,
        weight: 2
    },
    {
        url: '/edit-menu',
        name: 'ui.uiSettings.editMenu',
        templatePromise() {
            return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */ './views/editMenu.html');
        },
        menuTr: 'ui.app.editMenu',
        menuIcon: 'toc',
        systemPermission: ['ui.settings.edit'],
        params: {
            helpPage: 'ui.helps.help.menuEditor'
        }
    },
    {
        url: '/edit-pages/{pageXid}',
        name: 'ui.uiSettings.editPages',
        templatePromise() {
            return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */ './views/editPages.html');
        },
        menuTr: 'ui.app.editPages',
        menuIcon: 'dashboard',
        systemPermission: ['ui.pages.edit'],
        params: {
            dateBar: {
                rollupControls: true
            },
            markup: null,
            templateUrl: null,
            helpPage: 'ui.helps.help.customPages'
        }
    },
    {
        name: 'ui.uiSettings.fileStores',
        url: '/file-stores?fileStore&folderPath&editFile',
        template: '<ma-file-store-browser flex preview="true" ng-model="tmp"><ma-file-store-browser>',
        menuTr: 'ui.app.fileStores',
        menuIcon: 'file_upload',
        permission: ['superadmin']
    },
    {
        name: 'ui.uiSettings.jsonStore',
        url: '/json-store',
        template: `<div>
                    <md-button class="md-raised" ui-sref="ui.uiSettings.jsonStoreEditor">
                        <md-icon>add</md-icon>
                        <span ma-tr="ui.app.jsonStoreNew"></span>
                    </md-button>
                </div>
                <ma-json-store-table edit-clicked="$state.go(\'ui.uiSettings.jsonStoreEditor\', {xid: $item.xid})"><ma-json-store-table>`,
        menuTr: 'ui.app.jsonStorePage',
        menuIcon: 'sd_storage',
        permission: ['superadmin'],
        menuHidden: false,
        showInUtilities: true
    },
    {
        name: 'ui.uiSettings.jsonStoreEditor',
        url: '/json-store-editor/{xid}',
        template: `<div>
                <md-button class="md-raised" ui-sref="ui.uiSettings.jsonStore">
                    <md-icon>arrow_back</md-icon>
                    <span ma-tr="ui.app.backToJsonTable"></span>
                </md-button>
            </div>
            <ma-json-store item="item" xid="{{$state.params.xid}}"></ma-json-store>
            <ma-json-store-editor ng-if="item || !$state.params.xid" ng-model="item"><ma-json-store-editor>`,
        menuTr: 'ui.app.jsonStoreEditorPage',
        menuIcon: 'sd_storage',
        permission: ['superadmin'],
        menuHidden: true
    },
    {
        url: '/ui-settings',
        name: 'ui.uiSettings.uiSettings',
        template: '<ma-ui-settings-page></ma-ui-settings-page>',
        menuTr: 'ui.app.uiSettings',
        menuIcon: 'color_lens',
        systemPermission: ['ui.settings.edit'],
        params: {
            helpPage: 'ui.helps.help.uiSettings'
        },
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/uiSettingsPage/uiSettingsPage'
                    ).then((uiSettingsPage) => {
                        angular.module('maUiSettingsPage', []).component('maUiSettingsPage', uiSettingsPage.default);
                        $injector.loadNewModules(['maUiSettingsPage']);
                    });
                }
            ]
        }
    },
    {
        url: '/data-collection',
        name: 'ui.datacollection',
        menuIcon: 'svg_data_collection',
        menuTr: 'ui.dox.dataCollection',
        template: '<div flex="noshrink" layout="column" ui-view></div>',
        abstract: true,
        weight: 3
    },
    {
        name: 'ui.datacollection.bulkDataPointEdit',
        url: '/bulk-data-point-edit',
        template: '<ma-ui-bulk-data-point-edit-page flex="noshrink" layout="column"></ma-ui-bulk-data-point-edit-page>',
        menuTr: 'ui.app.bulkDataPointEdit',
        menuIcon: 'fitness_center',
        permission: ['superadmin'],
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/bulkDataPointEditPage/bulkDataPointEditPage'
                    ).then((bulkDataPointEditPage) => {
                        angular.module('maUiBulkDataPointEditState', []).component('maUiBulkDataPointEditPage', bulkDataPointEditPage.default);
                        $injector.loadNewModules(['maUiBulkDataPointEditState']);
                    });
                }
            ]
        }
    },
    {
        name: 'ui.datacollection.dataSources',
        url: '/data-sources/{xid}?dataSourceId',
        template: '<ma-ui-data-source-page flex="noshrink" layout="column"><ma-ui-data-source-page>',
        menuTr: 'header.dataSources',
        menuIcon: 'device_hub',
        systemPermission: ['permissionDatasource'],
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/dataSourcePage/dataSourcePage'
                    ).then((dataSourcePage) => {
                        angular.module('maDataSourcePage', []).component('maUiDataSourcePage', dataSourcePage.default);
                        $injector.loadNewModules(['maDataSourcePage']);
                    });
                }
            ]
        },
        params: {
            helpPage: 'ui.helps.help.dataSources'
        }
    },
    {
        url: '/data-distribution',
        name: 'ui.datadistribution',
        menuIcon: 'svg_data_distribution',
        menuTr: 'ui.dox.dataDistribution',
        template: '<div flex="noshrink" layout="column" ui-view></div>',
        abstract: true,
        weight: 4
    },
    {
        name: 'ui.datadistribution.publishers',
        url: '/publishers/{xid}',
        template: '<ma-ui-publisher-page flex="noshrink" layout="column"><ma-ui-publisher-page>',
        menuTr: 'header.publishers',
        menuIcon: 'router',
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/publisherPage/publisherPage'
                    ).then((publisherPage) => {
                        angular.module('maPublisherPage', []).component('maUiPublisherPage', publisherPage.default);
                        $injector.loadNewModules(['maPublisherPage']);
                    });
                }
            ]
        },
        params: {
            helpPage: 'ui.helps.help.publishers'
        },
        permission: ['superadmin']
    },
    {
        name: 'ui.datadistribution.eventHandlers',
        url: '/event-handlers/{xid}?eventType&subType&referenceId1&referenceId2',
        template: '<ma-ui-event-handler-page flex="noshrink" layout="column"><ma-ui-event-handler-page>',
        menuTr: 'ui.app.eventHandlers',
        menuIcon: 'assignment_turned_in',
        permission: ['superadmin'],
        params: {
            helpPage: 'ui.helps.help.eventHandlers'
        },
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/eventHandlerPage/eventHandlerPage'
                    ).then((eventHandlerPage) => {
                        angular.module('maUiEventHandlerPage', []).component('maUiEventHandlerPage', eventHandlerPage.default);
                        $injector.loadNewModules(['maUiEventHandlerPage']);
                    });
                }
            ]
        }
    },
    {
        name: 'ui.datadistribution.mailingList',
        url: '/mailing-lists',
        template: '<ma-ui-mailing-list-page></ma-ui-mailing-list-page>',
        menuTr: 'ui.app.mailingLists',
        menuIcon: 'email',
        params: {
            helpPage: 'ui.helps.help.mailingList'
        },
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/mailingListPage/mailingList'
                    ).then((mailingListPage) => {
                        angular.module('maUiMailingListPage', []).component('maUiMailingListPage', mailingListPage.default);
                        $injector.loadNewModules(['maUiMailingListPage']);
                    });
                }
            ]
        }
    },
    {
        url: '/presentation',
        name: 'ui.presentation',
        menuIcon: 'svg_presentation',
        menuTr: 'ui.dox.presentation',
        template: '<div flex="noshrink" layout="column" ui-view></div>',
        abstract: true,
        weight: 5
    },
    {
        name: 'ui.presentation.watchListBuilder',
        url: '/watch-list-builder/{watchListXid}',
        template: '<ma-ui-watch-list-builder></ma-ui-watch-list-builder>',
        menuTr: 'ui.app.watchListBuilder',
        menuIcon: 'playlist_add_check',
        params: {
            watchList: null,
            helpPage: 'ui.helps.help.watchListBuilder'
        },
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    const p1 = import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/watchListBuilder/watchListBuilder'
                    );

                    const p2 = import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './directives/bracketEscape/bracketEscape'
                    );

                    return Promise.all([p1, p2]).then(([watchListBuilder, bracketEscape]) => {
                        angular
                            .module('maUiWatchListBuilderState', [])
                            .directive('maUiBracketEscape', bracketEscape.default)
                            .directive('maUiWatchListBuilder', watchListBuilder.default);
                        $injector.loadNewModules(['maUiWatchListBuilderState']);
                    });
                }
            ]
        }
    },
    {
        url: '/system',
        name: 'ui.system',
        menuIcon: 'svg_system',
        menuTr: 'ui.dox.system',
        template: '<div flex="noshrink" layout="column" ui-view></div>',
        abstract: true,
        weight: 6
    },
    {
        name: 'ui.system.modules',
        url: '/modules',
        template: '<ma-ui-modules-page><ma-ui-modules-page>',
        menuTr: 'header.modules',
        menuIcon: 'extension',
        permission: ['superadmin'],
        params: {
            helpPage: 'ui.helps.help.modules'
        },
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/modulesPage/modulesPage'
                    ).then((modulesPage) => {
                        angular.module('maUiModulesState', []).directive('maUiModulesPage', modulesPage.default);
                        $injector.loadNewModules(['maUiModulesState']);
                    });
                }
            ]
        }
    },
    {
        name: 'ui.system.modules.offlineUpgrade',
        url: '/offline-upgrade',
        views: {
            '@ui.settings': {
                template: '<ma-ui-offline-upgrade-page flex layout="column"><ma-ui-offline-upgrade-page>'
            }
        },
        menuTr: 'ui.app.offlineUpgrades',
        menuIcon: 'update',
        permission: ['superadmin'],
        menuHidden: true,
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/offlineUpgradePage/offlineUpgradePage'
                    ).then((offlineUpgradePage) => {
                        angular.module('maUiOfflineUpgradeState', []).directive('maUiOfflineUpgradePage', offlineUpgradePage.default);
                        $injector.loadNewModules(['maUiOfflineUpgradeState']);
                    });
                }
            ]
        }
    },
    {
        name: 'ui.system.modules.upgrade',
        url: '/upgrade',
        views: {
            '@ui.settings': {
                template: '<ma-ui-upgrade-page flex layout="column"><ma-ui-upgrade-page>'
            }
        },
        menuTr: 'ui.app.moduleUpgrades',
        menuIcon: 'update',
        permission: ['superadmin'],
        menuHidden: true,
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/upgradePage/upgradePage'
                    ).then((upgradePage) => {
                        angular.module('maUiUpgradeState', []).component('maUiUpgradePage', upgradePage.default);
                        $injector.loadNewModules(['maUiUpgradeState']);
                    });
                }
            ]
        }
    },
    {
        name: 'ui.system.users',
        url: '/users/{username}',
        template: '<ma-ui-users-page flex="noshrink" layout="column"><ma-ui-users-page>',
        menuTr: 'header.users',
        menuIcon: 'people',
        systemPermission: ['users.view'],
        params: {
            helpPage: 'ui.helps.help.users'
        },
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/usersPage/usersPage'
                    ).then((usersPage) => {
                        angular.module('maUiUsersState', []).component('maUiUsersPage', usersPage.default);
                        $injector.loadNewModules(['maUiUsersState']);
                    });
                }
            ]
        }
    },
    {
        name: 'ui.system.system',
        url: '/system',
        template: '<ma-ui-system-settings-page flex="noshrink" layout="column"><ma-ui-system-settings-page>',
        menuTr: 'header.systemSettings',
        menuIcon: 'settings',
        permission: ['superadmin'],
        // params: {
        //     helpPage: 'ui.helps.help.systemSettings'
        // },
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/systemSettingsPage/systemSettingsPage'
                    ).then((systemSettingsPage) => {
                        angular.module('maUiSystemSettingsState', []).component('maUiSystemSettingsPage', systemSettingsPage.default);
                        $injector.loadNewModules(['maUiSystemSettingsState']);
                    });
                }
            ]
        }
    },
    {
        name: 'ui.system.system.auditAlarmLevels',
        params: {
            helpPage: 'ui.helps.help.auditAlarmLevels'
        },
        templatePromise: systemSettingsTemplate('auditAlarmLevels.html'),
        url: '/audit-alarm-levels',
        menuTr: 'systemSettings.auditAlarmLevels',
        menuHidden: true
    },
    {
        name: 'ui.system.system.configBackup',
        params: {
            helpPage: 'ui.helps.help.configBackup'
        },
        templatePromise: systemSettingsTemplate('configBackup.html'),
        url: '/config-backup',
        menuTr: 'systemSettings.backupSettings',
        menuHidden: true
    },
    {
        name: 'ui.system.system.email',
        params: {
            helpPage: 'ui.helps.help.emailSettings'
        },
        templatePromise: systemSettingsTemplate('email.html'),
        url: '/email',
        menuTr: 'systemSettings.emailSettings',
        menuHidden: true
    },
    {
        name: 'ui.system.system.http',
        params: {
            helpPage: 'ui.helps.help.httpSettings'
        },
        templatePromise: systemSettingsTemplate('httpSettings.html'),
        url: '/http',
        menuTr: 'systemSettings.httpSettings',
        menuHidden: true
    },
    {
        name: 'ui.system.system.httpServer',
        params: {
            helpPage: 'ui.helps.help.httpServerSettings'
        },
        templatePromise: systemSettingsTemplate('httpServerSettings.html'),
        url: '/http-server',
        menuTr: 'systemSettings.httpServerSettings',
        menuHidden: true
    },
    {
        name: 'ui.system.system.language',
        params: {
            helpPage: 'ui.helps.help.language'
        },
        templatePromise: systemSettingsTemplate('language.html'),
        url: '/language',
        menuTr: 'systemSettings.languageSettings',
        menuHidden: true
    },
    {
        name: 'ui.system.system.password',
        params: {
            helpPage: 'ui.helps.help.password'
        },
        templatePromise: systemSettingsTemplate('passwordSettings.html'),
        url: '/password',
        menuTr: 'systemSettings.passwordSettings',
        menuHidden: true
    },
    {
        name: 'ui.system.system.purge',
        params: {
            helpPage: 'ui.helps.help.systemPurge'
        },
        templatePromise: systemSettingsTemplate('purgeSettings.html'),
        url: '/purge',
        menuTr: 'systemSettings.purgeSettings',
        menuHidden: true
    },
    {
        name: 'ui.system.system.sqlBackup',
        params: {
            helpPage: 'ui.helps.help.sqlBackup'
        },
        templatePromise: systemSettingsTemplate('sqlBackup.html'),
        url: '/sql-backup',
        menuTr: 'systemSettings.H2DatabaseBackupSettings',
        menuHidden: true
    },
    {
        name: 'ui.system.system.systemAlarmLevels',
        params: {
            helpPage: 'ui.helps.help.systemAlarmLevels'
        },
        templatePromise: systemSettingsTemplate('systemAlarmLevels.html'),
        url: '/system-alarm-levels',
        menuTr: 'systemSettings.systemAlarmLevels',
        menuHidden: true
    },
    {
        name: 'ui.system.system.systemInformation',
        params: {
            helpPage: 'ui.helps.help.systemInformation'
        },
        templatePromise: systemSettingsTemplate('systemInformation.html'),
        url: '/information',
        menuTr: 'systemSettings.systemInformation',
        menuHidden: true
    },
    {
        name: 'ui.system.system.threadPools',
        params: {
            helpPage: 'ui.helps.help.threadPools'
        },
        templatePromise: systemSettingsTemplate('threadPools.html'),
        url: '/thread-pools',
        menuTr: 'systemSettings.threadPools',
        menuHidden: true
    },
    {
        name: 'ui.system.system.ui',
        params: {
            helpPage: 'ui.helps.help.ui'
        },
        templatePromise: systemSettingsTemplate('uiModule.html'),
        url: '/ui',
        menuTr: 'ui.settings',
        menuHidden: true
    },
    {
        name: 'ui.system.system.virtualSerialPort',
        url: '/virtual-serial-port/{xid}',
        template: '<ma-virtual-serial-port></ma-virtual-serial-port>',
        menuTr: 'systemSettings.comm.virtual.serialPorts',
        menuIcon: 'settings_input_hdmi',
        permission: ['superadmin'],
        params: {
            noPadding: false,
            hideFooter: false,
            helpPage: 'ui.helps.help.virtualSerialPort'
        },
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/virtualSerialPort/virtualSerialPort'
                    ).then((virtualSerialPort) => {
                        angular.module('maVirtualSerialPort', []).component('maVirtualSerialPort', virtualSerialPort.default);
                        $injector.loadNewModules(['maVirtualSerialPort']);
                    });
                }
            ]
        }
    },
    {
        name: 'ui.system.permissions',
        params: {
            helpPage: 'ui.helps.help.permissions'
        },
        template: '<ma-ui-permissions-page flex="noshrink" layout="column"></ma-ui-permissions-page>',
        url: '/permissions',
        menuTr: 'header.systemPermissions',
        menuIcon: 'supervised_user_circle',
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/permissionsPage/permissionsPage'
                    ).then((permissionsPage) => {
                        angular.module('maUiPermissionsPage', []).component('maUiPermissionsPage', permissionsPage.default);
                        $injector.loadNewModules(['maUiPermissionsPage']);
                    });
                }
            ]
        },
        permission: ['superadmin']
    },
    {
        name: 'ui.system.importExport',
        url: '/import-export',
        template: '<ma-ui-import-export-page><ma-ui-import-export-page>',
        menuTr: 'header.emport',
        menuIcon: 'import_export',
        permission: ['superadmin'],
        menuHidden: false,
        showInUtilities: true,
        params: {
            helpPage: 'ui.helps.help.importExport'
        },
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/importExportPage/importExportPage'
                    ).then((importExportPage) => {
                        angular.module('maUiImportExportState', []).component('maUiImportExportPage', importExportPage.default);
                        $injector.loadNewModules(['maUiImportExportState']);
                    });
                }
            ]
        }
    },
    {
        url: '/automation',
        name: 'ui.automation',
        menuIcon: 'svg_automation',
        menuTr: 'ui.dox.automation',
        template: '<div flex="noshrink" layout="column" ui-view></div>',
        abstract: true,
        weight: 7
    },
    {
        url: '/helps',
        name: 'ui.helps',
        menuIcon: 'svg_help',
        menuTr: 'header.help',
        template: '<div flex="noshrink" layout="column" ui-view></div>',
        abstract: true,
        weight: 8
    },
    {
        name: 'ui.helps.onlineHelpDocs',
        template: '<div flex="noshrink" layout="column" ui-view></div>',
        href: 'https://docs-v4.radixiot.com/',
        target: '_blank',
        weight: 1000,
        menuHidden: false,
        menuText: 'Online help docs'
    },
    {
        name: 'ui.helps.helpForum',
        template: '<div flex="noshrink" layout="column" ui-view></div>',
        href: 'https://forum.mango-os.com/',
        target: '_blank',
        weight: 2002,
        menuHidden: false,
        menuText: 'Help Forum'
    },
    {
        name: 'ui.helps.help',
        url: '/help',
        menuTr: 'ui.dox.contextHelp',
        menuIcon: 'help',
        submenu: true,
        weight: 2000,
        params: {
            sidebar: null
        }
    },
    {
        url: '/getting-started',
        name: 'ui.helps.help.gettingStarted',
        templatePromise: helpTemplate('gettingStarted.html'),
        menuTr: 'ui.dox.gettingStarted',
        weight: 900
    },
    {
        url: '/watch-list',
        name: 'ui.helps.help.watchList',
        templatePromise: helpTemplate('watchList.html'),
        menuTr: 'ui.dox.watchList'
    },
    {
        url: '/data-point-details',
        name: 'ui.helps.help.dataPointDetails',
        templatePromise: helpTemplate('dataPointDetails.html'),
        menuTr: 'ui.dox.dataPointDetails'
    },
    {
        url: '/events',
        name: 'ui.helps.help.events',
        templatePromise: helpTemplate('events.html'),
        menuTr: 'ui.dox.events'
    },
    {
        url: '/date-bar',
        name: 'ui.helps.help.dateBar',
        templatePromise: helpTemplate('dateBar.html'),
        menuTr: 'ui.dox.dateBar'
    },
    {
        url: '/ui-settings',
        name: 'ui.helps.help.uiSettings',
        templatePromise: helpTemplate('uiSettings.html'),
        menuTr: 'ui.app.uiSettings'
    },
    {
        url: '/watch-list-builder',
        name: 'ui.helps.help.watchListBuilder',
        templatePromise: helpTemplate('watchListBuilder.html'),
        menuTr: 'ui.app.watchListBuilder'
    },
    {
        url: '/custom-pages',
        name: 'ui.helps.help.customPages',
        templatePromise: helpTemplate('customPages.html'),
        menuTr: 'ui.dox.customPages'
    },
    {
        url: '/menu-editor',
        name: 'ui.helps.help.menuEditor',
        templatePromise: helpTemplate('menuEditor.html'),
        menuTr: 'ui.dox.menuEditor'
    },
    {
        url: '/users',
        name: 'ui.helps.help.users',
        templatePromise: helpTemplate('users.html'),
        menuTr: 'header.users'
    },
    {
        url: '/custom-dashboards',
        name: 'ui.helps.help.customDashboards',
        templatePromise: helpTemplate('customDashboards.html'),
        menuTr: 'ui.dox.customDashboards'
    },
    {
        url: '/system-status',
        name: 'ui.helps.help.systemStatus',
        templatePromise: helpTemplate('systemStatus.html'),
        menuTr: 'ui.settings.systemStatus'
    },
    {
        url: '/data-sources',
        name: 'ui.helps.help.dataSources',
        templatePromise: helpTemplate('dataSources.html'),
        menuTr: 'header.dataSources'
    },
    {
        url: '/publishers',
        name: 'ui.helps.help.publishers',
        templatePromise: helpTemplate('publishers.html'),
        menuTr: 'header.publishers'
    },
    {
        url: '/purge-now',
        name: 'ui.helps.help.purgeNow',
        templatePromise: helpTemplate('purgeNow.html'),
        menuTr: 'dsEdit.purge.purgeNow'
    },
    {
        url: '/ds-purge-override',
        name: 'ui.helps.help.dsPurgeOverride',
        templatePromise: helpTemplate('dsPurgeOverride.html'),
        menuTr: 'ui.dox.dsPurgeOverride'
    },
    {
        url: '/dp-purge-override',
        name: 'ui.helps.help.dpPurgeOverride',
        templatePromise: helpTemplate('dpPurgeOverride.html'),
        menuTr: 'ui.dox.dpPurgeOverride'
    },
    {
        url: '/alarms',
        name: 'ui.helps.help.alarms',
        templatePromise: helpTemplate('alarms.html'),
        menuTr: 'ui.dox.alarms'
    },
    {
        url: '/textRenderer',
        name: 'ui.helps.help.textRenderer',
        templatePromise: helpTemplate('textRenderer.html'),
        menuTr: 'ui.dox.textRenderer'
    },
    {
        url: '/logging',
        name: 'ui.helps.help.loggingProperties',
        templatePromise: helpTemplate('loggingProperties.html'),
        menuTr: 'ui.dox.logging'
    },
    {
        url: '/tags',
        name: 'ui.helps.help.tags',
        templatePromise: helpTemplate('tags.html'),
        menuTr: 'ui.dox.tags'
    },
    {
        url: '/pointProperties',
        name: 'ui.helps.help.pointProperties',
        templatePromise: helpTemplate('pointProperties.html'),
        menuTr: 'ui.dox.pointProperties'
    },
    {
        url: '/dataPointProperties',
        name: 'ui.helps.help.dataPointProperties',
        templatePromise: helpTemplate('dataPointProperties.html'),
        menuTr: 'ui.dox.dataPoint'
    },
    {
        name: 'ui.helps.examples',
        url: '/examples',
        menuTr: 'ui.dox.examples',
        menuIcon: 'info',
        // menuHidden: true,
        systemPermission: ['ui.pages.edit'],
        submenu: true,
        weight: 2001
    },
    {
        name: 'ui.helps.examples.basics',
        url: '/basics',
        menuTr: 'ui.dox.basics',
        menuIcon: 'fa-info-circle',
        weight: 995
    },
    {
        name: 'ui.helps.examples.basics.angular',
        templatePromise: examplesTemplate('angular.html'),
        url: '/angular',
        menuTr: 'ui.dox.angular'
    },
    {
        name: 'ui.helps.examples.basics.pointList',
        templatePromise: examplesTemplate('pointList.html'),
        url: '/point-list',
        menuTr: 'ui.dox.pointList'
    },
    {
        name: 'ui.helps.examples.basics.getPointByXid',
        templatePromise: examplesTemplate('getPointByXid.html'),
        url: '/get-point-by-xid',
        menuTr: 'ui.dox.getPointByXid'
    },
    {
        name: 'ui.helps.examples.basics.dataSourceAndDeviceList',
        templatePromise: examplesTemplate('dataSourceAndDeviceList.html'),
        url: '/data-source-and-device-list',
        menuTr: 'ui.dox.dataSourceAndDeviceList'
    },
    {
        name: 'ui.helps.examples.basics.liveValues',
        templatePromise: examplesTemplate('liveValues.html'),
        url: '/live-values',
        menuTr: 'ui.dox.liveValues'
    },
    {
        name: 'ui.helps.examples.basics.filters',
        templatePromise: examplesTemplate('filters.html'),
        url: '/filters',
        menuTr: 'ui.dox.filters'
    },
    {
        name: 'ui.helps.examples.basics.datePresets',
        templatePromise: examplesTemplate('datePresets.html'),
        url: '/date-presets',
        menuTr: 'ui.dox.datePresets'
    },
    {
        name: 'ui.helps.examples.basics.styleViaValue',
        templatePromise: examplesTemplate('styleViaValue.html'),
        url: '/style-via-value',
        menuTr: 'ui.dox.styleViaValue'
    },
    {
        name: 'ui.helps.examples.basics.pointValues',
        templatePromise: examplesTemplate('pointValues.html'),
        url: '/point-values',
        menuTr: 'ui.dox.pointValues'
    },
    {
        name: 'ui.helps.examples.basics.latestPointValues',
        templatePromise: examplesTemplate('latestPointValues.html'),
        url: '/latest-point-values',
        menuTr: 'ui.dox.latestPointValues'
    },
    {
        name: 'ui.helps.examples.basics.clocksAndTimezones',
        templatePromise: examplesTemplate('clocksAndTimezones.html'),
        url: '/clocks-and-timezones',
        menuTr: 'ui.dox.clocksAndTimezones'
    },
    {
        name: 'ui.helps.examples.singleValueDisplays',
        url: '/single-value-displays',
        menuTr: 'ui.dox.singleValueDisplays',
        menuIcon: 'fa-tachometer',
        weight: 996
    },
    {
        name: 'ui.helps.examples.singleValueDisplays.gauges',
        templatePromise: examplesTemplate('gauges.html'),
        url: '/gauges',
        menuTr: 'ui.dox.gauges'
    },
    {
        name: 'ui.helps.examples.singleValueDisplays.switchImage',
        templatePromise: examplesTemplate('switchImage.html'),
        url: '/switch-image',
        menuTr: 'ui.dox.switchImage'
    },
    {
        name: 'ui.helps.examples.singleValueDisplays.ledIndicator',
        templatePromise: examplesTemplate('ledIndicator.html'),
        url: '/led-indicator',
        menuTr: 'ui.dox.ledIndicator'
    },
    {
        name: 'ui.helps.examples.singleValueDisplays.bars',
        templatePromise: examplesTemplate('bars.html'),
        url: '/bars',
        menuTr: 'ui.dox.bars'
    },
    {
        name: 'ui.helps.examples.singleValueDisplays.tanks',
        templatePromise: examplesTemplate('tanks.html'),
        url: '/tanks',
        menuTr: 'ui.dox.tanks'
    },
    {
        name: 'ui.helps.examples.charts',
        url: '/charts',
        menuTr: 'ui.dox.charts',
        menuIcon: 'fa-area-chart',
        weight: 997
    },
    {
        name: 'ui.helps.examples.charts.lineChart',
        templatePromise: examplesTemplate('lineChart.html'),
        url: '/line-chart',
        menuTr: 'ui.dox.lineChart'
    },
    {
        name: 'ui.helps.examples.charts.heatMap',
        templatePromise: examplesTemplate('heatMap.html'),
        url: '/heat-map',
        menuTr: 'ui.dox.heatMap'
    },
    {
        name: 'ui.helps.examples.charts.barChart',
        templatePromise: examplesTemplate('barChart.html'),
        url: '/bar-chart',
        menuTr: 'ui.dox.barChart'
    },
    {
        name: 'ui.helps.examples.charts.advancedChart',
        templatePromise: examplesTemplate('advancedChart.html'),
        url: '/advanced-chart',
        menuTr: 'ui.dox.advancedChart'
    },
    {
        name: 'ui.helps.examples.charts.stateChart',
        templatePromise: examplesTemplate('stateChart.html'),
        url: '/state-chart',
        menuTr: 'ui.dox.stateChart'
    },
    {
        name: 'ui.helps.examples.charts.liveUpdatingChart',
        templatePromise: examplesTemplate('liveUpdatingChart.html'),
        url: '/live-updating-chart',
        menuTr: 'ui.dox.liveUpdatingChart'
    },
    {
        name: 'ui.helps.examples.charts.pieChart',
        templatePromise: examplesTemplate('pieChart.html'),
        url: '/pie-chart',
        menuTr: 'ui.dox.pieChart'
    },
    {
        name: 'ui.helps.examples.charts.dailyComparison',
        templatePromise: examplesTemplate('dailyComparisonChart.html'),
        url: '/daily-comparison',
        menuTr: 'ui.dox.dailyComparisonChart'
    },
    {
        name: 'ui.helps.examples.settingPointValues',
        url: '/setting-point-values',
        menuTr: 'ui.dox.settingPoint',
        menuIcon: 'fa-pencil-square-o',
        weight: 998
    },
    {
        name: 'ui.helps.examples.settingPointValues.setPoint',
        templatePromise: examplesTemplate('setPoint.html'),
        url: '/set-point',
        menuTr: 'ui.dox.settingPoint'
    },
    {
        name: 'ui.helps.examples.settingPointValues.toggle',
        templatePromise: examplesTemplate('toggle.html'),
        url: '/toggle',
        menuTr: 'ui.dox.toggle'
    },
    {
        name: 'ui.helps.examples.settingPointValues.sliders',
        templatePromise: examplesTemplate('sliders.html'),
        url: '/sliders',
        menuTr: 'ui.dox.sliders'
    },
    {
        name: 'ui.helps.examples.settingPointValues.multistateRadio',
        templatePromise: examplesTemplate('multistateRadio.html'),
        url: '/multistate-radio-buttons',
        menuTr: 'ui.dox.multistateRadio'
    },
    {
        name: 'ui.helps.examples.statistics',
        url: '/statistics',
        menuTr: 'ui.dox.statistics',
        menuIcon: 'fa-table'
    },
    {
        name: 'ui.helps.examples.statistics.getStatistics',
        templatePromise: examplesTemplate('getStatistics.html'),
        url: '/get-statistics',
        menuTr: 'ui.dox.getStatistics'
    },
    {
        name: 'ui.helps.examples.statistics.statisticsTable',
        templatePromise: examplesTemplate('statisticsTable.html'),
        url: '/statistics-table',
        menuTr: 'ui.dox.statisticsTable'
    },
    {
        name: 'ui.helps.examples.statistics.statePieChart',
        templatePromise: examplesTemplate('statePieChart.html'),
        url: '/state-pie-chart',
        menuTr: 'ui.dox.statePieChart'
    },
    {
        name: 'ui.helps.examples.pointArrays',
        url: '/point-arrays',
        menuTr: 'ui.dox.pointArrayTemplating',
        menuIcon: 'fa-list'
    },
    {
        name: 'ui.helps.examples.pointArrays.buildPointArray',
        templatePromise: examplesTemplate('buildPointArray.html'),
        url: '/build-point-array',
        menuTr: 'ui.dox.buildPointArray'
    },
    {
        name: 'ui.helps.examples.pointArrays.pointArrayTable',
        templatePromise: examplesTemplate('pointArrayTable.html'),
        url: '/point-array-table',
        menuTr: 'ui.dox.pointArrayTable'
    },
    {
        name: 'ui.helps.examples.pointArrays.pointArrayLineChart',
        templatePromise: examplesTemplate('pointArrayLineChart.html'),
        url: '/point-array-line-chart',
        menuTr: 'ui.dox.pointArrayLineChart'
    },
    {
        name: 'ui.helps.examples.pointArrays.templating',
        templatePromise: examplesTemplate('templating.html'),
        url: '/templating',
        menuTr: 'ui.dox.templating'
    },
    {
        name: 'ui.helps.examples.pointArrays.dataPointTable',
        templatePromise: examplesTemplate('dataPointTable.html'),
        url: '/data-point-table',
        menuTr: 'ui.dox.dataPointTable'
    },
    {
        name: 'ui.helps.examples.templates',
        url: '/templates',
        menuTr: 'ui.dox.templates',
        menuIcon: 'fa-file-o'
    },
    {
        name: 'ui.helps.examples.templates.adaptiveLayouts',
        templatePromise: examplesTemplate('adaptiveLayouts.html'),
        url: '/adaptive-layouts',
        menuTr: 'ui.dox.adaptiveLayouts'
    },
    {
        name: 'ui.helps.examples.utilities',
        url: '/utilities',
        menuTr: 'ui.dox.utilities',
        menuIcon: 'fa-wrench'
    },
    {
        name: 'ui.helps.examples.utilities.translation',
        templatePromise: examplesTemplate('translation.html'),
        url: '/translation',
        menuTr: 'ui.dox.translation'
    },
    {
        name: 'ui.helps.examples.utilities.jsonStore',
        templatePromise: examplesTemplate('jsonStore.html'),
        url: '/json-store',
        menuTr: 'ui.dox.jsonStore'
    },
    {
        name: 'ui.helps.examples.utilities.watchdog',
        templatePromise: examplesTemplate('watchdog.html'),
        url: '/watchdog',
        menuTr: 'ui.dox.watchdog'
    },
    {
        name: 'ui.helps.examples.utilities.eventsTable',
        templatePromise: examplesTemplate('eventsTable.html'),
        url: '/events-table',
        menuTr: 'ui.app.eventsTable'
    },
    {
        name: 'ui.helps.examples.utilities.maps',
        templatePromise: examplesTemplate('maps.html'),
        url: '/maps',
        menuTr: 'ui.dox.maps'
    },
    {
        name: 'ui.helps.examples.svg',
        url: '/svg',
        menuTr: 'ui.dox.svgGraphics',
        menuIcon: 'fa-picture-o'
    },
    {
        name: 'ui.helps.examples.svg.basicUsage',
        templatePromise: examplesTemplate('svgBasic.html'),
        url: '/basic-usage',
        menuTr: 'ui.dox.basicSvg'
    },
    {
        name: 'ui.helps.examples.svg.interactiveSvg',
        templatePromise: examplesTemplate('svgAdvanced.html'),
        url: '/interactive-svg',
        menuTr: 'ui.dox.interactiveSvg'
    },
    {
        name: 'ui.helps.examples.svg.svgWindRose',
        templatePromise: examplesTemplate('svgWindRose.html'),
        url: '/wind-rose',
        menuTr: 'ui.dox.svgWindRose'
    },
    {
        name: 'login',
        url: '/login?username&error',
        menuHidden: true,
        menuIcon: 'exit_to_app',
        menuTr: 'header.login',
        permission: ['anonymous'],
        templatePromise() {
            return import(/* webpackMode: "eager" */ './views/login.html');
        }
    },
    {
        name: 'resetPassword',
        url: '/reset-password?resetToken',
        menuHidden: true,
        menuIcon: 'code',
        menuTr: 'header.resetPassword',
        permission: ['anonymous'],
        templatePromise() {
            return import(/* webpackMode: "eager" */ './views/resetPassword.html');
        }
    },
    {
        name: 'forgotPassword',
        url: '/forgot-password?username',
        menuHidden: true,
        menuIcon: 'live_help',
        menuTr: 'header.forgotPassword',
        permission: ['anonymous'],
        templatePromise() {
            return import(/* webpackMode: "eager" */ './views/forgotPassword.html');
        }
    },
    {
        name: 'changePassword',
        url: '/change-password?username&resetToken',
        menuHidden: true,
        menuIcon: 'vpn_key',
        menuTr: 'header.changePasword',
        permission: ['anonymous'],
        templatePromise() {
            return import(/* webpackMode: "eager" */ './views/changePassword.html');
        },
        params: {
            credentialsExpired: null,
            password: null
        }
    },
    {
        name: 'verifyEmail',
        url: '/verify-email',
        menuHidden: true,
        menuIcon: 'email',
        menuTr: 'login.emailVerification.verifyEmailForNewAccount',
        permission: ['anonymous'],
        templatePromise() {
            return import(/* webpackMode: "eager" */ './views/verifyEmail.html');
        }
    },
    {
        name: 'verifyEmailToken',
        url: '/verify-email-token?emailAddressVerificationToken',
        menuHidden: true,
        menuIcon: 'email',
        menuTr: 'login.emailVerification.verifyEmail',
        permission: ['anonymous'],
        templatePromise() {
            return import(/* webpackMode: "eager" */ './views/verifyEmailToken.html');
        }
    },
    {
        name: 'registerUser',
        url: '/register-user?emailAddressVerificationToken',
        menuHidden: true,
        menuIcon: 'user',
        menuTr: 'login.emailVerification.registerUser',
        permission: ['anonymous'],
        templatePromise() {
            return import(/* webpackMode: "eager" */ './views/registerUser.html');
        }
    },
    {
        name: 'logout',
        url: '/logout',
        menuHidden: true,
        menuIcon: 'power_settings_new',
        menuTr: 'header.logout',
        template: '<div></div>'
    },
    {
        name: 'agreeToLicense',
        url: '/agree-to-license',
        template: '<ma-ui-license-page flex layout="column"></ma-ui-license-page>',
        permission: ['superadmin'],
        resolve: {
            maUiAgreeToLicensePage: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.main" */
                        './components/licensePage/licensePage'
                    ).then((licensePage) => {
                        angular.module('maUiLicensePage', []).component('maUiLicensePage', licensePage.default);
                        $injector.loadNewModules(['maUiLicensePage']);
                    });
                }
            ]
        },
        menuTr: 'ui.app.agreeToLicense',
        menuIcon: 'done',
        menuHidden: true
    },
    {
        name: 'systemSetup',
        url: '/system-setup',
        menuHidden: true,
        menuTr: 'header.systemSetup',
        permission: ['superadmin'],
        templatePromise() {
            return import(/* webpackMode: "eager" */ './views/systemSetup.html');
        }
    },
    {
        name: 'ui',
        url: '?helpOpen',
        abstract: true,
        menuHidden: true,
        menuTr: 'ui.app.ui',
        templatePromise() {
            return import(
                /* webpackMode: "lazy", webpackChunkName: "ui.main" */
                './views/main.html'
            );
        },
        permission: ['user'],
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.main" */
                        './mainModule'
                    ).then(() => {
                        $injector.loadNewModules(['maUiRootState']);
                    });
                }
            ],
            rootScopeData: [
                '$rootScope',
                'maUiServerInfo',
                function ($rootScope, maUiServerInfo) {
                    return maUiServerInfo.getPostLoginData().then((serverInfo) => {
                        $rootScope.serverInfo = serverInfo;
                    });
                }
            ]
        }
    },
    {
        name: 'ui.notFound',
        templatePromise() {
            return import(
                /* webpackMode: "lazy", webpackChunkName: "ui.main" */
                './views/notFound.html'
            );
        },
        url: '/not-found?path',
        menuHidden: true,
        menuTr: 'ui.app.pageNotFound',
        weight: 3000
    },
    {
        name: 'ui.unauthorized',
        templatePromise() {
            return import(
                /* webpackMode: "lazy", webpackChunkName: "ui.main" */
                './views/unauthorized.html'
            );
        },
        url: '/unauthorized?path',
        menuHidden: true,
        menuTr: 'ui.app.unauthorized',
        weight: 3000
    },
    {
        name: 'ui.error',
        templatePromise() {
            return import(
                /* webpackMode: "lazy", webpackChunkName: "ui.main" */
                './views/error.html'
            );
        },
        resolve: {
            errorFrames: [
                '$stateParams',
                function ($stateParams) {
                    if ($stateParams.error && $stateParams.error instanceof Error) {
                        try {
                            return StackTrace.fromError($stateParams.error, {
                                offline: true
                            });
                        } catch (e) {}
                    }
                }
            ]
        },
        url: '/error',
        menuHidden: true,
        menuTr: 'ui.app.error',
        weight: 3000,
        params: {
            toState: null,
            toParams: null,
            fromState: null,
            fromParams: null,
            error: null
        },
        controller: [
            '$scope',
            'errorFrames',
            '$stateParams',
            function ($scope, errorFrames, $stateParams) {
                $scope.frames = errorFrames;
                if (Array.isArray(errorFrames)) {
                    const stackTraceLines = errorFrames.map((frame) => {
                        return `\tat ${frame.functionName} (${frame.fileName}:${frame.lineNumber}:${frame.columnNumber})`;
                    });

                    stackTraceLines.unshift('' + $stateParams.error);
                    $scope.stackTrace = stackTraceLines.join('\n');
                }
            }
        ]
    },
    {
        name: 'ui.serverError',
        url: '/server-error',
        menuHidden: true,
        menuTr: 'ui.app.serverError',
        weight: 3000,
        templatePromise() {
            return import(
                /* webpackMode: "lazy", webpackChunkName: "ui.main" */
                './views/serverError.html'
            );
        }
    },
    {
        name: 'ui.watchList',
        url: '/watch-list/{watchListXid}?dataSourceXid&deviceName&tags',
        template: '<ma-ui-watch-list-page flex="noshrink" layout="column"></ma-ui-watch-list-page>',
        menuTr: 'ui.app.watchList',
        menuIcon: 'remove_red_eye',
        params: {
            dateBar: {
                rollupControls: true
            },
            helpPage: 'ui.helps.help.watchList'
        },
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.main" */
                        './directives/watchList/watchListPage'
                    ).then((watchListPage) => {
                        angular.module('maUiWatchListState', []).directive('maUiWatchListPage', watchListPage.default);
                        $injector.loadNewModules(['maUiWatchListState']);
                    });
                }
            ]
        }
    },
    {
        name: 'ui.dataPointDetails',
        url: '/data-point-details/{pointXid}?pointId&edit&detectorId&detectorXid',
        template: '<ma-ui-data-point-details></ma-ui-data-point-details>',
        menuTr: 'ui.app.dataPointDetails',
        menuIcon: 'timeline',
        params: {
            dateBar: {
                rollupControls: true
            },
            helpPage: 'ui.helps.help.dataPointDetails'
        },
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.main" */
                        './components/dataPointDetails/dataPointDetails'
                    ).then((dataPointDetails) => {
                        angular.module('maUiDataPointDetailsState', []).component('maUiDataPointDetails', dataPointDetails.default);
                        $injector.loadNewModules(['maUiDataPointDetailsState']);
                    });
                }
            ]
        }
    },
    {
        name: 'ui.events',
        url: '/events?eventType&subType&referenceId1&referenceId2&alarmLevel&activeStatus&acknowledged&dateFilter',
        template: '<ma-ui-events-page></ma-ui-events-page>',
        menuTr: 'ui.app.events',
        menuIcon: 'alarm',
        params: {
            dateBar: {
                rollupControls: false
            },
            helpPage: 'ui.helps.help.events'
        },
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.main" */
                        './components/eventsPage/eventsPage'
                    ).then((eventsPage) => {
                        angular.module('maUiEventsState', []).component('maUiEventsPage', eventsPage.default);
                        $injector.loadNewModules(['maUiEventsState']);
                    });
                }
            ]
        }
    },
    {
        name: 'ui.userProfile',
        url: '/user-profile',
        template: '<ma-ui-user-profile-page flex="noshrink" layout="column"><ma-ui-user-profile-page>',
        menuTr: 'header.userProfile',
        menuIcon: 'person',
        params: {
            helpPage: 'ui.helps.help.users'
        },
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.main" */
                        './components/userProfile/userProfile'
                    ).then((userProfile) => {
                        angular.module('maUiUserProfileState', []).component('maUiUserProfilePage', userProfile.default);
                        $injector.loadNewModules(['maUiUserProfileState']);
                    });
                }
            ]
        },
        menuHidden: true
    },
    {
        url: '/view-page/{pageXid}',
        name: 'ui.viewPage',
        template: '<ma-ui-page-view xid="{{pageXid}}" flex layout="column"></ma-ui-page-view>',
        menuTr: 'ui.app.viewPage',
        menuHidden: true,
        controller: [
            '$scope',
            '$stateParams',
            function ($scope, $stateParams) {
                $scope.pageXid = $stateParams.pageXid;
            }
        ],
        weight: 3000,
        params: {
            dateBar: {
                rollupControls: true
            }
        }
    },
    {
        url: '/administration',
        name: 'ui.settings',
        menuIcon: 'build',
        menuTr: 'ui.app.adminTools',
        template: '<div flex="noshrink" layout="column" ui-view></div>',
        abstract: true,
        weight: 1999
    },
    {
        url: '/auto-login-settings',
        name: 'ui.settings.autoLoginSettings',
        templatePromise() {
            return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */ './views/autoLoginSettings.html');
        },
        menuTr: 'ui.app.autoLoginSettings',
        menuIcon: 'face',
        permission: ['superadmin'],
        menuHidden: true,
        showInUtilities: true
    },
    {
        url: '/system-information',
        name: 'ui.helps.help.systemInformation',
        templatePromise: helpTemplate('systemInformation.html'),
        menuTr: 'systemSettings.systemInformation'
    },
    {
        url: '/language',
        name: 'ui.helps.help.language',
        templatePromise: helpTemplate('language.html'),
        menuTr: 'systemSettings.languageSettings'
    },
    {
        url: '/system-alarm-levels',
        name: 'ui.helps.help.systemAlarmLevels',
        templatePromise: helpTemplate('systemAlarmLevels.html'),
        menuTr: 'systemSettings.systemAlarmLevels'
    },
    {
        url: '/audit-alarm-levels',
        name: 'ui.helps.help.auditAlarmLevels',
        templatePromise: helpTemplate('auditAlarmLevels.html'),
        menuTr: 'systemSettings.auditAlarmLevels'
    },
    {
        url: '/email',
        name: 'ui.helps.help.emailSettings',
        templatePromise: helpTemplate('emailSettings.html'),
        menuTr: 'systemSettings.emailSettings'
    },
    {
        url: '/http',
        name: 'ui.helps.help.httpSettings',
        templatePromise: helpTemplate('httpSettings.html'),
        menuTr: 'systemSettings.httpSettings'
    },
    {
        url: '/http-server',
        name: 'ui.helps.help.httpServerSettings',
        templatePromise: helpTemplate('httpServerSettings.html'),
        menuTr: 'systemSettings.httpServerSettings'
    },
    {
        url: '/password',
        name: 'ui.helps.help.password',
        templatePromise: helpTemplate('password.html'),
        menuTr: 'systemSettings.passwordSettings'
    },
    {
        url: '/thread-pools',
        name: 'ui.helps.help.threadPools',
        templatePromise: helpTemplate('threadPools.html'),
        menuTr: 'systemSettings.threadPools'
    },
    {
        url: '/system-purge',
        name: 'ui.helps.help.systemPurge',
        templatePromise: helpTemplate('systemPurge.html'),
        menuTr: 'systemSettings.purgeSettings'
    },
    {
        url: '/ui',
        name: 'ui.helps.help.ui',
        templatePromise: helpTemplate('ui.html'),
        menuTr: 'ui.settings'
    },
    {
        url: '/config-backup',
        name: 'ui.helps.help.configBackup',
        templatePromise: helpTemplate('configBackup.html'),
        menuTr: 'systemSettings.backupSettings'
    },
    {
        url: '/sql-backup',
        name: 'ui.helps.help.sqlBackup',
        templatePromise: helpTemplate('sqlBackup.html'),
        menuTr: 'systemSettings.H2DatabaseBackupSettings'
    },
    {
        url: '/permissions',
        name: 'ui.helps.help.permissions',
        templatePromise: helpTemplate('permissions.html'),
        menuTr: 'header.systemPermissions'
    },
    {
        name: 'ui.settings.systemStatus',
        url: '/system-status',
        template: '<ma-ui-system-status-page flex="noshrink" layout="column"><ma-ui-system-status-page>',
        menuTr: 'ui.settings.systemStatus',
        menuIcon: 'new_releases',
        permission: ['superadmin'],
        menuHidden: true,
        params: {
            helpPage: 'ui.helps.help.systemStatus'
        },
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/systemStatusPage/systemStatusPage'
                    ).then((systemStatusPage) => {
                        angular.module('maUiSystemStatusState', []).component('maUiSystemStatusPage', systemStatusPage.default);
                        $injector.loadNewModules(['maUiSystemStatusState']);
                    });
                }
            ]
        }
    },
    {
        name: 'ui.settings.systemStatus.auditTrail',
        templatePromise: systemStatusTemplate('auditTrail.html'),
        url: '/audit-trail',
        menuTr: 'ui.settings.systemStatus.auditTrail',
        menuHidden: true,
        params: {
            dateBar: {
                rollupControls: false
            }
        }
    },
    {
        name: 'ui.settings.systemStatus.loggingConsole',
        templatePromise: systemStatusTemplate('loggingConsole.html'),
        url: '/logging-console?filenameFilter&filename',
        menuTr: 'ui.settings.systemStatus.loggingConsole',
        menuHidden: true
    },
    {
        name: 'ui.settings.systemStatus.internalMetrics',
        templatePromise: systemStatusTemplate('internalMetrics.html'),
        url: '/internal-metrics',
        menuTr: 'ui.settings.systemStatus.internalMetrics',
        menuHidden: true
    },
    {
        name: 'ui.settings.systemStatus.workItems',
        templatePromise: systemStatusTemplate('workItems.html'),
        url: '/work-items',
        menuTr: 'ui.settings.systemStatus.workItems',
        menuHidden: true
    },
    {
        name: 'ui.settings.systemStatus.threads',
        templatePromise: systemStatusTemplate('threads.html'),
        url: '/threads',
        menuTr: 'ui.settings.systemStatus.threads',
        menuHidden: true
    },
    {
        name: 'ui.settings.systemStatus.serverInfo',
        templatePromise: systemStatusTemplate('serverInfo.html'),
        url: '/server-info',
        menuTr: 'ui.settings.systemStatus.serverInfo',
        menuHidden: true
    },
    {
        name: 'ui.settings.importExport',
        url: '/import-export',
        template: '<ma-ui-import-export-page><ma-ui-import-export-page>',
        menuTr: 'header.emport',
        menuIcon: 'import_export',
        permission: ['superadmin'],
        menuHidden: true,
        showInUtilities: true,
        params: {
            helpPage: 'ui.helps.help.importExport'
        },
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/importExportPage/importExportPage'
                    ).then((importExportPage) => {
                        angular.module('maUiImportExportState', []).component('maUiImportExportPage', importExportPage.default);
                        $injector.loadNewModules(['maUiImportExportState']);
                    });
                }
            ]
        }
    },
    {
        name: 'ui.settings.pointValueImport',
        url: '/point-value-import',
        template: '<ma-ui-point-value-import-page><ma-ui-point-value-import-page>',
        menuTr: 'ui.app.pointValueImport',
        menuIcon: 'file_upload',
        permission: ['superadmin'],
        menuHidden: true,
        showInUtilities: true,
        params: {
            helpPage: 'ui.helps.help.pointValueImport'
        },
        resolve: {
            loadMyDirectives: [
                '$injector',
                function ($injector) {
                    return import(
                        /* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/pointValueImportPage/pointValueImportPage'
                    ).then((pointValueImportPage) => {
                        angular.module('maUiPointValueImportState', []).component('maUiPointValueImportPage', pointValueImportPage.default);
                        $injector.loadNewModules(['maUiPointValueImportState']);
                    });
                }
            ]
        }
    },
    {
        name: 'ui.helps.help.pointValueImport',
        url: '/point-value-import/help',
        templatePromise: helpTemplate('pointValueImport.html'),
        menuTr: 'ui.app.pointValueImport'
    },
    {
        name: 'ui.helps.help.eventHandlers',
        url: '/event-handlers/help',
        templatePromise: helpTemplate('eventHandlers.html'),
        menuTr: 'ui.app.eventHandlers'
    },
    {
        name: 'ui.helps.help.eventHandlers.email',
        menuTr: 'ui.dox.eventHandlers.email',
        url: '/email-event-handler',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('emailEventHandler.html')
            }
        }
    },
    {
        name: 'ui.helps.help.eventHandlers.setPoint',
        menuTr: 'ui.dox.eventHandlers.setPoint',
        url: '/setPoint-event-handler',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('setPointEventHandler.html')
            }
        }
    },
    {
        name: 'ui.helps.help.eventHandlers.process',
        menuTr: 'ui.dox.eventHandlers.process',
        url: '/process-event-handler',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('processEventHandler.html')
            }
        }
    },
    {
        name: 'ui.helps.help.eventHandlers.script',
        menuTr: 'ui.dox.eventHandlers.script',
        url: '/script-event-handler',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('scriptEventHandler.html')
            }
        }
    },

    {
        name: 'ui.settings.systemStatus.dataSourcesPerformance',
        url: '/ds-performance',
        menuTr: 'ui.settings.systemStatus.dataSourcesPerformance',
        templatePromise: systemStatusTemplate('dataSourcesPerformance.html'),
        menuHidden: true
    },
    {
        url: '/mailing-lists/help',
        name: 'ui.helps.help.mailingList',
        templatePromise: helpTemplate('mailingLists.html'),
        menuTr: 'ui.app.mailingLists'
    },
    {
        name: 'ui.helps.help.virtualSerialPort',
        url: '/virtual-serial-port/help',
        templatePromise: helpTemplate('virtualSerialPort.html'),
        menuTr: 'systemSettings.comm.virtual.serialPorts'
    },
    {
        name: 'ui.helps.help.scriptingEditor',
        url: '/scripting-editor/help',
        templatePromise: helpTemplate('scriptingEditor.html'),
        menuTr: 'ui.app.mangoJavaScript'
    },
    {
        name: 'ui.helps.help.freeMarkerTemplates',
        url: '/scripting-editor/help',
        templatePromise: helpTemplate('freeMarkerTemplates.html'),
        menuTr: 'ui.dox.freeMarker'
    },
    {
        name: 'ui.helps.help.eventDetectors',
        menuTr: 'dox.eventDetectors',
        url: '/event-detectors',
        templatePromise: helpTemplate('eventDetectors.html')
    },
    {
        name: 'ui.helps.help.dataPointSelector',
        menuTr: 'ui.dox.dataPointSelector',
        url: '/data-point-selector',
        templatePromise: helpTemplate('dataPointSelector.html')
    },
    {
        name: 'ui.helps.help.eventDetectors.rateOfChange',
        menuTr: 'dox.eventDetectors.rateOfChange',
        url: '/rate-of-change',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('rateOfChange.html')
            }
        }
    },
    {
        name: 'ui.helps.help.eventDetectors.change',
        menuTr: 'dox.eventDetectors.change',
        url: '/change',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('change.html')
            }
        }
    },
    {
        name: 'ui.helps.help.eventDetectors.noChange',
        menuTr: 'dox.eventDetectors.noChange',
        url: '/no-change',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('noChange.html')
            }
        }
    },
    {
        name: 'ui.helps.help.eventDetectors.noUpdate',
        menuTr: 'dox.eventDetectors.noUpdate',
        url: '/no-update',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('noUpdate.html')
            }
        }
    },
    {
        name: 'ui.helps.help.eventDetectors.state',
        menuTr: 'dox.eventDetectors.state',
        url: '/state',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('state.html')
            }
        }
    },
    {
        name: 'ui.helps.help.eventDetectors.stateChangeCount',
        menuTr: 'dox.eventDetectors.stateChangeCount',
        url: '/state-change-count',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('stateChangeCount.html')
            }
        }
    },
    {
        name: 'ui.helps.help.eventDetectors.highLimit',
        menuTr: 'dox.eventDetectors.highLimit',
        url: '/high-limit',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('highLimit.html')
            }
        }
    },
    {
        name: 'ui.helps.help.eventDetectors.lowLimit',
        menuTr: 'dox.eventDetectors.lowLimit',
        url: '/low-limit',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('lowLimit.html')
            }
        }
    },
    {
        name: 'ui.helps.help.eventDetectors.analogChange',
        menuTr: 'dox.eventDetectors.analogChange',
        url: '/analog-change',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('analogChange.html')
            }
        }
    },
    {
        name: 'ui.helps.help.eventDetectors.range',
        menuTr: 'dox.eventDetectors.range',
        url: '/range',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('range.html')
            }
        }
    },
    {
        name: 'ui.helps.help.eventDetectors.positiveCusum',
        menuTr: 'dox.eventDetectors.positiveCusum',
        url: '/positive-cusum',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('positiveCusum.html')
            }
        }
    },
    {
        name: 'ui.helps.help.eventDetectors.negativeCusum',
        menuTr: 'dox.eventDetectors.negativeCusum',
        url: '/negative-cusum',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('negativeCusum.html')
            }
        }
    },
    {
        name: 'ui.helps.help.eventDetectors.smoothness',
        menuTr: 'dox.eventDetectors.smoothness',
        url: '/smoothness',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('smoothness.html')
            }
        }
    }
];
