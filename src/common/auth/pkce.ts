import { createS256Hash, randomText, CHARSETS, constantTimeEq } from "../crypto";
import { CODE_VERIFIER_TRANSFORM } from "./constants";

/**
 * If PKCE is used when generating an authorization code then the client must
 * send the code verifier used to generate the code challenge when requesting
 * a token. This function verifies that the verifier matches the challenge.
 *
 * There are two types of method supported: S256 and Plain. S256 requires that
 * the code verifier is hashed using SHA-256 then base64 encoded to create the
 * code_challenge value.
 *
 * @param codeVerifier A plain text value that is converted to a Base 64 value to create a code challenge if the code challenge method is S256 or otherwise plain text
 * @param codeChallenge A base 64 encoded value of the code verifier if the code challenge method is S256 or otherwise it is the code verifier
 * @param codeChallengeMethod The method used to generate the code challenge from the code verifier. Either SHA-256 or plain text. Defaults to plain text if not specified
 */
export const verifyPkceCodeChallenge = (codeVerifier:string, codeChallenge:string, codeChallengeMethod:CODE_VERIFIER_TRANSFORM = CODE_VERIFIER_TRANSFORM.PLAIN) => {
  if (CODE_VERIFIER_TRANSFORM.S256 === codeChallengeMethod) {
    const expectedChallenge = createS256Hash(codeVerifier);
    return constantTimeEq(expectedChallenge, Buffer.from(codeChallenge, 'base64'));
  } else {
    return constantTimeEq(Buffer.from(codeVerifier), Buffer.from(codeChallenge, 'base64'));
  }
};

/**
 * The code verifier is a cryptographically unique string using the "unreserved"
 * characters [A-Z] / [a-z] / [0-9] / "-" / "~" / "." / "_" with minimum length
 * of 43 characters and a maximum length of 128 characters.
 *
 * See https://tools.ietf.org/html/rfc7636#page-8 on creating a code verifier
 * See https://tools.ietf.org/html/rfc3986#section-2.3 on unreserved characters
 */
export const createPkceCodeVerifier = (length:number): string => {
  if (43 > length || 128 < length) {
    throwRangeError('Length of PKCE code verifier must be a minimum of 43 characters and a maximum of 128 characters.');
   }
   return randomText(43, CHARSETS.UNRESERVED_URI);
};

export const createPkceCodeChallenge = (codeVerifier:string, codeChallengeMethod:CODE_VERIFIER_TRANSFORM = CODE_VERIFIER_TRANSFORM.PLAIN) => {
  return (CODE_VERIFIER_TRANSFORM.S256 === codeChallengeMethod) ? createS256Hash(codeVerifier).toString('base64') : codeVerifier;
};

function throwRangeError(message: string) {
  throw new RangeError(message);
}
