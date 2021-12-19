import React, { useEffect, useMemo, useState } from 'react';
import {
  ActionButton,
  getTheme,
  IconButton,
  Label,
  mergeStyleSets,
  Separator,
  Stack
} from '@fluentui/react';
import { composeWrappers } from '@admin/helpers/hoc';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { Controller } from 'react-hook-form';
// eslint-disable-next-line max-len
import { useExtendedFormContext } from '@admin/config-fields/dynamic-form';
import classNames from 'classnames';
import { PostsContextProvider, usePosts } from '@admin/features/posts/context/posts.context';
import {v4} from 'uuid';
import PostsSelectPanel from '@admin/features/posts/components/posts-select-panel';
import { IPost } from '@shared/interfaces/model';

const theme = getTheme();

const styles = mergeStyleSets({
  headingWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  draggable: {
    padding: 20,
    border: `1px solid ${theme.palette.neutralLight}`
  },
  draggableMargin: {
    marginBottom: 15
  },
  component: {
    position: 'relative'
  }
});

type DynamicRelationComponentImplProps = {
  field: any;
  name?: string;
  post?: IPost;
  onDelete?: () => any;
  disableUp?: boolean;
  disableDown?: boolean;
  onMove?: (number) => void;
}

const DynamicRelationComponentImpl: React.FC<DynamicRelationComponentImplProps> = ({
                                                                         name,
                                                                                     post,
                                                                         onDelete,
                                                                         disableDown,
                                                                         disableUp,
                                                                         onMove
                                                                       }) => {
  const { disabled } = useExtendedFormContext();

  const { setLoadingContent, getBySlug, post: statePost } = usePosts();

  console.log(post);
  useEffect(() => {
    if (post?.slugPath) {
      getBySlug.execute(post?.slugPath);
    }
  }, [post?.slugPath]);

  useEffect(() => {
    const id = v4();
    setLoadingContent(id, getBySlug?.loading);
    return () => {
      setLoadingContent(id, false);
    }
  }, [getBySlug?.loading])

  return (
    <div className={styles.component}>
      <div className={styles.headingWrapper}>
        <Label style={{ overflow: 'hidden' }}>{statePost?.slugPath}</Label>
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          <IconButton
            disabled={disabled || disableUp}
            onClick={() => onMove(-1)}
            iconProps={{ iconName: 'Up' }}
            title='Move Up'
            ariaLabel='Move Up'
          />
          <IconButton
            disabled={disabled || disableDown}
            onClick={() => onMove(1)}
            iconProps={{ iconName: 'Down' }}
            title='Move Down'
            ariaLabel='Move Down'
          />
          <IconButton
            iconProps={{ iconName: 'Delete' }}
            disabled={disabled}
            title='Delete'
            ariaLabel='Delete'
            onClick={() => onDelete()}
          />
        </Stack>
      </div>
    </div>
  );
};

const DynamicRelationComponent = composeWrappers({
  postContext: PostsContextProvider
})(DynamicRelationComponentImpl);

interface DynamicRelationsProps {
  field: any;
  name?: string;
}

const DynamicRelations: React.FC<DynamicRelationsProps> = ({ field, name }) => {
  const [selectPostOpen, setSelectPostOpen] = useState(false);
  const { control, disabled, narrow } = useExtendedFormContext();

  return (
    <div>
      {field?.label?.length > 0 && <Label>{field?.label}</Label>}
      <Controller
        name={name}
        control={control}
        defaultValue={[]}
        render={({ field: { onChange, value: fieldValue } }) => {
          const value = useMemo(() => {
            let val = [];
            try {
              val = JSON.parse(fieldValue);
            } catch {
              //
            }
            return val;
          }, [fieldValue]);

          const getItemStyle = (isDragging, draggableStyle) => {
            if (isDragging) {
              return {
                backgroundColor: theme.palette.neutralLighterAlt,
                boxShadow: theme.effects.elevation8,
                userSelect: 'none',
                ...draggableStyle
              };
            }

            return {
              ...draggableStyle
            };
          };

          const onDragEnd = (result) => {
            // dropped outside the list
            if (!result.destination) {
              return;
            }
            move(result?.source?.index, result?.destination?.index);
          };

          const move = (origin, destination) => {
            const items = [
              ...(value || [])
            ];

            const element = items[origin];
            items.splice(origin, 1);
            items.splice(destination, 0, element);

            onChange(JSON.stringify(items));
          };

          const remove = (index) => {
            onChange(
              JSON.stringify((value ?? []).splice(index))
            );
          }

          const append = (data) => {
            onChange(JSON.stringify([
              ...(Array.isArray(value) ? value : []).filter(
                (val) => Boolean(val?.slugPath)
              ),
              ...data
                .map((post) => ({
                  slugPath: post.slugPath,
                })),
            ]));
          }

          return (
            <>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId={name}>
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      <Stack tokens={{ childrenGap: 10 }}>
                        {(value || []).map((relation, index) => (
                          <Draggable
                            isDragDisabled={disabled}
                            key={`${relation?.slugPath}-${index}`}
                            draggableId={`${relation?.slugPath}-${index}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={getItemStyle(
                                  snapshot.isDragging,
                                  provided.draggableProps.style
                                )}
                                className={classNames([styles.draggable, !narrow && styles.draggableMargin])}
                              >
                                <DynamicRelationComponent
                                  onDelete={() => {
                                    remove(index);
                                  }}
                                  onMove={(offset) => {
                                    move(index, index + offset);
                                  }}
                                  disableDown={index >= value?.length - 1}
                                  disableUp={index === 0}
                                  name={`${name}[${index}]`}
                                  post={(relation as IPost)}
                                  field={{
                                    fields: field?.fields
                                  }}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Stack>
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              <Separator style={{ marginTop: 30 }}>
                <ActionButton
                  disabled={disabled}
                  iconProps={{
                    iconName: 'Add'
                  }}
                  onClick={() => {
                    setSelectPostOpen(true);
                  }}
                >
                  Add post
                </ActionButton>
              </Separator>
              <PostsSelectPanel
                isOpen={selectPostOpen}
                onDismiss={() => setSelectPostOpen(false)}
                onSubmit={(data) => {
                  append(data);
                  setSelectPostOpen(false);
                }}
                params={{
                  contentTypeName: field.posts,
                }}
              />
            </>
          );
        }}
      />
    </div>
  );
};

export default DynamicRelations;
