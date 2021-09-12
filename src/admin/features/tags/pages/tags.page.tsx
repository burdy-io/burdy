import Heading from '@admin/components/heading';
import React, { useEffect, useState } from 'react';
import {
  getTheme,
  mergeStyleSets,
  Shimmer,
  ShimmerElementType,
} from '@fluentui/react';
import queryString from 'query-string';
import { useHistory, useLocation } from 'react-router';
import { useTags, withTagsContext } from '../context/tags.context';
import TagsCommandBar from '../components/tags-command-bar';
import TagsColumns from '../components/tags-columns';
import TagsList from '../components/tags-list';
import TagDetails from '../components/tag-details';
import TagCreateDialog from '../components/tag-create-dialog';
import TagsDeleteDialog from '../components/tags-delete-dialog';
import TagUpdateDialog from '../components/tag-update-dialog';

const theme = getTheme();

const styles = mergeStyleSets({
  mainWrapper: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'flex-start',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  content: {
    flexGrow: 1,
    height: '100%',
    overflowY: 'auto',
    position: 'relative',
    padding: '0 24px',
  },
  side: {
    maxWidth: 270,
    minWidth: 270,
    flexGrow: 1,
    height: '100%',
    overflowY: 'auto',
    boxShadow: theme.effects.elevation16,
  },
  cardHeading: {
    padding: '0 14px',
    boxShadow: theme.effects.elevation4,
    display: 'flex',
    position: 'relative',
    height: 44,
    alignItems: 'center',
  },
});

const TagsPage = () => {
  const { getTags, tagsState, params, selectedTags, stateData, setStateData } =
    useTags();

  const [, setSelectedTag] = useState();

  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    getTags.execute();
    const search = queryString.parse(location.search) as any;
    setSelectedTag(search?.id);
  }, []);

  useEffect(() => {
    if (selectedTags?.length > 1) {
      history.push({
        search: queryString.stringify({ id: selectedTags?.[0]?.parentId }),
      });
    } else {
      history.push({
        search: queryString.stringify({ id: selectedTags?.[0]?.id }),
      });
    }
  }, [selectedTags]);

  return (
    <div className="page-wrapper">
      <TagsCommandBar />
      <div
        className="page-content page-content-scroll"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100% - 45px)',
        }}
      >
        <div className={styles.mainWrapper}>
          <div className={styles.content}>
            <Heading
              title={
                selectedTags?.length === 1
                  ? `Tags: ${selectedTags?.[0]?.slugPath}`
                  : 'Tags'
              }
            />
            <div style={{ flex: 1, height: 'calc(100% - 60px)' }}>
              {!params?.search?.length && <TagsColumns />}
              {params?.search?.length > 0 && <TagsList />}
            </div>
          </div>

          <div className={styles.side}>
            <div className={styles.cardHeading}>
              {getTags.loading ? (
                <Shimmer
                  width={50}
                  shimmerElements={[
                    { type: ShimmerElementType.line, height: 8 },
                  ]}
                  style={{}}
                />
              ) : (
                selectedTags?.length === 1 && 'Details'
              )}
            </div>
            <div style={{ padding: 24 }}>
              {selectedTags?.length === 1 && (
                <TagDetails loading={getTags.loading} tag={selectedTags[0]} />
              )}
            </div>
          </div>
        </div>
      </div>
      <TagCreateDialog
        isOpen={stateData?.createTagOpen}
        onCreated={(tag) => {
          tagsState.create([tag]);
          setStateData('createTagOpen', false);
        }}
        onDismiss={() => setStateData('createTagOpen', false)}
      />
      <TagUpdateDialog
        isOpen={stateData?.updateTagOpen}
        onUpdated={() => {
          getTags.execute();
          setStateData('updateTagOpen', false);
        }}
        onDismiss={() => setStateData('updateTagOpen', false)}
      />
      <TagsDeleteDialog
        isOpen={stateData?.deleteTagsOpen}
        onDeleted={(ids) => {
          tagsState.delete(ids as number[]);
          setStateData('deleteTagsOpen', false);
        }}
        onDismiss={() => setStateData('deleteTagsOpen', false)}
      />
    </div>
  );
};

export default withTagsContext(TagsPage);
