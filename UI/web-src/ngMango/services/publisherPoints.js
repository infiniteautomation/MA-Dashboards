/**
 * @copyright 2020 {@link http://RadixIot.com|Radix IoT} All rights reserved.
 * @author Pier Puccini
 */

publisherPointsFactory.$inject = ['maRestResource', 'maTemporaryRestResource'];
function publisherPointsFactory(RestResource, TemporaryRestResource) {
    class PublisherPoints extends RestResource {
        static get defaultProperties() {
            return {
                name: null,
                enabled: true,
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
    class BulkPublishedPointTemporaryResource extends TemporaryRestResource {
        static get baseUrl() {
            return '/rest/latest/published-points/bulk';
        }

        static get resourceType() {
            return 'BULK_PUBLISHED_POINT';
        }
    }

    PublisherPoints.Bulk = BulkPublishedPointTemporaryResource;

    return PublisherPoints;
}

export default publisherPointsFactory;
