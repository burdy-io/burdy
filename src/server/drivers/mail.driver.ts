import nodemailer from 'nodemailer';
import { IMailDriver } from '@shared/interfaces/mail';
import chalk from 'chalk';
import Hooks from '@shared/features/hooks';
import Mail from 'nodemailer/lib/mailer';
import logger from '@shared/features/logger';

const mailDriver: IMailDriver = {
  transporter: undefined
};

const connectMailDriver = async () => {
  try {
    let transport = await Hooks.applyFilters('mail/options', null);

    if (!transport) {
      const testAccount = await nodemailer.createTestAccount();
      transport = {
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      }
    }

    mailDriver.transporter = nodemailer.createTransport(transport);

    await Hooks.doAction('mail/init', mailDriver.transporter);
    console.log(chalk.green('Connection to mail server established.'));
  } catch (e) {
    console.log(e);
    console.error(
      chalk.red('Error establishing connection to the mail server.')
    );
  }
};

const sendMail = async (options: Mail.Options) => {
  try {
    options = await Hooks.applyFilters('mail/send', options);
    const result = await mailDriver.transporter.sendMail(options);
    await Hooks.doAction('mail/dispatched', result);
  } catch (err) {
    logger.error('Failed to send email', err);
  }
}

export { connectMailDriver, mailDriver, sendMail };
