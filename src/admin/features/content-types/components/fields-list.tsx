import React, { useCallback, useEffect, useState } from 'react';
import {
  ActionButton,
  getTheme,
  Icon,
  IconButton,
  Label,
  mergeStyleSets,
  Separator,
  Stack,
} from '@fluentui/react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import FieldsSelectPanel from './fields-select-panel';
import { useContentTypes } from '../context/content-types.context';
import FieldsConfigurePanel from './fields-configure-panel';

const theme = getTheme();

const styles = mergeStyleSets({
  fields: {
    marginBottom: 16,
  },
  field: {
    display: 'flex',
    minHeight: 0,
  },
  fieldGroup: {
    padding: '8px 30px',
  },
  fieldWrapper: {
    padding: 10,
    border: `1px solid ${theme.palette.neutralQuaternary}`,
    borderRadius: theme.effects.roundedCorner2,
    marginBottom: 10,
  },
  fieldWrapperLight: {
    backgroundColor: theme.palette.neutralLighterAlt,
  },
  fieldWrapperWhite: {
    backgroundColor: theme.palette.white,
  },
  icon: {
    height: 30,
    width: 30,
    fontSize: 16,
    backgroundColor: theme.palette.neutralLighter,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconDrag: {
    width: 30,
  },
  content: {
    marginLeft: 10,
    marginRight: 10,
    flexGrow: 1,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fieldHelper: {
    fontSize: 12,
    color: theme.palette.neutralTertiary,
    marginBottom: 10,
  },
  fieldContent: {
    padding: '8px 40px',
  },
  fieldContentItem: {
    fontSize: 12,
    padding: `10px 0`,
    '&:not(:last-child)': {
      borderBottom: `1px solid ${theme.palette.neutralLight}`,
    },
  },
  actions: {
    margin: '24px 0 12px',
  },
});

interface IFieldsListProps {
  field?: any;
  isRoot?: boolean;
  isRepeatable?: boolean;
}

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const FieldsList: React.FC<IFieldsListProps> = ({ field, isRoot }) => {
  const [error, setError] = useState(null);

  const [editingField, setEditingField] = useState(null);

  const [wa, setWa] = useState(false);

  const { getFields, getComponents, getContentTypes } = useContentTypes();

  if (!field?.fields) {
    field.fields = [];
  }

  const getFieldFn = useCallback(
    (item) => {
      return (getFields?.result ?? []).find(
        (field) => field.type === item.type
      );
    },
    [getFields?.result]
  );

  const getComponentFn = useCallback(
    (name) => {
      return (getComponents?.result ?? []).find(
        (component) => component.name == name
      );
    },
    [getComponents?.result]
  );

  const getPostFn = useCallback(
    (name) => {
      return (getContentTypes?.result ?? []).find((post) => post.name == name);
    },
    [getContentTypes?.result]
  );

  useEffect(() => {
    getFields.execute();
    if (!getComponents?.result && !getComponents?.loading) {
      getComponents.execute();
    }

    if (!getContentTypes?.result && !getContentTypes?.loading) {
      getContentTypes.execute({ type: 'page,post,hierarchical_post' });
    }
  }, []);

  const [selectFieldOpen, setSelectFieldOpen] = useState(false);

  const removeAt = (index) => {
    field.fields.splice(index, 1);
    setWa(!wa);
  };

  const getItemStyle = (isDragging, draggableStyle) => {
    if (isDragging) {
      return {
        userSelect: 'none',
        boxShadow: `${theme.effects.elevation64} !important`,
        ...draggableStyle,
      };
    }

    return {
      ...draggableStyle,
    };
  };

  const renderZoneComponents = (items = '') => {
    const components = items.split(',').filter((item) => item?.length > 0);

    return (
      <div className={styles.fieldContent}>
        <Label>Allowed components</Label>
        {components.map(getComponentFn).map((component: any) => (
          <div key={component?.name} className={styles.fieldContentItem}>
            {component?.name}
          </div>
        ))}
        {components?.length === 0 && (
          <Separator>
            <span style={{ fontSize: 12 }}>No components</span>
          </Separator>
        )}
      </div>
    );
  };

  const renderRelationPosts = (ids = '') => {
    const posts = ids.split(',').filter((item) => item?.length > 0);

    return (
      <div className={styles.fieldContent}>
        <Label>Allowed relation posts</Label>
        {posts.map(getPostFn).map((post: any) => (
          <div key={post?.name} className={styles.fieldContentItem}>
            {post?.name}
          </div>
        ))}
        {posts?.length === 0 && (
          <Separator>
            <span style={{ fontSize: 12 }}>No posts</span>
          </Separator>
        )}
      </div>
    );
  };

  const onDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = reorder(
      field.fields,
      result.source.index,
      result.destination.index
    );

    field.fields = items;
  };

  const move = (index, offset) => {
    const items = reorder(field.fields, index, index + offset);

    field.fields = items;
    setWa(!wa);
  };

  return (
    <>
      <div>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="droppable">
            {(provided) => (
              <div
                {...provided.droppableProps}
                className={styles.fields}
                ref={provided.innerRef}
              >
                {(field?.fields ?? []).map((item, index) => (
                  <Draggable
                    key={item?.name}
                    draggableId={item?.name}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        className={`${styles.fieldWrapper} ${
                          item.type === 'tab'
                            ? styles.fieldWrapperLight
                            : styles.fieldWrapperWhite
                        }`}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={getItemStyle(
                          snapshot.isDragging,
                          provided.draggableProps.style
                        )}
                        data-cy={`contentTypes-fieldsList-item-${item?.name}`}
                      >
                        <div className={styles.field}>
                          <div className={styles.icon}>
                            <Icon {...(getFieldFn(item)?.iconProps ?? {})} />
                          </div>
                          <div className={styles.content}>
                            <div className={styles.fieldName}>
                              {item?.label?.length ? item?.label : item?.name}
                            </div>
                            <div className={styles.fieldHelper}>
                              {item?.type}
                            </div>
                          </div>
                          <div>
                            <Stack horizontal tokens={{ childrenGap: 8 }}>
                              <IconButton
                                disabled={index === 0}
                                onClick={() => move(index, -1)}
                                iconProps={{ iconName: 'Up' }}
                                title="Move Up"
                                ariaLabel="Move Up"
                              />
                              <IconButton
                                disabled={index >= field?.fields?.length - 1}
                                onClick={() => move(index, 1)}
                                iconProps={{ iconName: 'Down' }}
                                title="Move Down"
                                ariaLabel="Move Down"
                              />
                              <IconButton
                                onClick={() =>
                                  setEditingField({
                                    ...item,
                                    index,
                                  })
                                }
                                iconProps={{ iconName: 'Edit' }}
                                title="Edit"
                                ariaLabel="Edit"
                                selected={selectFieldOpen}
                              />
                              <IconButton
                                onClick={() => removeAt(index)}
                                iconProps={{ iconName: 'Delete' }}
                                title="Delete"
                                ariaLabel="Delete"
                              />
                            </Stack>
                          </div>
                        </div>
                        {(item?.type === 'group' ||
                          item?.type === 'repeatable') && (
                          <div className={styles.fieldGroup}>
                            <FieldsList field={item} />
                          </div>
                        )}

                        {item?.type === 'zone' &&
                          renderZoneComponents(item?.components)}

                        {item?.type === 'custom' && (
                          <div className={styles.fieldContent}>
                            {item.component?.length > 0 && (
                              <>
                                <Label>Component</Label>
                                <div className={styles.fieldContentItem}>
                                  {getComponentFn(item.component)?.name}
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {item?.type === 'relation' &&
                          renderRelationPosts(item?.posts)}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <div className={styles.actions}>
          <Separator>
            <ActionButton
              iconProps={{
                iconName: 'Add',
              }}
              onClick={() => setSelectFieldOpen(true)}
              data-cy="contentTypes-fieldsList-addField"
            >
              {isRoot ? 'Add field' : 'Add sub-field'}
            </ActionButton>
          </Separator>
        </div>
      </div>

      <FieldsSelectPanel
        isOpen={selectFieldOpen}
        onDismiss={() => setSelectFieldOpen(false)}
        error={error}
        onSubmit={(e) => {
          setError(null);
          if ((field?.fields ?? []).find((field) => field?.name === e?.name)) {
            setError('duplicate_field_name');
          } else {
            field.fields.push(e);
            setSelectFieldOpen(false);
          }
        }}
      />

      <FieldsConfigurePanel
        isOpen={!!editingField}
        type={editingField?.type}
        field={editingField}
        onDismiss={() => setEditingField(null)}
        onSubmit={(e) => {
          setError(null);
          if (
            (field?.fields ?? []).find(
              (field, index) => e.index !== index && field?.name === e?.name
            )
          ) {
            setError('duplicate_field_name');
          } else {
            const { index } = e;
            const tmpField = {
              ...field?.fields[index],
            };

            delete e.index;

            field.fields[index] = {
              ...tmpField,
              ...e,
            };

            setEditingField(null);
          }
        }}
        error={error}
      />
    </>
  );
};

export default FieldsList;
