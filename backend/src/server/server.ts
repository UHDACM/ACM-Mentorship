import express from "express";
import { Express } from "express";
import dotenv from "dotenv";
import { auth } from "express-oauth2-jwt-bearer";
dotenv.config();

let ExpressServer: Express;
export function isExpressServerOnline() {
  return ExpressServer ? true : false;
}

export function getExpressServer() {
  return ExpressServer;
}

/**
 * Creates express server with promise.
 * If successful, returns true. Otherwise, returns error.
 *
 * Promise-based so tests can wait for server to go online before proceeding.
 * @returns
 */
export function CreateExpressServer() {
  if (ExpressServer) {
    return ExpressServer;
  }
  const app = express();

  app.use(express.json());

  const jwtCheck = auth({  
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: process.env.AUTH0_TOKEN_SIGNING_ALG,
  });

  console.log('Auth middleware config:', {
  audience: process.env.AUTH0_AUDIENCE,
  issuer: process.env.AUTH0_ISSUER_BASE_URL,
  algorithm: process.env.AUTH0_TOKEN_SIGNING_ALG
});

  app.get("/", (_, res) => {
    res.send({ all: "good" });
  });

  app.use(jwtCheck);

  app.post("/verifyJWT", (req, res) => {
    // console.log('verifyingJWT');
    res.send(req.auth);
  });
  ExpressServer = app;
  return app;
}
