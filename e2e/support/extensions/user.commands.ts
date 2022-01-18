import faker from 'faker';
import { UserHelper } from '../../helpers/user.helper';

const selectors = {
  listItemSelect: '[data-automationid="ListCell"] .ms-Check',
  listItem: '[data-automationid="ListCell"]',
  groupRow: '[data-automationid="DetailsRow"]',
}

export interface IUser {
  email?: string;
  password?: string;
  basic?: {
    firstName: string;
    lastName: string;
  }
  groups?: string[];
}

Cypress.Commands.add('createUser', (user: IUser) => {
  cy.get('[data-cy="users-commandBar-add"]').click();
  cy.get('[data-cy="users-add-email"]').type(user.email ?? faker.internet.email());
  cy.get('[data-cy="users-add-password"]').type(user?.password ?? faker.internet.password(8));
  cy.get('[data-cy="users-add-firstName"]').type(user.basic?.firstName ?? faker.name.firstName());
  cy.get('[data-cy="users-add-lastName"]').type(user.basic?.lastName ?? faker.name.lastName());

  cy.get('[data-cy="users-add-submit"]').click();
});

Cypress.Commands.add('selectUser', (email: string) => {
  cy.findUser(email).find('.ms-Check').click();
});

Cypress.Commands.add('deleteSelectedUsers', () => {
  cy.get('[data-cy="users-commandBar-delete"]').click();
  cy.get('[data-cy="dialog-confirm"]').click();
});

Cypress.Commands.add('deactivateSelectedUsers', () => {
  cy.get('[data-cy="users-commandBar-deactivate"]').click();
  cy.get('[data-cy="dialog-confirm"]').click();
});

Cypress.Commands.add('activateSelectedUsers', () => {
  cy.get('[data-cy="users-commandBar-activate"]').click();
  cy.get('[data-cy="dialog-confirm"]').click();
});

Cypress.Commands.add('userList', () => {
  cy.get(selectors.listItem);
})

Cypress.Commands.add('findUser', (email: string) => {
  cy.userList().contains(email).closest(selectors.listItem);
});

Cypress.Commands.add('editUser', (user: IUser) => {
  if (user.basic) {
    cy.get('[data-cy="users-edit-firstName"]').clear().type(user.basic.firstName);
    cy.get('[data-cy="users-edit-lastName"]').clear().type(user.basic.lastName);
  }

  cy.get('[data-cy="users-edit-submit"]').click();
})

