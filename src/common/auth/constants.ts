/**
 * Proof Key for Code Exchange by OAuth Public Clients
 *
 * Public clients are clients that can not use a client secret to
 * authenticate with the authorisation server. In these scenarios,
 * the client can generate a random string (a "code verifier") that is presented
 * to the authorisation server for an authorisation request using a transform as
 * as "code challenge".
 *
 * The transform applied to generate the code challenge is either a hash of the
 * code verifier value or the plain code verifier value. However, plain should
 * only be used in exceptional circumstances and only if pre-authorised.
 *
 * The client will then send the code verifier when requesting a token. The
 * authorisation server can then use the code challenge provided during the
 * authorisation request against the code verifier to validate that the client
 * requesting the token is the client that made the authorisation request.
 *
 * See https://tools.ietf.org/html/rfc7636
 */

/**
 * Transforms that can be applied to the code verifier to generate the code
 * challenge.
 */
export enum CODE_VERIFIER_TRANSFORM {
  S256 = 'S256',
  PLAIN = 'plain'
}

export enum CURVES {
  P256 = 'P-256'
}

export enum KEY_OP {
  "sign",
  "verify",
  "encrypt",
  "decrypt",
  "wrapKey",
  "unwrapKey",
  "deriveKey",
  "deriveBits"
}

export enum KEY_USE {
  SIGN = 'sig',
  ENCRYPT = 'enc'
}

export enum ALGORITHM {
  ES256 = 'ES256',
  RS256 = 'RS256'
}

export enum KEY_TYPE {
  ELLIPTIC_CURVE = 'EC'
}

export enum WELL_KNOWN_ENDPOINT {
  OPENID_CONFIG = '/openid-configuration',
  JWKS_JSON = '/jwks.json'
}

export enum RESPONSE_TYPE {
  TOKEN = 'token',
  CODE = 'code',
  OPEN_ID = 'token id_token'
}

export enum RESPONSE_MODE {
  QUERY = 'query',
  FRAGMENT = 'fragment'
}

export enum GRANT_TYPE {
  AUTH_CODE = 'authorization_code',
  IMPLICIT = 'implicit',
  CLIENT_CREDENTIALS = 'client_credentials',
  DEVICE_CODE = 'urn:ietf:params:oauth:grant-type:device_code',
  REFRESH_TOKEN = 'refresh_token',
  PASSWORD = 'password',
  JWT_BEARER = 'urn:ietf:params:oauth:grant-type:jwt-bearer',
  SAML2_BEARER = 'urn:ietf:params:oauth:grant-type:saml2-bearer',
}

export enum GRANT_ERRORS {
  INVALID_REQUEST = 'invalid_request',
  INVALID_CLIENT = 'invalid_client',
  INVALID_GRANT = 'invalid_grant',
  INVALID_SCOPE = 'invalid_scope',
  UNAUTHORISED_CLIENT = 'unauthorized_client',
  UNSUPPORTED_GRANT_TYPE = 'unsupported_grant_type',
  INTERNAL_SERVER_ERROR = 'internal_server_error'
}

export enum ACCESS_TOKEN_TYPES {
  BEARER = 'Bearer'
}

export enum TOKEN_ENDPOINT_AUTH_METHOD {
  CLIENT_SECRET_BASIC = 'client_secret_basic',
  CLIENT_SECRET_POST = 'client_secret_post',
  CLIENT_SECRET_JWT = 'client_secret_jwt',
  PRIVATE_KEY_JWT = 'private_key_jwt'
}

/**
 * Identifies if the sub field in any tokens is public or encrypted ("pairwise").
 * Typically pairwise would be used if the subject identifier could be used to
 * track across different apps, organisations, etc. For example an email address
 * should be encrypted / anonymised...
 */
export enum SUBJECT_TYPE {
  /** subject identifier is public */
  PUBLIC = 'public',
  /** subject identifier is encrypted */
  PAIRWISE = 'pairwise'
}

export enum DISPLAY_VALUE {
  PAGE = 'page',
  POPUP = 'popup',
  TOUCH = 'touch',
  WAP = 'wap'
}
