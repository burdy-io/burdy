import {UserHelper} from '../../helpers/user.helper'
import faker from 'faker';

describe('User Membership Test', () => {
  const email = faker.internet.email().toLowerCase();

  before(() => {
    cy.login();
  })

  it('creates a user with groups', () => {
    cy.visit('/users');

    cy.get('[data-cy="users-commandBar-add"]').click();
    cy.get('[data-cy="users-add-email"]').type(email);
    cy.get('[data-cy="users-add-password"]').type('test-password');
    cy.get('[data-cy="users-add-firstName"]').type('Test');
    cy.get('[data-cy="users-add-lastName"]').type('Member');

    cy.get('[data-cy="users-add-tabs"] [data-content="Groups"]').click();
    cy.get('[data-cy="users-groups"]')
      .find(UserHelper.selectors.groupRow)
      .should('have.length', 0);

    cy.get('[data-cy="users-groups-add"]').click();
    cy.get('[data-cy="users-groups-panel"]')
      .find(UserHelper.selectors.groupRow)
      .should('have.length', 2);

    cy.get(`[data-cy="users-groups-panel"] ${UserHelper.selectors.groupRow} .ms-Check`).each(e => e.click());
    cy.get('[data-cy="users-groups-submit"]').click();

    cy.get('[data-cy="users-groups"]')
      .find(UserHelper.selectors.groupRow)
      .should('have.length', 2);

    cy.get('[data-cy="users-groups-add"]').click();
    cy.get('[data-cy="users-groups-panel"]')
      .find(UserHelper.selectors.groupRow)
      .should('have.length', 0);

    cy.get('[data-cy="users-groups-cancel"]').click();
    cy.get('[data-cy="users-groups"]').find(UserHelper.selectors.groupRow).eq(1).click();
    cy.get('[data-cy="users-groups-remove"]').click();
    cy.get('[data-cy="users-groups"]')
      .find(UserHelper.selectors.groupRow)
      .should('have.length', 1);

    cy.get('[data-cy="users-add-submit"]').click();

    cy.wait(500);

    cy.get(UserHelper.selectors.listItem).contains(email)
      .closest(UserHelper.selectors.listItem)
      .contains('Admin')
      .should('have.length', 1);
  });

  it('updates a user with groups', () => {
    cy.visit('/users');

    cy.get(UserHelper.selectors.listItem).contains(email)
      .closest(UserHelper.selectors.listItem)
      .click();

    cy.get('[data-cy="users-commandBar-edit"]').click();

    cy.get('[data-cy="users-edit-tabs"] [data-content="Groups"]').click();
    cy.get('[data-cy="users-groups"]')
      .find(UserHelper.selectors.groupRow)
      .contains('Admin')
      .should('have.length', 1);

    cy.get('[data-cy="users-groups-add"]').click();
    cy.get('[data-cy="users-groups-panel"]')
      .find(UserHelper.selectors.groupRow)
      .should('have.length', 1);

    cy.get('[data-cy="users-groups-cancel"]').click();
    cy.get('[data-cy="users-groups"]')
      .find(UserHelper.selectors.groupRow)
      .first()
      .click();

    cy.get('[data-cy="users-groups-remove"]').click();
    cy.get('[data-cy="users-groups-add"]').click();

    cy.get('[data-cy="users-groups-panel"]')
      .find(UserHelper.selectors.groupRow)
      .should('have.length', 2);

    cy.get('[data-cy="users-groups-panel"]').contains('User')
      .closest(UserHelper.selectors.groupRow)
      .click();

    cy.get('[data-cy="users-groups-submit"]').click();
    cy.get('[data-cy="users-groups"]').contains('User')
      .should('have.length', 1);

    cy.get('[data-cy="users-edit-submit"]').click();

    cy.get(UserHelper.selectors.listItem).contains(email)
      .closest(UserHelper.selectors.listItem)
      .contains('User')
      .should('have.length', 1);
  });

  it('deletes a user with groups', () => {
    cy.visit('/users');

    cy.get(UserHelper.selectors.listItem).contains(email)
      .closest(UserHelper.selectors.listItem)
      .click();

    UserHelper.deleteSelected();

    cy.get(UserHelper.selectors.listItem).contains(email).should('have.length', 0);
  })
})
