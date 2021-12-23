import React, { useEffect } from 'react';
import { useRichtext } from '@admin/config-fields/dynamic-richtext.context';
import { useExtendedFormContext } from '@admin/config-fields/dynamic-form';
import {
  convertFromRaw,
  convertToRaw,
  DraftHandleValue,
  Editor,
  EditorState,
  Modifier,
  RichUtils
} from 'draft-js';
import { Label, makeStyles } from '@fluentui/react';
import RichtextToolbar from '@admin/config-fields/richtext/components/richtext-toolbar';
import DraftImageBlock from '@admin/config-fields/richtext/blocks/draft-image-block';
import DraftAceBlock from '@admin/config-fields/richtext/blocks/draft-ace-block';
import { useDebouncedCallback } from 'use-debounce';
import DraftComponentBlock from '@admin/config-fields/richtext/blocks/draft-component-block';

const useStyles = makeStyles((theme) => ({
  editorToolbar: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    '> *': {
      marginBottom: 4,
    },
  },
  editor: {
    display: 'grid',
    overflowY: 'auto',
    border: `1px solid ${theme.palette.neutralSecondary}`,
    padding: 8,
    '.DraftEditor-root': {
      height: '400px',
    },
    '&:hover': {
      cursor: 'text',
    },
    '* > figure': {
      marginInlineStart: 20,
      marginInlineEnd: 20,
    },
  },
  editorDisabled: {
    background: theme.semanticColors.disabledBackground,
    borderColor: theme.semanticColors.disabledBorder,
    color: theme.semanticColors.disabledText,
  },
  callout: {
    width: 320,
    padding: '20px 24px',
  },
}));

export interface IDynamicTextProps {
  field: any;
  name?: string;
  onChange?: (val: any) => void;
}

const RichText: React.FC<IDynamicTextProps> = ({ field, name, onChange }) => {
  const classes = useStyles();
  const {
    editorState,
    setEditorState,
    editor,
    setKeyMap,
    toggleInlineStyle,
    toggleBlockType,
    handleKeypress,
    handleKeyCommand,
    editorProps,
    forceUpdateState,
  } = useRichtext();

  const { disabled } = useExtendedFormContext();

  const disableHeaderBlock = (): DraftHandleValue => {
    const contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();

    const currentBlockType = contentState
      .getBlockForKey(selection.getStartKey())
      .getType();

    if (!/^header-\w+$/i.test(currentBlockType)) {
      return 'not-handled';
    }

    const focusOffset = selection.getFocusOffset();

    const splitBlockContent = Modifier.splitBlock(contentState, selection);

    const newLineEditorState = EditorState.push(
      editorState,
      splitBlockContent,
      'split-block'
    );

    const newLineSelection = newLineEditorState.getSelection();
    const newLineContent = newLineEditorState.getCurrentContent();

    if (focusOffset === 0) {
      setEditorState(
        newLineEditorState
      )
    } else {
      setEditorState(
        EditorState.push(
          newLineEditorState,
          Modifier.setBlockType(newLineContent, newLineSelection, 'unstyled'),
          'change-block-type'
        )
      );
    }

    return 'handled';
  };

  useEffect(() => {
    setKeyMap([
      {
        key: 'b',
        name: 'bold',
        ctrlKey: true,
        handle: () => toggleInlineStyle('BOLD'),
      },
      {
        key: 'i',
        name: 'italic',
        ctrlKey: true,
        handle: () => toggleInlineStyle('ITALIC'),
      },
      {
        key: 'u',
        name: 'underline',
        ctrlKey: true,
        handle: () => toggleInlineStyle('UNDERLINE'),
      },
      {
        key: '1',
        name: 'h1',
        ctrlKey: true,
        handle: () => toggleBlockType('header-one'),
      },
      {
        key: '2',
        name: 'h2',
        ctrlKey: true,
        handle: () => toggleBlockType('header-two'),
      },
      {
        key: '3',
        name: 'h3',
        ctrlKey: true,
        handle: () => toggleBlockType('header-three'),
      },
      {
        key: '4',
        name: 'h4',
        ctrlKey: true,
        handle: () => toggleBlockType('header-four'),
      },
      {
        key: '5',
        name: 'h5',
        ctrlKey: true,
        handle: () => toggleBlockType('header-five'),
      },
      {
        key: '6',
        name: 'h6',
        ctrlKey: true,
        handle: () => toggleBlockType('header-six'),
      },
      {
        key: 'o',
        name: 'ordered-list',
        ctrlKey: true,
        handle: () => toggleBlockType('unordered-list-item'),
      },
      {
        key: 'u',
        name: 'unordered-list',
        ctrlKey: true,
        handle: () => toggleBlockType('ordered-list-item'),
      },
    ]);
  }, [editorState]);

  const onTab = (e) => {
    e.preventDefault();

    // assign a constant for the new editorState
    const newState = RichUtils.onTab(e, editorState, 4);

    // if a new editor state exists, set editor state to new state
    // and return 'handled', otherwise return 'not-handled
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const handlePaste = (test, html, editorState) => {
    try {
      const parsed = JSON.parse(test);
      if (parsed?.entityMap && Array.isArray(parsed?.blocks)) {
        const contentState = convertFromRaw(parsed);
        const newEditorState = EditorState.createWithContent(contentState);
        setEditorState(newEditorState);
        return 'handled';
      }
    } catch {
      //
    }
    return 'not-handled';
  }

  const debounced = useDebouncedCallback((editorState) => {
    onChange(JSON.stringify(convertToRaw(editorState.getCurrentContent())));
  }, 300);

  useEffect(() => {
    debounced(editorState);
  }, [name, editorState, forceUpdateState]);

  return (
    <>
      <Label>{field?.label?.length > 0 ? field?.label : field?.name}</Label>
      <div className={classes.editorToolbar}>
        <RichtextToolbar />
      </div>
      <div
        className={`${classes.editor} ${disabled && classes.editorDisabled}`}
        data-cy={`richtext-${name}`}
      >
        <Editor
          ref={editor}
          editorState={editorState}
          onChange={(state) => {
            setEditorState(state);
          }}
          onTab={onTab}
          handlePastedText={handlePaste}
          handleReturn={disableHeaderBlock}
          readOnly={disabled}
          keyBindingFn={handleKeypress}
          handleKeyCommand={handleKeyCommand}
          blockRendererFn={(block) => {
            if (block.getType() === 'atomic') {
              const contentState = editorState.getCurrentContent();
              const entity = block.getEntityAt(0);
              if (!entity) return null;
              const type = contentState.getEntity(entity).getType();
              if (type === 'IMAGE') {
                return {
                  component: DraftImageBlock,
                  editable: false,
                };
              }
              if (type === 'TEXT_EDITOR') {
                return {
                  component: DraftAceBlock,
                  editable: true,
                };
              }
              if (type === 'COMPONENT') {
                return {
                  component: DraftComponentBlock,
                  editable: true,
                };
              }
              return null;
            }

            return null;
          }}
          spellCheck
          {...editorProps}
        />
      </div>
    </>
  );
};

export default RichText;
