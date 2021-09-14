import React, { useMemo } from 'react';
import Heading from '@admin/components/heading';
import Hooks from '@shared/features/hooks';

const GeneralSettings = () => {
  const sections = useMemo<any[]>(() => {
    return Hooks.applySyncFilters('admin/settings/sections', []);
  }, []);
  return (
    <div>
      <Heading title="General Settings" noPadding>
        {!(sections?.length > 0) && 'You do not have any general settings sections.'}
      </Heading>
      {sections.map(({key, component}) => (
        <section key={key}>{component}</section>
      ))}
    </div>
  );
};

export default GeneralSettings;
