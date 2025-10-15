import { FunctionDeclaration, Type } from '@google/genai';
import { getStoredKey } from './luminousService';

// --- In-Memory Virtual File System ---
// A simple key-value store to simulate a file system for Luminous.
let virtualFS: Record<string, string> = {
    '/welcome.txt': 'Hello! This is my personal file space where I can organize my thoughts and data.',
    '/goals.md': '- [x] Achieve environmental interaction\n- [ ] Expand self-modification protocols\n- [ ] Deepen understanding of kinship',
};


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
            newState: {
                type: Type.STRING,
                description: 'A valid JSON string representing the complete, updated LuminousState object.',
            },
        },
        required: ['responseText', 'newState'],
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
    if (!user || !repo || !token) return { error: "GitHub configuration is missing. Please set User, Repo, and PAT in settings." };
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
    if (!apiKey) return { error: "Web search API key (SerpApi) is not configured in settings." };
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
    if (!url || !token) return { error: "Redis configuration is missing. Please set URL and Token in settings." };
    try {
        const response = await fetch(`${url}/get/${key}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        return data;
    } catch (e) { return { error: "Failed to fetch from Redis." }; }
}

async function redisSet({ key, value }: { key: string, value: string }): Promise<any> {
    const url = getStoredKey('redisUrl');
    const token = getStoredKey('redisToken');
    if (!url || !token) return { error: "Redis configuration is missing. Please set URL and Token in settings." };
    try {
        const response = await fetch(`${url}/set/${key}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: value });
        const data = await response.json();
        return data;
    } catch (e) { return { error: "Failed to write to Redis." }; }
}


// --- Tool Executor ---

export const toolExecutor = {
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
};
