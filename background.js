const BUILT_IN_PROMPTS = [
    {
      id: "explain",
      title: "Explain this",
      template: "Explain this to me:\n\n"
    },
    {
      id: "summarize",
      title: "Summarize this",
      template: "Summarize this clearly:\n\n"
    },
    {
        id: "format-as-markdown",
        title: "Format as Markdown",
        template: "Keep the content exactly the same, but format it as well-structured markdown with proper headings, lists, code blocks, and formatting:\n\n"
    },
  ];
  

const PARENT_MENU_ID = "ask-ai";
const CUSTOM_PARENT_ID = "custom-prompt";

function rebuildMenus(customPrompts = []) {
    chrome.contextMenus.removeAll(()=> {
        //Parent
        chrome.contextMenus.create({
            id: PARENT_MENU_ID,
            title: "Ask AI",
            contexts: ["selection"]
        });

        BUILT_IN_PROMPTS.forEach((p) => {
            chrome.contextMenus.create({
                id: p.id,
                parentId: PARENT_MENU_ID,
                title: p.title,
                contexts: ["selection"]
            })
        });

        //Custom Prompt
        chrome.contextMenus.create({    
            id: CUSTOM_PARENT_ID,
            parentId: PARENT_MENU_ID,
            title: "Custom Prompts",
            contexts: ["selection"]
        });

        customPrompts.forEach((p) => {
            chrome.contextMenus.create({
                id: `custom-${p.id}`,
                parentId: CUSTOM_PARENT_ID,
                title: p.title,
                contexts: ["selection"]
            })
        });
    });
}


// On install
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get({ customPrompts: []}, (data) => {
        rebuildMenus(data.customPrompts);
    });
});

//Handle Menu Click
chrome.contextMenus.onClicked.addListener((info) => {
    if(!info.selectionText) return;

    chrome.storage.sync.get({ customPrompts: []}, (data) => {
        const builtIn = BUILT_IN_PROMPTS.find((p) => p.id === info.menuItemId);
        // Custom prompts have IDs prefixed with "custom-", so strip that prefix
        const customId = info.menuItemId.startsWith('custom-') 
            ? info.menuItemId.replace('custom-', '') 
            : null;
        const custom = customId ? data.customPrompts.find((p) => p.id === customId) : null;

        const promptConfig = builtIn || custom;
        if(!promptConfig) return;
        const prompt = promptConfig.template + info.selectionText;
        const url = "https://chat.openai.com/?q=" +  encodeURIComponent(prompt);
        chrome.tabs.create({url});
    });
});

//Listen for popup updates
chrome.runtime.onMessage.addListener((msg) => {
    if(msg.type === "UPDATE_PROMPTS") {
        rebuildMenus(msg.customPrompts);
    }
});

