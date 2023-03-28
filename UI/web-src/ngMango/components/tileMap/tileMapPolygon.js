/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

/**
 * @ngdoc directive
 * @name ngMango.directive:maTileMapPolygon
 * @restrict 'E'
 * @scope
 *
 * @description Adds a polygon to a <a ui-sref="ui.helps.docs.ngMango.maTileMap">maTileMap</a>. If content is supplied, it will be added to the map
 * as a popup that is opened when the polygon is clicked. Local scope variables that are available inside the polygon popup are
 * <code>$leaflet</code>, <code>$map</code>, <code>$mapCtrl</code>, <code>$polygon</code>, and <code>$polygonCtrl</code>.
 * 
 * @param {LatLng[]|string[]|number[][]} coordinates Coordinates (array of latitudes/longitudes) of the polygon, do not close the polygon as it will be
 * closed automatically
 * e.g. <code>[{lat: lat1, lng: lng1}, {lat: lat2, lng: lng2}, {lat: lat3, lng: lng3}]</code> or <code>[[lat1, lng2], [lat2, lng2], [lat3, lng3]]</code>
 * @param {string=} tooltip Text to display in the polygon tooltip
 * @param {expression=} on-click Expression is evaluated when the polygon is clicked.
 * Available locals are <code>$leaflet</code>, <code>$map</code>, <code>$polygon</code>, <code>$event</code>, and <code>$coordinates</code>.
 * @param {object=} options Options for the Leaflet polygon instance,
 * see <a href="https://leafletjs.com/reference-1.5.0.html#polygon-option" target="_blank">documentation</a>
 */

class TileMapPolygonController {
    static get $$ngIsClass() { return true; }
    static get $inject() { return ['$scope', '$element', '$transclude']; }
    
    constructor($scope, $element, $transclude) {
        this.$scope = $scope;
        this.$element = $element;
        this.$transclude = $transclude;
        
        this.mapCtrl = $scope.$mapCtrl;
    }
    
    $onChanges(changes) {
        if (!this.polygon) return;
        
        if (changes.coordinates && this.coordinates) {
            this.polygon.setLatLngs(this.getCoordinates());
        }
        
        if (changes.options && this.options) {
            this.polygon.setStyle(this.options);
        }
        
        if (changes.tooltip && this.tooltip) {
            this.polygon.bindTooltip(this.tooltip);
        }
    }

    $onInit() {
        this.polygon = this.mapCtrl.leaflet.polygon(this.getCoordinates(), this.options)
            .addTo(this.$scope.$layer);

        if (this.tooltip) {
            this.polygon.bindTooltip(this.tooltip);
        }

        
        if (typeof this.onClick === 'function') {
            this.polygon.on('click', event => {
                const locals = {$polygon: this.polygon, $event: event, $coordinates: this.polygon.getLatLngs()};
                this.$scope.$apply(() => {
                    this.onClick(locals);
                });
            });
        }

        this.$transclude(($clone, $scope) => {
            if ($clone.contents().length) {
                $scope.$polygon = this.polygon;
                $scope.$polygonCtrl = this;
                this.polygon.bindPopup($clone[0]);
            } else {
                $clone.remove();
                $scope.$destroy();
            }
        });
    }
    
    $onDestroy() {
        this.polygon.remove();
    }
    
    getCoordinates() {
        let coordinates = this.coordinates;
        if (Array.isArray(this.coordinates)) {
            coordinates = this.coordinates.map(latLng => this.mapCtrl.parseLatLong(latLng));
        }
        return coordinates;
    }
}

function tileMapPolygonDirective() {
    return {
        scope: false,
        bindToController: {
            coordinates: '<',
            options: '<?',
            tooltip: '@?',
            onClick: '&?'
        },
        transclude: 'element',
        controller: TileMapPolygonController
    };
}

export default tileMapPolygonDirective;