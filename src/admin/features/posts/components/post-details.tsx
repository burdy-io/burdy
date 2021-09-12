import { getMetaValue } from '@admin/helpers/utility';
import {
  getTheme,
  mergeStyleSets,
  Shimmer,
  ShimmerElementType,
  Stack,
  Text,
} from '@fluentui/react';
import React from 'react';
import { IPost } from '@shared/interfaces/model';

const theme = getTheme();

const styles = mergeStyleSets({
  itemHeading: {
    fontWeight: '600',
  },
  ellipsis: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  contentType: {
    textDecoration: 'underline',
    '&:hover': {
      cursor: 'pointer',
    },
  },
  link: {
    textDecoration: 'underline',
    '&:hover': {
      cursor: 'pointer',
    },
  },
  shimmer: {
    width: '100%',
  },
});

interface IPostDetailsProps {
  post?: IPost;
  loading?: boolean;
}

const PostDetails: React.FC<IPostDetailsProps> = ({ post, loading }) => {
  const shimmerList = [1, 0.8, 0.6, 0.4];

  return (
    <>
      {loading && (
        <Stack tokens={{ childrenGap: 10 }}>
          {shimmerList.map((item) => (
            <Stack key={item}>
              <Shimmer
                width="100%"
                shimmerElements={[
                  { type: ShimmerElementType.line, height: 12 },
                ]}
                className={styles.shimmer}
                style={{
                  marginBottom: 8,
                  opacity: item,
                }}
              />
              <Shimmer
                width="100%"
                shimmerElements={[
                  { type: ShimmerElementType.line, height: 12 },
                ]}
                className={styles.shimmer}
                style={{
                  marginBottom: 6,
                  opacity: item,
                }}
              />
            </Stack>
          ))}
        </Stack>
      )}

      {!loading && (
        <Stack data-cy="post-details" tokens={{ childrenGap: 10 }}>
          <Stack>
            <Text className={styles.itemHeading} variant="medium" block>
              Name
            </Text>
            <Text variant="medium" block>
              {post?.name}
            </Text>
          </Stack>
          <Stack>
            <Text className={styles.itemHeading} variant="medium" block>
              Slug
            </Text>
            <Text variant="medium" block>
              {post?.slug}
            </Text>
          </Stack>
          <Stack>
            <Text className={styles.itemHeading} variant="medium" block>
              <Stack
                horizontal
                verticalAlign="center"
                tokens={{ childrenGap: 6 }}
              >
                <span>Status</span>
                <div
                  style={{
                    display: 'inline-block',
                    backgroundColor:
                      post?.status === 'published'
                        ? theme.palette.green
                        : theme.palette.neutralLight,
                    height: 10,
                    width: 10,
                    borderRadius: '50%',
                  }}
                />
              </Stack>
            </Text>
            <Text variant="medium" block>
              <div>{post?.status}</div>
            </Text>
          </Stack>
          {post?.publishedAt && (
            <Stack>
              <Text className={styles.itemHeading} variant="medium" block>
                Published at
              </Text>
              <Text variant="medium" block>
                {new Date(post?.publishedAt).toLocaleDateString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </Text>
            </Stack>
          )}
          {post?.publishedFrom && (
            <Stack>
              <Text className={styles.itemHeading} variant="medium" block>
                Published from
              </Text>
              <Text variant="medium" block>
                {new Date(post?.publishedFrom).toLocaleDateString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </Text>
            </Stack>
          )}
          {post?.publishedUntil && (
            <Stack>
              <Text className={styles.itemHeading} variant="medium" block>
                Published until
              </Text>
              <Text variant="medium" block>
                {new Date(post?.publishedUntil).toLocaleDateString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </Text>
            </Stack>
          )}
          <Stack>
            <Text className={styles.itemHeading} variant="medium" block>
              Last Update
            </Text>
            <Text variant="medium" className={styles.ellipsis} block>
              {post?.updatedAt &&
                new Date(post?.updatedAt).toLocaleDateString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
            </Text>
          </Stack>
          <Stack>
            <Text className={styles.itemHeading} variant="medium" block>
              Updated by
            </Text>
            <Text variant="medium" block className={styles.ellipsis}>
              {post?.author?.firstName} {post?.author?.lastName}
            </Text>
          </Stack>
          <Stack>
            <Text className={styles.itemHeading} variant="medium" block>
              Tags
            </Text>
            <Text variant="medium" block>
              {!(post?.tags?.length > 0) && 'No tags'}
              <Stack
                style={{ marginTop: 4 }}
                horizontal
                wrap
                tokens={{ childrenGap: 8 }}
              >
                {(post?.tags || []).map((tag) => (
                  <div key={tag.id} className="chip chip--small">
                    {tag.name}
                  </div>
                ))}
              </Stack>
            </Text>
          </Stack>
          {post?.contentType && (
            <Stack>
              <Text className={styles.itemHeading} variant="medium" block>
                Content Type
              </Text>
              <Text variant="medium" className={styles.ellipsis} block>
                {post?.contentType?.name}
              </Text>
            </Stack>
          )}
        </Stack>
      )}
    </>
  );
};

export default PostDetails;
