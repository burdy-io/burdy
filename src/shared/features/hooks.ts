import async from 'async';
import md5Hex from '../md5';
import {
  IHookAction,
  IHookActionFunction,
  IHookCache,
  IHookFilter,
  IHookFilterFunction,
  IHookFilterSync,
  IHookFilterSyncFunction,
} from '../interfaces/hooks';

const hookCache: IHookCache = { actions: {}, filters: {}, syncFilters: {} };

const getQueue = <T = IHookAction | IHookFilter>(
  type: keyof IHookCache,
  key: string
) => {
  if (!Array.isArray(hookCache?.[type]?.[key])) {
    hookCache[type][key] = [];
  }

  return hookCache[type][key] as unknown as T[];
};

interface HookOptions {
  priority?: number;
  id?: string;
}

const uniqueHookGuard = (queue: (IHookAction | IHookFilter)[], id: string) => {
  const exists = queue.some((hook) => hook.id === id);
  if (exists) {
    const message = `Given function id ${id}, already exists. Ensure that you aren't registering hook twice.`;
    console.error(message);

    // Module hot breaks if error is thrown in top context
    if (!module?.hot) {
      throw new Error('duplicate_hook');
    }
  }
};

const Hooks = {
  addAction: <T extends keyof Burdy.IActions | string>(
    key: T,
    action: IHookActionFunction<Burdy.IActions[T]>,
    options: Omit<HookOptions, 'priority'> = {}
  ) => {
    const id = options?.id ?? md5Hex(action.toString());

    const queue = getQueue<IHookAction>('actions', key as string);
    uniqueHookGuard(queue, id);
    queue.push({ function: action, id });
  },
  addFilter: <T extends keyof Burdy.IFilters>(
    key: T,
    filter: IHookFilterFunction<Burdy.IFilters[T]>,
    options: HookOptions = { priority: 10 }
  ) => {
    const id = options?.id ?? md5Hex(filter.toString());
    const priority = options?.priority ?? 10;

    const queue = getQueue<IHookFilter>('filters', key as string);
    uniqueHookGuard(queue, id);
    queue.push({ function: filter, id, priority });
    queue.sort((a, b) => a.priority - b.priority);
  },
  addSyncFilter: <T extends keyof Burdy.ISyncFilters>(
    key: T,
    filterSync: IHookFilterSyncFunction,
    options: HookOptions = { priority: 10 }
  ) => {
    const id = options?.id ?? md5Hex(filterSync.toString());
    const priority = options?.priority ?? 10;

    const queue = getQueue<IHookFilterSync>('syncFilters', key as string);
    uniqueHookGuard(queue, id);
    queue.push({ function: filterSync, id, priority });
    queue.sort((a, b) => a.priority - b.priority);
  },
  removeAction: (key: keyof Burdy.IActions, id: string) => {
    const queue = getQueue<IHookAction>('actions', key as string);
    const targetIndex = queue.findIndex((hook) => hook.id === id);

    if (targetIndex !== -1) {
      queue.splice(targetIndex, 1);
    }
  },
  removeFilter: (key: keyof Burdy.IFilters, id: string) => {
    const queue = getQueue<IHookFilter>('filters', key as string);
    const targetIndex = queue.findIndex((hook) => hook.id !== id);

    if (targetIndex !== -1) {
      queue.splice(targetIndex, 1);
    }
  },
  hasAction: (key: keyof Burdy.IActions, id: string) => {
    const queue = getQueue<IHookAction>('filters', key as string);
    return queue.some((hook) => hook.id === id);
  },
  hasFilter: (key: keyof Burdy.IFilters, id: string) => {
    const queue = getQueue<IHookFilter>('filters', key as string);
    return queue.some((hook) => hook.id === id);
  },
  doAction: async <T extends keyof Burdy.IActions>(
    key: T,
    ...args: Burdy.IActions[T]
  ) => {
    const queue = getQueue<IHookAction>('actions', key as string);
    await async.each(queue, async (hook, next) => {
      try {
        await hook.function(...args);
        next();
      } catch (err) {
        next(err);
      }
    });
  },
  applyFilters: async <T extends keyof Burdy.IFilters>(
    key: T,
    ...args: Burdy.IFilters[T]
  ): Promise<Burdy.IFilters[T][0]> => {
    const [first, ...rest] = args;
    const queue = getQueue<IHookFilter>('filters', key as string);
    return async.reduce(queue, first, async (memo, hook, next) => {
      try {
        const result = await hook.function(memo, ...rest);
        next(null, result);
      } catch (e) {
        next(e, memo);
      }
    }) as unknown as Promise<Burdy.IFilters[T]>;
  },
  applySyncFilters: <T extends keyof Burdy.ISyncFilters>(
    key: T,
    ...args: Burdy.ISyncFilters[T]
  ): Burdy.ISyncFilters[T][0] => {
    const [first, ...rest] = args;
    const queue = getQueue<IHookFilterSync>('syncFilters', key as string);
    return queue.reduce((memo, hook) => hook.function(memo, ...rest), first);
  },
  getQueue: (type: keyof IHookCache) => hookCache[type],
  clearQueue: (type: keyof IHookCache) => {
    hookCache[type] = {};
  },
  clearAllQueues: () => {
    Object.keys(hookCache).forEach((key) => {
      hookCache[key] = {};
    });
  },
};

export default Hooks;
