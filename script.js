const promptTemplate = document.getElementById('prompt-option');
const promptOptionsDisplay = document.getElementById('prompt-options-display');
const promptTitleElement = document.getElementById('prompt-title');
const promptTextarea = document.getElementById('prompt');
const askButton = document.getElementById('askChatGPT');
const saveButton = document.getElementById('saveNewPrompt');
const useButton = document.getElementById('usePrompt');
const deleteButton = document.getElementById('deletePrompt');
const viewButton = document.getElementById('showSavedPrompts');

const selectPrompt = (promptId) => {
    fetch(`http://localhost:8000/composite_prompts/${promptId}/expanded`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(prompt => {
            promptTextarea.value = prompt.fragments.reduce((acc, fragment) => {
                return `${acc} \n\n${fragment.content}`;
            }, '');
            window.location.href = 'index.html';
        })
        .catch(error => console.error('Error fetching prompt:', error));
}

const delelePrompt = (promptId) => {
    fetch(`http://localhost:8000/composite_prompts/${promptId}`, {
        method: 'DELETE',
    })
        .then(res => res.ok ? console.log('Prompt deleted') : console.log(`Error: ${res.status}`))
        .then(() => {
            window.location.reload();
        })
        .catch(err => console.error(err));
};

fetch(`http://localhost:8000/composite_prompts`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(composite_prompts => {
        for (const composite_prompt of composite_prompts) {
            const template = promptTemplate.content.cloneNode(true);
            template.querySelector('h2').innerText = composite_prompt.title;
            template.querySelector('p').innerText = composite_prompt.description;
            const usePromptButton = template.querySelector('#usePrompt');
            const deletePromptButton = template.querySelector('#deletePrompt');
            if (usePromptButton) {
                usePromptButton.addEventListener('click', () => { selectPrompt(composite_prompt.id) });
            }
            if (deletePromptButton) {
                deletePromptButton.addEventListener('click', () => { delelePrompt(composite_prompt.id) });
            }
            promptOptionsDisplay.appendChild(template);
        }
    })
    .catch(error => console.error('Error fetching composite prompts:', error));

askButton.addEventListener('click', () => {
    if (promptTextarea.value === '') {
        return null;
    }
    window.location.href = `https://chat.openai.com/?q=${promptTextarea.value}`;
});

viewButton.addEventListener('click', () => {
    window.location.href = 'prompts.html';
});

saveButton.addEventListener('click', async () => {
    const newPrompt = await fetch(`http://localhost:8000/composite_prompts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            author_id: 1,
            title: 'New Prompt',
            description: 'default description',
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            window.location.reload();
            return data;
        })
        .catch(error => console.error('Error saving new prompt:', error));

    const newFragment = await fetch(`http://localhost:8000/prompt_fragments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            author_id: 1,
            content: promptTextarea.value,
            description: 'default description fragment',
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            return data;
        })
        .catch(error => console.error('Error saving new fragment:', error));

    fetch(`http://localhost:8000/composite_prompts/${newPrompt.id}/fragments/${newFragment.id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            order_index: 0,
        }),
    })
    .catch(error => console.error('Error linking prompt and fragment:', error));
});