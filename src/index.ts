interface Env {
	CORS_ALLOW_ORIGIN: string;
	HELIUS_API_KEY: string;
}

export default {
	async fetch(request: Request, env: Env) {
		const supportedDomains = env.CORS_ALLOW_ORIGIN ? env.CORS_ALLOW_ORIGIN.split(',') : undefined;
		const corsHeaders: Record<string, string> = {
			'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, OPTIONS',
			'Access-Control-Allow-Headers': '*',
		};
		if (supportedDomains) {
			const origin = request.headers.get('Origin');
			if (origin && supportedDomains.includes(origin)) {
				corsHeaders['Access-Control-Allow-Origin'] = origin;
			}
		} else {
			corsHeaders['Access-Control-Allow-Origin'] = '*';
		}

		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: corsHeaders,
			});
		}

		const upgradeHeader = request.headers.get('Upgrade');

		if (upgradeHeader || upgradeHeader === 'websocket') {
			return await fetch(
				`https://overprivileged-peptized-cbnzbqndnj-dedicated.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`,
				request
			);
		}

		const { pathname, search } = new URL(request.url);
		const payload = await request.text();
		const proxyRequest = new Request(
			`https://${
				pathname === '/'
					? 'overprivileged-peptized-cbnzbqndnj-dedicated.helius-rpc.com'
					: 'api.helius.xyz'
			}${pathname}?api-key=${env.HELIUS_API_KEY}${search ? `&${search.slice(1)}` : ''}`,
			{
				method: request.method,
				body: payload || null,
				headers: {
					'Content-Type': 'application/json',
					'X-Helius-Cloudflare-Proxy': 'true',
				},
			}
		);

		return await fetch(proxyRequest).then(res => {
			return new Response(res.body, {
				status: res.status,
				headers: corsHeaders,
			});
		});
	},
};
