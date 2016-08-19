import { LocalizedString } from 'ontodia/src/ontodia/data/model';
import DiagramModel from 'ontodia/src/ontodia/diagram/model';

import Query from './query';

import ISCacheDataProvider from './isc-data-provider';
import ISCacheMessaging from './isc-messaging';
/**
 * Properties:
 *     diagramId: string
 *     title: LocalizedString[]
 *     dataSourceId: string
 *     dataSourceTitle: LocalizedString[]
 *     allowedToSave: boolean
 *
 * Events:
 *     action:share (string?: shareKey)
 */
export class DiagramEditor extends Backbone.Model {
    private dataProvider: ISCacheDataProvider;

    messaging: ISCacheMessaging;
    query: Query;
    diagram: DiagramModel;

    constructor(params: {
        messaging: ISCacheMessaging;
        query: Query;
        diagram: DiagramModel;
    }) {
        super();
        this.messaging = params.messaging;
        this.query = params.query;
        this.diagram = params.diagram;

        this.onDataLoadError = this.onDataLoadError.bind(this);
    }

    getDiagramId(): string { return this.get('diagramId'); }

    getTitle(): LocalizedString[] { return this.get('title'); }
    setTitle(value: LocalizedString[]) { this.set('title', value); }

    getDataSourceId() {
        return this.dataProvider ? this.dataProvider.dataSourceId : undefined;
    }

    getDsTitle(): LocalizedString[] { return this.get('dataSourceTitle'); }

    isAllowedToSave(): boolean { return this.get('allowedToSave'); }
    private setAllowedToSave(value: boolean) { this.set('allowedToSave', value); }

    initNewDiagram(dataSourceId: string): Promise<void> {
        this.setTitle([
            {text: 'Intersystems cache', lang: ''},
        ]);
        this.setAllowedToSave(true);
        this.dataProvider = new ISCacheDataProvider(this.messaging, dataSourceId);
        return Promise.all([
            this.diagram.createNewDiagram(this.dataProvider),
        ]).then(() => {});
    }

    private onDataLoadError(error: any) {
        this.diagram.trigger('state:loadError', error);
    }
}

export default DiagramEditor;
