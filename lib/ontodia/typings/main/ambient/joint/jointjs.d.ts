// Type definitions for Joint JS 0.6
// Project: http://www.jointjs.com/
// Definitions by: Aidan Reel <http://github.com/areel>, David Durman <http://github.com/DavidDurman>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/// <reference path="../backbone/index.d.ts" />
/// <reference path="jointjs.util.d.ts" />

declare module joint {

    module dia {

        interface IElementSize {
            width: number;
            height: number;
        }

        /**
         * The model holding all the cells (elements and links) of the diagram.
         * The collection of all the cells is stored in the property cells.
         */
        class Graph extends Backbone.Model {
            initialize();
            fromJSON(json: any);
            clear();
            /**
             * Add a new cell to the graph. If cell is an array, all the cells in the array will be added to the graph.
             */
            addCell(cell: Cell, options?: any);
            /**
             * Add new cells to the graph. This is just a syntactic sugar to the addCell method.
             * Calling addCell with an array of cells is an equivalent to calling addCells.
             */
            addCells(cells: Cell[], options?: any);
            getConnectedLinks(cell: Cell, options?: any): Link[];
            disconnectLinks(cell: Cell);
            removeLinks(cell: Cell[]);
            getElements(): Element[];
            getLinks(): Link[];
            /**
             * Reset cells in the graph. Update all the cells in the graph in one bulk.
             * This is a more efficient method of adding cells to the graph if you you want to
             * replace all the cells in one go.
             * @param cells
             * @param options optionally contain additional data that is passed over to
             *        the event listeners of the graph reset event
             */
            resetCells(cells: Cell[], options?: any);
        }

        class Cell extends Backbone.Model {
            toJSON();
            remove(options?: any);
            toFront();
            toBack();
            embed(cell: Cell);
            unembed(cell: Cell);
            getEmbeddedCells(): Cell[];
            clone(opt?: any): Backbone.Model;      // @todo: return can either be Cell or Cell[].
            attr(attrs: any): Cell;
            attr(path: string, value: any);
        }

        class Element extends Cell {
            position(x: number, y: number): Element;
            translate(tx: number, ty?: number): Element;
            resize(width: number, height: number): Element;
            rotate(angle: number, absolute): Element;
        }

        class Link extends Cell {
            defaults(): any;
            disconnect(): Link;
            label(idx?: number, value?: any): any;   // @todo: returns either a label under idx or Link if both idx and value were passed
        }

        interface IOptions {
            width: number;
            height: number;
            gridSize: number;
            perpendicularLinks: boolean;
            elementView: ElementView;
            linkView: LinkView;
            origin: {x: number; y: number}
        }
        interface PaperFitToContentOptions {
            gridWidth?: number;
            gridHeight?: number;
            padding?: number | {top: number; right: number; bottom: number; left: number;}
            allowNewOrigin?: string; // one of ['negative'|'positive'|'any']
            minWidth?: number;
            minHeight?: number;
            maxWidth?: number;
            maxHeight?: number;
        }
        interface PaperScaleToFitOptions {
            padding?: number;
            preserveAspectRatio?: boolean;
            minScale?: number;
            maxScale?: number;
            minScaleX?: number;
            minScaleY?: number;
            maxScaleX?: number;
            maxScaleY?: number;
            scaleGrid?: number;
            fittingBBox?: {x?: number; y?: number; width?: number; height?: number;}
        }
        interface PaperOptions extends Backbone.ViewOptions<Backbone.Model> {
            gridSize?: number;
            elementView?: typeof ElementView;
            linkView?: typeof LinkView;
            width?: number;
            height?: number;
            async?: boolean;
        }
        class Paper extends Backbone.View<Backbone.Model> {
            constructor(options?: PaperOptions);
            options: IOptions;
            svg: SVGElement;
            viewport: SVGGElement;
            setDimensions(width: number, height: number);
            scale(sx: number, sy?: number, ox?: number, oy?: number): Paper;
            rotate(deg: number, ox?: number, oy?: number): Paper;      // @todo not released yet though it's in the source code already
            findView(el: any): CellView;
            findViewByModel(modelOrId: any): CellView;
            findViewsFromPoint(p: { x: number; y: number; }): CellView[];
            findViewsInArea(r: { x: number; y: number; width: number; height: number; }): CellView[];
            fitToContent(opt?: PaperFitToContentOptions);
            snapToGrid(p): { x: number; y: number; };
            scaleContentToFit(opt?: PaperScaleToFitOptions);
            toPNG(callback: (string) => void);
            toSVG(callback: (string) => void);
            openAsSVG();
            print();
            getContentBBox(): g.rect;
            setOrigin(x: number, y: number);
        }

        class ElementView extends CellView  {
            scale(sx: number, sy: number);
            resize();
            update(cell?: any, renderingOnlyAttrs?: any);
        }

        class CellView extends Backbone.View<Cell> {
            getBBox(): { x: number; y: number; width: number; height: number; };
            highlight(el?: any);
            unhighlight(el?: any);
            findMagnet(el: any);
            getSelector(el: any);
        }

        class LinkView extends CellView {
            getConnectionLength(): number;
            getPointAtLength(length: number): { x: number; y: number; };
        }
    }

    module ui {
        class PaperScroller extends Backbone.View<Backbone.Model> {
            startPanning(evt): void;
            zoom(size: any, opts: any);
            zoomToFit(params: any);
            toLocalPoint(x: number, y: number): {x: number; y: number};
            center();
            adjustPaper(): void;
        }
    }

    module shapes {
        module basic {
            class Generic extends joint.dia.Element { }
            class Rect extends Generic { }
            class Text extends Generic { }
            class Circle extends Generic { }
            class Image extends Generic { }
        }
    }

    module util {
        function uuid(): string;
        function guid(obj: any): string;
        function mixin(objects: any[]): any;
        function supplement(objects: any[]): any;
        function deepMixin(objects: any[]): any;
        function deepSupplement(objects: any, defaultIndicator?: any): any;
        function imageToDataUri(url: string, callback: (error: Error, dataUri: string) => void): void;
    }

}

declare module 'jointjs' {
	export = joint;
}
