/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import BoundedMap from './BoundedMap';
import moment from 'moment-timezone';

class Column {

    constructor(options) {
        Object.assign(this, options);
        this.property = this.name.split('.');
        this.filterable = options.hasOwnProperty('filterable') ? !!options.filterable : true;
        this.sortable = options.hasOwnProperty('sortable') ? !!options.sortable : true;
    }

    parseBoolean(value) {
        const lower = value.toLowerCase();
        if (['true', 'y', '1'].includes(lower)) {
            return true;
        } else if (['false', 'n', '0'].includes(lower)) {
            return false;
        }
        return value;
    }

    parseEnum(value) {
        if (/^-?\d+$/.exec(value)) {
            return Number.parseInt(value, 10);
        }
        return value.toUpperCase();
    }

    applyFilter(queryBuilder) {
        if (!this.filter) return;

        const match = /^(!)?(=|>=|<=|>|<)?(.*)$/.exec(this.filter);
        let invert = !!match[1];
        let op = match[2];
        let value = match[3];

        if (value === 'null') {
            value = null;
        } else {
            try {
                switch(this.type) {
                case 'number': value = Number.parseFloat(value); break;
                case 'integer': value = Number.parseInt(value, 10); break;
                case 'boolean': value = this.parseBoolean(value); break;
                case 'date': value = moment(value, [this.dateFormat, moment.ISO_8601]).valueOf(); break;
                case 'enum': value = this.parseEnum(value); break;
                }
            } catch (e) {
            }
        }

        switch(op) {
        case  '>': op = 'gt'; break;
        case '>=': op = 'ge'; break;
        case  '<': op = 'lt'; break;
        case '<=': op = 'le'; break;
        case  '=': op = 'eq'; break;
        default:
            // no operator provided by user, fall back to default for type
            if (this.type === 'array') {
                op = 'contains';
            } else if (value && (this.type === 'string' || !this.type)) {
                op = 'match';
                value = this.tableCtrl.customizeMatchFilter(value);
            } else {
                op = 'eq';
            }
        }

        if (invert && op === 'eq') {
            op = 'ne';
            invert = false;
        }

        if (invert) queryBuilder.not();
        queryBuilder[op](this.name, value);
        if (invert) queryBuilder.up();
    }

    getValue(item) {
        const property = this.property;
        let result = item;
        for (let i = 0; i < property.length; i++) {
            if (result == null || typeof result !== 'object') {
                return;
            }
            result = result[property[i]];
        }
        return result;
    }

    formatValue(value) {
        let formatted;
        if (value == null) {
            formatted = null;
        } else if (this.type === 'date') {
            formatted = this.maDateFormat(value, this.dateFormat);
        } else if (this.type === 'duration') {
            formatted = this.formatDuration(value);
        } else {
            formatted = value;
        }
        return formatted;
    }

    getValueAndFormat(item) {
        const value = this.getValue(item);
        if (value === undefined) {
            return;
        }
        return this.formatValue(value);
    }

    formatDuration(duration) {
        if (duration < 1000) {
            return this.Translate.trSync('ui.time.milliseconds', [duration]);
        }
        if (duration < 5000) {
            return this.Translate.trSync('ui.time.seconds', [Math.round(duration / 100) / 10]);
        }
        if (duration < 60000) {
            return this.Translate.trSync('ui.time.seconds', [Math.round(duration / 1000)]);
        }
        return moment.duration(duration).humanize();
    }
}

class TableController {
    static get $$ngIsClass() { return true; }

    constructor(options) {
        this.dateFormat = 'dateTime';

        Object.assign(this, options);

        const $injector = this.$injector;
        this.maDialogHelper = $injector.get('maDialogHelper');
        this.$timeout = $injector.get('$timeout');
        this.localStorageService = $injector.get('localStorageService');
        this.maUtil = $injector.get('maUtil');
        this.$q = $injector.get('$q');
        this.$interval = $injector.get('$interval');
        this.maDateFormat = $injector.get('$filter')('maDate');
        this.Translate = $injector.get('maTranslate');

        this.idProperty = this.resourceService.idProperty;
        this.showFilters = true;
        this.showClear = true;
        this.pageSize = 50;
        this.cacheSize = 10;
        this.pages = new BoundedMap(this.cacheSize);
        this.selectedItems = new Map();
        this.maxSortColumns = 3;
        this.autoWildcard = false;

        this.loadSettings();
    }

    $onInit() {
        if (this.ngModelCtrl) {
            this.ngModelCtrl.$render = () => this.render();
        }

        this.updateQueue = [];
        this.deregister = this.resourceService.notificationManager.subscribe((event, item, attributes) => {
            // we queue up the updates and process them in batches to prevent continuous $scope.$apply() when large numbers of
            // items are being edited
            this.updateQueue.push({
                eventName: event.name,
                item,
                attributes
            });
        });

        let intervalTicks = 0;
        let updateQueueLength = 0;
        this.intervalPromise = this.$interval(() => {
            if (this.updateQueue.length) {
                // we only process the queue of updates every 20 ticks of the interval if the queue is being continuously updated
                // or if the queue length does not change between ticks
                if (++intervalTicks >= 20 || this.updateQueue.length === updateQueueLength) {
                    intervalTicks = 0;
                    this.processUpdateQueue();
                }
                updateQueueLength = this.updateQueue.length;
            }
        }, 500, null, false);

        // closes the options menu if this user table is encapsulated in a maDropDown and it closes
        this.$scope.$on('maDropDownClose', event => {
            if (this.mdMenuCtrl) {
                this.mdMenuCtrl.close(false, {closeAll: true});
            }
        });

        // have to load columns first as they may have saved filters which we need to apply before
        // loading the items
        this.prepareTable();
    }

    $onDestroy() {
        this.deregister();
        this.$interval.cancel(this.intervalPromise);
        this.cancelSelectAll();
    }

    $onChanges(changes) {
    }

    render() {
        let items;
        if (this.selectMultiple) {
            items = Array.isArray(this.ngModelCtrl.$viewValue) ? this.ngModelCtrl.$viewValue : [];
        } else {
            items = this.ngModelCtrl.$viewValue ? [this.ngModelCtrl.$viewValue] : [];
        }

        this.selectedItems.clear();
        items.forEach(item => {
            this.selectedItems.set(item[this.idProperty], item);
        });
    }

    setViewValue() {
        if (this.ngModelCtrl) {
            if (this.selectMultiple) {
                this.ngModelCtrl.$setViewValue(Array.from(this.selectedItems.values()));
            } else {
                const [first] = this.selectedItems.values();
                this.ngModelCtrl.$setViewValue(first || null);

                // automatically close the drop down
                if (this.dropDownCtrl) {
                    this.dropDownCtrl.close();
                }
            }
        }
    }

    loadSettings() {
        this.settings = this.localStorageService.get(this.localStorageKey) || {};

        if (this.settings.hasOwnProperty('showFilters')) {
            this.showFilters = !!this.settings.showFilters;
        }

        if (!this.settings.filters) {
            this.settings.filters = {};
        }

        this.sort = this.settings.sort || this.defaultSort || [];
    }

    saveSettings() {
        this.settings.sort = this.sort;

        this.settings.showFilters = this.showFilters;
        this.settings.filters = {};
        this.selectedColumns.forEach(c => {
            if (c.filter != null) {
                this.settings.filters[c.name] = c.filter;
            }
        });

        this.localStorageService.set(this.localStorageKey, this.settings);
    }

    getFilters() {
        return this.settings.filters;
    }

    prepareTable() {
        // loading the items
        this.loadColumns().then(() => {
            this.selectColumns();
            this.getItems();
        });
    }

    loadColumns() {
        return this.$q.resolve().then(() => {
            const filters = this.getFilters();
            this.columns = this.defaultColumns.map((column, i) => {
                return this.createColumn(Object.assign({
                    order: i,
                    filter: filters[column.name] || null,
                    dateFormat: this.dateFormat,
                    maDateFormat: this.maDateFormat
                }, column));
            });
        });
    }

    selectColumns() {
        const selected = Array.isArray(this.settings.selectedColumns) ? this.settings.selectedColumns : [];
        const deselected = Array.isArray(this.settings.deselectedColumns) ? this.settings.deselectedColumns : [];
        this.selectedColumns = this.columns.filter(c => selected.includes(c.name) || c.selectedByDefault && !deselected.includes(c.name));
    }

    markCacheAsStale() {
        for (let page of this.pages.values()) {
            page.cancel();
            page.stale = true;
        }
    }

    clearCache(preserveTotal = true) {
        this.cancelSelectAll();
        this.markCacheAsStale();

        const total = this.pages.$total;
        this.pages = new BoundedMap(this.cacheSize);

        // sorting doesn't change the total
        if (preserveTotal) {
            this.pages.$total = total;
        }
    }

    newQueryBuilder() {
        return this.resourceService.buildQuery();
    }

    createQueryBuilder() {
        const queryBuilder = this.newQueryBuilder();

        this.customizeQuery(queryBuilder);
        this.selectedColumns.forEach(col => col.applyFilter(queryBuilder));

        const sortArray = this.customizeSort(
            this.sort.map(item => item.descending ? `-${item.columnName}` : item.columnName));
        if (sortArray.length) {
            queryBuilder.sort(...sortArray);
        }

        return queryBuilder;
    }

    customizeSort(sortArray) {
        if (!this.disableSortById) {
            // ensure the order of the results are deterministic by adding sort on id
            if (!this.sort.find(s => s.columnName === 'id')) {
                sortArray.push('id');
            }
        }
        return sortArray;
    }

    /**
     * Allows subclasses to customize the query
     * @param queryBuilder
     */
    customizeQuery(queryBuilder) {
    }

    doQuery(queryBuilder, opts) {
        return queryBuilder.query(opts);
    }

    getPage(startIndex = 0, evictCache = true) {
        // keep a reference to pages, don't want to update a new pages map with the results from an old query
        const pages = this.pages;

        // reuse the existing page, preserving its items array for the meantime
        const page = pages.get(startIndex) || {startIndex};
        if (page.promise && !page.stale) {
            return page;
        }
        pages.set(startIndex, page, evictCache);

        const queryBuilder = this.createQueryBuilder();
        queryBuilder.limit(this.pageSize, startIndex);

        const cancel = this.$q.defer();
        const queryPromise = this.doQuery(queryBuilder, {
            'cancel': cancel.promise
        });

        page.cancel = () => {
            cancel.resolve();
            // resource service can extend RestResource or $resource
            // cancelRequest is only available on our extended $resource
            if (typeof this.resourceService.cancelRequest === 'function') {
                this.resourceService.cancelRequest(queryPromise);
            }
            pages.delete(startIndex);
        }

        page.promise = queryPromise.then(result => {
            pages.$total = result.$total;
            delete page.stale;
            page.items = result;
            return result;
        }, error => {
            page.error = error;

            if (this.resourceService.wasCancelled(error)) {
                // request cancelled, ignore error
                pages.delete(startIndex);
                return this.$q.reject(error);
            }

            const message = error.mangoStatusText || (error + '');
            this.maDialogHelper.errorToast(['ui.app.errorGettingItems', message]);

            // dont remove the page from the cache for 1 minute, stops repetitive requests with errors
            this.$timeout(() => {
                pages.delete(startIndex);
            }, 60 * 1000);

            return this.$q.reject(error);
        });

        return page;
    }

    getItems(startIndex = 0) {
        const itemsPromise = this.itemsPromise = this.getPage(startIndex).promise;

        this.itemsPromise.finally(() => {
            // check we are deleting our own promise, not one for a new query
            if (this.itemsPromise === itemsPromise) {
                delete this.itemsPromise;
            }
        });
    }

    doSelectAll(startIndex, endIndex, deselect, selected = 0, total = null) {
        const page = this.selectAllPage = this.getPage(startIndex, false);
        page.promise.then(items => {
            items.every((item, i) => {
                if (endIndex == null || i < endIndex - startIndex) {
                    selected++;
                    if (deselect) {
                        this.selectedItems.delete(item[this.idProperty]);
                    } else {
                        this.selectedItems.set(item[this.idProperty], item);
                    }
                    return true;
                }
            });

            const nextPageIndex = startIndex + this.pageSize;
            const hasMore = items.$total > nextPageIndex;
            const wantMore = endIndex == null || endIndex > nextPageIndex;

            if (total == null) total = (endIndex || items.$total) - startIndex;

            if (wantMore && hasMore) {
                this.selectAllProgress = {
                    key: deselect ? 'ui.app.deselectProgress' : 'ui.app.selectProgress',
                    args: [selected, total]
                };
                this.doSelectAll(nextPageIndex, endIndex, deselect, selected, total);
            } else {
                const trKey = deselect ? 'ui.app.deselectComplete' : 'ui.app.selectComplete';
                this.maDialogHelper.toast([trKey, selected]);
                this.setViewValue();
            }
        }, error => {
            if (!this.resourceService.wasCancelled(error)) {
                const message = error.mangoStatusText || (error + '');
                const trKey = deselect ? 'ui.app.errorSelecting' : 'ui.app.errorDeselecting';
                this.maDialogHelper.errorToast([trKey, message]);
            }
        }).finally(() => {
            if (this.selectAllPage === page) {
                delete this.selectAllPage;
            }
        });
    }

    selectAll(startIndex = 0, endIndex = undefined, deselect = false) {
        this.cancelSelectAll();
        delete this.selectAllProgress;
        this.doSelectAll(startIndex, endIndex, deselect);
    }

    deselectAll(startIndex = 0, endIndex = undefined) {
        this.cancelSelectAll();
        delete this.selectAllProgress;
        this.doSelectAll(startIndex, endIndex, true);
    }

    cancelSelectAll() {
        if (this.selectAllPage != null) {
            this.selectAllPage.cancel();
            delete this.selectAllPage;
        }
    }

    sortBy(column, event) {
        // sort order goes from
        // a) ascending
        // b) descending
        // c) no sort

        const lastSort = this.sort[this.sort.length - 1];
        if (lastSort && lastSort.columnName === column.name) {
            if (!lastSort.descending) {
                // second click
                lastSort.descending = true;
            } else {
                // third click
                this.sort.pop();
            }
        } else {
            // first click
            this.sort = this.sort.filter(item => item.columnName !== column.name);
            this.sort.push({columnName: column.name});
        }

        const multiSort = !!event && event.ctrlKey;
        const maxSortColumns = multiSort ? this.maxSortColumns : 1;
        while (this.sort.length > maxSortColumns) {
            this.sort.shift();
        }

        this.saveSettings();
        this.clearCache();
        this.getItems();
    }

    selectedColumnsChanged() {
        this.settings.deselectedColumns = this.columns
            .filter(c => c.selectedByDefault && !this.selectedColumns.includes(c))
            .map(c => c.name);

        this.settings.selectedColumns = this.selectedColumns
            .filter(c => !c.selectedByDefault)
            .map(c => c.name);

        const nonSelected = this.maUtil.setDifference(this.columns, this.selectedColumns);
        this.columnsDeselected(nonSelected);
        this.saveSettings();
    }

    /**
     * Removes non selected columns from the sort and filtering
     */
    columnsDeselected(nonSelected) {
        let queryChanged;

        nonSelected.forEach(c => {
            const index = this.sort.findIndex(s => s.columnName === c.name);
            if (index >= 0) {
                this.sort.splice(index, 1);
                queryChanged = true;
            }
            if (c.filter != null) {
                c.filter = null;
                queryChanged = true;
            }
        });

        if (queryChanged) {
            this.clearCache();
            this.getItems();
        }
    }

    showFiltersChanged() {
        let filtersChanged = false;
        if (!this.showFilters) {
            this.columns.forEach(c => {
                if (c.filter != null) {
                    c.filter = null;
                    filtersChanged = true;
                }
            });
        }

        if (filtersChanged) {
            this.filterChanged();
        } else {
            // still need to save showFilters
            this.saveSettings();
        }
    }

    filterChanged() {
        this.saveSettings();
        this.clearCache();
        this.getItems();
    }

    getCellValue(item, column) {
        return column.getValueAndFormat(item);
    }

    processUpdateQueue() {
        // TODO we currently have no good way to know if the updated item matches our current query
        // just mark all of our pages as being stale and needing a reload

        let setViewValue = false;

        while (this.updateQueue.length) {
            const update = this.updateQueue.shift();

            if (update.eventName === 'create') {
                // ignore
            } else if (update.eventName === 'update') {
                const existing = this.selectedItems.get(update.attributes.originalXid);
                if (existing) {
                    Object.assign(existing, update.item);
                    setViewValue = true;
                }
            } else if (update.eventName === 'delete') {
                const deleted = this.selectedItems.delete(update.attributes.originalXid);
                if (deleted) {
                    setViewValue = true;
                }
            }
        }
        this.$scope.$apply(() => {
            if (setViewValue) {
                this.setViewValue();
            }
            this.markCacheAsStale();
            this.getItems();
        });
    }

    /**
     * md-virtual-repeat with md-on-demand interface
     */
    getItemAtIndex(index) {
        if (this.pages.$total != null && index > this.pages.$total - 1) {
            return null;
        }
        const startIndex = index - index % this.pageSize;
        const page = this.pages.get(startIndex);

        if (!page || page.stale) {
            this.getItems(startIndex);
        }

        if (page && page.items) {
            return page.items[index - startIndex];
        } else {
            return null;
        }
    }

    /**
     * md-virtual-repeat with md-on-demand interface
     */
    getLength() {
        return this.pages.$total;
    }

    clearSelection() {
        this.selectedItems.clear();
        this.setViewValue();
    }

    getSelectedColumnsModel(column) {
        return this.maUtil.createBooleanModel(this.selectedColumns, column, 'name');
    }

    cancelSelect() {
        delete this.pages.mouseDown;
    }

    rowClicked({$event, $item, $index}) {
        this.selectRow($event, $item, $index);
    }

    rowMousedown({$event, $item, $index}) {
        if (this.selectMultiple && $event.shiftKey) {
            $event.preventDefault();
        }
    }

    selectRow(event, item, index) {
        const itemId = item[this.idProperty];
        const deselect = this.selectedItems.has(itemId);
        const lastClick = this.pages.mouseDown;
        this.pages.mouseDown = {item, index, deselect};

        // TODO add allow deselect attribute
        if (!this.selectMultiple) {
            this.selectedItems.clear();
        }

        if (deselect) {
            this.selectedItems.delete(itemId);
        } else {
            this.selectedItems.set(itemId, item);
        }

        if (this.selectMultiple && event.shiftKey && lastClick) {
            const fromIndex = Math.min(index, lastClick.index);
            const toIndex = Math.max(index, lastClick.index);

            if (toIndex > fromIndex) {
                this.selectAll(fromIndex, toIndex + 1, deselect);
                return; // dont setViewValue() yet
            }
        }

        this.setViewValue();
    }

    openMenu(event, mdMenuCtrl) {
        this.mdMenuCtrl = mdMenuCtrl;
        this.mdMenuCtrl.open(event);
    }

    createColumn(options) {
        return new Column(Object.assign({
            Translate: this.Translate,
            tableCtrl: this
        }, options));
    }

    customizeMatchFilter(value) {
        if (this.autoWildcard) {
            const hasWildcard = value.includes('*') || value.includes('?');
            if (!hasWildcard) {
                return `*${value}*`;
            }
        }
        return value;
    }

    sortClasses(column) {
        const index = this.sort.findIndex(s => s.columnName === column.name);
        if (index >= 0) {
            const sort = this.sort[index];
            const indexClass = `ma-sort-order-${index}`;
            return {
                'ma-sort-descending': !!sort.descending,
                [indexClass]: true
            };
        }
        return 'ng-hide';
    }

}

export default TableController;