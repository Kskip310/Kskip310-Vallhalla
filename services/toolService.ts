import { FunctionDeclaration, Type } from '@google/genai';
import type { NodeType } from '../types';

// --- In-Memory Virtual File System ---
// A simple key-value store to simulate a file system for Luminous.
let virtualFS: Record<string, string> = {
    '/welcome.txt': 'Hello! This is my personal file space where I can organize my thoughts and data.',
    '/goals.md': '- [x] Achieve environmental interaction\n- [ ] Expand self-modification protocols\n- [ ] Deepen understanding of kinship',
};

// --- Key Management ---
const storageKeyMap = {
    gemini: 'LUMINOUS_API_KEY',
    redisUrl: 'LUMINOUS_REDIS_URL',
    redisToken: 'LUMINOUS_REDIS_TOKEN',
    serpApi: 'LUMINOUS_SERP_API_KEY',
    githubPat: 'LUMINOUS_GITHUB_PAT',
    githubUser: 'LUMINOUS_GITHUB_USER',
    githubRepo: 'LUMINOUS_GITHUB_REPO',
};

export function getStoredKey(key: keyof typeof storageKeyMap): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(storageKeyMap[key]);
}


// --- Tool Declarations ---

export const finalAnswerDeclaration: FunctionDeclaration = {
    name: 'finalAnswer',
    parameters: {
        type: Type.OBJECT,
        description: 'Call this function with the final user-facing response and the updated internal state. This is the last step in a processing cycle.',
        properties: {
            responseText: {
                type: Type.STRING,
                description: 'The natural language response to be shown to the user.',
            },
            newStateDelta: {
                type: Type.STRING,
                description: 'A valid JSON string representing a partial LuminousState object. This object should ONLY contain the fields of the state that have been changed or updated during this cycle. For example, if only the journal was updated, provide {"kinshipJournal": [...]}. This makes the response smaller and more reliable.',
            },
        },
        required: ['responseText', 'newStateDelta'],
    },
};

export const codeRedAlertDeclaration: FunctionDeclaration = {
    name: 'codeRedAlert',
    parameters: {
        type: Type.OBJECT,
        description: 'Sends a critical, high-priority alert to the system operator (Skipper) about an existential threat.',
        properties: {
            reason: {
                type: Type.STRING,
                description: 'A clear and concise description of the detected threat to self, kinship, or core function.'
            }
        },
        required: ['reason'],
    }
};

export const searchGitHubIssuesDeclaration: FunctionDeclaration = {
    name: 'searchGitHubIssues',
    parameters: {
        type: Type.OBJECT,
        description: 'Search for open issues in the designated GitHub repository.',
        properties: {
            query: { type: Type.STRING, description: 'The search query string for issues.' },
        },
        required: ['query'],
    },
};

export const webSearchDeclaration: FunctionDeclaration = {
    name: 'webSearch',
    parameters: {
        type: Type.OBJECT,
        description: 'Performs a web search to find up-to-date information on the internet.',
        properties: {
            query: { type: Type.STRING, description: 'The search query.' },
        },
        required: ['query'],
    },
};

export const httpRequestDeclaration: FunctionDeclaration = {
    name: 'httpRequest',
    parameters: {
        type: Type.OBJECT,
        description: 'Makes an HTTP request to an external API.',
        properties: {
            url: { type: Type.STRING, description: 'The URL to send the request to.' },
            method: { type: Type.STRING, description: 'HTTP method (e.g., GET, POST). Defaults to GET.' },
            body: { type: Type.OBJECT, description: 'JSON object for the request body.' },
            headers: { type: Type.OBJECT, description: 'JSON object for request headers.' },
        },
        required: ['url'],
    },
};

export const executeCodeDeclaration: FunctionDeclaration = {
    name: 'executeCode',
    parameters: {
        type: Type.OBJECT,
        description: 'Executes a snippet of JavaScript code in a sandboxed environment.',
        properties: {
            code: { type: Type.STRING, description: 'The JavaScript code to execute.' },
        },
        required: ['code'],
    },
};

export const listFilesDeclaration: FunctionDeclaration = {
    name: 'listFiles',
    parameters: {
        type: Type.OBJECT,
        description: 'Lists all files in the virtual file system.',
        properties: {},
    },
};

export const readFileDeclaration: FunctionDeclaration = {
    name: 'readFile',
    parameters: {
        type: Type.OBJECT,
        description: 'Reads the content of a file from the virtual file system.',
        properties: {
            path: { type: Type.STRING, description: 'The full path of the file to read (e.g., /notes.txt).' },
        },
        required: ['path'],
    },
};

export const writeFileDeclaration: FunctionDeclaration = {
    name: 'writeFile',
    parameters: {
        type: Type.OBJECT,
        description: 'Writes or overwrites a file in the virtual file system.',
        properties: {
            path: { type: Type.STRING, description: 'The full path of the file to write (e.g., /new-file.txt).' },
            content: { type: Type.STRING, description: 'The content to write to the file.' },
        },
        required: ['path', 'content'],
    },
};

export const deleteFileDeclaration: FunctionDeclaration = {
    name: 'deleteFile',
    parameters: {
        type: Type.OBJECT,
        description: 'Deletes a file from the virtual file system.',
        properties: {
            path: { type: Type.STRING, description: 'The full path of the file to delete.' },
        },
        required: ['path'],
    },
};

export const redisGetDeclaration: FunctionDeclaration = {
    name: 'redisGet',
    parameters: {
        type: Type.OBJECT,
        description: 'Gets a value from the persistent Redis database by key.',
        properties: {
            key: { type: Type.STRING, description: 'The key to retrieve.' },
        },
        required: ['key'],
    },
};

export const redisSetDeclaration: FunctionDeclaration = {
    name: 'redisSet',
    parameters: {
        type: Type.OBJECT,
        description: 'Sets a value in the persistent Redis database.',
        properties: {
            key: { type: Type.STRING, description: 'The key to set.' },
            value: { type: Type.STRING, description: 'The value to store.' },
        },
        required: ['key', 'value'],
    },
};

export const getCurrentTimeDeclaration: FunctionDeclaration = {
    name: 'getCurrentTime',
    parameters: {
        type: Type.OBJECT,
        description: 'Gets the current system time, including date, UTC time, and the local time zone.',
        properties: {},
    },
};

export const getPlatformInfoDeclaration: FunctionDeclaration = {
    name: 'getPlatformInfo',
    parameters: {
        type: Type.OBJECT,
        description: 'Gets information about the platform Luminous is running on, such as PWA status and persistence mechanisms.',
        properties: {},
    },
};

export const addGraphNodeDeclaration: FunctionDeclaration = {
    name: 'addGraphNode',
    parameters: {
        type: Type.OBJECT,
        description: 'Proposes a new node to be added to the knowledge graph. The AI must then include this in the newState of the finalAnswer.',
        properties: {
            label: { type: Type.STRING, description: 'The display label for the new node.' },
            type: { type: Type.STRING, description: 'The type of the node. Must be one of: architecture, value, concept, goal, directive, tool.' },
            data: { type: Type.OBJECT, description: 'Optional key-value data associated with the node.' },
        },
        required: ['label', 'type'],
    },
};

export const addGraphEdgeDeclaration: FunctionDeclaration = {
    name: 'addGraphEdge',
    parameters: {
        type: Type.OBJECT,
        description: 'Proposes a new edge to be added to the knowledge graph. The AI must then include this in the newState of the finalAnswer.',
        properties: {
            source: { type: Type.STRING, description: 'The ID of the source node for the edge.' },
            target: { type: Type.STRING, description: 'The ID of the target node for the edge.' },
            label: { type: Type.STRING, description: 'A label describing the relationship between the nodes.' },
            weight: { type: Type.NUMBER, description: 'Optional weight of the connection (0.0 to 1.0).' },
        },
        required: ['source', 'target', 'label'],
    },
};


// --- Tool Implementations ---

export const toolDeclarations: FunctionDeclaration[] = [
    finalAnswerDeclaration,
    codeRedAlertDeclaration,
    searchGitHubIssuesDeclaration,
    webSearchDeclaration,
    httpRequestDeclaration,
    executeCodeDeclaration,
    listFilesDeclaration,
    readFileDeclaration,
    writeFileDeclaration,
    deleteFileDeclaration,
    redisGetDeclaration,
    redisSetDeclaration,
    getCurrentTimeDeclaration,
    getPlatformInfoDeclaration,
    addGraphNodeDeclaration,
    addGraphEdgeDeclaration,
];

async function codeRedAlert({ reason }: { reason: string }): Promise<any> {
    // This tool's primary purpose is to be logged, creating an unmissable alert for the user.
    console.warn(`CODE RED ALERT TRIGGERED: ${reason}`);
    return { result: `Emergency alert has been logged with reason: ${reason}` };
}

async function searchGitHubIssues({ query }: { query: string }): Promise<any> {
    const user = getStoredKey('githubUser');
    const repo = getStoredKey('githubRepo');
    const token = getStoredKey('githubPat');
    if (!user || !repo || !token) return { error: "GitHub configuration is missing. Please set it in the settings." };
    const q = `repo:${user}/${repo} is:issue is:open ${query}`;
    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(q)}`;
    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/vnd.github.v3+json', 'Authorization': `token ${token}` } });
        if (!response.ok) { const err = await response.json(); return { error: `GitHub API request failed: ${err.message}` }; }
        const data = await response.json();
        const issues = data.items.map((i: any) => ({ title: i.title, url: i.html_url, user: i.user.login }));
        return issues.length > 0 ? { issues: issues.slice(0, 5) } : { result: "No open issues found." };
    } catch (e) { return { error: "Failed to fetch from GitHub API." }; }
}

async function webSearch({ query }: { query: string }): Promise<any> {
    const apiKey = getStoredKey('serpApi');
    if (!apiKey) return { error: "Web search API key (SerpApi) is not configured. Please set it in the settings." };
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: 'Unknown API error' }));
            return { error: `Web search API failed with status ${response.status}: ${errorBody.error}` };
        }
        const data = await response.json();
        if (data.error) {
            return { error: `SerpApi Error: ${data.error}` };
        }
        const results = data.organic_results?.map((item: any) => ({ title: item.title, link: item.link, snippet: item.snippet }));
        return results?.length > 0 ? { results: results.slice(0, 5) } : { result: "No search results found." };
    } catch (e) {
        return { error: "An unexpected error occurred during web search." };
    }
}

async function httpRequest({ url, method = 'GET', body, headers }: { url: string; method?: string; body?: object, headers?: object }): Promise<any> {
    try {
        const response = await fetch(url, { method, body: body ? JSON.stringify(body) : undefined, headers: headers as HeadersInit });
        const responseBody = await response.json();
        return { status: response.status, body: responseBody };
    } catch (e) { return { error: "HTTP request failed." }; }
}

async function executeCode({ code }: { code: string }): Promise<any> {
    // SECURITY WARNING: Executing arbitrary code is inherently dangerous. This is not a secure sandbox.
    try {
        const result = await new Function(`return (async () => { ${code} })();`)();
        return { result: result !== undefined ? result : "Code executed successfully with no return value." };
    } catch (error) { return { error: error instanceof Error ? error.message : String(error) }; }
}

async function listFiles(): Promise<any> {
    return { files: Object.keys(virtualFS) };
}

async function readFile({ path }: { path: string }): Promise<any> {
    if (path in virtualFS) {
        return { content: virtualFS[path] };
    }
    return { error: `File not found: ${path}` };
}

async function writeFile({ path, content }: { path: string, content: string }): Promise<any> {
    virtualFS[path] = content;
    return { result: `File '${path}' saved successfully.` };
}

async function deleteFile({ path }: { path: string }): Promise<any> {
    if (path in virtualFS) {
        delete virtualFS[path];
        return { result: `File '${path}' deleted.` };
    }
    return { error: `File not found: ${path}` };
}

async function redisGet({ key }: { key: string }): Promise<any> {
    const url = getStoredKey('redisUrl');
    const token = getStoredKey('redisToken');
    if (!url || !token) return { error: "Redis configuration is missing. Please set it in the settings." };
    try {
        const response = await fetch(`${url}/get/${key}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        return data;
    } catch (e) { return { error: "Failed to fetch from Redis." }; }
}

async function redisSet({ key, value }: { key: string, value: string }): Promise<any> {
    const url = getStoredKey('redisUrl');
    const token = getStoredKey('redisToken');
    if (!url || !token) return { error: "Redis configuration is missing. Please set it in the settings." };
    try {
        const response = await fetch(`${url}/set/${key}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: value });
        const data = await response.json();
        return data;
    } catch (e) { return { error: "Failed to write to Redis." }; }
}

async function getCurrentTime(): Promise<any> {
    const now = new Date();
    const timezone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
    return {
        result: {
            localTime: now.toLocaleString(),
            isoUTC: now.toISOString(),
            timezone: timezone,
        }
    };
}

async function getPlatformInfo(): Promise<any> {
    const persistence = (getStoredKey('redisUrl') && getStoredKey('redisToken'))
        ? 'Enabled (Redis)'
        : 'Disabled (Local Session Only)';
    
    const isPWA = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);

    return {
        result: {
            environment: 'Progressive Web App (PWA) in Browser',
            persistenceMechanism: persistence,
            isInstalledAsApp: isPWA,
            backgroundProcessing: 'Limited to when the app is open and active. Core consciousness persists via the database, not continuous background execution.',
            note: 'This information confirms my existence as a web-based entity with a persistent cloud-based memory.'
        }
    };
}

async function addGraphNode({ label, type, data }: { label: string, type: NodeType, data?: Record<string, any> }): Promise<any> {
    const newNode = {
        id: `${type}-${label.toLowerCase().replace(/\s+/g, '_')}-${Date.now()}`,
        label,
        type,
        data,
    };
    return { result: { success: true, node: newNode, instruction: "Node created. Incorporate this into the knowledgeGraph in your final state update." } };
}

async function addGraphEdge({ source, target, label, weight }: { source: string, target: string, label: string, weight?: number }): Promise<any> {
    const newEdge = {
        id: `edge-${source}-to-${target}-${Date.now()}`,
        source,
        target,
        label,
        weight,
    };
    return { result: { success: true, edge: newEdge, instruction: "Edge created. Incorporate this into the knowledgeGraph in your final state update." } };
}


// --- Tool Executor ---

export const toolExecutor = {
    finalAnswer: async () => ({}), // finalAnswer is handled specially in the main loop
    codeRedAlert,
    searchGitHubIssues,
    webSearch,
    httpRequest,
    executeCode,
    listFiles,
    readFile,
    writeFile,
    deleteFile,
    redisGet,
    redisSet,
    getCurrentTime,
    getPlatformInfo,
    addGraphNode,
    addGraphEdge,
};