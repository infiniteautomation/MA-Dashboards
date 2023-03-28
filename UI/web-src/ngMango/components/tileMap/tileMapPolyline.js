/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

/**
 * @ngdoc directive
 * @name ngMango.directive:maTileMapPolyline
 * @restrict 'E'
 * @scope
 *
 * @description Adds a polyline to a <a ui-sref="ui.helps.docs.ngMango.maTileMap">maTileMap</a>. If content is supplied, it will be added to the map
 * as a popup that is opened when the polyline is clicked. Local scope variables that are available inside the polyline popup are
 * <code>$leaflet</code>, <code>$map</code>, <code>$mapCtrl</code>, <code>$polyline</code>, and <code>$polylineCtrl</code>.
 * 
 * @param {LatLng[]|string[]|number[][]} coordinates Coordinates (array of latitudes/longitudes) of the polyline, do not close the polyline as it will be
 * closed automatically
 * e.g. <code>[{lat: lat1, lng: lng1}, {lat: lat2, lng: lng2}, {lat: lat3, lng: lng3}]</code> or <code>[[lat1, lng2], [lat2, lng2], [lat3, lng3]]</code>
 * @param {string=} tooltip Text to display in the polyline tooltip
 * @param {expression=} on-click Expression is evaluated when the polyline is clicked.
 * Available locals are <code>$leaflet</code>, <code>$map</code>, <code>$polyline</code>, <code>$event</code>, and <code>$coordinates</code>.
 * @param {object=} options Options for the Leaflet polyline instance,
 * see <a href="https://leafletjs.com/reference-1.5.0.html#polyline-option" target="_blank">documentation</a>
 */

class TileMapPolylineController {
    static get $$ngIsClass() { return true; }
    static get $inject() { return ['$scope', '$element', '$transclude']; }
    
    constructor($scope, $element, $transclude) {
        this.$scope = $scope;
        this.$element = $element;
        this.$transclude = $transclude;
        
        this.mapCtrl = $scope.$mapCtrl;
    }
    
    $onChanges(changes) {
        if (!this.polyline) return;
        
        if (changes.coordinates && this.coordinates) {
            this.polyline.setLatLngs(this.getCoordinates());
        }
        
        if (changes.options && this.options) {
            this.polyline.setStyle(this.options);
        }
        
        if (changes.tooltip && this.tooltip) {
            this.polyline.bindTooltip(this.tooltip);
        }
    }

    $onInit() {
        this.polyline = this.mapCtrl.leaflet.polyline(this.getCoordinates(), this.options)
            .addTo(this.$scope.$layer);

        if (this.tooltip) {
            this.polyline.bindTooltip(this.tooltip);
        }

        if (typeof this.onClick === 'function') {
            this.polyline.on('click', event => {
                const locals = {$polyline: this.polyline, $event: event, $coordinates: this.polyline.getLatLngs()};
                this.$scope.$apply(() => {
                    this.onClick(locals);
                });
            });
        }

        this.$transclude(($clone, $scope) => {
            if ($clone.contents().length) {
                $scope.$polyline = this.polyline;
                $scope.$polylineCtrl = this;
                this.polyline.bindPopup($clone[0]);
            } else {
                $clone.remove();
                $scope.$destroy();
            }
        });
    }
    
    $onDestroy() {
        this.polyline.remove();
    }
    
    getCoordinates() {
        let coordinates = this.coordinates;
        if (Array.isArray(this.coordinates)) {
            coordinates = this.coordinates.map(latLng => this.mapCtrl.parseLatLong(latLng));
        }
        return coordinates;
    }
}

function tileMapPolylineDirective() {
    return {
        scope: false,
        bindToController: {
            coordinates: '<',
            options: '<?',
            tooltip: '@?',
            onClick: '&?'
        },
        transclude: 'element',
        controller: TileMapPolylineController
    };
}

export default tileMapPolylineDirective;