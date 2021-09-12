import React from 'react';
import { makeStyles, Spinner, SpinnerSize } from '@fluentui/react';

interface LoadingBarProps {
  loading?: boolean;
  children?: any;
  isFixed?: boolean;
}

const useStyles = makeStyles({
  loadingWrapper: {
    display: 'flex !important',
    justifyContent: 'center',
    alignItems: 'center',
    inset: 0,
  },
});

const LoadingBar: React.FC<LoadingBarProps> = ({
  loading = true,
  children,
  isFixed = false,
}) => {
  const styles = useStyles();

  return loading ? (
    <Spinner
      size={SpinnerSize.large}
      className={styles.loadingWrapper}
      style={{ position: isFixed ? 'fixed' : 'absolute' }}
    />
  ) : (
    children
  );
};

export default LoadingBar;
