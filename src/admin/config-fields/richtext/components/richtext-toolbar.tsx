import React, { useMemo, useState } from 'react';
import { DefaultButton, makeStyles, MessageBarType, PrimaryButton, SelectionMode } from '@fluentui/react';
import { useRichtext } from '@admin/config-fields/dynamic-richtext.context';
import { useExtendedFormContext } from '@admin/config-fields/dynamic-form';
import { IAsset } from '@shared/interfaces/model';
import { AtomicBlockUtils, convertToRaw, EditorState, RichUtils } from 'draft-js';
import AssetsSelectPanel from '@admin/features/assets/components/assets-select-panel';
import InsertLinkDialog from '@admin/components/insert-link-dialog';
import InsertAceDialog from '@admin/config-fields/richtext/components/draft-ace-dialog';
import ContentTypesComponentsSelectPanel
  from '@admin/features/content-types/components/content-types-components-select-panel';
import { useSnackbar } from '@admin/context/snackbar';
import { copyToClipboard } from '@admin/helpers/utility';

const useToolbarStyles = makeStyles((theme) => ({
  button: {
    minWidth: 34,
    padding: '0 4px',
    borderRadius: 0,
    '&:not(:first-of-type)': {
      borderLeft: 'none'
    },
    border: `1px solid ${theme.palette.neutralLight}`
  },
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: 10
  }
}));

const BlockHeadingTypes = [
  {label: 'H1', style: 'header-one'},
  {label: 'H2', style: 'header-two'},
  {label: 'H3', style: 'header-three'},
  {label: 'H4', style: 'header-four'},
  {label: 'H5', style: 'header-five'},
  {label: 'H6', style: 'header-six'}
];

const BlockSecondTypes = [
  {label: 'Code Block', icon: 'Code', style: 'code-block'},
  {label: 'Blockquote', icon: 'RightDoubleQuote', style: 'blockquote'}
];

const BlockListTypes = [
  {label: 'UL', icon: 'BulletedList', style: 'unordered-list-item'},
  {label: 'OL', icon: 'NumberedList', style: 'ordered-list-item'}
];

const InlineStyles = [
  {label: 'Bold', icon: 'Bold', style: 'BOLD'},
  {label: 'Italic', icon: 'Italic', style: 'ITALIC'},
  {label: 'Underline', icon: 'Underline', style: 'UNDERLINE'},
  { label: 'Strikethrough', icon: 'Strikethrough', style: 'STRIKETHROUGH'},
  { label: 'Code', icon: 'CodeEdit', style: 'CODE' },
];

const BlockButtons: React.FC = () => {
  const {editorState, toggleBlockType} = useRichtext();
  const selection = editorState.getSelection();
  const blockType = editorState
  .getCurrentContent()
  .getBlockForKey(selection.getStartKey())
  .getType();
  const classes = useToolbarStyles();

  return (
    <>
      <div className={classes.group}>
        {BlockHeadingTypes.map(({style, label}) => (
          <StyleButton
            key={label}
            style={style}
            isActive={style === blockType}
            onToggle={toggleBlockType}
          >
            {label}
          </StyleButton>
        ))}
      </div>
      <div className={classes.group}>
        {BlockSecondTypes.map(({style, label, icon}) => (
          <StyleButton
            key={label}
            icon={icon}
            style={style}
            isActive={style === blockType}
            onToggle={toggleBlockType}
          >
            {label}
          </StyleButton>
        ))}
      </div>
      <div className={classes.group}>
        {BlockListTypes.map(({style, label, icon}) => (
          <StyleButton
            key={label}
            style={style}
            isActive={style === blockType}
            onToggle={toggleBlockType}
            icon={icon}
          >
            {label}
          </StyleButton>
        ))}
      </div>
    </>
  );
};

const InlineButtons: React.FC = () => {
  const {editorState, toggleInlineStyle} = useRichtext();
  const currentStyle = editorState.getCurrentInlineStyle();
  const classes = useToolbarStyles();

  return (
    <div className={classes.group}>
      {InlineStyles.map(({style, label, icon}) => (
        <StyleButton
          icon={icon}
          key={label}
          onToggle={toggleInlineStyle}
          isActive={currentStyle.has(style)}
          style={style}
        >
          {label}
        </StyleButton>
      ))}
    </div>
  );
};

interface IStyleButtonProps {
  icon?: string;
  isActive?: boolean;
  style?: any;
  onToggle?: (style: any) => void;
}

const StyleButton: React.FC<Partial<IStyleButtonProps>> = ({
 icon,
 isActive,
 children,
 onToggle,
 style
}) => {
  const {disabled} = useExtendedFormContext();
  const classes = useToolbarStyles();
  const Button = useMemo<any>(
    () => (isActive ? PrimaryButton : DefaultButton),
    [isActive]
  );

  return (
    <Button
      iconProps={{iconName: icon}}
      className={classes.button}
      disabled={disabled}
      onMouseDown={(e) => {
        onToggle(style);
        e.preventDefault();
        return false;
      }}
    >
      {!icon && children}
    </Button>
  );
};

const ActionButtons: React.FC = () => {
  const classes = useToolbarStyles();
  const {disabled} = useExtendedFormContext();
  const {editorState, setEditorState, editorProps, setEditorProps} = useRichtext();
  const {openSnackbar} = useSnackbar();
  const [assetOpen, setAssetOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [aceOpen, setAceOpen] = useState(false);
  const [componentsOpen, setComponentsOpen] = useState(false);

  const [selection, setSelection] = useState(null);

  const styles = useToolbarStyles();
  const setReadOnly = (readOnly: boolean) => {
    setEditorProps({...editorProps, readOnly});
  }

  const forceSelection = () => {
    setEditorState(EditorState.forceSelection(editorState, selection));
    setSelection(null);
  }

  const createImage = (image: IAsset) => {
    const contentState = editorState.getCurrentContent();

    const contentStateWithEntity = contentState.createEntity(
      'IMAGE',
      'IMMUTABLE',
      {
        npath: image.npath,
        name: image.name,
        mimeType: image.mimeType,
        meta: image.meta,
        caption: '',
        align: 'center'
      }
    );

    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

    setEditorState(
      AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ')
    );

    EditorState.forceSelection(
      editorState,
      editorState.getCurrentContent().getSelectionAfter()
    );
  };

  const createAce = (mode: string) => {
    const contentState = editorState.getCurrentContent();

    const contentStateWithEntity = contentState.createEntity(
      'TEXT_EDITOR',
      'IMMUTABLE',
      {
        mode
      }
    );

    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

    setEditorState(
      AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ')
    );

    EditorState.forceSelection(
      editorState,
      editorState.getCurrentContent().getSelectionAfter()
    );
  };

  const createComponent = (name: string) => {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      'COMPONENT',
      'IMMUTABLE',
      {
        name
      }
    );

    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

    setEditorState(
      AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ')
    );

    EditorState.forceSelection(
      editorState,
      editorState.getCurrentContent().getSelectionAfter()
    );
  };

  const createDivider = () => {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      'DIVIDER',
      'IMMUTABLE'
    );

    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

    setEditorState(
      AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ')
    );

    EditorState.forceSelection(
      editorState,
      editorState.getCurrentContent().getSelectionAfter()
    );
  };

  const createLink = (link: any) => {
    const selection = editorState.getSelection();
    if (!(link?.url?.length > 0)) {
      setEditorState(RichUtils.toggleLink(editorState, selection, null));
      return;
    }
    const content = editorState.getCurrentContent();
    const contentWithEntity = content.createEntity(
      'LINK',
      'MUTABLE',
      link
    );

    const newEditorState = EditorState.push(
      editorState,
      contentWithEntity,
      'apply-entity'
    );

    const entityKey = contentWithEntity.getLastCreatedEntityKey();
    setEditorState(RichUtils.toggleLink(newEditorState, selection, entityKey));

    EditorState.forceSelection(
      newEditorState,
      newEditorState.getCurrentContent().getSelectionAfter()
    );
  };

  return (
    <>
      <div className={styles.group}>
        <DefaultButton
          iconProps={{iconName: 'CalculatorSubtract'}}
          label='Divider'
          ariaLabel='Divider'
          className={classes.button}
          disabled={disabled}
          onMouseDown={() => {
            createDivider();
            setSelection(editorState.getSelection());
            return false;
          }}
        />
        <DefaultButton
          iconProps={{iconName: 'MediaAdd'}}
          className={classes.button}
          disabled={disabled}
          onMouseDown={(e) => {
            setAssetOpen(true);
            e.preventDefault();
            setSelection(editorState.getSelection());
            return false;
          }}
        />
        <DefaultButton
          iconProps={{iconName: 'Link'}}
          className={classes.button}
          disabled={disabled}
          onMouseDown={(e) => {
            setLinkOpen(true);
            e.preventDefault();
            setReadOnly(true);
            return false;
          }}
        />
        <DefaultButton
          iconProps={{iconName: 'FileCode'}}
          className={classes.button}
          disabled={disabled}
          onMouseDown={(e) => {
            setAceOpen(true);
            e.preventDefault();
            setSelection(editorState.getSelection());
            return false;
          }}
        />
        <DefaultButton
          iconProps={{iconName: 'WebComponents'}}
          className={classes.button}
          disabled={disabled}
          onMouseDown={(e) => {
            setComponentsOpen(true);
            e.preventDefault();
            setSelection(editorState.getSelection());
            return false;
          }}
        />
        <DefaultButton
          iconProps={{iconName: 'Copy'}}
          className={classes.button}
          disabled={disabled}
          onMouseDown={() => {
            try {
              copyToClipboard(
                JSON.stringify(convertToRaw(editorState.getCurrentContent()))
              );
              openSnackbar({
                message: 'Content copied',
                messageBarType: MessageBarType.success
              })
            } catch {
              //
            }
            return false;
          }}
        />
      </div>
      <AssetsSelectPanel
        isOpen={assetOpen}
        mimeTypes={['image/jpeg', 'image/webp', 'image/png', 'image/gif', 'image/svg+xml']}
        selectionMode={SelectionMode.single}
        onDismiss={() => {
          setAssetOpen(false);
          forceSelection();
        }}
        onSubmit={(asset: IAsset[]) => {
          if (asset[0]) {
            createImage(asset[0]);
          }
          setAssetOpen(false);
        }}
      />
      <InsertLinkDialog
        isOpen={linkOpen}
        onDismiss={() => {
          setLinkOpen(false);
          setReadOnly(false);
        }}
        onInsert={(data) => {
          createLink(data);
          setLinkOpen(false);
          setReadOnly(false);
        }}
      />
      <InsertAceDialog
        isOpen={aceOpen}
        onDismiss={() => {
          setAceOpen(false);
          forceSelection();
        }}
        onInsert={(data) => {
          if (data) {
            createAce(data?.mode);
          }
          setAceOpen(false);
        }}
      />
      <ContentTypesComponentsSelectPanel
        isOpen={componentsOpen}
        filter={{
          type: 'component'
        }}
        onDismiss={() => setComponentsOpen(false)}
        onSubmit={(e) => {
          createComponent(e?.[0].name);
          setComponentsOpen(false);
        }}
      />
    </>
  );
};

const UtilityButtons: React.FC = () => {
  const classes = useToolbarStyles();
  const {disabled} = useExtendedFormContext();
  const {editorState} = useRichtext();
  const {openSnackbar} = useSnackbar();

  const styles = useToolbarStyles();

  return (
    <>
      <div className={styles.group}>
        <DefaultButton
          iconProps={{iconName: 'Copy'}}
          label='Copy'
          className={classes.button}
          disabled={disabled}
          onMouseDown={() => {
            try {
              copyToClipboard(
                JSON.stringify(convertToRaw(editorState.getCurrentContent()))
              );
              openSnackbar({
                message: 'Raw content copied',
                messageBarType: MessageBarType.success
              })
            } catch {
              //
            }
            return false;
          }}
        />
      </div>
    </>
  );
}


const RichtextToolbar = () => {
  return (
    <>
      <BlockButtons/>
      <InlineButtons/>
      <ActionButtons/>
      <UtilityButtons/>
    </>
  )
}

export default RichtextToolbar;
