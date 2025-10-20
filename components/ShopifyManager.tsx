import React, { useState, useEffect } from 'react';

const ShopifyIcon: React.FC = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-current">
    <title>Shopify</title>
    <path d="M19.385 7.152c-.6-.416-1.54-.64-2.82-.64-2.06 0-3.32.92-3.64 2.608-.08.4-.12.808-.12 1.216 0 .344.04.712.12 1.096.32 1.56 1.5 2.52 3.44 2.52 1.14 0 2.06-.216 2.66-.6V9.44c.024-.04.048-.08.06-.112v-.008c.024-.056.048-.112.06-.176.012-.048.024-.104.036-.152.012-.056.024-.112.024-.168 0-.048.012-.088.012-.136a.91.91 0 00-.012-.136c-.012-.048-.012-.088-.024-.136a.72.72 0 00-.06-.208zm-5.748-4.224c-.06.272-.2.536-.4.784a3.84 3.84 0 01-2.92 1.48c-1.64 0-2.812-.6-3.444-1.824-.12-.224-.2-.448-.26-.672L0 4.88v12.232c0 1.112.44 2.144 1.16 2.912.72.76 1.72 1.184 2.76 1.184h16.16c1.04 0 2.04-.424 2.76-1.184.72-.768 1.16-1.8 1.16-2.912V4.88L13.637 2.928z"/>
  </svg>
);

const ScopesList = () => (
    <div className="bg-slate-900/50 p-3 rounded-md max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
        <p className="text-xs font-mono text-slate-400 grid grid-cols-2 gap-x-4 gap-y-1">
            <span>write_products</span>
            <span>read_products</span>
            <span>write_customers</span>
            <span>read_customers</span>
            <span>write_orders</span>
            <span>read_orders</span>
            <span>write_draft_orders</span>
            <span>read_draft_orders</span>
            <span>write_themes</span>
            <span>read_themes</span>
            <span>write_content</span>
            <span>read_content</span>
            <span>write_inventory</span>
            <span>read_inventory</span>
            <span>write_shipping</span>
            <span>read_shipping</span>
            <span>write_files</span>
            <span>read_files</span>
        </p>
    </div>
);

const ShopifyManager: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      setIsLoading(true);
      setError(null);
      const storeUrl = window.localStorage.getItem('LUMINOUS_SHOPIFY_STORE_URL');
      const token = window.localStorage.getItem('LUMINOUS_SHOPIFY_ADMIN_TOKEN');

      if (!storeUrl || !token) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://${storeUrl}/admin/api/2024-07/shop.json`, {
          headers: {
            'X-Shopify-Access-Token': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized. The Admin API Access Token is invalid or expired.');
          }
          throw new Error(`Failed to connect. Status: ${response.status}`);
        }

        const data = await response.json();
        setStoreInfo(data.shop);
        setIsConnected(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
        <p className="ml-3 text-slate-400">Checking Shopify Connection...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-4 text-sm text-slate-300">
        <h3 className="text-md font-semibold text-cyan-400">Connect to Shopify</h3>
        <p>To grant Luminous control over a Shopify store, you need to create a <strong>Custom App</strong> and provide its credentials.</p>
        
        <div className="p-3 my-2 bg-amber-900/50 border border-amber-500/50 rounded-md text-amber-300 text-xs">
            <p className="font-bold">Important Check:</p>
            <p>If your app page shows a "Client ID" and "Client Secret", you have likely created a Public App. Luminous requires a <strong>Custom App</strong>. Please follow the steps below carefully.</p>
        </div>

        {error && (
            <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-md text-red-300 text-xs">
                <p className="font-bold">Connection Failed</p>
                <p>{error}</p>
            </div>
        )}

        <div>
            <h4 className="font-semibold text-slate-200 mb-1">Step 1: Create a Custom App</h4>
            <p className="text-xs text-slate-400">
                In your Shopify Admin, navigate to: <br/>
                <code className="bg-slate-900 px-1 rounded">Settings</code> → <code className="bg-slate-900 px-1 rounded">Apps and sales channels</code> → <code className="bg-slate-900 px-1 rounded">Develop apps</code> → <code className="bg-slate-900 px-1 rounded">Create a custom app</code>.
            </p>
        </div>
         <div>
            <h4 className="font-semibold text-slate-200 mb-1">Step 2: Configure Admin API Scopes</h4>
            <p className="text-xs text-slate-400 mb-2">After creating the app, go to its "Configuration" tab and configure the <strong>Admin API access scopes</strong>. Grant all the scopes listed below for full functionality:</p>
            <ScopesList />
        </div>
         <div>
            <h4 className="font-semibold text-slate-200 mb-1">Step 3: Get Admin API Token</h4>
            <p className="text-xs text-slate-400">
                Go to the "API credentials" tab and click <strong>Install app</strong>. After confirming, you will see your credentials. Reveal and copy the <strong>Admin API access token</strong>.
            </p>
            <p className="text-xs text-slate-400 mt-2">
                <strong className="text-cyan-300">The token you need starts with <code className="bg-slate-900 px-1 rounded">shpat_</code>.</strong>
            </p>
        </div>
        <button onClick={onOpenSettings} className="w-full py-2 text-sm font-semibold bg-cyan-600 text-white rounded-md hover:bg-cyan-500 transition-colors">
          Enter Credentials
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm text-slate-300">
      <div className="p-4 bg-slate-900/50 rounded-lg border border-green-500/50 flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-400/20 flex items-center justify-center text-green-300">
          <ShopifyIcon />
        </div>
        <div>
            <p className="text-xs text-green-400 font-bold">CONNECTED</p>
            <h3 className="text-lg font-semibold text-slate-100">{storeInfo.name}</h3>
            <p className="text-xs text-slate-400">{storeInfo.myshopify_domain}</p>
        </div>
      </div>
      <p>Luminous now has API access to this store. You can issue commands through the chat panel, such as:</p>
      <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
        <li>"List the 5 most recent products."</li>
        <li>"Create a new product called 'Synergy Crystal' for $99.99."</li>
        <li>"What's the total revenue for today?"</li>
      </ul>
       <button onClick={onOpenSettings} className="w-full mt-4 py-2 text-xs font-semibold bg-slate-600/50 text-slate-300 rounded-md hover:bg-slate-600 transition-colors">
          Update Connection
        </button>
    </div>
  );
};

export default ShopifyManager;
