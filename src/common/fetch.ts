import fetch, { Response, RequestInit, FetchError } from 'node-fetch';
import contentType from 'content-type';
import { HTTP_REQUEST_METHODS, HTTP_STATUS_CODES, MEDIA_TYPES } from './constants';
import { deserializeErrorObject, DomainError, DomainErrorCollection, ErrorObject, SerializedErrorPayload } from './errors';

export interface HttpRequestOptions {
  headers?: HttpRequestHeaders;
  retry?: {
    interval: number,
    maxAttempts: number
  };
  timeout?: number;
  strictSsl?: boolean;
}

export interface HttpRequestHeaders {
  [key: string]: any;
}

/** POST a javascript object as a JSON string */
export const postJson = async <RQ extends object, RP = any>(url: string, payload: RQ, options?: HttpRequestOptions): Promise<HttpSuccess<RP> | DomainErrorCollection> => {
  options = options ?? {};
  if (options.headers) {
    options.headers['content-type'] = MEDIA_TYPES.JSON;
    options.headers.accept = MEDIA_TYPES.JSON;
  } else {
    options.headers = {
      'content-type': MEDIA_TYPES.JSON,
      accept: MEDIA_TYPES.JSON
    };
  }
  try {
    const response = await fetch(url, createFetchOptions(HTTP_REQUEST_METHODS.POST, JSON.stringify(payload), options));
    return handleFetchResponse(response);
  } catch (error) {
    throw parseAdapterError(error);
  }
};

/** POST a javascript object as a UrlEncoded form */
export const postUrlEncoded = async (url: string, payload: {[key: string]: any}, options?: HttpRequestOptions): Promise<HttpSuccess<any> | DomainErrorCollection> => {
  options = options ?? {};
  if (options.headers) {
    options.headers.accept = MEDIA_TYPES.JSON;
  } else {
    options.headers = {
      accept: MEDIA_TYPES.JSON
    };
  }
  try {
    const params = new URLSearchParams();
    Object.getOwnPropertyNames(payload).forEach(propertyName => params.append(propertyName, payload[propertyName]));
    const response = await fetch(url, createFetchOptions(HTTP_REQUEST_METHODS.POST, params, options));
    return handleFetchResponse(response);
  } catch (error) {
    throw parseAdapterError(error);
  }
};

/** Make a GET request with the accept header as JSON */
export const getJson = async <RP = any>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<RP> | DomainErrorCollection> => {
  options = options ?? {};
  if (options.headers) {
    options.headers['content-type'] = MEDIA_TYPES.JSON;
    options.headers.accept = MEDIA_TYPES.JSON;
  } else {
    options.headers = {
      'content-type': MEDIA_TYPES.JSON,
      accept: MEDIA_TYPES.JSON
    };
  }
  return handleFetchResponse(await fetch(url, createFetchOptions(HTTP_REQUEST_METHODS.GET, undefined, options)));
};

const createFetchOptions = (method: HTTP_REQUEST_METHODS, body?: any, options?: HttpRequestOptions): RequestInit => ({
  method: method,
  ...body && { body: body },
  ...options?.headers && { headers: options.headers }
});

const handleFetchResponse = async (response: Response): Promise<HttpResponse<any> | DomainErrorCollection> => {
  const contentTypeHeader = contentType.parse(response.headers.get('content-type') ?? 'text/html');
  if (MEDIA_TYPES.JSON !== contentTypeHeader.type) {
    throw new ContentError(`Expected the response to be "application/json" but got "${contentTypeHeader.type}"`);
  }
  const body: SerializedErrorPayload = await response.json();
  const headers: {[key: string]: any} = {};
  response.headers.forEach((value, name) => {
    headers[name] = value;
  });
  if (response.ok) {
    return new HttpSuccess(response.status, response.statusText, response.url, body, headers);
  } else {
    return parseErrorResponse(response.url, body);
  }
};

export class HttpResponse<T> {
  constructor(readonly status: HTTP_STATUS_CODES, readonly statusText: string, readonly url: string, readonly body: T, readonly headers: any) {}
}

export class HttpSuccess<T> extends HttpResponse<T> {}

export class HttpError<T> extends HttpResponse<T> {}

/**
 * Adapter Errors
 */

/** Base adapter error */
export class HttpAdapterError extends Error {
  constructor(message: string, readonly previous?: Error) {
    super(message);
    const { constructor } = Object.getPrototypeOf(this);
    this.name = constructor.name;
  }
}

/** Error for timeouts including request-timeout and body-timeout */
export class TimeoutError extends HttpAdapterError {}

/** Host not found. Usually means the server is offline. */
export class HostNotFoundError extends HttpAdapterError {}

/** Any errors involving redirects including no-redirect, max-redirect, unsupported-redirect */
export class RedirectError extends HttpAdapterError {}

/** Any errors relating to the content of the response including max-size and invalid-json */
export class ContentError extends HttpAdapterError {}

/** Parses errors thrown by the adapter and returns a HttpAdapterError */
const parseAdapterError = (error: Error): Error => {
  if (error instanceof FetchError) {
    switch (error.type) {
      case 'system': {
        if ('ECONNREFUSED' === error.code) {
          return new HostNotFoundError(error.message);
        }
        return error;
      }
      case 'body-timeout':
      case 'request-timeout': {
        return new TimeoutError(error.message);
      }
      case 'no-redirect':
      case 'max-redirect':
      case 'unsupported-redirect': {
        return new RedirectError(error.message);
      }
      case 'max-size':
      case 'invalid-json': {
        return new ContentError(error.message);
      }
    }
  }
  return error;
};

export const parseErrorResponse = (uri: string, body: SerializedErrorPayload): DomainErrorCollection => {
  const errors: DomainError[] = body.errors.map(errorObj => deserializeErrorObject(uri, errorObj));
  return new DomainErrorCollection(uri, errors);
};
