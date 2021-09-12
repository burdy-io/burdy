import { unflatten } from '@server/common/object';
import { IPost } from '@shared/interfaces/model';
import _ from 'lodash';

export const parseContent = (post: IPost, path?: string) => {
  const metaObjFlattened = {};
  (post?.meta || []).forEach((item) => {
    metaObjFlattened[item.key] = item.value;
  });

  const metaObj = unflatten(metaObjFlattened);

  const assets = {};
  const references = {};

  const parseCheckbox = (content) => {
    return content === 'true' || content === true;
  }

  const parseRichtext = (content, path) => {
    try {
      const richtext = JSON.parse(content);
      Object.keys(richtext?.entityMap || {}).forEach(key => {
        if (richtext?.entityMap?.[key]?.type === 'IMAGE') {
          assets[`${path}.entityMap.${key}.data`] = richtext?.entityMap?.[key]?.data?.id;
        }
      });
      return richtext;
    } catch {
      return null;
    }
  };

  const parseAssets = (content, path) => {
    try {
      const parsed = JSON.parse(content);
      (parsed || []).forEach((asset, index) => {
        assets[`${path}.${index}`] = asset?.id;
      });
      return parsed;
    } catch {
      return null;
    }
  };

  const parseRepeatable = (content, path) => {
    const array = [];
    (content || []).forEach((elContent, index) => {
      const itemPath = path ? `${path}.[${index}]` : `[${index}]`;
      array.push(parseGroup(elContent, itemPath));
    });
    return array;
  };

  const parseZone = (content, path) => {
    const array = [];
    (content || []).forEach((elContent, index) => {
      const itemPath = path ? `${path}.[${index}]` : `[${index}]`;
      array.push(parseGroup(elContent, itemPath));
    });
    return array;
  };

  const parseRelation = (content, path) => {
    try {
      const parsed = JSON.parse(content);
      (parsed || []).forEach((relation, index) => {
        references[`${path}.${index}`] = relation?.id;
      });
      return parsed;
    } catch {
      return null;
    }

  };

  const parseGroup = (content = {}, path?: string) => {
    const groupContent = _.cloneDeep(content);
    Object.keys(content).forEach(key => {
      if (key.endsWith('_$type')) {
        const contentKey = key.slice(0, key.indexOf('_$type'));
        const newPath = path ? `${path}.${contentKey}` : contentKey;
        switch (content[key]) {
          case 'images':
          case 'assets':
            groupContent[contentKey] = parseAssets(content?.[contentKey], newPath);
            break;
          case 'group':
            groupContent[contentKey] = parseGroup(content?.[contentKey], newPath);
            break;
          case 'repeatable':
            groupContent[contentKey] = parseRepeatable(content?.[contentKey], newPath);
            break;
          case 'custom':
            groupContent[contentKey] = parseGroup(content?.[contentKey], newPath);
            break;
          case 'richtext':
            groupContent[contentKey] = parseRichtext(content?.[contentKey], newPath);
            break;
          case 'zone':
            groupContent[contentKey] = parseZone(content?.[contentKey], newPath);
            break;
          case 'relation':
            groupContent[contentKey] = parseRelation(content?.[contentKey], newPath);
            break;
          case 'checkbox':
            groupContent[contentKey] = parseCheckbox(content?.[contentKey]);
            break;
          default:
            break;
        }
      }
    });
    return groupContent;
  };

  const group = parseGroup(metaObj?.content, path);

  return {
    content: group,
    assets,
    references
  };
};
