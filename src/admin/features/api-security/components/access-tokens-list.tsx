import {
  DefaultButton,
  makeStyles,
  MarqueeSelection,
  ShimmeredDetailsList,
  Stack,
  TextField,
} from '@fluentui/react';
import React, { useEffect } from 'react';
import { useApiSecurity } from '@admin/features/api-security/context/api-security.context';
import copy from 'copy-text-to-clipboard';

const useStyles = makeStyles({
  accessTokensList: {
    ':global(.ms-DetailsRow-fields)': {
      alignItems: 'center !important',
    },
    ':global(.ms-DetailsRow-check)': {
      height: '100% !important',
    },
  },
});

const AccessTokensList = () => {
  const { selection, listAccessTokens, accessTokens } = useApiSecurity();

  const styles = useStyles();

  useEffect(() => {
    listAccessTokens.execute();
  }, []);

  const columns = [
    {
      key: 'name',
      name: 'Name',
      fieldName: 'name',
      minWidth: 120,
    },
    {
      key: 'token',
      name: 'Token',
      minWidth: 300,
      onRender: (item) => {
        return (
          <TextField
            readOnly
            id={`${item?.token}`}
            value={item?.token}
            type="text"
            styles={{
              suffix: {
                padding: 0,
              },
              fieldGroup: {
                borderRight: 'none',
              },
            }}
            onRenderSuffix={() => (
              <Stack horizontal>
                <DefaultButton
                  iconProps={{ iconName: 'Copy' }}
                  style={{ minWidth: 0, padding: '0 4px' }}
                  onClick={() => {
                    copy(item?.token);
                  }}
                />
              </Stack>
            )}
          />
        );
      },
    },
    {
      key: 'createdAt',
      name: 'Created At',
      fieldName: 'createdAt',
      minWidth: 120,
    },
  ];

  return (
    <div className={styles.accessTokensList}>
      <MarqueeSelection
        selection={selection as any}
        isDraggingConstrainedToRoot
      >
        <ShimmeredDetailsList
          enableShimmer={listAccessTokens?.loading}
          selection={selection as any}
          selectionMode={selection.mode}
          setKey="multiple"
          selectionPreservedOnEmptyClick
          items={accessTokens ?? []}
          columns={columns}
        />
      </MarqueeSelection>
    </div>
  );
};

export default AccessTokensList;
