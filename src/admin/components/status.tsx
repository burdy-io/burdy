import React, { FC } from 'react';
import { getTheme, makeStyles } from '@fluentui/react';

const theme = getTheme();
const useStyles = makeStyles(() => ({
  root: {
    fontSize: 12,
    fontWeight: 500,
    minHeight: 32,
    display: 'inline-flex',
    wordBreak: 'break-word',
    flexDirection: 'column',
    justifyContent: 'center',
    color: theme.semanticColors.messageText,
    padding: '0 10px',
  },
  info: {
    background: theme.semanticColors.infoBackground
  },
  success: {
    background: theme.semanticColors.successBackground
  },
  error: {
    background: theme.semanticColors.errorBackground
  },
}));

export type IStatusProps = {
  type?: 'success' | 'error';
};

const Status: FC<IStatusProps> = (props) => {
  const { type, children } = props;

  const classNames = useStyles();
  return <span className={`${classNames.root} ${classNames?.[type] || classNames?.info}`}>{children}</span>;
};

export default Status;
