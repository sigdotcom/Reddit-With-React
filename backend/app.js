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

router.get('/', (ctx, next) => {
  ctx.body = "Hello world!"
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
