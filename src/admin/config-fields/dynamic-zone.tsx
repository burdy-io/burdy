import React, { useEffect, useState } from 'react';
import {
  ActionButton,
  getTheme,
  IconButton,
  Label,
  mergeStyleSets, PanelType,
  Separator,
  Stack
} from '@fluentui/react';
import { composeWrappers } from '@admin/helpers/hoc';
import {
  ContentTypesContextProvider,
  useContentTypes
} from '@admin/features/content-types/context/content-types.context';
import LoadingBar from '@admin/components/loading-bar';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { Controller, useFieldArray } from 'react-hook-form';
// eslint-disable-next-line max-len
import ContentTypesComponentsSelectPanel
  from '@admin/features/content-types/components/content-types-components-select-panel';
import DynamicGroup from './dynamic-group';
import { useExtendedFormContext } from '@admin/config-fields/dynamic-form';
import classNames from 'classnames';
import BackPanel from '@admin/components/back-panel';
import { usePosts } from '@admin/features/posts/context/posts.context';
import {v4} from 'uuid';

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

interface DynamicZoneComponentProps {
  field: any;
  name?: string;
  component?: number;
  onDelete?: () => any;
  disableUp?: boolean;
  disableDown?: boolean;
  onMove?: (number) => void;
}

const DynamicZoneComponentImpl: React.FC<DynamicZoneComponentProps> = ({
                                                                         name,
                                                                         component,
                                                                         onDelete,
                                                                         disableDown,
                                                                         disableUp,
                                                                         onMove
                                                                       }) => {
  const { control, disabled, narrow } = useExtendedFormContext();

  const [panelOpened, setPanelOpened] = useState(false);
  const { setLoadingContent } = usePosts();
  const { getSingleContentType } = useContentTypes();

  useEffect(() => {
    if (component) {
      getSingleContentType.execute({ name: component });
    }
  }, [component]);

  useEffect(() => {
    const id = v4();
    setLoadingContent(id, getSingleContentType?.loading);
    return () => {
      setLoadingContent(id, false);
    }
  }, [getSingleContentType?.loading])

  return (
    <div className={styles.component}>
      <div className={styles.headingWrapper}>
        <Label style={{ overflow: 'hidden' }}>{getSingleContentType?.result?.name}</Label>
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          {narrow && <IconButton
            onClick={() => {
              setPanelOpened(true);
            }}
            iconProps={{ iconName: 'Edit' }}
            title='Edit'
            ariaLabel='Edit'
          />}
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
      <LoadingBar loading={getSingleContentType?.loading}>
        <Controller
          name={`${name}.component`}
          control={control}
          defaultValue={getSingleContentType?.result?.name}
          render={({ field }) => {
            useEffect(() => {
              field.onChange(getSingleContentType?.result?.name);
            }, []);
            return null;
          }}
        />
        <Controller
          name={`${name}.component_name`}
          control={control}
          defaultValue={getSingleContentType?.result?.name}
          render={({ field }) => {
            useEffect(() => {
              field.onChange(getSingleContentType?.result?.name);
            }, []);
            return null;
          }}
        />
        {!narrow && <DynamicGroup field={getSingleContentType?.result} name={name} />}
        {narrow && <BackPanel
          isOpen={panelOpened}
          headerText={getSingleContentType?.result?.name}
          isBlocking={false}
          isFooterAtBottom
          isHiddenOnDismiss
          onBack={() => setPanelOpened(false)}
          onDismiss={() => setPanelOpened(false)}
          type={PanelType.custom}
          customWidth={400 as any}
        >
          <DynamicGroup field={getSingleContentType?.result} name={name} />
        </BackPanel>}
      </LoadingBar>
    </div>
  );
};

const DynamicZoneComponent = composeWrappers({
  contentTypesContext: ContentTypesContextProvider
})(DynamicZoneComponentImpl);

interface DynamicZoneProps {
  field: any;
  name?: string;
}

const DynamicZone: React.FC<DynamicZoneProps> = ({ field, name }) => {
  const [addComponentOpen, setAddComponentOpen] = useState(false);
  const { control, disabled, narrow } = useExtendedFormContext();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name
  });

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

  return (
    <div>
      {field?.label?.length > 0 && <Label>{field?.label}</Label>}
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
                        className={classNames([styles.draggable, !narrow && styles.draggableMargin])}
                      >
                        <DynamicZoneComponent
                          onDelete={() => {
                            remove(index);
                          }}
                          onMove={(offset) => {
                            move(index, index + offset);
                          }}
                          disableDown={index >= fields?.length - 1}
                          disableUp={index === 0}
                          name={`${name}[${index}]`}
                          component={(formField as any)?.component}
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
            setAddComponentOpen(true);
          }}
        >
          Add component
        </ActionButton>
      </Separator>
      <ContentTypesComponentsSelectPanel
        isOpen={addComponentOpen}
        filter={{
          name: field?.components
        }}
        onDismiss={() => setAddComponentOpen(false)}
        onSubmit={(e) => {
          append({
            component: e?.[0].name
          });
          setAddComponentOpen(false);
        }}
      />
    </div>
  );
};

export default DynamicZone;
