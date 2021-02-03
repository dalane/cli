import { CODE_VERIFIER_TRANSFORM, GRANT_TYPE } from "./constants";
import { TokenPayload, CreateTokenParams } from "./tokens";
import { randomText, CHARSETS } from "../crypto";
import { createPkceCodeVerifier, createPkceCodeChallenge } from "./pkce";
import { stringify } from "../querystring";

export const createAuthCodeFlowQueryParams = (clientId:string, redirectUri:string, scope?:string, state?:string, codeChallenge?:string, codeChallengeMethod?:CODE_VERIFIER_TRANSFORM) => ({
  response_type: 'code',
  client_id: clientId,
  redirect_uri: redirectUri,
  ...scope && { scope: scope },
  ...state && { state: state },
  ...codeChallenge && { code_challenge: codeChallenge },
  ...codeChallengeMethod && { code_challenge_method: codeChallengeMethod }
});

export interface AccessTokenPayload extends TokenPayload {
  name: string;
  email: string;
  client_identifier: string;
  /**
   * scope: (a space separated list of scopes. Each api is responsible for checking
    that the scope is valid for the request being made. These scopes will allow
    each api to determine the role of the user, e.g. a scope of "root" or "sysadmin"
    would indicate that the user can access service administration endpoints, a scope
    of "account:<account-id>:admin" would indicate that the user is an administrator
    for the account for the given account id)
    */
  scp: string;
  /**
   * REQUIRED A string identifying the Resource Owner (user ID) that authorised
   * the request and issuing of the token.
   */
  sub:string;
  /**
   * REQUIRED A number indicating how long the token is valid for in seconds.
   */
  exp:number;
  /**
   * REQUIRED A number indicating the time after UNIX Epoch in seconds that the
   * token was issued.
   */
  iat:number;
  /**
   * REQUIRED A string indicating the ID of the client that requested
   * authorisation and the issuing of the token.
   */
  cid:string;
}

export interface RefreshTokenPayload extends TokenPayload {
  sub: string;
  name: string;
  email: string;
  cid: string;
  client_identifier: string;
  scp: string;
}

export type DraftAccessTokenPayload = CreateTokenParams<AccessTokenPayload>;
export type DraftRefreshTokenPayload = CreateTokenParams<RefreshTokenPayload>;


export interface AuthorisationCodeRequestParams {
  client_id:string;
  redirect_uri:string;
  state?:string;
  scope?:string;
  code_challenge?:string;
  code_challenge_method?:'plain'|'S256';
}

export const createAuthCodeFlowUri = (authorisationEndpoint:string) => (requestParams:AuthorisationCodeRequestParams):string => `${authorisationEndpoint}?${stringify({...requestParams, ...{ response_type: 'code'}})}`;

export interface CreateAuthorisationParams {
  authorisation_url: string;
  client_id: string;
  scope: string;
  redirect_uri: string;
}


export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  id_token?: string;
  id_token_expires_in?: number;
}

export interface OAuthTokenRequest {
  grant_type: GRANT_TYPE;
  client_id: string;
  code?: string;
  redirect_uri?: string;
  client_secret?: string;
  code_verifier?: string;
  refresh_token?: string;
  scope?: string;
}

export interface AuthorisationParams {
  state: string;
  code_verifier: string;
  url: string;
}

export function createAuthorisationParams(params: CreateAuthorisationParams) {

  const { authorisation_url, client_id, scope, redirect_uri } = params;

  const state = randomText(128, CHARSETS.UNRESERVED_URI);
  const code_verifier = createPkceCodeVerifier(128);
  const code_challenge_method = CODE_VERIFIER_TRANSFORM.S256;
  const code_challenge =  createPkceCodeChallenge(code_verifier, code_challenge_method);

    /** The OAuth2 query params for the authorisatino server */
    const authCodeQueryParams:AuthorisationCodeRequestParams = {
      client_id,
      state,
      scope,
      redirect_uri,
      code_challenge,
      code_challenge_method
    };

    const url:string = createAuthCodeFlowUri(authorisation_url)(authCodeQueryParams);

    return {
      state,
      code_verifier,
      url
    };
}

export function createEndSessionUrl(params: { id_token: string; end_session_endpoint: string; }): string {

  const { id_token, end_session_endpoint } = params;

  const queryParams = {
    id_token_hint: id_token
  };

  const url = `${end_session_endpoint}?${stringify(queryParams)}`;

  return url;
}

export type ResponseTypes = 'code' | 'token';

export interface DynamicClientRegistrationParams {
  redirect_uris?: string[];
  token_endpoint_auth_method?: 'none' | 'client_secret_post' | 'client_secret_basic';
  grant_types?: GRANT_TYPE[];
  response_types?: ResponseTypes[];
  client_name?: string;
  client_uri?: string;
  logo_uri?: string;
  scope?: string;
  contacts?: string[];
  tos_uri?: string;
  policy_uri?: string;
  jwks_uri?: string;
  jwks?: unknown;
  software_id?: string;
  software_version?: string;
  audience?: string[];
}
