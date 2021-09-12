import {
  Breadcrumb,
  makeStyles,
  Shimmer,
  ShimmerElementType,
} from '@fluentui/react';
import React, { useMemo } from 'react';
import classNames from 'classnames';
import { useAssets } from '../context/assets.context';

const useStyles = makeStyles({
  shimmer: {
    marginTop: 18,
    marginBottom: 20,
  },
  breadcrumb: {
    height: 60,
    display: 'grid',
    alignItems: 'center',
  },
  heading: {
    margin: '11px 0px 12px',
    fontWeight: 600,
    lineHeight: '36px',
    fontSize: '18px',
  },
});

interface IAssetsBreadcrumbProps extends React.HTMLProps<HTMLDivElement> {}

const AssetsBreadcrumb: React.VoidFunctionComponent<IAssetsBreadcrumbProps> = ({
  className,
  ...props
}) => {
  const styles = useStyles();
  const { openItem, getAncestors, params } = useAssets();

  const items = useMemo(() => {
    const list = [];
    const ancestors = [
      {
        name: 'Assets',
        id: null,
      },
      ...(getAncestors?.result || []),
    ];
    (ancestors ?? []).forEach((parent, index) => {
      if (ancestors?.length - 1 === index) {
        list.push({
          text: parent.name,
          key: parent.id,
        });
      } else {
        list.push({
          text: parent.name,
          key: parent.id,
          onClick: () => {
            openItem(parent);
          },
        });
      }
    });
    return list;
  }, [getAncestors?.result]);

  const getBreadcrumb = () => {
    return params?.search?.length > 0 ? (
      <div className={styles.heading}>{`search: ${params?.search}`}</div>
    ) : (
      <Breadcrumb
        items={items}
        styles={{
          root: {
            margin: 0,
          },
        }}
        overflowAriaLabel="More links"
      />
    );
  };

  return (
    <div className={classNames(styles.breadcrumb, className)} {...props}>
      {getAncestors?.loading ? (
        <Shimmer
          width={80}
          shimmerElements={[{ type: ShimmerElementType.line, height: 8 }]}
          className={styles.shimmer}
        />
      ) : (
        getBreadcrumb()
      )}
    </div>
  );
};

export default AssetsBreadcrumb;
