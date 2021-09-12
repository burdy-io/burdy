import { IMessageBarProps, MessageBar, MessageBarType } from '@fluentui/react';
import React, { useCallback } from 'react';
import { UseAsyncReturn } from 'react-async-hook';

interface StatusBarProps extends IMessageBarProps {
  successMessage?: string;
  controller: UseAsyncReturn<any>;
}

const StatusBar: React.FC<StatusBarProps> = ({
  controller,
  successMessage,
  onDismiss,
  ...messageBarProps
}) => {
  const resetController = useCallback(() => {
    controller.reset();
  }, [controller]);

  const dismissAction = useCallback(
    (e) => {
      if (onDismiss) {
        onDismiss?.(e);
      } else {
        resetController();
      }
    },
    [resetController, onDismiss]
  );

  const Empty = useCallback(() => <></>, []);

  switch (controller.status) {
    case 'success':
      return successMessage ? (
        <MessageBar
          {...messageBarProps}
          onDismiss={dismissAction}
          messageBarType={MessageBarType.success}
        >
          {successMessage}
        </MessageBar>
      ) : (
        <Empty />
      );
    case 'error':
      return controller?.error?.message ? (
        <MessageBar
          {...messageBarProps}
          onDismiss={dismissAction}
          messageBarType={MessageBarType.error}
        >
          {controller.error.message}
        </MessageBar>
      ) : (
        <Empty />
      );
    default:
      return <Empty />;
  }
};

export default StatusBar;
