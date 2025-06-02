
// a copy of the PushSubscription type from web-push's lib.dom.d.ts
// we define it here to avoid adding a dependency on web-push in shared
export interface PushSubscription {
    endpoint: string;
    expirationTime?: null | number;
    keys: {
        p256dh: string;
        auth: string;
    };
}


// only used in backend
// note, if endpoint is "testing", the value is a boolean flag for testing purposes
export interface UserPushSubscriptions {
  [endpoint: string]: {
    subscription: PushSubscription;
    expiration: number; // timestamp in ms
  };
};
