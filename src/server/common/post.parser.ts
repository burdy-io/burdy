import { unflatten } from '@server/common/object';
import { IPost } from '@shared/interfaces/model';
import _ from 'lodash';
import { getAssetsSrc } from '@server/common/mappers';

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

  const parseRichtext = (content) => {
    try {
      const richtext = JSON.parse(content);
      Object.keys(richtext?.entityMap || {}).forEach(key => {
        try {
          if (richtext?.entityMap?.[key]?.type === 'IMAGE' && richtext?.entityMap?.[key]?.data?.npath) {
            richtext.entityMap[key].data.src = getAssetsSrc(richtext.entityMap[key].data.npath);
          } else if (richtext?.entityMap?.[key]?.type === 'COMPONENT') {
            richtext.entityMap[key].data = {
              ...(richtext.entityMap[key].data || {}),
              value: parseGroup(richtext?.entityMap?.[key]?.data?.value || {})
            }
          }
        } catch {
          //
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
        assets[`${path}.${index}`] = asset?.npath;
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
        references[`${path}.${index}`] = relation?.slugPath;
      });
      return parsed;
    } catch {
      return null;
    }
  };

  const parseReferenceSingle = (content, path) => {
    references[path] = content?.slugPath;
  };

  const parseReferenceMultiple = (content, path) => {
    if (Array.isArray(content || [])) {
      (content || []).forEach((reference, index) => {
        references[`${path}.${index}`] = reference?.slugPath;
      });
    }
    return null;
  };

  const parseGroup = (content = {}, path?: string) => {
    if (_.isEmpty(content)) return null;
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
            groupContent[contentKey] = parseRichtext(content?.[contentKey]);
            break;
          case 'zone':
            groupContent[contentKey] = parseZone(content?.[contentKey], newPath);
            break;
          case 'relation':
            groupContent[contentKey] = parseRelation(content?.[contentKey], newPath);
            break;
          case 'reference_single':
            groupContent[contentKey] = parseReferenceSingle(content?.[contentKey], newPath);
            break;
          case 'reference_multiple':
            groupContent[contentKey] = parseReferenceMultiple(content?.[contentKey], newPath);
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

export const parseInternalMetaContent = (post: IPost, path?: string) => {
  const metaObjFlattened = {};
  (post?.meta || []).forEach((item) => {
    metaObjFlattened[item.key] = item.value;
  });

  const metaObj = unflatten(metaObjFlattened);

  const parseList = (content, path) => {
    const array = [];
    (content || []).filter(el => !!el).forEach((elContent, index) => {
      const itemPath = path ? `${path}.[${index}]` : `[${index}]`;
      array.push(parseGroup(elContent, itemPath));
    });
    return array;
  };

  const parseGroup = (content = {}, path?: string) => {
    if (!content) content = {};
    const groupContent = _.cloneDeep(content);
    Object.keys(content).forEach(key => {
      if (key.endsWith('_$type')) {
        const contentKey = key.slice(0, key.indexOf('_$type'));
        const newPath = path ? `${path}.${contentKey}` : contentKey;
        switch (content[key]) {
          case 'group':
          case 'custom':
            groupContent[contentKey] = parseGroup(content?.[contentKey], newPath);
            break;
          case 'zone':
          case 'repeatable':
            groupContent[contentKey] = parseList(content?.[contentKey], newPath);
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
    ...metaObj,
    content: group,
  };
};
