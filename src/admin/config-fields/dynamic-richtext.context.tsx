import React, {createContext, useCallback, useContext, useRef, useState} from 'react';
import {
  DraftHandleValue,
  Editor, EditorProps,
  EditorState,
  getDefaultKeyBinding,
  RichUtils,
} from 'draft-js';
import { withWrapper } from '@admin/helpers/hoc';

interface RichtextContextInterface {
  editorState: EditorState;
  setEditorState: (state: EditorState) => void;
  editor: React.MutableRefObject<Editor>;
  toggleInlineStyle: (style: string) => void;
  toggleBlockType: (blockType: string) => void;
  keyMap: KeyMap;
  setKeyMap: (keyMap: KeyMap) => void;
  handleKeypress: (e: React.KeyboardEvent) => string;
  handleKeyCommand: (command: string) => DraftHandleValue;
  editorProps: EditorProps;
  setEditorProps: (props: EditorProps) => void;
  forceUpdate: () => void;
  forceUpdateState: boolean;
}

const DynamicRichtextContext = createContext<RichtextContextInterface>(
  {} as any
);

type KeyMap = {
  key: string;
  handle: () => void;
  name: string;
  ctrlKey?: boolean;
  altKey?: boolean;
}[];

interface RichtextContextProviderProps {
  defaultKeyMap?: KeyMap;
  defaultEditorState?: EditorState;
}

const RichtextContextProvider: React.FC<RichtextContextProviderProps> = ({
  children,
  defaultKeyMap = [],
  defaultEditorState,
}) => {
  const editor = useRef<Editor>();
  const [editorState, setEditorState] = useState(
    defaultEditorState ?? (() => EditorState.createEmpty())
  );
  const [keyMap, setKeyMap] = useState<KeyMap>(defaultKeyMap);
  const [editorProps, setEditorProps] = useState<EditorProps>()
  const [forceUpdate, setForceUpdate] = useState(false);

  const forceUpdateFn = useCallback(() => {
    setForceUpdate(!forceUpdate);
  }, [forceUpdate])

  const toggleInlineStyle = (style: string) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));
  };

  const toggleBlockType = (blockType: string) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  const handleKeypress = (e: React.KeyboardEvent) => {
    const { key } = e;
    const availableKeyMaps = keyMap.filter((item) => {
      if (item.key !== key) {
        return false;
      }

      if (item?.ctrlKey && !e.ctrlKey) {
        return false;
      }

      if (item?.altKey && !e.altKey) {
        return false;
      }

      return true;
    });

    return availableKeyMaps?.[0]?.name ?? getDefaultKeyBinding(e);
  };

  const handleKeyCommand = (command: string) => {
    const keyCommand = keyMap.find((k) => k.name === command);

    if (keyCommand?.handle) {
      keyCommand.handle();
      return 'handled';
    }

    const newState = RichUtils.handleKeyCommand(editorState, command)

    if (newState) {
      setEditorState(newState);
      return 'handled';
    }

    return 'not-handled';
  };

  return (
    <DynamicRichtextContext.Provider
      value={{
        editor,
        editorState,
        setEditorState,
        toggleBlockType,
        toggleInlineStyle,
        keyMap,
        setKeyMap,
        handleKeypress,
        handleKeyCommand,
        editorProps,
        setEditorProps,
        forceUpdate: forceUpdateFn,
        forceUpdateState: forceUpdate,
      }}
    >
      {children}
    </DynamicRichtextContext.Provider>
  );
};

export const useRichtext = () => useContext(DynamicRichtextContext);
export const withRichtext = withWrapper(RichtextContextProvider);
export const withCustomRichtext = (props: RichtextContextProviderProps) =>
  withWrapper(RichtextContextProvider, props);
export default RichtextContextProvider;
