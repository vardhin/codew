<script lang="ts">
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';
    
    let socket: WebSocket | null = null;
    let text = '';
    let files: string[] = [];
    let currentFile = '';
  
    onMount(() => {
        if (browser) {
            initializeWebSocket();
        }
    });

    function initializeWebSocket() {
        socket = new WebSocket('ws://192.168.89.99:8080');

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
  
    function updateText(e: Event) {
        text = (e.target as HTMLTextAreaElement).value;
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
    <div>
        <textarea bind:value={text} on:input={updateText} rows="10" cols="50"></textarea>
        <button on:click={saveFile}>Save File</button>
    </div>
    <div>
        <h3>Files:</h3>
        <ul>
            {#each files as file}
                <li>
                    <button on:click={() => loadFile(file)}>{file}</button>
                </li>
            {/each}
        </ul>
    </div>
{/if}

<style>
    textarea {
        width: 100%;
        padding: 10px;
        font-size: 1.2em;
        border: 2px solid #ccc;
        border-radius: 5px;
    }

    button {
        margin-top: 10px;
        padding: 5px 10px;
        font-size: 1em;
    }

    ul {
        list-style-type: none;
        padding: 0;
    }

    li {
        margin-bottom: 5px;
    }
</style>
