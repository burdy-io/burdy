import { composeWrappers } from '@admin/helpers/hoc';
import {
  CommandBar,
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  ICommandBarItemProps,
  MessageBar,
  MessageBarType,
  NeutralColors,
  PrimaryButton,
  SearchBox,
  SelectionMode,
  Stack
} from '@fluentui/react';
import React, { useEffect, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { PostsContextProvider, usePosts } from '../context/posts.context';
import { IPost } from '@shared/interfaces/model';
import ColumnsView from '@admin/components/columns';
import SitesList from '@admin/features/posts/components/sites-list';
import { ControlledCheckbox, ControlledTextField } from '@admin/components/rhf-components';
import { useForm } from 'react-hook-form';
import { slugRegex, slugRegexMessage } from '@shared/validators';

interface ISitesCopyDialogProps {
  post?: IPost;
  isOpen?: boolean;
  onDismiss?: () => void;
  onCreated?: (data?: any) => void;
}

const SitesCopyDialog: React.FC<ISitesCopyDialogProps> = ({
                                                            isOpen,
                                                            post,
                                                            onDismiss,
                                                            onCreated
                                                          }) => {
  const { getPosts, postsState, selectedPosts, params, setParams, selection, posts, copyPosts } = usePosts();
  const { control, handleSubmit, reset } = useForm();
  useEffect(() => {
    postsState.setArrayState([]);
    getPosts.reset();
    setParams({
      search: ''
    });
    copyPosts.reset();
    if (isOpen) {
      reset({
        name: post?.name,
        slug: post?.slug,
        recursive: true,
      });
      getPosts.execute({
        type: 'folder,page,fragment'
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && copyPosts?.result) {
      onCreated(copyPosts?.result);
    }
  }, [copyPosts?.result]);

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
        title: 'Copy items'
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
          <div style={{ width: 260, padding: 10, borderLeft: `1px solid ${NeutralColors.gray30}` }}>
            <Stack tokens={{ childrenGap: 10 }}>
              {copyPosts.error?.message && (
                <MessageBar messageBarType={MessageBarType.error}>
                  {copyPosts.error.message}
                </MessageBar>
              )}
              <span>Source: {post?.slugPath}</span>
              <span>Target: {selectedPosts?.[0]?.slugPath || <i>Root</i>}</span>
              <ControlledTextField control={control} name='name' label='Name' defaultValue={post?.name} rules={{
                required: 'Name is required'
              }} />
              <ControlledTextField control={control} name='slug' label='Slug' defaultValue={post?.slug} rules={{
                required: 'Slug is required',
                pattern: {
                  value: slugRegex,
                  message: slugRegexMessage,
                }
              }} />
              <ControlledCheckbox control={control} name='recursive' label='Include children' />
            </Stack>
          </div>
        </div>
      </div>
      <DialogFooter>
        <DefaultButton onClick={onDismiss} text='Cancel' />
        <PrimaryButton
          onClick={() => {
            handleSubmit((data) => {
              copyPosts.execute(post.id, {
                ...data,
                parentId: selectedPosts?.[0]?.id,
              })
            })();
          }}
          text='Copy'
          disabled={getPosts?.loading || selectedPosts?.length > 1}
        />
      </DialogFooter>
    </Dialog>
  );
};

export default composeWrappers({
  postsContext: PostsContextProvider
})(SitesCopyDialog);
