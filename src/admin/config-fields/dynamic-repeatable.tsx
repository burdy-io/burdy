import React, { useMemo } from 'react';
import { useFieldArray } from 'react-hook-form';
import {
  ActionButton,
  getTheme,
  IconButton,
  Label,
  mergeStyleSets,
  Separator,
  Stack,
} from '@fluentui/react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import DynamicGroup from './dynamic-group';
import { useExtendedFormContext } from '@admin/config-fields/dynamic-form';

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
    marginBottom: 15,
    border: `1px solid ${theme.palette.neutralLight}`,
  },
});

interface DynamicRepeatableProps {
  field: any;
  name?: string;
}

const DynamicRepeatable: React.FC<DynamicRepeatableProps> = ({
  field,
  name,
}) => {
  const { control, disabled } = useExtendedFormContext();

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

  const maxElements = useMemo(() => {
    let max = 0;
    try {
      max = parseInt(field?.max, 10);
    } catch (err) {
      //
    }
    return max;
  }, [field?.max]);

  const onDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }
    move(result?.source?.index, result?.destination?.index);
  };

  return (
    <>
      {field?.label?.length > 0 && <Label>{field?.label}</Label>}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={name}>
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              <Stack tokens={{ childrenGap: 10 }}>
                {fields.map((formField, index) => (
                  <Draggable
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
                        className={styles.draggable}
                      >
                        <div className={styles.headingWrapper}>
                          {field?.label?.length > 0 && (
                            <Label>{`${field?.label} [${index}]`}</Label>
                          )}
                          <Stack horizontal tokens={{ childrenGap: 8 }}>
                            <IconButton
                              disabled={disabled || index === 0}
                              onClick={() => move(index, index - 1)}
                              iconProps={{ iconName: 'Up' }}
                              title="Move Up"
                              ariaLabel="Move Up"
                            />
                            <IconButton
                              disabled={disabled || index >= fields?.length - 1}
                              onClick={() => move(index, index + 1)}
                              iconProps={{ iconName: 'Down' }}
                              title="Move Down"
                              ariaLabel="Move Down"
                            />
                            <IconButton
                              iconProps={{ iconName: 'Delete' }}
                              disabled={disabled}
                              title="Delete"
                              ariaLabel="Delete"
                              onClick={() => remove(index)}
                            />
                          </Stack>
                        </div>
                        <DynamicGroup
                          name={`${name || ''}.[${index}]`}
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
      <Separator style={{ marginTop: 10 }}>
        <ActionButton
          disabled={disabled || (maxElements && fields?.length >= maxElements)}
          iconProps={{
            iconName: 'Add',
          }}
          onClick={() => {
            append({});
          }}
        >
          Add item
        </ActionButton>
      </Separator>
    </>
  );
};

export default DynamicRepeatable;
