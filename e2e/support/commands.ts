// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
import "cypress-localstorage-commands"
import 'cypress-file-upload';
import { IUser } from './extensions/user.commands';
import './extensions/user.commands';

declare global {
  namespace Cypress {
    interface Chainable {
      dataCy(value: string): Chainable;
    }

    interface cy {
      login(): void;

      // User
      createUser(user: IUser): void;
      editUser(user: IUser): void;
      selectUser(email: string): void;
      findUser(email: string): Chainable;
      userList(): Chainable;
      deleteSelectedUsers(): void;
      deactivateSelectedUsers(): void;
      activateSelectedUsers(): void;
    }
  }
}

Cypress.Commands.add('login', () => {
  cy.request('POST', `${Cypress.env('apiUrl')}/login`, {
    email: Cypress.env('email'),
    password: Cypress.env('password')
  })
})

Cypress.Commands.add('dataCy', (value) => {
  return cy.get(`[data-cy="${value}"]`);
})
