import React, {useRef, useState} from "react";
import {
  FocusZone,
  Stack,
  StackItem,
  Text,
  FocusTrapCallout,
  makeStyles,
  PrimaryButton,
  DefaultButton, ActionButton
} from "@fluentui/react";
import {
  CompositeDecorator,
  ContentBlock,
  ContentState,
  EditorState,
  Modifier,
  RichUtils,
  SelectionState
} from "draft-js";
import {useForm} from "react-hook-form";
import {useRichtext} from "@admin/config-fields/dynamic-richtext.context";
import {ControlledCombobox, ControlledTextField} from "@admin/components/rhf-components";


const useStyles = makeStyles((theme) => ({
  link: {
    color: `${theme.palette.themePrimary} !important`,
    display: 'inline-block',
    fontStyle: 'italic',
    cursor: 'context-menu'
  },
  callout: {
    padding: '20px 24px',
    minWidth: 320
  },
  calloutTitle: {
    marginBottom: 12
  },
  calloutStack: {
    marginTop: 20,
  },
  removeLinkText: {
    color: theme.palette.red
  }
}));

const findLinkEntities = (contentBlock, callback, contentState) => {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();
    return (
      entityKey !== null &&
      contentState.getEntity(entityKey).getType() === 'LINK'
    );
  }, callback);
};

export const createLinkDecorator = () => new CompositeDecorator([
  {
    strategy: findLinkEntities,
    component: DraftLinkInline
  }
]);

const DraftLinkInline = ({children, entityKey, blockKey, ...props}) => {
  const classes = useStyles();

  const contentState = props.contentState as ContentState;
  const entity = contentState.getEntity(entityKey);
  const block = contentState.getBlockForKey(blockKey);
  const {url, target} = entity.getData();

  const link = useRef<HTMLDivElement>(null);
  const {forceUpdate, editorProps, setEditorProps, setEditorState, editorState} = useRichtext();
  const [calloutOpen, setCalloutOpen] = useState(false);

  const {control, handleSubmit, reset} = useForm({
    defaultValues: {
      target: target ?? '_self',
      url: url ?? ''
    }
  });

  const removeLink = () => {
    const selection = SelectionState.createEmpty(blockKey).merge({ focusOffset: block.getText().length });
    setEditorState(RichUtils.toggleLink(editorState, selection, null));
    setReadOnly(false);
  }

  const submit = handleSubmit(data => {
    contentState.mergeEntityData(entityKey, {...data});
    forceUpdate();
    setReadOnly(false);
    setCalloutOpen(false);
  });

  const setReadOnly = (readOnly: boolean) => {
    setEditorProps({...editorProps, readOnly});
  }

  const openCallout = (e?: React.MouseEvent) => {
    reset({url, target});
    setCalloutOpen(true);
    setReadOnly(true);
    e?.preventDefault();
  }

  const closeCallout = () => {
    setCalloutOpen(false);
    setReadOnly(false);
  }

  return (
    <>
      <div onContextMenu={openCallout} className={classes.link} ref={link}>
        {children}
      </div>
      {calloutOpen && (
        <FocusTrapCallout
          className={classes.callout}
          hidden={!calloutOpen}
          onDismiss={closeCallout}
          target={link}
          setInitialFocus
          contentEditable={false}
        >
          <form onSubmit={submit}>
            <Text className={classes.calloutTitle} block variant="large">
              Edit link
            </Text>
            <Stack tokens={{childrenGap: 8}}>
              <ControlledTextField
                name="url"
                label="URL"
                control={control}
                onRenderLabel={(labelProps, defaultRender) => (
                  <Stack horizontal verticalAlign="center" horizontalAlign="space-between">
                    <StackItem>
                      {defaultRender(labelProps)}
                    </StackItem>
                    <StackItem className={classes.removeLinkText} onClick={removeLink}>
                      <ActionButton>
                        Remove Link
                      </ActionButton>
                    </StackItem>
                  </Stack>
                )}
              />
              <ControlledCombobox
                control={control}
                name="target"
                label="Target"
                options={[{
                  key: '_self',
                  text: 'Self',
                }, {
                  key: '_blank',
                  text: 'Blank',
                }]}
              />
            </Stack>
            <FocusZone>
              <Stack tokens={{childrenGap: 12}} className={classes.calloutStack} horizontalAlign="end" horizontal>
                <StackItem>
                  <PrimaryButton type="submit">Save</PrimaryButton>
                </StackItem>
                <StackItem>
                  <DefaultButton onClick={closeCallout}>Cancel</DefaultButton>
                </StackItem>
              </Stack>
            </FocusZone>
          </form>
        </FocusTrapCallout>
      )}
    </>
  );
};

export default DraftLinkInline;
