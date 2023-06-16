/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import angular from 'angular';
import basicDialogTemplate from './basicDialog.html';
import configImportDialogContainerTemplate from '../components/configImportDialog/configImportDialogContainer.html';

DialogHelperFactory.$inject = ['$injector', 'maTranslate', 'maSystemActions', '$q', 'maUtil'];
function DialogHelperFactory($injector, maTranslate, maSystemActions, $q, maUtil) {
    
    const noop = function() {};
    
    class CancelledError extends Error {}

    let $mdDialog, $mdMedia, $mdToast;
    if ($injector.has('$mdDialog')) {
        $mdDialog = $injector.get('$mdDialog');
        $mdMedia = $injector.get('$mdMedia');
        $mdToast = $injector.get('$mdToast');
    }
    
    class DialogHelper {

        showDialog(template, locals, $event) {
            return $mdDialog.show({
                controller: function() {},
                template: template,
                targetEvent: $event,
                clickOutsideToClose: false,
                escapeToClose: false,
                fullscreen: $mdMedia('xs') || $mdMedia('sm'),
                controllerAs: '$ctrl',
                bindToController: true,
                locals: locals
            });
        }
        
        showBasicDialog($event, locals) {
            return $mdDialog.show({
                controller: function() {
                    this.result = {};
                    this.$mdDialog = $mdDialog;
                    
                    this.cancel = function() {
                        this.$mdDialog.cancel();
                    };
                    
                    this.ok = function() {
                        this.$mdDialog.hide(this.result);
                    };
                },
                template: basicDialogTemplate,
                targetEvent: $event,
                clickOutsideToClose: true,
                escapeToClose: true,
                fullscreen: $mdMedia('xs') || (!locals.smallDialog && $mdMedia('sm')),
                controllerAs: '$ctrl',
                bindToController: true,
                locals: locals
            });
        }

        confirm(event, translation) {
            const isTranslationKey = typeof translation === 'string' || Array.isArray(translation);
            const keys = {
                textContent: isTranslationKey ? translation : 'ui.app.areYouSure',
                areYouSure: 'ui.app.areYouSure',
                okText: 'login.ok',
                cancelText: 'login.cancel'
            };
            if (!isTranslationKey) {
                Object.assign(keys, translation);
            }

            return maTranslate.trAll(keys).then(({textContent, areYouSure, okText, cancelText}) => {
                const confirm = $mdDialog.confirm()
                    .title(areYouSure)
                    .ariaLabel(areYouSure)
                    .textContent(textContent)
                    .targetEvent(event)
                    .ok(okText)
                    .cancel(cancelText)
                    .multiple(true);

                return $mdDialog.show(confirm);
            });
        }

        prompt(optionsOrEvent, shortTr, longTr, placeHolderTr, initialValue) {
            let event = optionsOrEvent;
            let rejectWithCancelled = false;
            if (!(optionsOrEvent instanceof Event)) {
                const options = optionsOrEvent || {};
                event = options.event;
                shortTr = options.shortTr;
                longTr = options.longTr;
                placeHolderTr = options.placeHolderTr;
                initialValue = options.initialValue;
                rejectWithCancelled = options.rejectWithCancelled;
            }

            return maTranslate.trAll({
                shortText: shortTr,
                longText: longTr,
                placeHolderText: placeHolderTr,
                okText: 'login.ok',
                cancelText: 'login.cancel'
            }).then(({shortText, longText, placeHolderText, okText, cancelText}) => {
                const prompt = $mdDialog.prompt()
                    .title(shortText)
                    .ariaLabel(shortText)
                    .targetEvent(event)
                    .ok(okText)
                    .cancel(cancelText)
                    .multiple(true);
                
                if (longText) {
                    prompt.textContent(longText);
                }
                
                if (placeHolderText) {
                    prompt.placeholder(placeHolderText);
                }
                
                if (initialValue != null) {
                    prompt.initialValue(initialValue);
                }

                return $mdDialog.show(prompt).catch(e => {
                    return $q.reject(rejectWithCancelled ? new CancelledError('Prompt cancelled') : e);
                });
            });
        }
        
        isCancelled(error) {
            return error instanceof CancelledError;
        }
        
        toast(translation, classes) {
            const translationArgs = Array.prototype.slice.call(arguments, 2);
            const translatableMessage = Array.isArray(translation) ? translation : [translation, ...translationArgs];

            return maTranslate.trAll({
                text: translatableMessage,
                okText: 'login.ok'
            }).then(({text, okText}) => {
                const toast = $mdToast.simple()
                    .textContent(text)
                    .action(okText)
                    .actionKey('o')
                    .highlightAction(true)
                    .position('bottom center')
                    .hideDelay(5000);
                
                if (classes) {
                    toast.toastClass(classes);
                }
                
                return $mdToast.show(toast).catch(noop);
            });
        }
        
        errorToast(translation) {
            return maTranslate.trAll({
                text: translation,
                okText: 'login.ok'
            }).then(({text, okText}) => {
                const toast = $mdToast.simple()
                    .textContent(text)
                    .action(okText)
                    .actionKey('o')
                    .highlightAction(true)
                    .position('bottom center')
                    .hideDelay(10000)
                    .toastClass('md-warn');

                return $mdToast.show(toast).catch(noop);
            });
        }
        
        toastOptions(options) {
            return maTranslate.trAll({
                text: options.textTr,
                okText: 'login.ok'
            }).then(({text, okText}) => {
                const toast = $mdToast.simple()
                    .textContent(text || options.text)
                    .action(okText)
                    .actionKey('o')
                    .highlightAction(true)
                    .position('bottom center')
                    .hideDelay(isFinite(options.hideDelay) ? options.hideDelay : 5000);
                
                if (options.classes) {
                    toast.toastClass(options.classes);
                }
                
                return $mdToast.show(toast).catch(noop);
            });
        }
        
        httpErrorToast(error, allowedCodes = []) {
            if (allowedCodes.includes(error.status)) {
                return $q.resolve();
            }

            return maTranslate.trAll({
                text: ['ui.app.genericRestError', error.mangoStatusText],
                okText: 'login.ok'
            }).then(({text, okText}) => {
                const toast = $mdToast.simple()
                    .textContent(text)
                    .action(okText)
                    .actionKey('o')
                    .highlightAction(true)
                    .position('bottom center')
                    .toastClass('md-warn')
                    .hideDelay(10000);

                return $mdToast.show(toast).catch(noop);
            });
        }

        showConfigImportDialog(importData, $event) {
            const locals = {importData: importData};
            return this.showDialog(configImportDialogContainerTemplate, locals, $event);
        }
        
//        options = {
//          event,
//          confirmTr,
//          actionName,
//          actionData,
//          descriptionTr,
//          resultsTr
//        }
        confirmSystemAction(options) {
           const description = [options.descriptionTr];
            const onProgess = (statusResponse)=>{
                const results = statusResponse.results || {}
                let progress;
                if (results.progressInfo !== undefined) progress = (results.progressInfo.position / results.progressInfo.maximum * 100);
                else if (results.percentComplete !== undefined) progress = results.percentComplete;
                const progressText = progress !== undefined ? '%' + progress.toFixed(2) : '';
                this.toastOptions({textTr: ['ui.app.systemAction.progress', description, progressText], hideDelay: 0});
            }
            return this.confirm(options.event, options.confirmTr).then(() => {
                return maSystemActions.trigger(options.actionName, options.actionData).then(triggerResult => {
                    this.toastOptions({textTr: ['ui.app.systemAction.started', description], hideDelay: 0});
                    return triggerResult.refreshUntilFinished(2000,onProgess);
                }, error => {
                    this.toastOptions({textTr: ['ui.app.systemAction.startFailed', description, error.mangoStatusText],
                        hideDelay: 10000, classes: 'md-warn'});
                    return $q.reject();
                });
            }).then(finishedResult => {
                const results = finishedResult.results;
                if (results.failed) {
                    let msg = results.exception ? results.exception.message : '';
                    if (results.messages.length > 0) {
                        results.messages.forEach(message => {
                            this.toastOptions({textTr: ['ui.app.systemAction.failed', description, message.genericMessage], hideDelay: 10000, classes: 'md-warn'});
                        })
                    } else {
                        this.toastOptions({textTr: ['ui.app.systemAction.failed', description, msg], hideDelay: 10000, classes: 'md-warn'});
                    }
                } else {
                    this.toastOptions({textTr: ['ui.app.systemAction.succeeded', description, [options.resultsTr, results]]});
                }
            }, noop);
        }
    }

    return new DialogHelper();
}

export default DialogHelperFactory;


