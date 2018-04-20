/**
 * @copyright 2018 {@link http://infiniteautomation.com|Infinite Automation Systems, Inc.} All rights reserved.
 * @author Jared Wiltshire
 */

import basicDialogTemplate from './basicDialog.html';
import configImportDialogContainerTemplate from '../components/configImportDialog/configImportDialogContainer.html';
import angular from 'angular';

DialogHelperFactory.$inject = ['$injector', 'maTranslate', 'maSystemActions', '$q', 'maUtil'];
function DialogHelperFactory($injector, maTranslate, maSystemActions, $q, maUtil) {
    
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
            var areYouSure = maTranslate.trSync('ui.app.areYouSure');
            var textContent = translation ? maTranslate.trSync(translation) : areYouSure;

            var confirm = $mdDialog.confirm()
                .title(areYouSure)
                .ariaLabel(areYouSure)
                .textContent(textContent)
                .targetEvent(event)
                .ok(maTranslate.trSync('login.ok'))
                .cancel(maTranslate.trSync('login.cancel'))
                .multiple(true);

            return $mdDialog.show(confirm);
        }

        prompt(event, shortTr, longTr, placeHolderTr, initialValue) {
            var shortText = maTranslate.trSync(shortTr);
            var longText = longTr && maTranslate.trSync(longTr);
            var placeHolderText = placeHolderTr && maTranslate.trSync(placeHolderTr);

            var prompt = $mdDialog.prompt()
                .title(shortText)
                .ariaLabel(shortText)
                .targetEvent(event)
                .ok(maTranslate.trSync('login.ok'))
                .cancel(maTranslate.trSync('login.cancel'))
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

            return $mdDialog.show(prompt);
        }
        
        toast(translation, classes) {
            var text = maTranslate.trSync(translation, Array.prototype.slice.call(arguments, 2));
            
            var toast = $mdToast.simple()
                .textContent(text)
                .action(maTranslate.trSync('login.ok'))
                .highlightAction(true)
                .position('bottom center')
                .hideDelay(5000);
            
            if (classes) {
                toast.toastClass(classes);
            }
            
            return $mdToast.show(toast);
        }
        
        errorToast(translation) {
            const text = maTranslate.trSync(translation);
            
            const toast = $mdToast.simple()
                .textContent(text)
                .action(maTranslate.trSync('login.ok'))
                .highlightAction(true)
                .position('bottom center')
                .hideDelay(10000)
                .toastClass('md-warn');

            return $mdToast.show(toast);
        }
        
        toastOptions(options) {
            var text = options.textTr ? maTranslate.trSync(options.textTr) : options.text;
            
            var toast = $mdToast.simple()
                .textContent(text)
                .action(maTranslate.trSync('login.ok'))
                .highlightAction(true)
                .position('bottom center')
                .hideDelay(isFinite(options.hideDelay) ? options.hideDelay : 5000);
            
            if (options.classes) {
                toast.toastClass(options.classes);
            }
            
            return $mdToast.show(toast);
        }

        showConfigImportDialog(importData, $event) {
            var locals = {importData: importData};
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
            var maDialogHelper = this;
            var description = maTranslate.trSync(options.descriptionTr);
            
            return maDialogHelper.confirm(options.event, options.confirmTr).then(function() {
                return maSystemActions.trigger(options.actionName, options.actionData).then(function(triggerResult) {
                    maDialogHelper.toastOptions({textTr: ['ui.app.systemAction.started', description], hideDelay: 0});
                    return triggerResult.refreshUntilFinished();
                }, function(error) {
                    maDialogHelper.toastOptions({textTr: ['ui.app.systemAction.startFailed', description, error.mangoStatusText],
                        hideDelay: 10000, classes: 'md-warn'});
                    return $q.reject();
                });
            }).then(function(finishedResult) {
                var results = finishedResult.results;
                if (results.failed) {
                    var msg = results.exception ? results.exception.message : '';
                    maDialogHelper.toastOptions({textTr: ['ui.app.systemAction.failed', description, msg], hideDelay: 10000, classes: 'md-warn'});
                } else {
                    var resultTxt = maTranslate.trSync(options.resultsTr, results);
                    maDialogHelper.toastOptions({textTr: ['ui.app.systemAction.succeeded', description, resultTxt]});
                }
            }, angular.noop);
        }
    }

    return new DialogHelper();
}

export default DialogHelperFactory;

