describe('Login succeeds', () => {
  it('successfully logs in', () => {
    cy.visit(`${Cypress.env('kibana')}`)
    // change URL to match your dev URL

    cy.get('input[name=username]', {timeout: 60000}).type('admin', {force: true})

    // {enter} causes the form to submit
    cy.get('input[name=password]').type('admin{enter}', {force: true})

    cy.url().should('contain', '/home')
  })
})

describe('Login fails', () => {
  it('logs in fails', () => {
    cy.visit(`${Cypress.env('kibana')}`)
    // change URL to match your dev URL

    cy.get('input[name=username]', {timeout: 60000}).type('admin2', {force: true})

    // {enter} causes the form to submit
    cy.get('input[name=password]').type('admin{enter}', {force: true})

    cy.get('.error-message').should('exist')
  })
})
