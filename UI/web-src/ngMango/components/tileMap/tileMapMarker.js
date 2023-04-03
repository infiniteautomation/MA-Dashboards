/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

/**
 * @ngdoc directive
 * @name ngMango.directive:maTileMapMarker
 * @restrict 'E'
 * @scope
 *
 * @description Adds a marker to a <a ui-sref="ui.helps.docs.ngMango.maTileMap">maTileMap</a>. If content is supplied, it will be added to the map
 * as a popup that is opened when the marker is clicked. Local scope variables that are available inside the marker popup are
 * <code>$leaflet</code>, <code>$map</code>, <code>$mapCtrl</code>, <code>$marker</code>, and <code>$markerCtrl</code>.
 * 
 * @param {LatLng|number[]|string} coordinates Coordinates (latitude/longitude) of the marker
 * @param {string=} tooltip Text to display in the marker tooltip
 * @param {expression=} on-drag Expression is evaluated when the marker been dragged (only once, when dragging has stopped).
 * You must specify <code>draggable: true</code> in the options to make the marker draggable.
 * Available locals are <code>$leaflet</code>, <code>$map</code>, <code>$marker</code>, <code>$event</code>, and <code>$coordinates</code>.
 * @param {expression=} on-click Expression is evaluated when the marker is clicked.
 * Available locals are <code>$leaflet</code>, <code>$map</code>, <code>$marker</code>, <code>$event</code>, and <code>$coordinates</code>.
 * @param {object=} options Options for the Leaflet marker instance,
 * see <a href="https://leafletjs.com/reference-1.5.0.html#marker-option" target="_blank">documentation</a>
 */

class TileMapMarkerController {
    static get $$ngIsClass() { return true; }
    static get $inject() { return ['$scope', '$element', '$transclude']; }
    
    constructor($scope, $element, $transclude) {
        this.$scope = $scope;
        this.$element = $element;
        this.$transclude = $transclude;
        
        this.mapCtrl = $scope.$mapCtrl;
    }
    
    $onChanges(changes) {
        if (!this.marker) return;
        
        if (changes.coordinates && this.coordinates) {
            const coords = this.mapCtrl.parseLatLong(this.coordinates) || [0, 0];
            this.marker.setLatLng(coords);
        }

        if (changes.tooltip && this.tooltip) {
            this.marker.bindTooltip(this.tooltip);
        }
        
        if (changes.icon) {
            this.updateIcon();
        }
    }

    $onInit() {
        const coords = this.mapCtrl.parseLatLong(this.coordinates) || [0, 0];
        this.marker = this.mapCtrl.leaflet.marker(coords, this.options)
            .addTo(this.$scope.$layer);

        if (this.tooltip) {
            this.marker.bindTooltip(this.tooltip);
        }
        
        this.updateIcon();
        
        if (typeof this.onDrag === 'function') {
            this.marker.on('dragend', event => {
                const locals = {$marker: this.marker, $event: event, $coordinates: this.marker.getLatLng()};
                this.$scope.$apply(() => {
                    this.onDrag(locals);
                });
            });
        }
        
        if (typeof this.onClick === 'function') {
            this.marker.on('click', event => {
                const locals = {$marker: this.marker, $event: event, $coordinates: this.marker.getLatLng()};
                this.$scope.$apply(() => {
                    this.onClick(locals);
                });
            });
        }

        this.$transclude(($clone, $scope) => {
            if ($clone.contents().length) {
                $scope.$marker = this.marker;
                $scope.$markerCtrl = this;
                this.marker.bindPopup($clone[0], this.popupOptions);
            } else {
                $clone.remove();
                $scope.$destroy();
            }
        });
    }
    
    $onDestroy() {
        this.marker.remove();
    }
    
    updateIcon() {
        const defaultIcon = this.mapCtrl.leaflet.Marker.prototype.options.icon;
        
        let icon;
        if (this.icon instanceof this.mapCtrl.leaflet.Icon) {
            icon = this.icon;
        } else if (typeof this.icon === 'string') {
            icon = this.mapCtrl.leaflet.icon({
                iconUrl: this.icon
            });
        } else if (this.icon && typeof this.icon === 'object') {
            icon = this.mapCtrl.leaflet.icon(this.icon);
        } else {
            icon = defaultIcon;
        }
        
        if (!('shadowUrl' in icon.options)) {
            icon.options.shadowUrl = defaultIcon.options.shadowUrl;
            icon.options.shadowSize = defaultIcon.options.shadowSize;
            icon.options.shadowAnchor = defaultIcon.options.shadowAnchor || defaultIcon.options.iconAnchor;
        }
        
        this.marker.setIcon(icon);
    }
}

function tileMapMarkerDirective() {
    return {
        scope: false,
        bindToController: {
            coordinates: '<',
            options: '<?',
            popupOptions: '<?',
            tooltip: '@?',
            onDrag: '&?',
            onClick: '&?',
            icon: '<?'
        },
        transclude: 'element',
        controller: TileMapMarkerController
    };
}

export default tileMapMarkerDirective;