declare module 'waypoints' {
    class Waypoint {
		constructor(options: WaypointOptions);
		destroy(): Waypoint;
		disable(): Waypoint;
		enable(): Waypoint;
		next(): Waypoint;
		previous(): Waypoint;
		static destroyAll(): void;
		static disableAll(): void;
		static enableAll(): void;
		static refreshAll(): void;
		static viewportHeight(): number;
		static viewportWidth(): number;
	}
	
	interface WaypointOptions {
		element: Element;
		handler: (direction) => void;
		offset?: string|number;
		group?: string;
		context?: Element;
		continuous?: boolean;
		enabled?: boolean;
		horizontal?: boolean;
	}
	
	interface WaypointHandlerProperties {
		adapter: any;
		context: Context;
		element: Element;
		options: WaypointOptions;
		triggerPoint: number;
	}
	
	class Context {
		adapter: any;
		element: Element;
		waypoints: {
			horizontal: {[waypointId: string]: Waypoint};
			vertical: {[waypointId: string]: Waypoint};
		};
		destroy(): void;
		refresh(): void;
		static findByElement(element: Element): Context;
	}
	
	class Group {
		axis: string;
		name: string;
		waypoints: Waypoint[];
		first(): Waypoint;
		last(): Waypoint;
	}
}