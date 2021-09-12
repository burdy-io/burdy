import { mergeStyleSets, Shimmer, ShimmerElementType } from '@fluentui/react';
import React from 'react';

const classNames = mergeStyleSets({
  root: {
    padding: '0 8px',
    minHeight: 60,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  shimmer: {
    marginTop: 18,
    marginBottom: 19,
  },
  titleNoMarginBottom: {
    marginBottom: 0,
  },
  title: {
    margin: '11px 0px 12px',
    fontWeight: 600,
    lineHeight: '36px',
    fontSize: '18px',
  },
  subtitle: {
    margin: '0 0 24px',
  },
  noGap: {
    marginBottom: 0,
  },
});

interface HeadingProps {
  title?: string;
  subtitle?: string;
  loading?: boolean;
  children?: any;
  noPadding?: boolean;
  noGap?: boolean;
}

const Heading: React.FC<HeadingProps> = ({
  title,
  subtitle,
  children,
  loading,
  noPadding = false,
  noGap = false,
}) => {
  return (
    <div className={classNames.root} style={{ padding: noPadding ? 0 : '' }}>
      {loading ? (
        <Shimmer
          width={80}
          shimmerElements={[{ type: ShimmerElementType.line, height: 8 }]}
          className={classNames.shimmer}
        />
      ) : (
        <>
          {title && (
            <div className={`${classNames.title} ${noGap && classNames.noGap}`}>
              {title}
            </div>
          )}
          {subtitle && (
            <div className={`${classNames.subtitle}`}>{subtitle}</div>
          )}
          {children && <div className={classNames.subtitle}>{children}</div>}
        </>
      )}
    </div>
  );
};

export default Heading;
