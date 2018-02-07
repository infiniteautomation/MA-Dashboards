/**
 * @copyright 2018 {@link http://infiniteautomation.com|Infinite Automation Systems, Inc.} All rights reserved.
 * @author Jared Wiltshire
 */

define(['angular', 'require', 'rql/query'], function(angular, require, query) {
'use strict';

const defaultTotal = '\u2026';
const $inject = ['maPoint', '$mdMedia', 'maWatchList','$state', '$mdDialog', 'maTranslate', '$mdToast', 'maUser', '$q'];

class WatchListBuilderController {
    static get $$ngIsClass() { return true; }
    static get $inject() { return $inject; }
    
    constructor(Point, $mdMedia, WatchList, $state, $mdDialog, Translate, $mdToast, User, $q) {
        this.Point = Point;
        this.$mdMedia = $mdMedia;
        this.WatchList = WatchList;
        this.$state = $state;
        this.$mdDialog = $mdDialog;
        this.Translate = Translate;
        this.$mdToast = $mdToast;
        this.User = User;
        this.$q = $q;

        this.total = defaultTotal;
        this.tableSelection = [];
        this.hierarchySelection = [];
        this.staticSelected = [];
        this.allPoints = [];
        this.tableQuery = {
            limit: 20,
            page: 1,
            order: 'deviceName'
        };
        this.staticTableQuery = {
            limit: 20,
            page: 1
        };
        this.queryPreviewTable = {
            limit: 20,
            page: 1
        };
        this.selectedTab = 0;
        this.tableUpdateCount = 0;
    }

    baseUrl(path) {
    	return require.toUrl('.' + path);
    }

    newWatchlist(name) {
        this.selectedWatchlist = null;
        const watchlist = new this.WatchList();
        watchlist.isNew = true;
        watchlist.name = name;
        watchlist.xid = '';
        watchlist.points = [];
        watchlist.username = this.User.current.username;
        watchlist.type = 'tags';
        watchlist.readPermission = 'user';
        watchlist.editPermission = this.User.current.hasPermission('edit-watchlists') ? 'edit-watchlists' : '';
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
        case 'static': return this.selectedTab === 3;
        case 'query':
            const lastTab = this.watchlist.params && this.watchlist.params.length ?  2 : 3;
            return this.selectedTab === lastTab;
        case 'hierarchy': return this.selectedTab === 1;
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
    
    changedTagKey(param) {
        param.name = 'tag_' + param.options.tagKey;
        this.tagParamsChanged();
    }

    tagParamsChanged() {
        this.rebuildSelectedTagKeys();
        
        const prevParams = [];
        this.watchlist.params.forEach(param => {
            param.options.restrictions = {};
            prevParams.forEach(prevParam => {
                param.options.restrictions[prevParam.options.tagKey] = '{{' + prevParam.name + '}}';
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
        const saveMethod = this.watchlist.isNew ? '$save' : '$updateWithRename';

        // reset all server error messages to allow saving
        Object.keys(this.watchListForm).forEach(key => {
            if (key.indexOf('$') !== 0) {
                const item = this.watchListForm[key];
                item.$setValidity('server-error', true);
            }
        });
        
        if (this.watchListForm.$valid) {
            if (this.watchlist.type === 'query' || this.watchlist.type === 'tags') {
                if (!this.watchlist.data) this.watchlist.data = {};
                this.watchlist.data.paramValues = angular.copy(this.watchListParams);
            }
            
            this.watchlist[saveMethod]().then(wl => {
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
                    .highlightAction(true)
                    .position('bottom center')
                    .hideDelay(2000);
                this.$mdToast.show(toast);
    
                this.resetForm();
            }, response => {
                // error saving
                const toast = this.$mdToast.simple()
                    .textContent(this.Translate.trSync('ui.app.errorSavingWatchlist', response.mangoStatusText))
                    .action(this.Translate.trSync('common.ok'))
                    .highlightAction(true)
                    .highlightClass('md-warn')
                    .position('bottom center')
                    .hideDelay(5000);
                this.$mdToast.show(toast);

                this.selectedTab = 0;
                if (response.data && response.data.validationMessages) {
                    response.data.validationMessages.forEach(info => {
                        if (this.watchListForm[info.property]) {
                            this.watchListForm[info.property].$setValidity('server-error', false);
                            this.watchListForm[info.property].serverErrorMessage = info.message;
                        }
                    });
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
            watchlist.readPermission = 'user';
            watchlist.editPermission = this.User.current.hasPermission('edit-watchlists') ? 'edit-watchlists' : '';
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
                throw 'no edit permission';
            }
            this.selectedWatchlist = wl;
            this.watchlistSelected();
        }, () => {
            this.newWatchlist();
        });
    }
    
    refreshWatchlists() {
        this.WatchList.query({rqlQuery: 'sort(name)'}).$promise.then(watchlists => {
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
        } else if (!this.watchlist || !this.watchlist.isNew) {
            this.newWatchlist();
        }
    }
    
    editWatchlist(watchlist) {
        this.watchlist = watchlist;
        this.$state.go('.', {watchListXid: watchlist.isNew ? null : watchlist.xid}, {location: 'replace', notify: false});
        
        this.staticSelected = [];
        this.allPoints = [];
        this.total = defaultTotal;
        this.queryPromise = null;
        this.folders = [];

        this.watchListParams = watchlist.defaultParamValues();

        this.clearSearch(false);
        
        if (watchlist.type === 'static') {
            let pointsPromise;
            if (watchlist.isNew) {
                watchlist.points = [];
                pointsPromise = this.$q.when(watchlist.points);
            } else {
                pointsPromise = watchlist.getPoints();
            }
            this.watchlistPointsPromise = pointsPromise.then(() => {
                this.resetSort();
                this.sortAndLimit();
            });
            this.doPointQuery();
        } else if (watchlist.type === 'query') {
            if (!watchlist.data) watchlist.data = {};
            if (!watchlist.data.paramValues) watchlist.data.paramValues = {};
            if (!watchlist.query) {
                watchlist.query = 'sort(deviceName,name)&limit(200)';
            }
            this.queryChanged();
        } else if (watchlist.type === 'hierarchy') {
            // if a user is browsing a hierarchy folder on the watch list page
            // the watchlist will have a hierarchyFolders property, set the folderIds property from this
            if (watchlist.hierarchyFolders) {
                this.folders = watchlist.hierarchyFolders;
                this.updateWatchListFolderIds();
            } else {
                if (!watchlist.folderIds)
                    watchlist.folderIds =[];
                
                this.folders = watchlist.folderIds.map(folderId => ({id: folderId}));
            }
        } else if (watchlist.type === 'tags') {
            if (!watchlist.params) watchlist.params = [];
            if (!watchlist.data) watchlist.data = {};
            if (!watchlist.data.paramValues) watchlist.data.paramValues = {};
            this.rebuildSelectedTagKeys();
            this.queryChanged();
        }
    }
    
    onPaginateOrSort() {
        this.doPointQuery(true);
    }

    doPointQuery(isPaginateOrSort) {
        if (this.queryPromise && typeof this.queryPromise.cancel === 'function') {
            this.queryPromise.cancel();
        }
        
        if (!isPaginateOrSort) {
            this.total = defaultTotal;
            this.allPoints = [];
        }

        let queryObj = new query.Query(angular.copy(this.tableQuery.rql));
        if (queryObj.name !== 'and') {
            if (!queryObj.args.length) {
                queryObj = new query.Query();
            } else {
                queryObj = new query.Query({name: 'and', args: [queryObj]});
            }
        }
        queryObj = queryObj.sort(this.tableQuery.order);
        queryObj = queryObj.limit(this.tableQuery.limit, (this.tableQuery.page - 1) * this.tableQuery.limit);
        
        const pointQuery = this.Point.query({rqlQuery: queryObj.toString()});
        pointQuery.$promise.setCancel(pointQuery.$cancelRequest);
        this.queryPromise = pointQuery.$promise.then(null, response => []);
        
        this.$q.all([this.queryPromise, this.watchlistPointsPromise]).then(results => {
            this.allPoints = results[0];
            this.total = this.allPoints.$total || this.allPoints.length;
            
            this.updateSelections(true, true);
        });
        
        return this.queryPromise;
    }

    doSearch() {
        const props = ['name', 'deviceName', 'dataSourceName', 'xid'];
        const args = [];
        for (let i = 0; i < props.length; i++) {
            args.push(new query.Query({name: 'like', args: [props[i], '*' + this.tableSearch + '*']}));
        }
        this.tableQuery.rql = new query.Query({name: 'or', args: args});
        this.doPointQuery();
    }
    
    clearSearch(doQuery) {
        this.tableSearch = '';
        this.tableQuery.rql = new query.Query();
        if (doQuery || doQuery == null)
            this.doPointQuery();
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
        this.watchlist.points = this.tableSelection.slice();
        this.updateSelections(false, true);
        this.resetSort();
        this.sortAndLimit();
    }

    hierarchySelectionChanged() {
        const updateSelection = points => {
            this.watchlist.points = points.slice();
            this.updateSelections(true, false);
            this.resetSort();
            this.sortAndLimit();
        };
        
        const pointXidsToGet = this.hierarchySelection.map(item => item.xid);
        if (pointXidsToGet.length) {
            // fetch full points
            const ptQuery = new query.Query({name: 'in', args: ['xid'].concat(pointXidsToGet)});
            this.Point.query({rqlQuery: ptQuery.toString()}).$promise.then(updateSelection);
        } else {
            updateSelection([]);
        }
    }

    updateWatchListFolderIds() {
        this.watchlist.folderIds = this.folders.map(folder => folder.id);
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
    
    dragAndDrop(event, ui) {
        this.resetSort();
        const from = this.staticTableQuery.start + ui.item.sortable.index;
        const to = this.staticTableQuery.start + ui.item.sortable.dropindex;
        
        const item = this.watchlist.points[from];
        this.watchlist.points.splice(from, 1);
        this.watchlist.points.splice(to, 0, item);
    }
    
    removeFromWatchlist() {
        const map = {};
        for (let i = 0; i < this.staticSelected.length; i++) {
            map[this.staticSelected[i].xid] = true;
        }
        for (let i = 0; i < this.watchlist.points.length; i++) {
            if (map[this.watchlist.points[i].xid]) {
                this.watchlist.points.splice(i--, 1);
            }
        }
        this.staticSelected = [];
        this.updateSelections(true, true);
        this.sortAndLimit();
    }
    
    updateSelections(updateTable, updateHierarchy) {
        if (updateTable) {
            // ensures that rows are re-rendered every time we update the table selections
            this.tableUpdateCount++;
            
            // updates the table selection with a shallow copy of the watch list points
            // so that md-data-table's $watchcollection detects a change for each point
            this.tableSelection = this.watchlist.points.map(point => {
                return angular.extend(Object.create(this.Point.prototype), point);
            });
            
            const pointMap = {};
            this.tableSelection.forEach(point => {
                pointMap[point.xid] = point;
            });

            // replace the point in all points with the exact one from the table selection so the table is updated
            // correctly
            this.allPoints = this.allPoints.map((point, i) => {
                return pointMap[point.xid] || point;
            });
        }
        if (updateHierarchy) {
            this.hierarchySelection = this.watchlist.points.slice();
        }
    }

    // track points in table by their xid and an incrementing count
    // ensures that rows are re-rendered every time we update the table selections
    pointTrack(point) {
        return '' + this.tableUpdateCount + '_' + point.xid;
    }
    
    paramTypeChanged(param) {
        if (!param.options) {
            param.options = {};
        }

        this.deleteParamValues(param);

        if (param && param.type === 'tagValue') {
            if (!param.options.tagKey) {
                param.options.tagKey = 'device';
            }
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

return {
    controller: WatchListBuilderController,
    templateUrl: require.toUrl('./watchListBuilder.html')
};

}); // define
