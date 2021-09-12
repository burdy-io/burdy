import {
  IUsersContext,
  UsersContextProvider,
  useUsers,
} from '@admin/features/users/context/users.context';
import React, { forwardRef, useCallback, useImperativeHandle } from 'react';
import {
  DefaultButton,
  PanelType,
  PrimaryButton,
  Stack,
} from '@fluentui/react';
import { IUser } from '@shared/interfaces/model';
import BackPanel, { IBackPanelProps } from '@admin/components/back-panel';
import { composeWrappers } from '@admin/helpers/hoc';
import UserSelect, {
  IUserSelectProps,
} from '@admin/features/users/components/user-select';

export interface IUserSelectPanelProps extends IUserSelectProps {
  onDismiss?: () => void;
  onSubmit?: (users: IUser[]) => void;
  onBack?: IBackPanelProps['onBack'];
  isOpen?: IBackPanelProps['isOpen'];
  panelProps?: Omit<IBackPanelProps, 'onBack' | 'isOpen'>;
}

export interface IUserSelectPanelRef {
  usersContext: IUsersContext;
}

const UserSelectPanel = forwardRef<IUserSelectPanelRef, IUserSelectPanelProps>(
  (
    {
      panelProps = {},
      listProps = { visibleColumns: ['avatar', 'staticDisplayName'] },
      commandBarProps = { visibleColumns: ['search', 'refresh'] },
      suppressDefaultUpdates = false,
      onDismiss,
      onSubmit,
      onBack,
      isOpen,
    },
    ref
  ) => {
    const usersContext = useUsers();
    const { selectedUsers } = usersContext;

    useImperativeHandle(ref, () => ({
      usersContext,
    }));

    const onRenderFooterContent = useCallback(
      () => (
        <Stack horizontal tokens={{ childrenGap: 10 }}>
          <PrimaryButton
            disabled={selectedUsers.length === 0}
            onClick={() => onSubmit?.(selectedUsers)}
          >
            Select
          </PrimaryButton>
          <DefaultButton onClick={() => (onBack ? onBack?.() : onDismiss?.())}>
            Cancel
          </DefaultButton>
        </Stack>
      ),
      [selectedUsers, onSubmit, onDismiss, onBack]
    );

    return (
      <BackPanel
        title="Select users"
        isFooterAtBottom
        onRenderFooterContent={onRenderFooterContent}
        onDismiss={onDismiss}
        onBack={onBack}
        type={PanelType.medium}
        isOpen={isOpen}
        {...panelProps}
      >
        <UserSelect
          listProps={listProps}
          commandBarProps={commandBarProps}
          suppressDefaultUpdates={suppressDefaultUpdates}
          unwrap
        />
      </BackPanel>
    );
  }
);

export default composeWrappers({
  usersContext: UsersContextProvider,
})(UserSelectPanel);
