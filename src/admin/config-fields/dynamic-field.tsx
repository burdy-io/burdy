import React, { useCallback } from 'react';
import {
  ControlledCheckbox,
  ControlledChoiceGroup,
  ControlledColorPicker,
  ControlledDatePicker,
  ControlledDropdown,
  ControlledTextField
} from '@admin/components/rhf-components';
import ControlledComponentsDropdown from '@admin/features/content-types/components/controlled-components-dropdown';
import ControlledPostTypesDropdown from '@admin/features/content-types/components/controlled-post-types-dropdown';
import { SelectionMode } from '@fluentui/react';
import { Controller } from 'react-hook-form';
import Hooks from '@shared/features/hooks';
import DynamicComponent from './dynamic-component';
import DynamicGroup from './dynamic-group';
import DynamicRepeatable from './dynamic-repeatable';
import DynamicRelation from './dynamic-relation';
import DynamicZone from './dynamic-zone';
import DynamicAssets from './dynamic-assets';
import DynamicRichText from './dynamic-richtext';
import { useExtendedFormContext } from './dynamic-form';
import ErrorBoundary from '@admin/components/error-boundary';
import { isTrue } from '@admin/helpers/utility';

interface DynamicFieldProps {
  field: any;
  name?: string;
}

const DynamicField: React.FC<DynamicFieldProps> = ({ field, name }) => {
  const getName = () => {
    return name?.length ? `${name}.${field?.name}` : field?.name;
  };

  const { disabled, control } = useExtendedFormContext();

  const Field = useCallback(() => {
    switch (field?.type) {
      case 'group':
        return <DynamicGroup field={field} name={`${getName()}`} />;
      case 'repeatable':
        return <DynamicRepeatable field={field} name={`${getName()}`} />;
      case 'custom':
        return <DynamicComponent field={field} name={getName()} />;
      case 'relation':
        return <DynamicRelation field={field} name={getName()} />;
      case 'zone':
        return <DynamicZone field={field} name={getName()} />;
      case 'images':
      case 'assets':
        return (
          <DynamicAssets
            field={field}
            selectionMode={
              isTrue(field.multiSelect) ? SelectionMode.multiple : SelectionMode.single
            }
            mimeTypes={
              field?.type === 'images'
                ? ['image/jpeg', 'image/webp', 'image/png', 'image/gif', 'image/svg+xml']
                : null
            }
            name={getName()}
          />
        );
      case 'richtext':
        return (
          <DynamicRichText field={field} control={control} name={getName()} />
        );
      // Controlled
      case 'checkbox':
        return (
          <ControlledCheckbox
            control={control}
            {...field}
            name={getName()}
            disabled={disabled}
          />
        );
      case 'text':
      case 'number':
        return (
          <ControlledTextField
            control={control}
            {...field}
            rules={{
              required: field?.required == 'true' ? 'Field is required' : false
            }}
            name={getName()}
            disabled={disabled}
          />
        );
      case 'datepicker':
        return (
          <ControlledDatePicker
            control={control}
            {...field}
            rules={{
              required: field?.required ? 'Field is required' : false
            }}
            name={getName()}
            disabled={disabled}
          />
        );
      case 'colorpicker':
        return (
          <ControlledColorPicker
            control={control}
            {...field}
            rules={{
              required: field?.required ? 'Field is required' : false
            }}
            name={getName()}
            disabled={disabled}
          />
        );
      case 'dropdown':
        return (
          <ControlledDropdown
            control={control}
            {...field}
            rules={{
              required: field?.required ? 'Field is required' : false
            }}
            options={(field?.options ?? '')
              .split('\n')
              .map((val) => ({ key: val, text: val }))}
            name={getName()}
            disabled={disabled}
          />
        );
      case 'choicegroup':
        return (
          <ControlledChoiceGroup
            control={control}
            {...field}
            options={(field?.options ?? '')
              .split('\n')
              .map((val) => ({ key: val, text: val }))}
            name={getName()}
            disabled={disabled}
          />
        );
      // Helper
      case 'post_type_dropdown':
        return (
          <ControlledPostTypesDropdown
            control={control}
            {...field}
            name={getName()}
          />
        );
      case 'components_dropdown':
        return (
          <ControlledComponentsDropdown
            control={control}
            {...field}
            rules={{
              required: field?.required ? 'Field is required' : false
            }}
            name={getName()}
          />
        );
      default: {
        const Component =
          Hooks.applySyncFilters(`admin/field/${field.name}`, null, field) ??
          null;
        if (!Component) return null;
        return <Component field={field} name={getName()} />;
      }
    }
  }, [JSON.stringify(field), control, getName()]);

  return (
    <div>
      <Controller
        name={`${getName()}_$type`}
        control={control}
        defaultValue={field?.type}
        render={() => null}
      />
      <ErrorBoundary message={`Field ${getName()} errored. Please check console for more details`}>
        <Field />
      </ErrorBoundary>
    </div>
  );
};

export default DynamicField;
