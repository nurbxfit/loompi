import { RequestContext } from "loompi";
import { Request, Response } from 'express';

// Optional imports - check if available
let httpContext: any;
let multer: any;

try {
    httpContext = require('@sliit-foss/express-http-context');
} catch {
    // express-http-context not available
}

try {
    multer = require('multer');
} catch {
    // multer not available
}

export interface ExpressAdapterOptions {
    useHttpContext?: boolean;
    useMulter?: boolean;
}

export function expressToRequestContextAdapter(
    req: Request,
    res: Response,
    options: ExpressAdapterOptions = {}
): RequestContext {
    const { useHttpContext = false, useMulter = false } = options;

    // fallback for express-http-context 
    const contextStore = new Map<string, any>();
    return {
        req: {
            method: req.method,
            path: req.path,
            query: req.query,
            params: req.params,
            headers: req.headers as Record<string, string>,
            body: req.body,
            json: async () => {
                // if user already using express.json() middleware
                // we can take the value from req.body
                if (req.body) {
                    return req.body;
                }

                // else we need to parse raw boduy
                return new Promise((resolve, reject) => {
                    let data = '';
                    req.on('data', chunk => data += chunk);
                    req.on('end', () => {
                        try {
                            resolve(JSON.parse(data));
                        } catch (err) {
                            reject(err);
                        }
                    });
                    req.on('error', reject);
                });
            },
            text: async () => {
                if (typeof req.body === 'string') {
                    return req.body;
                }

                if (req.body) {
                    return JSON.stringify(req.body);
                }

                return new Promise((resolve, reject) => {
                    let data = '';
                    req.on('data', chunk => data += chunk);
                    req.on('end', () => resolve(data));
                    req.on('error', reject);
                });
            },

            // if useMulter = true else undefined
            formData: useMulter && multer && req.file ?
                async () => {
                    const formData = new FormData();

                    if (req.file) {
                        formData.append(req.file.fieldname, new Blob([req.file.buffer]), req.file.originalname);
                    }

                    if (req.files) {
                        const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
                        files.forEach((file: any) => {
                            formData.append(file.fieldname, new Blob([file.buffer]), file.originalname);
                        });
                    }

                    Object.entries(req.body || {}).forEach(([key, value]) => {
                        formData.append(key, value as string)
                    })

                    return formData
                } : undefined
        },

        res: {
            json: (data: any, status = 200) => {
                res.status(status).json(data);
                return res as any;
            },
            text: (data: string, status = 200) => {
                res.status(status).type('text/plain').send(data);
                return res as any;
            },
            redirect: (url: string, status = 302) => {
                res.redirect(status, url);
                return res as any;
            },
            status: (code: number) => {
                res.status(code).end();
                return res as any
            }
        },
        get: (key: string) => {
            if (useHttpContext && httpContext) {
                return httpContext.get(key);
            }
            return contextStore.get(key);
        },
        set: (key: string, value: any) => {
            if (useHttpContext && httpContext) {
                httpContext.set(key, value);
            } else {
                contextStore.set(key, value);
            }
        },
        raw: req,
        framework: { req, res }
    }

}