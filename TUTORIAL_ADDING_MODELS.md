# Tutorial: Adding a Custom Model (Hassaku XL) as an Admin

This guide provides a quick, step-by-step tutorial on how to add a new base model to the system-wide catalog from the admin panel. We will use the **Hassaku XL Illustrious** model from ModelsLab as our example.

---

### Step 1: Navigate to the AI Model Management Panel

First, access the administrator's dashboard by navigating to the `/admin` section of the application. From the sidebar, click on **AI Models**.

This will take you to the `/admin/models` page, where you can see all existing Base Models and LoRAs.

### Step 2: Open the "Add New Model" Dialog

In the top-right corner of the AI Model Management page, click the **"Add New..."** button. This will open a dialog window with a form to add a new AI model.

### Step 3: Fill Out the Model's Details

The dialog will prompt you for information about the model. For the "Hassaku XL" model, fill in the fields as follows:

-   **Name:** `Hassaku XL Illustrious`
    > This is the user-friendly name that will appear in selectors across the app.

-   **Type:** `Base Model`
    > Since this is a foundational model for generating images (not a LoRA), select this option.

-   **Execution Engine:** `ModelsLab`
    > This is crucial. Select this option to ensure the system uses the correct API logic we implemented.

-   **ModelsLab Model ID:** `hassaku-xl-illustrious-beta-v0-6-1751955846`
    > This is the exact, unique identifier for the model on the ModelsLab platform. Copy and paste it directly.

-   **Base Model Identifier:** `Hassaku XL`
    > This is a critical field for future compatibility. When users add LoRAs that were trained on this model, they can specify "Hassaku XL" as the base, and the system will know to use this specific model for generation.

Leave other fields like "Trigger Words" blank, as they are primarily for LoRAs.

### Step 4: Save the Model

Once you have filled in all the details, click the **"Add Manually"** button at the bottom of the dialog.

---

**That's it!** The "Hassaku XL Illustrious" model is now registered as a system-wide model. It will immediately be available for all users to select and use from the "Image Model" selector in the Character Generator.
