# Reddit With React - Backend
## Motivation
React is a fantastic tool for quickly performing client-side rendering based on
ephemeral, pre-defined data, but the ephemeral nature of this data degrades
website usefulness. As an experiment, take the frontend you built in the
previous tutorial, create a post, and then refresh the page. You will notice
that the post you added will disappear and only the posts that you manually
defined in the react component will remain. Try the same experiment again with
adding karma (the up and down arrows) and a similar result will ensue.

The state attribute that you relied on to create the posts and store data only
lives as long as the browser session. To keep our data persistent, you require
some non-volatile storage. The state problem is where the backend comes in.

Early versions of the backend you will create will also be volatile where all
memory is stored in the web server's process. However, as things become more
complex, the tutorial will introduce the idea of a database which stores all
data on disk that persists even when the computer hosting the database restarts.

## Table of Contents
1. [Setting up the Project](#setting-up-the-project)
2. [Baby Steps with Koa](#baby-steps-with-koa)
    1. [What is KoaJS](#what-is-koajs)

## Setting up the Project
1. Make sure you have the
   [Reddit-with-React](https://github.com/sigdotcom/Reddit-With-React)
   repository cloned. The finalized version of this code will be located in
   `backend/` for an example of what is come.
2. (OPTIONAL) Download [yarn](https://yarnpkg.com/en/). If you do not do this
   step, replace all subsequent yarn commands with their npm equivalents.
3. Download [docker](https://www.docker.com/). A more in-depth discussion of
   what docker is will occur in a later section. Just trust for now.

## Baby Steps with Koa
### What is KoaJS
We will design our backend server using the [KoaJS web
framework](https://koajs.com/). A **web framework** is a set of abstractions
that allow you to build web servers with 'batteries included'. Frameworks like
KoaJS allow the developer to forget about parsing the HTTP protocol, sending
valid responses to the users, and a variety of other features depending on the
framework. A more complete look of what a **web framework** does can be found
[here](https://jeffknupp.com/blog/2014/03/03/what-is-a-web-framework/). The
resource talks about python web framework Django and Flask which but similar
principles apply.

The complete documentation for KoaJS can be found [on their
website](https://koajs.com/). I recommend that you skim this documentation. It
is a great resource.

### Installation
1. Create a directory to contain all of the backend code
```bash
# linux
mkdir -p <path_to_folder>
# windows
mkdir <path_to_folder>
```
2. Navigate to the directory
```bash
# linux + windows
cd <path_to_folder>
```
3. Install the necessary packages
```bash
yarn add koa koa-router koa-bodyparser koa-session
```
4. Install necessary development dependencies
```bash
yarn add --dev @types/koa @types/koa-router @types/koa-bodyparser @types/koa-session ts-node tslint typescript
```
5. TODO: add download for package.json and tslint

### The Application
The bread and butter of Koa is its application object. From the official
documentation:
> The application object is Koa's **interface with node's http server** and
> handles the **registration of middleware**, dispatching to the middleware from
> http, default error handling, as well as **configuration of the context, request
> and response objects** ([source](https://github.com/koajs/koa#koa-application)).


#### Example
To demonstrate the basics of the application, an obligatory Hello World example.

Create `app.js` an paste the following code:
```javascript
// Import the koa library and store the residual module object in the Koa
// variable. This will be used to instantiate the actual Koa object that handles
// incoming requests. Look at the require documentation for more information.
const Koa = require('koa');

// Create our Koa object.
const app = new Koa();

// Register middleware. Notice the async keyword and ctx parameter, these will
// be discussed later.
app.use(async ctx => {
 // Set the body of the response to be 'Hello World'
 ctx.body = 'Hello World';
});

// Start the HTTP server on port 5000 and listen for requests
app.listen(5000, () => {console.log("Starting app at http://localhost:5000")});
```

Then, run `app.js` with:
```bash
>>> node app.js
Starting app at <url>
```

Navigate to `<url>` in your web browser and you should see "Hello World".

## Middleware
Koa's powerful infrastructure and ecosystem comes from middleware. Middleware
are asynchronous functions with a stack-like control flow. The middleware flow
is actions are executed downstream and then the control flow returns upstream.
Essentially, that means that functions are called in order of registering and
when they return, they return execution to the middleware above it. An example:

### Example
```javascript
const Koa = require('koa');
const app = new Koa();

app.use(async (ctx, next) => {
  console.log("1: Initiating connection");
  // Another instance of async/await, don't worry about that yet
  await next();
  console.log("3: Returning control flow upstream");
});

app.use(async ctx => {
  console.log("2: Setting return to Hello World");
  ctx.body = 'Hello World';
});

app.listen(5000, () => console.log("Running server on http://localhost:5000"));
```

## Context
The Koa context object encapsulates node's request and response objects and
provides many useful utilities for interacting with the objects. A Context
object is made *per request* and lives until the request is complete. The
Context is passed to every middleware in the following fashion:
```javascript
app.use(async ctx => {
  ctx; // is the Context
  ctx.request; // is a Koa Request
  ctx.response; // is a Koa Response
});

// or
app.use(async (ctx, next) => {
  ctx; // is the Context
  ctx.request; // is a Koa Request
  ctx.response; // is a Koa Response
});
```

The `ctx` object gives you metadata about the incoming request and allows you to
craft a response to the request. The documentation for the Context, Request, and
Response APIs can be found on the [official documentation](https://koajs.com/).

### Async/Await
Koa is built upon the JavaScript concept of async/await. There is a lot of
context required to understand async/await. A good tutorial on the matter can be
found [here](https://javascript.info/async).

## React with Reddit Backend
Now that have context about Koa, we will write the authentication backend for
the Reddit site.

A description for a route or URL on the backend will have the following format:
+ `<url>/`
    - **<request\_type>**: description
    - **<request\_type>**: description
+ `<url>/`
    - **<request\_type>**: description

A breakdown of the routes:
+ `signup/`
    - **POST**: Will receive a JSON from the react frontend with the following
      format:
        ```
        {
            'username': foo,
            'password': bar,
        }
        ```
        The backend will then save this data in a dictionary with the key being
        the username and the value being the password. On a successful login,
        will return a 200 code and return the JSON back to the user. On
        unsucessful login, will return a 400 request with the error code.
+ `login/`
    - **POST**: Will receive a JSON from the react frontend with the following
      format:
        ```
        {
            'username': foo,
            'password': bar,
        }
        ```
        With this JSON, the backend will perform a lookup in the account
        dictionary and see if the key exists. Then, it will check whether the
        password match. If there is an error, will return 400 status code with
        error message; otherwise, will return 200 status with the login
        credentials returned
### Router
To create each of the URLs, we will be using
[koa-router](https://github.com/alexmingoia/koa-router). This is a routing
middleware which allows you to easily create routes and add logic to them just
like you would a standard middleware. 

#### Example
```javascript
var Koa = require('koa');
var Router = require('koa-router');

var app = new Koa();
var router = new Router();

router.get('/', (ctx, next) => {
  // ctx.router available
});

app
  .use(router.routes())
  .use(router.allowedMethods());
```

### Signup Route
To create the signup route, overwrite your `app.js` with the following code
```javascript
var Koa = require('koa');
// Collect the routing middleware
var Router = require('koa-router');
// Collect middleware for automaticall parsing the body of the request
var bodyParser = require('koa-bodyparser');

var app = new Koa();
// Create a new Router that will build the Koa middleware for you to manage the
// routes
var router = new Router();

// Create object to store the accounts
var accounts = {};

// Register body parsing middleware
app.use(bodyParser());

// Listen for POST request at /signup/
router.post('/signup/', (ctx, next) => {
  request_body = ctx.request.body

  if(!request_body.hasOwnProperty("username")) {
      ctx.throw(400, "You must specify 'username'");
  }
  if(!request_body.hasOwnProperty("password")) {
      ctx.throw(400, "You must specify 'password'");
  }

  if(request_body["username"] in accounts) {
    ctx.throw(400, "Username already exists");
  }

  accounts[request_body["username"]] = request_body["password"]
  ctx.body = request_body
});

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(5000, () => {console.log("Starting app at http://localhost:5000")});
```

Now the user can:
1. Submit a post request to `signup`.
2. Create a user if the JSON within the POST data is formatted properly.
3. See any error that occurs in the data processing.

Try it out! Make some post requests to the backend using the `Create Account`
button.

You can also send POST requests manually using python (or any other languages).
If you have python I would recommend using the `requests` library with the
following code:
```bash
# Install requests
> pip install --user requests
```

Create a python file and copy the code:
```python
import requests

response = requests.post(
    "http://localhost:5000/signup",
    json={"username": "test", "password": "test"}
)
print(response.content)
```

Run the python script:
```bash
> python <path_to_script>
```

## Login Route
To add the `login` route, overwrite your `app.js` with the following code:
```javascript
