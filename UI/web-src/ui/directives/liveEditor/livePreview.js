/**
 * @copyright 2020 {@link http://infiniteautomation.com|Infinite Automation Systems, Inc.} All rights reserved.
 * @author Jared Wiltshire
 */

livePreviewDirective.$inject = ['$compile'];
function livePreviewDirective($compile) {

    class LivePreviewController {
        static get $$ngIsClass() { return true; }
        static get $inject() { return ['$scope', '$element']; }

        constructor($scope, $element) {
            this.$scope = $scope;
            this.$element = $element;
            this.childScope = null;
        }

        $onChanges(changes) {
            if (changes.livePreview) {
                this.updatePreview();
            }
        }

        updatePreview() {
            if (this.childScope) {
                this.childScope.$destroy();
                this.childScope = null;
            }

            if (this.livePreview) {
                this.childScope = this.$scope.$new();
                const compileText = '<div>' + this.livePreview + '</div>';
                const $div = $compile(compileText)(this.childScope);
                this.$element.append($div.contents());
            } else {
                this.$element.empty();
            }
        }
    }

    return {
        scope: false,
        bindToController: {
            livePreview: '<maUiLivePreview'
        },
        controller: LivePreviewController
    };
}

export default livePreviewDirective;
