import {
  CommandBar,
  ICommandBarItemProps,
  NeutralColors,
} from '@fluentui/react';
import React, { useMemo, useState } from 'react';
import { useApiSecurity } from '@admin/features/api-security/context/api-security.context';
import AccessTokensDeleteDialog from '@admin/features/api-security/components/access-tokens-delete-dialog';
import AccessTokensGenerateDialog from '@admin/features/api-security/components/access-tokens-generate-dialog';

const AccessTokensCommandBar = () => {
  const { selectedAccessTokens } = useApiSecurity();

  const [openGenerate, setOpenGenerate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const toolbarItems = useMemo<ICommandBarItemProps[]>(
    () => [
      {
        key: 'generate',
        text: 'Generate',
        iconProps: {
          iconName: 'Add',
        },
        onClick: () => {
          setOpenGenerate(true);
        },
      },
      {
        key: 'delete',
        text: 'Delete',
        iconProps: {
          iconName: 'Delete',
        },
        disabled: !(selectedAccessTokens?.length > 0),
        onClick: () => {
          setOpenDelete(true);
        },
      },
    ],
    [selectedAccessTokens]
  );

  return (
    <div>
      <CommandBar
        items={toolbarItems}
        style={{ borderBottom: `1px solid ${NeutralColors.gray30}` }}
      />
      <AccessTokensDeleteDialog
        isOpen={openDelete}
        onDismiss={() => setOpenDelete(false)}
        onDeleted={() => setOpenDelete(false)}
      />
      <AccessTokensGenerateDialog
        isOpen={openGenerate}
        onDismiss={() => setOpenGenerate(false)}
        onGenerate={() => {
          setOpenGenerate(false);
        }}
      />
    </div>
  );
};

export default AccessTokensCommandBar;
