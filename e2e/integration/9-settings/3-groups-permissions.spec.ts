import {GroupHelper} from '../../helpers/group.helper'

describe('Group Permissions Test', () => {
  before(() => {
    cy.login();
  });

  it('creates a group with permissions', () => {
    cy.visit('/settings/groups');

    cy.get('[data-cy="groups-commandBar-add"]').click();

    cy.get('[data-cy="groups-add-name"]').type('Permissions Group');
    cy.get('[data-cy="groups-add-description"]').type('Group with test permissions');

    cy.get('[data-cy="permissions-chips"]')
      .find('[data-cy="permissions-chips-item"]')
      .should('have.length', 0);

    cy.get('[data-cy="groups-add-tabs"] [data-content="Manage Permissions"]').click();
    cy.get('[data-cy="groups-add"]')
      .find(GroupHelper.selectors.permissionItem)
      .first()
      .find('.ms-Check')
      .click();

    cy.get('[data-cy="groups-add-tabs"] [data-content="General"]').click();
    cy.get('[data-cy="permissions-chips"]')
      .find('[data-cy="permissions-chips-item"]')
      .should('have.length.at.least', 1);

    cy.get('[data-cy="groups-add-submit"]').click();
  })

  it('validates and updates permissions', () => {
    cy.visit('/settings/groups');

    cy.get(GroupHelper.selectors.listItem).contains('Permissions Group')
      .closest(GroupHelper.selectors.listItem)
      .dblclick();

    cy.get('[data-cy="permissions-chips"]')
      .find('[data-cy="permissions-chips-item"]')
      .should('have.length.at.least', 1);

    cy.get('[data-cy="groups-edit-tabs"] [data-content="Manage Permissions"]').click();
    cy.get('[data-cy="groups-edit"]')
      .find(GroupHelper.selectors.permissionItem)
      .eq(2)
      .find('.ms-Check')
      .click();

    cy.get('[data-cy="groups-edit-tabs"] [data-content="General"]').click();

    cy.get('[data-cy="permissions-chips"]')
      .find('[data-cy="permissions-chips-item"]')
      .should('have.length.at.least', 1);

    cy.get('[data-cy="groups-edit-submit"]').click();
  })

  it('deletes the group', () => {
    cy.visit('/settings/groups');

    cy.get(GroupHelper.selectors.listItem).contains('Permissions Group')
      .closest(GroupHelper.selectors.listItem)
      .click();

    GroupHelper.deleteSelected();

    cy.get(GroupHelper.selectors.listItem).contains('Permissions Group')
      .should('have.length', 0);
  })
})
