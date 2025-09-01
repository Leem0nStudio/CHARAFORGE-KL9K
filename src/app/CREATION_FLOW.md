# 🗺️ CharaForge: Character Creation Flow (A to Z)

This document serves as a visual and conceptual guide to the entire character creation process in CharaForge. It outlines the journey from the user's initial idea to the final, persistent character stored in the database.

---

## 🎯 Core Philosophy: Structured, Multi-Phase Generation

Character creation is not a single AI call. It's a structured, three-phase pipeline designed to maximize quality and consistency.

1.  **Phase 1: The Soul Forge (Concept & Biography):** An LLM acts as a "Concept Artist" to turn a simple idea into a rich, structured "Character Bible."
2.  **Phase 2: The Body Forge (Image Generation):** A specialized image model uses the data from the "Bible" to create a high-quality portrait.
3.  **Phase 3: The Final Forging (Persistence):** The user saves the result, which is then stored permanently.

---

## 🌊 The Flowchart

This diagram illustrates the complete, end-to-end process.

```mermaid
graph TD
    subgraph "User Interface (Client)"
        A[1. User enters prompt <br> 'e.g., cyberpunk knight' <br> in /character-generator] --> B{Clicks "Forge Character"};
    end

    subgraph "Server Actions & Genkit Flows"
        B --> C[2. Call Server Action: `generateCharacterCore`];
        C --> D{3. Genkit Flow: `generateCharacterBible`};
        D --> E[4. AI (LLM) expands prompt <br> into detailed JSON 'Character Bible'];
        E --> F[5. Server uses `prompt-builder` <br> to create a detailed image prompt];
        F --> G[6. Call Server Action: `generateCharacterPortrait`];
        G --> H{7. Orchestrator selects Image Engine <br> (Gemini, ComfyUI, etc.)};
        H --> I[8. AI generates image from detailed prompt];
    end

    subgraph "User Interface (Client)"
        I --> J[9. Image is revealed to user with animation];
        J --> K{10. User clicks "Save Character"};
    end

    subgraph "Server Actions & Firebase"
        K --> L[11. Call Server Action: `saveCharacter`];
        L --> M[12. Service `uploadToStorage` <br> saves image to Firebase Storage, gets URL];
        M --> N[13. All data (Bible, Image URL, User ID) <br> is saved to Firestore];
        N --> O[14. Character is now permanent. <br> User is redirected to Edit page];
    end

    %% Styling
    style A fill:#2d3748,stroke:#f7fafc,stroke-width:2px;
    style B fill:#b794f4,stroke:#f7fafc,stroke-width:2px,color:#1a202c;
    style C fill:#4a5568,stroke:#f7fafc,stroke-width:1px;
    style D fill:#718096,stroke:#f7fafc,stroke-width:1px;
    style E fill:#a0aec0,stroke:#1a202c,stroke-width:1px;
    style F fill:#4a5568,stroke:#f7fafc,stroke-width:1px;
    style G fill:#4a5568,stroke:#f7fafc,stroke-width:1px;
    style H fill:#718096,stroke:#f7fafc,stroke-width:1px;
    style I fill:#a0aec0,stroke:#1a202c,stroke-width:1px;
    style J fill:#2d3748,stroke:#f7fafc,stroke-width:2px;
    style K fill:#b794f4,stroke:#f7fafc,stroke-width:2px,color:#1a202c;
    style L fill:#4a5568,stroke:#f7fafc,stroke-width:1px;
    style M fill:#718096,stroke:#f7fafc,stroke-width:1px;
    style N fill:#718096,stroke:#f7fafc,stroke-width:1px;
    style O fill:#38a169,stroke:#f7fafc,stroke-width:2px;
```

---

## 🛠️ Detailed Step-by-Step Breakdown

### Phase 1: The Soul Forge

1.  **User Input:** The journey begins on the `/character-generator` page. The user provides a simple concept, like "a stoic cyberpunk knight with a chrome katana, neon-lit rainy city background, cinematic..."
2.  **`generateCharacterCore` Action:** The client calls this server action.
3.  **`generateCharacterBible` Flow:** This is the core of the first phase. An AI flow takes the user's input and, guided by a very specific prompt, generates a structured JSON object called the **"Character Bible"**. This is the single source of truth for the character's identity and appearance. It contains everything from their name and backstory to the specific type of armor on their shoulders.
4.  **`prompt-builder` Service:** Once the Character Bible is created, a server-side service reads its contents and assembles a long, detailed, and optimized prompt specifically for the image generation model. This ensures the visual output is consistent with the narrative and details defined in the Bible.

### Phase 2: The Body Forge

5.  **`generateCharacterPortrait` Action:** With the detailed image prompt ready, the system immediately calls this action.
6.  **Orchestration:** This action is a smart router. It checks the configuration the user has selected (e.g., a personal ComfyUI server, the system's Gemini model, or a custom LoRA on Hugging Face).
7.  **Image Generation:** It sends the prompt to the correct image generation engine.
8.  **Image Display:** The generated image is sent back to the client, where it's shown to the user with a "reveal" animation for a more engaging experience.

### Phase 3: The Final Forging

9.  **Save Action:** When the user is happy and clicks "Save Character", the `saveCharacter` server action is called.
10. **Upload to Storage:** The image data (which was a temporary Data URI) is first uploaded to Firebase Storage via the centralized `uploadToStorage` service. This returns a permanent, public URL for the image.
11. **Write to Firestore:** The action gathers all the generated data—the full Character Bible, the new Storage URL, the user's ID, the generation engine details—and writes it as a single, new document to the `characters` collection in Firestore.
12. **Completion:** The character is now saved permanently. The user is redirected to the `/characters/[id]/edit` page, where they can continue to refine the details, add timeline events, roll for stats, and more.

This structured flow ensures that every character is rich with detail, visually consistent with their story, and securely saved to the user's account.
