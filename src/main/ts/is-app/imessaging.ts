import * as Backbone from 'backbone';
import * as Messages from './server';

export interface Resubscribable extends Backbone.Model {
    resubscribe();
}

export interface TopicSubscription {
    id: any;
    unsubscribe(): void;
    errorHandler?: (error: Messages.ErrorResponse) => void;
}

/**
 * Properties:
 *     state: one of ['none', 'connecting', 'connected', 'disconnected']
 *
 * Events:
 *     resubscribe
 *     readyToCommunicate
 */
export interface Messaging extends Resubscribable{
    connect();
    resubscribe();
    ensureSubscriptions(model: Resubscribable);
    whenReady(handler: () => void);
    subscribeJsonHandler(topic: string, handler: (response: any) => void): TopicSubscription;
    sendJson(topic: string, data: any);
}
