/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

/**
 * @ngdoc directive
 * @name ngMango.directive:maTileMapTileLayer
 * @restrict 'E'
 * @scope
 *
 * @description Adds a tile layer to a <a ui-sref="ui.helps.docs.ngMango.maTileMap">maTileMap</a>. If content is supplied, it will be added as
 * attribution text.
 * 
 * @param {boolean=} [enabled=false] Adds/removes the tile layer from the parent map/layer
 * @param {string} tileLayerId ID of the layer, if you specify <code>openstreetmap</code>, <code>mapbox.satellite</code>, or <code>mapbox.streets</code>
 * the URL and options will be automatically configured.
 * @param {string} name Name of the layer, used as the label in the layer controls
 * @param {string=} url URL template for requesting tiles. Defaults to <code>https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png</code>
 * @param {object=} options Options for the Leaflet tileLayer instance,
 * see <a href="https://leafletjs.com/reference-1.5.0.html#tilelayer-option" target="_blank">documentation</a>
 */

class TileMapTileLayerController {
    static get $$ngIsClass() { return true; }
    static get $inject() { return ['$scope', '$element', '$transclude']; }
    
    constructor($scope, $element, $transclude) {
        this.$scope = $scope;
        this.$element = $element;
        this.$transclude = $transclude;
        
        this.mapCtrl = $scope.$mapCtrl;
    }
    
    $onChanges(changes) {
        if (!this.tileLayer) return;
        
        if (changes.url && this.url) {
            this.tileLayer.setUrl(this.url);
        }
        
        if (changes.enabled) {
            if (this.enabled) {
                this.tileLayer.addTo(this.$scope.$layer);
            } else {
                this.tileLayer.remove();
            }
        }
    }

    $onInit() {
        this.$transclude(($clone, $scope) => {
            const options = Object.assign({}, this.options);

            if ($clone.contents().length) {
                options.attribution = $clone[0].innerHTML;
            }
            $clone.remove();
            $scope.$destroy();
            
            this.tileLayer = this.mapCtrl.createTileLayer(this.tileLayerId, this.url, options);
            
            // add the tile layer to the map controls if the parent layer is the map layer
            if (this.$scope.$layer === this.mapCtrl.map) {
                this.mapCtrl.addTileLayer(this.tileLayer, this.name);
            }
            
            if (this.enabled) {
                this.tileLayer.addTo(this.$scope.$layer);
            }
        });
    }
    
    $onDestroy() {
        // remove the tile layer from the map controls if the parent layer is the map layer
        if (this.$scope.$layer === this.mapCtrl.map) {
            this.mapCtrl.removeTileLayer(this.tileLayer);
        }
        this.tileLayer.remove();
    }
}

function tileMapTileLayerDirective() {
    return {
        scope: false,
        bindToController: {
            tileLayerId: '@',
            name: '@',
            url: '@?',
            options: '<?',
            enabled: '<?'
        },
        transclude: 'element',
        controller: TileMapTileLayerController
    };
}

export default tileMapTileLayerDirective;