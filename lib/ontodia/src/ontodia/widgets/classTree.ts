import { ClassTreeElement } from '../diagram/model';
import DiagramView from '../diagram/view';

import FilterModel from './filterModel';

// WTF? why importing filter models/views and linsToolbox view here?
import { BaseFilterOptions } from './filter';
import { LinkTypesToolboxModel } from './linksToolboxModel';
import { LinkTypesToolbox } from './linksToolbox';

import 'jstree';

export class ClassTree extends Backbone.View<FilterModel> {
    private filter = null;
    private tree: JQuery = null;
    private rest: JQuery = null;
    private view: DiagramView;

    constructor(options: BaseFilterOptions<FilterModel>) {
        super(_.extend({className: 'tree-view filter-view stateBasedProgress'}, options));
        let selfLink = this;
        this.$el.addClass(_.result(this, 'className'));
        this.view = options.view;
        this.model.set('language', this.view.getLanguage(), {silent: true});
        this.listenTo(this.view, 'change:language', this.onLanguageChanged);

        this.rest = $('<div class="filter-rest"></div>');
        this.tree = $('<div class="class-tree"></div>').appendTo(this.rest);

        // Input for search in classTree
        this.filter = $(
            '<div class="filter-criteria"' +
            '   style="margin-bottom: 10px;border-color: black;">' +
            '   <ul></ul>' +
            '</div>');

        let innerDiv =
            $('<div style="margin-left: 10px; margin-right: 10px;"></div>')
            .appendTo(this.filter);
        let searchInput =
            $('<input type="text" class="search-input form-control" placeholder="Search for..."/>')
            .appendTo(innerDiv);

        this.listenTo(this.view.model, 'state:dataLoaded', () => {
            this.updateLinks();
            let model = this.view.model;
            let tree = model.classTree;
            this.updateClassLabels(tree);
            this.setUrls(tree);
            this.tree.jstree({
                'plugins': ['sort', 'search'],
                'core': {
                    'data': tree
                },
                'types': {
                    'default': { 'icon': require('../../../images/tree-node-class.png') }
                },
                'sort': function (firstClassId, secondClassId) {
                    return model.classesById[firstClassId]['text'].localeCompare(
                        model.classesById[secondClassId]['text']);
                },
                'search': {
                    'case_insensitive': true,
                    'show_only_matches': true
                }
            });

            searchInput.keyup(function() {
                let searchString = $(this).val();
                selfLink.tree.jstree('search', searchString);
            });
        });
    }

    updateLinks() {
        // WTF? why creating toolbox here??
        let toolboxGroup = new LinkTypesToolbox({
            model: new LinkTypesToolboxModel(this.view.model),
            view: this.view,
            el: $('.link-types-toolbox').get(0)
        }).render();
    }

    updateClassLabels(roots) {
        if (roots) {
            for (let i = 0; i < roots.length; i++) {
                let element = roots[i];
                element.text = this.view.getLocalizedText(element.label.values).text + ' (' + element.count + ')';
                if ('children' in element) {
                    this.updateClassLabels(element.children);
                }
            }
        }
    }

    getJSTree() {
        return this.tree;
    }

    private onLanguageChanged() {
        this.updateClassLabels(this.view.model.classTree);
        let jsTree = $('.class-tree').jstree(true);
        (<any>jsTree).settings.core.data = this.view.model.classTree;
        jsTree.refresh(/* do not show loading indicator */ true, undefined);
    }

    private setUrls(tree: ClassTreeElement[]){
        tree.forEach(el => {
          this.setUrlsRec(el);
        });
    }
    private setUrlsRec(root: ClassTreeElement){
        root.a_attr = { href: '#' + root.id };
        root.children.forEach(el => this.setUrlsRec(el));
    }

    public render(): ClassTree {
        this.filter.appendTo(this.$el);
        this.rest.appendTo(this.$el);
        return this;
    }
}

export default ClassTree;
