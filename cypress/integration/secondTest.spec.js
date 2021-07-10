

describe('Test log out', () => {
    beforeEach('login to the app', () => {
        cy.loginToApplication()
    })

    it('should log the user out', () => {
        cy.contains('Settings').click()
        cy.contains('Or click here to logout').click()
        cy.get('.navbar-nav').should('contain', 'Sign up')
    })
})