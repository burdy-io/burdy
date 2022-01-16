
export const ContentTypesHelper = {
  create: (name, fields, option = 0) => {
    cy.get('[data-cy="contentTypes-commandBar-new"]').click();

    cy.get('[data-cy="contentTypes-add-name"]').type(name);
    cy.get('[data-cy="contentTypes-add-type"]').click();

    cy.get('.ms-Dropdown-item[data-index]').should('have.length', 4);
    cy.get(`.ms-Dropdown-item[data-index="${option}"]`).click();

    fields.forEach(({name, label, type}) => {
      cy.get('[data-cy="contentTypes-fieldsList-addField"]').click();

      cy.get('[data-cy="contentTypes-fieldsSelect"]')
        .find(ContentTypesHelper.selectors.fieldListItem)
        .contains(type)
        .click();

      cy.get('[data-cy="contentTypes-fieldsSelect-config"]').click();
      cy.get('[data-cy="contentTypes-fieldsConfig-name"]').type(name);
      cy.get('[data-cy="contentTypes-fieldsConfig-label"]').type(label);
      cy.get('[data-cy="contentTypes-fieldsConfig-confirm"]').click();

      cy.get('[data-cy="contentTypes-fieldsList-item-title"]').should('exist');
    })

    cy.get('[data-cy="contentTypes-add-confirm"]').click();

    cy.get(ContentTypesHelper.selectors.contentTypesListItem)
      .contains(name)
      .should('exist');
  },
  deleteSelected: () => {
    cy.get('[data-cy="contentTypes-commandBar-delete"]').click();
    cy.get('[data-cy="dialog-confirm"]').click();
  },
  selectors: {
    fieldListItem: '[data-automationid="ListCell"]',
    contentTypesListItem: '[data-automationid="ListCell"]'
  }
}

