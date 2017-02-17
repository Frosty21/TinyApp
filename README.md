# Project Description
### Goal
This three-day project will have you building a tiny (pun intended) web app using Node. The app will allow users to shorten long URLs much like TinyURL.com, bit.ly, and the like.

Unlike last project where you build an HTTP Client which makes requests to the GitHub server, this one will have you building the HTTP Server to handle requests from the browser (client).

You'll get introduced to some more advanced JavaScript and node concepts and also learn more about Express, a mini web framework which is extremely popular in the node community.

By the end of the week you will hopefully also have deployed it the "Cloud" so that anyone can use it.

### Functional Requirements
As an avid twitter poster, 
I want to be able to shorten links 
so that I can fit more non-link text in my tweets.

When I visit http://localhost:3000/ 
Then I see a form which contains a field to submit a URL and a button

When I fill in the form with a URL and submit it 
Then I see a page with the original URL, a short URL and link to go back to the submission form

As an avid twitter poster, 
I want to be able to see how many times my subscribers visit my links 
so that I can learn what content they like.

When I visit http://localhost:3000/ 
Then I see a login form

When I submit the login form Then I am logged in

Given I submitted links when I was logged in When I visit /urls Then I see my links and the number of visits each had

As a twitter reader, 
I want to be able to visit sites via shortened links, 
so that I can read interesting content.

When I visit a short link 
Then I am redirected to the page corresponding to the short URL's original URL
### Technical Specification

GET /

- if user is logged in:
	- redirect -> /urls
- if user is not logged in:
	- redirect -> /login
GET /urls

- if user is not logged in:
	- returns a 401 response, HTML with a relevant error message and a link to /login
- if user is logged in:
	- returns a 200 response, HTML with:
	- the site header (see below)
	- a table of urls the user has created, each row:
	- short url
	- long url
	- edit button -> GET /urls/:id
	- delete button -> POST /urls/:id/delete
	- date created (stretch)
	- number of visits (stretch)
	- number of unique visits (stretch)
	- a link to "Create a New Short Link" -> /urls/new
GET /urls/new

- if user is not logged in:
	- returns a 401 response, HTML with:
	- error message
	- a link to /login
- if user is logged in:
	- returns a 200 response, HTML with:
	- the site header (see below)
a form, which contains:
text input field for the original URL
submit button -> POST /urls
GET /urls/:id

if url w/ :id does not exist:
returns a 404 response, HTML with a relevant error message
if user is not logged in:
returns a 401 response, HTML with a relevant error message and a link to /login
if logged in user does not match the user that owns this url:
returns a 403 response, HTML with a relevant error message
if all is well:
returns a 200 response, HTML with:
the short url
date created (stretch)
number of visits (stretch)
number of unique visits (stretch)
a form, which contains:
the long url
"update" button -> POST /urls/:id
"delete" button -> POST /urls/:id/delete
GET /u/:id

if url with :id exists:
redirect -> the corresponding longURL
otherwise:
returns a 404 response, HTML with a relevant error message
POST /urls

if user is logged in:
generates a shortURL, saves the link and associates it with the user
redirect -> /urls/:id
if user is not logged in:
returns a 401 response, HTML with a relevant error message and a link to /login
POST /urls/:id

if url with :id does not exist:
returns a 404 response, HTML with a relevant error message
if user is not logged in:
returns a 401 response, HTML with a relevant error message and a link to /login
if user does not match the url owner:
returns a 403 response, HTML with a relevant error message
if all is well:
updates the url
redirect -> /urls/:id
GET /login

if user is logged in:
redirect -> /
if user is not logged in:
returns a 200 response, HTML with:
a form which contains:
input fields for email and password
submit button -> POST /login
GET /register

if user is logged in:
redirect -> /
if user is not logged in:
returns a 200 response, HTML with:
a form, which contains:
input fields for email and password
"register" button -> POST /register
POST /register

if email or password are empty:
returns a 400 response, with a relevant error message
if email already exists:
returns a 400 response, with a relevant error message
if all is well:
creates a user
encrypts their password with bcrypt
sets a cookie
redirect -> /
POST /login

if email & password params match an existing user:
sets a cookie
redirect -> /
if they don't match:
returns a 401 response, HTML with a relevant error message
POST /logout

deletes cookie
redirect -> /
THE SITE HEADER:

if a user is logged in, the header shows:
user's email
"My Links" link -> /urls
logout button -> POST /logout
if not logged in, the header shows:
a link to the log-in page /login
a link to the registration page /register
Stack Requirements
ES6
Node
express
git for version control
cookie-session for session storage
bcrypt for password encryption



