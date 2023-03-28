/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

/**
 * @ngdoc directive
 * @name ngMango.directive:maSwitchImg
 * @restrict E
 * @description
 * `<ma-switch-img></ma-switch-img>`
 * - `<ma-switch-img>` displays an image who's image source will be switched based on a point's value.
 * - Use default-src to set the default image that will display if no match is found or the point is disabled.
 * - <a ui-sref="ui.helps.examples.singleValueDisplays.switchImage">View Demo</a> 
 *
 * @param {object=} point A data point object from a watch list, point query, point drop-down, `maPoint` service, or `<ma-get-point-value>` component.
 * @param {string=} point-xid Instead of supplying a data point object, you can supply it's XID.
 * @param {string=} default-src Set the default image path that will display if no match is found or the point is disabled.
 * @param {object=} src-map Use an object to map any data point value to an image path: (`{'value1': 'img/image1.png',
 * 'value2': 'img/image2.png'}`)
 * @param {string=} src-### The part of attribute after `src-` (the `###`) is used to compare against the point value.
 For strings with spaces replace the spaces in the point value with dashes in attribute name. *Not to be used with `src-map` attribute.
 * @param {*=} value Alternatively to passing in a point you can use the `value` attribute to pass in a raw value.
 * @param {boolean=} toggle-on-click Set to true to enable click to toggle. *Only works with binary data points.
 * @param {string} label Displays a label next to the point value. Three special options are available:
 *      NAME, DEVICE_AND_NAME, and DEVICE_AND_NAME_WITH_TAGS
 * @param {expression=} label-expression Expression that is evaluated to set the label. Gives more control for formatting the label.
 *     Takes precedence over the label attribute. Available locals are $point (Data point object).
 *
 * @usage
 <ma-point-list limit="200" ng-model="myPoint"></ma-point-list>
 <ma-point-value point="myPoint"></ma-point-value>

 <ma-switch-img point="myPoint" src-false="img/ligthbulb_off.png" src-true="img/ligthbulb_on.png"
 default-src="img/close.png" toggle-on-click="true"></ma-switch-img>
 *
 */
switchImg.$inject = ['maPointValueController', 'maUtil'];
function switchImg(PointValueController, maUtil) {
    
    const replaceAll = function replaceAll(target, search, replacement) {
        return target.replace(new RegExp(search, 'g'), replacement);
    };
    
    class SwitchImgController extends PointValueController {

        $onChanges(changes) {
            super.$onChanges(...arguments);
            
            if (changes.srcMap && !changes.srcMap.isFirstChange() || changes.defaultSrc && !changes.defaultSrc.isFirstChange()) {
                this.updateImage();
            }
            
            if (changes.toggleOnClick) {
                if (this.toggleOnClick) {
                    this.$element.on('click.maIndicator', this.clickHandler.bind(this));
                    this.$element.attr('role', 'button');
                } else {
                    this.$element.off('click.maIndicator');
                    this.$element.removeAttr('role');
                }
            }
        }
    
        valueChangeHandler() {
            super.valueChangeHandler(...arguments);
            
            this.updateImage();
    
            if (this.point && this.point.pointLocator && !this.point.pointLocator.settable) {
                this.$element.attr('disabled', 'disabled');
            } else {
                this.$element.removeAttr('disabled');
            }
        }
    
        updateImage() {
            const value = this.getValue();
    
            if (value == null) {
                delete this.src;
            } else {
                // TODO better conversion to attr name for symbols etc
                const valueString = typeof value === 'string' ? replaceAll(value, ' ', '-').toLowerCase() : value.toString();
                
                const attrName = maUtil.camelCase('src-' + valueString);
                this.src = this.$attrs[attrName];
    
                if (!this.src && this.srcMap) {
                    this.src = this.srcMap[value];
                }
            }
            if (!this.src) {
                this.src = this.defaultSrc || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
            }
        }
    
        clickHandler() {
            if (this.point && !this.$element.attr('disabled')) {
                this.point.toggleValue();
            }
        }
    }

    return {
        restrict: 'E',
        template: `<img ng-src="{{$ctrl.src}}">
<div ng-if="$ctrl.label" ng-bind="$ctrl.label" class="ma-point-value-label"></div>`,
        scope: {},
        controller: SwitchImgController,
        controllerAs: '$ctrl',
        bindToController: {
            point: '<?',
            pointXid: '@?',
            srcFalse: '@?',
            srcTrue: '@?',
            defaultSrc: '@?',
            srcMap: '<?',
            src0: '@?',
            src1: '@?',
            src2: '@?',
            src3: '@?',
            value: '<?',
            renderValue: '&?',
            toggleOnClick: '<?',
            labelAttr: '@?label',
            labelExpression: '&?'
        },
        designerInfo: {
            translation: 'ui.components.switchImg',
            icon: 'image',
            category: 'pointValue',
            attributes: {
                point: {nameTr: 'ui.app.dataPoint', type: 'datapoint'},
                pointXid: {nameTr: 'ui.components.dataPointXid', type: 'datapoint-xid'},
                toggleOnClick: {nameTr: 'ui.components.toggleOnClick', type: 'boolean'},
                srcTrue: {type: 'choosefile', optional: true},
                srcFalse: {type: 'choosefile', optional: true},
                defaultSrc: {type: 'choosefile'},
                srcMap: {type: 'string'},
                src0: {type: 'choosefile', optional: true},
                src1: {type: 'choosefile', optional: true},
                src2: {type: 'choosefile', optional: true},
                src3: {type: 'choosefile', optional: true},
                value: {type: 'string'},
                label: {options: ['NAME', 'DEVICE_AND_NAME', 'DEVICE_AND_NAME_WITH_TAGS']}
            }
        }
    };
}

export default switchImg;
