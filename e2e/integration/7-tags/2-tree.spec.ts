import {TagsHelper} from '../../helpers/tags.helper'

describe('Tag Tree Test', () => {
  before(() => {
    cy.login();
  })

  it('creates a tree', () => {
    cy.visit('/tags');
    // 1 Parent and 3 children
    TagsHelper.createTag('Parent', 'parent');
    cy.wait(500);
    cy.get(TagsHelper.selectors.container).contains('parent')
      .closest(TagsHelper.selectors.item)
      .click();

    TagsHelper.createTag('Child 1', 'child-1');
    TagsHelper.createTag('Child 2', 'child-2');
    TagsHelper.createTag('Child 3', 'child-3');
    cy.wait(250);

    cy.get(TagsHelper.selectors.item + ':contains("child-")').should('have.length', 3);
  })

  it('updates the root tag', () => {
    cy.visit('/tags');

    cy.get(TagsHelper.selectors.container).contains('parent')
      .closest(TagsHelper.selectors.item)
      .click();

    TagsHelper.updateTag('Parent Updated', 'parent-updated');

    cy.get(TagsHelper.selectors.container).contains('parent-updated').should('have.length', 1);
  })

  it('deletes multiple tags', () => {
    cy.visit('/tags');

    cy.get(TagsHelper.selectors.container).contains('parent-updated')
      .closest(TagsHelper.selectors.item)
      .click();

    cy.get(TagsHelper.selectors.container).contains('child-1')
      .closest(TagsHelper.selectors.item)
      .click();

    cy.get(TagsHelper.selectors.container).contains('child-2')
      .closest(TagsHelper.selectors.item)
      .find('.ms-Check')
      .click();

    TagsHelper.deleteSelected();

    cy.wait(500);
    cy.get(TagsHelper.selectors.item).should('have.length', 1);
  })

  it('deletes the root tag', () => {
    cy.visit('/tags');

    cy.get(TagsHelper.selectors.container).contains('parent-updated')
      .closest(TagsHelper.selectors.item)
      .click();

    TagsHelper.deleteSelected();

    cy.get(TagsHelper.selectors.container).find(TagsHelper.selectors.item).should('have.length', 0)
  })
})
