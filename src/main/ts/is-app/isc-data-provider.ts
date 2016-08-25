import { DataProvider } from 'ontodia/src/ontodia/data/provider';
import { ClassModel, LinkType } from 'ontodia/src/ontodia/data/model';

import ISCacheMessaging from './isc-messaging';

export class ISCacheDataProvider implements DataProvider {
    constructor(
        private messaging: ISCacheMessaging,
        public dataSourceId: string,
        private preloaded?: {
            classTree?: ClassModel[],
            linkTypes?: LinkType[],
        }
    ) {}

    classTree() {
        if (this.preloaded && this.preloaded.classTree) {
            return new Promise<ClassModel[]>(
                resolve => resolve(this.preloaded.classTree));
        }
        return this.messaging.classTree.call({dataSourceId: this.dataSourceId})
            .then(response => {
                return response.rootElements;
            });
    }

    linkTypes() {
        if (this.preloaded && this.preloaded.linkTypes) {
            return new Promise<LinkType[]>(
                resolve => resolve(this.preloaded.linkTypes));
        }
        return this.messaging.linkTypes
            .call({dataSourceId: this.dataSourceId})
            .then(response => {
                return response.linkTypes;
            });
    }

    elementInfo(params: { elementIds: string[]; }) {
        return this.messaging.elementsInfo.call({
            dataSourceId: this.dataSourceId,
            elementIds: params.elementIds,
        }).then(response => {
            return response.elements;
        });
    }

    linksInfo(params: {
        elementIds: string[];
        linkTypeIds: string[];
    }) {
        return this.messaging.linksInfo.call({
            dataSourceId: this.dataSourceId,
            elementIds: params.elementIds,
            linkTypeIds: params.linkTypeIds,
        }).then(response => {
            return response.links;
        });
    }

    linkTypesOf(params: { elementId: string; }) {
        return this.messaging.linkTypesOf.call({
            dataSourceId: this.dataSourceId,
            elementId: params.elementId,
        }).then(response => {
            return response.linkTypes;
        });
    }

    filter(params: {
        elementTypeId?: string;
        text?: string;
        refElementId?: string;
        refElementLinkId?: string;
        limit: number;
        offset: number;
        languageCode: string;
    }) {
        return this.messaging.filter.call({
            dataSourceId: this.dataSourceId,
            elementTypeId: params.elementTypeId,
            text: params.text,
            refElementId: params.refElementId,
            refElementLinkId: params.refElementLinkId,
            limit: params.limit,
            offset: params.offset,
            languageCode: params.languageCode,
        }).then(response => {
            return response.elements;
        });
    }
}

export default ISCacheDataProvider;
