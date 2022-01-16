

describe('Dashboard Navigation', () => {
  before(() => {
    cy.login();
  });

  it('navigates to assets', () => {
    cy.visit('/');
    cy.get('[data-cy=dashboard-assets]').click();
    cy.location('pathname').should('eq', '/admin/assets');
  })

  it('navigates to sites', () => {
    cy.visit('/');
    cy.get('[data-cy=dashboard-sites]').click();
    cy.location('pathname').should('eq', '/admin/sites');
  })

  it('navigates to content types', () => {
    cy.visit('/');
    cy.get('[data-cy=dashboard-content-types]').click();
    cy.location('pathname').should('eq', '/admin/content-types');
  })

  it('navigates to tags', () => {
    cy.visit('/');
    cy.get('[data-cy=dashboard-tags]').click();
    cy.location('pathname').should('eq', '/admin/tags');
  })

  it('navigates to users', () => {
    cy.visit('/');
    cy.get('[data-cy=dashboard-users]').click();
    cy.location('pathname').should('eq', '/admin/users');
  })

  it('navigates to settings', () => {
    cy.visit('/');
    cy.get('[data-cy=dashboard-settings]').click();
    cy.location('pathname').should('eq', '/admin/settings');
  })
})
