import { dereference } from '@apidevtools/json-schema-ref-parser';
import { OpenAPIV3 } from 'openapi-types';

export async function parseOpenApiDocument(schema: any): Promise<OpenAPIV3.Document> {
	return dereference(schema);
}
