import { FastifyReply, FastifyRequest } from "fastify";
import { RequestContext } from "loompi";

let requestContext: any;
let multipart: any;

try {
    requestContext = require('@fastify/request-context');
} catch {
    // @fastify/request-context not available
}

try {
    multipart = require('@fastify/multipart');
} catch {
    // @fastify/multipart not available
}

export interface FastifyAdapterOptions {
    useRequestContext?: boolean;
    useMultipart?: boolean;
}

export function fastifyRequestContextAdapter(
    request: FastifyRequest & Record<string, any>,
    reply: FastifyReply,
    options: FastifyAdapterOptions = {}
): RequestContext {
    const { useRequestContext = false, useMultipart = false } = options;

    // Fallback storage if @fastify/request-context is not available
    const fallbackStore = new Map<string, any>();

    // Try to prevent double-sending
    let responseSent = false;

    return {
        req: {
            method: request.method,
            path: request.url,
            query: request.query as Record<string, any>,
            params: request.params as Record<string, any>,
            headers: request.headers as Record<string, any>,
            body: request.body,
            json: async () => {
                // Fastify already parses JSON if content-type is application/json
                return request.body;
            },
            text: async () => {
                if (typeof request.body === 'string') {
                    return request.body;
                }
                return JSON.stringify(request.body);
            },
            formData: useMultipart && multipart ? async () => {
                const formData = new FormData();

                // @fastify/multipart provides different methods depending on setup
                // Option 1: Single file
                const file = await request.file();
                if (file) {
                    const buffer = await file.toBuffer();
                    const blob = new Blob([buffer], { type: file.mimetype });
                    formData.append(file.fieldname, blob, file.filename);
                }

                // Option 2: Multiple files
                const files = request.files();
                if (files) {
                    for await (const file of files) {
                        const buffer = await file.toBuffer();
                        const blob = new Blob([buffer], { type: file.mimetype });
                        formData.append(file.fieldname, blob, file.filename);
                    }
                }

                // Add other form fields
                const body = request.body as any;
                if (body && typeof body === 'object') {
                    Object.entries(body).forEach(([key, value]) => {
                        if (typeof value === 'string') {
                            formData.append(key, value);
                        }
                    });
                }

                return formData;
            } : undefined
        },
        res: {
            json: (data: any, status = 200) => {
                if (responseSent) {
                    console.warn('[loompi-fastify] Response already sent');
                    return reply as any;
                }
                responseSent = true;
                return reply.status(status).send(data) as any;
            },
            text: (data: string, status = 200) => {
                if (responseSent) {
                    console.warn('[loompi-fastify] Response already sent');
                    return reply as any;
                }
                responseSent = true;
                return reply.status(status).type('text/plain').send(data) as any;
            },
            redirect: (url: string, status = 302) => {
                if (responseSent) {
                    console.warn('[loompi-fastify] Response already sent');
                    return reply as any;
                }
                responseSent = true;
                return reply.redirect(url, status) as any;
            },
            status: (code: number) => {
                if (responseSent) {
                    console.warn('[loompi-fastify] Response already sent');
                    return reply as any;
                }
                responseSent = true;
                return reply.status(code).send() as any;
            }
        },
        get: (key: string) => {
            if (useRequestContext && requestContext) {
                // Use @fastify/request-context
                return request?.requestContext?.get(key);
            }
            // Fallback to per-request Map
            return fallbackStore.get(key);
        },
        set: (key: string, value: any) => {
            if (useRequestContext && requestContext) {
                // Use @fastify/request-context
                request?.requestContext?.set(key, value);
            } else {
                // Fallback to per-request Map
                fallbackStore.set(key, value);
            }
        },
        raw: request.raw,
        framework: { request, reply }
    };
}