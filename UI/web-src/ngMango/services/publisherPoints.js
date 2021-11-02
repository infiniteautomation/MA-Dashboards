/**
 * @copyright 2020 {@link http://RadixIot.com|Radix IoT} All rights reserved.
 * @author Pier Puccini
 */

publisherPointsFactory.$inject = ['maRestResource'];
function publisherPointsFactory(RestResource) {
    class PublisherPoints extends RestResource {
        static get defaultProperties() {
            return {
                name: null,
                enabled: null,
                dataPointXid: '',
                publisherXid: '',
                modelType: ''
            };
        }

        static get baseUrl() {
            return '/rest/latest/published-points';
        }

        static get webSocketUrl() {
            return '/rest/latest/websocket/published-points';
        }

        static get xidPrefix() {
            return 'PP_';
        }
    }

    return PublisherPoints;
}

export default publisherPointsFactory;
