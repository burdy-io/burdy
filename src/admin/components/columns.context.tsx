import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ISelection } from '@fluentui/react';
import { withWrapper } from '@admin/helpers/hoc';
import _ from 'lodash';

interface ColumnsViewContextInterface {
  selection: ISelection<any>;
  selectedItems: any[];
  hierarchical: any[];
  itemsObj: any;
  ancestors: any[];
  ancestorsObj: any;
  finished: boolean;
  onChange?: (selectedItems: any[]) => void;
}

const ColumnsViewContext = createContext<ColumnsViewContextInterface>(
  {} as any
);

const flatToObj = (flat = []) => {
  const all = {};
  [...flat]
    .filter((item) => !!item)
    .forEach((item) => {
      all[item.id] = {
        ...item,
      };
    });
  return all;
};

const flatToHierarchy = (flat, sort?) => {
  const roots = []; // items without parent

  const all = flatToObj(flat);

  Object.keys(all).forEach((id) => {
    const item = all[id];
    if (item.parentId === null || item.parentId === undefined) {
      roots.push(item);
      if (sort) {
        roots.sort(sort);
      }
    } else if (all[item.parentId]) {
      const p = all[item.parentId];
      if (!p?.children) {
        p.children = [];
      }
      p.children.push(item);
      if (sort) {
        p.children.sort(sort);
      }
    }
  });
  return roots;
};

interface IColumnsViewContextProvider {
  selection: ISelection;
}

const ColumnsViewContextProvider: IColumnsViewContextProvider | any = ({
  children,
  items,
  selection,
  loading,
  defaultSelected,
  sort,
}) => {
  const [selectedItems, setSelectedItems] = useState([]);

  const [hierarchical, setHierarchical] = useState([]);
  const [itemsObj, setItemsObj] = useState({});
  const [ancestorsObj, setAncestorsObj] = useState({});

  const [loaded, setLoaded] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!_.isEqual(items, selection.getItems()) && !loading) {
      setHierarchical(flatToHierarchy(items, sort));
      setItemsObj(flatToObj(items));
      selection.setItems(items, true);
      if (!loaded) {
        (defaultSelected || []).forEach((key) => {
          selection.setKeySelected(key, true, false);
        });
        setLoaded(true);
      } else {
        selectedItems.forEach((item) => {
          (selection as ISelection).setKeySelected(item?.key, true, false);
        });
      }
    }

    setFinished(true);
  }, [items, loading]);

  useEffect(() => {
    if (!_.isEqual(selection.getSelection(), selectedItems)) {
      setSelectedItems(selection.getSelection());
    }
  }, [selection.getSelection()]);

  const ancestors = useMemo(() => {
    const list = [];
    if (selectedItems?.length === 1) {
      let item = selectedItems[0];
      list.push(item);
      while (item?.parentId) {
        list.push(itemsObj[item?.parentId]);
        item = itemsObj[item?.parentId];
      }
      setAncestorsObj(flatToObj(list));
      return list;
    }
    if (selectedItems?.length > 1) {
      if (
        selectedItems?.[0]?.parentId &&
        itemsObj[selectedItems?.[0]?.parentId]
      ) {
        let item = itemsObj[selectedItems?.[0]?.parentId];
        list.push(item);

        while (item?.parentId) {
          item = itemsObj[item?.parentId];
          list.push(item);
        }
        setAncestorsObj(flatToObj(list));
        return list;
      }
    }
    setAncestorsObj({});
    return null;
  }, [selectedItems]);

  return (
    <ColumnsViewContext.Provider
      value={{
        selection,
        selectedItems,
        hierarchical,
        itemsObj,
        ancestors,
        ancestorsObj,
        finished,
      }}
    >
      {children}
    </ColumnsViewContext.Provider>
  );
};

const useColumns = () => useContext(ColumnsViewContext);
const withColumns = withWrapper(ColumnsViewContextProvider);

export { useColumns, withColumns, ColumnsViewContextProvider };
