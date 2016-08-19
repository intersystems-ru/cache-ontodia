import {
    Dictionary, LocalizedString, Property, ElementModel, LinkModel,
    LinkCount, LinkType, ClassModel
} from 'ontodia/src/ontodia/data/model';

interface RpcRequest {
    requestId?: string;
}

interface RpcResponse {
    requestId: string;
}

export interface DiagramDataResult extends RpcResponse {
    dataSourceId: string;
    elements: { [id: string]: ElementModel };
    rootElements: ClassModel[];
    links: LinkModel[];
    linkTypes: LinkType[];
    diagramTitle: { values: LocalizedString[] };
    dataSourceTitle: { values: LocalizedString[] };
}

export interface ClassTreeResponse extends RpcResponse {
    rootElements: ClassModel[];
}

export interface LinkTypesResponse extends RpcResponse {
    linkTypes: LinkType[];
}

export interface ElementsInfoRequest extends RpcRequest {
    dataSourceId: string;
    elementIds: string[];
}

export interface AccessControlListResponse {
    acList: AccessControlEntry[];
    currentUser: AccessControlEntry;
}

export interface AccessControlEntry {
    userId: string;
    userName: string;
    role: number;
}

export interface ElementsResponse extends RpcResponse {
    elements: { [id: string]: ElementModel }
}

export interface SharedDSDataRequest {
    shareKey?: string;
    accessToken?: string;
    params: {[id: string]: string};
}

export interface SparqlQueryResponse extends RpcResponse {
    elements: { [id: string]: ElementModel }
    links: LinkModel[];
}

export interface LinksInfoRequest extends RpcRequest {
    dataSourceId: string;
    elementIds: string[];
    linkTypeIds: string[];
}

export interface LinksResponse extends RpcResponse {
    links: LinkModel[];
}

export interface DataSourceTitleResponse extends RpcResponse {
    title: { values: LocalizedString[] };
}

export interface DiagramLayoutResponse {
    id: string;
    title: { values: LocalizedString[] };
    dataSourceId: string;
    layoutData: string;
    accessRole: string;
    linkSettings?: string;
}

export interface SharedDiagramLayoutResponse {
    shareKey: string;
    diagramId: string;
    dataSourceId: string;
    title: { values: LocalizedString[] };
    layoutData: string;
    linkSettings?: string;
}

export interface StoreDiagramRequest {
    id: string;
    title: { values: LocalizedString[] };
    dataSourceId: string;
    layoutData: string;
    linkSettings: string;
    thumbnailDataUri?: string;
    externalWidgetId?: string;
}

export interface ErrorResponse extends RpcResponse {
    errorKind: string;
    topic: string;
    displayMessage: string;
    internalDetails: string;
}

export interface LinkSettings {
    linkTypes: {
        id: string;
        visible: boolean;
        showLabel?: boolean;
    }[]
}

export interface StoreDiagramResponse {
    diagramId: string;
}

export interface ShareByLinkResponse {
    shareKey: string;
}

export interface FilterRequest extends RpcRequest {
    dataSourceId: string;
    elementTypeId?: string;
    text?: string;
    refElementId?: string;
    refElementLinkId?: string;
    limit: number;
    offset: number;
    languageCode: string;
}

export interface FilterResponse extends RpcResponse {
    elements: { [id: string]: ElementModel }
}

export interface ElementLinkTypesRequest extends RpcRequest {
    elementId: string;
    dataSourceId: string;
}

export interface ElementLinkTypesResponse extends RpcResponse {
    linkTypes: {
        id: string;
        count: number;
    }[];
}

export interface SavedDiagramsResponse {
    diagrams: DashboardDiagramInfo[]
}

export interface DashboardDiagramInfo {
    diagramId: string;
    dataSourceId: string;
    title: { values: LocalizedString[] };
    owner: string;
    currentUserOwnerOrEditor: boolean;
    roleForCurrentUser: string;
}

export interface DiagramDataSourcesResponse {
    dataSources: DashboardDataSourceInfo[];
}

export interface DashboardDataSourceInfo {
    title: { values: LocalizedString[] };
    id: string;
    owner: string;
    currentUserOwnerOrEditor: boolean;
    updatable: boolean;
    roleForCurrentUser: string;
}

export interface UpdateDataSourceRequest {
    dataSourceInfo: DataSourceInfo;
    copyId?: string;
}

export interface DataSourceInfo {
    id?: string;
    title: {values: LocalizedString[]};
    elementsCondition: string;
    linkTypes: string[];
    dataSourceType: 'SPARQL_ENDPOINT' | 'FILE' | 'WEB_PROTEGE' | 'GIT_PROJECT';
    sparqlEndpoint: string;
    sparqlUser: string;
    sparqlPassword: string;
    fileNames: string[];
    fileIds: string[];
    projectUrl: string;
    gitUrls: string[];
    autoUpdate: boolean;
}
