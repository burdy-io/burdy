import { Connection } from 'typeorm';

interface IDatabaseDriver {
  connection: Connection;
}

export { IDatabaseDriver };
