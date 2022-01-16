import {SettingsHelper} from '../../helpers/settings.helper'

describe('Settings Test', () => {
  before(() => {
    cy.login();
  })

  it('visits the settings', () => {
    cy.visit('/settings/general')
  })
})
