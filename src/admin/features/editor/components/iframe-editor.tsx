import LoadingBar from '@admin/components/loading-bar';
import {
  getTheme, IconButton,
  mergeStyleSets,
  MessageBar,
  MessageBarType, Pivot, PivotItem,
  Shimmer,
  ShimmerElementType,
  Stack
} from '@fluentui/react';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle, useMemo,
  useRef,
  useState
} from 'react';
import DynamicForm from '@admin/config-fields/dynamic-form';
import { useSnackbar } from '@admin/context/snackbar';
import Empty from '@admin/components/empty';
import { useLocation } from 'react-router';
import queryString from 'query-string';
import { usePosts } from '../../posts/context/posts.context';
import classNames from 'classnames';
import { useDebouncedCallback } from 'use-debounce';
import PostDetails from '@admin/features/posts/components/post-details';
import { IPost } from '@shared/interfaces/model';

const theme = getTheme();

interface TabsItemProps {
  key: string;
  name?: string;
}

interface TabsProps {
  items: TabsItemProps[];
  loading?: boolean;
  onSelected: (e: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ items, onSelected, loading }) => {
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    if (!selectedKey && items?.length > 0) {
      setSelectedKey(items?.[0]?.key);
    }
  }, [items]);

  useEffect(() => {
    onSelected(selectedKey);
  }, [selectedKey]);

  return (
    <div>
      {loading && (
        <Stack
          horizontal
          style={{ height: '100%' }}
          verticalAlign='center'
          tokens={{ childrenGap: 10 }}
        >
          <Shimmer
            width={50}
            shimmerElements={[{ type: ShimmerElementType.line, height: 8 }]}
            style={{}}
          />
          <Shimmer
            width={50}
            shimmerElements={[{ type: ShimmerElementType.line, height: 8 }]}
            style={{}}
          />
        </Stack>
      )}
      {!loading && (
        <Pivot
          selectedKey={selectedKey}
          headersOnly
          aria-label='Basic Pivot'
          onLinkClick={(item) => {
            setSelectedKey(item?.props?.itemKey);
          }}
        >
          {items.map((item) => (
            <PivotItem
              itemKey={item.key}
              headerText={item?.name?.length > 0 ? item?.name : item?.key}
              style={{ paddingTop: 20 }}
            />
          ))}
        </Pivot>
      )}
    </div>
  );
};

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
    position: 'relative',
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
    maxWidth: 1200,
    position: 'relative',
    minHeight: 100,
    marginLeft: 'auto',
    marginRight: 'auto',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  browserMobile: {
    maxWidth: '375px'
  },
  browserTablet: {
    maxWidth: '768px'
  },
  iframeWrapper: {
    flex: 1,
    overflowY: 'auto'
  },
  urlBar: {
    backgroundColor: theme.palette.neutralLight,
    display: 'flex',
    alignItems: 'center',
    height: 40,
    padding: '0 10px'
  },
  urlBarSearch: {
    backgroundColor: theme.palette.white,
    borderRadius: 20,
    padding: '0 10px',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    height: 28,
    fontWeight: 600
  },
  iframe: {
    display: 'block',
    boxSizing: 'content-box',
    height: '100%',
    width: '100%',
    border: '0px none',
    overflow: 'auto'
  },
  messages: {
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: 12,
    maxWidth: 960,
    width: '100%'
  },
  hide: {
    display: 'none !important'
  }
});

const IFrameEditor = forwardRef<any, any>(({ onChange, device = 'desktop', menuOpened = true }, ref) => {
  const { post, updatePostContent, compilePost, getIFrameData } = usePosts();

  const iframeRef = useRef(null);
  const formRef = useRef(null);
  const [selectedTab, setSelectedTab] = useState(null);
  const [iframeSrc, setIframeSrc] = useState<string>();

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

  const debounced = useDebouncedCallback(async (val) => {
    try {
      const compiled = await compilePost.execute({
        ...post,
        meta: {
          ...(post?.meta || {}),
          content: val
        }
      });

      if (iframeRef?.current) {
        iframeRef.current.contentWindow.postMessage({
          source: 'burdy-post-edit',
          payload: compiled
        });
      }
    } catch (err) {
      //
    }
  }, 500);

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

  const fetchIframeData = async (post: IPost) => {
    try {
      const response = await getIFrameData.execute(post?.id, post?.versionId);
      console.log(response);
      if (response) {
        setIframeSrc(response?.src);
      }
    } catch (err) {
      //
    }
  };

  useEffect(() => {
    if (post) {
      setLoaded(true);
      if (!iframeSrc) {
        fetchIframeData(post);
      }
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

  const tabs = useMemo(() => {
    const tmpTabs = [
      {
        name: 'editor',
        label: 'Editor'
      },
      {
        name: 'details',
        label: 'Details'
      }
    ];
    return tmpTabs;
  }, [post]);

  const pageUrl = useMemo(() => {
    try {
      const url = new URL(iframeSrc);
      return `${url.origin}${url.pathname}`;
    } catch (e) {
      return '';
    }
  }, [iframeSrc]);

  return (
    <div className={styles.mainWrapper}>
      <div className={styles.content}>
        <div className={`${styles.editor} ${classNames({
          [styles.browserTablet]: device === 'tablet',
          [styles.browserMobile]: device === 'mobile'
        })}`}>
          <LoadingBar loading={!loaded}>
            <div className={styles.urlBar}>
              <div className={styles.urlBarSearch}>
                {pageUrl}
              </div>
              <div>
                <IconButton
                  iconProps={{iconName: 'OpenInNewTab'}}
                  onClick={() => window.open(iframeSrc, '_blank')}
                />
              </div>
            </div>
            <div className={styles.iframeWrapper}>
              {iframeSrc && <iframe
                title='burdy-editor'
                id='burdy-editor'
                className={styles.iframe}
                ref={iframeRef}
                src={iframeSrc}
                style={{ width: '1px', minWidth: '100%' }}
              />}
            </div>
          </LoadingBar>
        </div>
      </div>
      <div className={classNames([styles.side, !menuOpened && styles.hide])}>
        <div className={styles.cardHeading}>
          {!post ? (
            <Shimmer
              width={50}
              shimmerElements={[{ type: ShimmerElementType.line, height: 8 }]}
              style={{}}
            />
          ) : (
            <Tabs
              items={tabs.map((tab) => ({
                key: tab.name,
                name: tab.label
              }))}
              onSelected={(e) => setSelectedTab(e)}
            />
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
          <div
            className={`${selectedTab === 'editor' ? '' : styles.hide}`}
          >
            <LoadingBar loading={!loaded}>
              {post?.contentType?.fields?.length > 0 && (
                <DynamicForm
                  ref={formRef}
                  disabled={!!post?.versionId}
                  narrow
                  field={post?.contentType}
                  defaultValues={(post?.meta as any)?.content}
                  onChange={(val) => {
                    onChange?.(val);
                    debounced(val);
                  }}
                />
              )}

              {!(post?.contentType?.fields?.length > 0) && (
                <Empty compact title='No fields defined' />
              )}
            </LoadingBar>
          </div>
          <div
            className={`${selectedTab === 'details' ? '' : styles.hide}`}
          >
            <PostDetails loading={!loaded} post={post} />
          </div>
        </div>
      </div>
    </div>
  );
});

export default IFrameEditor;
