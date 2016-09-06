/**
 * @copyright 2016 {@link http://infiniteautomation.com|Infinite Automation Systems, Inc.} All rights reserved.
 * @author Will Geller
 */

define(['require'], function(require) {
    'use strict';

    var watchListTableRow = function($mdMedia, $mdDialog, $timeout, UserNotes) {
        return {
            templateUrl: 'directives/watchList/watchListTableRow.html',
            link: function link(scope, element, attrs) {

                    scope.$mdMedia = $mdMedia;
                    scope.Updated = false;
                    scope.addNote = UserNotes.addNote;

                    scope.showSetPoint = function(ev) {
                        $mdDialog.show({
                                controller: function() {
                                    this.parent = scope;
                                    this.cancel = function cancel() {
                                        $mdDialog.cancel();
                                    };
                                },
                                templateUrl: require.toUrl('./setPointDialog.html'),
                                parent: angular.element(document.body),
                                targetEvent: ev,
                                fullscreen: false,
                                clickOutsideToClose: true,
                                controllerAs: 'ctrl'
                            })
                            .then(function(answer) {
                                //$scope.status = 'You said the information was "' + answer + '".';
                            }, function() {
                                //$scope.status = 'You cancelled the dialog.';
                            });
                    }

                    // Only load showStats function and watch values to flash if !mobile (perf +)
                    if ($mdMedia('gt-sm')) {
                        scope.showStats = function(ev) {
                            $mdDialog.show({
                                    controller: function() {
                                        this.parent = scope;
                                        this.timeRange = moment.duration(moment(scope.to).diff(moment(scope.from))).humanize();
                                        this.cancel = function cancel() {
                                            $mdDialog.cancel();
                                        };
                                    },
                                    templateUrl: require.toUrl('./statsDialog.html'),
                                    parent: angular.element(document.body),
                                    targetEvent: ev,
                                    fullscreen: true,
                                    controllerAs: 'ctrl'
                                })
                                .then(function(answer) {
                                    //$scope.status = 'You said the information was "' + answer + '".';
                                }, function() {
                                    //$scope.status = 'You cancelled the dialog.';
                                });
                        }
                        
                        scope.$watch('point.value', function(newValue, old) {
                            if (newValue === undefined || newValue === old) return;
                            // console.log('New Point Values:', scope.point.name, scope.point.value);

                            scope.Updated = true;
                            $timeout(function() {
                                scope.Updated = false;
                            }, 300);
                        });
                    } // End if gt-sm

                } // End Link
        }; // End return
    }; // End DDO

    watchListTableRow.$inject = ['$mdMedia', '$mdDialog', '$timeout', 'UserNotes'];

    return watchListTableRow;

}); // define