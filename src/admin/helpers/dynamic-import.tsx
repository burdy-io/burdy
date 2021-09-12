import React, { useEffect, useState } from 'react';

const withDynamicImport =
  (importFunction: () => Promise<any>): React.FC<any> =>
  (props) => {
    const [Component, setComponent] = useState<any>(false);

    useEffect(() => {
      importFunction().then((component) =>
        setComponent(() => component.default)
      );
    }, []);

    return <>{Boolean(Component) && <Component {...props} />}</>;
  };

export default withDynamicImport;
