/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';
import watchListBuilderTemplate from './watchListBuilder.html';
import query from 'rql/query';

import settingsTemplate from './settings.html';
import parametersTemplate from './parameters.html';
import queryTemplate from './query.html';
import selectTagsTemplate from './selectTags.html';
import queryPreviewTemplate from './queryPreview.html';
import selectFromTableTemplate from './selectFromTable.html';
import selectedPointsTemplate from './selectedPoints.html';

import './watchListBuilder.css';

const defaultTotal = '\u2026';

class WatchListBuilderController {
    static get $$ngIsClass() { return true; }
    static get $inject() { return ['$mdMedia', 'maWatchList','$state', '$mdDialog', 'maTranslate', '$mdToast', 'maUser', '$q']; }

    constructor($mdMedia, WatchList, $state, $mdDialog, Translate, $mdToast, User, $q) {
        this.$mdMedia = $mdMedia;
        this.WatchList = WatchList;
        this.$state = $state;
        this.$mdDialog = $mdDialog;
        this.Translate = Translate;
        this.$mdToast = $mdToast;
        this.User = User;
        this.$q = $q;

        this.total = defaultTotal;
        this.staticSelected = [];
        this.staticTableQuery = {
            limit: 20,
            page: 1
        };
        this.queryPreviewTable = {
            limit: 20,
            page: 1
        };
        this.selectedTab = 0;

        this.sortAndLimitBound = (...args) => this.sortAndLimit(...args);
    }

    newWatchlist(name) {
        this.selectedWatchlist = null;
        const watchlist = new this.WatchList({
            name,
            username: this.User.current.username
        });
        this.editWatchlist(watchlist);
        this.resetForm();
    }
    
    typeChanged() {
        this.editWatchlist(this.watchlist);
    }

    nextStep() {
        this.selectedTab++;
    }
    
    prevStep() {
        this.selectedTab--;
    }
    
    isLastStep() {
        if (!this.watchlist) return false;
        
        switch(this.watchlist.type) {
        case 'static': return this.selectedTab === 2;
        case 'query':
            const lastTab = this.watchlist.params && this.watchlist.params.length ?  2 : 3;
            return this.selectedTab === lastTab;
        case 'tags': return this.selectedTab === 2;
        }
        return true;
    }
    
    addParam() {
        if (!this.watchlist.params) {
            this.watchlist.params = [];
        }
        this.watchlist.params.push({type: 'input', options: {}});
    }

    addTag() {
        if (!this.watchlist.params) {
            this.watchlist.params = [];
        }
        this.watchlist.params.push({type: 'tagValue', options: {multiple: true}});
    }
    
    checkFixedValue(param) {
        if (Array.isArray(param.options.fixedValue) && !param.options.fixedValue.length || param.options.fixedValue === undefined) {
            delete param.options.fixedValue;
        }
    }

    tagParamsChanged() {
        this.rebuildSelectedTagKeys();
        
        const prevParams = [];
        this.watchlist.params.forEach(param => {
            param.name = param.options.tagKey;
            param.options.restrictions = {};
            prevParams.forEach(prevParam => {
                param.options.restrictions[prevParam.options.tagKey] = `{{this['${prevParam.name}']}}`;
            });
            prevParams.push(param);
        });
    }
    
    rebuildSelectedTagKeys() {
        this.selectedTagKeys = [];
        this.watchlist.params.forEach(param => {
            if (param.type === 'tagValue') {
                this.selectedTagKeys.push(param.options.tagKey);
            }
        });
    }
    
    isError(name) {
        if (!this.watchListForm || !this.watchListForm[name]) return false;
        return this.watchListForm[name].$invalid && (this.watchListForm.$submitted || this.watchListForm[name].$touched);
    }
    
    resetForm() {
        if (this.watchListForm) {
            this.watchListForm.$setUntouched();
            this.watchListForm.$setPristine();
        }
    }
    
    save() {
        this.watchListForm.$setSubmitted();

        if (this.watchListForm.$valid) {
            if (this.watchlist.type === 'query' || this.watchlist.type === 'tags') {
                if (!this.watchlist.data) this.watchlist.data = {};
                this.watchlist.data.paramValues = angular.copy(this.watchListParams);
            }
            
            this.watchlist.save().then(wl => {
                this.selectedWatchlist = wl;
                this.watchlistSelected();
                
                let found = false;
                for (let i = 0; i < this.watchlists.length; i++) {
                    if (this.watchlists[i].xid === wl.xid) {
                        this.watchlists.splice(i, 1, wl);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    this.watchlists.push(wl);
                }
                
                const toast = this.$mdToast.simple()
                    .textContent(this.Translate.trSync('ui.app.watchListSaved'))
                    .action(this.Translate.trSync('common.ok'))
                    .actionKey('o')
                    .highlightAction(true)
                    .position('bottom center')
                    .hideDelay(2000);
                this.$mdToast.show(toast);
    
                this.resetForm();
            }, response => {
                // error saving
                const toast = this.$mdToast.simple()
                    .textContent(this.Translate.trSync('ui.app.errorSavingWatchlist', [response.mangoStatusText]))
                    .action(this.Translate.trSync('common.ok'))
                    .actionKey('o')
                    .highlightAction(true)
                    .toastClass('md-warn')
                    .position('bottom center')
                    .hideDelay(10000);
                this.$mdToast.show(toast);

                this.selectedTab = 0;

                if (response.status === 422 && response.data && response.data.result && response.data.result.messages) {
                    this.validationMessages = response.data.result.messages;
                }
            });
        } else {
            this.selectedTab = 0;
        }
    }
    
    deleteWatchlist(event) {
        const confirm = this.$mdDialog.confirm()
            .title(this.Translate.trSync('ui.app.areYouSure'))
            .textContent(this.Translate.trSync('ui.app.confirmDeleteWatchlist'))
            .ariaLabel(this.Translate.trSync('ui.app.areYouSure'))
            .targetEvent(event)
            .ok(this.Translate.trSync('common.ok'))
            .cancel(this.Translate.trSync('common.cancel'));
        
        this.$mdDialog.show(confirm).then(() => {
            this.watchlist.$delete().then(wl => {
                this.newWatchlist();
                for (let i = 0; i < this.watchlists.length; i++) {
                    if (this.watchlists[i].xid === wl.xid) {
                        this.watchlists.splice(i, 1);
                        break;
                    }
                }
            });
        });
    }
    
    $onInit() {
        this.refreshWatchlists();
        if (this.$state.params.watchListXid) {
            this.getWatchlist(this.$state.params.watchListXid);
        } else if (this.$state.params.watchList) {
            // Whole watchlist object sent from watchlist page (save button)
            this.selectedWatchlist = null;
            const watchlist = this.$state.params.watchList;
            watchlist.username = this.User.current.username;
            watchlist.readPermission = ['user'];
            watchlist.editPermission = [];
            this.editWatchlist(watchlist);
            this.resetForm();
        } else {
            this.newWatchlist();
        }
    }
    
    getWatchlist(xid) {
        this.WatchList.get({xid: xid}).$promise.then(wl => {
            const user = this.User.current;
            if (wl.username !== user.username && !user.hasPermission(wl.editPermission)) {
                throw new Error('No edit permission');
            }
            this.selectedWatchlist = wl;
            this.watchlistSelected();
        }, () => {
            this.newWatchlist();
        });
    }
    
    refreshWatchlists() {
        this.WatchList.buildQuery().sort('name').query().then(watchlists => {
            const filtered = [];
            const user = this.User.current;
            for (let i = 0; i < watchlists.length; i++) {
                const wl = watchlists[i];
                if (wl.username === user.username || user.hasPermission(wl.editPermission)) {
                    if (this.selectedWatchlist && this.selectedWatchlist.xid === wl.xid) {
                        filtered.push(this.selectedWatchlist);
                    } else {
                        wl.points = [];
                        filtered.push(wl);
                    }
                }
            }
            this.watchlists = filtered;
        });
    }

    watchlistSelected() {
        if (this.selectedWatchlist) {
            const copiedWatchList = angular.copy(this.selectedWatchlist);
            copiedWatchList.originalXid = copiedWatchList.xid;
            this.editWatchlist(copiedWatchList);
            this.resetForm();
        } else if (!this.watchlist || !this.watchlist.isNew()) {
            this.newWatchlist();
        }
    }
    
    editWatchlist(watchlist) {
        this.watchlist = watchlist;
        this.$state.go('.', {watchListXid: watchlist.isNew() ? null : watchlist.xid}, {location: 'replace', notify: false});
        
        this.staticSelected = [];
        this.total = defaultTotal;
        this.queryPromise = null;

        this.watchListParams = watchlist.defaultParamValues();

        if (watchlist.type === 'static') {
            let pointsPromise;
            if (watchlist.isNew()) {
                watchlist.points = [];
                pointsPromise = this.$q.when(watchlist.points);
            } else {
                pointsPromise = watchlist.getPoints();
            }
            this.watchlistPointsPromise = pointsPromise.then(() => {
                this.resetSort();
                this.sortAndLimit();
            });
        } else if (watchlist.type === 'query') {
            if (!watchlist.data) watchlist.data = {};
            if (!watchlist.data.paramValues) watchlist.data.paramValues = {};
            if (!watchlist.query) {
                watchlist.query = 'sort(deviceName,name)&limit(200)';
            }
            this.queryChanged();
        } else if (watchlist.type === 'tags') {
            if (!watchlist.params) watchlist.params = [];
            if (!watchlist.data) watchlist.data = {};
            if (!watchlist.data.paramValues) watchlist.data.paramValues = {};
            this.rebuildSelectedTagKeys();
            this.queryChanged();
        }
    }
    
    queryChanged() {
        this.queryPreviewPoints = [];
        this.queryPreviewTable.total = defaultTotal;
        if (this.queryPreviewPromise && typeof this.queryPreviewPromise.cancel === 'function') {
            this.queryPreviewPromise.cancel();
        }
        this.queryPreviewPromise = this.watchlist.getPoints(this.watchListParams).then(watchlistPoints => {
            this.queryPreviewPoints = watchlistPoints;
            this.queryPreviewTable.total = watchlistPoints.length;
        }, () => {
            this.queryPreviewTable.total = 0;
        });
    }

    tableSelectionChanged() {
        this.resetSort();
        this.sortAndLimit();
    }

    resetSort() {
        delete this.staticTableQuery.order;
    }
    
    sortAndLimit() {
        let order = this.staticTableQuery.order;
        if (order) {
            let desc = false;
            if ((desc = order.indexOf('-') === 0 || order.indexOf('+') === 0)) {
                order = order.substring(1);
            }
            this.watchlist.points.sort((a, b) => {
                if (a[order] > b[order]) return desc ? -1 : 1;
                if (a[order] < b[order]) return desc ? 1 : -1;
                return 0;
            });
        }
        
        const limit = this.staticTableQuery.limit;
        const start = this.staticTableQuery.start = (this.staticTableQuery.page - 1) * this.staticTableQuery.limit;
        this.pointsInView = this.watchlist.points.slice(start, start + limit);
    }
    
    dragAndDrop(event) {
        this.resetSort();
        const from = this.staticTableQuery.start + event.oldIndex;
        const to = this.staticTableQuery.start + event.newIndex;
        
        const item = this.watchlist.points[from];
        this.watchlist.points.splice(from, 1);
        this.watchlist.points.splice(to, 0, item);
        
        // ensure the data point selector gets the new array order otherwise the order will be lost if we select more points
        this.watchlist.points = this.watchlist.points.slice();
    }
    
    removeFromWatchlist() {
        const selected = new Set(this.staticSelected);
        this.watchlist.points = this.watchlist.points.filter(pt => !selected.has(pt));
        
        this.staticSelected = [];
        this.sortAndLimit();
    }

    paramTypeChanged(param) {
        if (!param.options) {
            param.options = {};
        }

        this.deleteParamValues(param);

        switch(param.type) {
            case 'tagValue':
                if (!param.options.tagKey) {
                    param.options.tagKey = 'device';
                }
                break;
            case 'select':
                if (!Array.isArray(param.options.options)) {
                    param.options.options = [];
                }
                break;
        }
    }
    
    deleteParamValues(param) {
        if (this.watchlist.data && this.watchlist.data.paramValues) {
            delete this.watchlist.data.paramValues[param.name];
        }
        delete this.watchListParams[param.name];
        
        if (param.options && param.options) {
            delete param.options.fixedValue;
        }
    }
    
    deleteProperty(obj, propertyName) {
        if (typeof obj === 'object' && typeof propertyName === 'string') {
            delete obj[propertyName];
        }
    }
}

watchListBuilderFactory.$inject = ['$templateCache'];
function watchListBuilderFactory($templateCache) {
    $templateCache.put('watchListBuilder.settings.html', settingsTemplate);
    $templateCache.put('watchListBuilder.parameters.html', parametersTemplate);
    $templateCache.put('watchListBuilder.query.html', queryTemplate);
    $templateCache.put('watchListBuilder.selectTags.html', selectTagsTemplate);
    $templateCache.put('watchListBuilder.queryPreview.html', queryPreviewTemplate);
    $templateCache.put('watchListBuilder.selectFromTable.html', selectFromTableTemplate);
    $templateCache.put('watchListBuilder.selectedPoints.html', selectedPointsTemplate);

    return {
        restrict: 'E',
        scope: {},
        bindToController: true,
        controllerAs: '$ctrl',
        controller: WatchListBuilderController,
        template: watchListBuilderTemplate
    };
}

export default watchListBuilderFactory;
