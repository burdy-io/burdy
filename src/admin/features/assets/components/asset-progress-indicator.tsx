import {makeStyles, ProgressIndicator} from "@fluentui/react";
import {useAssets} from "@admin/features/assets/context/assets.context";
import React, {useMemo} from "react";
import classNames from "classnames";

const useStyles = makeStyles({
  progress: {
    '& .ms-ProgressIndicator-itemProgress': {
      padding: 0
    }
  },
  inactive: {
    '& .ms-ProgressIndicator-itemProgress': {
      visibility: 'hidden'
    }
  }
})

const AssetProgressIndicator = () => {
  const {uploads} = useAssets();
  const classes = useStyles();

  const progressPercent = useMemo(() => {
    const progressInstances = Object.values(uploads).map((upload) => upload?.progress ?? 100) as number[];
    const totalProgress = progressInstances.reduce((acc, value) => value + acc, 0) / progressInstances.length;
    return totalProgress / 100;
  }, [uploads]);

  const isActive = useMemo(() => Object.keys(uploads ?? {}).length > 0, [uploads])

  return (
    <ProgressIndicator
      className={classNames(classes.progress, {[classes.inactive]: !isActive})}
      percentComplete={progressPercent}
    />
  );
}

export default AssetProgressIndicator;
