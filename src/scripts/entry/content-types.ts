import {joinContentTypes, writeContentTypes} from "@scripts/util/content-type.util";

declare const COMMAND: string;
declare const REQUIRE_STATEMENTS: {
  require: () => any;
  file: string;
}[];


const exportContentTypes = async () => {
  const components = [];

  REQUIRE_STATEMENTS.forEach(requireStatement => {
    try {
      components.push(requireStatement.require());
    } catch (e) {
      console.error('Failed to load ', requireStatement.file, '. Skipping...');
      console.log(e);
    }
  });

  const contentTypes = joinContentTypes(components);
  await writeContentTypes(contentTypes);
}

(async () => {
  switch (COMMAND) {
    case 'export':
    default:
      return exportContentTypes();
  }
})();
