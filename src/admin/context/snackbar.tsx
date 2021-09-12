import React, { createContext, useContext, useEffect, useState } from 'react';
import { mergeStyleSets, MessageBar, MessageBarType } from '@fluentui/react';
import { uniqueId } from 'lodash';

const styles = mergeStyleSets({
  root: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    width: 300,
    maxWidth: '90%',
    margin: '8px auto',
    zIndex: 1100,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    width: '100%',
    '&:not(:last-child)': {
      marginBottom: 10,
    },
  },
});

const Message = ({ onDismiss, message, id, messageBarType, duration }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration || 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <MessageBar
      messageBarType={messageBarType}
      onDismiss={() => onDismiss(id)}
      dismissButtonAriaLabel="Close"
    >
      {message}
    </MessageBar>
  );
};

interface OpenProps {
  message: string;
  messageBarType?: MessageBarType;
  duration?: number;
}

interface SnackbarContextInterface {
  openSnackbar: (data: OpenProps) => string;
  closeSnackbar: (id: string) => void;
}

const SnackbarContext = createContext<SnackbarContextInterface>({} as any);

const SnackbarContextProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  const closeSnackbar = (id) => {
    setMessages((messages) => messages.filter((message) => message?.id !== id));
  };

  const openSnackbar = ({ message, messageBarType, duration = 6000 }) => {
    const id = uniqueId();

    const messageBar = {
      ...{
        messageBarType: MessageBarType.info,
      },
      ...{
        id,
        messageBarType,
        message,
        duration,
      },
    };

    setMessages([...messages, messageBar]);
    return id;
  };

  return (
    <SnackbarContext.Provider
      value={{
        openSnackbar,
        closeSnackbar,
      }}
    >
      {messages?.length > 0 && (
        <div className={styles.root}>
          {messages.map((message) => (
            <div key={message.id} className={styles.message}>
              <Message onDismiss={(id) => closeSnackbar(id)} {...message} />
            </div>
          ))}
        </div>
      )}
      {children}
    </SnackbarContext.Provider>
  );
};

const useSnackbar = () => useContext(SnackbarContext);

export { useSnackbar, SnackbarContextProvider };
