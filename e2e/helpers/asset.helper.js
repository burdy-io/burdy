
export const AssetHelper = {
  createFolder: (name = '') => {
    cy.get('[data-cy="assets-commandBar-new"]').click();
    cy.get('[data-cy="assets-commandBar-new-folder"]').click();
    cy.get('[data-cy=assets-createFolder-name]').click();
    cy.get('[data-cy=assets-createFolder-name]').type(name);
    cy.get('[data-cy=assets-createFolder-submit]').click();
  },
  deleteAction: () => {
    cy.get('[data-cy="assets-commandBar-delete"]').click();
    cy.get('[data-cy="assets-deleteConfirm"]').click();
  },
  renameAction: (name = '') => {
    cy.get('[data-cy="assets-commandBar-rename"]').click();
    cy.get('[data-cy="assets-rename-name"]').clear().type(name);
    cy.get('[data-cy="assets-rename-submit"]').click();
  },
  selectors: {
    assetTileSelect: '[data-automationid="ListCell"] .ms-Tile-check',
    assetTile: '[data-automationid="ListCell"] .ms-Tile',
    listItem: '[data-automationid="DetailsRowCell"][data-automation-key="column2"]',
    listItemSelect: '[data-automationid="ListCell"] .ms-Check',
    dropzone: '[data-name="dropzone"]'
  }
}

