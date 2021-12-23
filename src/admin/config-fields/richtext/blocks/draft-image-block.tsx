import {ContentBlock, ContentState, EditorState, Modifier, SelectionState} from "draft-js";
import {useRichtext} from "@admin/config-fields/dynamic-richtext.context";
import {
  ContextualMenu,
  ContextualMenuItemType,
  IContextualMenuItem,
  makeStyles,
  TextField,
  useTheme
} from "@fluentui/react";
import React, {useEffect, useMemo, useState} from "react";
import classNames from "classnames";

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'grid',
    justifyContent: 'center',
    alignItems: 'center',
    '&.left': {
      justifyContent: 'flex-start'
    },
    '&.right': {
      justifyContent: 'flex-end'
    }
  },
  captionField: {
    '& .ms-TextField-fieldGroup': {
      border: 'none !important'
    },
    '& input': {
      fontSize: theme.fonts.small.fontSize,
      textAlign: 'center'
    },
    '& input::placeholder': {
      fontSize: theme.fonts.small.fontSize,
      textAlign: 'center',
      fontStyle: 'italic'
    }
  },
  image: {
    maxWidth: '100%',
    maxHeight: 300,
    border: `1px solid ${theme.palette.neutralLight}`,
    cursor: 'context-menu'
  }
}))

const DraftImageBlock = (props: any) => {
  const classes = useStyles();
  const theme = useTheme();
  const contentState = props.contentState as ContentState;
  const contentBlock = props.block as ContentBlock;
  const selectionState = props.selection as SelectionState;
  const entityKey = contentBlock.getEntityAt(0);
  const {npath, caption, align} = contentState.getEntity(entityKey).getData();
  const {setEditorProps, editorProps, setEditorState, editorState, forceUpdate} = useRichtext();
  const [captionValue, setCaptionValue] = useState<string>(caption ?? '');
  const [alignment, setAlignment] = useState(align ?? 'center');
  const [contextMenuTarget, setContextMenuTarget] = useState<MouseEvent|null>(null);


  const setReadOnly = (readOnly: boolean) => {
    setEditorProps({...editorProps, readOnly});
  }

  useEffect(() => {
    contentState.mergeEntityData(entityKey, { caption: captionValue });
    forceUpdate();
  }, [captionValue]);

  useEffect(() => {
    contentState.mergeEntityData(entityKey, { align: alignment });
    forceUpdate();
  }, [alignment])

  const contextMenuItems = useMemo<IContextualMenuItem[]>(() => [
    {
      key: 'align-left',
      text: 'Align Left',
      disabled: alignment === 'left',
      iconProps: {
        iconName: 'AlignLeft'
      },
      onClick: () => {
        setAlignment('left');
      }
    },
    {
      key: 'align-center',
      text: 'Align Center',
      disabled: alignment === 'center',
      iconProps: {
        iconName: 'AlignCenter'
      },
      onClick: () => {
        setAlignment('center');
      }
    },
    {
      key: 'align-right',
      text: 'Align Right',
      disabled: alignment === 'right',
      iconProps: {
        iconName: 'AlignRight'
      },
      onClick: () => {
        setAlignment('right');
      }
    },
    { key: 'divider', itemType: ContextualMenuItemType.Divider },
    {
      key: 'remove',
      text: 'Remove',
      iconProps: {
        iconName: 'Delete',
        style: { color: theme.palette.red }
      },
      onClick: () => {
        const blockKey = contentBlock.getKey();
        const previousSelection = editorState.getSelection();
        const selection = SelectionState.createEmpty(blockKey).merge({focusOffset: contentBlock.getLength()});

        const newContentState = Modifier.removeRange(
          contentState,
          selection,
          'backward'
        );

        const blockMap = newContentState.getBlockMap().delete(contentBlock.getKey());
        const withoutAtomic = newContentState.merge({
          blockMap,
          selectionAfter: selection,
        });

        const newEditorState = EditorState.push(
          editorState,
          withoutAtomic as any,
          'remove-range',
        );

        setEditorState(
          EditorState.forceSelection(newEditorState, previousSelection)
        )
      }
    }
  ], [theme, alignment, contentState, selectionState, setEditorState, editorState]);

  return (
    <div className={classNames(classes.container, {
      left: alignment === 'left',
      right: alignment === 'right'
    })}>
      <img
        src={`/api/assets/single?npath=${npath}`} className={classes.image} alt=""
        onContextMenu={(e) => {
          setContextMenuTarget(e.nativeEvent)
          e.preventDefault();
        }}
      />
      <TextField
        className={classes.captionField}
        onFocus={() => setReadOnly(true)}
        onBlur={() => setReadOnly(false)}
        value={captionValue}
        onChange={e => setCaptionValue(e.currentTarget.value)}
        placeholder="Caption"
        name="caption"
        autoComplete="off"
      />
      <ContextualMenu
        target={contextMenuTarget}
        items={contextMenuItems}
        hidden={contextMenuTarget === null}
        onDismiss={() => setContextMenuTarget(null)}
        onItemClick={() => setContextMenuTarget(null)}
      />
    </div>
  );
};

export default DraftImageBlock;
