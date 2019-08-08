/**
 * @copyright 2019 {@link http://infiniteautomation.com|Infinite Automation Systems, Inc.} All rights reserved.
 * @author Jared Wiltshire
 */

/**
 * @ngdoc directive
 * @name ngMango.directive:maTileMapMarker
 * @restrict 'E'
 * @scope
 *
 * @description Adds a marker to a <a ui-sref="ui.docs.ngMango.maTileMap">maTileMap</a>. If content is supplied, it will be added to the map
 * as a popup that is opened when the marker is clicked.
 * 
 * @param {number[]|string} coordinates Coordinates (latitude/longitude) of the marker
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
        
        this.mapCtrl = this.$scope.$mapCtrl;
        this.map = this.mapCtrl.map;
        this.leaflet = this.mapCtrl.leaflet;
    }
    
    $onChanges(changes) {
        if (!this.marker) return;
        
        if (changes.coordinates && this.coordinates) {
            this.marker.setLatLng(this.mapCtrl.parseLatLong(this.coordinates));
        }
        
        if (changes.tooltip && this.tooltip) {
            this.marker.bindTooltip(this.tooltip);
        }
    }

    $onInit() {
        const L = this.leaflet;

        const options = this.options && this.options({$leaflet: L, $map: this.map});
        this.marker = L.marker(this.mapCtrl.parseLatLong(this.coordinates), options)
            .addTo(this.map);

        if (this.tooltip) {
            this.marker.bindTooltip(this.tooltip);
        }
        
        this.marker.on('dragend click', event => {
            this.$scope.$apply(() => {
                if (event.type === 'dragend' && this.onDrag) {
                    this.onDrag({$leaflet: L, $map: this.map, $marker: this.marker, $event: event, $coordinates: this.marker.getLatLng()});
                } else if (event.type === 'click' && this.onClick) {
                    this.onClick({$leaflet: L, $map: this.map, $marker: this.marker, $event: event, $coordinates: this.marker.getLatLng()});
                }
            });
        });

        this.$transclude(($clone, $scope) => {
            if ($clone.length) {
                this.transcludedContent = $clone;
                this.$element.append($clone);

                $scope.$marker = this.marker;
                $scope.$markerCtrl = this;
                this.marker.bindPopup(this.$element[0]);
            }
        });
    }
    
    $onDestroy() {
        this.marker.remove();
    }
}

function openMarkMarkerDirective() {
    return {
        scope: false,
        bindToController: {
            coordinates: '<?',
            options: '&?',
            tooltip: '@?',
            onDrag: '&?',
            onClick: '&?'
        },
        transclude: true,
        controller: TileMapMarkerController
    };
}

export default openMarkMarkerDirective;