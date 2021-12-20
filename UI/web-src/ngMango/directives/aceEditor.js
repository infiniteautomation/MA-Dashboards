/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

AceEditor.$inject = ['maModuleLoader'];
function AceEditor(maModuleLoader) {

    class AceEditorController {
        static get $inject() { return ['$element', '$injector', '$templateRequest', '$sce', '$scope', '$timeout']; }
        static get $$ngIsClass() { return true; }
        
        constructor($element, $injector, $templateRequest, $sce, $scope, $timeout) {
            this.initialText = $element.data('htmlContent');
            $element.removeData('htmlContent');
            
            const $ctrl = this;
            if (MutationObserver) {
                const observer = new MutationObserver(() => {
                    if ($ctrl.editor) {
                        $ctrl.editor.resize();
                    }
                });
                observer.observe($element[0], {
                    attributes: true,
                    attributeFilter: ['style']
                });
                $scope.$on('$destroy', () => {
                    observer.disconnect();
                });
            }
            
            if ($injector.has('maUiSettings')) {
                this.uiSettings = $injector.get('maUiSettings');
            }
            
            this.$templateRequest = $templateRequest;
            this.$sce = $sce;
            this.$timeout = $timeout;
            this.$scope = $scope;
        }
    
        $onInit() {
            const $ctrl = this;
            
            this.ngModelCtrl.$render = function() {
                $ctrl.setEditorText(this.$viewValue || $ctrl.initialText || '');
            };
            
            this.aceConfig = Object.assign(this.defaultOptions(), this.options);
        }
    
        $onChanges(changes) {
            if (changes.src) {
                this.loadFromSrc();
            }
            if (changes.theme) {
                this.setTheme();
            }
            if (changes.mode) {
                this.setMode();
            }
            if (changes.showGutter) {
                this.setShowGutter();
            }
            if (changes.options && !changes.options.isFirstChange()) {
                this.aceConfig = Object.assign(this.defaultOptions(), this.options);
            }
        }
        
        defaultOptions() {
            return {
                useWrapMode : true,
                showGutter: !!this.showGutter,
                showPrintMargin: false,
                theme: this.theme || (this.uiSettings && this.uiSettings.codeTheme) || 'monokai',
                mode: this.mode || 'html',
                onLoad: this.aceLoaded.bind(this),
                onChange: this.aceChanged.bind(this)
            };
        }
    
        aceLoaded(editor) {
            this.editor = editor;
            editor.$blockScrolling = Infinity;
    
            if (this.initialText) {
                this.setEditorText(this.initialText);
            }
                
            this.$timeout(() => {
                this.editor.resize();
            }, 0);
            
            if (typeof this.selectionChanged === 'function') {
                const selection = this.editor.getSelection();
                selection.on('changeSelection', event => {
                    this.$scope.$apply(() => {
                        this.selectionChanged({$text: this.editor.getSelectedText()});
                    });
                });
            }
            
            if (typeof this.editorLoaded === 'function') {
                this.editorLoaded({$editor: this.editor});
            }
        }
    
        aceChanged() {
            const text = this.editor.getValue();
            this.ngModelCtrl.$setViewValue(text);
        }
    
        setEditorText(text) {
            if (this.editor) {
                this.editor.setValue(text, -1);
            } else {
                this.initialText = text;
            }
        }
    
        loadFromSrc() {
            if (!this.src) return;
            const $ctrl = this;
    
            const url = this.$sce.getTrustedResourceUrl(this.src);
            this.$templateRequest(url).then(text => {
                $ctrl.setEditorText(text);
            });
        }
    
        setTheme() {
            if (this.theme) {
                if (this.editor) {
                    this.editor.setTheme('ace/theme/' + this.theme);
                } else if (this.aceConfig) {
                    this.aceConfig.theme = this.theme;
                }
            }
        }
    
        setMode() {
            if (this.mode) {
                if (this.editor) {
                    this.editor.getSession().setMode('ace/mode/' + this.mode);
                } else if (this.aceConfig) {
                    this.aceConfig.mode = this.mode;
                }
            }
        }
    
        setShowGutter() {
            if (this.editor) {
                this.editor.renderer.setShowGutter(!!this.showGutter);
            } else if (this.aceConfig) {
                this.aceConfig.showGutter = !!this.showGutter;
            }
        }
    }
    
    return {
        restrict: 'E',
        template: function($element, attrs) {
            const htmlContent = $element.html().trim();
            $element.empty();
            if (htmlContent)
                $element.data('htmlContent', htmlContent);
            return `<div ma-load-modules="['ui.ace']" ma-modules-loaded="$ctrl.modulesLoaded = true"
                ng-if="$ctrl.modulesLoaded" ui-ace="$ctrl.aceConfig"></div>`;
        },
        require: {
            'ngModelCtrl': 'ngModel'
        },
        scope: {},
        controllerAs: '$ctrl',
        bindToController: {
            src: '@?',
            mode: '@?',
            theme: '@?',
            showGutter: '<?',
            selectionChanged: '&?',
            editorLoaded: '&?',
            options: '<?'
        },
        controller: AceEditorController,
        designerInfo: {
            translation: 'ui.components.aceEditor',
            icon: 'code'
        }
    };
}

export default AceEditor;
