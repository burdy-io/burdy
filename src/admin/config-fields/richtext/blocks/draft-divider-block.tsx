import {
  makeStyles
} from "@fluentui/react";
import React from "react";
import classNames from "classnames";

const useStyles = makeStyles(() => ({
  divider: {
    width: '100%',
    padding: '10px 0',
    marginLeft: -20,
    marginRight: -20
  }
}))

const DraftDividerBlock = () => {
  const classes = useStyles();

  return (
    <div className={classNames(classes.divider)}>
      <hr />
    </div>
  );
};

export default DraftDividerBlock;
