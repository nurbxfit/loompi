import { Context } from 'hono';
import { ContentfulStatusCode, RedirectStatusCode, StatusCode } from 'hono/utils/http-status';
import { RequestContext } from 'loompi';

export function honoToRequestContextAdapter(c: Context): RequestContext {
    return {
        req: {
            method: c.req.method,
            path: c.req.path,
            query: c.req.query(),
            params: c.req.param(),
            headers: Object.fromEntries(c.req.raw.headers),
            body: undefined,
            json: () => c.req.json(),
            text: () => c.req.text(),
            formData: () => c.req.formData?.(),
        },
        res: {
            json: (data: any, status = 200) =>
                c.json(data, status as ContentfulStatusCode),
            text: (data: string, status = 200) =>
                c.text(data, status as ContentfulStatusCode),
            redirect: (url: string, status = 302) =>
                c.redirect(url, status as RedirectStatusCode),
            status: (code: number) => {
                c.status(code as StatusCode);
                return c.body(null); // Use Hono's response builder
            }
        },

        // Use Hono's built-in state management
        get: (key: string) => c.get(key),
        set: (key: string, value: any) => c.set(key, value),

        raw: c.req.raw,
        framework: c
    }
}