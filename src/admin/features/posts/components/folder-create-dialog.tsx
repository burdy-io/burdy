import {ControlledDropdown, ControlledTextField} from '@admin/components/rhf-components';
import {ContentTypesContextProvider} from '@admin/features/content-types/context/content-types.context';
import {PostsContextProvider, usePosts} from '@admin/features/posts/context/posts.context';
import {composeWrappers} from '@admin/helpers/hoc';
import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Stack,
} from '@fluentui/react';
import React, {useEffect, useMemo} from 'react';
import {Control, useForm} from 'react-hook-form';
import slugify from 'slugify';
import {slugRegex, slugRegexMessage} from '@shared/validators';

interface ISelectParentProps {
  control: Control;
}

const SelectParentImpl: React.FC<ISelectParentProps> = ({control}) => {
  const {getPosts} = usePosts();
  const pages = useMemo(() => {
    return [
      {
        key: null,
        text: '-- None --',
      },
      ...(getPosts?.result || []).map((page) => ({
        key: page.id,
        text: `${page.name} (${page.slug})`,
      })),
    ];
  }, [getPosts?.result]);

  useEffect(() => {
    getPosts.execute({
      type: 'page,folder,fragment',
    });
  }, []);

  return (
    <ControlledDropdown
      disabled={getPosts?.loading}
      name="parentId"
      label="Parent"
      placeHolder="Select parent"
      control={control}
      defaultValue={null}
      options={pages}
    />
  );
};

const SelectParent = composeWrappers({
  postsContext: PostsContextProvider,
})(SelectParentImpl);

interface IFolderCreateDialog {
  isOpen?: boolean;
  defaultValues?: any;
  onDismiss?: () => void;
  onCreated?: (data?: any) => void;
}

const FolderCreateDialog: React.FC<IFolderCreateDialog> = ({
                                                             isOpen,
                                                             defaultValues,
                                                             onDismiss,
                                                             onCreated,
                                                           }) => {
  const {createPost} = usePosts();

  const {control, handleSubmit, reset, watch, formState, setValue} = useForm({
    mode: 'all',
  });

  useEffect(() => {
    if (!formState?.dirtyFields?.slug && watch('name')) {
      const parsed = slugify(watch('name'), {
        replacement: '-',
        remove: undefined,
        lower: true,
      });

      setValue('slug', parsed);
    }
  }, [watch('name')]);

  useEffect(() => {
    createPost.reset();
    reset(defaultValues);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && createPost?.result) {
      onCreated(createPost?.result);
    }
  }, [createPost?.result]);

  const submit = handleSubmit((data) => {
    createPost.execute({
      ...data,
      type: 'folder',
    });
  })

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: 'Create folder',
      }}
      modalProps={{
        styles: {main: {maxWidth: 500}},
      }}
    >
      <form onSubmit={submit}>
        <Stack
          tokens={{
            childrenGap: 8,
          }}
        >
          {createPost.error?.message && (
            <MessageBar messageBarType={MessageBarType.error}>
              {createPost.error.message}
            </MessageBar>
          )}
          <ControlledTextField
            rules={{
              required: 'Name is required',
            }}
            name="name"
            label="Name"
            control={control}
          />
          <ControlledTextField
            name="slug"
            label="Slug"
            control={control}
            rules={{
              required: 'Slug is required',
              pattern: {
                value: slugRegex,
                message: slugRegexMessage,
              }
            }}
          />
          <SelectParent control={control}/>
        </Stack>
        <DialogFooter>
          <DefaultButton onClick={onDismiss} text="Cancel"/>
          <PrimaryButton
            type="submit"
            text="Create"
            disabled={createPost?.loading}
          />
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export default composeWrappers({
  contentTypesContext: ContentTypesContextProvider,
})(FolderCreateDialog);
