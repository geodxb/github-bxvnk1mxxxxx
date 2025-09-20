export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Get client IP address
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                    request.headers.get('X-Forwarded-For') || 
                    request.headers.get('X-Real-IP') || 
                    'unknown';

    // Whitelist of authorized IPs
    const authorizedIPs = [
      '189.203.12.82',
      '193.186.4.212',
      '2806:2f0:74a0:c161:4dd6:d710:be4:61c8',
      '2806:2f0:74a0:c161:9d72:302a:ba4a:364e',
      '192.168.100.168',
      '2806:20:74a0:c161:c8dd:f9be:7de2:981e',
      '2806:20:74a0:c161:e07e:4cff:fe9e:77d2',
      'fe80::e07e:4cff:fe9e:77d2',
      // Development/localhost IPs for testing
      '127.0.0.1',
      '::1',
      'localhost'
    ];

    const isAuthorized = authorizedIPs.includes(clientIP) ||
                         clientIP.startsWith('192.168.') ||
                         clientIP.startsWith('10.') ||
                         clientIP.startsWith('172.');

    try {
      // Handle API proxying for authorized IPs
      if (isAuthorized && pathname.startsWith('/api/')) {
        // Proxy to backend server
        const backendURL = 'https://YOUR_BACKEND_URL'; // Replace with actual backend URL
        const targetURL = `${backendURL}${pathname}${url.search}`;

        const proxyRequest = new Request(targetURL, {
          method: request.method,
          headers: request.headers,
          body: request.body
        });

        return await fetch(proxyRequest);
      }

      // Try to fetch the requested file from the assets
      const assetResponse = await env.ASSETS.fetch(request);

      // If the asset exists (not 404), serve it directly.
      // This covers JS, CSS, images, etc.
      if (assetResponse.status !== 404) { 
        return assetResponse;
      }

      // If the request is not for an existing static asset,
      // it's likely an SPA route. Serve index.html as the fallback.
      const indexRequest = new Request(new URL('/index.html', request.url), request);
      let indexResponse = await env.ASSETS.fetch(indexRequest);

      if (indexResponse.ok) {
        let html = await indexResponse.text();

        // If the IP is NOT authorized, inject the IP access denial script.
        if (!isAuthorized) {
          const injectionScript = `
            <script>
              window.ipAccessDenied = {
                status: true,
                ip: "${clientIP}",
                timestamp: "${new Date().toISOString()}"
              };
            </script>
          `;
          html = html.replace('</head>', `${injectionScript}</head>`);
        }

        return new Response(html, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache'
          }
        });
      }

      // If index.html itself is not found, return the original 404 asset response
      return indexResponse;
    } catch (error) {
      // Generic error response without exposing backend details
      return new Response('Service Temporarily Unavailable', { 
        status: 503,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
  },
};

interface Env {
  ASSETS: Fetcher;
}
