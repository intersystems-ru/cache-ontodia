import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Springy from 'springy';

import DiagramModel from './src/ontodia/diagram/model';
import DiagramView from './src/ontodia/diagram/view';
import {FilterModel, FilterView} from './src/ontodia/widgets/filter';
import {ClassTree} from './src/ontodia/widgets/classTree';
import {dataURLToBlob} from './src/ontodia/viewUtils/toSvg';
import {resizePanel, setPanelHeight} from './src/ontodia/resizable-panels';
import {resizeItem} from './src/ontodia/resizable-items';
import EditorToolbar from './src/ontodia/widgets/toolbar';
import {OntodiaWorkspaceComponent} from './src/ontodia/ontodia-workspace-component';
import {showTutorial, showTutorialIfNotSeen} from './src/ontodia/tutorial/tutorial';

export interface Params {
    container:HTMLElement;
    onSaveDiagram?:() => void;
    onShareDiagram?:() => void;
    onEditAtMainSite?:() => void;
    isViewOnly?:boolean;
    hideTutorial?:boolean;
}

export default class Ontodia {
    private model:DiagramModel;
    private diagram:DiagramView;
    private rootElement:HTMLElement;
    private filter:FilterView;
    private tree:ClassTree;
    private isViewOnly:boolean;

    public constructor(params:Params) {
        this.isViewOnly = params.isViewOnly ? true : false;

        ReactDOM.render(
            React.createElement(OntodiaWorkspaceComponent, {
                isViewOnly: this.isViewOnly
            }),
            params.container
        );

        this.model = new DiagramModel(this.isViewOnly);
        this.diagram = new DiagramView(this.model, document.getElementById('chart'));
        this.rootElement = document.getElementById('chart');

        if (!this.isViewOnly) {
            this.filter = new FilterView({
                model: new FilterModel(this.diagram.model),
                view: this.diagram,
                el: $('.filter-view').get(0)
            }).render();

            this.tree = new ClassTree({
                model: new FilterModel(this.diagram.model),
                view: this.diagram,
                el: $('.tree-view').get(0)
            }).render();

            this.tree.getJSTree().on('select_node.jstree', (e:any, data:any) => {
                this.filter.model.filterByType(data.selected[0]);
            });

            $('.filter-panel').each(resizePanel);
            $('.filter-item').each(resizeItem);
        }

        ReactDOM.render(
            React.createElement(EditorToolbar, {
                onUndo: () => {},//this.diagram.undo(),
                onRedo: () => {},//this.diagram.redo(),
                onZoomIn: () => this.diagram.zoomIn(),
                onZoomOut: () => this.diagram.zoomOut(),
                onZoomToFit: () => this.diagram.zoomToFit(),
                onPrint: () => this.diagram.print(),
                onExportSVG: (link:HTMLAnchorElement) => this.onExportSvg(link),
                onExportPNG: (link:HTMLAnchorElement) => this.onExportPng(link),
                onShare: params.onShareDiagram,
                onSaveDiagram: params.onSaveDiagram,
                onForceLayout: () => {
                    this.forceLayout();
                    this.diagram.zoomToFit();
                },
                onChangeLanguage: (value:string) => this.diagram.setLanguage(value),
                onShowTutorial: () => {
                    if (!params.hideTutorial) showTutorial();
                },
                onEditAtMainSite: params.onEditAtMainSite,
                isViewOnly: this.isViewOnly
            }),
            document.getElementById('ontodia-toolbar')
        );

        $(window).resize(() => {
            if (!this.isViewOnly) $('.filter-panel').each(setPanelHeight);
        });

        if (!this.isViewOnly && !params.hideTutorial) {
            showTutorialIfNotSeen();
        }
    }

    public getModel() {
        return this.model;
    }

    public getDiagram() {
        return this.diagram;
    }

    public forceLayout() {
        const graph = new Springy.Graph();
        for (const elementId in this.model.elements) {
            if (this.model.elements.hasOwnProperty(elementId)) {
                const element:any = this.model.elements[elementId];
                if (!this.isViewOnly || element.get('presentOnDiagram')) {
                    element.graphNode = graph.newNode();
                    element.graphNode.real = element;
                }
            }
        }
        for (const linkId in this.model.linksByType) {
            if (this.model.linksByType.hasOwnProperty(linkId)) {
                const links = this.model.linksByType[linkId];
                for (const link of links) {
                    const graphLink:any = link;
                    const source:any = this.model.sourceOf(link);
                    const target:any = this.model.targetOf(link);
                    if (!this.isViewOnly || this.model.isSourceAndTargetVisible(link)) {
                        graphLink.graphEdge = graph.newEdge(source.graphNode, target.graphNode);
                        graphLink.graphEdge.real = link;
                    }
                }
            }
        }
        const layout = new Springy.Layout.ForceDirected(graph, 300.0, 300.0, 0.5);
        for (let j = 0; j < 1000; j++) {
            layout.tick(0.03);
        }
        layout.eachNode(function (node, point) {
            (<any>node).real.position(50 * point.p.x, 50 * point.p.y);
        });
    }

    private onExportSvg(link:HTMLAnchorElement) {
        this.diagram.exportSVG().then(svg => {
            (<any>link).download = 'diagram.svg';
            link.href = window.URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml'}));
            link.click();
        });
    }

    private onExportPng(link:HTMLAnchorElement) {
        this.diagram.exportPNG({backgroundColor: 'white'}).then(dataUri => {
            (<any>link).download = 'diagram.png';
            link.href = window.URL.createObjectURL(dataURLToBlob(dataUri));
            link.click();
        });
    }
}
