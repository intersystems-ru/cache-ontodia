import * as Messages from './server';

export class Query {
    constructor(
        public serviceUrl: string,
        public appId?: string) {}

    private ajaxGet<T>(relativeUrl: string): Promise<T> {
        return this.ajax({
            type: 'GET',
            url: this.serviceUrl + relativeUrl,
            dataType: 'json',
        });
    }

    private ajax<T>(settings: JQueryAjaxSettings): Promise<T> {
        if (this.appId) {
            settings.headers = _.extend(settings.headers || {}, {
                'X-External-App-ID': this.appId,
            });
        }
        return new Promise((resolve, reject) => {
            settings.success = result => resolve(result);
            settings.error =
                (jqXHR: JQueryXHR, statusText: string, error: any) =>
                    reject(error || jqXHR);
            $.ajax(settings);
        });
    }

    loadDiagramLayout(savedDiagramId: string) {
        return this.ajaxGet<Messages.DiagramLayoutResponse>(
            'rest/diagrams/' + savedDiagramId + '/layout');
    }

    loadSharedLayout(shareKey: string) {
        return this.ajaxGet<Messages.DiagramLayoutResponse>(
            'rest/shared/' + shareKey + '/layout');
    }

    createLayoutData(request: Messages.StoreDiagramRequest) {
        return this.ajax<Messages.StoreDiagramResponse>({
            type: 'POST',
            url: this.serviceUrl + 'rest/diagrams/',
            data: JSON.stringify(request),
            contentType: 'application/json',
            dataType: 'json',
        });
    }

    updateLayoutData(request: Messages.StoreDiagramRequest) {
        return this.ajax<Messages.StoreDiagramResponse>({
            type: 'PUT',
            url: this.serviceUrl + 'rest/diagrams/' + request.id,
            data: JSON.stringify(request),
            contentType: 'application/json',
            dataType: 'json',
        });
    }

    loadDataSets() {
        return this.ajaxGet<Messages.DiagramDataSourcesResponse>('rest/sources');
    }

    loadDiagrams() {
        return this.ajaxGet<Messages.SavedDiagramsResponse>('rest/diagrams');
    }

    loadSampleData() {
        return this.ajaxGet<void>('loadSample');
    }

    createDataSet(request: Messages.UpdateDataSourceRequest) {
        return this.ajax<{id: string}>({
            type: 'POST',
            url: this.serviceUrl + 'rest/sources',
            data: JSON.stringify(request),
            contentType: 'application/json',
            dataType: 'json',
        });
    }

    saveDataSet(id: string, request: Messages.UpdateDataSourceRequest) {
        return this.ajax<{id: string}>({
            type: 'PUT',
            url: this.serviceUrl + 'rest/sources/' + id,
            data: JSON.stringify(request),
            contentType: 'application/json',
            dataType: 'json',
        });
    }

    deleteDataSet(id: string, safety: boolean) {
        return this.ajax<any>({
            type: 'DELETE',
            url: this.serviceUrl + 'rest/sources/' + id + '/' + safety,
            contentType: 'application/json',
        });
    }

    getDataSetAcl(dataSetId: string) {
        return this.ajaxGet<Messages.AccessControlListResponse>(
            'rest/sources/' + dataSetId + '/acl');
    }

    getDataSet(dsId: string) {
        return this.ajaxGet<any>('rest/sources/' + dsId);
    }

    getDiagramAcl(diagramId: string) {
        return this.ajaxGet<Messages.AccessControlListResponse>(
            'rest/diagrams/' + diagramId + '/acl');
    }

    deleteDiagram(diagramId: string) {
        return this.ajax<any>({
            type: 'DELETE',
            url: this.serviceUrl + 'rest/diagrams/' + diagramId,
            contentType: 'application/json',
        });
    }

    copyDiagram(diagramId: string, request: any) {
        return this.ajax<any>({
            type: 'POST',
            url: this.serviceUrl + 'rest/diagrams/' + diagramId + '/copy',
            data: JSON.stringify(request),
            contentType: 'application/json',
            dataType: 'json',
        });
    }

    shareDiagram(diagramId: string, shareRequest: any) {
        return this.ajax<any>({
            type: 'POST',
            url: this.serviceUrl + 'rest/diagrams/' + diagramId + '/share',
            data: JSON.stringify(shareRequest),
            contentType: 'application/json',
            dataType: 'json',
        });
    }

    shareDataSet(dsId: string, shareRequest: any) {
        return this.ajax<any>({
            type: 'POST',
            url: this.serviceUrl + 'rest/sources/' + dsId + '/share',
            data: JSON.stringify(shareRequest),
            contentType: 'application/json',
            dataType: 'json',
        });
    }

    cancelPublishDiagram(diagramId: string) {
        return this.ajax<void>({
            type: 'DELETE',
            url: this.serviceUrl + 'rest/shared/' + diagramId,
        });
    }

    cancelPublishDataSet(dsId: string) {
        return this.ajax<void>({
            type: 'DELETE',
            url: this.serviceUrl + 'rest/sharedDS/' + dsId,
        });
    }

    getShareDiagramLink(diagramId: string) {
        return this.ajax<any>({
            type: 'GET',
            url: this.serviceUrl + 'rest/shared/' + diagramId,
            dataType: 'json',
        });
    }

    getShareDataSetLink(dsId: string) {
        return this.ajax<any>({
            type: 'GET',
            url: this.serviceUrl + 'rest/sharedDS/' + dsId,
            dataType: 'json',
        });
    }

    publishDiagram(diagramId: string) {
        return this.ajax<any>({
            type: 'POST',
            url: this.serviceUrl + 'rest/shared/' + diagramId,
            dataType: 'json',
        });
    }

    publishDataSet(dsId: string) {
        return this.ajax<any>({
            type: 'POST',
            url: this.serviceUrl + 'rest/sharedDS/' + dsId,
            dataType: 'json',
        });
    }

    rdfRemoveFile(id: string) {
        return this.ajax<any>({
            type: 'DELETE',
            url: this.serviceUrl + 'rest/rdf/' + id,
        });
    }

    rdfRemoveAll() {
        return this.ajax<void>({
            type: 'DELETE',
            url: this.serviceUrl + 'rest/rdf',
        });
    }

    publicShareDiagram(diagramId: string) {
        return this.ajax<Messages.ShareByLinkResponse>({
            type: 'POST',
            url: this.serviceUrl + 'rest/shared/' + diagramId,
            dataType: 'json',
        });
    }

    isUserAuthenticated() {
        return this.ajaxGet<boolean>('rest/user/authenticated');
    }
}

export default Query;
