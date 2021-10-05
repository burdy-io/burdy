import LoadingBar from '@admin/components/loading-bar';
import {
  getTheme,
  mergeStyleSets,
  MessageBar,
  MessageBarType,
  Shimmer,
  ShimmerElementType
} from '@fluentui/react';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import PostDetails from '@admin/features/posts/components/post-details';
import DynamicForm from '@admin/config-fields/dynamic-form';
import { useSnackbar } from '@admin/context/snackbar';
import Empty from '@admin/components/empty';
import { useLocation } from 'react-router';
import queryString from 'query-string';
import { usePosts } from '../../posts/context/posts.context';

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
    maxWidth: 270,
    minWidth: 270,
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

const HeadlessEditor = forwardRef<any, any>(({ onChange }, ref) => {
  const { post, updatePostContent } = usePosts();

  const formRef = useRef(null);

  const [message, setMessage] = useState(null);

  const [loaded, setLoaded] = useState(false);

  const { openSnackbar } = useSnackbar();

  const location = useLocation();

  useImperativeHandle(
    ref,
    () => ({
      getForm() {
        return formRef?.current?.getForm();
      }
    }),
    []
  );

  useEffect(() => {
    const search = queryString.parse(location.search) as any;
    let id;
    if (search?.action) {
      setMessage(search?.action);
      id = setTimeout(() => {
        setMessage(null);
      }, 5000);
    }
    return () => {
      if (id) {
        clearTimeout(id);
      }
    };
  }, []);

  useEffect(() => {
    if (post) {
      setLoaded(true);
    }
  }, [post]);

  useEffect(() => {
    if (updatePostContent?.result) {
      openSnackbar({
        message: 'Post updated successfully',
        messageBarType: MessageBarType.success
      });
    }
  }, [updatePostContent?.result]);

  return (
    <div className={styles.mainWrapper}>
      <div className={styles.content}>
        <div className={`${styles.editor}`}>
          <LoadingBar loading={!loaded}>
            {post?.contentType?.fields?.length > 0 && (
              <DynamicForm
                ref={formRef}
                disabled={!!post?.versionId}
                field={post?.contentType}
                defaultValues={(post?.meta as any)?.content}
                onChange={onChange}
              />
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
          <PostDetails loading={!post} post={post} />
        </div>
      </div>
    </div>
  );
});

export default HeadlessEditor;
