
export const GroupHelper = {
  createGroup: (name, description) => {
    cy.get('[data-cy="groups-commandBar-add"]').click();
    cy.get('[data-cy="groups-add-name"]').type(name);
    cy.get('[data-cy="groups-add-description"]').type(description);
    cy.get('[data-cy="groups-add-submit"]').click();
  },
  editGroup: (name, description) => {
    cy.get('[data-cy="groups-commandBar-edit"]').click();
    cy.get('[data-cy="groups-edit-name"]').clear().type(name);
    cy.get('[data-cy="groups-edit-description"]').clear().type(description);
    cy.get('[data-cy="groups-edit-submit"]').click();
  },
  deleteSelected: () => {
    cy.get('[data-cy="groups-commandBar-delete"]').click();
    cy.get('[data-cy="dialog-confirm"]').click();
  },
  selectors: {
    listItemSelect: '[data-automationid="ListCell"] .ms-Check',
    listItem: '[data-automationid="ListCell"]',
    permissionItem: '[data-automationid="ListCell"]'
  }
}

