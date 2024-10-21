<script lang="ts">
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';
    import CodeMirror from 'svelte-codemirror-editor';
    import { javascript } from '@codemirror/lang-javascript';
    import { oneDark } from '@codemirror/theme-one-dark';
    
    let socket: WebSocket | null = null;
    let text = '';
    let files: string[] = [];
    let currentFile = '';
    let editor: CodeMirror;
  
    onMount(() => {
        if (browser) {
            initializeWebSocket();
        }
    });

    function initializeWebSocket() {
        socket = new WebSocket('ws://192.168.139.183:8080');

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'TEXT_UPDATED':
                    text = data.content;
                    break;
                case 'FILE_LIST':
                    files = data.files;
                    break;
                case 'FILE_LOADED':
                    text = data.content;
                    currentFile = data.filename;
                    break;
                case 'FILE_SAVED':
                    alert(`File ${data.filename} saved successfully!`);
                    getFiles();
                    break;
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socket.onopen = () => {
            console.log('WebSocket connected');
            getFiles();
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected');
        };
    }
  
    function updateText(value: string) {
        text = value;
        if (browser && socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'UPDATE_TEXT', content: text }));
        } else {
            console.error('WebSocket is not connected');
        }
    }

    function saveFile() {
        const filename = prompt('Enter filename to save:', currentFile || 'newfile.txt');
        if (filename) {
            socket?.send(JSON.stringify({ type: 'SAVE_FILE', filename, content: text }));
            currentFile = filename;
        }
    }

    function getFiles() {
        socket?.send(JSON.stringify({ type: 'GET_FILES' }));
    }

    function loadFile(filename: string) {
        socket?.send(JSON.stringify({ type: 'LOAD_FILE', filename }));
    }
</script>

{#if browser}
    <div class="app-container">
        <div class="file-list">
            <h3>Files:</h3>
            <ul>
                {#each files as file}
                    <li>
                        <button class="file-button" on:click={() => loadFile(file)}>{file}</button>
                    </li>
                {/each}
            </ul>
        </div>
        <div class="editor-container">
            <CodeMirror
                bind:value={text}
                on:change={({ detail }) => updateText(detail)}
                lang={javascript()}
                theme={oneDark}
                styles={{
                    "&": {
                        height: "calc(100vh - 60px)",
                        width: "100%"
                    }
                }}
            />
            <button class="save-button" on:click={saveFile}>Save File</button>
        </div>
    </div>
{/if}

<style>
    .app-container {
        display: flex;
        height: 100vh;
    }

    .file-list {
        width: 250px;
        background-color: #f0f0f0;
        padding: 15px;
        overflow-y: auto;
        border-right: 1px solid #ddd;
    }

    .file-list h3 {
        margin-top: 0;
        margin-bottom: 10px;
        color: #333;
    }

    ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
    }

    li {
        margin-bottom: 8px;
    }

    .file-button {
        width: 100%;
        padding: 8px 12px;
        font-size: 0.9em;
        background-color: #f8f8f8;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
        text-align: left;
    }

    .file-button:hover {
        background-color: #e8e8e8;
    }

    .editor-container {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        padding: 20px;
    }

    .save-button {
        margin-top: 10px;
        padding: 8px 16px;
        font-size: 1em;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
        align-self: flex-start;
    }

    .save-button:hover {
        background-color: #45a049;
    }

    :global(.cm-editor) {
        font-size: 1.2em;
        border: 2px solid #ccc;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
</style>
