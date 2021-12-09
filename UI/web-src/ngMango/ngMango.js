/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import './ngMangoServices';
import angular from 'angular';
import pointList from './directives/pointList';
import filteringPointList from './directives/filteringPointList';
import pointValue from './directives/pointValue';
import pointValues from './directives/pointValues';
import pointStatistics from './directives/pointStatistics';
import tankLevel from './directives/tankLevel';
import gaugeChart from './directives/gaugeChart';
import serialChart from './directives/serialChart';
import pieChart from './directives/pieChart';
import clock from './directives/clock';
import stateChart from './directives/stateChart';
import copyBlurred from './directives/copyBlurred';
import tr from './directives/tr';
import trAriaLabel from './directives/trAriaLabel';
import datePicker from './directives/datePicker';
import dateRangePicker from './directives/dateRangePicker';
import statisticsTable from './directives/statisticsTable';
import startsAndRuntimesTable from './directives/startsAndRuntimesTable';
import setPointValue from './directives/setPointValue';
import switchImg from './directives/switchImg';
import calc from './directives/calc';
import intervalPicker from './directives/intervalPicker';
import intervalTypePicker from './directives/intervalTypePicker';
import pointQuery from './directives/pointQuery';
import getPointValue from './directives/getPointValue';
import jsonStore from './directives/jsonStore';
import focusOn from './directives/focusOn';
import enter from './directives/enter';
import now from './directives/now';
import fn from './directives/fn';
import dataSourceList from './directives/dataSourceList';
import dataSourceScrollList from './directives/dataSourceScrollList';
import deviceNameList from './directives/deviceNameList';
import deviceNameScrollList from './directives/deviceNameScrollList';
import dataSourceQuery from './directives/dataSourceQuery';
import deviceNameQuery from './directives/deviceNameQuery';
import userNotesTable from './directives/userNotesTable';
import eventsTable from './directives/eventsTable';
import watchListGet from './directives/watchListGet';
import watchListSelect from './directives/watchListSelect';
import arrayInput from './directives/arrayInput';
import emptyInput from './directives/emptyInput';
import watchListList from './directives/watchListList';
import watchListChart from './directives/watchListChart';
import filteringDeviceNameList from './directives/filteringDeviceNameList';
import filteringDataSourceList from './directives/filteringDataSourceList';
import accordion from './directives/accordion';
import accordionSection from './directives/accordionSection';
import draggable from './directives/draggable';
import dropzone from './directives/dropzone';
import barDisplay from './directives/barDisplay';
import indicator from './directives/indicator';
import validationMessages from './directives/validationMessages';
import scaleTo from './directives/scaleTo';
import change from './directives/change';
import switchDirective from './directives/switch';
import svgDirective from './directives/svg';
import chooseFile from './directives/chooseFile';
import aceEditor from './directives/aceEditor';
import dateInput from './directives/dateInput';
import eventHandler from './directives/eventHandler';
import jsonModel from './directives/jsonModel';
import jwtInput from './directives/jwtInput';
import stateParams from './directives/stateParams';
import fixSortIcons from './directives/fixSortIcons';
import momentary from './directives/momentary';
import loadModules from './directives/loadModules';
import autofocusDirective from './directives/autofocus';
import formExclude from './directives/formExclude';
import getCtrl from './directives/getCtrl';
import dialog from './directives/dialog';
import dropDown from './directives/dropDown';
import flattenValues from './directives/flattenValues';
import lessThan from './directives/lessThan';
import greaterThan from './directives/greaterThan';
import formatValue from './directives/formatValue';
import formatArray from './directives/formatArray';
import parseValue from './directives/parseValue';
import parseArray from './directives/parseArray';
import inheritNgModel from './directives/inheritNgModel';
import resizeObserver from './directives/resizeObserver';
import formName from './directives/formName';
import intersectionObserver from './directives/intersectionObserver';
import intersectionListener from './directives/intersectionListener';
import applyTheme from './directives/applyTheme';
import optionDirective from './directives/option';
import configureInputContainerDirective from './directives/configureInputContainer';
import sortableDirective from './directives/sortable';
import parentFormDirective from './directives/parentForm';
import templateHookDirective from './directives/templateHook';
import queryBuilder from './components/queryBuilder/queryBuilder';
import queryGroup from './components/queryBuilder/queryGroup';
import queryPredicate from './components/queryBuilder/queryPredicate';
import watchListParameters from './components/watchListParameters/watchListParameters';
import userEditor from './components/userEditor/userEditor';
import userSelect from './components/userSelect/userSelect';
import userList from './components/userList/userList';
import systemSettingEditor from './components/systemSettingEditor/systemSettingEditor';
import configExport from './components/configExport/configExport';
import configImport from './components/configImport/configImport';
import configImportDialog from './components/configImportDialog/configImportDialog';
import button from './components/button/button';
import fileStoreBrowser from './components/fileStoreBrowser/fileStoreBrowser';
import maSlider from './components/maSlider/maSlider';
import jsonStoreTable from './components/jsonStoreTable/jsonStoreTable';
import jsonStoreEditor from './components/jsonStoreEditor/jsonStoreEditor';
import eventHandlerEditor from './components/eventHandlerEditor/eventHandlerEditor';
import eventHandlerEmailEditor from './components/eventHandlerEditor/eventHandlerEmailEditor';
import eventHandlerScriptEditor from './components/eventHandlerEditor/eventHandlerScriptEditor';
import eventHandlerList from './components/eventHandlerList/eventHandlerList';
import eventHandlerCheckList from './components/eventHandlerCheckList/eventHandlerCheckList';
import eventHandlerSelect from './components/eventHandlerSelect/eventHandlerSelect';
import eventAudio from './components/eventAudio/eventAudio';
import eventNotify from './components/eventNotify/eventNotify';
import dataPointTagSelect from './components/dataPointTagSelect/dataPointTagSelect';
import dataPointTagKeySelect from './components/dataPointTagKeySelect/dataPointTagKeySelect';
import getService from './components/getService/getService';
import pointEventDetector from './components/pointEventDetector/pointEventDetector';
import userAuthTokens from './components/userAuthTokens/userAuthTokens';
import bulkDataPointTasks from './components/bulkDataPointTasks/bulkDataPointTasks';
import pointBrowser from './components/pointBrowser/pointBrowser';
import dataPointTagGroup from './components/dataPointTagGroup/dataPointTagGroup';
import revisionSelect from './components/revisionSelect/revisionSelect';
import cronPattern from './components/cronPattern/cronPattern';
import dailySchedule from './components/dailySchedule/dailySchedule';
import weeklySchedule from './components/weeklySchedule/weeklySchedule';
import emailRecipients from './components/emailRecipients/emailRecipients';
import mailingListList from './components/mailingLists/mailingListList';
import mailingListSelect from './components/mailingLists/mailingListSelect';
import mailingListSetup from './components/mailingLists/mailingListSetup';
import eventTypeList from './components/eventTypeList/eventTypeList';
import dataSourceEditor from './components/dataSourceEditor/dataSourceEditor';
import dataSourceStatus from './components/dataSourceStatus/dataSourceStatus';
import dataPointEditor from './components/dataPointEditor/dataPointEditor';
import virtualSerialPortList from './components/virtualSerialPort/virtualSerialPortList';
import virtualSerialPortSelect from './components/virtualSerialPort/virtualSerialPortSelect';
import virtualSerialPortSetup from './components/virtualSerialPort/virtualSerialPortSetup';
import colorPicker from './components/colorPicker/colorPicker';
import dataPointTagsEditor from './components/dataPointTagsEditor/dataPointTagsEditor';
import scriptingEditor from './components/scriptingEditor/scriptingEditor';
import bulkDataPointEditor from './components/bulkDataPointEditor/bulkDataPointEditor';
import eventHandlerProcessEditor from './components/eventHandlerEditor/eventHandlerProcessEditor';
import eventHandlerSetPointEditor from './components/eventHandlerEditor/eventHandlerSetPointEditor';
import scriptContext from './components/scriptContext/scriptContext';
import unitList from './components/unitList/unitList';
import eventDetectorList from './components/eventDetectorList/eventDetectorList';
import eventDetectorEditor from './components/eventDetectorEditor/eventDetectorEditor';
import eventDetectorSelect from './components/eventDetectorSelect/eventDetectorSelect';
import eventDetectorLayout from './components/eventDetectorLayout/eventDetectorLayout';
import durationEditor from './components/durationEditor/durationEditor';
import treeView from './components/treeView/treeView';
import treeViewItem from './components/treeView/treeViewItem';
import treeViewTransclude from './components/treeView/treeViewTransclude';
import purgePointValues from './components/purgePointValues/purgePointValues';
import serialPortSelect from './components/serialPortSelect/serialPortSelect';
import heatMap from './components/heatMap/heatMap';
import eventTypeFilter from './components/eventTypeFilter/eventTypeFilter';
import publisherList from './components/publisherList/publisherList';
import publisherSelect from './components/publisherSelect/publisherSelect';
import publisherEditor from './components/publisherEditor/publisherEditor';
import publisherPointsTab from './components/publisherPointsTab/publisherPointsTab';
import publisherPointsTable from './components/publisherPointsTable/publisherPointsTable';
import publisherPointsCreator from './components/publisherPointsCreator/publisherPointsCreator';
import dataPointSelector from './components/dataPointSelector/dataPointSelector';
import dropDownButton from './components/dropDownButton/dropDownButton';
import tileMap from './components/tileMap/tileMap';
import tileMapMarker from './components/tileMap/tileMapMarker';
import tileMapCircle from './components/tileMap/tileMapCircle';
import tileMapRectangle from './components/tileMap/tileMapRectangle';
import tileMapPolygon from './components/tileMap/tileMapPolygon';
import tileMapPolyline from './components/tileMap/tileMapPolyline';
import tileMapTileLayer from './components/tileMap/tileMapTileLayer';
import tileMapLayer from './components/tileMap/tileMapLayer';
import changePassword from './components/changePassword/changePassword';
import forgotPassword from './components/forgotPassword/forgotPassword';
import login from './components/login/login';
import resetPassword from './components/resetPassword/resetPassword';
import verifyEmail from './components/verifyEmail/verifyEmail';
import verifyEmailToken from './components/verifyEmailToken/verifyEmailToken';
import registerUser from './components/registerUser/registerUser';
import userStatus from './components/userStatus/userStatus';
import userActionsMenu from './components/userActionsMenu/userActionsMenu';
import tagHierarchy from './components/tagHierarchy/tagHierarchy';
import userTable from './components/userTable/userTable';
import testEmail from './components/testEmail/testEmail';
import resetPasswordCreateLink from './components/resetPasswordCreateLink/resetPasswordCreateLink';
import logFileTable from './components/logFileTable/logFileTable';
import logFileView from './components/logFileView/logFileView';
import mailingListEmail from './components/mailingListEmail/mailingListEmail';
import themePreview from './components/themePreview/themePreview';
import permissionEditor from './components/permissionEditor/permissionEditor';
import permissionEditorContainer from './components/permissionEditorContainer/permissionEditorContainer';
import promiseIndicator from './components/promiseIndicator/promiseIndicator';
import roleSelector from './components/roleSelector/roleSelector';
import optionList from './components/optionList/optionList';
import roleEditor from './components/roleEditor/roleEditor';
import fileStoreEditor from './components/fileStoreEditor/fileStoreEditor';
import dataPointEventCountsTable from './components/dataPointEventCountsTable/dataPointEventCountsTable';
import pointValueImport from './components/pointValueImport/pointValueImport';
import systemSetup from './components/systemSetup/systemSetup';

import slideUp from './animations/slideUp';

import '../shims/exportAMD.js';
import './ngMango.css';

/**
 * @ngdoc overview
 * @name ngMango
 *
 *
 * @description
 * The ngMango module handles loading of the custom directives used for creating a Mango 3.x dashboard.
 *
 *
 * */
const ngMango = angular.module('ngMango', ['ngMangoServices']);

ngMango.directive('maFilteringPointList', filteringPointList);
ngMango.directive('maPointList', pointList);
ngMango.directive('maPointValue', pointValue);
ngMango.directive('maPointValues', pointValues);
ngMango.directive('maPointStatistics', pointStatistics);
ngMango.directive('maTankLevel', tankLevel);
ngMango.directive('maGaugeChart', gaugeChart);
ngMango.directive('maSerialChart', serialChart);
ngMango.directive('maPieChart', pieChart);
ngMango.directive('maClock', clock);
ngMango.directive('maStateChart', stateChart);
ngMango.directive('maCopyBlurred', copyBlurred);
ngMango.directive('maTr', tr);
ngMango.directive('maTrAriaLabel', trAriaLabel);
ngMango.directive('maDatePicker', datePicker);
ngMango.directive('maDateRangePicker', dateRangePicker);
ngMango.directive('maStatisticsTable', statisticsTable);
ngMango.directive('maStartsAndRuntimesTable', startsAndRuntimesTable);
ngMango.directive('maSetPointValue', setPointValue);
ngMango.directive('maSwitchImg', switchImg);
ngMango.directive('maCalc', calc);
ngMango.directive('maIntervalPicker', intervalPicker);
ngMango.directive('maIntervalTypePicker', intervalTypePicker);
ngMango.directive('maPointQuery', pointQuery);
ngMango.directive('maGetPointValue', getPointValue);
ngMango.directive('maJsonStore', jsonStore);
ngMango.directive('maFocusOn', focusOn);
ngMango.directive('maEnter', enter);
ngMango.directive('maNow', now);
ngMango.directive('maFn', fn);
ngMango.directive('maDataSourceList', dataSourceList);
ngMango.directive('maDataSourceScrollList', dataSourceScrollList);
ngMango.directive('maDeviceNameList', deviceNameList);
ngMango.directive('maDeviceNameScrollList', deviceNameScrollList);
ngMango.directive('maDataSourceQuery', dataSourceQuery);
ngMango.directive('maDeviceNameQuery', deviceNameQuery);
ngMango.directive('maUserNotesTable', userNotesTable);
ngMango.directive('maEventsTable', eventsTable);
ngMango.directive('maArrayInput', arrayInput);
ngMango.directive('maEmptyInput', emptyInput);
ngMango.directive('maWatchListGet', watchListGet);
ngMango.directive('maWatchListSelect', watchListSelect);
ngMango.directive('maWatchListList', watchListList);
ngMango.directive('maWatchListChart', watchListChart);
ngMango.directive('maFilteringDeviceNameList', filteringDeviceNameList);
ngMango.directive('maFilteringDataSourceList', filteringDataSourceList);
ngMango.directive('maAccordion', accordion);
ngMango.directive('maAccordionSection', accordionSection);
ngMango.directive('maDraggable', draggable);
ngMango.directive('maDropzone', dropzone);
ngMango.directive('maBarDisplay', barDisplay);
ngMango.directive('maIndicator', indicator);
ngMango.directive('maValidationMessages', validationMessages);
ngMango.directive('maScaleTo', scaleTo);
ngMango.directive('maChange', change);
ngMango.directive('maSwitch', switchDirective);
ngMango.directive('maSvg', svgDirective);
ngMango.directive('maChooseFile', chooseFile);
ngMango.directive('maAceEditor', aceEditor);
ngMango.directive('maDateInput', dateInput);
ngMango.directive('maJsonModel', jsonModel);
ngMango.directive('maJwtInput', jwtInput);
ngMango.directive('maStateParams', stateParams);
ngMango.directive('maFixSortIcons', fixSortIcons);
ngMango.directive('maMomentary', momentary);
ngMango.directive('maLoadModules', loadModules);
ngMango.directive('maAutofocus', autofocusDirective);
ngMango.directive('maFormExclude', formExclude);
ngMango.directive('maGetCtrl', getCtrl);
ngMango.directive('maDialog', dialog);
ngMango.directive('maDropDown', dropDown);
ngMango.directive('maFlattenValues', flattenValues);
ngMango.directive('maLessThan', lessThan);
ngMango.directive('maGreaterThan', greaterThan);
ngMango.directive('maFormatValue', formatValue);
ngMango.directive('maFormatArray', formatArray);
ngMango.directive('maParseValue', parseValue);
ngMango.directive('maParseArray', parseArray);
ngMango.directive('maTreeViewTransclude', treeViewTransclude);
ngMango.directive('maInheritNgModel', inheritNgModel);
ngMango.directive('maResizeObserver', resizeObserver);
ngMango.directive('maTileMapMarker', tileMapMarker);
ngMango.directive('maTileMapCircle', tileMapCircle);
ngMango.directive('maTileMapRectangle', tileMapRectangle);
ngMango.directive('maTileMapPolygon', tileMapPolygon);
ngMango.directive('maTileMapPolyline', tileMapPolyline);
ngMango.directive('maTileMapTileLayer', tileMapTileLayer);
ngMango.directive('maTileMapLayer', tileMapLayer);
ngMango.directive('maFormName', formName);
ngMango.directive('maIntersectionObserver', intersectionObserver);
ngMango.directive('maIntersectionListener', intersectionListener);
ngMango.directive('maApplyTheme', applyTheme);
ngMango.directive('maOption', optionDirective);
ngMango.directive('maConfigureInputContainer', configureInputContainerDirective);
ngMango.directive('maSortable', sortableDirective);
ngMango.directive('maParentForm', parentFormDirective);
ngMango.directive('maTemplateHook', templateHookDirective);
ngMango.component('maQueryBuilder', queryBuilder);
ngMango.component('maQueryGroup', queryGroup);
ngMango.component('maQueryPredicate', queryPredicate);
ngMango.component('maWatchListParameters', watchListParameters);
ngMango.component('maUserEditor', userEditor);
ngMango.component('maUserSelect', userSelect);
ngMango.component('maUserList', userList);
ngMango.component('maSystemSettingEditor', systemSettingEditor);
ngMango.component('maConfigExport', configExport);
ngMango.component('maConfigImport', configImport);
ngMango.component('maConfigImportDialog', configImportDialog);
ngMango.component('maButton', button);
ngMango.component('maFileStoreBrowser', fileStoreBrowser);
ngMango.component('maSlider', maSlider);
ngMango.component('maJsonStoreTable', jsonStoreTable);
ngMango.component('maEventHandlerEditor', eventHandlerEditor);
ngMango.component('maEventHandlerEmailEditor', eventHandlerEmailEditor);
ngMango.component('maEventHandlerScriptEditor', eventHandlerScriptEditor);
ngMango.component('maEventHandlerList', eventHandlerList);
ngMango.component('maEventHandlerCheckList', eventHandlerCheckList);
ngMango.component('maEventHandlerSelect', eventHandlerSelect);
ngMango.component('maJsonStoreEditor', jsonStoreEditor);
ngMango.component('maEventAudio', eventAudio);
ngMango.component('maEventNotify', eventNotify);
ngMango.component('maDataPointTagSelect', dataPointTagSelect);
ngMango.component('maDataPointTagKeySelect', dataPointTagKeySelect);
ngMango.component('maGetService', getService);
ngMango.component('maPointEventDetector', pointEventDetector);
ngMango.component('maUserAuthTokens', userAuthTokens);
ngMango.component('maBulkDataPointTasks', bulkDataPointTasks);
ngMango.component('maPointBrowser', pointBrowser);
ngMango.component('maDataPointTagGroup', dataPointTagGroup);
ngMango.component('maRevisionSelect', revisionSelect);
ngMango.component('maCronPattern', cronPattern);
ngMango.component('maDailySchedule', dailySchedule);
ngMango.component('maWeeklySchedule', weeklySchedule);
ngMango.component('maEmailRecipients', emailRecipients);
ngMango.component('maMailingListList', mailingListList);
ngMango.component('maMailingListSelect', mailingListSelect);
ngMango.component('maMailingListSetup', mailingListSetup);
ngMango.component('maEventTypeList', eventTypeList);
ngMango.component('maDataSourceEditor', dataSourceEditor);
ngMango.component('maDataSourceStatus', dataSourceStatus);
ngMango.component('maDataPointEditor', dataPointEditor);
ngMango.component('maVirtualSerialPortList', virtualSerialPortList);
ngMango.component('maVirtualSerialPortSelect', virtualSerialPortSelect);
ngMango.component('maVirtualSerialPortSetup', virtualSerialPortSetup);
ngMango.component('maColorPicker', colorPicker);
ngMango.component('maDataPointTagsEditor', dataPointTagsEditor);
ngMango.component('maScriptingEditor', scriptingEditor);
ngMango.component('maBulkDataPointEditor', bulkDataPointEditor);
ngMango.component('maEventHandlerProcessEditor', eventHandlerProcessEditor);
ngMango.component('maEventHandlerSetPointEditor', eventHandlerSetPointEditor);
ngMango.component('maScriptContext', scriptContext);
ngMango.component('maUnitList', unitList);
ngMango.component('maEventDetectorList', eventDetectorList);
ngMango.component('maEventDetectorEditor', eventDetectorEditor);
ngMango.component('maEventDetectorSelect', eventDetectorSelect);
ngMango.component('maEventDetectorLayout', eventDetectorLayout);
ngMango.component('maDurationEditor', durationEditor);
ngMango.component('maTreeView', treeView);
ngMango.component('maTreeViewItem', treeViewItem);
ngMango.component('maPurgePointValues', purgePointValues);
ngMango.component('maSerialPortSelect', serialPortSelect);
ngMango.component('maHeatMap', heatMap);
ngMango.component('maEventTypeFilter', eventTypeFilter);
ngMango.component('maPublisherList', publisherList);
ngMango.component('maPublisherSelect', publisherSelect);
ngMango.component('maPublisherEditor', publisherEditor);
ngMango.component('maPublisherPointsTable', publisherPointsTable);
ngMango.component('maPublisherPointsTab', publisherPointsTab);
ngMango.component('maPublisherPointsCreator', publisherPointsCreator);
ngMango.component('maDataPointSelector', dataPointSelector);
ngMango.component('maDropDownButton', dropDownButton);
ngMango.component('maTileMap', tileMap);
ngMango.component('maChangePassword', changePassword);
ngMango.component('maForgotPassword', forgotPassword);
ngMango.component('maLogin', login);
ngMango.component('maResetPassword', resetPassword);
ngMango.component('maVerifyEmail', verifyEmail);
ngMango.component('maVerifyEmailToken', verifyEmailToken);
ngMango.component('maRegisterUser', registerUser);
ngMango.component('maUserStatus', userStatus);
ngMango.component('maUserActionsMenu', userActionsMenu);
ngMango.component('maTagHierarchy', tagHierarchy);
ngMango.component('maUserTable', userTable);
ngMango.component('maTestEmail', testEmail);
ngMango.component('maResetPasswordCreateLink', resetPasswordCreateLink);
ngMango.component('maLogFileTable', logFileTable);
ngMango.component('maLogFileView', logFileView);
ngMango.component('maMailingListEmail', mailingListEmail);
ngMango.component('maThemePreview', themePreview);
ngMango.component('maPermissionEditor', permissionEditor);
ngMango.component('maPermissionEditorContainer', permissionEditorContainer);
ngMango.component('maPromiseIndicator', promiseIndicator);
ngMango.component('maRoleSelector', roleSelector);
ngMango.component('maOptionList', optionList);
ngMango.component('maRoleEditor', roleEditor);
ngMango.component('maFileStoreEditor', fileStoreEditor);
ngMango.component('maPointEventCountsTable', dataPointEventCountsTable);
ngMango.component('maPointValueImport', pointValueImport);
ngMango.component('maSystemSetup', systemSetup);

ngMango.animation('.ma-slide-up', slideUp);

// add some additional event handlers which aren't in Angular by default
'touchstart touchend touchmove touchcancel'.split(' ').forEach((eventName) => {
    const directiveName = `ma${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`;
    const fn = eventHandler.bind(null, eventName, directiveName);
    fn.$inject = eventHandler.$inject;
    ngMango.directive(directiveName, fn);
});

ngMango.constant('MA_DATE_RANGE_PRESETS', [
    { type: 'LAST_5_MINUTES', translation: 'ui.dateRangePreset.lastX', translationArgs: [['ui.time.minutes', 5]] },
    { type: 'LAST_15_MINUTES', translation: 'ui.dateRangePreset.lastX', translationArgs: [['ui.time.minutes', 15]] },
    { type: 'LAST_30_MINUTES', translation: 'ui.dateRangePreset.lastX', translationArgs: [['ui.time.minutes', 30]] },
    { type: 'LAST_1_HOURS', translation: 'ui.dateRangePreset.lastX', translationArgs: [['ui.time.hours', 1]] },
    { type: 'LAST_3_HOURS', translation: 'ui.dateRangePreset.lastX', translationArgs: [['ui.time.hours', 3]] },
    { type: 'LAST_6_HOURS', translation: 'ui.dateRangePreset.lastX', translationArgs: [['ui.time.hours', 6]] },
    { type: 'LAST_12_HOURS', translation: 'ui.dateRangePreset.lastX', translationArgs: [['ui.time.hours', 12]] },
    { type: 'LAST_1_DAYS', translation: 'ui.dateRangePreset.lastX', translationArgs: [['ui.time.days', 1]] },
    { type: 'LAST_1_WEEKS', translation: 'ui.dateRangePreset.lastX', translationArgs: [['ui.time.weeks', 1]] },
    { type: 'LAST_2_WEEKS', translation: 'ui.dateRangePreset.lastX', translationArgs: [['ui.time.weeks', 2]] },
    { type: 'LAST_1_MONTHS', translation: 'ui.dateRangePreset.lastX', translationArgs: [['ui.time.months', 1]] },
    { type: 'LAST_3_MONTHS', translation: 'ui.dateRangePreset.lastX', translationArgs: [['ui.time.months', 3]] },
    { type: 'LAST_6_MONTHS', translation: 'ui.dateRangePreset.lastX', translationArgs: [['ui.time.months', 6]] },
    { type: 'LAST_1_YEARS', translation: 'ui.dateRangePreset.lastX', translationArgs: [['ui.time.years', 1]] },
    { type: 'LAST_2_YEARS', translation: 'ui.dateRangePreset.lastX', translationArgs: [['ui.time.years', 2]] },
    { type: 'DAY_SO_FAR', translation: 'ui.dateRangePreset.todaySoFar' },
    { type: 'WEEK_SO_FAR', translation: 'ui.dateRangePreset.weekSoFar' },
    { type: 'MONTH_SO_FAR', translation: 'ui.dateRangePreset.monthSoFar' },
    { type: 'YEAR_SO_FAR', translation: 'ui.dateRangePreset.yearSoFar' },
    { type: 'PREVIOUS_DAY', translation: 'ui.dateRangePreset.previousDay' },
    { type: 'PREVIOUS_WEEK', translation: 'ui.dateRangePreset.previousWeek' },
    { type: 'PREVIOUS_MONTH', translation: 'ui.dateRangePreset.previousMonth' },
    { type: 'PREVIOUS_YEAR', translation: 'ui.dateRangePreset.previousYear' }
]);

ngMango.factory('MA_AMCHARTS_DATE_FORMATS', [
    'MA_DATE_FORMATS',
    function (mangoDateFormats) {
        return {
            categoryAxis: [
                { period: 'fff', format: mangoDateFormats.timeSeconds },
                { period: 'ss', format: mangoDateFormats.timeSeconds },
                { period: 'mm', format: mangoDateFormats.time },
                { period: 'hh', format: mangoDateFormats.time },
                { period: 'DD', format: mangoDateFormats.monthDay },
                { period: 'WW', format: mangoDateFormats.monthDay },
                { period: 'MM', format: mangoDateFormats.monthDay },
                { period: 'YYYY', format: mangoDateFormats.year }
            ],
            categoryBalloon: mangoDateFormats.shortDateTimeSeconds
        };
    }
]);

ngMango.config([
    '$animateProvider',
    function ($animateProvider) {
        $animateProvider.customFilter((node, event, options) => !node.classList.contains('ma-disable-animate'));
    }
]);

ngMango.run([
    '$rootScope',
    'maWatchdog',
    'MA_ROLLUP_TYPES',
    'MA_TIME_PERIOD_TYPES',
    'MA_CHART_TYPES',
    'MA_DATE_RANGE_PRESETS',
    'maUser',
    '$timeout',
    function ($rootScope, mangoWatchdog, MA_ROLLUP_TYPES, MA_TIME_PERIOD_TYPES, MA_CHART_TYPES, MA_DATE_RANGE_PRESETS, User, $timeout) {
        $rootScope.mangoWatchdog = mangoWatchdog;
        $rootScope.rollupTypes = MA_ROLLUP_TYPES;
        $rootScope.timePeriodTypes = MA_TIME_PERIOD_TYPES;
        $rootScope.chartTypes = MA_CHART_TYPES;
        $rootScope.dateRangePresets = MA_DATE_RANGE_PRESETS;
    }
]);

export default ngMango;
