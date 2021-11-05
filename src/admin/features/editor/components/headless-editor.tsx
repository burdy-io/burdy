import LoadingBar from '@admin/components/loading-bar';
import {
  getTheme,
  mergeStyleSets,
  MessageBar,
  MessageBarType,
  Shimmer,
  ShimmerElementType
} from '@fluentui/react';
import React, { useEffect } from 'react';
import PostDetails from '@admin/features/posts/components/post-details';
import { FormHelperContextProvider } from '@admin/config-fields/dynamic-form';
import Empty from '@admin/components/empty';
import { usePosts } from '../../posts/context/posts.context';
import DynamicGroup from '@admin/config-fields/dynamic-group';
import { FormProvider } from 'react-hook-form';

const theme = getTheme();

const styles = mergeStyleSets({
  card: {
    margin: 24
  },
  mainWrapper: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'flex-start',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box'
  },
  content: {
    flexGrow: 1,
    height: '100%',
    overflowY: 'auto',
    position: 'relative',
    padding: 24,
    boxSizing: 'border-box'
  },
  side: {
    maxWidth: 380,
    minWidth: 380,
    flexGrow: 1,
    height: '100%',
    overflowY: 'auto',
    boxShadow: theme.effects.elevation16
  },
  cardHeading: {
    padding: '0 14px',
    boxShadow: theme.effects.elevation4,
    display: 'flex',
    position: 'relative',
    height: 44,
    alignItems: 'center'
  },
  editor: {
    boxShadow: theme.effects.elevation16,
    padding: 24,
    maxWidth: 960,
    position: 'relative',
    minHeight: 100,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: 48
  },
  messages: {
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: 12,
    maxWidth: 960,
    width: '100%'
  }
});

const HeadlessEditor = ({ methods, message, loading }) => {
  const { post } = usePosts();

  return (
    <div className={styles.mainWrapper}>
      <div className={styles.content}>
        <div className={`${styles.editor}`}>
          <LoadingBar loading={loading}>
            {post?.contentType?.fields?.length > 0 && (
              <FormProvider {...methods}>
                <FormHelperContextProvider
                  disabled={!!post?.versionId}
                >
                  <DynamicGroup field={post?.contentType} />
                </FormHelperContextProvider>
              </FormProvider>
            )}

            {!(post?.contentType?.fields?.length > 0) && (
              <Empty compact title='No fields defined' />
            )}
          </LoadingBar>
        </div>
      </div>

      <div className={styles.side}>
        <div className={styles.cardHeading}>
          {!post ? (
            <Shimmer
              width={50}
              shimmerElements={[{ type: ShimmerElementType.line, height: 8 }]}
              style={{}}
            />
          ) : (
            'Details'
          )}
        </div>
        <div className={styles.card}>
          {post?.versionId && (
            <div className={styles.messages}>
              <MessageBar messageBarType={MessageBarType.info}>
                You are previewing historical version
              </MessageBar>
            </div>
          )}
          {message === 'version_deleted' && (
            <div className={styles.messages}>
              <MessageBar messageBarType={MessageBarType.success}>
                Version deleted
              </MessageBar>
            </div>
          )}
          {message === 'version_restored' && (
            <div className={styles.messages}>
              <MessageBar messageBarType={MessageBarType.success}>
                Version restored
              </MessageBar>
            </div>
          )}
          <PostDetails loading={loading} post={post} />
        </div>
      </div>
    </div>
  );
};

export default HeadlessEditor;
