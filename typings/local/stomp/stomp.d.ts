declare module Stomp {
    interface Client {
        /**
         * Heartbeat delays in milliseconds.
         */
        heartbeat: {
            outgoing: number;
            incoming: number;
        };
        maxWebSocketFrameSize: number;
        debug: (message: string) => void;
        connect(
            options: ConnectOptions,
            connectCallback: (frame: Frame) => void,
            errorCallback?: (frameOrMessage: any) => void);
        connect(
            login: string,
            passcode: string,
            connectCallback: (frame: Frame) => void,
            errorCallback?: (frameOrMessage: any) => void,
            host?: any);
        subscribe(topic: string, callback: (frame: Frame) => void, options?: any): Subscription;
        unsubscribe(id: any);
        send(topic: string, headers: {[name: string]: string}, data: string);
        begin(transactionId: string): Transaction;
        commit(transactionId: string);
        abort(transactionId: string);
        disconnect(callback: () => void);
    }

    interface ConnectOptions {
        login?: string;
        passcode?: string;
        host?: any;
    }

    interface Subscription {
        id: any;
        unsubscribe(): void;
    }

    interface Frame {
        command: string;
        headers: {
            destination: string;
            server: string;
            subscription: string;
        }
        body: string;
        toString(): string;
    }

    interface Transaction {
        id: string;
        commit();
        abort();
    }

    function over(any): Client;
}
