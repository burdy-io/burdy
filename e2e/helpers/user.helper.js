
export const UserHelper = {
  createUser: (email, firstName, lastName) => {
    cy.get('[data-cy="users-commandBar-add"]').click();
    cy.get('[data-cy="users-add-email"]').type(email);
    cy.get('[data-cy="users-add-password"]').type('test-password');
    cy.get('[data-cy="users-add-firstName"]').type(firstName);
    cy.get('[data-cy="users-add-lastName"]').type(lastName);
    cy.get('[data-cy="users-add-submit"]').click();
  },
  editUser: (firstName, lastName) => {
    cy.get('[data-cy="users-commandBar-edit"]').click();
    cy.get('[data-cy="users-edit-firstName"]').clear().type(firstName);
    cy.get('[data-cy="users-edit-lastName"]').clear().type(lastName);
    cy.get('[data-cy="users-edit-submit"]').click();
  },
  deleteSelected: () => {
    cy.get('[data-cy="users-commandBar-delete"]').click();
    cy.get('[data-cy="dialog-confirm"]').click();
  },
  deactivateSelected: () => {
    cy.get('[data-cy="users-commandBar-deactivate"]').click();
    cy.get('[data-cy="dialog-confirm"]').click();
  },
  activateSelected: () => {
    cy.get('[data-cy="users-commandBar-activate"]').click();
    cy.get('[data-cy="dialog-confirm"]').click();
  },
  selectors: {
    listItemSelect: '[data-automationid="ListCell"] .ms-Check',
    listItem: '[data-automationid="ListCell"]',
    groupRow: '[data-automationid="DetailsRow"]',
  }
}
