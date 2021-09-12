import React, { useEffect } from 'react';
import { composeWrappers } from '@admin/helpers/hoc';
import { SearchBox, Stack, StackItem } from '@fluentui/react';
import { useDebouncedCallback } from 'use-debounce';
import { useHistory, useLocation } from 'react-router';
import queryString from 'query-string';
import { AssetsContextProvider, useAssets } from '../context/assets.context';
import AssetsDetails from '../components/assets-details';
import AssetsCreateFolderDialog from '../components/assets-create-folder-dialog';
import AssetsDeleteDialog from '../components/assets-delete-dialog';
import AssetsRenameDialog from '../components/assets-rename-dialog';
import AssetsBreadcrumb from '../components/assets-breadcrumb';
import AssetsCommandBar from '../components/assets-command-bar';
import AssetsView from '../components/assets-view';
import AssetsDropzone from '../components/assets-dropzone';

const AssetsPage = () => {
  const { getAssets, getAncestors, setParams, params } = useAssets();

  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    const search = queryString.parse(location.search) as any;
    setParams(search);
    getAssets.execute(search);
    getAncestors.execute({
      id: search?.parentId || null,
    });
  }, []);

  useEffect(() => {
    history.push({
      search: queryString.stringify({ parentId: params?.parentId }),
    });
  }, [params?.parentId]);

  const debounced = useDebouncedCallback(async (val) => {
    setParams({
      ...(params || {}),
      search: val,
      parentId: null,
    });
    getAssets.execute({
      ...(params || {}),
      search: val,
      parentId: null,
    });
    getAncestors.execute();
  }, 500);

  return (
    <AssetsDropzone>
      <div className="page-wrapper">
        <AssetsCommandBar />
        <div
          className="page-content"
          style={{ padding: '0 1rem', overflowY: 'auto' }}
        >
          <Stack
            horizontal
            horizontalAlign="space-between"
            verticalAlign="center"
          >
            <StackItem grow shrink>
              <AssetsBreadcrumb />
            </StackItem>
            <StackItem>
              <SearchBox
                placeholder="Search assets..."
                onChange={(_event, newValue) => {
                  debounced(newValue);
                }}
              />
            </StackItem>
          </Stack>
          <AssetsView />
        </div>
      </div>
      <AssetsCreateFolderDialog />
      <AssetsDeleteDialog />
      <AssetsRenameDialog />
      <AssetsDetails />
    </AssetsDropzone>
  );
};

export default composeWrappers({
  assetsContext: AssetsContextProvider,
})(AssetsPage);
