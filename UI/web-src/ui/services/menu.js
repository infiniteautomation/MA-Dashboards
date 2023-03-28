/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';

MenuProvider.$inject = ['$stateProvider', 'MA_UI_MENU_ITEMS'];
function MenuProvider($stateProvider, MA_UI_MENU_ITEMS, $injector) {
    const registeredStates = {};

    // converts a templatePromise function on a state / view to a templateProvider by
    // adding the function (which returns a promise) to the resolve object of the state then injecting the
    // result into the provider
    const templatePromiseToProvider = function (menuItem) {
        const views = [menuItem];
        if (typeof menuItem.views === 'object') {
            views.push(...Object.values(menuItem.views));
        }
        views
            .filter((v) => !!v.templatePromise)
            .forEach((view, i) => {
                const resolveName = `template_${i}`;
                menuItem.resolve[resolveName] = view.templatePromise;
                delete view.templatePromise;

                if (!view.template && !view.templateUrl && !view.templateProvider) {
                    view.templateProvider = [
                        resolveName,
                        (t) => {
                            // check if promise returned a ES6/Webpack module instead of a template string
                            if (typeof t === 'object' && typeof t.default === 'string') {
                                return t.default;
                            }
                            return t;
                        }
                    ];
                }
            });
    };

    const resolveUserHasPermission = function (User) {
        // get the updated menuItem/state which may have properties combined from JSON store
        const menuItem = registeredStates[this.name];
        if (!menuItem) throw new Error('State/page no longer exists');

        const user = User.current || User.anonymous;
        if (!(user.hasPermission(menuItem.permission) || user.hasSystemPermission(...menuItem.systemPermission))) {
            if (user instanceof User.AnonymousUser) {
                throw new User.NoUserError('No user logged in');
            } else {
                throw new User.UnauthorizedError('User does not have access');
            }
        }
    };
    resolveUserHasPermission.$inject = ['maUser'];

    const setMenuItemDefaults = (originalMenuItem, forDiff = false) => {
        const menuItem = Object.assign({}, originalMenuItem);

        menuItem.menuHidden = !!menuItem.menuHidden;
        if (menuItem.weight == null) {
            menuItem.weight = 1000;
        }
        if (menuItem.systemPermission == null) {
            menuItem.systemPermission = [];
        }
        if (menuItem.permission == null) {
            if (menuItem.systemPermission.length) {
                menuItem.permission = [];
            } else {
                menuItem.permission = ['user'];
            }
        }
        // transform old style permission into an array, required for permissions retrieved from JSON store
        if (typeof menuItem.permission === 'string') {
            menuItem.permission = menuItem.permission
                .split(',')
                .map((r) => r.trim())
                .filter((r) => r.length);
        }

        // dont create all the resolve functions and templates if we are just using this for diff
        if (!forDiff) {
            // ensure resolve object available, used to add template resolve and permission resolve
            if (!menuItem.resolve) {
                menuItem.resolve = {};
            }

            menuItem.resolve.resolveUserHasPermission = resolveUserHasPermission;
            templatePromiseToProvider(menuItem);

            if (menuItem.linkToPage) {
                delete menuItem.templateUrl;
                menuItem.template = `<ma-ui-page-view xid="${menuItem.pageXid}" flex layout="column"></ma-ui-page-view>`;
            }

            if (menuItem.templateUrl) {
                delete menuItem.template;
                delete menuItem.templateProvider;
            }

            if (
                !menuItem.templateUrl &&
                !menuItem.template &&
                !menuItem.templateProvider &&
                !menuItem.views &&
                !menuItem.href &&
                !menuItem.redirectTo
            ) {
                menuItem.template = '<div ui-view flex="noshrink" layout="column"></div>';
                menuItem.abstract = true;
            }

            if (Array.isArray(menuItem.requiredTranslations)) {
                menuItem.resolve.requiredTranslations = function (maTranslate) {
                    return maTranslate.loadNamespaces(menuItem.requiredTranslations);
                };
                menuItem.resolve.requiredTranslations.$inject = ['maTranslate'];
            }
        }

        if (menuItem && menuItem.name && menuItem.name.indexOf('ui.helps.examples.') === 0) {
            if (!menuItem.params) menuItem.params = {};
            menuItem.params.dateBar = {
                rollupControls: true
            };
        }

        return menuItem;
    };

    const registerStates = (menuItems) => {
        for (const menuItem of menuItems) {
            const existing = registeredStates[menuItem.name];
            if (existing) {
                Object.assign(existing, menuItem);
            } else {
                const copy = setMenuItemDefaults(menuItem);
                try {
                    $stateProvider.state(copy);
                    registeredStates[menuItem.name] = copy;
                } catch (error) {
                    console.error('Error registering menu item / state', error);
                }
            }
        }
    };

    // register the built in MA_UI_MENU_ITEMS
    registerStates(MA_UI_MENU_ITEMS);

    // Used by AngularJS modules to register a menu item
    this.registerMenuItems = function registerMenuItems(menuItems) {
        Array.prototype.push.apply(MA_UI_MENU_ITEMS, menuItems);
        registerStates(menuItems);
    };

    let customMenuStore;
    this.setCustomMenuStore = function setCustomMenuStore(store) {
        customMenuStore = store;
        registerStates(store.jsonData.menuItems);
    };

    MenuFactory.$inject = ['maJsonStore', 'MA_UI_MENU_XID', '$q', '$rootScope', 'maPermission', 'maUtil', 'maEventBus'];
    function MenuFactory(JsonStore, MA_UI_MENU_XID, $q, $rootScope, Permission, Util, maEventBus) {
        // ensure the original JSON items can't be modified
        const originalMenuItems = Object.freeze(Util.createMapObject(MA_UI_MENU_ITEMS, 'name'));
        MA_UI_MENU_ITEMS.forEach((item) => Object.freeze(item));
        Object.freeze(MA_UI_MENU_ITEMS);

        class Menu {
            constructor() {
                this.firstRefresh = true;
                if (customMenuStore) {
                    this.storeObject = new JsonStore(customMenuStore);
                    delete this.storeObject.$promise;
                    delete this.storeObject.$resolved;
                } else {
                    this.storeObject = this.defaultMenuStore();
                }

                JsonStore.notificationManager.subscribe({
                    handler: this.updateHandler.bind(this),
                    xids: [MA_UI_MENU_XID],
                    scope: $rootScope
                });
            }

            /**
             * Not really needed anymore as the JSON store item should always pre-exist. Keep in case someone
             * deletes their JSON store item.
             * @returns {*}
             */
            defaultMenuStore() {
                return new JsonStore({
                    xid: MA_UI_MENU_XID,
                    name: 'UI Menu',
                    editPermission: [],
                    readPermission: ['user'],
                    jsonData: {
                        menuItems: []
                    }
                });
            }

            updateHandler(event, item) {
                let changed = false;
                if (event.name === 'delete') {
                    this.storeObject.jsonData = {
                        menuItems: []
                    };
                    changed = true;
                } else {
                    if (!angular.equals(this.storeObject.jsonData, item.jsonData)) {
                        this.storeObject.jsonData = item.jsonData;
                        changed = true;
                    }
                    this.storeObject.readPermission = item.readPermission;
                    this.storeObject.editPermission = item.editPermission;
                    this.storeObject.name = item.name;
                }

                if (changed) {
                    this.updateMenuItems();
                    maEventBus.publish('maUiMenu/menuChanged', this.menuHierarchy);
                }
            }

            refresh(forceRefresh) {
                // if the websocket is connected then we can assume we always have the latest menu items
                // just return our current store item
                if (!forceRefresh && this.storePromise && JsonStore.notificationManager.socketConnected()) {
                    return this.storePromise;
                }

                // custom menu items are retrieved on bootstrap, don't get them twice on app startup
                // after first run use the standard JsonStore http request
                if (customMenuStore && this.firstRefresh) {
                    this.storePromise = $q.when(this.storeObject);
                } else {
                    this.storePromise = JsonStore.get({
                        xid: MA_UI_MENU_XID
                    }).$promise.then(null, (error) => {
                        if (error.status === 404) {
                            return this.defaultMenuStore();
                        }
                        delete this.storePromise;
                        return $q.reject(error);
                    });
                }

                this.firstRefresh = false;
                return this.storePromise.then((store) => {
                    this.storeObject = store;
                    this.updateMenuItems();
                });
            }

            updateMenuItems() {
                // remove all deleted custom states
                const customStates = this.storeObject.jsonData.menuItems;
                const customStateNames = Util.createMapObject(customStates, 'name');
                for (const state of Object.values(registeredStates)) {
                    if (!originalMenuItems[state.name] && !customStateNames[state.name]) {
                        delete registeredStates[state.name];
                    }
                }
                registerStates(customStates);

                // create hierarchy objects with children and parent properties
                this.menuHierarchy = this.unflattenMenu(Object.values(registeredStates));
                this.menuItems = this.flattenMenu(this.menuHierarchy.children);
                this.menuItemsByName = Util.createMapObject(this.menuItems, 'name');
                return this.menuItems;
            }

            getMenu() {
                return this.refresh().then(() => {
                    return this.menuItems;
                });
            }

            getMenuHierarchy() {
                return this.refresh().then(() => {
                    return this.menuHierarchy;
                });
            }

            deleteMenu() {
                this.storeObject.jsonData.menuItems = [];
                return this.storeObject.$save().then(() => {
                    this.updateMenuItems();
                    maEventBus.publish('maUiMenu/menuChanged', this.menuHierarchy);
                    return this.menuHierarchy;
                });
            }

            saveMenu(menuHierarchy) {
                const newMenuItems = this.flattenMenu(menuHierarchy.children);

                const different = [];
                newMenuItems.forEach((item) => {
                    if (!originalMenuItems[item.name]) {
                        // item is a custom menu item
                        different.push(this.cleanMenuItemForSave(item));
                    } else {
                        // find any changes to the original menu item and save difference
                        const difference = this.calculateDifference(item);
                        if (difference) {
                            different.push(difference);
                        }
                    }
                });

                this.storeObject.jsonData.menuItems = different;
                return this.storeObject.$save().then(() => {
                    this.updateMenuItems();
                    maEventBus.publish('maUiMenu/menuChanged', this.menuHierarchy);
                    return this.menuHierarchy;
                });
            }

            saveMenuItem(menuItem, originalName) {
                return this.refresh().then(() => {
                    const menuItems = this.storeObject.jsonData.menuItems;
                    // removes the original item, takes care of renaming
                    if (originalName) {
                        menuItems.some((item, i, array) => {
                            if (item.name === originalName) {
                                array.splice(i, 1);
                                return true;
                            }
                        });
                    }

                    if (!originalMenuItems[menuItem.name]) {
                        menuItems.push(this.cleanMenuItemForSave(menuItem));
                    } else {
                        const difference = this.calculateDifference(menuItem);
                        if (difference) {
                            menuItems.push(difference);
                        }
                    }

                    return this.storeObject.$save().then(() => {
                        this.updateMenuItems();
                        maEventBus.publish('maUiMenu/menuChanged', this.menuHierarchy);
                        return this.menuItems;
                    });
                });
            }

            removeMenuItem(stateName) {
                return this.refresh().then(() => {
                    const found = this.storeObject.jsonData.menuItems.some((item, i, array) => {
                        if (item.name === stateName) {
                            array.splice(i, 1);
                            return true;
                        }
                    });

                    if (found) {
                        return this.storeObject.$save().then(() => {
                            this.updateMenuItems();
                            maEventBus.publish('maUiMenu/menuChanged', this.menuHierarchy);
                            return this.menuItems;
                        });
                    } else {
                        return $q.reject('doesnt exist');
                    }
                });
            }

            /**
             * Used by menu editor.
             */
            forEach(menuItems, fn) {
                if (!menuItems) return;
                for (let i = 0; i < menuItems.length; i++) {
                    const menuItem = menuItems[i];
                    let result = fn(menuItem, i, menuItems);
                    if (result) return result;
                    result = this.forEach(menuItem.children, fn);
                    if (result) return result;
                }
            }

            /**
             * Used by menu editor.
             */
            sortMenuItems(menuItems) {
                return menuItems.sort(this.menuItemComparator);
            }

            flattenMenu(menuItems, flatMenuItems = []) {
                menuItems.forEach((item) => {
                    flatMenuItems.push(item);
                    if (item.children) {
                        this.flattenMenu(item.children, flatMenuItems);
                    }
                });
                return flatMenuItems;
            }

            unflattenMenu(flatMenuItems) {
                const hierarchyRoot = {
                    children: {},
                    item: {
                        menuTr: 'ui.app.root'
                    }
                };

                // turns the flat menu item array into a hierarchical structure
                // according to the state names
                flatMenuItems.forEach((item) => {
                    if (!item.name) return;
                    const path = item.name.split('.');
                    this.buildMenuHierarchy(hierarchyRoot, item, path);
                });

                // turns the hierarchical structure into actual menu items
                return this.createMenuItem(hierarchyRoot);
            }

            buildMenuHierarchy(item, toAdd, path) {
                const segmentName = path.shift();
                let child = item.children[segmentName];
                if (!child) {
                    child = item.children[segmentName] = {
                        children: {}
                    };
                }
                if (!path.length) {
                    child.item = toAdd;
                } else {
                    this.buildMenuHierarchy(child, toAdd, path);
                }
            }

            createMenuItem(item) {
                const childArray = [];
                const menuItem = Object.assign({}, item.item);

                for (const child of Object.values(item.children)) {
                    const transformedChild = this.createMenuItem(child);
                    transformedChild.parent = menuItem;
                    childArray.push(transformedChild);
                }

                // builtIn property is used by menu editor
                menuItem.builtIn = !!originalMenuItems[menuItem.name];
                if (childArray.length) {
                    // sort items by weight then name
                    menuItem.children = childArray.sort(this.menuItemComparator);
                }
                return menuItem;
            }

            calculateDifference(newItem) {
                // get the original item, setting defaults on it
                const originalItem = setMenuItemDefaults(originalMenuItems[newItem.name]);

                const difference = {};
                for (const k of ['menuHidden', 'weight', 'menuIcon', 'menuTr', 'menuText']) {
                    if (newItem[k] !== originalItem[k]) {
                        difference[k] = newItem[k];
                    }
                }

                if (!angular.equals(newItem.params, originalItem.params)) {
                    difference.params = newItem.params;
                }

                const newPermission = new Permission(newItem.permission);
                const originalPermission = new Permission(originalItem.permission);
                if (!newPermission.equals(originalPermission)) {
                    difference.permission = newPermission.toArray();
                }

                if (!this.setsEqual(newItem.systemPermission, originalItem.systemPermission)) {
                    difference.systemPermission = newItem.systemPermission;
                }

                if (Object.keys(difference).length) {
                    difference.name = originalItem.name;
                    return difference;
                }
            }

            setsEqual(a, b) {
                return a.length === b.length && a.every((v) => b.includes(v));
            }

            /**
             * Custom states are cleaned (remove parents and children, non-circular structure) so that
             * they can be JSON serialized. Also remove any properties which arent applicable.
             */
            cleanMenuItemForSave(item) {
                delete item.parent;
                delete item.children;
                delete item.resolve;
                delete item.builtIn;
                return item;
            }

            menuItemComparator(a, b) {
                if (a.weight < b.weight) return -1;
                if (a.weight > b.weight) return 1;
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                return 0;
            }
        }
        return new Menu();
    }
    this.$get = MenuFactory;
}
export default MenuProvider;
