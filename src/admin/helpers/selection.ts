import {
  IObjectWithKey,
  ISelectionOptionsWithRequiredGetKey,
  Selection,
} from '@fluentui/react';
import { useMemo } from 'react';

export type ItemsOrKeys<T> = T[] | string[] | number[];

interface IExtendedSelectionOptions<T>
  extends ISelectionOptionsWithRequiredGetKey<T> {
  defaultSelectedItems?: ItemsOrKeys<T>;
}

class ExtendedSelection<T = IObjectWithKey> extends Selection<T> {
  private defaultSelectedItems: ItemsOrKeys<T> = null;

  select(itemsOrKeys: ItemsOrKeys<T>, clearRest = false) {
    if (clearRest) this.deselectAll();

    itemsOrKeys.forEach((item) => {
      const key = this.convertToKey(item);
      this.setKeySelected(key, true, false);
    });
  }

  deselect(itemsOrKeys: ItemsOrKeys<T>) {
    itemsOrKeys.forEach((item) => {
      const key = this.convertToKey(item);
      this.setKeySelected(key, false, false);
    });
  }

  deselectAll() {
    this.deselect(this.getSelection());
  }

  selectAll() {
    this.select(this.getItems());
  }

  setDefaultSelectedItems(itemsOrKeys: ItemsOrKeys<T>) {
    this.defaultSelectedItems = itemsOrKeys;
  }

  clearDefaultSelectedItems() {
    this.defaultSelectedItems = null;
  }

  setItems(items: T[], shouldClear?: boolean) {
    super.setItems(items, shouldClear);
    // For some reason method gets called with null items sometimes
    const notEmpty = items.some?.((item) => item !== undefined);

    if (this.defaultSelectedItems && items?.length > 0 && notEmpty) {
      this.select(this.defaultSelectedItems);
      this.defaultSelectedItems = null;
    }
  }

  private convertToKey(itemOrKey: ItemsOrKeys<T>[0]): string {
    if (typeof itemOrKey === 'string') {
      return itemOrKey;
    }

    if (typeof itemOrKey === 'number') {
      return itemOrKey.toString();
    }

    return this.getKey(itemOrKey as T);
  }
}

export const useSelection = <T extends {}>(
  constructor: IExtendedSelectionOptions<T>,
  deps = []
) =>
  useMemo(() => {
    const { defaultSelectedItems, ...original } = constructor;
    const selection = new ExtendedSelection<T>(original as any);

    if (defaultSelectedItems) {
      selection.setDefaultSelectedItems(defaultSelectedItems);
    }

    return selection;
  }, deps);

export default ExtendedSelection;
