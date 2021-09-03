/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import licensePageTemplate from './licensePage.html';
import eulaPdf from './EULA.pdf';
import './licensePage.css';

class LicensePageController {
    static get $$ngIsClass() {
        return true;
    }

    static get $inject() {
        return ['$state', 'maSystemSettings', '$q', 'maDialogHelper', '$http', 'maUser', 'MA_DEVELOPMENT_CONFIG'];
    }

    constructor($state, SystemSettings, $q, DialogHelper, $http, User, developmentConfig) {
        this.$state = $state;
        this.$q = $q;
        this.DialogHelper = DialogHelper;
        this.$http = $http;
        this.User = User;
        this.developmentConfig = developmentConfig;

        this.eulaPdf = eulaPdf;
        this.upgradeChecksEnabled = new SystemSettings('upgradeChecksEnabled', 'BOOLEAN', true);
        this.usageTrackingEnabled = new SystemSettings('usageTrackingEnabled', 'BOOLEAN', true);
    }

    agreeToLicense(event) {
        const p1 = this.upgradeChecksEnabled.setValue();
        const p2 = this.usageTrackingEnabled.setValue();
        const p3 = this.$http({
            method: 'POST',
            url: '/rest/latest/server/accept-license-agreement',
            params: {
                agree: true
            }
        });

        this.$q.all([p1, p2, p3]).then(() => {
            const user = this.User.current;
            if (!this.developmentConfig.enabled && user.created === user.lastPasswordChange) {
                this.$state.go('systemSetup');
            } else {
                this.$state.go('ui.settings.home', { helpOpen: true });
            }
        }, (error) => {
            this.DialogHelper.httpErrorToast(error);
        });
    }
}

export default {
    template: licensePageTemplate,
    controller: LicensePageController
};
