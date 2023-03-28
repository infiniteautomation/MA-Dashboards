/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */



/**
* @ngdoc service
* @name ngMangoServices.maPointEventManager
*
* @description
* Provides an <a ui-sref="ui.helps.docs.ngMangoServices.EventManager">EventManager</a> factory pointing to the point-value websocket
* endpoint at `'/rest/latest/websocket/point-value'`
* - All methods available to <a ui-sref="ui.helps.docs.ngMangoServices.EventManager">EventManager</a> are available.
* - Used by <a ui-sref="ui.helps.docs.ngMango.maGetPointValue">`<ma-get-point-value>`</a> directive.
*
* # Usage
*
* <pre prettyprint-mode="javascript">
    pointEventManager.subscribe(newXid, SUBSCRIPTION_TYPES, websocketHandler);
* </pre>
*/
function PointEventManagerFactory(EventManager) {
    return new EventManager({
        url: '/rest/latest/websocket/point-value',
        replayLastPayload: true
    });
}

PointEventManagerFactory.$inject = ['maEventManager'];
export default PointEventManagerFactory;