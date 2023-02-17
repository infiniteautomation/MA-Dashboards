/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';
import moment from 'moment-timezone';
import tinycolor from 'tinycolor2';
import downloadDialogTemplate from './downloadDialog.html';
import watchListPageTemplate from './watchListPage.html';
import watchListChartAndStatsTemplate from './watchListChartAndStats.html';
import watchListTableTemplate from './watchListTable.html';

import './watchListPage.css';

const NO_STATS = '\u2014';

class WatchListPageController {
    static get $$ngIsClass() { return true; }

    static get $inject() {
        return [
            '$mdMedia',
            'localStorageService',
            '$state',
            'maUiDateBar',
            '$mdDialog',
            'maStatistics',
            '$scope',
            '$mdColorPicker',
            '$timeout',
            'maUser',
            'maUiServerInfo'
        ];
    }

    constructor(
            $mdMedia,
            localStorageService,
            $state,
            maUiDateBar,
            $mdDialog,
            maStatistics,
            $scope,
            $mdColorPicker,
            $timeout,
            User,
            maUiServerInfo) {

        this.$mdMedia = $mdMedia;
        this.localStorageService = localStorageService;
        this.$state = $state;
        this.dateBar = maUiDateBar;
        this.$mdDialog = $mdDialog;
        this.maStatistics = maStatistics;
        this.$scope = $scope;
        this.$mdColorPicker = $mdColorPicker;
        this.$timeout = $timeout;
        this.User = User;
        this.maUiServerInfo = maUiServerInfo;

        this.selected = [];
        this.selectedStats = [];
        this.watchListParams = {};

        this.selectFirstWatchList = false;
        this.numberOfRows = $mdMedia('gt-sm') ? 100 : 25;
        this.pageNumber = 1;
        this.sortOrder = 'name';

        this.downloadStatus = {};
        this.chartOptions = {
            selectedAxis: 'left',
            axes: {}
        };

        this.axisOptions = [
            {name: 'left', translation: 'ui.app.left'},
            {name: 'right', translation: 'ui.app.right'},
            {name: 'left-2', translation: 'ui.app.farLeft'},
            {name: 'right-2', translation: 'ui.app.farRight'}
        ];

        this.columns = [
            {name: 'xid', label: 'ui.app.xidShort'},
            {name: 'dataSourceName', label: 'ui.app.dataSource'},
            {name: 'deviceName', label: 'common.deviceName', selectedByDefault: true},
            {name: 'name', label: 'common.name', selectedByDefault: true},
            {name: 'value', label: 'ui.app.value', selectedByDefault: true, disableSort: true},
            {name: 'time', label: 'ui.app.time', selectedByDefault: true, disableSort: true},
            {name: 'enabled', label: 'common.enabled'},
            {name: 'dataType', label: 'dsEdit.pointDataType'},
            {name: 'readPermission', label: 'pointEdit.props.permission.read'},
            {name: 'setPermission', label: 'pointEdit.props.permission.set'},
            {name: 'editPermission', label: 'pointEdit.props.permission.edit'},
            {name: 'unit', label: 'pointEdit.props.unit'},
            {name: 'chartColour', label: 'pointEdit.props.chartColour'},
            {name: 'plotType', label: 'pointEdit.plotType'},
            {name: 'rollup', label: 'common.rollup'},
            {name: 'integralUnit', label: 'pointEdit.props.integralUnit'}
        ];

        this.columns.forEach((c, i) => c.order = i);
        this.loadLocalStorageSettings();

        // bound functions for md-data-table attributes
        this.selectedPointsChangedBound = (...args) => this.selectedPointsChanged(...args);
        this.sortOrPageChangedBound = (...args) => this.sortOrPageChanged(...args);
    }

    $onInit() {
        const localStorage = this.localStorageService.get('watchListPage') || {};
        const params = this.$state.params;

        if (params.watchListXid || !(params.dataSourceXid || params.deviceName || params.tags) && localStorage.watchListXid) {
            const watchListXid = params.watchListXid || localStorage.watchListXid;
            this.pointBrowserLoadItem = {watchListXid};
        } else if (params.dataSourceXid || !(params.deviceName || params.tags) && localStorage.dataSourceXid) {
            const dataSourceXid = params.dataSourceXid || localStorage.dataSourceXid;
            this.pointBrowserLoadItem = {dataSourceXid};
        } else if (params.deviceName || !params.tags && localStorage.deviceName) {
            const deviceName = params.deviceName || localStorage.deviceName;
            this.pointBrowserLoadItem = {deviceName};
        } else if (params.tags || localStorage.tags) {
            if (params.tags) {
                this.pointBrowserLoadItem = {tags: this.parseTagsParam(params.tags)};
            } else {
                const tags = {};
                // copy the tag values over in order specified by the tagKeys array
                // also copies undefined values into the tag object (which could not be stored in local storage JSON)
                if (Array.isArray(localStorage.tagKeys)) {
                    localStorage.tagKeys.forEach(k => tags[k] = localStorage.tags[k]);
                } else {
                    Object.assign(tags, localStorage.tags);
                }
                this.pointBrowserLoadItem = {tags};
            }
        } else if (this.$mdMedia('gt-md')) {
            // select first watch list automatically for large displays
            this.pointBrowserLoadItem = {firstWatchList: true};
        }

        this.dateBar.subscribe((event, changedProperties) => {
            this.updateStats();
        }, this.$scope);
    }

    loadLocalStorageSettings() {
        const settings = this.localStorageService.get('watchListPage') || {};

        this.selectedTags = settings.selectedTags || [];
        if (Array.isArray(settings.selectedColumns)) {
            this.selectedColumns = settings.selectedColumns.map(name => this.columns.find(c => c.name === name)).filter(c => !!c);
        } else {
            this.selectedColumns = this.columns.filter(c => c.selectedByDefault);
        }

        this.numberOfRows = settings.numberOfRows || (this.$mdMedia('gt-sm') ? 100 : 25);
        this.sortOrder = settings.sortOrder != null ? settings.sortOrder : 'name';
    }

    saveLocalStorageSettings() {
        if (this.watchList && this.watchList.isNew()) {
            const settings = this.localStorageService.get('watchListPage') || {};

            settings.selectedTags = this.selectedTags;
            settings.selectedColumns = this.selectedColumns.map(c => c.name);

            settings.numberOfRows = this.numberOfRows;
            settings.sortOrder = this.sortOrder;

            this.localStorageService.set('watchListPage', settings);
        }
    }

    watchListSettingChanged() {
        // copy the local settings to the watch list data
        this.copyLocalSettingsToWatchList();
        // save the settings to local storage (if its not a saved watch list)
        this.saveLocalStorageSettings();
    }

    copyLocalSettingsToWatchList() {
        this.watchList.data.selectedTags = this.selectedTags;
        this.watchList.data.selectedColumns = this.selectedColumns.map(c => c.name);
        this.watchList.data.sortOrder = this.sortOrder;
        this.watchList.data.numberOfRows = this.numberOfRows;
    }

    parseTagsParam(param) {
        const tags = {};
        const paramArray = Array.isArray(param) ? param : [param];

        paramArray.forEach(p => {
            const parts = p.split(':');
            const tagKey = parts[0];
            if (tagKey) {
                if (!tags[tagKey]) {
                    tags[tagKey] = [];
                }

                if (parts.length > 1) {
                    const values = parts[1].split(',');
                    tags[tagKey].push(...values);
                }
            }
        });

        return tags;
    }

    formatTagsParam(tags) {
        const param = [];

        Object.keys(tags).forEach(tagKey => {
            const tagValue = tags[tagKey];
            if (tagValue == null) {
                param.push(tagKey);
            } else {
                const tagValueArray = Array.isArray(tagValue) ? tagValue : [tagValue];
                if (tagValueArray.length) {
                    const paramValue = tagValueArray.join(',');
                    param.push(`${tagKey}:${paramValue}`);
                }
            }
        });

        return param;
    }

    updateState(state) {
        const localStorageParams = this.localStorageService.get('watchListPage') || {};

        ['watchListXid', 'dataSourceXid', 'deviceName', 'tags'].forEach(key => {
            const value = state[key];
            if (value) {
                localStorageParams[key] = value;
                this.$state.params[key] = value;
            } else {
                delete localStorageParams[key];
                this.$state.params[key] = null;
            }
        });

        if (state.tags) {
            this.$state.params.tags = this.formatTagsParam(state.tags);

            // when the tags object is stored to local storage as JSON any tag keys with a value of undefined
            // will be lost, so we store an array of tag keys too
            localStorageParams.tagKeys = Object.keys(state.tags);
        }

        this.localStorageService.set('watchListPage', localStorageParams);
        this.$state.go('.', this.$state.params, {location: 'replace', notify: false});
    }

    clearWatchList() {
        this.watchList = null;
        // clear checked points from table/chart
        this.clearSelected();
    }

    clearSelected() {
        this.selected = [];
        this.selectedStats = [];
        this.chartConfig.selectedPoints = [];
    }

    rebuildChart() {
        // shallow copy causes the chart to update
        this.chartWatchList = Object.assign(Object.create(this.watchList.constructor.prototype), this.watchList);
    }

    watchListChanged() {
        // clear checked points from table/chart
        this.selected = [];
        this.selectedStats = [];

        // ensure the watch list point configs are up to date, also ensures there is data and chart config
        this.watchList.updatePointConfigs();
        this.chartConfig = this.watchList.data.chartConfig;

        this.watchList.defaultParamValues(this.watchListParams);

        this.loadLocalStorageSettings();
        if (Array.isArray(this.watchList.data.selectedColumns)) {
            this.selectedColumns = this.watchList.data.selectedColumns.map(name => this.columns.find(c => c.name === name)).filter(c => !!c);
        }
        if (Array.isArray(this.watchList.data.selectedTags)) {
            this.selectedTags = this.watchList.data.selectedTags;
        }
        if (this.watchList.data.sortOrder != null) {
            this.sortOrder = this.watchList.data.sortOrder;
        }
        if (Number.isFinite(this.watchList.data.numberOfRows) && this.watchList.data.numberOfRows >= 0) {
            this.numberOfRows = this.watchList.data.numberOfRows;
        }

        // we might have just copied settings from watch list to local but some watch list settings might not be there, populate them
        this.copyLocalSettingsToWatchList();

        this.getPoints();

        const stateUpdate = {};
        if (!this.watchList.isNew()) {
            stateUpdate.watchListXid = this.watchList.xid;
        } else if (this.watchList.type === 'query' && this.watchList.deviceName) {
            stateUpdate.deviceName = this.watchList.deviceName;
        } else if (this.watchList.type === 'query' && this.watchList.dataSource) {
            stateUpdate.dataSourceXid = this.watchList.dataSource.xid;
        } else if (this.watchList.type === 'tags' && this.watchList.tags) {
            stateUpdate.tags = this.watchList.tags;
        }

        this.updateState(stateUpdate);
        this.rebuildChart();
    }

    getPoints() {
        if (this.wlPointsPromise) {
            this.wlPointsPromise.cancel();
        }

        this.points = [];
        this.wlPointsPromise = this.watchList.getPoints(this.watchListParams);
        this.pointsPromise = this.wlPointsPromise.then(null, angular.noop).then(points => {
            this.points = points || [];

            const pointNameCounts = this.pointNameCounts = {};
            this.points.forEach(pt => {
                const count = pointNameCounts[pt.name];
                pointNameCounts[pt.name] = (count || 0) + 1;

                if (!pt.tags) pt.tags = {};
                pt.tags.name = pt.name;
                pt.tags.device = pt.deviceName;
            });

            // applies sort and limit to this.points and saves as this.filteredPoints
            this.filterPoints();

            // select points based on the watch list data chart config
            this.selected = this.watchList.findSelectedPoints(this.points);

            this.updateStats();
        });
    }

    sortOrPageChanged() {
        this.watchListSettingChanged();
        this.filterPoints();
    }

    filterPoints() {
        const limit = this.numberOfRows;
        const offset = (this.pageNumber - 1) * limit;
        const order = this.sortOrder;
        const points = this.points.slice();

        if (order) {
            let propertyName = order;
            let desc = false;
            if ((desc = propertyName.indexOf('-') === 0 || propertyName.indexOf('+') === 0)) {
                propertyName = propertyName.substring(1);
            }

            let tag = false;
            if (propertyName.indexOf('tags.') === 0) {
                tag = true;
                propertyName = propertyName.substring(5);
            }

            points.sort((a, b) => {
                const valA = tag ? a.tags[propertyName] : a[propertyName];
                const valB = tag ? b.tags[propertyName] : b[propertyName];

                if (valA === valB || Number.isNaN(valA) && Number.isNaN(valB)) return 0;

                if (valA == null || Number.isNaN(valA) || valA > valB) return desc ? -1 : 1;
                if (valB == null || Number.isNaN(valB) || valA < valB) return desc ? 1 : -1;

                return 0;
            });
        }

        this.filteredPoints = points.slice(offset, offset + limit);
    }

    editWatchList(watchList) {
        this.$state.go('ui.settings.watchListBuilder', {watchListXid: watchList ? watchList.xid : null});
    }

    saveSettings() {
        // this.chartConfig is already mapped to this.watchList.data.chartConfig and so is saved too
        this.watchList.data.paramValues = angular.copy(this.watchListParams);

        if (this.watchList.isNew()) {
            this.$state.go('ui.settings.watchListBuilder', {watchList: this.watchList});
        } else {
            this.watchList.$update().then(wl => {
                this.chartConfig = wl.data.chartConfig;
                this.rebuildChart();
            });
        }
    }

    selectedPointsChanged(point) {
        const removed = !this.selected.includes(point);

        const tagKeys = this.watchList.nonStaticTags(this.points);
        const pointConfigs = this.watchList.pointConfigs();

        if (removed) {
            const pointsToRemove = [point];
            const watchListConfig = point.watchListConfig;
            delete point.watchListConfig;

            const configIndex = pointConfigs.indexOf(watchListConfig);
            if (configIndex >= 0) {
                pointConfigs.splice(configIndex, 1);
            }

            // remove other selected points which were selected using the same config
            this.selected = this.selected.filter(pt => {
                if (pt.watchListConfig !== watchListConfig) {
                    return true;
                }
                pointsToRemove.push(pt);
                delete pt.watchListConfig;
            });

            this.removeStatsForPoints(pointsToRemove);
        } else {
            pointConfigs.push(this.newPointConfig(point, tagKeys));
            this.updateStats(point);
        }

        this.rebuildChartDebounced();
    }

    rebuildChartDebounced() {
        if (this.rebuildChartPromise) {
            this.$timeout.cancel(this.rebuildChartPromise);
            delete this.rebuildChartPromise;
        }

        this.rebuildChartPromise = this.$timeout(() => {
            delete this.rebuildChartPromise;
            this.$scope.$applyAsync(() => {
                this.rebuildChart();
            });
        }, 1000, false);
    }

    newPointConfig(point, selectedTags) {
        const pointConfig = {};
        point.watchListConfig = pointConfig;

        if (this.chartOptions.configNextPoint) {
            if (this.chartOptions.pointColor)
                pointConfig.lineColor = this.chartOptions.pointColor;
            if (this.chartOptions.pointChartType)
                pointConfig.type = this.chartOptions.pointChartType;
            if (this.chartOptions.pointAxis)
                pointConfig.valueAxis = this.chartOptions.pointAxis;
        }

        pointConfig.xid = point.xid;
        pointConfig.tags = {};
        selectedTags.forEach(tagKey => pointConfig.tags[tagKey] = point.tags[tagKey]);

        return pointConfig;
    }

    removeStatsForPoints(points) {
        points.forEach(point => {
            const pointIndex = this.selectedStats.findIndex(stat => stat.xid === point.xid);
            if (pointIndex >= 0) {
                this.selectedStats.splice(pointIndex, 1);
            }
        });
    }

    updateStats(point) {
        if (!this.selected) {
            return;
        }

        let pointsToUpdate;
        if (!point) {
            // doing a full rebuild of stats
            this.selectedStats = [];
            pointsToUpdate = this.selected;
        } else {
            // single point added or removed
            pointsToUpdate = [point];
        }

        pointsToUpdate.forEach(point => {
            const ptStats = {
                    name: point.name,
                    device: point.deviceName,
                    xid: point.xid
            };
            this.selectedTags.forEach(tagKey => {
                ptStats[`tags.${tagKey}`] = point.tags[tagKey];
            });
            this.selectedStats.push(ptStats);

            this.maStatistics.getStatisticsForXid(point.xid, {
                from: this.dateBar.from,
                to: this.dateBar.to,
                rendered: true
            }).then(stats => {
                ptStats.average = stats.average ? stats.average.value : NO_STATS;
                ptStats.minimum = stats.minimum ? stats.minimum.value : NO_STATS;
                ptStats.maximum = stats.maximum ? stats.maximum.value : NO_STATS;

                ptStats.arithmeticMean = stats.arithmeticMean ? stats.arithmeticMean.value : NO_STATS;
                ptStats.minimumInPeriod = stats.minimumInPeriod ? stats.minimumInPeriod.value : NO_STATS;
                ptStats.maximumInPeriod = stats.maximumInPeriod ? stats.maximumInPeriod.value : NO_STATS;

                ptStats.sum = stats.sum ? stats.sum.value : NO_STATS;
                ptStats.first = stats.first ? stats.first.value : NO_STATS;
                ptStats.last = stats.last ? stats.last.value : NO_STATS;
                ptStats.count = stats.count;

                ptStats.averageValue = parseFloat(stats.average && stats.average.value);
                ptStats.minimumValue = parseFloat(stats.minimum && stats.minimum.value);
                ptStats.maximumValue = parseFloat(stats.maximum && stats.maximum.value);

                ptStats.arithmeticMeanValue = parseFloat(stats.arithmeticMean && stats.arithmeticMean.value);
                ptStats.minimumInPeriodValue = parseFloat(stats.minimumInPeriod && stats.minimumInPeriod.value);
                ptStats.maximumInPeriodValue = parseFloat(stats.maximumInPeriod && stats.maximumInPeriod.value);

                ptStats.sumValue = parseFloat(stats.sum && stats.sum.value);
                ptStats.firstValue = parseFloat(stats.first && stats.first.value);
                ptStats.lastValue = parseFloat(stats.last && stats.last.value);
            });
        });

        let seenXids = {};
        this.selectedStats.forEach(s =>  {
            if (seenXids[s.xid]) throw new Error();
            seenXids[s.xid] = true;
        });
    }

    columnIsSelected(name) {
        return !!this.selectedColumns.find(c => c.name === name);
    }

    chooseAxisColor($event, axisName) {
        if (!this.chartConfig.valueAxes) {
            this.chartConfig.valueAxes = {};
        }
        if (!this.chartConfig.valueAxes[axisName]) {
            this.chartConfig.valueAxes[axisName] = {};
        }
        this.showColorPicker($event, this.chartConfig.valueAxes[axisName], 'color', true);
    }

    showColorPicker($event, object, propertyName, rebuild) {
        if (!object) return;

        this.$mdColorPicker.show({
            value: object[propertyName] || tinycolor.random().toHexString(),
            defaultValue: '',
            random: false,
            clickOutsideToClose: true,
            hasBackdrop: true,
            skipHide: false,
            preserveScope: false,
            mdColorAlphaChannel: true,
            mdColorSpectrum: true,
            mdColorSliders: false,
            mdColorGenericPalette: true,
            mdColorMaterialPalette: false,
            mdColorHistory: false,
            mdColorDefaultTab: 0,
            $event: $event
        }).then(color => {
            object[propertyName] = color;
            if (rebuild) {
                this.rebuildChart();
            }
        });
    }

    isAggregated() {
        const { aggregationEnabled, queryBoundary } = this.maUiServerInfo.postLoginData;
        if (aggregationEnabled && queryBoundary > 0) {
            const boundary = moment().subtract(queryBoundary, 'millisecond');
            if (boundary > this.dateBar.from) {
                return true;
            }
        }
        return false;
    }

    showDownloadDialog($event) {
        this.$mdDialog.show({
            controller: ['maUiDateBar', 'maPointValues', 'maUtil', 'MA_ROLLUP_TYPES', 'MA_DATE_TIME_FORMATS',
                    'maUser', '$mdDialog', 'localStorageService',
                function(maUiDateBar, pointValues, Util, MA_ROLLUP_TYPES, MA_DATE_TIME_FORMATS,
                        maUser, $mdDialog, localStorageService) {

                this.dateBar = maUiDateBar;
                this.rollupTypes = MA_ROLLUP_TYPES;
                this.rollupType = 'NONE';
                this.timeFormats = MA_DATE_TIME_FORMATS;

                this.timezones = [{
                    translation: 'ui.app.timezone.user',
                    value: maUser.current.getTimezone(),
                    id: 'user'
                }, {
                    translation: 'ui.app.timezone.server',
                    value: maUser.current.systemTimezone,
                    id: 'server'
                }, {
                    translation: 'ui.app.timezone.utc',
                    value: 'UTC',
                    id: 'utc'
                }];

                this.loadSettings = function() {
                    const settings = localStorageService.get('watchlistDownload') || {};

                    this.allPoints = settings.allPoints != null ? settings.allPoints : !this.selected.length;
                    this.rollupType = settings.rollupType || 'NONE';
                    this.timeFormat = settings.timeFormat || this.timeFormats[0].format;
                    this.timezone = settings.timezone && this.timezones.find(t => t.id === settings.timezone) || this.timezones[0];

                    this.customTimeFormat = !this.timeFormats.find(f => f.format === this.timeFormat);
                };

                this.loadSettings();

                this.saveSettings = function() {
                    localStorageService.set('watchlistDownload', {
                        allPoints: this.allPoints,
                        rollupType: this.rollupType,
                        timeFormat: this.timeFormat,
                        timezone: this.timezone.id
                    });
                };

                this.customTimeFormatChanged = function() {
                    if (!this.customTimeFormat) {
                        if (!this.timeFormats.find(f => f.format === this.timeFormat)) {
                            this.timeFormat = this.timeFormats[0].format;
                        }
                    }
                };

                this.downloadData = function downloadData(downloadType) {
                    const points = this.allPoints ? this.points : this.selected;
                    const xids = points.map(pt => pt.xid);

                    const functionName = downloadType.indexOf('COMBINED') > 0 ? 'getPointValuesForXidsCombined' : 'getPointValuesForXids';
                    const mimeType = downloadType.indexOf('CSV') === 0 ? 'text/csv' : 'application/json';
                    const extension = downloadType.indexOf('CSV') === 0 ? 'csv' : 'json';
                    const fileName = this.watchList.name + '_' + maUiDateBar.from.toISOString() + '_' + maUiDateBar.to.toISOString() + '.' + extension;

                    let fields;
                    if (downloadType === 'CSV_COMBINED') {
                        fields = ['TIMESTAMP', 'VALUE'];
                    } else {
                        fields = ['XID', 'DATA_SOURCE_NAME', 'DEVICE_NAME', 'NAME', 'TIMESTAMP', 'VALUE', 'RENDERED'];
                    }

                    this.downloadStatus.error = null;
                    this.downloadStatus.downloading = true;

                    this.downloadStatus.queryPromise = pointValues[functionName](xids, {
                        mimeType: mimeType,
                        responseType: 'blob',
                        from: maUiDateBar.from,
                        to: maUiDateBar.to,
                        rollup: this.rollupType,
                        rollupInterval: maUiDateBar.rollupIntervals,
                        rollupIntervalType: maUiDateBar.rollupIntervalPeriod,
                        limit: -1,
                        timeout: 0,
                        dateTimeFormat: this.timeFormat,
                        timezone: this.timezone.value,
                        fields: fields
                    }).then(response => {
                        this.downloadStatus.downloading = false;
                        Util.downloadBlob(response, fileName);
                    }, error => {
                        this.downloadStatus.error = error.mangoStatusText;
                        this.downloadStatus.downloading = false;
                    });
                };

                this.cancelDownload = function cancelDownload() {
                    this.downloadStatus.queryPromise.cancel();
                };

                this.cancel = function cancel() {
                    $mdDialog.cancel();
                };

            }],
            template: downloadDialogTemplate,
            parent: angular.element(document.body),
            targetEvent: $event,
            clickOutsideToClose: true,
            fullscreen: this.$mdMedia('xs') || this.$mdMedia('sm'),
            bindToController: true,
            controllerAs: '$ctrl',
            locals: {
                watchList: this.watchList,
                selected: this.selected,
                downloadStatus: this.downloadStatus,
                points: this.points
            }
        });
    }
}

watchListPageFactory.$inject = ['$templateCache'];
function watchListPageFactory($templateCache) {
    $templateCache.put('watchList.chartAndStats.html', watchListChartAndStatsTemplate);
    $templateCache.put('watchList.table.html', watchListTableTemplate);

    return {
        restrict: 'E',
        template: watchListPageTemplate,
        scope: {},
        controller: WatchListPageController,
        controllerAs: '$ctrl',
        bindToController: {
            watchList: '<?'
        }
    };
}

export default watchListPageFactory;
