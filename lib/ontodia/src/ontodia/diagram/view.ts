import * as d3 from 'd3';
import * as Backbone from 'backbone';
import * as joint from 'jointjs';

import * as svgui from '../../svgui/svgui';
import { Indicator, WrapIndicator } from '../../svgui/indicator';

import { ElementModel, LocalizedString, ClassModel } from '../data/model';

import { Element } from './elements';
import { DiagramModel, chooseLocalizedText, uri2name } from './model';

import { PaperArea } from '../viewUtils/paperArea';
import { printPaper } from '../viewUtils/printPaper';
import {
    toSVG, toSVGOptions, toDataURL, toDataURLOptions, indexToHueInDegrees,
} from '../viewUtils/toSvg';
import { UIElementView, LinkView } from './elementViews';

/**
 * Properties:
 *     language: string
 *     elementWithHalo: Element - current element with Halo; if multiple elements selected then null
 */
export class DiagramView extends Backbone.Model {
    private paper: joint.dia.Paper;
    private paperScroller: PaperArea;
    // private halo: joint.ui.Halo;
    // private selectionView: joint.ui.SelectionView;
    // private commandManager: joint.dia.CommandManager;

    private $svg: JQuery;
    private $documentBody: JQuery;
    private indicator: WrapIndicator;
    private colors: d3.Map<d3.Hcl>;

    public dragAndDropElements: { [id: string]: Element };

    private toSVGOptions: toSVGOptions = {
        elementsToRemoveSelector: '.link-tools, .marker-vertices',
        blacklistedCssAttributes: [
            '-webkit-column-rule-color',
            '-webkit-tap-highlight-color',
            '-webkit-text-emphasis-color',
            '-webkit-text-fill-color',
            '-webkit-text-stroke-color',
            '-webkit-user-select',
            'cursor',
            'white-space',
            'box-sizing',
            'line-height',
            'outline-color',
        ],
    };

    constructor(public model: DiagramModel, rootElement: HTMLElement) {
        super();
        this.setLanguage('en');
        this.paper = new joint.dia.Paper({
            // TODO handle auto resize (or better: auto resize + scroll from Rappid)
            model: this.model.graph,
            gridSize: 1,
            elementView: UIElementView,
            linkView: LinkView,
            width: 1500,
            height: 800,
            async: true,
        });
        this.paper['diagramView'] = this;
        this.$svg = this.paper.$('svg');

        this.setupTextSelectionPrevention();
        this.configureScroller(rootElement);
        // this.configureCommandManager();
        // this.configureSnaplines();
        this.configureSelection();
        // this.configureHalo();
        this.enableDragAndDropSupport();

        // Key handler (key=delete=46)
        $('html').keyup(e => {
            if (e.keyCode === 46) {
                const currentElement = this.getElementWithHalo();
                if (currentElement) {
                    this.model.graph.trigger('batch:start');
                    currentElement.remove();
                    this.model.graph.trigger('batch:stop');
                } 
                // else if(localThis.selectionView && localThis.selectionView.model){
                //     var models = localThis.selectionView.model.models;
                //     localThis.selectionView.cancelSelection();
                //     this.model.graph.trigger("batch:start");
                //     for (var i = 0; i < models.length; i++) {
                //         models[i].remove();
                // }
                // this.model.graph.trigger("batch:stop");
            }
        });

        let indicator: Indicator;
        const onLoaded = (elementCount?: number, error?: any) => {
            if (this.indicator) {
                this.indicator.remove();
            }
            const createTemporaryIndicator = (status?: string) => {
                const paperRect = this.$svg.get(0).getBoundingClientRect();
                const x = status ? paperRect.width / 4 : paperRect.width / 2;
                indicator = Indicator.create(d3.select(this.$svg.get(0)), {
                    position: {x: x, y: paperRect.height / 2 },
                });
                indicator.status(status);
            };
            const WARN_ELEMENT_COUNT = 70;
            if (error) {
                createTemporaryIndicator(error.statusText || error.message);
                indicator.error();
            } else if (elementCount > WARN_ELEMENT_COUNT) {
                createTemporaryIndicator(
                    `The diagram contains more than ${WARN_ELEMENT_COUNT} ` +
                    `elements. Please wait until it is fully loaded.`);
            } else {
                createTemporaryIndicator();
            }
            indicator.run();
        };
        this.listenTo(model, 'state:beginLoad', this.showIndicator);
        this.listenTo(model, 'state:endLoad', onLoaded);
        this.listenTo(model, 'state:loadError', (error: any) => onLoaded(null, error));
        this.listenTo(model, 'state:renderStart', () => {
            if (indicator) { indicator.remove(); }
        });
        this.listenTo(this.paper, 'render:done', () => {
            this.model.trigger('state:renderDone');
        });
        this.listenTo(model, 'state:dataLoaded', () => {
            // this.commandManager.reset();
            this.zoomToFit();
        });
        this.colors = d3.map<d3.Hcl>();
    }

    getLanguage(): string { return this.get('language'); }
    setLanguage(value: string) { this.set('language', value); }

    getElementWithHalo(): Element { return this.get('elementWithHalo'); }

    // undo() { this.commandManager.undo(); }
    // redo() { this.commandManager.redo(); }
    // initBatchCommand() { this.commandManager.initBatchCommand(); }
    // storeBatchCommand() { this.commandManager.storeBatchCommand(); }

    print() {
        const $html = $(document.documentElement);
        printPaper(this.paper, {
            beforePrint: () => $html.addClass('print-ready'),
            afterPrint: () => $html.removeClass('print-ready'),
            printFinished: () => this.zoomToFit(),
        });
    }
    exportSVG(): Promise<string> {
        return new Promise<string>(resolve => {
            toSVG(this.paper, resolve, this.toSVGOptions);
        });
    }
    exportPNG(options?: toDataURLOptions): Promise<string> {
        options = options || {};
        options.svgOptions = options.svgOptions || this.toSVGOptions;
        return new Promise<string>(resolve => {
            toDataURL(this.paper, resolve, options);
        });
    }

    zoomIn() { this.paperScroller.zoom(0.2, { max: 2 }); }
    zoomOut() { this.paperScroller.zoom(-0.2, { min: 0.2 }); }
    zoomToFit() {
        if (this.model.graph.get('cells').length > 0) {
            this.paperScroller.zoomToFit({
                minScale: 0.2,
                maxScale: 2,
            });
            this.paperScroller.zoom(-0.1, { min: 0.2 });
        } else {
            this.paperScroller.center();
        }
    }

    showIndicator(operation?: Promise<any>) {
        this.paperScroller.center();
        const svgElement: SVGElement = <any>this.paper.$('svg').get(0);
        const svgBoundingRect = svgElement.getBoundingClientRect();
        this.indicator = WrapIndicator.wrap(d3.select(svgElement), {
            position: {
                x: svgBoundingRect.width / 2,
                y: svgBoundingRect.height / 2,
            },
        });
        if (operation) {
            operation.then(() => {
                this.indicator.remove();
            }).catch(error => {
                console.log(error);
                this.indicator.status('Unknown error occured');
                this.indicator.error();
            });
        }
    }

    private setupTextSelectionPrevention() {
        this.$documentBody = $(document.body);
        this.paper.on('cell:pointerdown', () => {
            this.preventTextSelection();
        });
        document.addEventListener('mouseup', () => {
            this.$documentBody.removeClass('unselectable');
        });
        if ('onselectstart' in document) { // IE unselectable fix
            document.addEventListener('selectstart', () => {
                const unselectable = this.$documentBody.hasClass('unselectable');
                return !unselectable;
            });
        }
    }

    private preventTextSelection() {
        this.$documentBody.addClass('unselectable');
    }

    private configureScroller(rootElement: HTMLElement) {
        this.paperScroller = new PaperArea({paper: this.paper});
        this.paper.on('blank:pointerdown', (evt) => {
            if (evt.ctrlKey || this.model.isViewOnly()) {
                this.preventTextSelection();
                // this.selectionView.cancelSelection();
                this.paperScroller.startPanning(evt);
            }
        });
        $(rootElement).append(this.paperScroller.render().el);

        this.listenTo(this.paper, 'render:done', () => {
            this.paperScroller.adjustPaper();
            this.paperScroller.center();
        });

        // automatic paper adjust on element dragged
        this.listenTo(this.paper, 'cell:pointerup', () => {
            this.paperScroller.adjustPaper();
        });
    }

    private configureSelection() {
        if (this.model.isViewOnly()) { return; }
        // HACK: need to know whether halo is visible or not
        // var superRemove = joint.ui.Halo.prototype['remove'];
        // joint.ui.Halo.prototype['remove'] = function () {
        //     var result = superRemove.apply(this, arguments);
        //     this.trigger('halo-remove', this);
        //     return result;
        // };

        this.paper.on('cell:pointerup', (cellView, evt) => {
            // We don't want a Halo for links.
            if (cellView.model instanceof joint.dia.Link) { return; }
            if (evt.ctrlKey || evt.metaKey) { return; }
            // this.selectionView.cancelSelection();
            this.setSelectedElement(cellView);
        });
    }

private setSelectedElement(cellView: joint.dia.CellView) {
        // var halo = new joint.ui.Halo({ graph: this.model.graph, paper: this.paper, cellView: cellView });
        // halo.removeHandle('unlink');
        // halo.addHandle({ name: 'add-to-filter', position: 'se', icon: 'images/icons/halo/add-to-filter.png' });

        // const getExpandOrCollapseIconUri = (model: Backbone.Model) => cellView.model.get('isExpanded')
        //     ? 'images/icons/halo/collapse-properties.png'
        //     : 'images/icons/halo/expand-properties.png';
        // halo.addHandle({ name: 'expand-properties', position: 's', icon: getExpandOrCollapseIconUri(cellView.model) });

        // halo.on('action:add-to-filter:pointerdown', (evt) => {
        //     evt.stopPropagation();
        //     cellView.model.trigger('add-to-filter', cellView.model);
        // });
        // halo.on('action:expand-properties:pointerdown', (evt) => {
        //     evt.stopPropagation();
        //     cellView.model.set('isExpanded', !cellView.model.get('isExpanded'));
        // });
        // halo.on('halo-remove', (self: joint.ui.Halo) => {
        //     this.set('elementWithHalo', null);
        //     if (self.options.cellView) { this.stopListening(self.options.cellView.model); }
        //     delete self.options.cellView;
        // });
        // halo.listenTo(cellView.model, 'change:isExpanded', (model: Backbone.Model, value: boolean) => {
        //     halo.changeHandle('expand-properties', { position: 's', icon: getExpandOrCollapseIconUri(model) });
        // });
        // this.halo = halo;
        this.set('elementWithHalo', cellView.model);
        // halo.render();
        cellView.model.trigger('add-to-filter', cellView.model);
    }

    // private configureSelection() {
    //     const selection = new Backbone.Collection<Element>();
    //     this.selectionView = new joint.ui.SelectionView({
    //         paper: this.paper,
    //         graph: this.model.graph,
    //         model: selection,
    //     });

    //     if (!this.model.isViewOnly()) {
    //         this.paper.on('blank:pointerdown', (evt) => {
    //             if (!evt.ctrlKey) {
    //                 this.preventTextSelection();
    //                 this.selectionView.startSelecting(evt);
    //             }
    //         });
    //         this.paper.on('cell:pointerup', (cellView, evt) => {
    //             const haloCellView = this.halo ? this.halo.options.cellView : null;
    //             if ((evt.ctrlKey || evt.metaKey) &&
    //                 !(cellView.model instanceof joint.dia.Link) &&
    //                 cellView !== haloCellView
    //             ) {
    //                 selection.add(cellView.model);
    //                 this.selectionView.createSelectionBox(cellView);
    //                 if (selection.length === 1 && haloCellView) {
    //                     this.halo.remove();
    //                     selection.add(<Element>haloCellView.model);
    //                     this.selectionView.createSelectionBox(haloCellView);
    //                 }
    //             }
    //         });
    //         this.selectionView.on('selection-box:pointerdown', (evt) => {
    //             if (evt.ctrlKey || evt.metaKey) {
    //                 const cell = selection.get($(evt.target).data('model'));
    //                 if (cell) {
    //                     selection.reset(selection.without(cell));
    //                     this.selectionView.destroySelectionBox(this.paper.findViewByModel(cell));
    //                 }
    //             }
    //         });
    //         this.selectionView.on('selection-box:pointerup', () => { this.paperScroller.adjustPaper(); });
    //     }
    // }

    // private configureCommandManager() {
    //     this.commandManager = new joint.dia.CommandManager({
    //         graph: this.model.graph,
    //         cmdBeforeAdd: (cmdName: string, cell, graph, options) => {
    //             const ignore = options && options.ignoreCommandManager;
    //             return !cmdName.match(/^change:(?:size|selectedInFilter)$/) && !ignore;
    //         },
    //     });
    // }

    // private configureSnaplines() {
    //     const snaplines = new joint.ui.Snaplines({ paper: this.paper });
    //     snaplines.startListening();
    // }

    private enableDragAndDropSupport() {
        const svg = this.$svg.get(0);
        svg.addEventListener('dragover', (e: DragEvent) => {
            if (e.preventDefault) { e.preventDefault(); } // Necessary. Allows us to drop.
            e.dataTransfer.dropEffect = 'move';
            return false;
        });
        svg.addEventListener('dragenter', function (e) {});
        svg.addEventListener('dragleave', function (e) {});
        svg.addEventListener('drop', (e: DragEvent) => {
            e.preventDefault();
            let elementIds: string[];
            try {
                elementIds = JSON.parse(e.dataTransfer.getData('application/x-ontodia-elements'));
            } catch (ex) {
                try {
                    elementIds = JSON.parse(e.dataTransfer.getData('text')); // IE fix
                } catch (ex) {
                    const uriFromTree = e.dataTransfer.getData('text/uri-list');
                    elementIds = [uriFromTree.substr(uriFromTree.indexOf('#') + 1, uriFromTree.length)];
                }
            }
            if (!elementIds) { return; }

            // this.initBatchCommand();

            // this.selectionView.cancelSelection();
            // if (this.halo) { this.halo.remove(); }
            // var selection: Backbone.Collection<Element> = this.selectionView.model;
            if (this.get('elementWithHalo')) { this.set('elementWithHalo', null); }

            let totalXOffset = 0;
            for (const elementId of elementIds) {
                const element = this.getDragAndDropElement(elementId);
                if (element) {
                    const currentOffset = this.paperScroller.$el.offset();
                    const relX = e.pageX - currentOffset.left;
                    const relY = e.pageY - currentOffset.top;
                    const graphPoint = this.paperScroller.toLocalPoint(relX, relY);
                    element.set('presentOnDiagram', true);
                    element.set('selectedInFilter', false);
                    const size: { width: number; height: number; } = element.get('size');
                    if (elementIds.length === 1) {
                        graphPoint.x -= size.width / 2;
                        graphPoint.y -= size.height / 2;
                    }
                    element.set('position', {
                        x: graphPoint.x + totalXOffset,
                        y: graphPoint.y,
                    }, <any>{ignoreCommandManager: true});
                    totalXOffset += size.width + 20;
                    this.setSelectedElement(this.paper.findViewByModel(element));
                    // if (elementIds.length > 1) {
                    //     selection.add(element);
                    //     this.selectionView.createSelectionBox(this.paper.findViewByModel(element));
                    // } else {
                    //     this.renderHalo(this.paper.findViewByModel(element));
                    // }
                }
            }

            // this.storeBatchCommand();
        });
    }

    private getDragAndDropElement(elementId: string): Element {
        if (this.model.elements[elementId]) {
            return this.model.elements[elementId];
        } else if (this.dragAndDropElements && this.dragAndDropElements[elementId]) {
            const element = this.dragAndDropElements[elementId];
            this.model.initializeElement(element, {requestData: true});
            return element;
        } else {
            return this.model.createElement({
                id: elementId,
                types: [],
                label: {values: [{lang: '', text: elementId}]},
                properties: {},
            });
        }
    }

    public getLocalizedText(texts: LocalizedString[]): LocalizedString {
        return chooseLocalizedText(texts, this.getLanguage());
    }

    public getElementTypeString(elementModel: ElementModel): string {
        return _.map(elementModel.types, (typeId: string) => {
            const type = this.model.classesById[typeId];
            return type ? this.getElementTypeLabel(type).text : uri2name(typeId);
        }).join(', ');
    }

    public getElementTypeLabel(type: ClassModel): LocalizedString {
        const label = this.getLocalizedText(type.label.values);
        return label ? label : { text: uri2name(type.id), lang: '' };
    }

    public getLinkLabel(linkTypeId: string): LocalizedString {
        const type = this.model.linkTypes[linkTypeId];
        const label = type ? this.getLocalizedText(type.label.values) : null;
        return label ? label : { text: uri2name(linkTypeId), lang: '' };
    }

    public getElementColor(elementModel: ElementModel): d3.Hcl {
        // elementModel.types MUST BE sorted; see DiagramModel#normalizeData()
        const key = JSON.stringify(elementModel.types);
        let color: d3.Hcl = this.colors.get(key);
        if (!color) {
            const hue = indexToHueInDegrees(this.colors.size());
            color = d3.hcl(hue, 40, 75);
            this.colors.set(key, color);
        }
        return color;
    }

    public getRandomPositionInViewport() {
        const margin = { left: 100, top: 60, right: 100, bottom: 60 };
        const offset = this.getCanvasPageOffset();
        return {
            x: offset.x + margin.left + Math.random() * (
                this.$svg.width() - margin.left - margin.right),
            y: offset.y + margin.top + Math.random() * (
                this.$svg.height() - margin.top - margin.bottom),
        };
    }

    private getCanvasPageOffset(): svgui.Vector {
        const boundingBox = this.$svg.get(0).getBoundingClientRect();
        const xScroll = (typeof window.pageXOffset !== 'undefined') ? window.pageXOffset
            : (<any> document.documentElement || document.body.parentNode || document.body).scrollLeft;
        const yScroll = (typeof window.pageYOffset !== 'undefined') ? window.pageYOffset
            : (<any> document.documentElement || document.body.parentNode || document.body).scrollTop;
        return {x: boundingBox.left + xScroll, y: boundingBox.top + yScroll};
    }
}

export default DiagramView;
