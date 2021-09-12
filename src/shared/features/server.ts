import express from 'express';
import chalk from 'chalk';
import { launchApi } from './api';
import Hooks from './hooks';

const launch = async () => {
  try {
    await Hooks.doAction('core/init');
    const app = express();
    const apiApp = await launchApi();
    app.use('/api', apiApp);
    await Hooks.doAction('server/init', app);

    app.use(async (_req, res) => {
      const response = await Hooks.applyFilters(
        'server/notFound',
        res.status(404).json({ message: 'not_found' })
      );
      response.send();
    });

    const port = process.env.SERVER_PORT || 4000;

    app.listen(port, () => {
      console.log(chalk.green(`Express started on ${port} port.`));
    }).on('error', (e) => {
      console.log(e);
      console.log(chalk.red('Error starting Express'));
    });
  } catch (e) {
    console.log(e);
    console.log(chalk.red('Error starting Express'));
  }
};

export { launch };
