import { Context } from "hono";
import { ContentfulStatusCode, RedirectStatusCode, StatusCode } from "hono/utils/http-status";
import { RequestContext } from "unstrap";


// temporary adapter ?? will moved it into its own packages folder.
// now just testing.

export function honoContextAdapter(c: Context): RequestContext {
    // Internal state for ctx.get() / ctx.set()
    const state = new Map<string, any>();
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
                return new Response(null, { status: code });
            }
        },

        get: (key: string) => state.get(key),
        set: (key: string, value: any) => {
            state.set(key, value);
        },

        // Framework escape-hatches
        raw: c.req.raw,    // Node Request / Undici Request
        framework: c        // whole Hono context
    };
}