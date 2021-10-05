import React, {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import {
  FormProvider,
  useForm, useFormContext,
  UseFormReturn
} from 'react-hook-form';
import DynamicGroup from './dynamic-group';

interface IFormHelperContext {
  disabled: boolean;
  setDisabled: (disabled: boolean) => void;
  narrow: boolean;
  setNarrow: (narrow: boolean) => void;
}

const FormHelperContext = createContext<IFormHelperContext & UseFormReturn>(
  {} as any
);

interface IFormHelperContextProviderProps {
  disabled?: boolean;
  narrow?: boolean;
}

const FormHelperContextProvider: React.FC<IFormHelperContextProviderProps> = ({
  disabled: propsDisabled,
  narrow: propsNarrow,
  children,
}) => {
  const [disabled, setDisabled] = useState<boolean>(propsDisabled);
  const [narrow, setNarrow] = useState<boolean>(propsNarrow);
  const formContext = useFormContext();

  useEffect(() => {
    setDisabled(propsDisabled);
  }, [propsDisabled]);

  return (
    <FormHelperContext.Provider
      value={{
        disabled,
        setDisabled,
        narrow,
        setNarrow,
        ...formContext,
      }}
    >
      {children}
    </FormHelperContext.Provider>
  );
};

const useExtendedFormContext = () => useContext(FormHelperContext);

export { useExtendedFormContext, FormHelperContextProvider };

interface IDynamicFormProps {
  field?: any;
  name?: string;
  disabled?: boolean;
  narrow?: boolean;
  defaultValues?: any;
  onChange?: (data?: any) => void;
}

const DynamicForm = forwardRef<any, IDynamicFormProps>(
  ({ field, name, defaultValues, onChange, disabled = false, narrow = false }, ref) => {
    const methods = useForm({
      mode: 'all',
      defaultValues,
    });

    useImperativeHandle(
      ref,
      () => ({
        getForm() {
          return methods;
        },
      }),
      []
    );

    useEffect(() => {
      onChange(methods.getValues());
    }, [JSON.stringify(methods.watch())]);

    return (
      <FormProvider {...methods}>
        <FormHelperContextProvider disabled={disabled} narrow={narrow}>
          <DynamicGroup name={name} field={field} />
        </FormHelperContextProvider>
      </FormProvider>
    );
  }
);

export default DynamicForm;
