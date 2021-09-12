import {
  IconButton,
  IPanelProps,
  makeStyles,
  Panel,
  Text,
} from '@fluentui/react';
import React, { useCallback } from 'react';
import classNames from 'classnames';

const useStyles = makeStyles((theme) => ({
  backButton: {
    marginRight: 'auto',
    color: theme.palette.neutralSecondary,
    '&:hover': {
      color: theme.palette.neutralPrimary,
    },
  },
  closeButton: {
    marginRight: 0,
    marginLeft: 'auto',
    color: theme.palette.neutralSecondary,
    '&:hover': {
      color: theme.palette.neutralPrimary,
    },
  },
  backButtonIcon: {
    fontSize: 20,
  },
  navigationContainerWrapper: {
    width: '100%',
  },
  navigationContainer: {
    display: 'flex',
    padding: '12px 16px',
    width: '100%',
  },
  title: {
    display: 'block',
    marginTop: 12,
    marginBottom: 18,
  },
}));

export interface IBackPanelProps extends IPanelProps {
  onBack?: () => void;
}

const BackPanel: React.FC<IBackPanelProps> = ({
  onDismiss,
  onBack,
  title,
  children,
  ...props
}) => {
  const styles = useStyles();

  const onRenderNavigationContent = useCallback(
    () => (
      <div className={styles.navigationContainer}>
        {onBack && (
          <IconButton
            className={classNames(
              'ms-Panel-closeButton ms-PanelAction-close',
              styles.backButton
            )}
            onClick={() => onBack?.()}
            iconProps={{ iconName: 'Back', className: styles.backButtonIcon }}
          />
        )}
        {onDismiss && (
          <IconButton
            className={classNames(
              'ms-Panel-closeButton ms-PanelAction-close',
              styles.closeButton
            )}
            onClick={() => onDismiss?.()}
            iconProps={{ iconName: 'Cancel', className: styles.backButtonIcon }}
          />
        )}
      </div>
    ),
    [onDismiss, onBack, title]
  );

  return (
    <Panel
      onRenderNavigationContent={onRenderNavigationContent}
      styles={{ overlay: { background: 'transparent' } }}
      title={title}
      {...props}
    >
      {title && (
        <Text variant="large" className={styles.title}>
          {title}
        </Text>
      )}
      {children}
    </Panel>
  );
};

export default BackPanel;
