import * as jwt from 'jsonwebtoken';
import { ALGORITHM, GRANT_TYPE } from './constants';
import { createDomainInvalidTokenError, createDomainTokenExpiredError } from '../errors';
import { createPemKeyFromJwk, Jwk } from './keys';

export interface TokenOptions {
  issuer:string;
  audience:string|string[];
  expiresIn?:number;
}

export interface TokenHeader {
  alg:string;
  kid:string;
  [key:string]:any;
}

export interface TokenPayload {
  jti: string;
  iat: number;
  exp: number;
  aud: string[];
  iss: string;
}

/**
 * Common type for creating token payloads as the omitted parameters are
 * added by the token creation function and don't need to be supplied for
 * creation.
 */
export type CreateTokenParams<T = TokenPayload> = Omit<T, "iat" | "exp" | "aud" | "iss">;

export interface Token<T extends TokenPayload> {
  header:TokenHeader;
  payload:T;
  signature:string;
}

export interface ValidateOptions {
  issuer:string;
  audience:string|string[];
  algorithms:ALGORITHM[];
}

export const decodeEncodedToken = <T extends TokenPayload>(encoded:string):Token<T> => {
  // We need to decode the token first so that we can obtain the keyid of the key and
  // algorithm used to sign the token. This allows us to find the key in the
  // keys obtained from the json web key set...
  const jwtDecodeOptions = {
    complete: true // returns an object with decoded header, payload and signature...
  };
  return jwtDecodeTokenAdapter(encoded, jwtDecodeOptions);
};

export const validateEncodedToken = (options:ValidateOptions) => async <T extends TokenPayload>(key:string, token:string):Promise<Token<T>> => {
  const jwtVerifyOptions = {
    algorithms: options.algorithms, // this value is obtained from /.well-known/openid-configuration
    issuer: options.issuer, // this value is obtained from /.well-known/openid-configuration
    audience: options.audience, // this value is provided by the application
    complete: true // this indicates that we will return the full token header, payload and signature
  };
  return jwtVerifyTokenAdapter(token, key, jwtVerifyOptions);
};

/**
 * Adapter for JsonWebToken to decode tokens and normalise errors to domain errors
 * @param token
 * @param options
 */
const jwtDecodeTokenAdapter = <T extends TokenPayload>(token:string, options:jwt.DecodeOptions):Token<T> => {
  try {
    return <Token<T>>jwt.decode(token, options);
  } catch (error) {
    throw convertAdapterErrorsToDomainErrors(error);
  }
};

const jwtVerifyTokenAdapter = async <T extends TokenPayload>(token:string, publicKey:string, options:jwt.VerifyOptions):Promise<Token<T>> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, publicKey, options, (error:Error|null, decoded:Token<T>) => {
      if (undefined === error || null === error) {
        resolve(decoded);
      } else {
        reject(convertAdapterErrorsToDomainErrors(error));
      }
    });
  });
};

const convertAdapterErrorsToDomainErrors = (error:Error) => {
  switch (error.name) {
    case 'TokenExpiredError': {
      return createDomainTokenExpiredError('', `The token has expired. It expired at ${(<jwt.TokenExpiredError>error).expiredAt.getTime()}`, error);
    }
    case 'JsonWebTokenError': {
      return createDomainInvalidTokenError('', error.message, error);
    }
    case 'NotBeforeError': {
      return createDomainInvalidTokenError('', error.message, error);
    }
    default:
      return error;
  }
};



export const makeValidateTokenFn = (validateEncodedTokenFn:Function) => (keys:Jwk[]) => async <T extends TokenPayload>(token:string): Promise<Token<T>> => {

	const decodedToken = decodeEncodedToken(token);

	const idTokenSigningKid = decodedToken.header.kid;

  const key = keys.find(key => key.kid === idTokenSigningKid);

  if (key === undefined) {
    throw new Error('A key that was used to sign the id_token was not found in the JWKS');
  }

	const pem = await createPemKeyFromJwk(key);

	return await validateEncodedTokenFn(pem)(token);

};

export const makeValidateEncodedTokenFn = (issuer:string) => (audience:string|string[]) => (algorithms:ALGORITHM[]) => (pem:string) => async (token:string) => {

	return await validateEncodedToken({

		issuer: issuer,

		audience: audience,

		algorithms: algorithms

	})(pem, token);

};
