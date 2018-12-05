/**
 * @copyright 2018 {@link http://infiniteautomation.com|Infinite Automation Systems, Inc.} All rights reserved.
 * @author Jared Wiltshire
 */

import dataSourcePageTemplate from './dataSourcePage.html';
import './dataSourcePage.css';

class DataSourcePageController {
    static get $$ngIsClass() { return true; }
    static get $inject() { return ['maDataSource', '$state', '$mdMedia']; }
    
    constructor(maDataSource, $state, $mdMedia) {
        this.maDataSource = maDataSource;
        this.$state = $state;
        this.$mdMedia = $mdMedia;
    }
    
    $onInit() {
        if (this.$state.params.xid) {
            this.maDataSource.get({xid: this.$state.params.xid}).$promise.then(item => {
                this.dataSource = item;
            }, error => {
                this.newDataSource();
            });
        } else {
            this.newDataSource();
        }
    }
    
    $onChanges(changes) {
    }
    
    newDataSource() {
        this.dataSource = this.maDataSource.createNew();
        this.dataSourceChanged();
    }
    
    dataSourceSaved() {
        if (this.dataSource == null) {
            // user deleted the event handler
            this.dataSource = this.maDataSource.createNew();
        }
        
        // always update the state params, xids can change
        this.dataSourceChanged();
    }
    
    dataSourceChanged() {
        this.$state.params.xid = this.dataSource && this.dataSource.xid || null;
        this.$state.go('.', this.$state.params, {location: 'replace', notify: false});
    }
}

export default {
    template: dataSourcePageTemplate,
    controller: DataSourcePageController,
    bindings: {
    },
    require: {
    }
};