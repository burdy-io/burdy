import { Response } from 'express';
import React from 'react';
import {Connection, ConnectionOptions, EntitySchema} from 'typeorm';
import User from '../server/models/user.model';
import UserSession from '../server/models/user-session.model';
import Hooks from '../shared/features/hooks';
import SMTPTransport from "nodemailer/lib/smtp-transport";
import {Transporter} from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import {IPermission} from "@shared/interfaces/permissions";
import { IDashboardLink, IDashboardSection } from '@admin/features/dashboard';

// Extensible types / declarations for hooks
declare global {
  namespace Burdy {
    interface IActions {
      'server/init': [Express];
      'api/init': [Express];
      'core/init': [void];
      'core/firstInit': [void];

      // Database
      'db/init': [Connection, ConnectionOptions];

      // Mail
      'mail/init': [Transporter];
      'mail/dispatched': [any];

      // User
      'user/postLogin': [User];
      'user/postLogout': [User];
      'user/postCreate': [User];
      'user/postDelete': [User];
      'user/postDeleteMany': [User[]];

      [key: string]: any[];
    }

    interface IFilters {
      'server/notFound': [Response];

      'permissions/getAll': [IPermission[]];

      // Auth
      'auth/hasPermission': [boolean, User, Express.Request<any>];
      'auth/permissions': [string[], User]
      'auth/getUser': [User, Express.Request<any>];

      // Database
      'db/options': [ConnectionOptions];
      'db/connection': [Connection];
      'db/models': [(Function|EntitySchema)[]];

      // Mail
      'mail/options': [SMTPTransport.Options];
      'mail/send': [Mail.Options];

      // User
      'user/getMany': [User[]];
      'user/get': [User];

      // Content Types
      'contentType/fields': [any[]];

      [key: string]: any[];
    }

    interface ISyncFilters {
      'admin/field': [React.FC<any> | null, any];
      'dashboard/links': [IDashboardLink[]]
      'dashboard/sections': [IDashboardSection[]]
      [key: string]: any[];
    }
  }

  namespace Express {
    interface Request {
      data: {
        user?: User;
        session?: UserSession;
        [key: string]: any;
      };

      validate: (
        schema: any,
        type?: 'body' | 'query' | 'params'
      ) => Promise<void>;
    }

    namespace Multer {
      interface File {
        key?: string;
      }
    }
  }

  interface Window {
    Hooks: typeof Hooks;
  }
}
