interface ISubscription {
  unsubscribe: () => void;
}

interface IEventBus<S = any, P = any, R = any> {
  subscribe(subscriber: S): ISubscription;
  unsubscribe(subscriber: S): void;
  next(data: P): Promise<R>;
}

interface IAsyncEventBusSubscriber<T extends CallableFunction> {
  priority: number;
  callback: T;
}

export { IEventBus, ISubscription, IAsyncEventBusSubscriber };
