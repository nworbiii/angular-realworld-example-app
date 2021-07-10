

describe('Test with backend', () => {

    beforeEach('login to the app', () => {
        cy.intercept({ method: 'GET', path: '**/tags' }, { fixture: 'tags.json' }) // request is made before login request; 3rd argument is the response
        cy.loginToApplication()
    })

    it('verify correct request and response', () => {
        cy.intercept('POST', '**/articles').as('postArticles') // save as alias postArticles

        cy.contains('New Article').click()
        cy.get('[formcontrolname="title"]').type('This is a title')
        cy.get('[formcontrolname="description"]').type('This is a description')
        cy.get('[formcontrolname="body"]').type('This is a body of the Article')
        cy.contains('Publish Article').click()

        cy.wait('@postArticles') // wait on completion of the call
        cy.get('@postArticles').then((xhr) => {
            console.log(xhr)
            expect(xhr.response.statusCode).to.equal(200)
            expect(xhr.request.body.article.body).to.equal('This is a body of the Article')
            expect(xhr.response.body.article.description).to.equal('This is a description')
        })
    })

    it('should intercept and modify the request and response', () => {
        // cy.intercept('POST', '**/articles', (req) => {
        //     req.body.article.description = "This is a description 2"
        // }).as('postArticles') // save as alias postArticles

        cy.intercept('POST', '**/articles', (req) => {
            req.reply((res) => {
                expect(res.body.article.description).to.equal('This is a description')
                res.body.article.description = "This is a description 2"
            })
        }).as('postArticles') // save as alias postArticles

        cy.contains('New Article').click()
        cy.get('[formcontrolname="title"]').type('This is a title')
        cy.get('[formcontrolname="description"]').type('This is a description')
        cy.get('[formcontrolname="body"]').type('This is a body of the Article')
        cy.contains('Publish Article').click()

        cy.wait('@postArticles') // wait on completion of the call
        cy.get('@postArticles').then((xhr) => {
            console.log(xhr)
            expect(xhr.response.statusCode).to.equal(200)
            expect(xhr.request.body.article.body).to.equal('This is a body of the Article')
            expect(xhr.response.body.article.description).to.equal('This is a description 2')
        })
    })

    it('should give tags with routing object', () => {
        cy.get('.tag-list')
            .should('contain', 'cypress')
            .and('contain', 'automation')
            .and('contain', 'testing')
    })

    it('should verify global feed likes count', () => {
        cy.intercept('GET', '**/articles/feed*', { "articles": [], "articlesCount": 0 })
        cy.intercept('GET', '**/articles*', { fixture: 'articles.json' })

        cy.contains('Global Feed').click()
        cy.get('app-article-list button').then((listOfButtons) => {
            expect(listOfButtons[0]).to.contain('1')
            expect(listOfButtons[1]).to.contain('5')
        })

        cy.fixture('articles').then((file) => {
            const articleLink = file.articles[1].slug
            cy.intercept('POST', '**/articles/' + articleLink + '/favorite', file)
        })

        cy.get('app-article-list button').eq(1).click().should('contain', '6')
    })

    it('should delete a new article in the global feed', () => {
        const title = "Request from API " + Date.now()

        const bodyRequest = {
            "article": {
                "tagList": [],
                "title": title,
                "description": "API testing is easy",
                "body": "Angular is cool"
            }
        }

        cy.get('@token').then((token) => {

            cy.request({
                url: 'https://conduit.productionready.io/api/articles/',
                headers: { 'Authorization': 'Token ' + token },
                method: 'POST',
                body: bodyRequest
            }).then((response) => {
                expect(response.status).to.equal(200)
            })

            cy.contains('Global Feed').click()
            cy.get('.article-preview').first().click()
            cy.get('.article-actions').contains('Delete Article').click()

            cy.request({
                url: 'https://conduit.productionready.io/api/articles?limit=10&offset=0',
                headers: { 'Authorization': 'Token ' + token },
                method: 'GET'
            }).its('body').then((body) => {
                expect(body.articles[0].title).not.to.equal(title)
            })
        })
    })
})