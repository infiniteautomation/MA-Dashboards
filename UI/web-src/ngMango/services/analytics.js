/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import { require } from 'requirejs';

WebAnalyticsFactory.$inject = ['$rootScope', '$window', '$state'];
function WebAnalyticsFactory($rootScope, $window, $state) {
    function WebAnalytics() {}

    WebAnalytics.prototype.enableGoogleAnalytics = (propertyId) => {
        if (propertyId) this.propertyId = propertyId;
        if (!this.propertyId) throw new Error('No property ID is set');

        // minified snippet from Google modified to remove jshint warnings and replace window with $window
        const ga = $window.ga = $window.ga || function() {
            (ga.q=ga.q||[]).push(arguments);
        };
        ga.l=Date.now();
        ga('create', this.propertyId, 'auto');
        
        require(['https://www.google-analytics.com/analytics.js']);

        if (!this.deregister) {
            this.deregister = $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
                $window.ga('set', 'page', $state.href(toState.name, toParams));
                $window.ga('send', 'pageview');
            });
        }
    };

    WebAnalytics.prototype.disableGoogleAnalytics = () => {
        this.propertyId = null;
        if ($window.ga) {
            $window.ga('create', null, 'auto');
        }
        if (this.deregister) {
            this.deregister();
            delete this.deregister;
        }
    };

    WebAnalytics.prototype.getGoogleAnalytics = () => $window.ga;

    WebAnalytics.prototype.enableGoogleG4Measurement = (g4MeasurementId) => {
        require([`https://www.googletagmanager.com/gtag/js?id=${g4MeasurementId}`]);

        if (g4MeasurementId) {
            this.g4MeasurementId = g4MeasurementId;
        }
        if (!this.g4MeasurementId) {
            throw new Error('No property ID is set');
        }

        // Global Site Tag (gtag.js) snippet for Radix
        $window.dataLayer = $window.dataLayer || [];
        function gtag() {
            dataLayer.push(arguments);
        }
        gtag('js', new Date());
        gtag('config', this.g4MeasurementId);

        if (!this.deregister) {
            this.deregister = $rootScope.$on('$stateChangeSuccess', (event, toState, toParams, fromState, fromParams) => {
                gtag('config', this.g4MeasurementId, {
                    page_path: $state.href(toState.name, toParams)
                });
            });
        }
    };

    WebAnalytics.prototype.disableGoogleG4Measuremen = () => {
        // remove GTM tags and triggers for Google Analytics tracking
        if ($window.dataLayer) {
            $window.dataLayer = $window.dataLayer.filter((item) => item['gtm.start'] === undefined);
        }
    };

    WebAnalytics.prototype.getGoogleG4Measuremen = () => $window.dataLayer;

    return new WebAnalytics();
}

export default WebAnalyticsFactory;


