import { Element, Link, FatLinkType } from '../diagram/elements';
import DiagramModel from '../diagram/model';

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
    links: { [id: string]: FatLinkType };
    connectionsOfSelectedElement: { [linkTypeId: string]: number };

    private currentRequest: { elementId: string; };

    constructor(public diagram: DiagramModel) {
        super();
        this.links = diagram.linkTypes;
        this.listenTo(this, 'change:selectedElement', this.onSelectedElementChanged);
    }

    private onSelectedElementChanged(self, element: Element) {
        this.trigger('state:beginQuery');
        if (element) {
            const request = {elementId: element.id};
            this.currentRequest = request;
            this.diagram.dataProvider.linkTypesOf(request).then(linkTypes => {
                if (this.currentRequest !== request) { return; }
                this.connectionsOfSelectedElement = {};
                for (const linkType of linkTypes) {
                    this.connectionsOfSelectedElement[linkType.id] = linkType.count;
                }
                this.trigger('state:endQuery');
            }).catch(error => {
                if (this.currentRequest !== request) { return; }
                console.error(error);
                this.trigger('state:queryError');
            });
        } else {
            this.currentRequest = null;
            this.connectionsOfSelectedElement = null;
            this.trigger('state:endQuery');
        }
    }
}

export default LinkTypesToolboxModel;
