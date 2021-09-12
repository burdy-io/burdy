import GroupSelect, {
  IGroupSelectProps,
} from '@admin/features/groups/components/group-select';
import { IGroup } from '@shared/interfaces/model';
import BackPanel, { IBackPanelProps } from '@admin/components/back-panel';
import {
  GroupsContextProvider,
  IGroupsContext,
  useGroups,
} from '@admin/features/groups/context/groups.context';
import React, { forwardRef, useCallback, useImperativeHandle } from 'react';
import {
  DefaultButton,
  PanelType,
  PrimaryButton,
  Stack,
} from '@fluentui/react';
import { composeWrappers } from '@admin/helpers/hoc';

interface IGroupSelectPanelProps extends IGroupSelectProps {
  onDismiss?: () => void;
  onSubmit?: (users: IGroup[]) => void;
  onBack?: IBackPanelProps['onBack'];
  isOpen?: IBackPanelProps['isOpen'];
  panelProps?: Omit<IBackPanelProps, 'onBack' | 'isOpen'>;
}

interface IGroupSelectPanelRef {
  groupsContext: IGroupsContext;
}

const GroupSelectPanel = forwardRef<
  IGroupSelectPanelRef,
  IGroupSelectPanelProps
>(
  (
    {
      panelProps = {},
      listProps = { visibleColumns: ['id', 'name', 'description'] },
      commandBarProps = { visibleColumns: ['refresh'] },
      suppressDefaultUpdates = false,
      onDismiss,
      onSubmit,
      onBack,
      isOpen,
    },
    ref
  ) => {
    const groupsContext = useGroups();
    const { selectedGroups } = groupsContext;

    useImperativeHandle(ref, () => ({
      groupsContext,
    }));

    const onRenderFooterContent = useCallback(
      () => (
        <Stack horizontal tokens={{ childrenGap: 10 }}>
          <PrimaryButton
            disabled={selectedGroups.length === 0}
            onClick={() => onSubmit?.(selectedGroups)}
          >
            Select
          </PrimaryButton>
          <DefaultButton onClick={() => (onBack ? onBack?.() : onDismiss?.())}>
            Cancel
          </DefaultButton>
        </Stack>
      ),
      [selectedGroups, onSubmit, onDismiss]
    );

    return (
      <BackPanel
        title="Select groups"
        isFooterAtBottom
        onRenderFooterContent={onRenderFooterContent}
        onDismiss={onDismiss}
        onBack={onBack}
        type={PanelType.medium}
        isOpen={isOpen}
        {...panelProps}
      >
        <GroupSelect
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
  groupsContext: GroupsContextProvider,
})(GroupSelectPanel);
