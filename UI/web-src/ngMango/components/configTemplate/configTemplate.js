/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import configTemplate from './configTemplate.html';

class ConfigTemplateController {
    static get $$ngIsClass() { return true; }
    static get $inject() { return ['$scope', '$mdColors', 'maConfigTemplateService', 'maTranslate']; }


    constructor($scope, $mdColors, ConfigTemplate, maTranslate) {
        this.$scope = $scope;
        this.accentColor= $mdColors.getThemeColor('accent');
        this.ConfigTemplate = ConfigTemplate;
        this.maTranslate = maTranslate;
    }

    $onInit() {
    }

    updateSelectStatus(event) {
        console.log('testing scope', this.selectImportJson);
    }

    uploadFiles() {
        this.ConfigTemplate.testingService(this.filename, this.templateName, this.selectImportJson);
    }

    fileUploaded(url, fileType) {
        let path = [];
        path = url.split('/');
        switch(fileType) {
            case 'csvFile' :
                this.filename = path[path.length-1];
                this.filePath = url;
                break;
            case 'templateFile' :
                this.templateName = path[path.length-1];
                this.templatePath = url;
                break;
        }

    }
}

export default {
    template: configTemplate,
    controller: ConfigTemplateController,
    require: {
    },
    bindings: {
        jsonString: '<?'
    }
};
