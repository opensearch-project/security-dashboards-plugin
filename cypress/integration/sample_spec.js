// describe('Login succeeds', () => {
//   it('successfully logs in', () => {
//     cy.visit('http://localhost:5601')
//     // change URL to match your dev URL
//
//     cy.get('input[name=username]', {timeout: 30000}).type('admin', {timeout: 30000, force: true})
//
//     // {enter} causes the form to submit
//     cy.get('input[name=password]').type(`admin{enter}`, {timeout: 30000, force: true})
//
//     cy.url({timeout: 30000}).should('contain', '/home')
//   })
// })

describe('Login fails', () => {
  it('logs in fails', () => {
    cy.visit('http://localhost:5601')
    // change URL to match your dev URL

    cy.get('input[name=username]', {timeout: 30000}).type('admin2', {timeout: 30000, force: true})

    // {enter} causes the form to submit
    cy.get('input[name=password]').type(`admin{enter}`, {timeout: 30000, force: true})

    cy.get('.error-message', {timeout: 30000}).should('exist')
  })
})
