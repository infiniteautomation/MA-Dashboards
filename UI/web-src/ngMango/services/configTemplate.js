/*
 *  Copyright (C) 2023 RadixIot LLC. All rights reserved.
 */
import angular from 'angular';

function configTemplateFactory() {

    function ConfigTemplate() {
    }

    ConfigTemplate.testingService = function(templateName, csvName, shouldImport) {
        console.log('Send these values to service to call controller::');
        console.log(templateName, csvName, shouldImport);
    }

    return ConfigTemplate;
}

export default configTemplateFactory;
