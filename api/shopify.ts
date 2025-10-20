import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { endpoint, method = 'GET', body } = req.body;

  const storeUrl = process.env.LUMINOUS_SHOPIFY_STORE_URL;
  const token = process.env.LUMINOUS_SHOPIFY_ADMIN_TOKEN;

  if (!storeUrl || !token) {
    return res.status(500).json({
      error: {
        message: 'Shopify environment variables are not configured on the server.',
      },
    });
  }

  if (!endpoint || !endpoint.startsWith('/admin/api/')) {
    return res.status(400).json({
      error: {
        message: "Invalid Shopify endpoint provided. It must start with '/admin/api/'.",
      },
    });
  }

  const url = `https://${storeUrl.replace(/\/$/, '')}${endpoint}`;

  try {
    const shopifyResponse = await fetch(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (shopifyResponse.status === 204) {
      return res.status(204).end();
    }

    const responseBody = await shopifyResponse.json();

    res.status(shopifyResponse.status).json(responseBody);
  } catch (error) {
    console.error(`[Shopify API Proxy] Error fetching ${url}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    res.status(500).json({
      error: {
        message: 'Failed to communicate with the Shopify API.',
        details: errorMessage,
      },
    });
  }
}
