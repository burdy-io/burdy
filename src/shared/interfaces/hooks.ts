type IHookActionFunction<Args extends any[] = any[]> = (
  ...args: Args
) => Promise<void>;
type IHookFilterFunction<Args extends any[] = any[]> = (
  ...args: Args
) => Promise<Args[0]>;
type IHookFilterSyncFunction<Args extends any[] = any[]> = (
  ...args: Args
) => Args[0];

interface IHookFilter<Args extends any[] = any[]> {
  id: string;
  function: IHookFilterFunction<Args>;
  priority: number;
}

interface IHookFilterSync<Args extends any[] = any[]> {
  id: string;
  function: IHookFilterSyncFunction<Args>;
  priority: number;
}

interface IHookAction<Args extends any[] = any[]> {
  id: string;
  function: IHookActionFunction<Args[]>;
}

interface IHookCache {
  actions: {
    [key: string]: IHookAction[];
  };
  filters: {
    [key: string]: IHookFilter[];
  };
  syncFilters: {
    [key: string]: IHookFilterSync[];
  };
}

export {
  IHookActionFunction,
  IHookFilterFunction,
  IHookFilterSyncFunction,
  IHookFilterSync,
  IHookAction,
  IHookFilter,
  IHookCache,
};
