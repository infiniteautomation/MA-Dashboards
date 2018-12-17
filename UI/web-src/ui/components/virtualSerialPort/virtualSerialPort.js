/**
 * @copyright 2018 {@link http://infiniteautomation.com|Infinite Automation Systems, Inc.} All rights reserved.
 * @author Luis Güette
 */

import componentTemplate from './virtualSerialPort.html';

/**
 * @ngdoc directive
 * @name ngMango.directive:maVirtualSerialPort
 * @restrict E
 * @description Displays a form create Virtual Serial Ports
 */

const $inject = Object.freeze(['$scope']);
class VirtualSerialPort {
    static get $inject() { return $inject; }
    static get $$ngIsClass() { return true; }
    
    constructor($scope) {
        this.$scope = $scope;
    }
    
    $onInit() {
        
    }

}

export default {
    template: componentTemplate,
    controller: VirtualSerialPort,
    bindings: {
    },
    require: {},
    designerInfo: {
        translation: 'systemSettings.comm.virtual.serialPorts',
        icon: 'settings_input_hdmi'
    }
};