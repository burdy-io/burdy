import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { convertModelArrayToObject, ModelObject } from '@admin/helpers/misc';
import { useRefEffect } from '@fluentui/react-hooks';
import { findSettingsValue, isTrue } from '@admin/helpers/utility';
import { useSettings } from '@admin/context/settings';

const useButtonHover = (debounce = 300) => {
  const [value, setValue] = useState(false);
  const setDebounceValue = useDebouncedCallback((val) => {
    setValue(val);
  }, debounce);

  const listeners = {
    onMouseEnter: () => {
      setValue(true);
      setDebounceValue(true);
    },
    onMouseLeave: () => setDebounceValue(false),
  };

  return [value, listeners];
};

const useStorageState = <T>(
  name: string,
  defaultValue: T
): [T, React.Dispatch<T>] => {
  const [state, setState] = useState<T>(
    JSON.parse(localStorage.getItem(name)) ?? defaultValue
  );

  useEffect(() => {
    localStorage.setItem(name, JSON.stringify(state));
  }, [state]);

  return [state, setState];
};

interface BaseModel {
  id: number | string;
}

type ModelMiddleware<T> = (models: T[]) => T[];
export type SetModelMiddleware<T> = (middleware: ModelMiddleware<T>[]) => void;
type CompareFunction<T> = (a: T, b: T) => number;

const useModelState = <T extends BaseModel>(
  defaultValue: T[] = [],
  sorter: CompareFunction<T> = null
) => {
  const [sort, setSort] = useState<CompareFunction<T> | null>(
    sorter ? () => sorter : null
  );
  const [arrayState, setArrayStatePrivate] = useState<T[]>(defaultValue);
  const [objectState, setObjectStatePrivate] = useState<ModelObject<T>>(
    convertModelArrayToObject(defaultValue)
  );
  const [middleware, setMiddleware] = useState<ModelMiddleware<T>[]>([]);

  const removeSort = () => {
    setSort(null);
  };

  const setObjectState = (models: ModelObject<T>) => {
    setArrayState(Object.values(models));
  };

  const sortList = (models = []) => {
    if (sort) {
      models.sort(sort);
    }
  };

  const setArrayState = (models: T[]) => {
    models = middleware.reduce(
      (previous, current) => current(previous),
      models
    );
    sortList(models);
    setObjectStatePrivate(convertModelArrayToObject(models));
    setArrayStatePrivate(models);
  };

  const create = (models: T[]) => {
    setArrayState([...arrayState, ...models]);
  };

  const destroy = (ids: number[]) => {
    if (!Array.isArray(ids)) return;
    setArrayState(arrayState.filter((u) => !ids.includes(u.id as number)));
  };

  const update = (models: T[]) => {
    const newObjectState = { ...objectState };
    models.forEach((m) => {
      newObjectState[m.id] = m;
    });
    setObjectState(newObjectState);
  };

  return {
    arrayState,
    objectState,
    setObjectState,
    setArrayState,
    create,
    delete: destroy,
    update,
    middleware,
    setMiddleware,
    removeSort,
    setSort,
  };
};

// Wrapper for typings
class ModelStateWrapper<T extends BaseModel> {
  useModelState = (defaultValue: T[] = []) => useModelState(defaultValue);
}

type ModelState<T extends BaseModel> = ReturnType<
  ModelStateWrapper<T>['useModelState']
>;

type RefChangeCallback<T> = (current: T, previous?: T) => (() => void) | void;

const useRefChange = <T = unknown>(
  callback: RefChangeCallback<T>,
  initial?: T | null
) => {
  const previousRef = useRef<T>(initial);

  return useRefEffect<T>((current) => {
    const cleanup = callback(current, previousRef.current);
    previousRef.current = current;
    return cleanup;
  }, initial);
};

const useAllowedPaths = () => {
  const { settingsArray } = useSettings();
  const allowedPaths = useMemo(() => {
    const previewEditor: any = findSettingsValue(
      settingsArray,
      'previewEditor'
    );
    let paths = [];
    if (!previewEditor) return paths;
    try {
      const parsed = JSON.parse(previewEditor);
      if (!isTrue(parsed?.enabled)) {
        return paths;
      }
      paths = ((parsed?.allowedPaths || '').split('\n') || []).filter(
        (path) => path?.length > 0
      );
    } catch {
      //
    }
    return paths;
  }, []);
  return allowedPaths;
};

export {
  useRefChange,
  useButtonHover,
  useStorageState,
  useModelState,
  useAllowedPaths,
  ModelState,
};
