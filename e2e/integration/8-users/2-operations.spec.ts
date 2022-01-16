import faker from 'faker';

describe('User Operations Test', () => {
  const email = faker.internet.email().toLowerCase();

  before(() => {
    cy.login();
  })

  it('creates a user', () => {
    cy.visit('/users');
    cy.createUser({email});
  })

  it('verifies user exists', () => {
    cy.visit('/users');
    cy.findUser(email).should('exist');
  })

  it('activates and deactivates a user', () => {
    cy.visit('/users');

    cy.selectUser(email);
    cy.findUser(email).should('contain', 'active');

    cy.deactivateSelectedUsers();

    cy.findUser(email).should('contain', 'disabled');

    cy.activateSelectedUsers();

    cy.findUser(email).should('contain', 'active');
  })

  it('deletes a user', () => {
    cy.visit('/users');

    cy.findUser(email).click();
    cy.deleteSelectedUsers();

    cy.userList().should('not.contain', email);
  })
})
