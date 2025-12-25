const list = document.getElementById("promptList");
const titleInput = document.getElementById("title");
const templateInput = document.getElementById("template");

function render(prompts) {
  list.innerHTML = "";
  
  if (prompts.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div>No custom prompts yet.<br>Add your first prompt below!</div>
      </div>
    `;
    return;
  }

  prompts.forEach((p) => {
    const div = document.createElement("div");
    div.className = "prompt";

    div.innerHTML = `
      <span>${p.title}</span>
      <button class="delete-btn" data-id="${p.id}" title="Delete prompt">×</button>
    `;

    div.querySelector("button").onclick = () => {
      removePrompt(p.id);
    };

    list.appendChild(div);
  });
}



function load() {
  chrome.storage.sync.get({ customPrompts: [] }, (data) => {
    render(data.customPrompts);
  });
}

function addPrompt() {
  const title = titleInput.value.trim();
  const template = templateInput.value.trim();

  if (!title || !template) {
    // Visual feedback for empty fields
    if (!title) titleInput.focus();
    else if (!template) templateInput.focus();
    return;
  }

  const addButton = document.getElementById("add");
  addButton.disabled = true;
  addButton.textContent = "Adding...";

  chrome.storage.sync.get({ customPrompts: [] }, (data) => {
    const newPrompt = {
      id: Date.now().toString(),
      title,
      template: template.endsWith("\n\n")
        ? template
        : template + "\n\n"
    };

    const updated = [...data.customPrompts, newPrompt];

    chrome.storage.sync.set({ customPrompts: updated }, () => {
      chrome.runtime.sendMessage({
        type: "UPDATE_PROMPTS",
        customPrompts: updated
      });
      titleInput.value = "";
      templateInput.value = "";
      render(updated);
      addButton.disabled = false;
      addButton.textContent = "➕ Add Prompt";
      titleInput.focus();
    });
  });
}

function removePrompt(id) {
  chrome.storage.sync.get({ customPrompts: [] }, (data) => {
    const updated = data.customPrompts.filter(
      (p) => p.id !== id
    );

    chrome.storage.sync.set({ customPrompts: updated }, () => {
      chrome.runtime.sendMessage({
        type: "UPDATE_PROMPTS",
        customPrompts: updated
      });
      render(updated);
    });
  });
}

document.getElementById("add").onclick = addPrompt;

// Allow Enter key to submit (Ctrl+Enter for textarea)
titleInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addPrompt();
  }
});

templateInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.ctrlKey) {
    e.preventDefault();
    addPrompt();
  }
});

load();

