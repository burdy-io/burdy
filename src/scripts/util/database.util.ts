export const getDatabaseType = (type: string) => {
  switch (type) {
    case 'postgres':
      return 'postgres';
    case 'mysql':
      return 'mysql';
    case 'mariadb':
      return 'mariadb';
    default:
      return 'better-sqlite3';
  }
}
