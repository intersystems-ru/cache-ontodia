declare module "ontodia.data.model" {
    export type Dictionary<T> = {
        [key: string]: T;
    };
    export interface LocalizedString {
        text: string;
        lang: string;
    }
    export type Property = {
        type: 'string';
        value: LocalizedString;
    };
    export interface ElementModel {
        id: string;
        types: string[];
        label: {
            values: LocalizedString[];
        };
        properties: {
            [id: string]: Property[];
        };
    }
    export interface LinkModel {
        linkTypeId: string;
        sourceId: string;
        targetId: string;
    }
    export interface ClassModel {
        id: string;
        label: {
            values: LocalizedString[];
        };
        count: number;
        children: ClassModel[];
    }
    export interface LinkCount {
        id: string;
        count: number;
    }
    export interface LinkType extends LinkCount {
        label: {
            values: LocalizedString[];
        };
    }
}
declare module "ontodia.data.provider" {
    import { Dictionary, ClassModel, LinkType, ElementModel, LinkModel, LinkCount } from "ontodia.data.model";
    export interface DataProvider {
        classTree(): Promise<ClassModel[]>;
        linkTypes(): Promise<LinkType[]>;
        elementInfo(params: {
            elementIds: string[];
        }): Promise<Dictionary<ElementModel>>;
        linksInfo(params: {
            elementIds: string[];
            linkTypeIds: string[];
        }): Promise<LinkModel[]>;
        linkTypesOf(params: {
            elementId: string;
        }): Promise<LinkCount[]>;
        filter(params: FilterParams): Promise<Dictionary<ElementModel>>;
    }
    export default DataProvider;
    export interface FilterParams {
        elementTypeId?: string;
        text?: string;
        refElementId?: string;
        refElementLinkId?: string;
        limit: number;
        offset: number;
        languageCode: string;
    }
}
declare module "ontodia.diagram.model" {
    import * as Backbone from 'backbone';
    import * as joint from 'jointjs';
    import { Dictionary, LocalizedString, ClassModel, ElementModel, LinkModel } from "ontodia.data.model";
    import { DataProvider } from "ontodia.data.provider";
    import { Element, Link, FatLinkType } from "ontodia.diagram.elements";
    /**
     * Model of diagram.
     *
     * Properties:
     *     isViewOnly: boolean
     *
     * Events:
     *     state:beginLoad
     *     state:endLoad (diagramElementCount?: number)
     *     state:loadError (error: any)
     *     state:renderStart
     *     state:renderDone
     *     state:dataLoaded
     */
    export class DiagramModel extends Backbone.Model {
        private static serializedCellProperties;
        graph: joint.dia.Graph;
        dataProvider: DataProvider;
        classTree: ClassTreeElement[];
        classesById: {
            [id: string]: ClassModel;
        };
        linkTypes: {
            [id: string]: FatLinkType;
        };
        elements: {
            [id: string]: Element;
        };
        linksByType: {
            [type: string]: Link[];
        };
        constructor(isViewOnly?: boolean);
        isViewOnly(): boolean;
        sourceOf(link: Link): Element;
        targetOf(link: Link): Element;
        private initializeExternalAddRemoveSupport();
        createNewDiagram(dataProvider: DataProvider): Promise<void>;
        private initLinkTypes(linkTypes);
        importLayout(params: {
            dataProvider: DataProvider;
            preloadedElements: Dictionary<ElementModel>;
            preloadedLinks: LinkModel[];
            layoutData?: LayoutData;
            linkSettings?: LinkTypeOptions[];
            hideUnusedLinkTypes?: boolean;
        }): Promise<void>;
        exportLayout(): {
            layoutData: LayoutData;
            linkSettings: LinkTypeOptions[];
        };
        private setClassTree(rootClasses);
        private initDiagram(params);
        private initLinkSettings(linkSettings?);
        private initLayout(elements, layoutData);
        private syncCellsWithLayout(elements, links);
        private hideUnusedLinkTypes(links);
        private createIfNeeded(elementModel, options?);
        createElement(elementModel: ElementModel): Element;
        initializeElement(element: Element, options?: {
            requestData?: boolean;
        }): void;
        requestLinksOfType(linkTypeIds?: string[]): Promise<void>;
        private onElementInfoLoaded(elements);
        private onLinkInfoLoaded(links);
        isSourceAndTargetVisible(link: Link): any;
        private linkInstances(linkModel, options?);
        private registerLink(link);
        private getLink(linkModel);
    }
    export default DiagramModel;
    export interface ClassTreeElement {
        id: string;
        label: {
            values: LocalizedString[];
        };
        count: number;
        children: ClassTreeElement[];
        a_attr?: {
            href: string;
        };
        icon?: string;
    }
    export interface LinkTypeOptions {
        id: string;
        visible: boolean;
        showLabel?: boolean;
    }
    export interface LayoutData {
        cells: any[];
    }
    export function normalizeTemplate(template: ElementModel): ElementModel;
    export function uri2name(uri: string): string;
    export function chooseLocalizedText(texts: LocalizedString[], language: string): LocalizedString;
}
declare module "ontodia.diagram.elements" {
    import * as Backbone from 'backbone';
    import * as joint from 'jointjs';
    import { LocalizedString, ElementModel, LinkType } from "ontodia.data.model";
    import DiagramModel from "ontodia.diagram.model";
    export class UIElement extends joint.shapes.basic.Generic {
        markup: string;
        defaults(): any;
    }
    /**
     * Properties:
     *     presentOnDiagram: boolean
     *     isExpanded: boolean
     *     position: { x: number, y: number }
     *     size: { width: number, height: number }
     *     angle: number - degrees
     *
     * Events:
     *     state:loaded
     */
    export class Element extends UIElement {
        template: ElementModel;
        /** All in and out links of the element */
        links: Link[];
        initialize(): void;
    }
    /**
     * Properties:
     *     typeId: string
     *     source: { id: string }
     *     target: { id: string }
     *     layoutOnly: boolean -- link exists only in layout (instead of underlying data)
     */
    export class Link extends joint.dia.Link {
        markup: string;
        initialize(attributes?: {
            id: string;
        }): void;
        onLayoutOnlyChanged(self: Link, value: boolean): void;
    }
    /**
     * Properties:
     *     visible: boolean
     *     showLabel: boolean
     *     isNew?: boolean
     */
    export class FatLinkType extends Backbone.Model {
        label: {
            values: LocalizedString[];
        };
        diagram: DiagramModel;
        constructor(params: {
            linkType: LinkType;
            diagram: DiagramModel;
        });
        private onVisibilityChanged(self, visible, options);
    }
}
declare module "ontodia.svgui.svgui" {
    import * as d3 from 'd3';
    import * as Backbone from 'backbone';
    // import './svgui.css';
    export interface TooltipBindParams {
        x?: number;
        y?: number;
        sdelay?: number;
        edelay?: number;
        sduration?: number;
        eduration?: number;
    }
    export class Tooltip {
        private spanClass;
        static tooltipHelperId: number;
        static instance: Tooltip;
        private helper;
        constructor(spanClass: string);
        private ensureElement();
        bindTo(element: d3.Selection<any>, textGenerator: (d: any) => string, params?: TooltipBindParams): void;
        unbind(element: d3.Selection<any>): void;
    }
    export interface Vector {
        x: number;
        y: number;
    }
    export function vector(x: number, y?: number): Vector;
    /**
     * Measures UIElement using UIElement.measure() method taking
     * it's margin, width and height fields into consideration.
     * @param element UIElement to measure
     * @param maxSize Maximum allowed size for element bounds including margin.
     *                Use Infinity to compute non-restricted element size.
     * @returns Measured size of element including margin.
     */
    export function measure(element: UIElement, maxSize: Vector): Vector;
    /**
     * Arranges UIElement by specified coordinates (x, y) and size taking
     * it's margin into consideration.
     */
    export function arrange(element: UIElement, x: number, y: number, size?: Vector): void;
    export function sizeWithMargin(element: UIElement): Vector;
    export interface Margin {
        top: number;
        right: number;
        bottom: number;
        left: number;
    }
    /**
     * Base class of SVG UI elements.
     * Backbone properties:
     *     width: number
     *     height: number
     *     margin: svgui.Margin
     */
    export class UIElement extends Backbone.Model {
        /** Root SVG element of this UIElement */
        root: d3.Selection<any>;
        /** Measured size of the element. */
        size: Vector;
        constructor(attributes?: any, options?: any);
        defaults(): any;
        initialize(attributes?: any, options?: any): void;
        /** Measures element without margin returning computed element size */
        measure(maxSize: Vector): Vector;
        /** Arranges element without margin by coordinates (x, y) using provided size */
        arrange(x: number, y: number, size: Vector): void;
    }
    /**
     * Text element with raze and line wrapping support.
     * Backbone properties:
     *     text: string
     *     textClass: string
     *     interline: number
     *     raze: boolean
     */
    export class Label extends UIElement {
        private ti;
        private iconSize;
        private textLines;
        private hyperlink;
        defaults(): any;
        initialize(): void;
        update(): this;
        measure(maxSize: any): Vector;
        arrange(x: number, y: number, size: Vector): void;
    }
    export class LabelPair extends UIElement {
        private leftWidth;
        private rightWidth;
        private leftLabel;
        private rightLabel;
        defaults(): any;
        initialize(): void;
        update(): this;
        measure(maxSize: Vector): Vector;
        arrange(x: number, y: number, size: Vector): void;
    }
    /**
     * Table with two columns and entry grouping.
     * Backbone properties:
     *     content: {
     *         name: string
     *         val: {left: string; right: string;}[]
     *     }[]
     *     captionClass: string
     *     pairClass: string
     *     percent_leftright: number
     *     indentBetweenLeftAndRight: number
     *     horIndent: number
     *     spacing: svgui.Vector
     */
    export class PropertyTable extends UIElement {
        private rendered;
        private maxLeftWidth;
        private maxRightWidth;
        private leftWidth;
        private rightWidth;
        defaults(): any;
        initialize(): void;
        update(): this;
        measure(maxSize: Vector): Vector;
        arrange(x: number, y: number, size: Vector): void;
    }
    /**
     * Table with one columns and entry grouping.
     * Backbone properties:
     *     content: {
     *         name: string
     *         val: string[]
     *     }[]
     *     captionClass: string
     *     elementsClass: UIElement
     *     indentBetweenLeftAndRight: number
     *     horIndent: number
     *     spacing: svgui.Vector
     */
    export class UIList extends UIElement {
        private rendered;
        private maxWidth;
        private width;
        defaults(): any;
        initialize(): void;
        update(): this;
        measure(maxSize: Vector): Vector;
        arrange(x: number, y: number, size: Vector): void;
    }
    /**
     * Expander element.
     * Backbone properties:
     *     first: UIElement
     *     expandedfirst: UIElement
     *     second: UIElement
     *     splitterMargin: number
     *     expanded: boolean
     */
    export class Expander extends UIElement {
        splitter: d3.Selection<any>;
        defaults(): any;
        initialize(): void;
        update(): this;
        measure(maxSize: Vector): Vector;
        arrange(x: number, y: number, size: Vector): void;
    }
    /**
     * Paginator element.
     * Backbone properties:
     *     currentPage: number
     *     pageCount: number
     *     color: any
     *     disabledColor: any
     *     isEditing: false (read-only)
     */
    export class Paginator extends UIElement {
        private buttonSize;
        private cornerRadius;
        private rect;
        private buttons;
        private prevEar;
        private nextEar;
        private firstEar;
        private lastEar;
        label: Label;
        defaults(): any;
        initialize(): void;
        update(): this;
        measure(maxSize: Vector): Vector;
        arrange(x: number, y: number, size: Vector): void;
        changePageTo(newPage: number): void;
        private createEar(isLeft, isEnd);
    }
    /**
     * Box with attached caption.
     * Backbone properties:
     *     color: any
     *     captionText: string
     *     borderThickness: number
     *     child: UIElement
     */
    export class NamedBox extends UIElement {
        private cornerRadius;
        private outerRect;
        private captionRect;
        private childRect;
        label: Label;
        defaults(): any;
        initialize(): void;
        update(): this;
        measure(maxSize: Vector): Vector;
        arrange(x: number, y: number, size: Vector): void;
    }
    export interface TextInfoResult {
        width: number;
        height: number;
        baseLineHeight: number;
        offsetY: number;
    }
    export function textInfo(stringOfText: string, textElementClass: string): TextInfoResult;
    export function razeText(element: d3.Selection<any>, text: string, textClass: string, textMetrics: TextInfoResult, maxWidth: any, tooltiper?: Tooltip): d3.Selection<any>;
    export function removeDocumentSelection(): void;
}
declare module "ontodia.svgui.indicator" {
    export interface IndicatorParams {
        size?: number;
        position?: {
            x: number;
            y: number;
        };
        maxWidth?: number;
    }
    export class Indicator {
        static instances: Indicator[];
        parent: any;
        statusText: string;
        isErrorOccurred: boolean;
        spacing: number;
        isVisible: boolean;
        size: number;
        position: {
            x: number;
            y: number;
        };
        maxWidth: number;
        private animation;
        private arrowPath;
        private text;
        private clock;
        static create(parent: any, params: IndicatorParams): Indicator;
        run(): this;
        status(statusText: string): void;
        error(): void;
        visible(isVisible: boolean): void;
        moveTo(position: {
            x: number;
            y: number;
        }): void;
        /**
         * Добавляет анимацию ожидания.
         * @param svg - селектор SVG-элемента
         */
        private animate(svg);
        remove(): void;
        private updateState();
    }
    /**
     * Displays an indicator of some operation on top of SVG element.
     * Example usage:
     *     var indicator = WrapIndicator.create(d3.select("#svg"));
     *     d3.json("data.js", function(data) {
     *         indicator.remove();
     *         // display the data in #svg
     *     });
     */
    export class WrapIndicator {
        private parent;
        private indicator;
        private wrapper;
        private running;
        private pointerEvents;
        static wrap(parent: any, params: IndicatorParams): WrapIndicator;
        status(statusText: any): void;
        error(): void;
        remove(): void;
        /**
         * Перемещает дочерние узлы из узла from в узел to,
         * за исключением самого узла to.
         */
        static moveChildren(from: any, to: any): void;
    }
}
declare module "ontodia.viewUtils.paperArea" {
    import * as joint from 'jointjs';
    import { g } from 'jointjs';
    export interface PaperAreaOptions {
        paper: joint.dia.Paper;
        padding?: number;
        autoResizePaper?: boolean;
    }
    export interface PaperAreaZoomOptions {
        absolute?: boolean;
        grid?: number;
        min?: number;
        max?: number;
        ox?: number;
        oy?: number;
    }
    export class PaperArea extends Backbone.View<any> {
        private options;
        private padding;
        private $svg;
        private _sx;
        private _sy;
        private _baseWidth;
        private _baseHeight;
        private _center;
        private isPanning;
        private originX;
        private originY;
        private originScrollLeft;
        private originScrollTop;
        constructor(options: PaperAreaOptions);
        initialize(options?: PaperAreaOptions): void;
        private onResize();
        private onScale(sx, sy, ox?, oy?);
        toLocalPoint(x: any, y: any): g.point;
        adjustPaper(): this;
        center(x?: number, y?: number): this;
        centerContent(): this;
        addPadding(): this;
        zoom(value: number, opt?: PaperAreaZoomOptions): this;
        zoomToFit(opt?: joint.dia.PaperScaleToFitOptions): this;
        private mousewheel(evt);
        startPanning(evt: any): void;
        private pan(evt);
        private stopPanning();
        private pointerdown(evt);
        private pointermove(evt);
        remove(): this;
    }
    export default PaperArea;
}
declare module "ontodia.viewUtils.printPaper" {
    import * as joint from 'jointjs';
    export interface PrintPaperOptions {
        size?: string;
        paddingLeft?: number;
        paddingRight?: number;
        paddingTop?: number;
        paddingBottom?: number;
        padding?: number;
        detachBody?: boolean;
        beforePrint?: () => void;
        afterPrint?: () => void;
        printFinished?: () => void;
    }
    export function printPaper(paper: joint.dia.Paper, opt?: PrintPaperOptions): void;
    export default printPaper;
}
declare module "ontodia.viewUtils.toSvg" {
    import * as joint from 'jointjs';
    export interface toSVGOptions {
        preserveDimensions?: boolean;
        convertImagesToDataUris?: boolean;
        blacklistedCssAttributes?: string[];
        elementsToRemoveSelector?: string;
    }
    export function toSVG(paper: joint.dia.Paper, callback: (svg: string) => void, opt?: toSVGOptions): void;
    export interface toDataURLOptions {
        type?: string;
        width?: number;
        height?: number;
        padding?: number;
        backgroundColor?: string;
        quality?: number;
        svgOptions?: toSVGOptions;
    }
    export function toDataURL(paper: joint.dia.Paper, callback: (dataUrl: string) => void, options?: toDataURLOptions): void;
    export function fitRectKeepingAspectRatio(sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number): {
        width: number;
        height: number;
    };
    /**
     * Creates and returns a blob from a data URL (either base64 encoded or not).
     *
     * @param {string} dataURL The data URL to convert.
     * @return {Blob} A blob representing the array buffer data.
     */
    export function dataURLToBlob(dataURL: string): Blob;
    export function indexToHueInDegrees(index: number): number;
}
declare module "ontodia.diagram.view" {
    import * as d3 from 'd3';
    import * as Backbone from 'backbone';
    import { ElementModel, LocalizedString, ClassModel } from "ontodia.data.model";
    import { Element } from "ontodia.diagram.elements";
    import { DiagramModel } from "ontodia.diagram.model";
    import { toDataURLOptions } from "ontodia.viewUtils.toSvg";
    // import '../ontodia.css';
    /**
     * Properties:
     *     language: string
     *     elementWithHalo: Element - current element with Halo; if multiple elements selected then null
     */
    export class DiagramView extends Backbone.Model {
        model: DiagramModel;
        private paper;
        private paperScroller;
        private halo;
        private selectionView;
        private commandManager;
        private $svg;
        private $documentBody;
        private indicator;
        private colors;
        dragAndDropElements: {
            [id: string]: Element;
        };
        private toSVGOptions;
        constructor(model: DiagramModel, rootElement: HTMLElement);
        getLanguage(): string;
        setLanguage(value: string): void;
        getElementWithHalo(): Element;
        undo(): void;
        redo(): void;
        initBatchCommand(): void;
        storeBatchCommand(): void;
        print(): void;
        exportSVG(): Promise<string>;
        exportPNG(options?: toDataURLOptions): Promise<string>;
        zoomIn(): void;
        zoomOut(): void;
        zoomToFit(): void;
        showIndicator(operation?: Promise<any>): void;
        private setupTextSelectionPrevention();
        private preventTextSelection();
        private configureScroller(rootElement);
        private configureHalo();
        private renderHalo(cellView);
        private configureSelection();
        private configureCommandManager();
        private configureSnaplines();
        private enableDragAndDropSupport();
        private getDragAndDropElement(elementId);
        getLocalizedText(texts: LocalizedString[]): LocalizedString;
        getElementTypeString(elementModel: ElementModel): string;
        getElementTypeLabel(type: ClassModel): LocalizedString;
        getLinkLabel(linkTypeId: string): LocalizedString;
        getElementColor(elementModel: ElementModel): d3.Hcl;
        getRandomPositionInViewport(): {
            x: number;
            y: number;
        };
        private getCanvasPageOffset();
    }
    export default DiagramView;
}
declare module "ontodia.diagram.elementViews" {
    import * as joint from 'jointjs';
    import { Element, Link, FatLinkType } from "ontodia.diagram.elements";
    export class UIElementView extends joint.dia.ElementView {
        model: Element;
        private view;
        private name;
        private label;
        private pair;
        private uiList;
        private expander;
        private box;
        private table;
        private properties;
        initialize(): void;
        render(): UIElementView;
        private setView(view);
        private createUI();
        private layoutUI();
        private updateUI();
        private updateUIList();
        private updateProperties();
    }
    export class LinkView extends joint.dia.LinkView {
        model: Link;
        private view;
        initialize(): void;
        render(): LinkView;
        getTypeModel(): FatLinkType;
        private setView(view);
        private updateLabel();
    }
}
declare module "resizable-items" {
    export function resizeItem(): JQuery;
}
declare module "resizable-panels" {
    export function resizePanel(): JQuery;
    export function setPanelHeight(): void;
}
declare module "ontodia.viewUtils.collectionView" {
    import * as Backbone from 'backbone';
    export interface CollectionViewOptions<TModel extends Backbone.Model> extends Backbone.ViewOptions<TModel> {
        childView: any;
        childOptions: Backbone.ViewOptions<TModel>;
    }
    export class CollectionView<TModel extends Backbone.Model> extends Backbone.View<TModel> {
        private childView;
        private childOptions;
        private childViews;
        private isRendered;
        constructor(options: CollectionViewOptions<TModel>);
        private onAdd(model);
        private onRemove(model);
        private onReset();
        render(): CollectionView<TModel>;
    }
    export default CollectionView;
    export function removeAllViews<TModel extends Backbone.Model>(views: Backbone.View<TModel>[]): void;
}
declare module "ontodia.widgets.filterModel" {
    import { Element } from "ontodia.diagram.elements";
    import { DiagramModel } from "ontodia.diagram.model";
    export class FilterCriterion extends Backbone.Model {
        static instanceOf(typeId: string): FilterCriterion;
        static containsText(text: string): FilterCriterion;
        static connectedTo(elementId: string): FilterCriterion;
        static connectedToByLinkType(elementId: string, linkTypeId: string): FilterCriterion;
    }
    /**
     * Model of filter component.
     *
     * Properties:
     *     language: string - language code (e.g. 'en', 'ru', ...)
     *     moreItemsAvailable: boolean
     *
     * Events:
     *     state:beginQuery
     *     state:endQuery
     *     state:queryError
     */
    export class FilterModel extends Backbone.Model {
        diagram: DiagramModel;
        criteria: Backbone.Collection<FilterCriterion>;
        items: Backbone.Collection<Element>;
        private currentRequest;
        constructor(diagram: DiagramModel);
        filterByType(typeId: string): void;
        filterByLinkedElement(elementId: string): void;
        filterByLinkedElementAndLinkType(elementId: string, linkTypeId: string): void;
        private createRequest();
        queryItems(loadMoreItems?: boolean): void;
        private processFilterData(elements);
    }
    export default FilterModel;
}
declare module "ontodia.widgets.filter" {
    import { FilterCriterion, FilterModel } from "ontodia.widgets.filterModel";
    import DiagramView from "ontodia.diagram.view";
    export { FilterCriterion, FilterModel };
    export interface BaseFilterOptions<TModel extends Backbone.Model> extends Backbone.ViewOptions<TModel> {
        view: DiagramView;
    }
    export interface FilterElementOptions<TModel extends Backbone.Model> extends BaseFilterOptions<TModel> {
        filterView: FilterView;
    }
    export class FilterView extends Backbone.View<FilterModel> {
        private elementViews;
        private criteriaViews;
        private $progress;
        private $filterCriteria;
        private $filterText;
        private $loadMoreButton;
        private isRendered;
        view: DiagramView;
        constructor(options: BaseFilterOptions<FilterModel>);
        private onLanguageChanged();
        private onCriteriaChanged();
        private updateLoadMoreButtonState();
        render(): FilterView;
        private setFilterText(text);
        private renderCriteria();
    }
    export default FilterView;
}
declare module "ontodia.widgets.linksToolboxModel" {
    import { FatLinkType } from "ontodia.diagram.elements";
    import DiagramModel from "ontodia.diagram.model";
    /**
     * Model of 'connections' component.
     *
     * Properties:
     *     selectedElement: Element
     *
     * Events:
     *     state:beginQuery
     *     state:endQuery
     *     state:queryError
     */
    export class LinkTypesToolboxModel extends Backbone.Model {
        diagram: DiagramModel;
        links: {
            [id: string]: FatLinkType;
        };
        connectionsOfSelectedElement: {
            [linkTypeId: string]: number;
        };
        private currentRequest;
        constructor(diagram: DiagramModel);
        private onSelectedElementChanged(self, element);
    }
    export default LinkTypesToolboxModel;
}
declare module "ontodia.widgets.linksToolbox" {
    import LinkTypesToolboxModel from "ontodia.widgets.linksToolboxModel";
    import { FatLinkType } from "ontodia.diagram.elements";
    import DiagramView from "ontodia.diagram.view";
    export { LinkTypesToolboxModel };
    export interface LinkInToolBoxOptions extends Backbone.ViewOptions<any> {
        view: DiagramView;
    }
    /**
     * Events:
     *     filter-click(link: FatLinkType) - when filter button clicked
     */
    export class LinkInToolBox extends Backbone.View<FatLinkType> {
        private view;
        private $buttons;
        private $span;
        private $linkCountBadge;
        private $filterButton;
        connectedElementCount: number;
        constructor(options: LinkInToolBoxOptions);
        getLinkState(): string;
        setLinkState(state: string, options?: {
            isFromHandler?: boolean;
        }): void;
        render(): LinkInToolBox;
        private updateText();
        updateLinkCount(): void;
        private onChangeLinkState(model, value, options?);
    }
    export interface LinkTypesToolboxOptions extends Backbone.ViewOptions<LinkTypesToolboxModel> {
        view: DiagramView;
    }
    export class LinkTypesToolbox extends Backbone.View<LinkTypesToolboxModel> {
        private view;
        private $caption;
        private $label;
        private $allLinksList;
        private $connectedLinksList;
        private $notConnectedLinksList;
        private $connectedElementLabel;
        private views;
        constructor(options: LinkTypesToolboxOptions);
        private getLinksState();
        render(): LinkTypesToolbox;
        private updateGroupingOfLinkTypes();
        private orderedViews(views);
    }
    export default LinkTypesToolbox;
}
declare module "ontodia.widgets.classTree" {
    import FilterModel from "ontodia.widgets.filterModel";
    import { BaseFilterOptions } from "ontodia.widgets.filter";
    import 'jstree';
    import 'jstree/dist/themes/default/style.css';
    export class ClassTree extends Backbone.View<FilterModel> {
        private filter;
        private tree;
        private rest;
        private view;
        constructor(options: BaseFilterOptions<FilterModel>);
        updateLinks(): void;
        updateClassLabels(roots: any): void;
        getJSTree(): JQuery;
        private onLanguageChanged();
        private setUrls(tree);
        private setUrlsRec(root);
        render(): ClassTree;
    }
    export default ClassTree;
}
declare module "ontodia-workspace-component" {
    import * as React from 'react';
    export interface Props {
        isViewOnly?: boolean;
    }
    export class OntodiaWorkspaceComponent extends React.Component<Props, {}> {
        render(): JSX.Element;
    }
}
declare module "ontodia.views.editor.toolbar" {
    import * as React from 'react';
    export interface Props {
        onUndo: () => void;
        onRedo: () => void;
        onZoomIn: () => void;
        onZoomOut: () => void;
        onZoomToFit: () => void;
        onPrint: () => void;
        onExportSVG: (link: HTMLAnchorElement) => void;
        onExportPNG: (link: HTMLAnchorElement) => void;
        onShare: () => void;
        onSaveDiagram: () => void;
        onForceLayout: () => void;
        onChangeLanguage: (value: string) => void;
        onShowTutorial: () => void;
        onEditAtMainSite: () => void;
        isViewOnly?: boolean;
    }
    export interface State {
        showModal: boolean;
    }
    export class EditorToolbar extends React.Component<Props, State> {
        private downloadImageLink;
        constructor(props: Props);
        private onChangeLanguage;
        private onExportSVG;
        private onExportPNG;
        render(): JSX.Element;
    }
    export default EditorToolbar;
}
declare module "ontodia.views.editor.tutorial" {
    import 'intro.js/introjs.css';
    export function showTutorial(): void;
    export function showTutorialIfNotSeen(): void;
}
declare module "ontodia" {
    import DiagramModel from "ontodia.diagram.model";
    import DiagramView from "ontodia.diagram.view";
    export interface Params {
        container: HTMLElement;
        onSaveDiagram?: () => void;
        onShareDiagram?: () => void;
        onEditAtMainSite?: () => void;
        isViewOnly?: boolean;
        hideTutorial?: boolean;
    }
    export default class OntodiaWorkspace {
        private model;
        private diagram;
        private rootElement;
        private filter;
        private tree;
        private isViewOnly;
        constructor(params: Params);
        getModel(): DiagramModel;
        getDiagram(): DiagramView;
        forceLayout(): void;
        private onExportSvg(link);
        private onExportPng(link);
    }
}
