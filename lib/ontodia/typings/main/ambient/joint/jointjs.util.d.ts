declare module joint {
    function V(element: SVGElement): V;
    
    interface V {
        node: SVGAElement;
        attr(name: string): string;
        attr(name: string, value: string): void;
        attr(attrs: {}): void;
        scale(): {sx: number; sy: number;}
        bbox(withoutTransformations?: boolean, target?: Element): g.rect;
    }
    
    module g {
        function point(x: number, y: number): point;
        function point(p: {x: number; y: number;}): point;
        interface point {
            x: number;
            y: number;
        }
        
        function rect(x: number, y: number, w: number, h: number): rect;
        interface rect {
            x: number;
            y: number;
            width: number;
            height: number;
            toString(): string;
            origin(): point;
            corner(): point;
            topRight(): point;
            bottomLeft(): point;
            center(): point;
            intersect(r: rect): boolean;
            /// @return 'left' | 'right' | 'top' | 'bottom'
            sideNearestToPoint(p: point): string;
            containsPoint(p: point): boolean;
            containsRect(r: rect): boolean;
            pointNearestToPoint(p: point): point;
            intersectionWithLineFromCenterToPoint(p: point, angle: number): point;
            moveAndExpand(r: rect): rect;
            round(decimals: number): rect;
            normalize(): rect;
            bbox(angle: number): rect;
        }
    }

    namespace util {
        function normalizeEvent(params: any): any;
    }
}
