import { UseAsyncReturn } from 'react-async-hook';
import { SelectionMode } from '@fluentui/react';
import { IPermission } from '@shared/interfaces/permissions';
import React, { createContext, useContext, useState } from 'react';
import apiAxios, { useApiCallback } from '@admin/helpers/api';
import ExtendedSelection, {
  ItemsOrKeys,
  useSelection,
} from '@admin/helpers/selection';
import _ from 'lodash';

export interface IPermissionsContext {
  list: UseAsyncReturn<IPermission[], []>;
  selectedPermissions: IPermission[];
  selection: ExtendedSelection<IPermission>;
}

export interface IPermissionsContextProviderProps {
  defaultSelectedPermissions?: ItemsOrKeys<IPermission>;
  selectionMode?: SelectionMode;
}

export const PermissionsContext = createContext<IPermissionsContext>({} as any);

const PermissionsContextProvider: React.FC<IPermissionsContextProviderProps> =
  ({
    children,
    defaultSelectedPermissions = [],
    selectionMode = SelectionMode.multiple,
  }) => {
    const [selectedPermissions, setSelectedPermissions] = useState<
      IPermission[]
    >([]);

    const selection = useSelection<IPermission>({
      getKey: (permission) => permission.id,
      onSelectionChanged: () => {
        setSelectedPermissions(selection.getSelection());
      },
      defaultSelectedItems: defaultSelectedPermissions,
      selectionMode,
    });

    const list = useApiCallback(async () => {
      const response = await apiAxios.get('/permissions');
      selection.setItems(_.flatten(_.map(response.data, 'children')));
      return response;
    });

    return (
      <PermissionsContext.Provider
        value={{
          list,
          selection,
          selectedPermissions,
        }}
      >
        {children}
      </PermissionsContext.Provider>
    );
  };

const usePermissions = () => useContext(PermissionsContext);

export { usePermissions, PermissionsContextProvider };
