import {AssetHelper} from '../../helpers/asset.helper'

describe('Asset Rename Test', () => {
  before(() => {
    cy.login();
  })

  beforeEach(() => {
    cy.setLocalStorage('assetDefaultView', '"tiles"');
  })

  it('renames folder', () => {
    cy.visit('/assets');
    AssetHelper.createFolder('Root Folder');
    cy.get(AssetHelper.selectors.assetTile).contains('Root Folder').should('have.length', 1);
    cy.get(AssetHelper.selectors.assetTileSelect).first().click();
    AssetHelper.renameAction('Renamed Folder');
    cy.get(AssetHelper.selectors.assetTile).contains('Renamed Folder').should('have.length', 1);
    cy.get(AssetHelper.selectors.assetTileSelect).click();
    AssetHelper.deleteAction();
    cy.get(AssetHelper.selectors.assetTile).should('have.length', 0);
  });
})
