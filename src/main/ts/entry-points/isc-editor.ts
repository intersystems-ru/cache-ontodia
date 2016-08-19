import { EditorController, getUrlParams } from '../views/editor/isc-controller';

import 'expose?jQuery!jquery';


$(() => {
    const controller = new EditorController({
        serverUrl: '',
        rootElement: document.getElementById('chart'),
        urlParams: getUrlParams(window.location.search || window.location.hash),
    });
    controller.init().then(result => {
        if (result.initialized) {
            const hiddenUrlKeys = ['diagramId', 'dataSourceId', 'sharedDiagram', 'sharedDataSource', 'token'];
            for (const key of hiddenUrlKeys) { delete controller.urlParams[key]; }
            controller.newDiagram();
        }
    });
});
