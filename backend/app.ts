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
