import * as joint from 'jointjs';

import * as svgui from '../../svgui/svgui';
import { ElementModel } from '../data/model';
import { Element, Link, FatLinkType } from './elements';
import { uri2name } from './model';
import DiagramView from './view';

export class UIElementView extends joint.dia.ElementView {
    model: Element;
    private view: DiagramView;
    private name: svgui.Label;
    private label: svgui.Label;
    private pair: svgui.LabelPair;
    private uiList: svgui.UIList;
    private expander: svgui.Expander;
    private box: svgui.NamedBox;
    private table: svgui.PropertyTable;
    private properties: Array<{ left: string; right: string; }>;
    initialize() {
        joint.dia.ElementView.prototype.initialize.apply(this, arguments);
        this.listenTo(this.model, 'state:loaded', this.updateUI);
        this.listenTo(this.model, 'change:isExpanded', () => {
            const isExpanded = Boolean(this.model.get('isExpanded'));
            if (Boolean(this.expander.get('expanded')) !== isExpanded) {
                this.expander.set('expanded', isExpanded);
                this.expander.update();
                this.updateProperties();
                this.layoutUI();
            }
        });
    }
    render(): UIElementView {
        const result: any = super.render();
        this.createUI();
        this.update();
        if (!this.view && this['paper'] && this['paper']['diagramView']) {
            this.setView(this['paper']['diagramView']);
        }
        return result;
    }
    private setView(view: DiagramView) {
        this.view = view;
        this.listenTo(this.view, 'change:language', this.updateUI);
        this.updateUI();
    }
    private createUI() {
        const $root = this.$('.rootOfUI').empty();
        this.box = new svgui.NamedBox({
            parent: d3.select($root.get(0)),
            captionText: '<loading...>',
        });
        this.expander = new svgui.Expander({
            parent: this.box.root,
            splitterMargin: 3,
            expanded: this.model.get('isExpanded'),
        });
        this.expander.splitter
            .style('stroke', this.box.get('color'))
            .style('stroke-width', 1);

        this.uiList = new svgui.UIList({
            parent: this.expander.root,
            margin: {top: 5, right: 0, bottom: -4, left: 0},
            horIndent: 0,
            expanded: this.model.get('isExpanded'),
        });

        this.name = new svgui.Label({
            parent: this.expander.root,
            raze: false,
            margin: {top: 5, right: 0, bottom: 5, left: 0},
            text: '<loading...>',
        });

        this.label = new svgui.Label({
            textClass: 'svguiLabelText',
            text: '<loading...>',
        });
        this.pair = new svgui.LabelPair({
            leftText: 'IRI:',
            rightText: '<loading...>',
            pairClass: 'iriText',
            percent_leftright: 10,
            margin: {top: -4, right: 0, bottom: -4, left: 0},
            horIndent: 0,
        });

        this.uiList.set('content', [{name: '', val: [this.label, this.pair]}]);
        this.uiList.update();

        this.table = new svgui.PropertyTable({
            parent: this.expander.root,
            margin: {top: 2, right: 0, bottom: 0, left: 0},
            horIndent: 0,
        });
        this.expander.set('expandedfirst', this.uiList);
        this.expander.set('first', this.name);
        this.expander.set('second', this.table);
        this.expander.update();
        this.box.root.on('dblclick', () => {
            this.model.set('isExpanded', !this.model.get('isExpanded'));
        });
        this.box.set('child', this.expander);
        this.box.update();
        this.updateUI();
    }
    private layoutUI() {
        const measuredSize = svgui.measure(this.box, {x: 250, y: Infinity});
        svgui.arrange(this.box, 0, 0);
        this.model.resize(measuredSize.x, measuredSize.y);
    }
    private updateUI() {
        if (this.model.template && this.view) {
            this.box.set('captionText', this.view.getElementTypeString(this.model.template));
            this.box.set('color', this.view.getElementColor(this.model.template));
            this.box.update();
            this.updateUIList();
            this.updateProperties();
            this.expander.splitter.style('stroke', this.box.get('color'));
        }
        this.layoutUI();
    }

    private updateUIList() {
        const iri = this.model.template.id;
        let name = this.view.getLocalizedText(this.model.template.label.values).text;
        if (!name) { name = iri; }
        this.label.set('text', name);
        this.name.set('text', name);
        this.pair.set('rightText', iri);
        this.label.update();
        this.name.update();
        this.pair.update();
    }

    private updateProperties() {
        if (!this.expander.get('expanded')) { return; }
        if (!this.properties) {
            this.properties = [];
            listPropertyValues(this.model.template, this.view.getLanguage(), (propertyName, values) => {
                this.properties.push({left: uri2name(propertyName), right: values[0]});
                for (const value of values) {
                    this.properties.push({left: '', right: value});
                }
            });
            if (this.properties.length === 0) {
                this.properties.push({left: 'no properties', right: ''});
            }
        }
        this.table.set('content', [{name: '', val: this.properties}]);
        this.table.update();
    }
}

function listPropertyValues(
    elementModel: ElementModel, language: string,
    handler: (propertyName: string, values: string[]) => void
) {
    for (const propertyName in elementModel.properties) {
        if (elementModel.properties.hasOwnProperty(propertyName)) {
            const values = elementModel.properties[propertyName];
            const stringValues = [];
            for (const property of values) {
                if (property.type === 'string') {
                    const localized = property.value;
                    if (localized.lang.length === 0 || localized.lang === language) {
                        stringValues.push(localized.text);
                    }
                }
            }
            if (stringValues.length > 0) {
                handler(propertyName, stringValues);
            }
        }
    }
}

export class LinkView extends joint.dia.LinkView {
    model: Link;
    private view: DiagramView;
    initialize() {
        joint.dia.LinkView.prototype.initialize.apply(this, arguments);
        this.listenTo(this.model, 'state:loaded', this.updateLabel);
    }
    render(): LinkView {
        const result: any = super.render();
        if (!this.view && this['paper'] && this['paper']['diagramView']) {
            this.setView(this['paper']['diagramView']);
        }
        return result;
    }
    getTypeModel(): FatLinkType {
        return this.view.model.linkTypes[this.model.get('typeId')];
    }
    private setView(view: DiagramView) {
        this.view = view;
        this.listenTo(this.view, 'change:language', this.updateLabel);
        const typeModel = this.getTypeModel();
        if (typeModel) {
            // if type model is missing => link will be deleted from diagram
            this.listenTo(typeModel, 'change:showLabel', this.updateLabel);
        }
        this.updateLabel();
    }
    private updateLabel() {
        const linkTypeId: string = this.model.get('typeId');
        const typeModel = this.view.model.linkTypes[linkTypeId];
        if (typeModel && typeModel.get('showLabel')) {
            this.model.label(0, {
                position: 0.5,
                attrs: {text: {
                    text: this.view.getLinkLabel(linkTypeId).text,
                }},
            });
        } else {
            this.model.set('labels', []);
        }
    }
}
