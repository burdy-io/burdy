import {IContentType} from "@shared/interfaces/model";
import PathUtil from "@scripts/util/path.util";
import {formatISO} from 'date-fns';
import fs from 'fs-extra'
import ConsoleOutput from "@scripts/util/console-output.util";

type IExportedContentType = Omit<IContentType, 'id' | 'createdAt' | 'updatedAt'>;

type GetBurdyContentType = () => IExportedContentType;
type GetBurdyContentTypes = () => IExportedContentType[];

interface ComponentFile {
  getContentType?: GetBurdyContentType;
  getContentTypes?: GetBurdyContentTypes;
}

const joinContentTypes = (files: ComponentFile[]): IExportedContentType[] => {
  const contentTypes: IExportedContentType[] = [];

  files.forEach(({getContentType, getContentTypes}) => {
    try {
      const singleContentType = getContentType?.();
      const multiContentTypes = getContentTypes?.();

      if (singleContentType) {
        contentTypes.push(singleContentType);
      }

      if (multiContentTypes) {
        contentTypes.push(...multiContentTypes);
      }
    } catch (e) {
      console.log(e);
    }
  })

  return contentTypes;
}

const writeContentTypes = async (contentTypes: IExportedContentType[], path: string = undefined) => {
  if (!path) {
    path = PathUtil.burdyRoot(
      'content-types',
      `export-${formatISO(new Date)}.json`
    );
  }

  await fs.ensureFile(path);
  await fs.writeJson(path, contentTypes, {spaces: 2, EOL: '\n'});
  ConsoleOutput.info(`Content types exported in ${path}.`);
}

export {GetBurdyContentType, GetBurdyContentTypes, IExportedContentType, joinContentTypes, writeContentTypes}
