/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

/**
 * @ngdoc directive
 * @name ngMango.directive:maTileMapRectangle
 * @restrict 'E'
 * @scope
 *
 * @description Adds a rectangle to a <a ui-sref="ui.helps.docs.ngMango.maTileMap">maTileMap</a>. If content is supplied, it will be added to the map
 * as a popup that is opened when the rectangle is clicked. Local scope variables that are available inside the rectangle popup are
 * <code>$leaflet</code>, <code>$map</code>, <code>$mapCtrl</code>, <code>$rectangle</code>, and <code>$rectangleCtrl</code>.
 * 
 * @param {LatLngBounds|LatLng[]|string[]|number[][]} bounds Bounds (array of 2 latitudes/longitudes, specifying the corners) of the rectangle.
 * e.g. <code>[{lat: lat1, lng: lng1}, {lat: lat2, lng: lng2}]</code> or <code>[[lat1, lng2], [lat2, lng2]]</code>
 * @param {string=} tooltip Text to display in the rectangle tooltip
 * @param {expression=} on-click Expression is evaluated when the rectangle is clicked.
 * Available locals are <code>$leaflet</code>, <code>$map</code>, <code>$rectangle</code>, <code>$event</code>, and <code>$bounds</code>.
 * @param {object=} options Options for the Leaflet rectangle instance,
 * see <a href="https://leafletjs.com/reference-1.5.0.html#rectangle-option" target="_blank">documentation</a>
 */

class TileMapRectangleController {
    static get $$ngIsClass() { return true; }
    static get $inject() { return ['$scope', '$element', '$transclude']; }
    
    constructor($scope, $element, $transclude) {
        this.$scope = $scope;
        this.$element = $element;
        this.$transclude = $transclude;
        
        this.mapCtrl = $scope.$mapCtrl;
    }
    
    $onChanges(changes) {
        if (!this.rectangle) return;
        
        if (changes.bounds && this.bounds) {
            this.rectangle.setBounds(this.getBounds());
        }
        
        if (changes.options && this.options) {
            this.rectangle.setStyle(this.options);
        }
        
        if (changes.tooltip && this.tooltip) {
            this.rectangle.bindTooltip(this.tooltip);
        }
    }

    $onInit() {
        this.rectangle = this.mapCtrl.leaflet.rectangle(this.getBounds(), this.options)
            .addTo(this.$scope.$layer);

        if (this.tooltip) {
            this.rectangle.bindTooltip(this.tooltip);
        }

        if (typeof this.onClick === 'function') {
            this.rectangle.on('click', event => {
                const locals = {$rectangle: this.rectangle, $event: event, $bounds: this.rectangle.getBounds()};
                this.$scope.$apply(() => {
                    this.onClick(locals);
                });
            });
        }

        this.$transclude(($clone, $scope) => {
            if ($clone.contents().length) {
                $scope.$rectangle = this.rectangle;
                $scope.$rectangleCtrl = this;
                this.rectangle.bindPopup($clone[0]);
            } else {
                $clone.remove();
                $scope.$destroy();
            }
        });
    }
    
    $onDestroy() {
        this.rectangle.remove();
    }
    
    getBounds() {
        let bounds = this.bounds;
        if (Array.isArray(this.bounds)) {
            bounds = this.bounds.map(latLng => this.mapCtrl.parseLatLong(latLng));
        }
        return bounds;
    }
}

function tileMapRectangleDirective() {
    return {
        scope: false,
        bindToController: {
            bounds: '<',
            options: '<?',
            tooltip: '@?',
            onClick: '&?'
        },
        transclude: 'element',
        controller: TileMapRectangleController
    };
}

export default tileMapRectangleDirective;