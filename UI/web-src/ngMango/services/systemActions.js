/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';


SystemActionsFactory.$inject = ['$http', '$q', '$timeout'];
function SystemActionsFactory($http, $q, $timeout) {
    const systemActionsUrl = '/rest/latest/actions';
    
    function SystemActionResource(data) {
        angular.extend(this, data);
    }
    
    SystemActionResource.prototype.refresh = function(onProgress) {
        return $http({
            method: 'GET',
            url: systemActionsUrl + '/status/' + encodeURIComponent(this.resourceId)
        }).then(function(response) {
           if ( typeof onProgress === 'function' ) onProgress(response.data)
            return angular.extend(this, response.data);
        }.bind(this),function(error){
            return angular.extend(this, {
                finished: true,
                results: {
                    failed: true,
                    messages: [],
                    exception: { message: error.mangoStatusText }
                }
            });
        }.bind(this));

    };
    
    SystemActionResource.prototype.refreshUntilFinished = function(timeout,onProgress) {
        if (this.finished) return $q.resolve(this);
        return $timeout(function() {
            return this.refresh(onProgress);
        }.bind(this), timeout || 1000).then(function() {
            return this.refreshUntilFinished(timeout,onProgress);
        }.bind(this));
    };
    
    function SystemActions() {
    }

    SystemActions.trigger = function(name, content) {
        return $http({
            method: 'PUT',
            url: systemActionsUrl + '/trigger/' + encodeURIComponent(name),
            data: content
        }).then(function(response) {
           return new SystemActionResource(response.data);
        });
    };

    return SystemActions;
}

export default SystemActionsFactory;


