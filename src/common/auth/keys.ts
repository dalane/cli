import { KEY_TYPE, KEY_OP, KEY_USE, ALGORITHM } from './constants';
import eckles from 'eckles';

export interface Jwk {
  kid:string;
  alg: ALGORITHM;
  x5t:string;
  crv: string;
  key_ops?: KEY_OP[];
  kty: KEY_TYPE;
  use: KEY_USE;
  x?: string;
  y?: string;
  /** The time at which the key will be automatically expired in seconds from UNIX epoch */
  iss:number;
  exp:number;
}

export interface PrivateJwk extends Jwk {
  d?: string;
}

export interface PublicJwk extends Jwk {}

export interface KeyPair {
  public:PublicJwk;
  private:PrivateJwk;
}

export interface JsonWebKeySet {
  keys: Jwk[];
}

export enum ENCODINGS {
  PEM = 'pem',
  JSON = 'json'
}

export enum FORMATS {
  JWK = 'jwk',
  PKCS8 = 'pkcs8'
}

export enum CURVES {
  P256 = 'P-256'
}

export const createPemKeyFromJwk = async (jwk:Jwk):Promise<string> => eckles.export({ jwk: jwk });
