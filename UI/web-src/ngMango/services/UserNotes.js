/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

/**
* @ngdoc service
* @name ngMangoServices.maUserNotes
*
* @description
* Provides a service for retrieving and adding user notes
* - Used by <a ui-sref="ui.helps.docs.ngMango.maUserNotesTable">`<ma-user-notes-table>`</a> 
*
*
*
*/


/**
* @ngdoc method
* @methodOf ngMangoServices.maUserNotes
* @name UserNotes#get
*
* @description
* A default action provided by $resource. Makes a http GET call to the rest endpoint `/rest/latest/comments`
* @returns {array} Returns an Array of User Note objects matching the query. Objects will be of the resource class and have resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maUserNotes
* @name UserNotes#save
*
* @description
* A default action provided by $resource. Makes a http POST call to the rest endpoint `/rest/latest/comments`
* @returns {array} Returns an Array of User Note objects matching the query. Objects will be of the resource class and have resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maUserNotes
* @name UserNotes#remove
*
* @description
* A default action provided by $resource. Makes a http DELETE call to the rest endpoint `/rest/latest/comments`
* @returns {array} Returns an Array of User Note objects matching the query. Objects will be of the resource class and have resource actions available to them.
*
*/

/**
* @ngdoc method
* @methodOf ngMangoServices.maUserNotes
* @name UserNotes#delete
*
* @description
* A default action provided by $resource. Makes a http DELETE call to the rest endpoint `/rest/latest/comments`
* @param {object} query Object for the query, can have a `contains` property for querying User Notes that contain the given string.
* @returns {array} Returns an Array of User Note objects matching the query. Objects will be of the resource class and have resource actions available to them.
*
*/


/**
* @ngdoc method
* @methodOf ngMangoServices.maUserNotes
* @name UserNotes#query
*
* @description
* A default action provided by $resource. Makes a http GET call to the rest endpoint `/rest/latest/comments`
* @param {object} query Object for the query, can have a `contains` property for querying User Notes that contain the given string.
* @returns {array} Returns an Array of User Note objects matching the query. Objects will be of the resource class and have resource actions available to them.
*
*/



function UserNotesFactory($resource, Util, $mdDialog) {
    const UserNotes = $resource('/rest/latest/comments', {}, {
        query: {
            method: 'GET',
            isArray: true,
            transformResponse: Util.transformArrayResponse,
            interceptor: {
                response: Util.arrayResponseInterceptor
            },
            cache: false
        }
    });

    UserNotes.addNote = function(ev, commentType, referenceId) {
        // Appending dialog to document.body to cover sidenav in docs app
        const confirm = $mdDialog.prompt()
            .title('Add Comment:')
            .ariaLabel('Add Note')
            .targetEvent(ev)
            .ok('OK')
            .cancel('Cancel');
        
        return $mdDialog.show(confirm).then((result) => {
            return this.save({referenceId: referenceId, comment: result, commentType: commentType}).$promise;
        });
    };

    return UserNotes;
}

UserNotesFactory.$inject = ['$resource', 'maUtil', '$mdDialog'];
export default UserNotesFactory;


