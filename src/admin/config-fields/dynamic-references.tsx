import React, { useEffect, useState } from 'react';
import {
  ActionButton,
  getTheme,
  IconButton,
  Label,
  mergeStyleSets,
  MessageBar,
  MessageBarType,
  SelectionMode,
  Separator,
  Stack,
} from '@fluentui/react';
import { composeWrappers } from '@admin/helpers/hoc';
import LoadingBar from '@admin/components/loading-bar';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { Controller, useFieldArray } from 'react-hook-form';
// eslint-disable-next-line max-len
import { useExtendedFormContext } from '@admin/config-fields/dynamic-form';
import classNames from 'classnames';
import {
  PostsContextProvider,
  usePosts,
} from '@admin/features/posts/context/posts.context';
import { v4 } from 'uuid';
import PostsSelectPanel from '@admin/features/posts/components/posts-select-panel';
import Status from '@admin/components/status';

const theme = getTheme();

const styles = mergeStyleSets({
  headingWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  draggable: {
    padding: 20,
    border: `1px solid ${theme.palette.neutralLight}`,
  },
  draggableMargin: {
    marginBottom: 15,
  },
  component: {
    position: 'relative',
  },
});

interface DynamicReferencesComponentProps {
  field: any;
  name?: string;
  slugPath?: string;
  onDelete?: () => any;
  disableUp?: boolean;
  disableDown?: boolean;
  onMove?: (number) => void;
}

const DynamicReferencesComponentImpl: React.FC<DynamicReferencesComponentProps> =
  ({ name, slugPath, onDelete, disableDown, disableUp, onMove }) => {
    const { control, disabled } = useExtendedFormContext();
    const { setLoadingContent, getBySlug } = usePosts();

    useEffect(() => {
      if (slugPath) {
        getBySlug.execute(slugPath);
      }
    }, [slugPath]);

    useEffect(() => {
      const id = v4();
      setLoadingContent(id, getBySlug?.loading);
      return () => {
        setLoadingContent(id, false);
      };
    }, [getBySlug?.loading]);

    return (
      <div className={styles.component}>
        <div className={styles.headingWrapper}>
          <Stack
            style={{
              overflowX: 'auto',
              alignItems: 'flex-start',
            }}
          >
            <>
              <Label style={{ overflow: 'hidden', wordBreak: 'break-all' }}>
                {slugPath}
              </Label>
              {getBySlug?.error ? (
                <Status type="error">Invalid post</Status>
              ) : (
                <Status
                  type={
                    getBySlug?.result?.status === 'published'
                      ? 'success'
                      : undefined
                  }
                >
                  {getBySlug?.result?.status}
                </Status>
              )}
            </>
          </Stack>
          <Stack horizontal tokens={{ childrenGap: 8 }}>
            <IconButton
              disabled={getBySlug?.loading || !!getBySlug?.error}
              iconProps={{
                iconName: 'OpenInNewTab',
              }}
              title="Open in new tab"
              onClick={() => {
                window.open(
                  `/admin/sites/editor/${getBySlug?.result?.id}`,
                  '_blank'
                );
              }}
            />
            <IconButton
              disabled={getBySlug?.loading || disabled || disableUp}
              onClick={() => onMove(-1)}
              iconProps={{ iconName: 'Up' }}
              title="Move Up"
              ariaLabel="Move Up"
            />
            <IconButton
              disabled={getBySlug?.loading || disabled || disableDown}
              onClick={() => onMove(1)}
              iconProps={{ iconName: 'Down' }}
              title="Move Down"
              ariaLabel="Move Down"
            />
            <IconButton
              iconProps={{ iconName: 'Delete' }}
              disabled={getBySlug?.loading || disabled}
              title="Delete"
              ariaLabel="Delete"
              onClick={() => onDelete()}
            />
          </Stack>
        </div>
        <LoadingBar loading={getBySlug?.loading}>
          <Controller
            name={`${name}.slugPath`}
            control={control}
            defaultValue={slugPath}
            render={({ field }) => {
              useEffect(() => {
                field.onChange(slugPath);
              }, []);
              return null;
            }}
          />
        </LoadingBar>
      </div>
    );
  };

const DynamicReferencesComponent = composeWrappers({
  postsContext: PostsContextProvider,
})(DynamicReferencesComponentImpl);

interface DynamicReferencesProps {
  field: any;
  name?: string;
}

const DynamicReferences: React.FC<DynamicReferencesProps> = ({
  field,
  name,
}) => {
  const [selectPostOpen, setSelectPostOpen] = useState(false);
  const { control, disabled, narrow } = useExtendedFormContext();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name,
  });

  const getItemStyle = (isDragging, draggableStyle) => {
    if (isDragging) {
      return {
        backgroundColor: theme.palette.neutralLighterAlt,
        boxShadow: theme.effects.elevation8,
        userSelect: 'none',
        ...draggableStyle,
      };
    }

    return {
      ...draggableStyle,
    };
  };

  const onDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }
    move(result?.source?.index, result?.destination?.index);
  };

  return (
    <div>
      {field?.label?.length > 0 && (
        <Label>{`${field?.label} (Multiple)`}</Label>
      )}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={name}>
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              <Stack tokens={{ childrenGap: 10 }}>
                {(fields || []).map((formField, index) => (
                  <Draggable
                    isDragDisabled={disabled}
                    key={formField.id}
                    draggableId={formField.id}
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
                        className={classNames([
                          styles.draggable,
                          !narrow && styles.draggableMargin,
                        ])}
                      >
                        <DynamicReferencesComponent
                          onDelete={() => {
                            remove(index);
                          }}
                          onMove={(offset) => {
                            move(index, index + offset);
                          }}
                          disableDown={index >= fields?.length - 1}
                          disableUp={index === 0}
                          name={`${name}[${index}]`}
                          slugPath={(formField as any)?.slugPath}
                          field={{
                            fields: field?.fields,
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
            iconName: 'Add',
          }}
          onClick={() => {
            setSelectPostOpen(true);
          }}
        >
          Add reference
        </ActionButton>
      </Separator>
      <PostsSelectPanel
        isOpen={selectPostOpen}
        selectionMode={SelectionMode.single}
        onDismiss={() => setSelectPostOpen(false)}
        onSubmit={(data) => {
          append({
            slugPath: data?.[0]?.slugPath
          });
          setSelectPostOpen(false);
        }}
        params={{
          contentTypeName: field.posts,
        }}
      />
    </div>
  );
};

export default DynamicReferences;
