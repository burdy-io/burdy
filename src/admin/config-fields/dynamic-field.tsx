import React, { useMemo } from 'react';
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
import DynamicTextEditor from '@admin/config-fields/dynamic-text-editor';
import DynamicReferences from '@admin/config-fields/dynamic-references';
import DynamicReference from '@admin/config-fields/dynamic-reference';

interface DynamicFieldProps {
  field: any;
  name?: string;
}

const Field: React.FC<DynamicFieldProps> = ({field, name}) => {
  const { disabled, control } = useExtendedFormContext();
  switch (field?.type) {
    case 'group':
      return <DynamicGroup field={field} name={name} />;
    case 'repeatable':
      return <DynamicRepeatable field={field} name={name} />;
    case 'custom':
      return <DynamicComponent field={field} name={name} />;
    case 'relation':
      return <DynamicRelation field={field} name={name} />;
    case 'reference_single':
      return <DynamicReference field={field} name={name} />;
    case 'reference_multiple':
      return <DynamicReferences field={field} name={name} />;
    case 'zone':
      return <DynamicZone field={field} name={name} />;
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
          name={name}
        />
      );
    case 'richtext':
      return (
        <DynamicRichText field={field} control={control} name={name} />
      );
    // Controlled
    case 'checkbox':
      return (
        <ControlledCheckbox
          control={control}
          {...field}
          name={name}
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
          name={name}
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
          name={name}
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
          name={name}
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
          name={name}
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
          name={name}
          disabled={disabled}
        />
      );
    case 'text-editor':
      return (
        <DynamicTextEditor
          control={control}
          field={field}
          name={name}
          disabled={disabled}
        />
      );
    // Helper
    case 'post_type_dropdown':
      return (
        <ControlledPostTypesDropdown
          control={control}
          {...field}
          name={name}
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
          name={name}
        />
      );
    default: {
      const Component =
        Hooks.applySyncFilters(`admin/field/${field.type}`, null, field) ??
        null;
      if (!Component) return null;
      return <Component field={field} name={name} />;
    }
  }
}

const DynamicField: React.FC<DynamicFieldProps> = ({ field, name }) => {
  const fieldName = useMemo<string>(() => {
    return name?.length ? `${name}.${field?.name}` : field?.name;
  }, [name, field?.name]);

  const { control } = useExtendedFormContext();

  return (
    <div>
      <Controller
        name={`${fieldName}_$type`}
        control={control}
        defaultValue={field?.type}
        render={() => null}
      />
      <ErrorBoundary message={`Field ${fieldName} errored. Please check console for more details`}>
        <Field name={fieldName} field={field} />
      </ErrorBoundary>
    </div>
  );
};

export default DynamicField;
