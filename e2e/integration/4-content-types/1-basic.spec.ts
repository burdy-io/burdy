import {ContentTypesHelper} from '../../helpers/content-types.helper'
import faker from 'faker';

describe('Basic Content Types Test', () => {
  const contentTypeName = faker.random.word().toLowerCase();
  const newContentTypeName = faker.random.word().toLowerCase();

  before(() => {
    cy.login();
  })

  it('creates a content type', () => {
    cy.visit('/content-types');

    cy.get('[data-cy="contentTypes-commandBar-new"]').click();

    cy.get('[data-cy="contentTypes-add-name"]').type(contentTypeName);
    cy.get('[data-cy="contentTypes-add-type"]').click();

    cy.get('.ms-Dropdown-item[data-index]').should('have.length', 4);
    cy.get('.ms-Dropdown-item[data-index="0"]').click();

    cy.get('[data-cy="contentTypes-fieldsList-addField"]').click();
    cy.get('[data-cy="contentTypes-fieldsSelect"]')
      .find(ContentTypesHelper.selectors.fieldListItem)
      .should('have.length.at.least', 10);

    cy.get('[data-cy="contentTypes-fieldsSelect-search"]').type('Text');

    cy.get('[data-cy="contentTypes-fieldsSelect"]')
      .find(ContentTypesHelper.selectors.fieldListItem)
      .contains(/^Text$/)
      .click();

    cy.get('[data-cy="contentTypes-fieldsConfig-label"]').type('Title');
    cy.get('[data-cy="contentTypes-fieldsConfig-confirm"]').click();

    cy.get('[data-cy="contentTypes-fieldsList-item-title"]').should('exist');

    cy.get('[data-cy="contentTypes-fieldsList-addField"]').click();

    cy.get('[data-cy="contentTypes-fieldsSelect-search"]').type('Rich Text');

    cy.get('[data-cy="contentTypes-fieldsSelect"]')
      .find(ContentTypesHelper.selectors.fieldListItem)
      .contains(/^Rich Text$/)
      .click();

    cy.get('[data-cy="contentTypes-fieldsConfig-label"]').type('Content');
    cy.get('[data-cy="contentTypes-fieldsConfig-confirm"]').click();

    cy.get('[data-cy="contentTypes-fieldsList-item-content"]').should('exist');

    cy.get('[data-cy="contentTypes-add-confirm"]').click();

    cy.get(ContentTypesHelper.selectors.contentTypesListItem)
      .contains(contentTypeName)
      .should('exist');
  })

  it('validates content type details', () => {
    cy.visit('/content-types');

    cy.get(ContentTypesHelper.selectors.contentTypesListItem).should('have.length', 1);

    cy.get(ContentTypesHelper.selectors.contentTypesListItem)
      .find('[data-automation-key="name"]')
      .contains(contentTypeName)
      .should('exist')

    cy.get(ContentTypesHelper.selectors.contentTypesListItem)
      .find('[data-automation-key="type"]')
      .contains('page')
      .should('exist')

    cy.get(ContentTypesHelper.selectors.contentTypesListItem)
      .find('[data-automation-key="author"]')
      .contains(`${Cypress.env('firstName')} ${Cypress.env('lastName')}`)
      .should('exist')
  })

  it('updates a content type', () => {
    cy.visit('/content-types');

    cy.get(ContentTypesHelper.selectors.contentTypesListItem).first().click();
    cy.get('[data-cy="contentTypes-commandBar-edit"]').click();

    cy.get('[data-cy="contentTypes-edit-name"]').should('have.value', contentTypeName);
    cy.get('[data-cy^="contentTypes-fieldsList-item"]').should('have.length', 2);

    cy.get('[data-cy="contentTypes-edit-name"]').clear().type(newContentTypeName);

    cy.get('[data-cy="contentTypes-fieldsList-addField"]').click();

    cy.get('[data-cy="contentTypes-fieldsSelect-search"]').type('Assets')

    cy.get('[data-cy="contentTypes-fieldsSelect"]')
      .find(ContentTypesHelper.selectors.fieldListItem)
      .contains(/^Assets$/)
      .click();

    cy.get('[data-cy="contentTypes-fieldsConfig-label"]').type('Thumbnail');
    cy.get('[data-cy="contentTypes-fieldsConfig-confirm"]').click();

    cy.get('[data-cy="contentTypes-fieldsList-item-thumbnail"]').should('exist');

    cy.get('[data-cy^="contentTypes-fieldsList-item"]').should('have.length', 3);
    cy.get('[data-cy="contentTypes-edit-confirm"]').click();

    cy.get(ContentTypesHelper.selectors.contentTypesListItem)
      .contains(newContentTypeName)
      .should('exist');
  })

  it('deletes a content type', () => {
    cy.visit('/content-types');
    cy.get(ContentTypesHelper.selectors.contentTypesListItem)
      .contains(newContentTypeName)
      .should('exist');

    cy.get(ContentTypesHelper.selectors.contentTypesListItem).first().click();

    ContentTypesHelper.deleteSelected();

    cy.get(ContentTypesHelper.selectors.contentTypesListItem).should('not.exist');
  })
})
