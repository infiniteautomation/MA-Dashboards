/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

/**
 * @ngdoc directive
 * @name ngMango.directive:maTileMap
 * @restrict 'E'
 * @scope
 *
 * @description Displays a tile map provided by <a href="https://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> or
 * <a href="https://www.mapbox.com/" target="_blank">Mapbox</a> using <a href="https://leafletjs.com/" target="_blank">Leaflet</a>.
 * 
 * By default the component displays map tiles from OpenStreetMap. If a Mapbox access token is supplied via the attribute or via the
 * <a ui-sref="ui.uiSettings.uiSettings">UI settings</a> page then the component will automatically add a Mapbox street and satellite layer.
 * 
 * Add the following components into the element contents to add add items to the map.
 * <ul>
 *   <li><a ui-sref="ui.helps.docs.ngMango.maTileMapTileLayer">maTileMapTileLayer</a> &mdash; adds a tile base layer</li>
 *   <li><a ui-sref="ui.helps.docs.ngMango.maTileMapLayer">maTileMapLayer</a> &mdash; adds an overlay layer</li>
 *   <li><a ui-sref="ui.helps.docs.ngMango.maTileMapMarker">maTileMapMarker</a> &mdash; adds a marker with an icon</li>
 *   <li><a ui-sref="ui.helps.docs.ngMango.maTileMapCircle">maTileMapCircle</a> &mdash; adds circle</li>
 *   <li><a ui-sref="ui.helps.docs.ngMango.maTileMapRectangle">maTileMapRectangle</a> &mdash; adds a rectangle</li>
 *   <li><a ui-sref="ui.helps.docs.ngMango.maTileMapPolygon">maTileMapPolygon</a> &mdash; adds a polygon</li>
 *   <li><a ui-sref="ui.helps.docs.ngMango.maTileMapPolyline">maTileMapPolyline</a> &mdash; adds a line</li>
 * </ul>
 * 
 * Local scope variables that are available inside the content are
 * <code>$leaflet</code>, <code>$map</code>, and <code>$mapCtrl</code>.
 * 
 * @param {number[]|string} center Coordinates (latitude/longitude) of the center of the map
 * @param {number=} [zoom=13] Zoom level (0-18)
 * @param {boolean=} [automatic-tile-layers=true] Enables/disables the automatic adding of tile layers
 * @param {expression=} on-move Expression is evaluated when the map has finished moving/zooming (only once, when panning/zooming has stopped).
 * Available locals are <code>$leaflet</code>, <code>$map</code>, <code>$event</code>, <code>$center</code>, and <code>$zoom</code>.
 * @param {string=} mapbox-access-token Access token for the Mapbox API, if not supplied only OpenStreetMap will be available. Can also
 * be specified on the UI settings page.
 * @param {object=} options Options for the Leaflet map instance,
 * see <a href="https://leafletjs.com/reference-1.5.0.html#map-option" target="_blank">documentation</a>
 */

import './tileMap.css';

class TileMapController {
    static get $$ngIsClass() { return true; }
    static get $inject() { return ['$scope', '$element', '$transclude', '$injector']; }
    
    constructor($scope, $element, $transclude, $injector) {
        this.$scope = $scope;
        this.$element = $element;
        this.$transclude = $transclude;
        
        if ($injector.has('maUiSettings')) {
            this.uiSettings = $injector.get('maUiSettings');
        }
        
        this.automaticTileLayers = true;
        this.center = [0, 0];
        this.zoom = 13;
        this.tileLayers = new Set();
        this.layers = new Set();
        
        this.loadLeaflet();
    }
    
    loadLeaflet() {
        this.leafletPromise = import(/* webpackMode: "lazy", webpackChunkName: "leaflet" */ 'leaflet/dist/leaflet.css').then(() => {
            const leaflet = import(/* webpackMode: "lazy", webpackChunkName: "leaflet" */ 'leaflet');
            const marker = import(/* webpackMode: "lazy", webpackChunkName: "leaflet" */ 'leaflet/dist/images/marker-icon.png');
            const marker2x = import(/* webpackMode: "lazy", webpackChunkName: "leaflet" */ 'leaflet/dist/images/marker-icon-2x.png');
            const markerShadow = import(/* webpackMode: "lazy", webpackChunkName: "leaflet" */ 'leaflet/dist/images/marker-shadow.png');
            return Promise.all([leaflet, marker, marker2x, markerShadow]);
        }).then(([leaflet, marker, marker2x, markerShadow]) => {
            this.leaflet = leaflet;

            // workaround https://github.com/Leaflet/Leaflet/issues/4849
            delete this.leaflet.Icon.Default.prototype._getIconUrl;

            this.leaflet.Icon.Default.mergeOptions({
                //imagePath: '/modules/mangoUI/web/img/',
                iconRetinaUrl: marker2x.default,
                iconUrl: marker.default,
                shadowUrl: markerShadow.default
            });
            
            this.renderMap();
        });
    }
    
    $onDestroy() {
        this.leafletPromise.finally(() => {
            if (this.map) {
                this.map.remove();
            }
        });
    }
    
    $onChanges(changes) {
        if (!this.map) return;

        if (changes.center || changes.zoom) {
            const center = this.parseLatLong(this.center) || this.map.getCenter();
            const zoom = this.zoom != null ? this.zoom : this.map.getZoom();

            this.map.setView(center, zoom);
        }
        
        if (changes.showLocation) {
            if (this.showLocation) {
                this.locate();
            } else {
                this.map.stopLocate();
                if (this.locationCircle) {
                    this.locationCircle.remove();
                    delete this.locationCircle;
                }
            }
        }
    }

    parseLatLong(coordinates) {
        try {
            if (typeof coordinates === 'string') {
                coordinates = coordinates.split(',').map(str => {
                    try {
                        return Number.parseFloat(str, 10);
                    } catch (e) {
                        return null;
                    }
                }).filter(v => v != null);
            }
            return this.leaflet.latLng(coordinates);
        } catch (e) {
            return null;
        }
    }
    
    renderMap() {
        const L = this.leaflet;
        const options = this.options && this.options({$leaflet: L});
        const map = this.map = L.map(this.$element[0], options);
        
        // leaflet link doesn't have target _blank
        map.attributionControl.setPrefix();
        
        this.layerControl = L.control.layers();

        this.map.on('moveend', event => {
            // calls to setView() in $onChanges cause this event to fire, resulting in a $rootScope:inprog error
            // dont want these events anyway
            if (this.$scope.$root.$$phase != null) return;

            // worth noting that there is some sort of rounding / math going on with the coordinates
            // e.g. if you call setView() with latitude 40.05 it fires the moveend event telling us we have moved to 40.0499567754414
            // if you then use feed this back through to the center attribute you can get multiple moveend events fired
            
            const currentCenter = this.map.getCenter();
            const currentZoom = this.map.getZoom();
            const center = this.parseLatLong(this.center) || currentCenter;
            const zoom = this.zoom != null ? this.zoom : currentZoom;
            if (!center.equals(currentCenter) || zoom !== currentZoom) {
                const locals = {$leaflet: L, $map: this.map, $event: event, $center: currentCenter, $zoom: currentZoom};
                this.$scope.$apply(() => {
                    if (event.type === 'moveend' && this.onMove) {
                        this.onMove(locals);
                    }
                });
            }
        });
        
        map.on('locationfound', event => {
            if (!this.locationCircle) {
                this.locationCircle = L.circle(event.latlng, event.accuracy);
                this.locationCircle.addTo(map);
            } else {
                this.locationCircle.setLatLng(event.latlng);
                this.locationCircle.setRadius(event.accuracy);
            }
        });

        const center = this.parseLatLong(this.center);
        if (center) {
            map.setView(this.parseLatLong(this.center), this.zoom);
        }
        if (this.showLocation) {
            this.locate();
        }

        if (this.$element.hasClass('ma-designer-element')) {
            this.map._handlers.forEach(h => h.disable());
        }

        this.$transclude(($clone, $scope) => {
            this.contents = $clone;
            
            $scope.$mapCtrl = this;
            $scope.$map = this.map;
            $scope.$layer = this.map;
            $scope.$leaflet = this.leaflet;
        });
        
        if (!this.tileLayers.size && this.automaticTileLayers) {
            this.autoAddTileLayers();
        }
        
        // add the first tile layer to the map if none are already added
        const tileLayersArray = Array.from(this.tileLayers.values());
        if (tileLayersArray.length && !tileLayersArray.some(l => this.map.hasLayer(l))) {
            tileLayersArray[0].addTo(this.map);
        }
    }
    
    locate(options = this.showLocation) {
        if (typeof options !== 'object') {
            options = {setView: true, maxZoom: 16};
        }
        this.map.locate(options);
    }
    
    autoAddTileLayers() {
        if (this.getMapboxAccessToken()) {
            this.addTileLayer(this.createTileLayer('mapbox.streets-v11'), 'Streets');
            this.addTileLayer(this.createTileLayer('mapbox.satellite-v9'), 'Satellite');
        } else {
            this.addTileLayer(this.createTileLayer('openstreetmap'), 'Streets');
        }
    }
    
    addTileLayer(layer, name) {
        // add it to our set
        this.tileLayers.add(layer);
        
        // add it to the layer controls
        this.layerControl.addBaseLayer(layer, name);
        
        // add the layer controls to the map
        if (this.tileLayers.size > 1) {
            this.layerControl.addTo(this.map);
        }
    }
    
    removeTileLayer(layer) {
        // remove it from our set
        this.tileLayers.delete(layer);
        
        // remove the layer from the controls
        this.layerControl.removeLayer(layer);
        
        // if the removed layer is the active layer, set the active layer to one of the other ones
        if (this.map.hasLayer(layer) && this.tileLayers.size) {
            const firstLayer = this.tileLayers.values().next().value;
            firstLayer.addTo(this.map);
        }
        
        // hide the layer controls
        if (this.tileLayers.size <= 1 && !this.layers.size) {
            this.layerControl.remove();
        }
    }
    
    addLayer(layer, name) {
        // add it to our set
        this.layers.add(layer);
        
        // add it to the layer controls
        this.layerControl.addOverlay(layer, name);
        
        // add the layer controls to the map
        this.layerControl.addTo(this.map);
    }
    
    removeLayer(layer) {
        // remove it from our set
        this.tileLayers.delete(layer);
        
        // remove the layer from the controls
        this.layerControl.removeLayer(layer);
        
        // hide the layer controls
        if (this.tileLayers.size <= 1 && !this.layers.size) {
            this.layerControl.remove();
        }
    }

    createTileLayer(id, url, options) {
        let defaultOptions;
        
        if (id && id.startsWith('mapbox.')) {
            const style_id = /^mapbox\.(.*)/.exec(id)[1];
            if (!url) {
                url = 'https://api.mapbox.com/styles/v1/{username}/{style_id}/tiles/{tilesize}/{z}/{x}/{y}{scale}?access_token={mapboxAccessToken}';
            }
            defaultOptions = {
                id,
                style_id,
                username: 'mapbox',
                tilesize: 512,
                scale: '',
                attribution: `Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors,
                    <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>`,
                mapboxAccessToken: this.getMapboxAccessToken()
            };
        } else {
            if (!url) {
                url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            }
            defaultOptions = {
                id,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            };
        }

        return this.leaflet.tileLayer(url, Object.assign(defaultOptions, options));
    }
    
    getMapboxAccessToken() {
        return this.mapboxAccessToken || this.uiSettings && this.uiSettings.mapboxAccessToken || '';
    }
}

export default {
    controller: TileMapController,
    bindings: {
        center: '<?',
        zoom: '<?zoom',
        mapboxAccessToken: '@?',
        options: '&?',
        onMove: '&?',
        showLocation: '<?',
        automaticTileLayers: '<?'
    },
    transclude: true,
    designerInfo: {
        translation: 'ui.components.maTileMap',
        icon: 'map',
        category: 'basic',
        attributes: {
        },
        size: {
            width: '600px',
            height: '400px',
            zIndex: 1
        }
    }
};