/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

/**
 * @ngdoc directive
 * @name ngMango.directive:maTileMapLayer
 * @restrict 'E'
 * @scope
 *
 * @description Adds a overlay layer to a <a ui-sref="ui.helps.docs.ngMango.maTileMap">maTileMap</a> or another maTileMapLayer.
 * Any components which can be added to a maTileMap can be added to a maTileMapLayer.
 * 
 * @param {boolean=} [enabled=false] Adds/removes the tile layer from the parent map/layer
 * @param {string} name Name of the layer, used as the label in the layer controls
 * @param {boolean=} [enabled=true] Adds or removes the layer from the map/parent layer
 * @param {object=} options Options for the Leaflet layer instance,
 * see <a href="https://leafletjs.com/reference-1.5.0.html#layer-option" target="_blank">documentation</a>
 */

class TileMapLayerController {
    static get $$ngIsClass() { return true; }
    static get $inject() { return ['$scope', '$element', '$transclude']; }
    
    constructor($scope, $element, $transclude) {
        this.$scope = $scope;
        this.$element = $element;
        this.$transclude = $transclude;
        
        this.mapCtrl = $scope.$mapCtrl;
    }
    
    $onChanges(changes) {
        if (!this.layer) return;
        
        if (changes.enabled) {
            if (this.enabled) {
                this.layer.addTo(this.$scope.$layer);
            } else {
                this.layer.remove();
            }
        }
    }

    $onInit() {
        this.$transclude(($clone, $scope) => {
            this.contents = $clone;

            this.layer = this.mapCtrl.leaflet.layerGroup([], this.options);
            $scope.$layer = this.layer;
            
            // add the layer to the map controls if the parent layer is the map layer
            if (this.$scope.$layer === this.mapCtrl.map) {
                this.mapCtrl.addLayer(this.layer, this.name);
            }
            
            if (this.enabled) {
                this.layer.addTo(this.$scope.$layer);
            }
        });
    }
    
    $onDestroy() {
        // remove the layer from the map controls if the parent layer is the map layer
        if (this.$scope.$layer === this.mapCtrl.map) {
            this.mapCtrl.removeLayer(this.layer);
        }
        this.layer.remove();
    }
}

function tileMapLayerDirective() {
    return {
        scope: false,
        bindToController: {
            name: '@',
            options: '<?',
            enabled: '<?'
        },
        transclude: 'element',
        controller: TileMapLayerController
    };
}

export default tileMapLayerDirective;