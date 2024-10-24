let currentMode = 'conversation';
let isListening = false;

function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-container').forEach(container => {
        container.classList.add('hidden');
    });
    document.getElementById(`${mode}Mode`).classList.remove('hidden');
    
    // Update button styles
    document.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('bg-blue-500', 'text-white');
        btn.classList.add('bg-gray-200');
    });
    document.getElementById(`${mode}ModeBtn`).classList.remove('bg-gray-200');
    document.getElementById(`${mode}ModeBtn`).classList.add('bg-blue-500', 'text-white');
    
    if (mode === 'conversation' && isListening) {
        stopListening();
    }
}

async function startListening() {
    isListening = true;
    const button = document.getElementById('toggleListening');
    button.textContent = 'Stop Listening';
    button.classList.remove('bg-green-500');
    button.classList.add('bg-red-500');
    
    while (isListening) {
        try {
            const response = await fetch('/api/listen', { method: 'POST' });
            const data = await response.json();
            
            if (data.success) {
                const chatResponse = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: data.text })
                });
                const chatData = await chatResponse.json();
                if (chatData.success) {
                    updateHistory(chatData.history);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

function stopListening() {
    isListening = false;
    const button = document.getElementById('toggleListening');
    button.textContent = 'Start Listening';
    button.classList.remove('bg-red-500');
    button.classList.add('bg-green-500');
}

function updateHistory(history) {
    const container = document.getElementById(`${currentMode}History`);
    container.innerHTML = '';
    
    history.forEach(item => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${
            item.role === 'user' ? 'user-message' : 'assistant-message'
        }`;
        messageDiv.innerHTML = `
            <strong>${item.role === 'user' ? 'You' : 'Assistant'}:</strong>
            ${item.content}
        `;
        container.appendChild(messageDiv);
    });
    
    container.scrollTop = container.scrollHeight;
}

// Event Listeners
document.getElementById('toggleListening').addEventListener('click', () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
});

document.getElementById('messageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    input.value = '';
    input.disabled = true;
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        if (data.success) {
            updateHistory(data.history);
        }
    } catch (error) {
        console.error('Error:', error);
    }
    
    input.disabled = false;
    input.focus();
});

// Mode switching buttons
document.getElementById('listeningModeBtn').onclick = () => switchMode('listening');
document.getElementById('conversationModeBtn').onclick = () => switchMode('conversation');

// Initial history load
fetch('/api/history')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateHistory(data.history);
        }
    });