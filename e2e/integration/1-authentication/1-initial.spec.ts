

describe('Initialization Test', () => {
  it('creates first account', () => {
    cy.visit('/');

    cy.location('pathname').should('eq', '/admin/init');

    cy.get('[data-cy="welcome-firstName"]').type(Cypress.env('firstName'));
    cy.get('[data-cy="welcome-lastName"]').type(Cypress.env('lastName'));
    cy.get('[data-cy="welcome-email"]').type(Cypress.env('email'));
    cy.get('[data-cy="welcome-password"]').type(Cypress.env('password'));
    cy.get('[data-cy="welcome-submit"]').click();

    cy.location('pathname').should('eq', '/admin/');
  })
})
