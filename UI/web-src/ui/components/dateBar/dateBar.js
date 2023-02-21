/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import dateBarTemplate from './dateBar.html';
import './dateBar.css';
import angular from 'angular';
import moment from 'moment-timezone';

DateBarController.$inject = ['$mdMedia', '$stateParams', 'maUtil', 'MA_ROLLUP_TYPES', 'MA_TIME_PERIOD_TYPES', 'maUiDateBar', 'maUiServerInfo', 'maDialogHelper', 'maTranslate'];
function DateBarController($mdMedia, $stateParams, Util, MA_ROLLUP_TYPES, MA_TIME_PERIOD_TYPES, maUiDateBar, maUiServerInfo, maDialogHelper, maTranslate) {
    this.params = maUiDateBar;
    this.stateParams = $stateParams;
    this.rollupTypes = MA_ROLLUP_TYPES;
    this.timePeriodTypes = MA_TIME_PERIOD_TYPES;
    this.mdMedia = $mdMedia;

    this.$onInit = function() {
        this.calcAutoRollup();
        this.updateIntervalFromRollupInterval();
        this.calcUpdateIntervalString();
        this.checkAutoSimplifyTolerance();
        this.hideUnsupportedRollups();
        this.prevSettings = angular.copy(this.params.data);
    };

    this.$doCheck = function() {
        if (!angular.equals(this.params.data, this.prevSettings)) {
            this.prevSettings = angular.copy(this.params.data);
            this.calcAutoRollup();
            this.updateIntervalFromRollupInterval();
            this.calcUpdateIntervalString();
            this.checkAutoSimplifyTolerance();
            this.hideUnsupportedRollups();
        }
    };

    this.updateIntervalFromRollupInterval = function updateIntervalFromRollupInterval() {
        const intervalControlsPristine = !this.form ||
            ((!this.form.updateIntervals || this.form.updateIntervals.$pristine) &&
                (!this.form.updateIntervalPeriod || this.form.updateIntervalPeriod.$pristine));

        // only change updateInterval if user hasn't manually set it 
        if (intervalControlsPristine) {
            this.params.updateIntervals = this.params.rollupIntervals;
            this.params.updateIntervalPeriod = this.params.rollupIntervalPeriod;
        }
    };

    this.calcUpdateIntervalString = function calcUpdateIntervalString() {
        this.params.updateIntervalString = this.params.autoUpdate ? this.params.updateIntervals + ' ' + this.params.updateIntervalPeriod : '';
    };

    this.calcAutoRollup = function calcAutoRollup() {
        if (this.params.autoRollup) {
            const calc = Util.rollupIntervalCalculator(this.params.from, this.params.to, this.params.rollupType, true);
            this.params.rollupIntervals = calc.intervals;
            this.params.rollupIntervalPeriod = calc.units;
            this.updateIntervalFromRollupInterval();
        }
    };

    this.checkAutoSimplifyTolerance = function checkAutoSimplifyTolerance() {
        this.autoSimplifyTolerance = this.params.simplifyTolerance < 0;
    };

    this.hideUnsupportedRollups = () => {
        let currentRollups = [...this.rollupTypes];
        const defaultRollup = 'ARITHMETIC_MEAN';
        const availableRollupKeys = ['SUM', 'COUNT', 'ARITHMETIC_MEAN', 'MINIMUM_IN_PERIOD', 'MAXIMUM_IN_PERIOD', 'RANGE_IN_PERIOD'];
        const rollupMapping = {
            AVERAGE: 'ARITHMETIC_MEAN',
            MINIMUM: 'MINIMUM_IN_PERIOD',
            MAXIMUM: 'MAXIMUM_IN_PERIOD',
            DELTA: 'RANGE_IN_PERIOD'
        };

        const { aggregationEnabled, queryBoundary } = maUiServerInfo.postLoginData;
        const { nonNumeric } = this.params.data.rollupTypesFilter;
        if (!nonNumeric && aggregationEnabled && queryBoundary > 0) {
            const boundary = moment().subtract(queryBoundary, 'millisecond');
            if (boundary > this.params.from) {
                currentRollups = currentRollups.filter(rollup => availableRollupKeys.includes(rollup.type));
                if (!availableRollupKeys.includes(this.params.rollupType)) {
                    let newRollup = rollupMapping[this.params.rollupType];
                    newRollup = newRollup || defaultRollup;
                    this.changeRollupType(newRollup, true);
                }
            } else if (this.prevRollupType) {
                this.changeRollupType(this.prevRollupType);
            }
        }

        this.displayedRollupTypes = [...currentRollups];
    };

    this.changeRollupType = (newRollup, keepPrevious) => {
        if (keepPrevious) this.prevRollupType = angular.copy(this.params.rollupType);
        this.params.rollupType = newRollup;
        if (!keepPrevious) delete this.prevRollupType;

        const rollupTr = this.rollupTypes.find(r => r.type === this.params.rollupType).translation
        const rollupText = maTranslate.trSync(rollupTr);
        maDialogHelper.toastOptions({
            textTr: ['ui.app.rollupTypeChangedTo', rollupText],
            hideDelay: 5000
        });
    };
}

export default {
    template: dateBarTemplate,
    controller: DateBarController,
    bindings: {
        onRefresh: '&'
    }
};
