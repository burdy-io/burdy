import React, { useEffect } from 'react';
import Heading from '@admin/components/heading';
import { composeWrappers } from '@admin/helpers/hoc';
import ContentTypeCreatePanel from '@admin/features/content-types/components/content-type-create-panel';
import {
  ContentTypesContextProvider,
  useContentTypes
} from '../context/content-types.context';
import ContentTypesList from '../components/content-types-list';
import ContentTypesCommandBar from '../components/content-types-command-bar';
import ContentTypeUpdatePanel from '../components/content-type-update-panel';
import ContentTypesDeleteDialog from '../components/content-types-delete-dialog';
import ContentTypesImportDialog from '@admin/features/content-types/components/content-type-import-dialog';
import { Pivot, PivotItem } from '@fluentui/react';

const ContentTypesPage = () => {
  const {
    selectedContentTypes,
    getContentTypes,
    contentTypesState,

    stateData,
    setStateData,

    params,
    setParams
  } = useContentTypes();

  useEffect(() => {
    getContentTypes.execute();
  }, []);

  const filters = [
    {
      name: 'All',
      key: 'all'
    },
    {
      name: 'Pages',
      key: 'page'
    },
    {
      name: 'Components',
      key: 'component'
    },
    {
      name: 'Posts',
      key: 'post'
    },
    {
      name: 'Fragments',
      key: 'fragment'
    }
  ];

  return (
    <div className='page-wrapper'>
      <ContentTypesCommandBar />
      <div
        className='page-content page-content-scroll'
        style={{ padding: '0 1rem' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <div style={{ marginRight: 10 }}>
            <Heading title='Content Types' />
          </div>
          <Pivot
            selectedKey={params?.type?.length > 0 ? params?.type : 'all'}
            headersOnly
            aria-label='Basic Pivot'
            onLinkClick={(item) => {
              const key = item?.props?.itemKey;
              const type = key?.length > 0 && key !== 'all' ? key : undefined;
              setParams({
                ...(params || {}),
                type
              });
              getContentTypes.execute({
                ...(params || {}),
                type
              });
            }}
          >
            {filters.map((item) => (
              <PivotItem
                key={item.key}
                itemKey={item.key}
                headerText={item?.name?.length > 0 ? item?.name : item?.key}
                style={{ paddingTop: 20 }}
              />
            ))}
          </Pivot>
        </div>
        <ContentTypesList />
      </div>

      <ContentTypeCreatePanel
        isOpen={stateData?.createContentTypeOpen}
        defaultType={params?.type}
        onDismiss={() => {
          setStateData('createContentTypeOpen', false);
        }}
        onCreated={(data) => {
          setStateData('createContentTypeOpen', false);
          if (params?.type === data?.type) {
            contentTypesState.create([data]);
          } else {
            setParams({});
            getContentTypes.execute();
          }
        }}
      />
      <ContentTypeUpdatePanel
        isOpen={stateData?.updateContentTypeOpen}
        contentTypeId={selectedContentTypes[0]?.id}
        onDismiss={() => {
          setStateData('updateContentTypeOpen', false);
        }}
        onUpdated={(data) => {
          setStateData('updateContentTypeOpen', false);
          contentTypesState.update([data]);
        }}
      />
      <ContentTypesDeleteDialog
        isOpen={stateData?.deleteContentTypesOpen}
        onDismiss={() => {
          setStateData('deleteContentTypesOpen', false);
        }}
        onDeleted={() => {
          setStateData('deleteContentTypesOpen', false);
        }}
      />
      <ContentTypesImportDialog
        isOpen={stateData?.importContentTypesOpen}
        onDismiss={() => {
          setStateData('importContentTypesOpen', false);
        }}
        onImported={() => {
          setStateData('importContentTypesOpen', false);
          setParams({});
          getContentTypes.execute();
        }}
      />
    </div>
  );
};

export default composeWrappers({
  contentTypesContext: ContentTypesContextProvider
})(ContentTypesPage);
