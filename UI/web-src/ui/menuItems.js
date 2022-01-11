/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';
import StackTrace from 'stacktrace-js';

const helpTemplate = function(fileName) {
    return function() {
        return import(/* webpackMode: "lazy-once", webpackChunkName: "ui.help" */ './views/help/' + fileName);
    };
};

const systemSettingsTemplate = function(fileName) {
    return function() {
        return import(/* webpackMode: "lazy-once", webpackChunkName: "ui.settings" */ './systemSettings/' + fileName);
    };
};

const systemStatusTemplate = function(fileName) {
    return function() {
        return import(/* webpackMode: "lazy-once", webpackChunkName: "ui.settings" */ './systemStatus/' + fileName);
    };
};

const examplesTemplate = function(fileName) {
    return function() {
        return import(/* webpackMode: "lazy-once", webpackChunkName: "ui.examples" */ './views/examples/' + fileName);
    };
};

// TODO Mango 4.0 remove permission references and use systemPermission 

export default [
    {
        name: 'login',
        url: '/login?username&error',
        menuHidden: true,
        menuIcon: 'exit_to_app',
        menuTr: 'header.login',
        permission: ['anonymous'],
        templatePromise() {
            return import(/* webpackMode: "eager" */
                    './views/login.html');
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
            return import(/* webpackMode: "eager" */
                    './views/resetPassword.html');
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
            return import(/* webpackMode: "eager" */
                './views/forgotPassword.html');
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
            return import(/* webpackMode: "eager" */
                    './views/changePassword.html');
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
            return import(/* webpackMode: "eager" */
                    './views/verifyEmail.html');
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
            return import(/* webpackMode: "eager" */
                    './views/verifyEmailToken.html');
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
            return import(/* webpackMode: "eager" */
                    './views/registerUser.html');
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
            maUiAgreeToLicensePage: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.main" */
                        './components/licensePage/licensePage').then(licensePage => {
                    angular.module('maUiLicensePage', [])
                        .component('maUiLicensePage', licensePage.default);
                    $injector.loadNewModules(['maUiLicensePage']);
                });
            }]
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
            return import(/* webpackMode: "eager" */
                    './views/systemSetup.html');
        }
    },
    {
        name: 'ui',
        url: '?helpOpen',
        'abstract': true,
        menuHidden: true,
        menuTr: 'ui.app.ui',
        templatePromise() {
            return import(/* webpackMode: "lazy", webpackChunkName: "ui.main" */
                    './views/main.html');
        },
        permission: ['user'],
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.main" */
                        './mainModule').then(() => {
                    $injector.loadNewModules(['maUiRootState']);
                });
            }],
            rootScopeData: ['$rootScope', 'maUiServerInfo', function($rootScope, maUiServerInfo) {
                return maUiServerInfo.getPostLoginData().then(serverInfo => {
                    $rootScope.serverInfo = serverInfo;
                });
            }]
        }
    },
    {
        name: 'ui.notFound',
        templatePromise() {
            return import(/* webpackMode: "lazy", webpackChunkName: "ui.main" */
                    './views/notFound.html');
        },
        url: '/not-found?path',
        menuHidden: true,
        menuTr: 'ui.app.pageNotFound',
        weight: 3000
    },
    {
        name: 'ui.unauthorized',
        templatePromise() {
            return import(/* webpackMode: "lazy", webpackChunkName: "ui.main" */
                './views/unauthorized.html');
        },
        url: '/unauthorized?path',
        menuHidden: true,
        menuTr: 'ui.app.unauthorized',
        weight: 3000
    },
    {
        name: 'ui.error',
        templatePromise() {
            return import(/* webpackMode: "lazy", webpackChunkName: "ui.main" */
                './views/error.html');
        },
        resolve: {
            errorFrames: ['$stateParams', function($stateParams) {
                if ($stateParams.error && $stateParams.error instanceof Error) {
                    try {
                        return StackTrace.fromError($stateParams.error, {offline: true});
                    } catch (e) {
                    }
                }
            }]
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
        controller: ['$scope', 'errorFrames', '$stateParams', function($scope, errorFrames, $stateParams) {
            $scope.frames = errorFrames;
            if (Array.isArray(errorFrames)) {
                const stackTraceLines = errorFrames.map(frame => {
                    return `\tat ${frame.functionName} (${frame.fileName}:${frame.lineNumber}:${frame.columnNumber})`;
                });
                
                stackTraceLines.unshift('' + $stateParams.error);
                $scope.stackTrace = stackTraceLines.join('\n');
            }
        }]
    },
    {
        name: 'ui.serverError',
        url: '/server-error',
        menuHidden: true,
        menuTr: 'ui.app.serverError',
        weight: 3000,
        templatePromise() {
            return import(/* webpackMode: "lazy", webpackChunkName: "ui.main" */
                    './views/serverError.html');
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
            helpPage: 'ui.help.watchList'
        },
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.main" */
                        './directives/watchList/watchListPage').then(watchListPage => {
                    angular.module('maUiWatchListState', [])
                        .directive('maUiWatchListPage', watchListPage.default);
                    $injector.loadNewModules(['maUiWatchListState']);
                });
            }]
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
            helpPage: 'ui.help.dataPointDetails'
        },
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.main" */
                        './components/dataPointDetails/dataPointDetails').then(dataPointDetails => {
                    angular.module('maUiDataPointDetailsState', [])
                        .component('maUiDataPointDetails', dataPointDetails.default);
                    $injector.loadNewModules(['maUiDataPointDetailsState']);
                });
            }]
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
            helpPage: 'ui.help.events'
        },
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.main" */
                        './components/eventsPage/eventsPage').then(eventsPage => {
                    angular.module('maUiEventsState', [])
                        .component('maUiEventsPage', eventsPage.default);
                    $injector.loadNewModules(['maUiEventsState']);
                });
            }]
        }
    },
    {
        name: 'ui.userProfile',
        url: '/user-profile',
        template: '<ma-ui-user-profile-page flex="noshrink" layout="column"><ma-ui-user-profile-page>',
        menuTr: 'header.userProfile',
        menuIcon: 'person',
        params: {
            helpPage: 'ui.help.users'
        },
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.main" */
                        './components/userProfile/userProfile').then(userProfile => {
                    angular.module('maUiUserProfileState', [])
                        .component('maUiUserProfilePage', userProfile.default);
                    $injector.loadNewModules(['maUiUserProfileState']);
                });
            }]
        },
        menuHidden: true
    },
    {
        name: 'ui.help',
        url: '/help',
        menuTr: 'header.help',
        menuIcon: 'help',
        submenu: true,
        weight: 2000,
        params: {
            sidebar: null
        }
    },
    {
        url: '/getting-started',
        name: 'ui.help.gettingStarted',
        templatePromise: helpTemplate('gettingStarted.html'),
        menuTr: 'ui.dox.gettingStarted',
        weight: 900
    },
    {
        url: '/watch-list',
        name: 'ui.help.watchList',
        templatePromise: helpTemplate('watchList.html'),
        menuTr: 'ui.dox.watchList'
    },
    {
        url: '/data-point-details',
        name: 'ui.help.dataPointDetails',
        templatePromise: helpTemplate('dataPointDetails.html'),
        menuTr: 'ui.dox.dataPointDetails'
    },
    {
        url: '/events',
        name: 'ui.help.events',
        templatePromise: helpTemplate('events.html'),
        menuTr: 'ui.dox.events'
    },
    {
        url: '/date-bar',
        name: 'ui.help.dateBar',
        templatePromise: helpTemplate('dateBar.html'),
        menuTr: 'ui.dox.dateBar'
    },
    {
        url: '/ui-settings',
        name: 'ui.help.uiSettings',
        templatePromise: helpTemplate('uiSettings.html'),
        menuTr: 'ui.app.uiSettings'
    },
    {
        url: '/watch-list-builder',
        name: 'ui.help.watchListBuilder',
        templatePromise: helpTemplate('watchListBuilder.html'),
        menuTr: 'ui.app.watchListBuilder'
    },
    {
        url: '/custom-pages',
        name: 'ui.help.customPages',
        templatePromise: helpTemplate('customPages.html'),
        menuTr: 'ui.dox.customPages'
    },
    {
        url: '/menu-editor',
        name: 'ui.help.menuEditor',
        templatePromise: helpTemplate('menuEditor.html'),
        menuTr: 'ui.dox.menuEditor'
    },
    {
        url: '/users',
        name: 'ui.help.users',
        templatePromise: helpTemplate('users.html'),
        menuTr: 'header.users'
    },
    {
        url: '/custom-dashboards',
        name: 'ui.help.customDashboards',
        templatePromise: helpTemplate('customDashboards.html'),
        menuTr: 'ui.dox.customDashboards'
    },
    {
        url: '/system-status',
        name: 'ui.help.systemStatus',
        templatePromise: helpTemplate('systemStatus.html'),
        menuTr: 'ui.settings.systemStatus'
    },
    {
        url: '/data-sources',
        name: 'ui.help.dataSources',
        templatePromise: helpTemplate('dataSources.html'),
        menuTr: 'header.dataSources'
    },
    {
        url: '/publishers',
        name: 'ui.help.publishers',
        templatePromise: helpTemplate('publishers.html'),
        menuTr: 'header.publishers'
    },
    {
        url: '/purge-now',
        name: 'ui.help.purgeNow',
        templatePromise: helpTemplate('purgeNow.html'),
        menuTr: 'dsEdit.purge.purgeNow'
    },
    {
        url: '/ds-purge-override',
        name: 'ui.help.dsPurgeOverride',
        templatePromise: helpTemplate('dsPurgeOverride.html'),
        menuTr: 'ui.dox.dsPurgeOverride'
    },
    {
        url: '/dp-purge-override',
        name: 'ui.help.dpPurgeOverride',
        templatePromise: helpTemplate('dpPurgeOverride.html'),
        menuTr: 'ui.dox.dpPurgeOverride'
    },
    {
        url: '/alarms',
        name: 'ui.help.alarms',
        templatePromise: helpTemplate('alarms.html'),
        menuTr: 'ui.dox.alarms'
    },
    {
        url: '/textRenderer',
        name: 'ui.help.textRenderer',
        templatePromise: helpTemplate('textRenderer.html'),
        menuTr: 'ui.dox.textRenderer'
    },
    {
        url: '/logging',
        name: 'ui.help.loggingProperties',
        templatePromise: helpTemplate('loggingProperties.html'),
        menuTr: 'ui.dox.logging'
    },
    {
        url: '/tags',
        name: 'ui.help.tags',
        templatePromise: helpTemplate('tags.html'),
        menuTr: 'ui.dox.tags'
    },
    {
        url: '/pointProperties',
        name: 'ui.help.pointProperties',
        templatePromise: helpTemplate('pointProperties.html'),
        menuTr: 'ui.dox.pointProperties'
    },
    {
        url: '/dataPointProperties',
        name: 'ui.help.dataPointProperties',
        templatePromise: helpTemplate('dataPointProperties.html'),
        menuTr: 'ui.dox.dataPoint'
    },
    {
        url: '/view-page/{pageXid}',
        name: 'ui.viewPage',
        template: '<ma-ui-page-view xid="{{pageXid}}" flex layout="column"></ma-ui-page-view>',
        menuTr: 'ui.app.viewPage',
        menuHidden: true,
        controller: ['$scope', '$stateParams', function ($scope, $stateParams) {
            $scope.pageXid = $stateParams.pageXid;
        }],
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
        name: 'ui.settings.home',
        url: '/home',
        template: '<ma-ui-admin-home-page></ma-ui-admin-home-page>',
        menuTr: 'ui.dox.home',
        menuIcon: 'home',
        params: {
            dateBar: {rollupControls: true},
            helpPage: 'ui.help.gettingStarted'
        },
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/adminHomePage/adminHomePage').then(adminHomePage => {
                    angular.module('maUiAdminHomePage', [])
                        .component('maUiAdminHomePage', adminHomePage.default);
                    $injector.loadNewModules(['maUiAdminHomePage']);
                });
            }]
        },
        weight: 990,
        permission: ['superadmin']
    },
    {
        name: 'ui.settings.dataSources',
        url: '/data-sources/{xid}?dataSourceId',
        template: '<ma-ui-data-source-page flex="noshrink" layout="column"><ma-ui-data-source-page>',
        menuTr: 'header.dataSources',
        menuIcon: 'device_hub',
        systemPermission: ['permissionDatasource'],
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/dataSourcePage/dataSourcePage').then(dataSourcePage => {
                    angular.module('maDataSourcePage', [])
                        .component('maUiDataSourcePage', dataSourcePage.default);
                    $injector.loadNewModules(['maDataSourcePage']);
                });
            }]
        },
        params: {
            helpPage: 'ui.help.dataSources'
        }
    },
    {
        name: 'ui.settings.publishers',
        url: '/publishers/{xid}',
        template: '<ma-ui-publisher-page flex="noshrink" layout="column"><ma-ui-publisher-page>',
        menuTr: 'header.publishers',
        menuIcon: 'router',
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/publisherPage/publisherPage').then(publisherPage => {
                    angular.module('maPublisherPage', [])
                        .component('maUiPublisherPage', publisherPage.default);
                    $injector.loadNewModules(['maPublisherPage']);
                });
            }]
        },
        params: {
            helpPage: 'ui.help.publishers'
        },
        permission: ['superadmin']
    },
    {
        url: '/edit-pages/{pageXid}',
        name: 'ui.settings.editPages',
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
            helpPage: 'ui.help.customPages'
        }
    },
    {
        url: '/edit-menu',
        name: 'ui.settings.editMenu',
        templatePromise() {
            return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */ './views/editMenu.html');
        },
        menuTr: 'ui.app.editMenu',
        menuIcon: 'toc',
        systemPermission: ['ui.settings.edit'],
        params: {
            helpPage: 'ui.help.menuEditor'
        }
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
        url: '/ui-settings',
        name: 'ui.settings.uiSettings',
        template: '<ma-ui-settings-page></ma-ui-settings-page>',
        menuTr: 'ui.app.uiSettings',
        menuIcon: 'color_lens',
        systemPermission: ['ui.settings.edit'],
        params: {
            helpPage: 'ui.help.uiSettings'
        },
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/uiSettingsPage/uiSettingsPage').then(uiSettingsPage => {
                    angular.module('maUiSettingsPage', [])
                        .component('maUiSettingsPage', uiSettingsPage.default);
                    $injector.loadNewModules(['maUiSettingsPage']);
                });
            }]
        }
    },
    {
        name: 'ui.settings.users',
        url: '/users/{username}',
        template: '<ma-ui-users-page flex="noshrink" layout="column"><ma-ui-users-page>',
        menuTr: 'header.users',
        menuIcon: 'people',
        systemPermission: ['users.view'],
        params: {
            helpPage: 'ui.help.users'
        },
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/usersPage/usersPage').then(usersPage => {
                    angular.module('maUiUsersState', [])
                        .component('maUiUsersPage', usersPage.default);
                    $injector.loadNewModules(['maUiUsersState']);
                });
            }]
        }
    },
    {
        name: 'ui.settings.system',
        url: '/system',
        template: '<ma-ui-system-settings-page flex="noshrink" layout="column"><ma-ui-system-settings-page>',
        menuTr: 'header.systemSettings',
        menuIcon: 'settings',
        permission: ['superadmin'],
        // params: {
        //     helpPage: 'ui.help.systemSettings'
        // },
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/systemSettingsPage/systemSettingsPage').then(systemSettingsPage => {
                    angular.module('maUiSystemSettingsState', [])
                        .component('maUiSystemSettingsPage', systemSettingsPage.default);
                    $injector.loadNewModules(['maUiSystemSettingsState']);
                });
            }]
        }
    },
    {
        name: 'ui.settings.system.systemInformation',
        params: {
            helpPage: 'ui.help.systemInformation'
        },
        templatePromise: systemSettingsTemplate('systemInformation.html'),
        url: '/information',
        menuTr: 'systemSettings.systemInformation',
        menuHidden: true
    },
    {
        url: '/system-information',
        name: 'ui.help.systemInformation',
        templatePromise: helpTemplate('systemInformation.html'),
        menuTr: 'systemSettings.systemInformation'
    },
    {
        name: 'ui.settings.system.language',
        params: {
            helpPage: 'ui.help.language'
        },
        templatePromise: systemSettingsTemplate('language.html'),
        url: '/language',
        menuTr: 'systemSettings.languageSettings',
        menuHidden: true
    },
    {
        url: '/language',
        name: 'ui.help.language',
        templatePromise: helpTemplate('language.html'),
        menuTr: 'systemSettings.languageSettings'
    },
    {
        name: 'ui.settings.system.systemAlarmLevels',
        params: {
            helpPage: 'ui.help.systemAlarmLevels'
        },
        templatePromise: systemSettingsTemplate('systemAlarmLevels.html'),
        url: '/system-alarm-levels',
        menuTr: 'systemSettings.systemAlarmLevels',
        menuHidden: true
    },
    {
        url: '/system-alarm-levels',
        name: 'ui.help.systemAlarmLevels',
        templatePromise: helpTemplate('systemAlarmLevels.html'),
        menuTr: 'systemSettings.systemAlarmLevels'
    },
    {
        name: 'ui.settings.system.auditAlarmLevels',
        params: {
            helpPage: 'ui.help.auditAlarmLevels'
        },
        templatePromise: systemSettingsTemplate('auditAlarmLevels.html'),
        url: '/audit-alarm-levels',
        menuTr: 'systemSettings.auditAlarmLevels',
        menuHidden: true
    },
    {
        url: '/audit-alarm-levels',
        name: 'ui.help.auditAlarmLevels',
        templatePromise: helpTemplate('auditAlarmLevels.html'),
        menuTr: 'systemSettings.auditAlarmLevels'
    },
    {
        name: 'ui.settings.system.email',
        params: {
            helpPage: 'ui.help.emailSettings'
        },
        templatePromise: systemSettingsTemplate('email.html'),
        url: '/email',
        menuTr: 'systemSettings.emailSettings',
        menuHidden: true
    },
    {
        url: '/email',
        name: 'ui.help.emailSettings',
        templatePromise: helpTemplate('emailSettings.html'),
        menuTr: 'systemSettings.emailSettings'
    },
    {
        name: 'ui.settings.system.http',
        params: {
            helpPage: 'ui.help.httpSettings'
        },
        templatePromise: systemSettingsTemplate('httpSettings.html'),
        url: '/http',
        menuTr: 'systemSettings.httpSettings',
        menuHidden: true
    },
    {
        url: '/http',
        name: 'ui.help.httpSettings',
        templatePromise: helpTemplate('httpSettings.html'),
        menuTr: 'systemSettings.httpSettings'
    },
    {
        name: 'ui.settings.system.httpServer',
        params: {
            helpPage: 'ui.help.httpServerSettings'
        },
        templatePromise: systemSettingsTemplate('httpServerSettings.html'),
        url: '/http-server',
        menuTr: 'systemSettings.httpServerSettings',
        menuHidden: true
    },
    {
        url: '/http-server',
        name: 'ui.help.httpServerSettings',
        templatePromise: helpTemplate('httpServerSettings.html'),
        menuTr: 'systemSettings.httpServerSettings'
    },
    {
        name: 'ui.settings.system.password',
        params: {
            helpPage: 'ui.help.password'
        },
        templatePromise: systemSettingsTemplate('passwordSettings.html'),
        url: '/password',
        menuTr: 'systemSettings.passwordSettings',
        menuHidden: true
    },
    {
        url: '/password',
        name: 'ui.help.password',
        templatePromise: helpTemplate('password.html'),
        menuTr: 'systemSettings.passwordSettings'
    },
    {
        name: 'ui.settings.system.threadPools',
        params: {
            helpPage: 'ui.help.threadPools'
        },
        templatePromise: systemSettingsTemplate('threadPools.html'),
        url: '/thread-pools',
        menuTr: 'systemSettings.threadPools',
        menuHidden: true
    },
    {
        url: '/thread-pools',
        name: 'ui.help.threadPools',
        templatePromise: helpTemplate('threadPools.html'),
        menuTr: 'systemSettings.threadPools'
    },
    {
        name: 'ui.settings.system.purge',
        params: {
            helpPage: 'ui.help.systemPurge'
        },
        templatePromise: systemSettingsTemplate('purgeSettings.html'),
        url: '/purge',
        menuTr: 'systemSettings.purgeSettings',
        menuHidden: true
    },
    {
        url: '/system-purge',
        name: 'ui.help.systemPurge',
        templatePromise: helpTemplate('systemPurge.html'),
        menuTr: 'systemSettings.purgeSettings'
    },
    {
        name: 'ui.settings.system.ui',
        params: {
            helpPage: 'ui.help.ui'
        },
        templatePromise: systemSettingsTemplate('uiModule.html'),
        url: '/ui',
        menuTr: 'ui.settings',
        menuHidden: true
    },
    {
        url: '/ui',
        name: 'ui.help.ui',
        templatePromise: helpTemplate('ui.html'),
        menuTr: 'ui.settings'
    },
    {
        name: 'ui.settings.system.configBackup',
        params: {
            helpPage: 'ui.help.configBackup'
        },
        templatePromise: systemSettingsTemplate('configBackup.html'),
        url: '/config-backup',
        menuTr: 'systemSettings.backupSettings',
        menuHidden: true
    },
    {
        url: '/config-backup',
        name: 'ui.help.configBackup',
        templatePromise: helpTemplate('configBackup.html'),
        menuTr: 'systemSettings.backupSettings'
    },
    {
        name: 'ui.settings.system.sqlBackup',
        params: {
            helpPage: 'ui.help.sqlBackup'
        },
        templatePromise: systemSettingsTemplate('sqlBackup.html'),
        url: '/sql-backup',
        menuTr: 'systemSettings.H2DatabaseBackupSettings',
        menuHidden: true
    },
    {
        url: '/sql-backup',
        name: 'ui.help.sqlBackup',
        templatePromise: helpTemplate('sqlBackup.html'),
        menuTr: 'systemSettings.H2DatabaseBackupSettings'
    },
    {
        name: 'ui.settings.permissions',
        params: {
            helpPage: 'ui.help.permissions'
        },
        template: '<ma-ui-permissions-page flex="noshrink" layout="column"></ma-ui-permissions-page>',
        url: '/permissions',
        menuTr: 'header.systemPermissions',
        menuIcon: 'supervised_user_circle',
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/permissionsPage/permissionsPage').then(permissionsPage => {
                    angular.module('maUiPermissionsPage', [])
                        .component('maUiPermissionsPage', permissionsPage.default);
                    $injector.loadNewModules(['maUiPermissionsPage']);
                });
            }]
        },
        permission: ['superadmin']
    },
    {
        url: '/permissions',
        name: 'ui.help.permissions',
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
            helpPage: 'ui.help.systemStatus'
        },
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/systemStatusPage/systemStatusPage').then(systemStatusPage => {
                    angular.module('maUiSystemStatusState', [])
                        .component('maUiSystemStatusPage', systemStatusPage.default);
                    $injector.loadNewModules(['maUiSystemStatusState']);
                });
            }]
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
        name: 'ui.settings.watchListBuilder',
        url: '/watch-list-builder/{watchListXid}',
        template: '<ma-ui-watch-list-builder></ma-ui-watch-list-builder>',
        menuTr: 'ui.app.watchListBuilder',
        menuIcon: 'playlist_add_check',
        params: {
            watchList: null,
            helpPage: 'ui.help.watchListBuilder'
        },
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                const p1 = import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/watchListBuilder/watchListBuilder');

                const p2 = import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './directives/bracketEscape/bracketEscape');
                
                return Promise.all([p1, p2]).then(([watchListBuilder, bracketEscape]) => {
                    angular.module('maUiWatchListBuilderState', [])
                        .directive('maUiBracketEscape', bracketEscape.default)
                        .directive('maUiWatchListBuilder', watchListBuilder.default);
                    $injector.loadNewModules(['maUiWatchListBuilderState']);
                });
            }]
        }
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
            helpPage: 'ui.help.importExport'
        },
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/importExportPage/importExportPage').then(importExportPage => {
                    angular.module('maUiImportExportState', [])
                        .component('maUiImportExportPage', importExportPage.default);
                    $injector.loadNewModules(['maUiImportExportState']);
                });
            }]
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
            helpPage: 'ui.help.pointValueImport'
        },
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/pointValueImportPage/pointValueImportPage').then(pointValueImportPage => {
                    angular.module('maUiPointValueImportState', [])
                        .component('maUiPointValueImportPage', pointValueImportPage.default);
                    $injector.loadNewModules(['maUiPointValueImportState']);
                });
            }]
        }
    },
    {
        name: 'ui.help.pointValueImport',
        url: '/point-value-import/help',
        templatePromise: helpTemplate('pointValueImport.html'),
        menuTr: 'ui.app.pointValueImport'
    },
    {
        name: 'ui.settings.modules',
        url: '/modules',
        template: '<ma-ui-modules-page><ma-ui-modules-page>',
        menuTr: 'header.modules',
        menuIcon: 'extension',
        permission: ['superadmin'],
        params: {
            helpPage: 'ui.help.modules'
        },
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/modulesPage/modulesPage').then(modulesPage => {
                    angular.module('maUiModulesState', [])
                        .directive('maUiModulesPage', modulesPage.default);
                    $injector.loadNewModules(['maUiModulesState']);
                });
            }]
        }
    },
    {
        name: 'ui.settings.modules.upgrade',
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
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/upgradePage/upgradePage').then(upgradePage => {
                    angular.module('maUiUpgradeState', [])
                        .component('maUiUpgradePage', upgradePage.default);
                    $injector.loadNewModules(['maUiUpgradeState']);
                });
            }]
        }
    },
    {
        name: 'ui.settings.modules.offlineUpgrade',
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
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/offlineUpgradePage/offlineUpgradePage').then(offlineUpgradePage => {
                    angular.module('maUiOfflineUpgradeState', [])
                        .directive('maUiOfflineUpgradePage', offlineUpgradePage.default);
                    $injector.loadNewModules(['maUiOfflineUpgradeState']);
                });
            }]
        }
    },
    {
        name: 'ui.settings.fileStores',
        url: '/file-stores?fileStore&folderPath&editFile',
        template: '<ma-file-store-browser flex preview="true" ng-model="tmp"><ma-file-store-browser>',
        menuTr: 'ui.app.fileStores',
        menuIcon: 'file_upload',
        permission: ['superadmin']
    },
    {
        name: 'ui.settings.jsonStore',
        url: '/json-store',
        template: `<div>
                <md-button class="md-raised" ui-sref="ui.settings.jsonStoreEditor">
                    <md-icon>add</md-icon>
                    <span ma-tr="ui.app.jsonStoreNew"></span>
                </md-button>
            </div>
            <ma-json-store-table edit-clicked="$state.go(\'ui.settings.jsonStoreEditor\', {xid: $item.xid})"><ma-json-store-table>`,
        menuTr: 'ui.app.jsonStorePage',
        menuIcon: 'sd_storage',
        permission: ['superadmin'],
        menuHidden: true,
        showInUtilities: true
    },
    {
        name: 'ui.settings.jsonStoreEditor',
        url: '/json-store-editor/{xid}',
        template: `<div>
                <md-button class="md-raised" ui-sref="ui.settings.jsonStore">
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
        name: 'ui.settings.bulkDataPointEdit',
        url: '/bulk-data-point-edit',
        template: '<ma-ui-bulk-data-point-edit-page flex="noshrink" layout="column"></ma-ui-bulk-data-point-edit-page>',
        menuTr: 'ui.app.bulkDataPointEdit',
        menuIcon: 'fitness_center',
        permission: ['superadmin'],
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/bulkDataPointEditPage/bulkDataPointEditPage').then(bulkDataPointEditPage => {
                    angular.module('maUiBulkDataPointEditState', [])
                        .component('maUiBulkDataPointEditPage', bulkDataPointEditPage.default);
                    $injector.loadNewModules(['maUiBulkDataPointEditState']);
                });
            }]
        }
    },
    {
        name: 'ui.settings.eventHandlers',
        url: '/event-handlers/{xid}?eventType&subType&referenceId1&referenceId2',
        template: '<ma-ui-event-handler-page flex="noshrink" layout="column"><ma-ui-event-handler-page>',
        menuTr: 'ui.app.eventHandlers',
        menuIcon: 'assignment_turned_in',
        permission: ['superadmin'],
        params: {
            helpPage: 'ui.help.eventHandlers'
        },
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/eventHandlerPage/eventHandlerPage').then(eventHandlerPage => {
                    angular.module('maUiEventHandlerPage', [])
                        .component('maUiEventHandlerPage', eventHandlerPage.default);
                    $injector.loadNewModules(['maUiEventHandlerPage']);
                });
            }]
        }
    },
    {
        name: 'ui.help.eventHandlers',
        url: '/event-handlers/help',
        templatePromise: helpTemplate('eventHandlers.html'),
        menuTr: 'ui.app.eventHandlers'
    },
    {
        name: 'ui.help.eventHandlers.email',
        menuTr: 'ui.dox.eventHandlers.email',
        url: '/email-event-handler',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('emailEventHandler.html')
            }
        }
    },
    {
        name: 'ui.help.eventHandlers.setPoint',
        menuTr: 'ui.dox.eventHandlers.setPoint',
        url: '/setPoint-event-handler',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('setPointEventHandler.html')
            }
        }
    },
    {
        name: 'ui.help.eventHandlers.process',
        menuTr: 'ui.dox.eventHandlers.process',
        url: '/process-event-handler',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('processEventHandler.html')
            }
        }
    },
    {
        name: 'ui.help.eventHandlers.script',
        menuTr: 'ui.dox.eventHandlers.script',
        url: '/script-event-handler',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('scriptEventHandler.html')
            }
        }
    },
    {
        name: 'ui.examples',
        url: '/examples',
        menuTr: 'ui.dox.examples',
        menuIcon: 'info',
        // menuHidden: true,
        systemPermission: ['ui.pages.edit'],
        submenu: true,
        weight: 2001
    },
    {
        name: 'ui.examples.basics',
        url: '/basics',
        menuTr: 'ui.dox.basics',
        menuIcon: 'fa-info-circle',
        weight: 995
    },
    {
        name: 'ui.examples.basics.angular',
        templatePromise: examplesTemplate('angular.html'),
        url: '/angular',
        menuTr: 'ui.dox.angular'
    },
    {
        name: 'ui.examples.basics.pointList',
        templatePromise: examplesTemplate('pointList.html'),
        url: '/point-list',
        menuTr: 'ui.dox.pointList'
    },
    {
        name: 'ui.examples.basics.getPointByXid',
        templatePromise: examplesTemplate('getPointByXid.html'),
        url: '/get-point-by-xid',
        menuTr: 'ui.dox.getPointByXid'
    },
    {
        name: 'ui.examples.basics.dataSourceAndDeviceList',
        templatePromise: examplesTemplate('dataSourceAndDeviceList.html'),
        url: '/data-source-and-device-list',
        menuTr: 'ui.dox.dataSourceAndDeviceList'
    },
    {
        name: 'ui.examples.basics.liveValues',
        templatePromise: examplesTemplate('liveValues.html'),
        url: '/live-values',
        menuTr: 'ui.dox.liveValues'
    },
    {
        name: 'ui.examples.basics.filters',
        templatePromise: examplesTemplate('filters.html'),
        url: '/filters',
        menuTr: 'ui.dox.filters'
    },
    {
        name: 'ui.examples.basics.datePresets',
        templatePromise: examplesTemplate('datePresets.html'),
        url: '/date-presets',
        menuTr: 'ui.dox.datePresets'
    },
    {
        name: 'ui.examples.basics.styleViaValue',
        templatePromise: examplesTemplate('styleViaValue.html'),
        url: '/style-via-value',
        menuTr: 'ui.dox.styleViaValue'
    },
    {
        name: 'ui.examples.basics.pointValues',
        templatePromise: examplesTemplate('pointValues.html'),
        url: '/point-values',
        menuTr: 'ui.dox.pointValues'
    },
    {
        name: 'ui.examples.basics.latestPointValues',
        templatePromise: examplesTemplate('latestPointValues.html'),
        url: '/latest-point-values',
        menuTr: 'ui.dox.latestPointValues'
    },
    {
        name: 'ui.examples.basics.clocksAndTimezones',
        templatePromise: examplesTemplate('clocksAndTimezones.html'),
        url: '/clocks-and-timezones',
        menuTr: 'ui.dox.clocksAndTimezones'
    },
    {
        name: 'ui.examples.singleValueDisplays',
        url: '/single-value-displays',
        menuTr: 'ui.dox.singleValueDisplays',
        menuIcon: 'fa-tachometer',
        weight: 996
    },
    {
        name: 'ui.examples.singleValueDisplays.gauges',
        templatePromise: examplesTemplate('gauges.html'),
        url: '/gauges',
        menuTr: 'ui.dox.gauges'
    },
    {
        name: 'ui.examples.singleValueDisplays.switchImage',
        templatePromise: examplesTemplate('switchImage.html'),
        url: '/switch-image',
        menuTr: 'ui.dox.switchImage'
    },
    {
        name: 'ui.examples.singleValueDisplays.ledIndicator',
        templatePromise: examplesTemplate('ledIndicator.html'),
        url: '/led-indicator',
        menuTr: 'ui.dox.ledIndicator'
    },
    {
        name: 'ui.examples.singleValueDisplays.bars',
        templatePromise: examplesTemplate('bars.html'),
        url: '/bars',
        menuTr: 'ui.dox.bars'
    },
    {
        name: 'ui.examples.singleValueDisplays.tanks',
        templatePromise: examplesTemplate('tanks.html'),
        url: '/tanks',
        menuTr: 'ui.dox.tanks'
    },
    {
        name: 'ui.examples.charts',
        url: '/charts',
        menuTr: 'ui.dox.charts',
        menuIcon: 'fa-area-chart',
        weight: 997
    },
    {
        name: 'ui.examples.charts.lineChart',
        templatePromise: examplesTemplate('lineChart.html'),
        url: '/line-chart',
        menuTr: 'ui.dox.lineChart'
    },
    {
        name: 'ui.examples.charts.heatMap',
        templatePromise: examplesTemplate('heatMap.html'),
        url: '/heat-map',
        menuTr: 'ui.dox.heatMap'
    },
    {
        name: 'ui.examples.charts.barChart',
        templatePromise: examplesTemplate('barChart.html'),
        url: '/bar-chart',
        menuTr: 'ui.dox.barChart'
    },
    {
        name: 'ui.examples.charts.advancedChart',
        templatePromise: examplesTemplate('advancedChart.html'),
        url: '/advanced-chart',
        menuTr: 'ui.dox.advancedChart'
    },
    {
        name: 'ui.examples.charts.stateChart',
        templatePromise: examplesTemplate('stateChart.html'),
        url: '/state-chart',
        menuTr: 'ui.dox.stateChart'
    },
    {
        name: 'ui.examples.charts.liveUpdatingChart',
        templatePromise: examplesTemplate('liveUpdatingChart.html'),
        url: '/live-updating-chart',
        menuTr: 'ui.dox.liveUpdatingChart'
    },
    {
        name: 'ui.examples.charts.pieChart',
        templatePromise: examplesTemplate('pieChart.html'),
        url: '/pie-chart',
        menuTr: 'ui.dox.pieChart'
    },
    {
        name: 'ui.examples.charts.dailyComparison',
        templatePromise: examplesTemplate('dailyComparisonChart.html'),
        url: '/daily-comparison',
        menuTr: 'ui.dox.dailyComparisonChart'
    },
    {
        name: 'ui.examples.settingPointValues',
        url: '/setting-point-values',
        menuTr: 'ui.dox.settingPoint',
        menuIcon: 'fa-pencil-square-o',
        weight: 998
    },
    {
        name: 'ui.examples.settingPointValues.setPoint',
        templatePromise: examplesTemplate('setPoint.html'),
        url: '/set-point',
        menuTr: 'ui.dox.settingPoint'
    },
    {
        name: 'ui.examples.settingPointValues.toggle',
        templatePromise: examplesTemplate('toggle.html'),
        url: '/toggle',
        menuTr: 'ui.dox.toggle'
    },
    {
        name: 'ui.examples.settingPointValues.sliders',
        templatePromise: examplesTemplate('sliders.html'),
        url: '/sliders',
        menuTr: 'ui.dox.sliders'
    },
    {
        name: 'ui.examples.settingPointValues.multistateRadio',
        templatePromise: examplesTemplate('multistateRadio.html'),
        url: '/multistate-radio-buttons',
        menuTr: 'ui.dox.multistateRadio'
    },
    {
        name: 'ui.examples.statistics',
        url: '/statistics',
        menuTr: 'ui.dox.statistics',
        menuIcon: 'fa-table'
    },
    {
        name: 'ui.examples.statistics.getStatistics',
        templatePromise: examplesTemplate('getStatistics.html'),
        url: '/get-statistics',
        menuTr: 'ui.dox.getStatistics'
    },
    {
        name: 'ui.examples.statistics.statisticsTable',
        templatePromise: examplesTemplate('statisticsTable.html'),
        url: '/statistics-table',
        menuTr: 'ui.dox.statisticsTable'
    },
    {
        name: 'ui.examples.statistics.statePieChart',
        templatePromise: examplesTemplate('statePieChart.html'),
        url: '/state-pie-chart',
        menuTr: 'ui.dox.statePieChart'
    },
    {
        name: 'ui.examples.pointArrays',
        url: '/point-arrays',
        menuTr: 'ui.dox.pointArrayTemplating',
        menuIcon: 'fa-list'
    },
    {
        name: 'ui.examples.pointArrays.buildPointArray',
        templatePromise: examplesTemplate('buildPointArray.html'),
        url: '/build-point-array',
        menuTr: 'ui.dox.buildPointArray'
    },
    {
        name: 'ui.examples.pointArrays.pointArrayTable',
        templatePromise: examplesTemplate('pointArrayTable.html'),
        url: '/point-array-table',
        menuTr: 'ui.dox.pointArrayTable'
    },
    {
        name: 'ui.examples.pointArrays.pointArrayLineChart',
        templatePromise: examplesTemplate('pointArrayLineChart.html'),
        url: '/point-array-line-chart',
        menuTr: 'ui.dox.pointArrayLineChart'
    },
    {
        name: 'ui.examples.pointArrays.templating',
        templatePromise: examplesTemplate('templating.html'),
        url: '/templating',
        menuTr: 'ui.dox.templating'
    },
    {
        name: 'ui.examples.pointArrays.dataPointTable',
        templatePromise: examplesTemplate('dataPointTable.html'),
        url: '/data-point-table',
        menuTr: 'ui.dox.dataPointTable'
    },
    {
        name: 'ui.examples.templates',
        url: '/templates',
        menuTr: 'ui.dox.templates',
        menuIcon: 'fa-file-o'
    },
    {
        name: 'ui.examples.templates.adaptiveLayouts',
        templatePromise: examplesTemplate('adaptiveLayouts.html'),
        url: '/adaptive-layouts',
        menuTr: 'ui.dox.adaptiveLayouts'
    },
    {
        name: 'ui.examples.utilities',
        url: '/utilities',
        menuTr: 'ui.dox.utilities',
        menuIcon: 'fa-wrench'
    },
    {
        name: 'ui.examples.utilities.translation',
        templatePromise: examplesTemplate('translation.html'),
        url: '/translation',
        menuTr: 'ui.dox.translation'
    },
    {
        name: 'ui.examples.utilities.jsonStore',
        templatePromise: examplesTemplate('jsonStore.html'),
        url: '/json-store',
        menuTr: 'ui.dox.jsonStore'
    },
    {
        name: 'ui.examples.utilities.watchdog',
        templatePromise: examplesTemplate('watchdog.html'),
        url: '/watchdog',
        menuTr: 'ui.dox.watchdog'
    },
    {
        name: 'ui.examples.utilities.eventsTable',
        templatePromise: examplesTemplate('eventsTable.html'),
        url: '/events-table',
        menuTr: 'ui.app.eventsTable'
    },
    {
        name: 'ui.examples.utilities.maps',
        templatePromise: examplesTemplate('maps.html'),
        url: '/maps',
        menuTr: 'ui.dox.maps'
    },
    {
        name: 'ui.examples.svg',
        url: '/svg',
        menuTr: 'ui.dox.svgGraphics',
        menuIcon: 'fa-picture-o'
    },
    {
        name: 'ui.examples.svg.basicUsage',
        templatePromise: examplesTemplate('svgBasic.html'),
        url: '/basic-usage',
        menuTr: 'ui.dox.basicSvg'
    },
    {
        name: 'ui.examples.svg.interactiveSvg',
        templatePromise: examplesTemplate('svgAdvanced.html'),
        url: '/interactive-svg',
        menuTr: 'ui.dox.interactiveSvg'
    },
    {
        name: 'ui.examples.svg.svgWindRose',
        templatePromise: examplesTemplate('svgWindRose.html'),
        url: '/wind-rose',
        menuTr: 'ui.dox.svgWindRose'
    },
    {
        name: 'ui.settings.systemStatus.dataSourcesPerformance',
        url: '/ds-performance',
        menuTr: 'ui.settings.systemStatus.dataSourcesPerformance',
        templatePromise: systemStatusTemplate('dataSourcesPerformance.html'),
        menuHidden: true,
    },
    {
        name: 'ui.settings.mailingList',
        url: '/mailing-lists',
        template: '<ma-ui-mailing-list-page></ma-ui-mailing-list-page>',
        menuTr: 'ui.app.mailingLists',
        menuIcon: 'email',
        params: {
            helpPage: 'ui.help.mailingList'
        },
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/mailingListPage/mailingList').then(mailingListPage => {
                    angular.module('maUiMailingListPage', [])
                        .component('maUiMailingListPage', mailingListPage.default);
                    $injector.loadNewModules(['maUiMailingListPage']);
                });
            }]
        }
    },
    {
        url: '/mailing-lists/help',
        name: 'ui.help.mailingList',
        templatePromise: helpTemplate('mailingLists.html'),
        menuTr: 'ui.app.mailingLists'
    },
    {
        name: 'ui.settings.system.virtualSerialPort',
        url: '/virtual-serial-port/{xid}',
        template: '<ma-virtual-serial-port></ma-virtual-serial-port>',
        menuTr: 'systemSettings.comm.virtual.serialPorts',
        menuIcon: 'settings_input_hdmi',
        permission: ['superadmin'],
        params: {
            noPadding: false,
            hideFooter: false,
            helpPage: 'ui.help.virtualSerialPort'
        },
        resolve: {
            loadMyDirectives: ['$injector', function($injector) {
                return import(/* webpackMode: "lazy", webpackChunkName: "ui.settings" */
                        './components/virtualSerialPort/virtualSerialPort').then(virtualSerialPort => {
                    angular.module('maVirtualSerialPort', [])
                        .component('maVirtualSerialPort', virtualSerialPort.default);
                    $injector.loadNewModules(['maVirtualSerialPort']);
                });
            }]
        }
    },
    {
        name: 'ui.help.virtualSerialPort',
        url: '/virtual-serial-port/help',
        templatePromise: helpTemplate('virtualSerialPort.html'),
        menuTr: 'systemSettings.comm.virtual.serialPorts'
    },
    {
        name: 'ui.help.scriptingEditor',
        url: '/scripting-editor/help',
        templatePromise: helpTemplate('scriptingEditor.html'),
        menuTr: 'ui.app.mangoJavaScript'
    },
    {
        name: 'ui.help.freeMarkerTemplates',
        url: '/scripting-editor/help',
        templatePromise: helpTemplate('freeMarkerTemplates.html'),
        menuTr: 'ui.dox.freeMarker'
    },
    {
        name: 'ui.help.eventDetectors',
        menuTr: 'dox.eventDetectors',
        url: '/event-detectors',
        templatePromise: helpTemplate('eventDetectors.html')
    },
    {
        name: 'ui.help.dataPointSelector',
        menuTr: 'ui.dox.dataPointSelector',
        url: '/data-point-selector',
        templatePromise: helpTemplate('dataPointSelector.html')
    },
    {
        name: 'ui.help.eventDetectors.rateOfChange',
        menuTr: 'dox.eventDetectors.rateOfChange',
        url: '/rate-of-change',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('rateOfChange.html')
            }
        }
    },
    {
        name: 'ui.help.eventDetectors.change',
        menuTr: 'dox.eventDetectors.change',
        url: '/change',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('change.html')
            }
        }
    },
    {
        name: 'ui.help.eventDetectors.noChange',
        menuTr: 'dox.eventDetectors.noChange',
        url: '/no-change',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('noChange.html')
            }
        }
    },
    {
        name: 'ui.help.eventDetectors.noUpdate',
        menuTr: 'dox.eventDetectors.noUpdate',
        url: '/no-update',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('noUpdate.html')
            }
        }
    },
    {
        name: 'ui.help.eventDetectors.state',
        menuTr: 'dox.eventDetectors.state',
        url: '/state',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('state.html')
            }
        }
    },
    {
        name: 'ui.help.eventDetectors.stateChangeCount',
        menuTr: 'dox.eventDetectors.stateChangeCount',
        url: '/state-change-count',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('stateChangeCount.html')
            }
        }
    },
    {
        name: 'ui.help.eventDetectors.highLimit',
        menuTr: 'dox.eventDetectors.highLimit',
        url: '/high-limit',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('highLimit.html')
            }
        }
    },
    {
        name: 'ui.help.eventDetectors.lowLimit',
        menuTr: 'dox.eventDetectors.lowLimit',
        url: '/low-limit',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('lowLimit.html')
            }
        }
    },
    {
        name: 'ui.help.eventDetectors.analogChange',
        menuTr: 'dox.eventDetectors.analogChange',
        url: '/analog-change',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('analogChange.html')
            }
        }
    },
    {
        name: 'ui.help.eventDetectors.range',
        menuTr: 'dox.eventDetectors.range',
        url: '/range',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('range.html')
            }
        }
    },
    {
        name: 'ui.help.eventDetectors.positiveCusum',
        menuTr: 'dox.eventDetectors.positiveCusum',
        url: '/positive-cusum',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('positiveCusum.html')
            }
        }
    },
    {
        name: 'ui.help.eventDetectors.negativeCusum',
        menuTr: 'dox.eventDetectors.negativeCusum',
        url: '/negative-cusum',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('negativeCusum.html')
            }
        }
    },
    {
        name: 'ui.help.eventDetectors.smoothness',
        menuTr: 'dox.eventDetectors.smoothness',
        url: '/smoothness',
        views: {
            '@ui.help': {
                templatePromise: helpTemplate('smoothness.html')
            }
        }
    }
];
