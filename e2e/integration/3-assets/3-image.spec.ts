import {AssetHelper} from '../../helpers/asset.helper'

describe('Assets', () => {
  before(() => {
    cy.login();
  })

  beforeEach(() => {
    cy.setLocalStorage('assetDefaultView', '"tiles"');
  })

  it('uploads files', () => {
    cy.visit('/assets');
    cy.get(AssetHelper.selectors.dropzone)
      .attachFile(
        ['colors/red.jpg', 'colors/blue.jpg', 'colors/green.jpg'],
        {subjectType: 'drag-n-drop'}
      );

    cy.get('body').find(AssetHelper.selectors.assetTile).should('have.length', 3);
  })

  it('validates file details', () => {
    cy.visit('/assets');
    cy.get(AssetHelper.selectors.assetTile).each(e => {cy.wait(500);
      cy.get(e).click();
      cy.get('[data-cy="assets-commandBar-details"]').click();
      cy.get('[data-cy="assets-details-mimeType"]').contains('image/jpeg').should('exist');
      cy.get('[data-cy="assets-details-close"]').click();
    });
  })

  it('deletes files', () => {
    cy.visit('/assets');
    cy.get(AssetHelper.selectors.assetTileSelect).each(e => e.click());
    AssetHelper.deleteAction();
    cy.get('body').find(AssetHelper.selectors.assetTile).should('have.length', 0);
  })
})
