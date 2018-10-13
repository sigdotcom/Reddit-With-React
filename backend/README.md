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
    1. [REST Clients](#rest-clients)
2. [Baby Steps with Koa](#baby-steps-with-koa)
    1. [What is KoaJS](#what-is-koajs)
    2. [Installation](#installation)
    3. [The Application](#the-application)
        1. [Example](#example)
    4. [Middleware](#middleware)
        1. [Example](#example-1)
    5. [Context](#context)
    6. [Async/Await](#asyncawait)
3. [React with Reddit Backend](#react-with-reddit-backend)
    1. [Router](#router)
    2. [Signup Route](#signup-route)
    3. [Login Route](#login-route)
    4. [Disclaimer](#disclaimer)
4. [TypeScript](#typescript)
5. [Databases](#databases)
	1. [Object-relational mapping (ORM)](#object-relational-mapping-orm)
6. [TypeScript with Koa](#typescript-with-koa)
    1. [Installation](#installation-1)
    2. [Entities](#entities)
    3. [Sign-up V2](#sign-up-v2)
    4. [Login V2](#login-v2)
    5. [Project](#project)

## Setting up the Project
1. Make sure you have the
   [Reddit-with-React](https://github.com/sigdotcom/Reddit-With-React)
   repository cloned. The finalized version of this code will be located in
   `backend/` for an example of what is come.
2. (OPTIONAL) Download [yarn](https://yarnpkg.com/en/). If you do not do this
   step, replace all subsequent yarn commands with their npm equivalents.
3. Download [docker](https://www.docker.com/). A more in-depth discussion of
   what docker is will occur in a later section. Just trust for now.
4. Ensure that you have [virtualization
   enabled](https://www.howtogeek.com/213795/how-to-enable-intel-vt-x-in-your-computers-bios-or-uefi-firmware/).
   Restart your computer, go into the BIOS, and enable something along the lines
   of "virtualization", "intel VT", or "AMD-v"
### REST Clients
Throughout this tutorial, I will be making reference to "making a GET/POST
request" which is normally difficult to do on Windows. There are GUI REST
clients that will make testing of the API and visualizing what is going on much
easier. I will recommend:
1. [Postman](https://www.getpostman.com/)
2. [Insomnia](https://insomnia.rest/)

I will **NOT** be teaching you how to use them or make reference to them;
however, I would recommend looking into them. Pick whichever you think looks and
feels the best for you. Try both before you settle for one.

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
yarn add koa koa-router koa-bodyparser koa-session koa-cors koa-logger @koa/cors
```
4. Install necessary development dependencies
```bash
yarn add --dev @types/koa @types/koa-router @types/koa-bodyparser @types/koa-session @types/koa-cors ts-node tslint typescript
```

### The Application
The bread and butter of Koa is its application object. From the official
documentation:
> The application object is Koa's **interface with node's http server** and
> handles the **registration of middleware**, dispatching to the middleware from
> http, default error handling, as well as **configuration of the context, request
> and response objects** ([source](https://github.com/koajs/koa#koa-application)).


#### Example
To demonstrate the basics of the application, an obligatory Hello World example.

Create `app.js` and paste the following code:
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
are asynchronous functions with a stack-like control flow. In middleware control
flow actions are executed downstream and then the control flow returns upstream.
Functions are called in order of when they were registered. On returning from
the function, execution is returned to the middleware above it. An example:

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
Koa is built upon the JavaScript concept of async/await. A good tutorial can be
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
// Allow for cross-origin request sharing
var cors = require('@koa/cors');

var app = new Koa();
// Create a new Router that will build the Koa middleware for you to manage the
// routes
var router = new Router();

// Create object to store the accounts
var accounts = {};

// Register body parsing middleware
app.use(bodyParser());
app.use(cors());

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
var Koa = require('koa');
// Collect the routing middleware
var Router = require('koa-router');
// Collect middleware for automatically parsing the body of the request
var bodyParser = require('koa-bodyparser');
// Middleware for having persistent sessions across requests
var session = require('koa-session');
// Allow for cross-origin request sharing
var cors = require('@koa/cors');
// Add nice logging
var logging = require('koa-logger');

var app = new Koa();
app.use(logging());

// Register body parsing middleware
app.use(bodyParser());
// Register CORS middleware
app.use(cors());
// Register session middleware
app.use(session(app));

// Create key for cookies
app.keys = ['some secret hurr'];

// Create a new Router that will build the Koa middleware for you to manage the
// routes
var router = new Router();

// Create object to store the accounts
var accounts = {};

app.use(async (ctx, next) => {
  user = ctx.session.user

  if(user) {
    ctx.body = `Welcome back ${user}`
  }
  else {
    await next();
  }

});

app.use(async (ctx, next) => {
  request_body = ctx.request.body
  if(!request_body.hasOwnProperty("username")) {
      ctx.throw(400, "You must specify 'username'");
  }
  if(!request_body.hasOwnProperty("password")) {
      ctx.throw(400, "You must specify 'password'");
  }
  await next();
});

// Listen for POST request at /signup/
router.post('/signup/', (ctx, next) => {
  request_body = ctx.request.body
  username = request_body["username"]
  password = request_body["password"]

  if(username in accounts) {
    ctx.throw(400, "Username already exists");
  }

  accounts[username] = password
  ctx.body = request_body
});

router.post('/login/', (ctx, next) => {
  request_body = ctx.request.body
  username = request_body["username"]
  submitted_password = request_body["password"]
  if(username in accounts) {
    password = accounts[username]
    if (password === submitted_password) {
      ctx.session.user = username
      ctx.body = request_body
    } else {
      ctx.throw(400, "Passwords do not match.");
    }
  } else {
    ctx.throw(400, "Please signup before trying to login.");
  }
});

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(5000, () => {console.log("Starting app at http://localhost:5000")});
```

Now the backend has the following features:
1. All mentioned in the [signup section](#signup-route)
2. The user can now be persistantly logged in after matching a created account
   with the `/login/` route.
3. The user will remain logged in until the server is closed.
4. Additional error checking for the `/login/` route

In order to try this out, you need cookies enabled. This can be accomplished
with python by:
```python
import requests

session = requests.session()

print("Creating account")
response = session.post(
    "http://localhost:5000/signup",
    json={"username": "test", "password": "test"}
)
print(response.content)

print("Logging in")
esponse = session.post(
    "http://localhost:5000/login",
    json={"username": "test", "password": "test"}
)
print(response.content)

print("Attempting relogin")
response = session.post(
    "http://localhost:5000/login",
    json={"username": "test", "password": "test"}
)
print(response.content)
```

### Disclaimer
**DO NOT** use this code for any production login mechanism. Any login you
implement should use the [salted password
hashing](https://crackstation.net/hashing-security.htm) to prevent your database
passwords from being leaked. Moreover, you should probably just use a well
vetted library.

## TypeScript
Now that you have some grasp of the concepts, I will introduce you to a "new
language" [TypeScript](https://www.typescriptlang.org/index.html) that SIGWEB
writes the backend in. TypeScript is a "typed superset of JavaScript that
compiles to plain JavaScript". To break that down, **typed** implies that it
adds strongly-typed components to JavaScript (think of c++); **superset** means
that it adds features not native to JavaScript to make things syntactically and
semantically nicer, but supports the plain JavaScript features; and compiles
(more specifically
[transpiles](https://en.wikipedia.org/wiki/Source-to-source_compiler)) back into
JavaScript when finished. These features allow TypeScript to scale to larger
codebases that have high maintenance costs with interpreted languages. Some more
information can be found
[here](https://blogs.msdn.microsoft.com/somasegar/2012/10/01/typescript-javascript-development-at-application-scale/).

The majority of the language specification can be found [in their
handbook](https://www.typescriptlang.org/docs/handbook/basic-types.html). A few
sections to highlight:
1. [TypeScript in 5
   minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html):
   Quick introduction to the basic language concepts and compiling of
   TypeScript.
2. [Basic Types](https://www.typescriptlang.org/docs/handbook/basic-types.html)
3. [Variable Declarations](https://www.typescriptlang.org/docs/handbook/variable-declarations.html)
4. [Functions](https://www.typescriptlang.org/docs/handbook/functions.html)
5. [Modules](https://www.typescriptlang.org/docs/handbook/modules.html)

## Databases
The main problem with the previous signup/login implementation was that whenever
the server turns off the data is removed and cannot be recovered. The specific
database implementation I will be referring to is
[PostgreSQL](https://www.postgresql.org/). Databases provide an organized
collection of related data that (in most cases) is stored on disk. In this case,
whenever the server is turned off, you simply reconnect to the database and have
access to the exact same data. More information about databases can be found
[here](https://www.ucl.ac.uk/archaeology/cisp/database/manual/node1.html#SECTION00120000000000000000).

### Object-relational mapping (ORM)
The primary way that a user collects data from the database is through SQL
queries. SQL or Structured Query Language is a domain-specific language for
managing data in a relational database management system (RDBMS) such as
PostgreSQL. ORMs abstract SQL to objects within the language and perform
deserialization of data from the database making interacting with the database
much more seamless. An example:
+ Assume that the database is already set up. We want to add a user (username
  and password) to the database. Then, select all users from the database.
    - **sql**
        ```typescript
        cosnt pgp = require('pg-promise')();
		const db = pgp('postgres://postgres@localhost:5432/example');

		db.none("insert into Users (username, password) values (${name}, ${password})', {
			name: 'ksyh3',
			password: 'password'
		});

		const users = await db.any("Select * FROM users");
        ```
    - **ORM**
        ```typescript
        const user = new User();
        user.username = "ksyh3"
        user.password = "password";
        await user.save()

        const users = awit Users.find();
        ```
There are many pros and cons to using an ORM vs raw SQL queries. If you are
interested, discussion of this can be found
[here](https://medium.com/@mithunsasidharan/should-i-or-should-i-not-use-orm-4c3742a639ce),
[here](https://stackoverflow.com/questions/4667906/the-advantages-and-disadvantages-of-using-orm),
or by googling "ORM vs raw sql".

## TypeScript with Koa
Now we will set up the Reddit with React backend with Typescript.

### Installation
1. Create a directory containing all of the backend code

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
    yarn add koa koa-router koa-bodyparser koa-session koa-cors koa-logger @koa/cors typeorm pg
    ```
4. Install necessary development dependencies

    ```bash
    yarn add --dev @types/koa @types/koa-router @types/koa-bodyparser @types/koa-session @types/koa-cors ts-node tslint typescript
    ```
5. Create `tsconfig.json` with the following text:

    ```
    {
       "compilerOptions": {
          "lib": [
             "es2017",
             "dom"
          ],
          "target": "es2017",
          "module": "commonjs",
          "moduleResolution": "node",
          "outDir": "./build",
          "emitDecoratorMetadata": true,
          "experimentalDecorators": true,
          "sourceMap": true
       },
       "exclude": [
           "node_modules"
        ]
    }
    ```
6. Create ``ormconfig.js`` with the following content:
    
    ```
    const ROOT_DIR = "./"
    const EXT = ".ts"

    module.exports = {
       "type": "postgres",
       "host": process.env.DB_HOST || "localhost",
       "username": process.env.DB_USERNAME || "postgres",
       "password": process.env.DB_PASSWORD || "",
       "database": process.env.DB_TABLE || "pheonix",
       "port": process.env.DB_PORT || 5432,
       "synchronize": true,
       "logging": true,
       "entities": [
          ROOT_DIR + "entity/**/*" + EXT
       ],
       "migrations": [
          ROOT_DIR + "migration/**/*" + EXT
       ],
       "subscribers": [
          ROOT_DIR + "subscriber/**/*" + EXT
       ],
       "cli": {
          "entitiesDir": ROOT_DIR + "entity",
          "migrationsDir": ROOT_DIR + "migration",
          "subscribersDir": ROOT_DIR + "subscriber"
       }
    }
    ```
7. Create ``app.ts`` with the following content:

    ```typescript
    import * as cors from "@koa/cors";
    import * as Koa from "koa";
    import * as koaBody from "koa-bodyparser";
    import * as logger from "koa-logger";
    import * as session from "koa-session";

    import { createConnection } from "typeorm";

    export const app = new Koa();

    app.keys = ['put secret key here'];

    app.use(koaBody());
    app.use(cors());
    app.use(logger());
    app.use(session(app));

    app.use(async (ctx: Koa.Context, next: Function) => {
      ctx.body = "Hello World!"
    });


    if (!module.parent) {
      createConnection().then(async connection => {
        const port: number = 5000
        const host: string = "localhost"
        const NODE_ENV: string = "development"
        const server = app.listen(port, host, () => {
          console.log(
            `Server is listening on ${host}:${port} (${NODE_ENV})`
          );
        });
      }).catch(error => console.log("TypeORM connection error: ", error));
    }
    ```
8. Ensure that you have [docker](https://docs.docker.com/install/) installed.
9. Start the PostgreSQL server on docker:

    ```bash
    docker run -p 5432:5432 --name postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=pheonix postgres
    ```
10. Run the following command to ensure that everything is working properly

    ```bash
    >>> yarn ts-node app.ts
    Server is listening on localhost:5000 (development)  # <-- You should see
    ```

**NOTE**: ``docker run`` creates a container with the name specified after the
``--name <name>`` flag (where ``<name>`` is the name of the container). After
running this command once, you do **NOT** need to run it again when starting a
container unless you explicitly remove the container using ``docker rm
<name>`` command. If the database is not up or you receive the error 
```
docker: Error response from daemon: Conflict. The container name "/<name>" is
already in use by container
"<some hash>". You have to
remove (or rename) that container to be able to reuse that name.  See 'docker
run --help'.
```
use ``docker start <name>`` instead. This will start the already existing
container instead of creating a new one with the same name.

### Entities
Both the database and the backend server are setup, but we aren't storing
anything in the database. ``createConnection()`` only creates a connection to
the database, but we need to provide the database a schema to store. This is
where entities, also referred to as Models, come in.

Think of entities as an class-based representation of a table within the
database. The [TypeORM entity
documentation](http://typeorm.io/#/entities/what-is-entity) provides a good
intuition behind entities.

Follow the below steps to create an entity to store the Reddit with React user:
1. Create the `Account` entity:
    
    ```bash
    >>> yarn typeorm entity:create -n Account
    ```
2. Paste the following code into `entity/Account.ts` (User is a reserved keyword
   in PostgreSQL so we must use `Account`):

    ```typescript
    import {BaseEntity, Entity, PrimaryColumn, Column} from "typeorm";

    @Entity()
    export class Account extends BaseEntity {
        @PrimaryColumn()
        username: string;

        @Column()
        password: string;
    }
    ```
3. Restart the Reddit with React backend server:
    
    ```bash
    # Make sure to ctrl-c the previous running app.ts
    >>> yarn ts-node app.ts
    ```

Now, when the server starts we will make a connection the database and create
the ``Account`` table within the database. The next step is creating users on
sign-up.

### Sign-up V2
To implement the new sign-up system, paste the following code into `app.ts`.
```typescript
import * as cors from "@koa/cors";
import * as Koa from "koa";
import * as koaBody from "koa-bodyparser";
import * as logger from "koa-logger";
import * as session from "koa-session";
import * as Router from "koa-router";

import { Account } from "./entity/Account";

import { createConnection } from "typeorm";

export const app = new Koa();

const router = new Router();

app.keys = ['put secret key here'];

app.use(koaBody());
app.use(cors());
app.use(logger());
app.use(session(app));

router.get('/', async (ctx, next) => {
  ctx.body = "Hello World";
});

// Listen for POST request at /signup/
router.post('/signup/', async (ctx, next) => {
  let request_body = ctx.request.body
  const found_account = await Account.findOne(
    {username: request_body["username"], password: request_body["password"]}
  );
  if (found_account) {
    ctx.body = "Account already exists";
  } else {
    let user = new Account();
    user.username = request_body["username"]
    user.password = request_body["password"]
    try {
      const result = await user.save();
    } catch(e) {
      return ctx.throw(400, e);
    }

    ctx.body = request_body
  }
});

app
  .use(router.routes())
  .use(router.allowedMethods());

if (!module.parent) {
  createConnection().then(async connection => {
    const port: number = 5000
    const host: string = "localhost"
    const NODE_ENV: string = "development"
    const server = app.listen(port, host, () => {
      console.log(
        `Server is listening on ${host}:${port} (${NODE_ENV})`
      );
    });
  }).catch(error => console.log("TypeORM connection error: ", error));
}
```

Start the server using the following command:
```bash
>>> yarn ts-node app.ts
```

Whenever the user makes a `POST` to `/signup/` the route will perform the
following functions:
1. Ensure that the account does not already exists (`Account.findOne`). If
   so, warn the user.
2. If the account does not exist, create an `Account` and save it to the
   database. Return the original request back to the user.

### Login V2
To implement the login + sign-up system, paste the following code into `app.ts`
(overwriting the contents).

```typescript
import * as cors from "@koa/cors";
import * as Koa from "koa";
import * as koaBody from "koa-bodyparser";
import * as logger from "koa-logger";
import * as session from "koa-session";
import * as Router from "koa-router";

import { Account } from "./entity/Account";

import { createConnection } from "typeorm";

export const app = new Koa();

const router = new Router();

app.keys = ['put secret key here'];

app.use(koaBody());
app.use(cors());
app.use(logger());
app.use(session(app));

router.get('/', async (ctx, next) => {
  ctx.body = "Hello World";
});

// Listen for POST request at /signup/
router.post('/signup/', async (ctx, next) => {
  let request_body = ctx.request.body
  const found_account = await Account.findOne(
    {username: request_body["username"], password: request_body["password"]}
  );
  console.log(found_account);
  if (found_account) {
    ctx.body = "Account already exists";
  } else {
    let user = new Account();
    user.username = request_body["username"]
    user.password = request_body["password"]
    try {
      const result = await user.save();
    } catch(e) {
      return ctx.throw(400, e);
    }

    ctx.body = request_body
  }
});

// Listen for POST request at /login/
router.post('/login/', async (ctx, next) => {
  let request_body = ctx.request.body
  // Check if the user has been previously logged in
  if(ctx.session.user) {
    ctx.body = `Welcome back ${ctx.session.user.username}`
  } else {
    // Check if the account exists in the database
    const found_account = await Account.findOne(
      {username: request_body["username"], password: request_body["password"]}
    );
    if (found_account) {
      // Log the user in, save their username in the session
      ctx.session.user = found_account
      ctx.body = `You are now logged in, ${ctx.session.user.username}`
    } else {
      // Could not find user, return error
      ctx.throw(404, "Account not found.")
    }
  }
});


app
  .use(router.routes())
  .use(router.allowedMethods());

if (!module.parent) {
  createConnection().then(async connection => {
    const port: number = 5000
    const host: string = "localhost"
    const NODE_ENV: string = "development"
    const server = app.listen(port, host, () => {
      console.log(
        `Server is listening on ${host}:${port} (${NODE_ENV})`
      );
    });
  }).catch(error => console.log("TypeORM connection error: ", error));
}
```
The app now has the following features:
1. Everything listed in the [sign-up system](#sign-up-v2).
2. The user will now be recognized between logins via
   [koa-session](https://github.com/koajs/session) and prevented from login.
3. The user can only login with a username and password already registed in the
   database.
4. When logged in, the user object will be stored in their session for later
   access.

By default, sessions are managed in Koa using
[cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies). When Koa
receives a cookie, it performs a lookup to see if that session exists. If so, it
collects all the data and stores it in the `ctx.session` object. Please refer to
that webpage for more information about cookies and the [koa-session
github](https://github.com/koajs/session) for more information about
`koa-session`.

### Project
Now that you have learned the basic, let us put them to the test. Take the
original ``app.ts`` and perform the following tasks:
1. Create a `Post` entity that stores all information necessary to display a
   post on Reddit.
    - Header, description, karma, etc.
    - The logged in user who created the post (an anonymous user **CANNOT**
      create a Post on the website)
2. Add a `/posts/` route:
    + **GET**
        - Returns all `Posts` that exists in the database.
    + **POST**
        - Adds a new `Post` entity to the database. Be sure to validate the
          information in the `Post` matches your entity.

**Helpful Links**:
1. [typeorm documentation](http://typeorm.io/)
2. [KoaJS documentation](https://koajs.com/)
