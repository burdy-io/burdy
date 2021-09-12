import React, {forwardRef, useImperativeHandle, useMemo} from 'react';
import {
  IPermissionsContext,
  PermissionsContextProvider,
  usePermissions,
} from '@admin/features/permissions/context/permissions.context';
import {
  IColumn,
  IGroup,
  MarqueeSelection,
  SelectionMode,
  ShimmeredDetailsList,
} from '@fluentui/react';
import {composeWrappers} from '@admin/helpers/hoc';

export interface IPermissionSelectProps {
}

export interface IPermissionSelectRef {
  permissionsContext: IPermissionsContext;
}

const PermissionSelect = forwardRef<IPermissionSelectRef,
  IPermissionSelectProps>(({}, ref) => {
  const permissionsContext = usePermissions();
  const {selection} = permissionsContext;

  useImperativeHandle(
    ref,
    () => ({
      permissionsContext,
    }),
    [permissionsContext.selectedPermissions]
  );

  const listGroups = useMemo(() => {
    if (!permissionsContext.list.result) return [];

    const groups: IGroup[] = [];
    let childIterator = 0;

    permissionsContext.list.result.forEach((permission) => {
      groups.push({
        key: permission.id,
        name: permission.name,
        startIndex: childIterator,
        level: 0,
        count: permission.children.length,
        isCollapsed: true,
      });

      childIterator += permission.children.length;
    });

    return groups;
  }, [permissionsContext.list.result]);

  const permissionsList = useMemo(
    () =>
      permissionsContext.list.result?.flatMap?.(({children}) => children) ??
      [],
    [permissionsContext.list.result]
  );

  const columns = useMemo<IColumn[]>(
    () => [
      {
        minWidth: 240,
        maxWidth: 240,
        fieldName: 'name',
        name: 'Usage',
        key: 'name',
      },
      {
        minWidth: 120,
        fieldName: 'id',
        name: 'Value',
        key: 'value',
      },
    ],
    []
  );

  return (
    <div data-cy="permissions-select">
      <MarqueeSelection selection={selection as any} isDraggingConstrainedToRoot>
        <ShimmeredDetailsList
          enableShimmer={permissionsContext.list?.loading}
          selection={selection as any}
          selectionMode={SelectionMode.multiple}
          setKey="multiple"
          selectionPreservedOnEmptyClick
          groups={listGroups}
          groupProps={{isAllGroupsCollapsed: true}}
          items={permissionsList}
          columns={columns}
        />
      </MarqueeSelection>
    </div>
  );
});

export default composeWrappers({
  permissionsContext: PermissionsContextProvider,
})(PermissionSelect);
