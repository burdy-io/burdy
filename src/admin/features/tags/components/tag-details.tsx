import {
  mergeStyleSets,
  Shimmer,
  ShimmerElementType,
  Stack,
  Text,
} from '@fluentui/react';
import { ITag } from '@shared/interfaces/model';
import React from 'react';

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
  shimmer: {
    width: '100%',
  },
});

interface ITagDetailsProps {
  tag?: ITag;
  loading?: boolean;
}

const TagDetails: React.FC<ITagDetailsProps> = ({ tag, loading }) => {
  const shimmerList = [1, 0.8, 0.6, 0.4];

  return (
    <>
      {loading && (
        <Stack tokens={{ childrenGap: 10 }}>
          {shimmerList.map((item) => (
            <Stack>
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
        <Stack tokens={{ childrenGap: 10 }}>
          <Stack>
            <Text className={styles.itemHeading} variant="medium" block>
              Name
            </Text>
            <Text variant="medium" block data-cy="tags-details-name">
              {tag?.name}
            </Text>
          </Stack>
          <Stack>
            <Text className={styles.itemHeading} variant="medium">
              Slug
            </Text>
            <Text variant="medium" block data-cy="tags-details-slug">
              {tag?.slug}
            </Text>
          </Stack>
          <Stack>
            <Text className={styles.itemHeading} variant="medium" block>
              Last Update
            </Text>
            <Text variant="medium" className={styles.ellipsis} block>
              {tag?.updatedAt &&
                new Date(tag?.updatedAt).toLocaleDateString([], {
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
            <Text variant="medium" block className={styles.ellipsis} data-cy="tags-details-author">
              {tag?.author?.firstName} {tag?.author?.lastName}
            </Text>
          </Stack>
        </Stack>
      )}
    </>
  );
};

export default TagDetails;
