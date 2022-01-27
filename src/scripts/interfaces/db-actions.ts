/**
 * DB Actions are used as a communicator between CLI and the Burdy Project.
 * Ensure that all types are parsable by JSON and primitives, as the communication is done via webpack.
 */

export type AbstractDbAction<T extends string, P extends {}> = {
  type: T;
  payload: P;
};

export type ImportAction = AbstractDbAction<'import', {
  file: string;
  force: boolean;
  publish: boolean;
}>;

export type ExportAction = AbstractDbAction<'export', {
  file: string;
  force: boolean;
}>;

export type GenerateApiKeyAction = AbstractDbAction<'generateApiKey', {
  name: string;
}>;

export type DbAction =
  ImportAction |
  ExportAction |
  GenerateApiKeyAction;
