import React, { useEffect, useState } from 'react';
import {
  ActionButton,
  getTheme,
  IconButton,
  Label,
  mergeStyleSets,
  SelectionMode,
  Separator,
  Stack,
} from '@fluentui/react';
import { composeWrappers } from '@admin/helpers/hoc';
import { Controller } from 'react-hook-form';
// eslint-disable-next-line max-len
import { useExtendedFormContext } from '@admin/config-fields/dynamic-form';
import {
  PostsContextProvider,
  usePosts,
} from '@admin/features/posts/context/posts.context';
import { v4 } from 'uuid';
import PostsSelectPanel from '@admin/features/posts/components/posts-select-panel';
import Status from '@admin/components/status';

const theme = getTheme();

const styles = mergeStyleSets({
  headingWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    border: `1px solid ${theme.palette.neutralLight}`,
    marginBottom: 20,
  },
  component: {
    position: 'relative',
  },
});

interface DynamicReferenceProps {
  field: any;
  name?: string;
}

const DynamicReferenceImpl: React.FC<DynamicReferenceProps> = ({
  field,
  name,
}) => {
  const [selectPostOpen, setSelectPostOpen] = useState(false);
  const { control, disabled } = useExtendedFormContext();
  const { getBySlug } = usePosts();

  return (
    <div>
      {field?.label?.length > 0 && <Label>{`${field?.label} (Single)`}</Label>}
      <Controller
        name={name}
        control={control}
        defaultValue={getBySlug?.result?.slugPath}
        render={({ field: controllerField }) => {
          const { setLoadingContent, getBySlug } = usePosts();

          useEffect(() => {
            if (controllerField?.value?.slugPath) {
              getBySlug.execute(controllerField?.value?.slugPath);
            } else {
              controllerField.onChange(null);
            }
          }, [controllerField?.value?.slugPath]);

          useEffect(() => {
            const id = v4();
            setLoadingContent(id, getBySlug?.loading);
            return () => {
              setLoadingContent(id, false);
            };
          }, [getBySlug?.loading]);

          return (
            <div>
              {controllerField?.value?.slugPath && (
                <div className={styles.component}>
                  <div className={styles.headingWrapper}>
                    <Stack
                      style={{
                        overflowX: 'auto',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Label
                        style={{ overflow: 'hidden', wordBreak: 'break-all' }}
                      >
                        {(typeof controllerField?.value?.slugPath === 'string') ? controllerField?.value?.slugPath : ''}
                      </Label>
                      {getBySlug?.error ? (
                        <Status type="error">Invalid post</Status>
                      ) : (
                        <Status
                          type={
                            getBySlug?.result?.status === 'published'
                              ? 'success'
                              : undefined
                          }
                        >
                          {getBySlug?.result?.status}
                        </Status>
                      )}
                    </Stack>
                    <Stack horizontal tokens={{ childrenGap: 8 }}>
                      <IconButton
                        disabled={getBySlug?.loading || !!getBySlug?.error}
                        iconProps={{
                          iconName: 'OpenInNewTab',
                        }}
                        title="Open in new tab"
                        onClick={() => {
                          window.open(
                            `/admin/sites/editor/${getBySlug?.result?.id}`,
                            '_blank'
                          );
                        }}
                      />
                      <IconButton
                        iconProps={{ iconName: 'Delete' }}
                        disabled={getBySlug?.loading || disabled}
                        title="Delete"
                        ariaLabel="Delete"
                        onClick={() => controllerField.onChange(null)}
                      />
                    </Stack>
                  </div>
                </div>
              )}

              {!controllerField?.value?.slugPath && (
                <Separator style={{ marginTop: 30 }}>
                  <ActionButton
                    disabled={disabled}
                    iconProps={{
                      iconName: 'Add',
                    }}
                    onClick={() => {
                      setSelectPostOpen(true);
                    }}
                  >
                    Add component
                  </ActionButton>
                </Separator>
              )}
              <PostsSelectPanel
                isOpen={selectPostOpen}
                selectionMode={SelectionMode.single}
                onDismiss={() => setSelectPostOpen(false)}
                onSubmit={(data) => {
                  controllerField.onChange({
                    slugPath: data?.[0]?.slugPath,
                  });
                  setSelectPostOpen(false);
                }}
                params={{
                  contentTypeName: field.posts,
                }}
              />
            </div>
          );
        }}
      />
    </div>
  );
};

const DynamicReference = composeWrappers({
  postsContext: PostsContextProvider,
})(DynamicReferenceImpl);

export default DynamicReference;
