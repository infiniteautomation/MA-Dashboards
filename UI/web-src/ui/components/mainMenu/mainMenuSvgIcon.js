/*
 * Copyright (C) 2023 Radix IoT LLC. All rights reserved.
 */

import mainMenuSvgIconTemplate from './mainMenuSvgIcon.html';
import automationSvg from './svgs/svg_automation.svg';
import administrationSvg from './svgs/svg_administration.svg';
import configurationSvg from './svgs/svg_configuration.svg';
import dataCenterSvg from './svgs/svg_data_center.svg';
import dataCollectionSvg from './svgs/svg_data_collection.svg';
import dataPointDetailsSvg from './svgs/svg_data_point_details.svg';
import dataDistributionSvg from './svgs/svg_data_distribution.svg';
import eventsSvg from './svgs/svg_events.svg';
import helpSvg from './svgs/svg_help.svg';
import presentationSvg from './svgs/svg_presentation.svg';
import systemSvg from './svgs/svg_system.svg';
import uiSettingsSvg from './svgs/svg_UI_settings.svg';
import watchlistSvg from './svgs/svg_Watchlist.svg';

const MAIN_MENU_SVG_ICONS = {
    svg_administration: administrationSvg,
    svg_automation: automationSvg,
    svg_configuration: configurationSvg,
    svg_data_center: dataCenterSvg,
    svg_data_collection: dataCollectionSvg,
    svg_data_point_details: dataPointDetailsSvg,
    svg_data_distribution: dataDistributionSvg,
    svg_events: eventsSvg,
    svg_help: helpSvg,
    svg_presentation: presentationSvg,
    svg_UI_settings: uiSettingsSvg,
    svg_Watchlist: watchlistSvg,
    svg_system: systemSvg
};
class mainMenuSvgIconController {
    static get $$ngIsClass() {
        return true;
    }
    static get $inject() {
        return [];
    }

    getCustomIcon(iconName) {
        return MAIN_MENU_SVG_ICONS[iconName];
    }
}

export default {
    controller: mainMenuSvgIconController,
    template: mainMenuSvgIconTemplate,
    bindings: {
        item: '<'
    }
};
