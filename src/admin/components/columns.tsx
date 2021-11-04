import {
  Check,
  getRTL,
  getTheme,
  Icon,
  mergeStyleSets,
  Selection,
  Shimmer,
  ShimmerElementType,
  Stack,
  List,
} from '@fluentui/react';
import React, { useMemo } from 'react';
import Empty from './empty';
import { ColumnsViewContextProvider, useColumns } from './columns.context';
import {useHistory} from "react-router";

const theme = getTheme();

const styles = mergeStyleSets({
  root: {
    height: '100%',
    textAlign: 'center',
    paddingTop: 52,
    paddingBottom: 104,
  },
  columnsView: {
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
    height: '100%',
  },
  shimmerColumn: {
    width: 240,
    maxWidth: 240,
    minWidth: 240,
    overflowY: 'auto',
    height: '100%',
  },
  shimmerItemCell: {
    height: 48,
    width: '100%',
    display: 'flex',
    padding: '0 10px',
    boxSizing: 'border-box',
    '&:last-child': {
      marginBottom: 46,
    },
  },
  column: {
    width: 240,
    maxWidth: 240,
    minWidth: 240,
    overflowY: 'auto',
    borderRight: `1px solid ${theme.semanticColors.bodyDivider}`,
    height: '100%',
  },
  itemCell: {
    width: '100%',
    display: 'flex',
    height: 48,
    padding: '4px 6px',
    boxSizing: 'border-box',
    borderBottom: `1px solid ${theme.semanticColors.bodyDivider}`,
    userSelect: 'none',
    selectors: {
      '&:hover': {
        background: theme.semanticColors.bodyBackgroundHovered,
        cursor: 'pointer',
      },
    }
  },
  itemCell_selected: {
    background: theme.semanticColors.bodyBackgroundChecked,
    borderBottom: `1px solid ${theme.palette.white}`,
    fontWeight: 600,
    selectors: {
      '&:hover': {
        background: theme.palette.neutralQuaternaryAlt,
      },
    },
  },
  itemCell_parent: {
    background: theme.semanticColors.bodyBackgroundChecked,
    borderBottom: `1px solid ${theme.palette.white}`,
    selectors: {
      '&:hover': {
        background: theme.palette.neutralQuaternaryAlt,
      },
    },
  },
  check: {
    width: 32,
    minWidth: 32,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 32,
    minWidth: 32,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 18,
    color: theme.palette.neutralSecondary,
  },
  itemContent: {
    marginLeft: 6,
    paddingTop: 2,
    overflow: 'hidden',
    flexGrow: 1,
  },
  itemTitle: {
    fontSize: theme.fonts.medium.fontSize,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemHelper: {
    fontSize: theme.fonts.small.fontSize,
    color: theme.palette.neutralTertiary,
    marginBottom: 10,
    fontWeight: 400,
  },
  chevron: {
    alignSelf: 'center',
    marginLeft: 10,
    color: theme.palette.neutralTertiary,
    fontSize: theme.fonts.large.fontSize,
    flexShrink: 0,
  },
});

interface ColumnProps {
  items: any;
}

const Column: React.FC<ColumnProps> = ({ items }) => {
  const { ancestorsObj, selection, selectedItems } = useColumns();
  const history = useHistory();

  const children = useMemo(() => {
    const item = (items || []).find((item) => ancestorsObj[item.id]);
    return item?.children;
  }, [ancestorsObj, items]);

  const Item = (item) => {
    return (
      <div
        key={item.key}
        className={`${styles.itemCell} ${
          item.isSelected && styles.itemCell_selected
        } ${item.isParent && styles.itemCell_parent}`}
        onClick={(evt) => {
          selection.setAllSelected(false);
          selection.setKeySelected(item.key, true, false);
          evt.stopPropagation();
        }}
        onDoubleClick={() => {
          if (item.actionType !== 'sites' || item.type === 'folder') return;

          if (item.type === 'hierarchical_post') {
            history.push(`/sites/post-container/${item.id}`);
          } else {
            history.push(`/sites/editor/${item.id}`);
          }
        }}
        data-cy="columns-view-item"
      >
        <div
          className={styles.check}
          onClick={(evt) => {
            if (
              selectedItems?.length > 0 &&
              selectedItems?.[0]?.parentId !== item.parentId
            ) {
              selection.setAllSelected(false);
            }
            if (item.isSelected) {
              selection.setKeySelected(item.key, false, false);
            } else {
              selection.setKeySelected(item.key, true, false);
            }
            evt.stopPropagation();
          }}
        >
          <Check checked={item.isSelected} />
        </div>
        {item?.iconProps && (
          <div className={styles.icon} style={item?.opacity ? {opacity: item.opacity} : {}}>
            <Icon {...(item?.iconProps || {})} />
          </div>
        )}
        <div className={styles.itemContent} style={item?.opacity ? {opacity: item.opacity} : {}}>
          <div className={styles.itemTitle}>{item.title}</div>
          <div className={styles.itemHelper}>{item.helper}</div>
        </div>
        {item?.children?.length > 0 && (
          <Icon
            className={styles.chevron}
            iconName={getRTL() ? 'ChevronLeft' : 'ChevronRight'}
          />
        )}
      </div>
    );
  };

  const formatted = useMemo<any[]>(() => {
    return (items || []).map(item => {
      return {
        ...item,
        isSelected: selection.isKeySelected(item.key),
        isParent: ancestorsObj[item.id]
      }
    })
  }, [items, selectedItems, ancestorsObj])

  return (
    <>
      <div
        className={styles.column}
        data-cy="columns-view-column"
        onClick={() => {
          selection.setAllSelected(false);
          if (items?.[0]?.parentId) {
            selection.setKeySelected(items?.[0]?.parentId, true, false);
          }
        }}
      >
        <List items={formatted} onRenderCell={Item} />
      </div>
      {children && <Column items={children} />}
    </>
  );
};

const ColumnsViewImpl: React.FC<any> = ({ loading }) => {
  const { hierarchical, finished } = useColumns();
  return (
    <div className={styles.columnsView} data-cy="columns-view">
      {(loading || !finished) && (
        <div className={styles.shimmerColumn}>
          {[1, 0.8, 0.6].map((opacity) => (
            <div key={opacity} style={{ opacity }} className={styles.shimmerItemCell}>
              <Stack verticalAlign="center" tokens={{ childrenGap: 4 }}>
                <Shimmer
                  width={220}
                  shimmerElements={[
                    { type: ShimmerElementType.line, height: 8 },
                  ]}
                />
                <Shimmer
                  width={220}
                  shimmerElements={[
                    { type: ShimmerElementType.line, height: 8 },
                  ]}
                />
              </Stack>
            </div>
          ))}
        </div>
      )}
      {!loading && finished && hierarchical?.length > 0 && (
        <Column items={hierarchical} />
      )}
      {!loading && finished && !hierarchical?.length && (
        <div style={{ flex: 1 }}>
          <Empty compact title="No items" />
        </div>
      )}
    </div>
  );
};

interface ColumnsViewImplProps {
  items: any[];
  selection: Selection<any>;
  defaultSelected?: any[];
  loading?: boolean;
  onChange?: (selectedItems: any[]) => void;
  sort?: any;
}

const ColumnsView: React.FC<ColumnsViewImplProps> = ({
  items,
  selection,
  onChange,
  defaultSelected,
  loading,
  sort
}) => {
  return (
    <ColumnsViewContextProvider
      onChange={onChange}
      selection={selection}
      items={items}
      loading={loading}
      sort={sort}
      defaultSelected={defaultSelected}
    >
      <ColumnsViewImpl loading={loading} />
    </ColumnsViewContextProvider>
  );
};

export default ColumnsView;
