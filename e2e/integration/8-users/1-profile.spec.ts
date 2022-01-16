import {UserHelper} from '../../helpers/user.helper'
import faker from 'faker';


describe('User Profile Test', () => {
  before(() => {
    cy.login();
  })

  it('updates profile', () => {
    cy.visit('/users')
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();

    cy.findUser(Cypress.env('email')).dblclick();

    cy.editUser({
      basic: { firstName, lastName }
    })

    cy.findUser(Cypress.env('email')).should('contain', `${firstName} ${lastName}`);

    cy.wait(500);

    cy.findUser(Cypress.env('email')).dblclick();

    cy.editUser({
      basic: {
        firstName: Cypress.env('firstName'),
        lastName: Cypress.env('lastName')
      }
    })

    cy.findUser(Cypress.env('email')).should('contain', `${Cypress.env('firstName')} ${Cypress.env('lastName')}`);
  })
})
