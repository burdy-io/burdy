import { Control, Controller, UseControllerProps } from 'react-hook-form';
import {
  ActionButton,
  Checkbox,
  ChoiceGroup,
  ColorPicker,
  ComboBox,
  DatePicker,
  Dropdown,
  ICheckboxProps,
  IChoiceGroup,
  IColorPickerProps,
  IColorPickerStyles,
  IComboBoxProps,
  IDatePickerProps,
  IDropdownProps,
  ITextFieldProps,
  Label,
  Text,
  TextField,
} from '@fluentui/react';
import React, { useMemo } from 'react';
import { isTrue } from '@admin/helpers/utility';

export interface HookFormProps {
  control: Control<any>;
  name: string;
  label?: string;
  rules?: UseControllerProps['rules'];
  defaultValue?: any;
  disabled?: boolean;
}

const ControlledTextField: React.FC<HookFormProps & ITextFieldProps> = (
  props
) => {
  return (
    <Controller
      name={props.name}
      control={props.control}
      rules={props.rules}
      defaultValue={props.defaultValue || ''}
      render={({
        field: { onChange, onBlur, name: fieldName, value },
        fieldState: { error },
      }) => (
        <TextField
          {...props}
          multiline={isTrue(props?.multiline)}
          required={isTrue(props?.required)}
          onChange={onChange}
          value={value}
          onBlur={onBlur}
          name={fieldName}
          errorMessage={error && error.message}
          defaultValue={undefined}
        />
      )}
    />
  );
};

interface ExtendedCheckbox {
  defaultCheckedValue?: any;
}

const ControlledCheckbox: React.FC<
  HookFormProps & ICheckboxProps & ExtendedCheckbox
> = ({ ...props }) => {
  return (
    <Controller
      name={props.name}
      control={props.control}
      rules={props.rules}
      defaultValue={isTrue(props.defaultValue) || 'false'}
      render={({ field: { onChange, name: fieldName, value } }) => {
        return (
          <Checkbox
            {...props}
            onChange={(e, val) => {
              onChange(`${val}`)
            }}
            checked={isTrue(value)}
            name={fieldName}
          />
        );
      }}
    />
  );
};

const ControlledDropdown: React.FC<HookFormProps & IDropdownProps> = (
  props
) => {
  return (
    <Controller
      name={props.name}
      control={props.control}
      rules={props.rules}
      defaultValue={props.defaultValue}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => {
        return (
          <Dropdown
            {...props}
            {...(props.multiSelect
              ? {
                  selectedKeys: (value ?? '')
                    .split(',')
                    .filter((val) => val?.length > 0),
                }
              : {
                  selectedKey: value,
                })}
            onChange={(_e, option) => {
              if (props.multiSelect) {
                const items = (value ?? '')
                  .split(',')
                  .filter((v) => v !== option.key)
                  .filter((v) =>
                    (props.options ?? []).some((opt) => opt.key === v)
                  )
                  .filter((v) => v?.length > 0);

                if (option.selected) {
                  items.push(option.key);
                }
                onChange(items.join(','));
              } else {
                onChange(option.key);
              }
            }}
            onBlur={onBlur}
            errorMessage={error && error.message}
          />
        );
      }}
    />
  );
};

const ControlledDatePicker: React.FC<HookFormProps & IDatePickerProps> = (
  props
) => {
  const defaultDate = useMemo(() => {
    if (!props?.defaultValue) return null;
    const d = new Date(props?.defaultValue);
    if (d instanceof Date && !Number.isNaN(d)) {
      return d;
    }
    return '';
  }, [props?.defaultValue]);

  return (
    <Controller
      name={props.name}
      control={props.control}
      rules={props.rules}
      defaultValue={defaultDate}
      render={({
        field: { onChange, onBlur, name: fieldName, value },
        fieldState: { error },
      }) => (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Label>{props?.label}</Label>
            <ActionButton
              disabled={props.disabled}
              text="Clear"
              onClick={() => {
                onChange('');
              }}
            />
          </div>
          <DatePicker
            {...props}
            textField={{
              name: fieldName,
              errorMessage: error && error.message,
            }}
            onSelectDate={(date) => {
              onChange(date);
            }}
            value={value ? new Date(value) : null}
            onBlur={onBlur}
            label={undefined}
            defaultValue={undefined}
          />
        </div>
      )}
    />
  );
};

const colorPickerStyles: Partial<IColorPickerStyles> = {
  panel: { padding: 12 },
  colorRectangle: { height: 268 },
};

const ControlledColorPicker: React.FC<HookFormProps & IColorPickerProps> = (
  props
) => {
  return (
    <Controller
      name={props.name}
      control={props.control}
      rules={props.rules}
      defaultValue={props.defaultValue || ''}
      render={({
        field: { onChange, value },
      }) => (
        <div style={{ width: 300 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Label>{props?.label}</Label>
            <Text>{value}</Text>
            <ActionButton
              disabled={props.disabled}
              text="Clear"
              onClick={() => {
                onChange('');
              }}
            />
          </div>
          <ColorPicker
            color={value}
            onChange={(e, color) => {
              onChange(color?.str);
            }}
            alphaType="alpha"
            showPreview
            styles={colorPickerStyles}
            strings={{
              alphaAriaLabel:
                'Alpha slider: Use left and right arrow keys to change value, hold shift for a larger jump',
              transparencyAriaLabel:
                'Transparency slider: Use left and right arrow keys to change value, hold shift for a larger jump',
              hueAriaLabel:
                'Hue slider: Use left and right arrow keys to change value, hold shift for a larger jump',
            }}
          />
        </div>
      )}
    />
  );
};

const ControlledCombobox: React.FC<HookFormProps & IComboBoxProps> = (
  props
) => {
  return (
    <Controller
      name={props.name}
      control={props.control}
      rules={props.rules}
      defaultValue={props.defaultValue || ''}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => {
        console.log(value);
        return <ComboBox
          {...props}
          selectedKey={value}
          onChange={(_, option) => {
            onChange(option.key);
          }}
          onBlur={onBlur}
          errorMessage={error && error.message}
          defaultValue={undefined}
          useComboBoxAsMenuWidth
        />
      }}
    />
  );
};

const ControlledChoiceGroup: React.FC<HookFormProps & IChoiceGroup> = (
  props
) => {
  return (
    <Controller
      name={props.name}
      control={props.control}
      rules={props.rules}
      defaultValue={props.defaultValue || ''}
      render={({
        field: { onChange, onBlur, value },
      }) => (
        <ChoiceGroup
          {...props}
          selectedKey={value}
          onChange={(_e, option) => {
            onChange(option.key);
          }}
          onBlur={onBlur}
          defaultValue={undefined}
        />
      )}
    />
  );
};

export {
  ControlledTextField,
  ControlledCheckbox,
  ControlledCombobox,
  ControlledDropdown,
  ControlledDatePicker,
  ControlledChoiceGroup,
  ControlledColorPicker,
};
