import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
	// No auth configured
	console.log(context);
	return {
		session: null,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
