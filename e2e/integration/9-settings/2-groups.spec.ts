import {SettingsHelper} from '../../helpers/settings.helper'
import {GroupHelper} from '../../helpers/group.helper'

describe('Groups Test', () => {
  before(() => {
    cy.login();
  })

  it('has default groups', () => {
    cy.visit('/settings/groups');
    cy.get(GroupHelper.selectors.listItemSelect).should('have.length', 2);
  })

  it('creates a group', () => {
    cy.visit('/settings/groups')
    GroupHelper.createGroup('Test Group', 'Test Description');
    cy.wait(500);
    cy.get(GroupHelper.selectors.listItem).contains('Test Group')
      .closest(GroupHelper.selectors.listItem)
      .should('contain', 'Test Description');
  })

  it('updates a group', () => {
    cy.visit('/settings/groups')
    cy.get(GroupHelper.selectors.listItem).contains('Test Group')
      .closest(GroupHelper.selectors.listItem)
      .find('.ms-Check').click();

    GroupHelper.editGroup('Edited Group', 'Edited Description');
    cy.get(GroupHelper.selectors.listItem).contains('Edited Group')
      .closest(GroupHelper.selectors.listItem)
      .should('contain', 'Edited Description');
  })

  it('deletes a group', () => {
    cy.visit('/settings/groups')
    cy.get(GroupHelper.selectors.listItem).contains('Edited Group')
      .closest(GroupHelper.selectors.listItem)
      .find('.ms-Check').click();

    GroupHelper.deleteSelected();
    cy.get(GroupHelper.selectors.listItem).contains('Edited Group').should('have.length', 0);
  })
})
