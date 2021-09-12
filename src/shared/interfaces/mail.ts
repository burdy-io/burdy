import { Transporter } from 'nodemailer';

interface IMailDriver {
  transporter: Transporter;
}

export { IMailDriver };
