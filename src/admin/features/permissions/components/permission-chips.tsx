import { IPermission } from '@shared/interfaces/permissions';
import React from 'react';
import { Stack, TooltipHost } from '@fluentui/react';

interface IPermissionChipsProps {
  permissions: IPermission[];
}

const PermissionChips: React.FC<IPermissionChipsProps> = ({ permissions }) => (
  <Stack horizontal wrap tokens={{ childrenGap: 12 }} data-cy="permissions-chips">
    {permissions.map((permission) => (
      <TooltipHost key={permission.id} content={permission.id}>
        <div className="chip" data-cy="permissions-chips-item">{permission.name}</div>
      </TooltipHost>
    ))}
  </Stack>
);

export default PermissionChips;
