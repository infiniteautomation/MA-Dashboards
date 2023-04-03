/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';
import menuEditorFactory from './services/menuEditor';
import jsonStoreMainMenu from './components/mainMenu/jsonStoreMainMenu';
import mainMenu from './components/mainMenu/mainMenu';
import mainMenuLink from './components/mainMenu/mainMenuLink';
import mainMenuToggle from './components/mainMenu/mainMenuToggle';
import mainMenuSvgIcon from './components/mainMenu/mainMenuSvgIcon';
import menuEditor from './directives/menuEditor/menuEditor';
import pageEditor from './directives/pageEditor/pageEditor';
import pageEditorControls from './directives/pageEditor/pageEditorControls';
import dualPaneEditor from './directives/liveEditor/dualPaneEditor';
import autoLoginSettings from './components/autoLoginSettings/autoLoginSettings';
import activeEventIcons from './components/activeEventIcons/activeEventIcons';
import dateBar from './components/dateBar/dateBar';
import footer from './components/footer/footer';
import upgradesBanner from './components/upgradesBanner/upgradesBanner';

const maUiRootState = angular
    .module('maUiRootState', [])
    .factory('maUiMenuEditor', menuEditorFactory)
    .directive('maUiMenuEditor', menuEditor)
    .directive('maUiPageEditor', pageEditor)
    .directive('maUiPageEditorControls', pageEditorControls)
    .directive('maUiDualPaneEditor', dualPaneEditor)
    .component('maUiJsonStoreMainMenu', jsonStoreMainMenu)
    .component('maUiMainMenu', mainMenu)
    .component('maUiMainMenuLink', mainMenuLink)
    .component('maUiMainMenuToggle', mainMenuToggle)
    .component('maUiMainMenuSvgIcon', mainMenuSvgIcon)
    .component('maUiAutoLoginSettings', autoLoginSettings)
    .component('maUiActiveEventIcons', activeEventIcons)
    .component('maUiDateBar', dateBar)
    .component('maUiFooter', footer)
    .component('maUiUpgradesBanner', upgradesBanner);

export default maUiRootState;
