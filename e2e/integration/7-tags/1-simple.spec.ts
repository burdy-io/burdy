import {TagsHelper} from '../../helpers/tags.helper'

describe('Simple Tag Test', () => {
  before(() => {
    cy.login();
  })

  it('creates a tag', () => {
    cy.visit('/tags');
    TagsHelper.createTag('First', 'first');
    cy.wait(500);
    cy.get(TagsHelper.selectors.container).contains('first').should('have.length', 1);
  })

  it('has correct details', () => {
    cy.visit('/tags');
    cy.get(TagsHelper.selectors.container).contains('first')
      .closest(TagsHelper.selectors.item)
      .click();

    cy.get('[data-cy="tags-details-name"]').contains('First').should('have.length', 1);
    cy.get('[data-cy="tags-details-slug"]').contains('first').should('have.length', 1);
    cy.get('[data-cy="tags-details-author"]').contains(`${Cypress.env('firstName')} ${Cypress.env('lastName')}`).should('have.length', 1);
  })

  it('updates a tag', () => {
    cy.visit('/tags');
    cy.get(TagsHelper.selectors.container).contains('first')
      .closest(TagsHelper.selectors.item)
      .click();

    TagsHelper.updateTag('Updated', 'updated');
    cy.wait(500);
    cy.get(TagsHelper.selectors.item).contains('updated').should('have.length', 1);
  })

  it('deletes a tag', () => {
    cy.visit('/tags');
    cy.get(TagsHelper.selectors.item).contains('updated')
      .closest(TagsHelper.selectors.item)
      .find('.ms-Check')
      .click();

    TagsHelper.deleteSelected();
    cy.wait(500);
    cy.get(TagsHelper.selectors.container).contains('updated').should('have.length', 0);
  })
})
