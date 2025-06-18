import { Request, Response } from "express";
import { auth, AuthResult } from "express-oauth2-jwt-bearer";
import env from "../env/env";

const jwtCheck = auth({  
  audience: env.AUTH0_AUDIENCE,
  issuerBaseURL: env.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: env.AUTH0_TOKEN_SIGNING_ALG,
});

export async function ExtractUserDataInRequest(req: Request, res: Response): Promise<AuthResult | undefined> {
  let JWTResult: AuthResult | undefined = undefined;

  await jwtCheck(req, res, async (err) => {
    if (err) {
      return;
    }
    JWTResult = req.auth;
  });
  
  return JWTResult;
}