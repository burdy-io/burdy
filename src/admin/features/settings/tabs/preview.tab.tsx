import React from 'react';
import Heading from '@admin/components/heading';
import PreviewEditorSettings from '@admin/features/settings/components/preview-editor-settings';

const PreviewEditorTab = () => {
  return (
    <div>
      <Heading title="Configure Preview editor" noPadding>
        Enable / Disable preview editor as well as configure rewrite URLs
      </Heading>
      <PreviewEditorSettings />
    </div>
  );
};

export default PreviewEditorTab;
