import { useAsyncCallback } from 'react-async-hook';
import defer from 'defer-promise';
import React, { createContext, useContext, useState } from 'react';
import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  PrimaryButton,
} from '@fluentui/react';

interface DialogContextInterface {
  confirm: (title: string, message: string) => Promise<void>;
}

const DialogContext = createContext<DialogContextInterface>({} as any);

const DialogContextProvider = ({ children }) => {
  const [deferred, setDeferred] =
    useState<DeferPromise.Deferred<void>>(undefined);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const confirm = useAsyncCallback(async (title: string, message: string) => {
    try {
      const deferrer = defer<void>();
      setDeferred(deferrer);
      setTitle(title);
      setMessage(message);
      setOpen(true);

      await deferrer.promise;
    } finally {
      setOpen(false);
    }
  });

  return (
    <DialogContext.Provider
      value={{
        confirm: confirm.execute,
      }}
    >
      <Dialog
        hidden={!open}
        title={title}
        type={DialogType.close}
        onDismiss={() => deferred?.reject('cancelled')}
        styles={{
          main: {
            minHeight: 0,
          },
        }}
      >
        {message}
        <DialogFooter>
          <PrimaryButton data-cy="dialog-confirm" onClick={() => deferred?.resolve()}>
            Confirm
          </PrimaryButton>
          <DefaultButton data-cy="dialog-cancel" onClick={() => deferred?.reject('cancelled')}>
            Cancel
          </DefaultButton>
        </DialogFooter>
      </Dialog>
      {children}
    </DialogContext.Provider>
  );
};

const useDialog = () => useContext(DialogContext);

export { useDialog, DialogContextProvider };
