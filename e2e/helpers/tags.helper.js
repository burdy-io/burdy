
export const TagsHelper = {
  createTag: (name, slug) => {
    cy.get('[data-cy="tags-commandBar-new"]').click();
    cy.get('[data-cy="tags-create-name"]').clear().type(name);
    cy.get('[data-cy="tags-create-slug"]').clear().type(slug);
    cy.get('[data-cy="tags-create-submit"]').click();
  },
  updateTag: (name, slug) => {
    cy.get('[data-cy="tags-commandBar-update"]').click();
    cy.get('[data-cy="tags-update-name"]').clear().type(name);
    cy.get('[data-cy="tags-update-slug"]').clear().type(slug);
    cy.get('[data-cy="tags-update-submit"]').click();
  },
  deleteSelected: () => {
    cy.get('[data-cy="tags-commandBar-delete"]').click();
    cy.get('[data-cy="dialog-confirm"]').click();
  },
  selectors: {
    item: '[data-cy="columns-view-item"]',
    column: '[data-cy="columns-view-column"]',
    container: '[data-cy="columns-view"]',
  }
}
