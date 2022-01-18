

describe('Login test', () => {
  it('logs in', () => {
    cy.clearCookie('token');
    cy.visit('/');
    cy.location('pathname').should('eq', '/admin/login');

    cy.get('[data-cy="login-email"]').type(Cypress.env('email'));
    cy.get('[data-cy="login-password"]').type(Cypress.env('password'));
    cy.get('[data-cy="login-submit"]').click();

    cy.location('pathname').should('eq', '/admin/');
  })

  it('logs out', () => {
    cy.visit('/');

    cy.get('.ms-Persona-initials').click();
    cy.get('.ms-ContextualMenu-item:nth-child(2) .ms-ContextualMenu-itemText').click();
    cy.wait(500);
    cy.getCookie('token').should('be.null');
    cy.location('pathname').should('eq', '/admin/login');
  });
})
