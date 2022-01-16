import {AssetHelper} from '../../helpers/asset.helper'

describe('General Folder Tests', () => {
  before(() => {
    cy.login();
  })

  beforeEach(() => {
    cy.setLocalStorage('assetDefaultView', '"list"');
  })

  it('creates a folder', () => {
    cy.visit('/assets');
    AssetHelper.createFolder('Root Folder');
    cy.contains('.page-content', 'Root Folder');
    cy.get('body').find(AssetHelper.selectors.listItem).should('have.length', 1);
  })

  it('creates multi-level folders', () => {
    cy.visit('/assets');

    cy.get(AssetHelper.selectors.listItem).first().click();

    AssetHelper.createFolder('Sub Folder 1');
    AssetHelper.createFolder('Sub Folder 2');
    AssetHelper.createFolder('Sub Folder 3');

    cy.get('body').find(AssetHelper.selectors.listItem).should('have.length', 3);
  })

  it('deletes multiple folders', () => {
    cy.visit('/assets');

    cy.get(AssetHelper.selectors.listItem).first().click();

    cy.get(AssetHelper.selectors.listItemSelect).eq(0).click();
    cy.get(AssetHelper.selectors.listItemSelect).eq(1).click();

    AssetHelper.deleteAction();

    cy.get('body').find('[data-automationid="ListCell"]').should('have.length', 1);
  })

  it('deletes root folder', () => {
    cy.visit('/assets');
    cy.get(AssetHelper.selectors.listItemSelect).first().click();

    AssetHelper.deleteAction();

    cy.get('body').find(AssetHelper.selectors.listItem).should('have.length', 0);
  })
})
