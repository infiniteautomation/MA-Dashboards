/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import TableController from '../../classes/TableController';
import dataPointSelectorTemplate from './dataPointSelector.html';
import './dataPointSelector.css';

const defaultColumns = [
    {name: 'xid', label: 'ui.app.xidShort'},
    {name: 'dataSourceName', label: 'ui.app.dataSource'},
    {name: 'dataType', label: 'dsEdit.pointDataType', type: 'enum'},
    {name: 'deviceName', label: 'common.deviceName', selectedByDefault: true},
    {name: 'name', label: 'common.name', selectedByDefault: true},
    {name: 'enabled', label: 'common.enabled', type: 'boolean'},
    {name: 'readPermission', label: 'pointEdit.props.permission.read'},
    {name: 'setPermission', label: 'pointEdit.props.permission.set'},
    {name: 'unit', label: 'pointEdit.props.unit', filterable: false, sortable: false},
    {name: 'chartColour', label: 'pointEdit.props.chartColour', filterable: false, sortable: false},
    {name: 'plotType', label: 'pointEdit.plotType', filterable: false, sortable: false},
    {name: 'rollup', label: 'common.rollup', type: 'enum'},
    {name: 'integralUnit', label: 'pointEdit.props.integralUnit', filterable: false, sortable: false},
    {name: 'simplifyType', label: 'pointEdit.props.simplifyType', filterable: false, sortable: false},
    {name: 'simplifyTolerance', label: 'pointEdit.props.simplifyTolerance', type: 'number', filterable: false, sortable: false},
    {name: 'simplifyTarget', label: 'pointEdit.props.simplifyTarget', type: 'number', filterable: false, sortable: false},
    {name: 'value', label: 'ui.app.pointValue', filterable: false, sortable: false, order: 1000}
];

class DataPointSelectorController extends TableController {

    static get $inject() { return ['maPoint', 'maDataPointTags', '$scope', '$element', '$injector']; }

    constructor(maPoint, maDataPointTags, $scope, $element, $injector) {
        super({
            $scope,
            $element,
            $injector,

            resourceService: maPoint,
            localStorageKey: 'dataPointSelector',
            defaultColumns,
            defaultSort: [{columnName: 'deviceName'}, {columnName: 'name'}]
        });

        this.maDataPointTags = maDataPointTags;
    }

    loadColumns() {
        return super.loadColumns().then(() => {
            return this.maDataPointTags.keys();
        }).then((keys) => {
            const filters = this.settings.filters || {};
            this.tagColumns = keys.filter(k => !['device', 'name'].includes(k)).map((k, i) => {
                const name = `tags.${k}`;
                return this.createColumn({
                    tagKey: k,
                    name,
                    label: 'ui.app.tag',
                    labelArgs: [k],
                    filter: filters[name] || null,
                    order: 500 + i,
                    dateFormat: this.dateFormat
                });
            })
            this.nonTagColumns = this.columns;
            this.columns = this.columns.concat(this.tagColumns);
        });
    }

    customizeQuery(queryBuilder) {
        if (this.settable != null) {
            queryBuilder.eq('settable', this.settable);
        }
        if (Array.isArray(this.dataTypes)) {
            queryBuilder.in('dataType', this.dataTypes);
        }
        if (typeof this.userCustomize === 'function') {
            this.userCustomize({$queryBuilder: queryBuilder});
        }
    }
}

export default {
    template: dataPointSelectorTemplate,
    controller: DataPointSelectorController,
    require: {
        ngModelCtrl: 'ngModel',
        dropDownCtrl: '?^^maDropDown'
    },
    bindings: {
        localStorageKey: '<?',
        selectMultiple: '<?',
        showClear: '<?',
        rowClicked: '&?',
        settable: '<?',
        dataTypes: '<?types',
        userCustomize: '&?customizeQuery'
    }
};