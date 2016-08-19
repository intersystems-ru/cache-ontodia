import * as Backbone from 'backbone';

import { LocalizedString } from 'ontodia/src/ontodia/data/model';
import * as Messages from './server';

import * as Messaging from './imessaging';
import MiddleModel from './isc-middle-model';

export class SubscribableTopic<TResponse> {
      constructor(protected messaging: ISCacheMessaging,
                  public    subscriptionTopic: string) {}

      subscribe(
          successHandler: (response: TResponse) => void,
          errorHandler?: (error: Messages.ErrorResponse) => void): Messaging.TopicSubscription {
          let subscription = this.messaging.subscribeJsonHandler(this.subscriptionTopic, successHandler);
          subscription.errorHandler = errorHandler;
          return subscription;
      }
}

export class HttpTopic<TRequest, TResponse> extends SubscribableTopic<TResponse> {
    constructor(
        messaging: ISCacheMessaging,
        public topic: string) {
            super(messaging, topic);
    }

    request(request: TRequest): void {
        this.messaging.sendJson(this.topic, request);
    }

    call(request: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!request.requestId) {
                request.requestId = _.uniqueId('request_');
            }
            this.messaging.sendJson(this.topic, request).then(data => resolve(data));
        });
    }
}

export class HttpSubscription implements Messaging.TopicSubscription {
    errorHandler: (error: Messages.ErrorResponse) => void;
    constructor(public id: number,
                public topic: string,
                public successHandler: ((response: any) => void),
                private onUnsubscribe: (topic: string, id: number) => void,
                errorHandler?: (error: Messages.ErrorResponse) => void) {
                    if (errorHandler) {
                        this.errorHandler = errorHandler;
                    }
                }
    unsubscribe() {
        this.onUnsubscribe(this.topic, this.id);
    }
}

export class HttpSocket {
    private topics: {[name: string]: HttpSubscription[]};
    constructor(private model: MiddleModel) {
        this.topics = {};
    };

    public getHandlers(topic: string): HttpSubscription[] {
        if (
            this.topics[topic]) { return this.topics[topic];
        } else {
            return null;
        }
    }

    public subscribe(topic: string, handler: (response: any) => void): Messaging.TopicSubscription {
        if (!this.topics[topic]) {
            this.topics[topic] = [];
        }
        let subscription = new HttpSubscription(this.topics[topic].length, topic, handler, this.unsubscribe);
        this.topics[topic].push(subscription);
        return subscription;
    }

    public unsubscribe(topic: string, id: number) {

        if (!topic || !this.topics || !this.topics[topic] || this.topics[topic].length <= id || id < 0) { return; }

        this.topics[topic].splice(id, 1);
    }

    public send(topic: string,
                request: any): Promise<any> {
        return new Promise((resolve, reject) => {
            let self = this;
            let onSuccess = data => {
                if (topic &&
                    this.topics &&
                    this.topics[topic] &&
                    this.topics[topic].length !== 0) {
                    for (let i = 0; i < self.topics[topic].length; i++) {
                        self.topics[topic][i].successHandler(data);
                    }
                }
                resolve(data);
            };

            let onError = data => {
                if (topic &&
                    this.topics &&
                    this.topics[topic] &&
                    this.topics[topic].length !== 0) {
                    for (let i = 0; i < self.topics[topic].length; i++) {
                        self.topics[topic][i].errorHandler(data);
                    }
                }
                reject(data);
            };
            this.model.sendRequest(topic, request, onSuccess, onError);
        });
    };
}

export default class ISCacheMessaging extends Backbone.Model {

    private socketImitator: HttpSocket;
    private headers: { [name: string]: string };

    private midleModel: MiddleModel;

    private subscriptions: { [topic: string]: Messaging.TopicSubscription[] } = {};

    diagramElements: HttpTopic<{diagramId: string}, Messages.ElementsResponse>;
    diagramLinks:    HttpTopic<{diagramId: string}, Messages.LinksResponse>;
    elementsInfo:    HttpTopic<Messages.ElementsInfoRequest, Messages.ElementsResponse>;
    sparqlQuery:     HttpTopic<{dataSourceId: string}, Messages.SparqlQueryResponse>;
    linksInfo:       HttpTopic<Messages.LinksInfoRequest, Messages.LinksResponse>;
    filter:          HttpTopic<Messages.FilterRequest, Messages.FilterResponse>;
    classTree:       HttpTopic<{dataSourceId: string}, Messages.ClassTreeResponse>;
    dsTitle:         HttpTopic<{dataSourceId: string}, { values: LocalizedString[] }>;
    linkTypes:       HttpTopic<{dataSourceId: string}, Messages.LinkTypesResponse>;
    linkTypesOf:     HttpTopic<Messages.ElementLinkTypesRequest, Messages.ElementLinkTypesResponse>;
    sharedData:      HttpTopic<{shareKey: string}, Messages.DiagramDataResult>;
    sharedDSData:    HttpTopic<Messages.SharedDSDataRequest, Messages.DiagramDataResult>;

    constructor(
        public serviceUrl: string,
        public namespace: string,
        public appId?: string) {
        super();
        this.set('state', 'none');

        this.headers = appId ? { 'X-External-App-ID': appId } : {};

        // Authorization
        this.headers['Authorization'] = 'Basic X1NZU1RFTTpFc2dJWFpHZ2FydnJNMGtGWlBGeQ==';
        this.headers['Content-Type'] = 'application/json';

        this.midleModel = new MiddleModel(this.serviceUrl, this.headers, (this.namespace ? this.namespace : 'SAMPLES'));

        this.diagramElements = new HttpTopic(this, 'diagrams_data_elements');
        this.diagramLinks    = new HttpTopic(this, 'diagrams_data_links');
        this.elementsInfo    = new HttpTopic(this, 'sources_data_elementsInfo');
        this.sparqlQuery     = new HttpTopic(this, 'sources_data_sparqlQuery');
        this.linksInfo       = new HttpTopic(this, 'sources_data_linksInfo');
        this.filter          = new HttpTopic(this, 'sources_data_filter');
        this.classTree       = new HttpTopic(this, 'sources_data_classes');
        this.dsTitle         = new HttpTopic(this, 'sources_data_dsTitle');
        this.linkTypes       = new HttpTopic(this, 'sources_data_linkTypes');
        this.linkTypesOf     = new HttpTopic(this, 'sources_data_linkTypesOf');
        this.sharedData      = new HttpTopic(this, 'shared_data');
        this.sharedDSData    = new HttpTopic(this, 'sharedDS_data');
    }

    private createConnection() {
        console.log('SocketImitator initialization...');
        this.socketImitator = new HttpSocket(this.midleModel);
    }

    public connect(callback) {
        this.createConnection();
        this.set('state', 'connecting');
        let self = this;
        this.midleModel.fetchModel(function(){
            self.set('state', 'connected');
            console.log('Data loading started...');
            self.subscriptions = {};
            self.trigger('resubscribe');
            self.trigger('readyToCommunicate');
            callback({ initialized: true });
        }, this.onError.bind(this));
    }

    private onError(frameOrMessage: any) {
        console.log('Fetching error: ' + JSON.stringify(frameOrMessage));
    }

    public whenReady(handler: () => void) {
        let state: string = this.get('state');
        if (state === 'connected') {
          handler();
        } else {
            if (state !== 'connecting') { throw new Error('Messaging is not connected or connecting.'); }
            this.listenToOnce(this, 'readyToCommunicate', handler);
        }
    }

    public subscribeJsonHandler(topic: string, handler: (response: any) => void): Messaging.TopicSubscription {
        let subscription = this.socketImitator.subscribe(topic, handler);
        if (!this.subscriptions[topic]) { this.subscriptions[topic] = []; }
        this.subscriptions[topic].push(subscription);
        return subscription;
    }

    public sendJson(topic: string, data: any): Promise<any> {
        return this.socketImitator.send(topic, data);
    }
}
