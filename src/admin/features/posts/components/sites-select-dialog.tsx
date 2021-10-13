import { composeWrappers } from '@admin/helpers/hoc';
import {
  CommandBar,
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  ICommandBarItemProps,
  NeutralColors,
  PrimaryButton,
  SearchBox,
} from '@fluentui/react';
import React, { useEffect, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { PostsContextProvider, usePosts } from '../context/posts.context';
import { IPost } from '@shared/interfaces/model';
import ColumnsView from '@admin/components/columns';
import SitesList from '@admin/features/posts/components/sites-list';

export interface ISitesSelectDialogProps {
  post?: IPost;
  isOpen?: boolean;
  onDismiss?: () => void;
  onSelected?: (data?: any) => void;
}

const SitesSelectDialog: React.FC<ISitesSelectDialogProps> = ({
                                                            isOpen,
                                                            post,
                                                            onDismiss,
                                                            onSelected
                                                          }) => {
  const { getPosts, postsState, selectedPosts, params, setParams, selection, posts } = usePosts();
  useEffect(() => {
    postsState.setArrayState([]);
    getPosts.reset();
    setParams({
      search: ''
    });
    if (isOpen) {
      getPosts.execute({
        type: 'folder,page,fragment'
      });
    }
  }, [isOpen]);

  const debounced = useDebouncedCallback(async (val) => {
    setParams({
      search: val
    });
    getPosts.execute({
      type: 'folder,page,fragment',
      search: val
    });
  }, 500);

  const farToolbarItems = useMemo<ICommandBarItemProps[]>(
    () => [
      {
        key: 'search',
        onRenderIcon: () => (
          <SearchBox
            placeholder='Search posts...'
            onChange={(_event, newValue) => {
              debounced(newValue);
            }}
          />
        )
      }
    ],
    []
  );

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: 'Select items'
      }}
      maxWidth='90vw'
    >
      <div
        style={{
          height: 400,
          maxHeight: '80vh',
          width: 800,
          maxWidth: '80vw',
          overflow: 'auto'
        }}
      >
        <CommandBar
          items={[]}
          style={{ borderBottom: `1px solid ${NeutralColors.gray30}` }}
          farItems={farToolbarItems}
        />
        <div style={{ height: 'calc(100% - 45px)', display: 'flex', flexDirection: 'row' }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {!params?.search?.length && <ColumnsView
              loading={getPosts?.loading}
              selection={selection}
              sort={(a, b) => {
                if (!a?.updatedAt || !b?.updatedAt) return 0;
                return (new Date(b.updatedAt)).getTime() - (new Date(a.updatedAt)).getTime();
              }}
              defaultSelected={[parseInt(`${post?.parentId}`, 10)]}
              items={(posts || []).map((item) => {
                let iconName: string;
                switch (item.type) {
                  case 'folder':
                    iconName = 'FolderHorizontal';
                    break;
                  case 'fragment':
                    iconName = 'WebAppBuilderFragment';
                    break;
                  case 'post_container':
                    iconName = 'ArrangeBringToFront';
                    break;
                  default:
                    iconName = 'Page';
                    break;
                }
                return {
                  ...item,
                  title: item?.name,
                  helper: item?.slug,
                  key: item.id,
                  iconProps: {
                    iconName
                  }
                };
              })}
            />}
            {params?.search?.length > 0 && <SitesList />}
          </div>
        </div>
      </div>
      <DialogFooter>
        <DefaultButton onClick={onDismiss} text='Cancel' />
        <PrimaryButton
          onClick={() => {
            onSelected(selectedPosts);
          }}
          text='Select'
          disabled={getPosts?.loading || selectedPosts?.length > 1}
        />
      </DialogFooter>
    </Dialog>
  );
};

export default composeWrappers({
  postsContext: PostsContextProvider
})(SitesSelectDialog);
