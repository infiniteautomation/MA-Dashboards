/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';
import moment from 'moment-timezone';
import Cldr from 'cldrjs';
import angularLocaleCache from 'angularLocaleCache';

// preload popular locales
import 'angular-i18n/angular-locale_en';
import 'angular-i18n/angular-locale_en-001';
import 'angular-i18n/angular-locale_en-150';
import 'angular-i18n/angular-locale_en-us';
import 'angular-i18n/angular-locale_en-gb';
import 'angular-i18n/angular-locale_en-ca';
import 'angular-i18n/angular-locale_en-au';
import 'angular-i18n/angular-locale_en-za';
import 'angular-i18n/angular-locale_en-nz';
import 'angular-i18n/angular-locale_en-ie';
import 'angular-i18n/angular-locale_zh-cn';
import 'angular-i18n/angular-locale_ru-ru';
import 'angular-i18n/angular-locale_fr-fr';
import 'angular-i18n/angular-locale_es-es';
import 'angular-i18n/angular-locale_es-mx';
import 'angular-i18n/angular-locale_de-de';
import 'angular-i18n/angular-locale_pt-br';
import 'angular-i18n/angular-locale_it-it';
import 'angular-i18n/angular-locale_ja-jp';

/**
* @ngdoc service
* @name ngMangoServices.maUser
*
* @description
* Provides a service for getting list of users from the Mango system, as well as logging users in and out.
* - All methods return <a href="https://docs.angularjs.org/api/ngResource/service/$resource" target="_blank">$resource</a>
*   objects that can call the following methods available to those objects:
*   - `$save`
*   - `$remove`
*   - `$delete`
*   - `$get`
*
* # Usage
*
* <pre prettyprint-mode="javascript">
*  const user = User.login({
    username: $scope.username,
    password: $scope.password
});

User.logout();
* </pre>
*
*/


/**
* @ngdoc method
* @methodOf ngMangoServices.maUser
* @name User#get
*
* @description
* A default action provided by $resource. Makes a http GET call to the rest endpoint `/rest/latest/users/:username`
* @param {object} query Object containing a `xid` property which will be used in the query.
* @returns {object} Returns a user object. Objects will be of the resource class and have resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maUser
* @name User#save
*
* @description
* A default action provided by $resource. Makes a http POST call to the rest endpoint `/rest/latest/users/:username`
* @param {object} query Object containing a `username` property which will be used in the query.
* @returns {object} Returns a user object. Objects will be of the resource class and have resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maUser
* @name User#remove
*
* @description
* A default action provided by $resource. Makes a http DELETE call to the rest endpoint `/rest/latest/users/:username`
* @param {object} query Object containing a `xid` property which will be used in the query.
* @returns {object} Returns a user object. Objects will be of the resource class and have resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maUser
* @name User#delete
*
* @description
* A default action provided by $resource. Makes a http DELETE call to the rest endpoint `/rest/latest/users/:username`
* @param {object} query Object containing a `xid` property which will be used in the query.
* @returns {object} Returns a user object. Objects will be of the resource class and have resource actions available to them.
*
*/


/**
* @ngdoc method
* @methodOf ngMangoServices.maUser
* @name User#rql
*
* @description
* Passed a string containing RQL for the query and returns an array of user objects.
* @param {string} RQL RQL string for the query
* @returns {array} An array of user objects. Objects will be of the resource class and have resource actions available to them.
*
*/


/**
* @ngdoc method
* @methodOf ngMangoServices.maUser
* @name User#getById
*
* @description
* Query the REST endpoint `/rest/latest/users/by-id/:id` with the `GET` method.
* @param {object} query Object containing a `id` property which will be used in the query.
* @returns {object} Returns a user object. Objects will be of the resource class and have resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maUser
* @name User#getCurrent
*
* @description
* Query the REST endpoint `/rest/latest/users/current` with the `GET` method to return the currently logged in user.
* @returns {object} Returns a user object. Objects will be of the resource class and have resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maUser
* @name User#login
*
* @description
* Attempts to login in the user by using `GET` method at `/rest/latest/login/:username`
* @returns {object} Returns a user object. Objects will be of the resource class and have resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maUser
* @name User#logout
*
* @description
* Logout the current user by using `GET` method at `/rest/latest/login/:username`
* @returns {object} Returns a user object. Objects will be of the resource class and have resource actions available to them.
*
*/

UserProvider.$inject = ['MA_DEFAULT_TIMEZONE', 'MA_DEFAULT_LOCALE'];
function UserProvider(MA_DEFAULT_TIMEZONE, MA_DEFAULT_LOCALE) {
    let oauth2Clients = null;
    let bootstrapUser = null;
    let systemLocale;
    let systemTimezone;

    this.setCurrentUser = function(user) {
        bootstrapUser = user;
    };
    this.setSystemLocale = function(locale) {
        systemLocale = locale;
    };
    this.setSystemTimezone = function(timezone) {
        systemTimezone = timezone;
    };
    this.setOAuth2Clients = function(clients) {
        oauth2Clients = clients;
    };

    moment.tz.setDefault(MA_DEFAULT_TIMEZONE || moment.tz.guess());
    moment.locale(MA_DEFAULT_LOCALE || window.navigator.languages || window.navigator.language);

    this.$get = UserFactory;

    /*
     * Provides service for getting list of users and create, update, delete
     */
    UserFactory.$inject = ['$resource', '$cacheFactory', 'localStorageService', '$q', 'maUtil', '$http', 'maServer',
        '$injector', '$cookies', 'maTemporaryRestResource', 'maEventBus', 'maRole'];
    function UserFactory($resource, $cacheFactory, localStorageService, $q, Util, $http, maServer,
                         $injector, $cookies, TemporaryRestResource, maEventBus, maRole) {

        class BulkUserTemporaryResource extends TemporaryRestResource {
            static get baseUrl() {
                return '/rest/latest/users/bulk';
            }
            static get resourceType() {
                return 'BULK_USER';
            }
        }

        let currentUser;
        const authTokenBaseUrl = '/rest/latest/auth-tokens';
        const passwordResetUrl = '/rest/latest/password-reset';
        const emailVerificationUrl = '/rest/latest/email-verification';
        const defaultProperties = {
            username: '',
            name: '',
            email: '',
            phone: '',
            homeUrl: '',
            locale: null,
            timezone: null,
            roles: ['user'],
            muted: true,
            receiveOwnAuditEvents: false,
            disabled: false,
            receiveAlarmEmails: 'IGNORE'
        };

        const User = $resource('/rest/latest/users/:username', {
                username: data => data && (data.originalId || data.username)
            }, {
            query: {
                method: 'GET',
                isArray: true,
                transformResponse: Util.transformArrayResponse,
                interceptor: {
                    response: Util.arrayResponseInterceptor
                }
            },
            getById: {
                url: '/rest/latest/users/by-id/:id',
                method: 'GET',
                isArray: false
            },
            getCurrent: {
                url: '/rest/latest/users/current',
                method: 'GET',
                isArray: false,
                interceptor: {
                    response: setCurrentUserInterceptor
                }
            },
            login: {
                url: '/rest/latest/login',
                method: 'POST',
                isArray: false,
                interceptor: {
                    request: function(config) {
                        delete config.params.username;
                        User.ensureXsrfToken();
                        return config;
                    },
                    response: setCurrentUserInterceptor
                }
            },
            switchUser: {
                url: '/rest/latest/login/su',
                method: 'POST',
                isArray: false,
                interceptor: {
                    response: setCurrentUserInterceptor
                },
                hasBody: false
            },
            exitSwitchUser: {
                url: '/rest/latest/login/exit-su',
                method: 'POST',
                isArray: false,
                interceptor: {
                    response: setCurrentUserInterceptor
                },
                hasBody: false
            },
            logout: {
                url: '/rest/latest/logout',
                method: 'POST',
                isArray: false,
                interceptor: {
                    response: logoutInterceptor
                },
                hasBody: false
            },
            save: {
                method: 'POST',
                url: '/rest/latest/users/',
                params: {
                    username: null
                }
            },
            update: {
                method: 'PUT',
                interceptor: {
                    response: function(data) {
                        const updatedUser = data.resource;
                        // check if we are updating the current user
                        if (updatedUser.id === currentUser.id) {
                            User.setCurrentUser(updatedUser.copy());
                        }
                        return updatedUser;
                    }
                }
            },
            systemSetup: {
                method: 'POST',
                url: `${passwordResetUrl}/system-setup`,
                interceptor: {
                    response: function(data) {
                        const updatedUser = data.resource;
                        User.setCurrentUser(updatedUser.copy());
                        return updatedUser;
                    }
                }
            }
        }, {
            idProperty: 'username',
            defaultProperties,
            autoXid: false
        });

        Object.assign(User.notificationManager, {
            webSocketUrl: '/rest/latest/websocket/users'
        });

        Object.assign(User, {
            setCurrentUser(user) {
                if (user != null && !(user instanceof User)) {
                    user = Object.assign(Object.create(User.prototype), user);
                }
                if (!angular.equals(user, currentUser)) {
                    const previousUser = currentUser;
                    currentUser = user || null;

                    this.configureLocale();
                    this.configureTimezone();

                    maEventBus.publish('maUser/currentUserChanged', currentUser, previousUser);
                }
            },

            configureLocale(locale = this.getLocale()) {
                if (locale !== this.locale) {
                    const prevLocale = this.locale;
                    this.locale = locale;

                    // moment doesn't support locales with a script, just supply it with language and region
                    const cldrAttributes = new Cldr(locale).attributes;
                    moment.locale(cldrAttributes.minLanguageId);

                    const localeId = locale.toLowerCase();
                    const $locale = $injector.get('$locale');
                    if (localeId !== $locale.id) {
                        // localeCache.getLocale() returns ES6 promise, convert to AngularJS $q promise
                        const promise = this.replaceLocalePromise = $q.when(angularLocaleCache.getLocale(localeId))
                            .catch(error => angularLocaleCache.getLocale(cldrAttributes.language))
                            .then(newLocaleData => {
                                if (promise === this.replaceLocalePromise) {
                                    delete this.replaceLocalePromise;

                                    // deep replace all properties of existing locale with the keys from the new locale
                                    // this is necessary as the filters cache $locale.NUMBER_FORMATS for example
                                    Util.deepReplace($locale, newLocaleData);
                                }
                            });
                    }

                    maEventBus.publish('maUser/localeChanged', locale, prevLocale);
                }
            },

            configureTimezone(timezone = this.getTimezone()) {
                if (timezone !== this.timezone) {
                    const prevTimezone = this.timezone;
                    this.timezone = timezone;

                    moment.tz.setDefault(timezone);

                    maEventBus.publish('maUser/timezoneChanged', timezone, prevTimezone);
                }
            },

            getLocale() {
                if (currentUser) {
                    return currentUser.getLocale();
                }
                return this.getSystemLocale();
            },

            getSystemLocale() {
                return systemLocale || MA_DEFAULT_LOCALE || (window.navigator.languages && window.navigator.languages[0]) || window.navigator.language;
            },

            getTimezone() {
                if (currentUser) {
                    return currentUser.getTimezone();
                }
                return this.getSystemTimezone();
            },

            getSystemTimezone() {
                return systemTimezone || MA_DEFAULT_TIMEZONE || moment.tz.guess();
            },

            storeCredentials(username, password) {
                localStorageService.set('storedCredentials', {
                    username: username,
                    password: password
                });
            },

            storedUsername() {
                const credentials = localStorageService.get('storedCredentials');
                return credentials ? credentials.username : null;
            },

            getCredentialsFromUrl() {
                const params = new URL(window.location.href).searchParams;
                if (!params) return;

                const credentials = {
                    username: params.get('autoLoginUsername'),
                    password: params.get('autoLoginPassword') || ''
                };

                if (params.get('autoLoginDeleteCredentials') != null) {
                    User.clearStoredCredentials();
                } else if (params.get('autoLoginStoreCredentials') != null && credentials.username) {
                    User.storeCredentials(credentials.username, credentials.password);
                }

                return credentials.username && credentials;
            },

            autoLogin(maUiSettings) {
                let credentials = User.getCredentialsFromUrl() || localStorageService.get('storedCredentials');
                if (!credentials && (maUiSettings || $injector.has('maUiSettings'))) {
                    maUiSettings = maUiSettings || $injector.get('maUiSettings');
                    if (maUiSettings.autoLoginUsername) {
                        credentials = {
                            username: maUiSettings.autoLoginUsername,
                            password: maUiSettings.autoLoginPassword || ''
                        };
                    }
                }
                if (!credentials) {
                    return $q.reject('No stored credentials');
                }
                return this.login.call(this, credentials).$promise;
            },

            clearStoredCredentials() {
                localStorageService.remove('storedCredentials');
            },

            sendPasswordResetEmail(username, email) {
                return $http({
                    url: `${passwordResetUrl}/send-email`,
                    method: 'POST',
                    data: {
                        username,
                        email
                    }
                });
            },

            createPasswordResetLink(username, lockPassword, sendEmail, expiry) {
                return $http({
                    url: `${passwordResetUrl}/create`,
                    method: 'POST',
                    data: {
                        username,
                        lockPassword,
                        sendEmail,
                        expiry
                    }
                }).then(response => response.data);
            },

            passwordReset(token, newPassword) {
                return $http({
                    url: `${passwordResetUrl}/reset`,
                    method: 'POST',
                    data: {
                        token,
                        newPassword
                    }
                });
            },

            createAuthToken(expiry, username) {
                return $http({
                    url: `${authTokenBaseUrl}/create`,
                    method: 'POST',
                    data: {
                        username,
                        expiry
                    }
                }).then(response => {
                    return response.data.token;
                });
            },

            revokeAuthTokens(username) {
                let url = `${authTokenBaseUrl}/revoke`;
                if (username != null && username !== (this.current && this.current.username)) {
                    url += `/${encodeURIComponent(username)}`;
                }

                return $http({
                    url,
                    method: 'POST'
                }).then(response => {
                    return response.data;
                });
            },

            revokeAllAuthTokens() {
                let url = `${authTokenBaseUrl}/reset-keys`;
                return $http({
                    url,
                    method: 'POST'
                }).then(response => {
                    return response.data;
                });
            },

            publicVerifyEmail(email) {
                return $http({
                    url: `${emailVerificationUrl}/public/send-email`,
                    method: 'POST',
                    data: {
                        emailAddress: email
                    }
                });
            },

            publicUpdateEmail(token) {
                return $http({
                    url: `${emailVerificationUrl}/public/update-email`,
                    method: 'POST',
                    data: {
                        token
                    }
                }).then(response => {
                    return Object.assign(Object.create(this.prototype), response.data);
                });
            },

            sendEmailVerification(data) {
                return $http({
                    url: `${emailVerificationUrl}/send-email`,
                    method: 'POST',
                    data
                });
            },

            createEmailVerificationToken(data) {
                return $http({
                    url: `${emailVerificationUrl}/create-token`,
                    method: 'POST',
                    data
                }).then(response => response.data);
            },

            publicRegisterUser(token, user) {
                return $http({
                    url: `${emailVerificationUrl}/public/register`,
                    method: 'POST',
                    data: {
                        token, user
                    }
                }).then(response => {
                    return Object.assign(Object.create(this.prototype), response.data);
                });
            },

            ensureXsrfToken() {
                // ensures there is a CSRF protection cookie set before logging in
                const xsrfCookie = $cookies.get($http.defaults.xsrfCookieName);
                if (!xsrfCookie) {
                    $cookies.put($http.defaults.xsrfCookieName, Util.uuid(), {path: '/'});
                }
            },

            getOAuth2Clients(fromCache = true) {
                if (fromCache && oauth2Clients != null) {
                    return $q.resolve(oauth2Clients);
                }

                return $http({
                    url: `/rest/latest/login/oauth2-clients`,
                    method: 'GET'
                }).then(response => {
                    return (oauth2Clients = response.data);
                });
            },

            bulk: BulkUserTemporaryResource
        });

        Object.defineProperty(User, 'current', {
            get: function() {
                // TODO return anonymous user, need to update everywhere that we check maUser.current
                return currentUser;
            }
        });

        Object.assign(User.prototype, {
            /**
             * @param permission
             * @returns {boolean} true if user has permission (i.e. they hold the required roles)
             */
            hasPermission(permission) {
                // should return true even for empty array if we are superadmin
                if (this.inheritedRoles.some(r => r === 'superadmin')) {
                    return true;
                }

                // use isArray() to deal with unresolved expressions used in templates
                return Array.isArray(permission) && permission.some(t => {
                    if (typeof t === 'string') {
                        return this.hasRole(t);
                    } else {
                        return t.every(r => this.hasRole(r));
                    }
                });
            },

            /**
             * @param {string} role
             * @returns {boolean} true if the user holds the specified role
             */
            hasRole(role) {
                return this.inheritedRoles.some(r => r === 'superadmin' || r === role);
            },

            /**
             * @param {...string} permissionName name of the system permission
             * @returns {boolean} true if the user has any of the system permissions
             */
            hasSystemPermission(permissionName) {
                return Array.prototype.some.call(arguments, p => this.systemPermissions.includes(p));
            },

            getTimezone() {
                return this.timezone || this.constructor.getSystemTimezone();
            },

            sendTestEmail(toEmail, usernameInEmail) {
                return maServer.sendTestEmail(toEmail || this.email, usernameInEmail || this.username);
            },

            getLocale() {
                return this.locale || this.constructor.getSystemLocale();
            },

            createAuthToken(expiry) {
                return this.constructor.createAuthToken(expiry);
            },

            revokeAuthTokens() {
                return this.constructor.revokeAuthTokens();
            },

            createdDuration(now = new Date()) {
                const nowM = moment(now);
                const created = moment(this.created);
                return moment.duration(created.diff(nowM));
            },

            emailVerifiedDuration(now = new Date()) {
                const nowM = moment(now);
                const emailVerified = moment(this.emailVerified);
                return moment.duration(emailVerified.diff(nowM));
            },

            lastLoginDuration(now = new Date()) {
                const nowM = moment(now);
                const lastLogin = moment(this.lastLogin);
                return moment.duration(lastLogin.diff(nowM));
            },

            lastPasswordChangeDuration(now = new Date()) {
                const nowM = moment(now);
                const lastPasswordChange = moment(this.lastPasswordChange);
                return moment.duration(lastPasswordChange.diff(nowM));
            },

            sendEmailVerification(emailAddress = this.email) {
                return this.constructor.sendEmailVerification({
                    username: this.username,
                    emailAddress
                });
            },

            createEmailVerificationToken(emailAddress = this.email) {
                return this.constructor.createEmailVerificationToken({
                    username: this.username,
                    emailAddress
                });
            },

            formatRoles() {
                return maRole.formatRoles(this.roles);
            }
        });

        function setCurrentUserInterceptor(data) {
            // set some properties on the user from headers that will only be available when logging in
            const loginRedirectUrl = data.headers('X-Mango-Default-URI');
            const lastUpgrade = data.headers('X-Mango-Last-Upgrade');

            if (loginRedirectUrl) {
                data.resource.loginRedirectUrl = loginRedirectUrl;
                const required = data.headers('X-Mango-Default-URI-Required');
                data.resource.loginRedirectUrlRequired = !!(required && required.toLowerCase() !== 'false');
            }

            if (lastUpgrade) {
                data.resource.lastUpgradeTime = parseInt(lastUpgrade, 10);
            }

            // the resource decorator interceptor also does this but we need to do it before the User.setCurrentUser() call below
            if (data.resource.username) {
                data.resource.originalId = data.resource.username;
            }

            User.setCurrentUser(data.resource.copy());
            $injector.get('maWatchdog').setStatus('LOGGED_IN');

            return data.resource;
        }

        function logoutInterceptor(data) {
            User.setCurrentUser(null);
            $injector.get('maWatchdog').setStatus('API_UP');

            if (data.resource.username) {
                data.resource.originalId = data.resource.username;
            }

            return data.resource;
        }

        /**
         * Unauthenticated or anonymous user tried to access resource (HTTP 401)
         * @type {NoUserError}
         */
        class NoUserError extends Error {};
        User.NoUserError = NoUserError;

        /**
         * Unauthorized access to resource, user is logged in but doesnt have access (HTTP 403)
         * @type {UnauthorizedError}
         */
        class UnauthorizedError extends Error {}
        User.UnauthorizedError = UnauthorizedError;

        class AnonymousUser extends User {
            constructor() {
                super();
                this.name = 'Anonymous';
                this.roles = ['anonymous'];
                this.inheritedRoles = ['anonymous'];
                // TODO currently no way to obtain granted permissions for anonymous user
                this.systemPermissions = [];
                Object.freeze(this);
            }
        }
        User.AnonymousUser = AnonymousUser;
        User.anonymous = new AnonymousUser();

            // set the initial user and configure initial locale and timezone
        User.setCurrentUser(bootstrapUser);
        bootstrapUser = undefined;

        return User;
    }
}

export default UserProvider;
