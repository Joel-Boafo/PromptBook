const promptTitleElement = document.getElementById('prompt-title');
const promptTextarea = document.getElementById('prompt');
const askButton = document.getElementById('askChatGPT');
const saveButton = document.getElementById('saveNewPrompt');
const viewButton = document.getElementById('showSavedPrompts');
const savedPromptsModal = document.getElementById('savedPromptsModal');
const closeModalButton = document.getElementById('closeModal');
const promptTemplate = document.getElementById('prompt-option');
const promptOptionsDisplay = document.getElementById('prompt-options-display');
const savePromptModal = document.getElementById('savePromptModal');
const closeSavePromptModalButton = document.getElementById('closeSavePromptModal');
const savePromptConfirmButton = document.getElementById('savePromptConfirm');
const fieldError = document.getElementById('fieldError');
const promptTitleInput = document.getElementById('promptTitleInput');
const promptDescriptionInput = document.getElementById('promptDescription');
const prevPageButton = document.getElementById('prevPage');
const nextPageButton = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const responseContainer = document.getElementById('responseContainer');

const API_KEY = "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";
const API_MODEL = "llama3-8b-8192";

let currentPage = 1;
const itemsPerPage = 5;

const loadPrompts = () => {
    promptOptionsDisplay.innerHTML = '';
    let prompts = JSON.parse(localStorage.getItem('prompts')) || [];
    const totalPages = Math.ceil(prompts.length / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const promptsToDisplay = prompts.slice(startIndex, endIndex);

    for (const prompt of promptsToDisplay) {
        const template = promptTemplate.content.cloneNode(true);
        template.querySelector('h2').innerText = prompt.title;
        template.querySelector('p').innerText = prompt.description;
        const usePromptButton = template.querySelector('#usePrompt');
        const deletePromptButton = template.querySelector('#deletePrompt');
        if (usePromptButton) {
            usePromptButton.addEventListener('click', () => {
                promptTextarea.value = prompt.content;
                closeModal(savedPromptsModal);
            });
        }

        if (deletePromptButton) {
            deletePromptButton.addEventListener('click', () => {
                deletePrompt(prompt.id);
            });
        }
        promptOptionsDisplay.appendChild(template);
    }

    pageInfo.innerText = `Page ${currentPage} of ${totalPages}`;
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === totalPages;
};

const deletePrompt = (promptId) => {
    fetch(`http://localhost:8000/composite_prompts/${promptId}`, {
        'method': 'DELETE',
    }).then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete prompt');
        }

        let prompts = JSON.parse(localStorage.getItem('prompts')) || [];
        prompts = prompts.filter(prompt => prompt.id !== promptId);
        localStorage.setItem('prompts', JSON.stringify(prompts));
        loadPrompts();
    }).catch(error => {
        onsole.error('Error:', error);
    }
    )
};

const closeModal = (modal) => {
    modal.classList.add('hidden');
};

askButton.addEventListener('click', async () => {
    if (promptTextarea.value === '') {
        return null;
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: API_MODEL,
                messages: [{ role: "user", content: `${promptTextarea.value}` }],
            }),
        });

        const completion = await response.json();
        const responseText = completion.choices[0].message.content;
        responseContainer.innerText = responseText;
    } catch (error) {
        console.error('Error:', error);
    }
});

viewButton.addEventListener('click', () => {
    loadPrompts();
    savedPromptsModal.classList.remove('hidden');
});

closeModalButton.addEventListener('click', () => closeModal(savedPromptsModal));

saveButton.addEventListener('click', () => {
    savePromptModal.classList.remove('hidden');
    savePromptConfirmButton.disabled = !promptTextarea.value.trim();
});

closeSavePromptModalButton.addEventListener('click', () => closeModal(savePromptModal));

savePromptConfirmButton.addEventListener('click', async () => {
    const title = promptTitleInput.value;
    const description = promptDescriptionInput.value;
    const content = promptTextarea.value;

    if (!title || !description) {
        fieldError.classList.remove('hidden');
        setTimeout(() => {
            fieldError.classList.add('hidden');
        }, 3000);
        return;
    }

    const newPrompt = {
        author_id: 1,
        title,
        description,
    };

    try {
        const response = await fetch('http://localhost:8000/composite_prompts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newPrompt),
        });

        if (!response.ok) {
            throw new Error('Failed to create new prompt');
        }

        const createdPrompt = await response.json();

        const localPrompt = {
            id: createdPrompt.id,
            title: createdPrompt.title,
            description: createdPrompt.description,
            content,
        };

        let prompts = JSON.parse(localStorage.getItem('prompts')) || [];
        prompts.push(localPrompt);
        localStorage.setItem('prompts', JSON.stringify(prompts));

        closeModal(savePromptModal);
        window.location.reload();
    } catch (error) {
        console.error('Error:', error);
    }
});

promptTextarea.addEventListener('input', () => {
    saveButton.disabled = !promptTextarea.value.trim();
    savePromptConfirmButton.disabled = !promptTextarea.value.trim();
});

saveButton.disabled = !promptTextarea.value.trim();

prevPageButton.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadPrompts();
    }
});

nextPageButton.addEventListener('click', () => {
    let prompts = JSON.parse(localStorage.getItem('prompts')) || [];
    const totalPages = Math.ceil(prompts.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        loadPrompts();
    }
});