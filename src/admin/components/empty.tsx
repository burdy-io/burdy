import { mergeStyleSets } from '@fluentui/react';
import React from 'react';
import emptyFolderV2 from '../assets/svg/empty_folder_v2.svg';
import emptySharedWithMe from '../assets/svg/empty_sharedwithme.svg';

const classNames = mergeStyleSets({
  root: {
    textAlign: 'center',
    paddingTop: 52,
    paddingBottom: 104
  },
  imageContainer: {
    margin: '0px auto',
    height: 208,
    width: 208
  },
  imageContainerCompact: {
    margin: '0px auto',
    height: 158,
    width: 158
  },
  rootCompact: {
    textAlign: 'center',
    paddingTop: 10,
    paddingBottom: 24
  },
  image: {
    width: '100%',
    height: '100%'
  },
  title: {
    padding: '16px 16px 0px',
    fontSize: 18,
    fontWeight: 600,
    maxWidth: 400,
    margin: '0px auto',
    color: '#323130'
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 400,
    maxWidth: 400,
    color: '#605e5c',
    margin: '0 auto',
    padding: '8px 16px 0'
  }
});

const images = {
  files: emptyFolderV2,
  contentTypes: emptySharedWithMe
};

interface EmptyProps {
  title?: string;
  image?: string;
  subtitle?: string;
  compact?: boolean;
}

const Empty: React.FC<EmptyProps> = ({ title, image, subtitle, compact }) => {
  return (
    <div className={compact ? classNames.rootCompact : classNames.root}>
      {image && images[image] && (
        <div
          className={
            compact
              ? classNames.imageContainerCompact
              : classNames.imageContainer
          }
        >
          <img className={classNames.image} src={images[image]} alt='' />
        </div>
      )}
      {title && <div className={classNames.title}>{title}</div>}
      {subtitle && <div className={classNames.subtitle}>{subtitle}</div>}
    </div>
  );
};

export default Empty;
