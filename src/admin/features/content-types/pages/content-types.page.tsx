import React, { useEffect } from 'react';
import Heading from '@admin/components/heading';
import { composeWrappers } from '@admin/helpers/hoc';
import { useSettings } from '@admin/context/settings';
import ContentTypeCreatePanel from '@admin/features/content-types/components/content-type-create-panel';
import {
  ContentTypesContextProvider,
  useContentTypes,
} from '../context/content-types.context';
import ContentTypesList from '../components/content-types-list';
import ContentTypesCommandBar from '../components/content-types-command-bar';
import ContentTypeUpdatePanel from '../components/content-type-update-panel';
import ContentTypesDeleteDialog from '../components/content-types-delete-dialog';

const ContentTypesPage = () => {
  const {
    selectedContentTypes,
    getContentTypes,
    contentTypesState,

    stateData,
    setStateData,
  } = useContentTypes();

  useEffect(() => {
    getContentTypes.execute();
  }, []);

  const { getContentTypes: getGlobalContentTypes } = useSettings();

  return (
    <div className="page-wrapper">
      <ContentTypesCommandBar />
      <div
        className="page-content page-content-scroll"
        style={{ padding: '0 1rem' }}
      >
        <Heading title="Content Types" />
        <ContentTypesList />
      </div>

      <ContentTypeCreatePanel
        isOpen={stateData?.createContentTypeOpen}
        onDismiss={() => {
          setStateData('createContentTypeOpen', false);
        }}
        onCreated={(data) => {
          setStateData('createContentTypeOpen', false);
          contentTypesState.create([data]);
          getGlobalContentTypes.execute({
            type: 'post',
          });
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
          getGlobalContentTypes.execute({
            type: 'post',
          });
        }}
      />
      <ContentTypesDeleteDialog
        isOpen={stateData?.deleteContentTypesOpen}
        onDismiss={() => {
          setStateData('deleteContentTypesOpen', false);
        }}
        onDeleted={(data) => {
          setStateData('deleteContentTypesOpen', false);
          contentTypesState.delete(data as number[]);
          getGlobalContentTypes.execute({
            type: 'post',
          });
        }}
      />
    </div>
  );
};

export default composeWrappers({
  contentTypesContext: ContentTypesContextProvider,
})(ContentTypesPage);
