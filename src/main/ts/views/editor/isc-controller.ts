import * as Backbone from 'backbone';

import Query from '../../is-app/query';
import DiagramEditor from '../../is-app/isc-diagram-editor';
import ISCacheMessaging from '../../is-app/isc-messaging';
import DiagramView from 'ontodia/src/ontodia/diagram/view';
import Ontodia from 'ontodia';

import 'jstree/dist/themes/default/style.css';
import 'intro.js/introjs.css';
import 'ontodia/style/ontodia.css';

export interface Params {
    serverUrl: string;
    rootElement: HTMLElement;
    urlParams: { [key: string]: string; };
    isViewOnly?: boolean;
}

export class EditorController extends Backbone.Model {
    rootElement: HTMLElement;
    urlParams: { [key: string]: string };
    editor: DiagramEditor;
    diagram: DiagramView;
    query: Query;

    messaging: ISCacheMessaging;

    workspace: Ontodia;

    public constructor(params: Params) {
        super();
        this.rootElement = params.rootElement;
        this.urlParams = params.urlParams;

        if (params.serverUrl[params.serverUrl.length - 1] !== '/') {
            params.serverUrl = params.serverUrl + '/';
        }
        this.query = new Query(params.serverUrl);
        this.messaging = new ISCacheMessaging(params.serverUrl, this.urlParams['namespace']);

        this.workspace = new Ontodia({
            container: document.getElementById('ontodia'),
        });
    }

    init(): Promise<{ initialized: boolean }> {
        return new Promise<{ initialized: boolean }>((resolve, reject) => {
            this.messaging.connect(result => {

                let query = this.query;
                let messaging = this.messaging;
                const model = this.workspace.getModel();
                this.editor = new DiagramEditor({
                    messaging, query,
                    diagram: model,
                });

                this.diagram = this.workspace.getDiagram();

                resolve(result);
            });
        });
    }

    newDiagram() {
        this.editor.initNewDiagram('Ontodia-Intersystems-cache'/*this.urlParams['dataUrl']*/);
    }
}

export default EditorController;

export function getUrlParams(url) {
    const re = /(?:\?|&|#?)([^=&#]+)(?:=?([^&#]*))/g;
    const decode = (s) => decodeURIComponent(s.replace(/\+/g, ' '));

    const params: { [key: string]: string } = {};
    let match: RegExpExecArray;

    while (match = re.exec(url)) {
        params[decode(match[1])] = decode(match[2]);
    }
    return params;
}
