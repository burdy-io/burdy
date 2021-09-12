import React, {useEffect} from "react";
import {useRichtext} from "@admin/config-fields/dynamic-richtext.context";
import {useExtendedFormContext} from "@admin/config-fields/dynamic-form";
import {Controller} from "react-hook-form";
import Draft, {convertToRaw, DraftHandleValue, Editor, EditorState, Modifier} from "draft-js";
import {Label, makeStyles} from "@fluentui/react";
import RichtextToolbar from "@admin/config-fields/richtext/components/richtext-toolbar";
import DraftImageBlock from "@admin/config-fields/richtext/blocks/draft-image-block";

const useStyles = makeStyles((theme) => ({
  editorToolbar: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    '> *': {
      marginBottom: 4
    }
  },
  editor: {
    display: 'grid',
    minHeight: 200,
    maxHeight: 400,
    overflowY: 'auto',
    border: `1px solid ${theme.palette.neutralSecondary}`,
    padding: 8,
    '.DraftEditor-root': {
      height: '100% !important'
    },
    '&:hover': {
      cursor: 'text'
    }
  },
  editorDisabled: {
    background: theme.semanticColors.disabledBackground,
    borderColor: theme.semanticColors.disabledBorder,
    color: theme.semanticColors.disabledText
  },
  callout: {
    width: 320,
    padding: '20px 24px'
  }
}));

export interface IDynamicTextProps {
  field: any;
  name?: string;
  control?: any;
}

const RichText: React.FC<IDynamicTextProps> = ({field, name, control}) => {
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
    forceUpdateState
  } = useRichtext();

  const {disabled} = useExtendedFormContext();

  const disableHeaderBlock = (): DraftHandleValue => {
    const contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();

    const currentBlockType = contentState.getBlockForKey(selection.getStartKey()).getType();

    if (!/^header-\w+$/i.test(currentBlockType)) {
      return 'not-handled';
    }

    const splitBlockContent = Modifier.splitBlock(
      contentState,
      selection
    );

    const newLineEditorState = EditorState.push(
      editorState,
      splitBlockContent,
      'split-block'
    );

    const newLineSelection = newLineEditorState.getSelection();
    const newLineContent = newLineEditorState.getCurrentContent();

    setEditorState(
      EditorState.push(
        newLineEditorState,
        Modifier.setBlockType(newLineContent, newLineSelection, 'unstyled'),
        'change-block-type'
      )
    )

    return 'handled';
  }

  useEffect(() => {
    setKeyMap([
      {
        key: 'b',
        name: 'bold',
        ctrlKey: true,
        handle: () => toggleInlineStyle('BOLD')
      },
      {
        key: 'i',
        name: 'italic',
        ctrlKey: true,
        handle: () => toggleInlineStyle('ITALIC')
      },
      {
        key: 'u',
        name: 'underline',
        ctrlKey: true,
        handle: () => toggleInlineStyle('UNDERLINE')
      },
      {
        key: '1',
        name: 'h1',
        ctrlKey: true,
        handle: () => toggleBlockType('header-one')
      },
      {
        key: '2',
        name: 'h2',
        ctrlKey: true,
        handle: () => toggleBlockType('header-two')
      },
      {
        key: '3',
        name: 'h3',
        ctrlKey: true,
        handle: () => toggleBlockType('header-three')
      },
      {
        key: '4',
        name: 'h4',
        ctrlKey: true,
        handle: () => toggleBlockType('header-four')
      },
      {
        key: '5',
        name: 'h5',
        ctrlKey: true,
        handle: () => toggleBlockType('header-five')
      },
      {
        key: '6',
        name: 'h6',
        ctrlKey: true,
        handle: () => toggleBlockType('header-six')
      },
      {
        key: 'o',
        name: 'ordered-list',
        ctrlKey: true,
        handle: () => toggleBlockType('unordered-list-item')
      },
      {
        key: 'u',
        name: 'unordered-list',
        ctrlKey: true,
        handle: () => toggleBlockType('ordered-list-item')
      }
    ]);
  }, [editorState]);

  return (
    <div>
      <Controller
        name={name}
        control={control}
        render={({field: controllerField}) => {
          useEffect(() => {
            controllerField.onChange(
              JSON.stringify(convertToRaw(editorState.getCurrentContent()))
            );
          }, [name, editorState, forceUpdateState]);

          return (
            <>
              <Label>
                {field?.label?.length > 0 ? field?.label : field?.name}
              </Label>
              <div className={classes.editorToolbar}>
                <RichtextToolbar />
              </div>
              <div className={`${classes.editor} ${disabled && classes.editorDisabled}`} data-cy={`richtext-${name}`}>
                <Editor
                  ref={editor}
                  editorState={editorState}
                  onChange={(state) => {
                    setEditorState(state);
                  }}
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
                          editable: false
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
        }}
      />
    </div>
  );
};


export default RichText;
