export interface IPermission {
  id: string;
  name: string;
  description?: string;
  children?: IPermission[];
}
