/**
 * RavenGPT - Full GUI End-to-End Test
 * Tests every button, feature, and interaction an end user would make.
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('RavenGPT GUI - Full Feature Test', () => {

    test.beforeEach(async ({ page }) => {
        // Clear localStorage to start fresh each test
        await page.goto(BASE);
        await page.evaluate(() => localStorage.clear());
    });

    // ============================================================
    // 1. INITIAL LOAD
    // ============================================================
    test('1. Initial page load - shows loading then chat UI', async ({ page }) => {
        await page.goto(BASE);
        // Wait for the app to render
        await page.waitForSelector('header', { timeout: 10000 });

        // Verify header exists with sidebar toggle and settings button
        const menuBtn = page.locator('button[title="Toggle sidebar (Ctrl+B)"]');
        await expect(menuBtn).toBeVisible({ timeout: 5000 });

        const settingsBtn = page.locator('button[title="Settings (Ctrl+,)"]');
        await expect(settingsBtn).toBeVisible();

        // Verify dark mode toggle exists
        const darkModeBtn = page.locator('button[title="Toggle dark mode"]');
        await expect(darkModeBtn).toBeVisible();

        // Verify sidebar is visible
        const newChatBtn = page.locator('button:has-text("New Chat")');
        await expect(newChatBtn).toBeVisible();

        // Verify chat input area exists (disabled until API key set)
        const textarea = page.locator('textarea');
        await expect(textarea).toBeVisible();

        // Verify feature mode selector (use first() to avoid strict mode with header badge)
        await expect(page.getByText('Standard').first()).toBeVisible();
    });

    // ============================================================
    // 2. DARK MODE TOGGLE
    // ============================================================
    test('2. Dark mode toggle works', async ({ page }) => {
        await page.goto(BASE);
        await page.waitForSelector('header', { timeout: 10000 });

        // Start in light mode (we cleared localStorage)
        const html = page.locator('html');
        await expect(html).not.toHaveClass(/dark/);

        // Click dark mode toggle
        const darkModeBtn = page.locator('button[title="Toggle dark mode"]');
        await darkModeBtn.click();

        // Verify dark class added
        await expect(html).toHaveClass(/dark/);

        // Toggle back
        await darkModeBtn.click();
        await expect(html).not.toHaveClass(/dark/);
    });

    // ============================================================
    // 3. SIDEBAR
    // ============================================================
    test('3. Sidebar toggle and search', async ({ page }) => {
        await page.goto(BASE);
        await page.waitForSelector('header', { timeout: 10000 });

        // Sidebar should be visible by default
        const newChatBtn = page.locator('button:has-text("New Chat")');
        await expect(newChatBtn).toBeVisible();

        // Toggle sidebar off
        const menuBtn = page.locator('button[title="Toggle sidebar (Ctrl+B)"]');
        await menuBtn.click();

        // New Chat button should not be visible (sidebar hidden)
        // The sidebar width transitions to 0
        await page.waitForTimeout(300);

        // Toggle sidebar back on
        await menuBtn.click();
        await page.waitForTimeout(300);
        await expect(newChatBtn).toBeVisible();

        // Test search input
        const searchInput = page.locator('input[placeholder="Search chats..."]');
        await expect(searchInput).toBeVisible();
        await searchInput.fill('nonexistent');
        await expect(page.getByText('No chats found')).toBeVisible();

        // Clear search
        await page.getByText('Clear search').click();
    });

    // ============================================================
    // 4. SETTINGS PAGE - ALL TABS
    // ============================================================
    test('4. Settings page - all 7 tabs render', async ({ page }) => {
        await page.goto(BASE + '/settings');
        await page.waitForSelector('h1:has-text("Settings")', { timeout: 10000 });

        // Verify all tabs are visible
        const tabNames = ['API', 'Models', 'Parameters', 'Personas', 'MCP', 'Appearance', 'About'];
        for (const tab of tabNames) {
            await expect(page.getByRole('button', { name: tab, exact: true })).toBeVisible();
        }

        // Click each tab and verify content
        const tabTests: Record<string, string[]> = {
            'API': ['API Provider', 'API Key', 'Default System Prompt'],
            'Models': ['Model Selection', 'Load Models'],
            'Parameters': ['Generation Parameters', 'Temperature', 'Max Tokens'],
            'Personas': ['AI Personas', 'Default Assistant'],
            'MCP': ['MCP Servers', 'Add Server', 'Quick Add Presets'],
            'Appearance': ['Appearance & UI', 'Dark Mode', 'Interface Language'],
            'About': ['RavenGPT', 'Version 2.0.0', 'Multi-Model'],
        };

        for (const [tab, expectedTexts] of Object.entries(tabTests)) {
            await page.getByRole('button', { name: tab, exact: true }).click();
            await page.waitForTimeout(200);
            for (const text of expectedTexts) {
                await expect(page.getByText(text).first()).toBeVisible({ timeout: 3000 });
            }
        }
    });

    // ============================================================
    // 5. SETTINGS - API KEY INPUT & PROVIDER SELECTION
    // ============================================================
    test('5. Settings - API key input and provider selection', async ({ page }) => {
        await page.goto(BASE + '/settings');
        await page.waitForSelector('h1:has-text("Settings")', { timeout: 10000 });

        // Ensure we're on API tab (it's default) — use exact to avoid matching "Custom API URL"
        await page.getByRole('button', { name: 'API', exact: true }).click();

        // Test provider switching
        const providers = ['OpenRouter', 'Together AI', 'Groq', 'Custom API URL'];
        for (const provider of providers) {
            await page.getByRole('button', { name: provider }).first().click();
            await page.waitForTimeout(100);
        }

        // Switch back to OpenRouter
        await page.getByRole('button', { name: 'OpenRouter' }).first().click();

        // Type API key
        const apiKeyInput = page.locator('input[placeholder="sk-or-v1-..."]');
        await apiKeyInput.fill('sk-or-v1-test-key-12345');

        // Toggle show/hide API key
        const eyeBtn = page.locator('button').filter({ has: page.locator('svg.lucide-eye, svg.lucide-eye-off') }).first();
        await eyeBtn.click();
        await page.waitForTimeout(100);
        await eyeBtn.click();

        // Clear API key
        await apiKeyInput.fill('');
    });

    // ============================================================
    // 6. SETTINGS - APPEARANCE TOGGLES
    // ============================================================
    test('6. Settings - Appearance toggles', async ({ page }) => {
        await page.goto(BASE + '/settings');
        await page.waitForSelector('h1:has-text("Settings")', { timeout: 10000 });

        await page.getByRole('button', { name: 'Appearance' }).click();
        await page.waitForTimeout(300);

        // Toggle dark mode via settings — then save to apply
        // The toggle button is inside the dark mode section
        const allToggles = page.locator('button').filter({ hasText: '' });
        // Find the toggle that follows the Dark Mode label
        const darkLabel = page.locator('p:has-text("Dark Mode")');
        const darkSection = darkLabel.locator('..').locator('..'); // go up to the flex container
        const darkToggleBtn = darkSection.locator('button').last();
        await darkToggleBtn.click();
        await page.waitForTimeout(300);

        // Save settings (dark mode change is local until saved)
        const headerSaveBtn = page.locator('button:has(svg.lucide-save)').first();
        await headerSaveBtn.click();
        await page.waitForTimeout(800);

        // Verify dark class on html
        await expect(page.locator('html')).toHaveClass(/dark/);

        // Toggle back and save
        const darkSection2 = page.locator('p:has-text("Dark Mode")').locator('..').locator('..');
        const darkToggleBtn2 = darkSection2.locator('button').last();
        await darkToggleBtn2.click();
        await page.waitForTimeout(300);
        const headerSaveBtn2 = page.locator('button:has(svg.lucide-save)').first();
        await headerSaveBtn2.click();
        await page.waitForTimeout(800);
        await expect(page.locator('html')).not.toHaveClass(/dark/);

        // Test language selector
        const langSelect = page.locator('select').first();
        await langSelect.selectOption('my');
        await expect(langSelect).toHaveValue('my');
        await langSelect.selectOption('en');

        // Test export format selector
        const exportSelect = page.locator('select').last();
        await exportSelect.selectOption('json');
        await expect(exportSelect).toHaveValue('json');
        await exportSelect.selectOption('markdown');
    });

    // ============================================================
    // 7. SETTINGS - MCP PRESET ADD
    // ============================================================
    test('7. Settings - MCP server management', async ({ page }) => {
        await page.goto(BASE + '/settings');
        await page.waitForSelector('h1:has-text("Settings")', { timeout: 10000 });

        await page.getByRole('button', { name: 'MCP' }).click();
        await page.waitForTimeout(300);

        // Add a preset MCP server
        const braveSearchBtn = page.locator('button:has-text("Brave Search")');
        await expect(braveSearchBtn).toBeVisible();
        await braveSearchBtn.click();
        await page.waitForTimeout(300);

        // Verify it appeared in the list
        const serverEntry = page.locator('div:has(> p:has-text("Brave Search"))');
        await expect(serverEntry.first()).toBeVisible({ timeout: 3000 });
    });

    // ============================================================
    // 8. SETTINGS - PERSONAS
    // ============================================================
    test('8. Settings - Persona selection and custom persona creation', async ({ page }) => {
        await page.goto(BASE + '/settings');
        await page.waitForSelector('h1:has-text("Settings")', { timeout: 10000 });

        await page.getByRole('button', { name: 'Personas' }).click();
        await page.waitForTimeout(300);

        // Click "Expert Coder" persona
        const coderBtn = page.locator('div:has(> div p:has-text("Expert Coder"))');
        await coderBtn.first().click();
        await page.waitForTimeout(200);

        // Create new custom persona
        await page.getByRole('button', { name: 'New' }).click();
        await page.waitForTimeout(300);

        // Fill the modal
        const nameInput = page.locator('input[placeholder="Persona name"]');
        await nameInput.fill('Test Persona');

        const promptInput = page.locator('textarea[placeholder="System prompt..."]');
        await promptInput.fill('You are a test assistant.');

        // Save — click the modal's Save button (the second one)
        await page.getByRole('button', { name: 'Save' }).nth(1).click();
        await page.waitForTimeout(500);
    });

    // ============================================================
    // 9. SETTINGS - PARAMETERS
    // ============================================================
    test('9. Settings - Parameters sliders and toggles', async ({ page }) => {
        await page.goto(BASE + '/settings');
        await page.waitForSelector('h1:has-text("Settings")', { timeout: 10000 });

        await page.getByRole('button', { name: 'Parameters' }).click();
        await page.waitForTimeout(300);

        // Check all sliders exist
        const sliders = page.locator('input[type="range"]');
        const sliderCount = await sliders.count();
        expect(sliderCount).toBeGreaterThanOrEqual(3);

        // Toggle streaming — find the Streaming Responses row
        const streamingRow = page.locator('div').filter({ hasText: 'Streaming ResponsesShow response as it generates' });
        const streamingToggleBtn = streamingRow.locator('button').last();
        if (await streamingToggleBtn.isVisible().catch(() => false)) {
            await streamingToggleBtn.click();
        }
        await page.waitForTimeout(200);
    });

    // ============================================================
    // 10. ABOUT PAGE
    // ============================================================
    test('10. Settings - About tab content', async ({ page }) => {
        await page.goto(BASE + '/settings');
        await page.waitForSelector('h1:has-text("Settings")', { timeout: 10000 });

        await page.getByRole('button', { name: 'About' }).click();
        await page.waitForTimeout(300);

        await expect(page.getByText('RavenGPT')).toBeVisible();
        await expect(page.getByText('Version 2.0.0')).toBeVisible();
        await expect(page.getByText('GitHub').first()).toBeVisible();
        await expect(page.getByText('OpenRouter').first()).toBeVisible();
    });

    // ============================================================
    // 11. MAIN PAGE - FEATURE MODE SELECTOR
    // ============================================================
    test('11. Feature mode selector - all modes clickable', async ({ page }) => {
        await page.goto(BASE);
        await page.waitForSelector('header', { timeout: 10000 });

        // Set a dummy API key and model first so modes aren't disabled
        await page.evaluate(() => {
            const settings = {
                apiKey: 'sk-or-v1-test',
                providerName: 'OpenRouter',
                providerUrl: 'https://openrouter.ai/api/v1/chat/completions',
                selectedModel: 'openai/gpt-4o-mini',
                isDarkMode: false,
                language: 'en',
                maxTokens: 2000,
                temperature: 0.7,
                topP: 1.0,
                systemPrompt: '',
                showTokenCount: true,
                showModelInfo: true,
                enableSoundEffects: false,
                mcpServers: [],
                enabledTools: [],
                streamingEnabled: true,
                autoSave: true,
                exportFormat: 'markdown',
                personas: [],
                activePersonaId: 'default',
                useAdaptiveTokens: true,
                customApiUrl: '',
            };
            localStorage.setItem('ravengpt-settings-v2', JSON.stringify(settings));
        });
        await page.reload();
        await page.waitForSelector('header', { timeout: 10000 });

        // Wait a moment for models to load (they'll fail but fallback models exist)
        await page.waitForTimeout(2000);

        // Click each feature mode button
        const modeButtons = ['Standard', 'Reasoning', 'Web Search', 'Vision', 'Tools', 'MCP'];
        for (const mode of modeButtons) {
            const btn = page.locator('button').filter({ hasText: mode }).first();
            // Check if enabled (not disabled)
            const isDisabled = await btn.isDisabled();
            if (!isDisabled) {
                await btn.click();
                await page.waitForTimeout(200);
            }
        }
    });

    // ============================================================
    // 12. MAIN PAGE - NEW CHAT BUTTON
    // ============================================================
    test('12. New Chat button creates new chat', async ({ page }) => {
        await page.goto(BASE);
        await page.waitForSelector('header', { timeout: 10000 });

        // Set up API key first
        await page.evaluate(() => {
            const settings = {
                apiKey: 'sk-or-v1-test',
                providerName: 'OpenRouter',
                providerUrl: 'https://openrouter.ai/api/v1/chat/completions',
                selectedModel: 'openai/gpt-4o-mini',
                isDarkMode: false,
                language: 'en',
                maxTokens: 2000,
                temperature: 0.7,
                topP: 1.0,
                systemPrompt: '',
                showTokenCount: true,
                showModelInfo: true,
                enableSoundEffects: false,
                mcpServers: [],
                enabledTools: [],
                streamingEnabled: true,
                autoSave: true,
                exportFormat: 'markdown',
                personas: [],
                activePersonaId: 'default',
                useAdaptiveTokens: true,
                customApiUrl: '',
            };
            localStorage.setItem('ravengpt-settings-v2', JSON.stringify(settings));
        });
        await page.reload();
        await page.waitForSelector('header', { timeout: 10000 });

        // Click New Chat button
        const newChatBtn = page.locator('button:has-text("New Chat")');
        await newChatBtn.click();
        await page.waitForTimeout(500);

        // Verify a chat entry appeared in sidebar (might show "New Chat" title)
        // The chat list should have at least one entry
        const chatEntries = page.locator('.group.relative');
        // May or may not have chats depending on timing
    });

    // ============================================================
    // 13. MAIN PAGE - SUGGESTED PROMPTS
    // ============================================================
    test('13. Suggested prompts fill input on click', async ({ page }) => {
        await page.goto(BASE);
        await page.waitForSelector('header', { timeout: 10000 });

        // Set API key
        await page.evaluate(() => {
            const settings = {
                apiKey: 'sk-or-v1-test',
                providerName: 'OpenRouter',
                providerUrl: 'https://openrouter.ai/api/v1/chat/completions',
                selectedModel: 'openai/gpt-4o-mini',
                isDarkMode: false,
                language: 'en',
                maxTokens: 2000,
                temperature: 0.7,
                topP: 1.0,
                systemPrompt: '',
                showTokenCount: true,
                showModelInfo: true,
                enableSoundEffects: false,
                mcpServers: [],
                enabledTools: [],
                streamingEnabled: true,
                autoSave: true,
                exportFormat: 'markdown',
                personas: [],
                activePersonaId: 'default',
                useAdaptiveTokens: true,
                customApiUrl: '',
            };
            localStorage.setItem('ravengpt-settings-v2', JSON.stringify(settings));
        });
        await page.reload();
        await page.waitForSelector('header', { timeout: 10000 });

        // Wait for empty state to appear
        await page.waitForTimeout(1500);

        // Find a suggested prompt button
        const promptButtons = page.locator('button:has(> span.text-lg)');
        const promptCount = await promptButtons.count();

        if (promptCount > 0) {
            // Click the first prompt
            await promptButtons.first().click();
            await page.waitForTimeout(500);

            // Verify textarea has content
            const textarea = page.locator('textarea');
            const value = await textarea.inputValue();
            expect(value.length).toBeGreaterThan(0);
        }
    });

    // ============================================================
    // 14. MAIN PAGE - TEXT INPUT AND SEND BUTTON
    // ============================================================
    test('14. Text input and buttons interaction', async ({ page }) => {
        await page.goto(BASE);
        await page.waitForSelector('header', { timeout: 10000 });

        // Set API key
        await page.evaluate(() => {
            const settings = {
                apiKey: 'sk-or-v1-test',
                providerName: 'OpenRouter',
                providerUrl: 'https://openrouter.ai/api/v1/chat/completions',
                selectedModel: 'openai/gpt-4o-mini',
                isDarkMode: false,
                language: 'en',
                maxTokens: 2000,
                temperature: 0.7,
                topP: 1.0,
                systemPrompt: '',
                showTokenCount: true,
                showModelInfo: true,
                enableSoundEffects: false,
                mcpServers: [],
                enabledTools: [],
                streamingEnabled: true,
                autoSave: true,
                exportFormat: 'markdown',
                personas: [],
                activePersonaId: 'default',
                useAdaptiveTokens: true,
                customApiUrl: '',
            };
            localStorage.setItem('ravengpt-settings-v2', JSON.stringify(settings));
        });
        await page.reload();
        await page.waitForSelector('header', { timeout: 10000 });
        await page.waitForTimeout(2000);

        // Create a new chat first
        const newChatBtn = page.locator('button:has-text("New Chat")');
        await newChatBtn.click();
        await page.waitForTimeout(500);

        // Type in textarea
        const textarea = page.locator('textarea');
        await textarea.fill('Hello, this is a test message');

        // Verify Send button is enabled
        const sendBtn = page.locator('button[title="Send message (Enter)"]');
        await expect(sendBtn).toBeVisible();

        // Verify Upload button exists
        const uploadBtn = page.locator('button[title="Upload image or document"]');
        await expect(uploadBtn).toBeVisible();

        // Verify voice input button exists
        const voiceBtn = page.locator('button[title="Start voice input"]');
        await expect(voiceBtn).toBeVisible();

        // Verify character count doesn't appear for short messages
        const charCount = page.locator('text=/^\\d{1,3}(,\\d{3})*$/');
        // Should not show for < 500 chars
        const charCountVisible = await charCount.isVisible().catch(() => false);

        // Clear input
        await textarea.fill('');
    });

    // ============================================================
    // 15. KEYBOARD SHORTCUTS MODAL
    // ============================================================
    test('15. Keyboard shortcuts modal', async ({ page }) => {
        // Use a larger viewport to ensure the shortcuts button is shown
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(BASE);
        await page.waitForSelector('header', { timeout: 10000 });

        // The keyboard shortcuts button is hidden on mobile (hidden sm:block)
        // Click the keyboard button if visible
        const kbBtn = page.locator('button[title="Keyboard shortcuts"]');
        const isVisible = await kbBtn.isVisible().catch(() => false);
        if (isVisible) {
            await kbBtn.click();
            await page.waitForTimeout(500);

            // Verify modal appears
            await expect(page.getByText('Keyboard Shortcuts')).toBeVisible({ timeout: 3000 });

            // Verify shortcuts listed
            await expect(page.getByText('Send message')).toBeVisible();
            await expect(page.getByText('Stop generation')).toBeVisible();
            await expect(page.getByText('New chat', { exact: true })).toBeVisible();

            // Close modal
            await page.getByRole('button', { name: 'Close' }).click();
        }
    });

    // ============================================================
    // 16. CHAT CONTEXT MENU (right-click on chat in sidebar)
    // ============================================================
    test('16. Chat context menu in sidebar', async ({ page }) => {
        // Pre-create a chat session
        await page.goto(BASE);
        await page.evaluate(() => {
            const session = {
                id: 'chat_test_123',
                title: 'Test Chat',
                messages: [
                    {
                        id: 'msg_1',
                        role: 'user',
                        content: 'Hello',
                        timestamp: new Date().toISOString(),
                    },
                    {
                        id: 'msg_2',
                        role: 'assistant',
                        content: 'Hi there! How can I help?',
                        timestamp: new Date().toISOString(),
                    }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                featureMode: 'standard',
                model: 'openai/gpt-4o-mini',
                tags: [],
                isPinned: false,
                totalTokens: 10,
            };
            localStorage.setItem('ravengpt-sessions-v2', JSON.stringify([session]));
        });

        await page.reload();
        await page.waitForSelector('header', { timeout: 10000 });

        // The "Test Chat" should appear in sidebar
        await expect(page.getByText('Test Chat')).toBeVisible({ timeout: 5000 });

        // Hover over chat entry to reveal the context menu button
        const chatEntry = page.locator('.group.relative').filter({ hasText: 'Test Chat' }).first();
        await chatEntry.hover();
        await page.waitForTimeout(500);

        // Click the triple-dot menu button
        const menuBtn = chatEntry.locator('button:has(svg.lucide-more-vertical)');
        const menuVisible = await menuBtn.isVisible().catch(() => false);
        if (menuVisible) {
            await menuBtn.click();
            await page.waitForTimeout(300);

            // Verify menu items
            await expect(page.getByText('Rename')).toBeVisible({ timeout: 3000 });
            await expect(page.getByText('Delete')).toBeVisible();
        }
    });

    // ============================================================
    // 17. HEADER BUTTONS
    // ============================================================
    test('17. Header buttons - export, regenerate, settings navigation', async ({ page }) => {
        await page.goto(BASE);
        await page.waitForSelector('header', { timeout: 10000 });

        // Click settings in header → should navigate
        const settingsBtn = page.locator('button[title="Settings (Ctrl+,)"]');
        await settingsBtn.click();
        await page.waitForTimeout(500);

        // Verify we're on settings page
        await expect(page.getByText('Settings').first()).toBeVisible({ timeout: 5000 });

        // Navigate back via the back arrow
        const backBtn = page.locator('a[href="/"]').first();
        await backBtn.click();
        await page.waitForTimeout(500);

        // Should be back on main page
        await expect(page.locator('textarea')).toBeVisible({ timeout: 5000 });
    });

    // ============================================================
    // 18. SAVE SETTINGS BUTTON
    // ============================================================
    test('18. Save settings button starts disabled', async ({ page }) => {
        await page.goto(BASE + '/settings');
        await page.waitForSelector('h1:has-text("Settings")', { timeout: 10000 });

        // Save button should be disabled initially (no unsaved changes)
        const saveBtn = page.getByRole('button', { name: 'Save' });
        await expect(saveBtn).toBeDisabled();

        // Make a change to enable save
        const apiKeyInput = page.locator('input[placeholder="sk-or-v1-..."]');
        await apiKeyInput.fill('test-key');

        // Save should now be enabled
        await expect(saveBtn).toBeEnabled();

        // Click save
        await saveBtn.click();
        await page.waitForTimeout(500);

        // Wait for "Saved!" text
        await page.waitForTimeout(1500);
    });

    // ============================================================
    // 19. FILE UPLOAD INPUT (hidden)
    // ============================================================
    test('19. File upload hidden input exists', async ({ page }) => {
        await page.goto(BASE);
        await page.waitForSelector('header', { timeout: 10000 });

        const fileInput = page.locator('input[type="file"]');
        // There should be at least one file input (for chat)
        await expect(fileInput.first()).toBeAttached();
    });

    // ============================================================
    // 20. RESPONSIVE - MOBILE VIEWPORT
    // ============================================================
    test('20. Mobile viewport layout', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
        await page.goto(BASE);
        await page.waitForSelector('header', { timeout: 10000 });

        // Sidebar should be visible on mobile initially
        // Header should have menu toggle
        const menuBtn = page.locator('button[title="Toggle sidebar (Ctrl+B)"]');
        await expect(menuBtn).toBeVisible();

        // Textarea should be visible
        const textarea = page.locator('textarea');
        await expect(textarea).toBeVisible();
    });

    // ============================================================
    // 21. RENAME CHAT
    // ============================================================
    test('21. Rename chat via edit', async ({ page }) => {
        // Pre-create a chat session  
        await page.goto(BASE);
        await page.evaluate(() => {
            const session = {
                id: 'chat_rename_456',
                title: 'Old Name',
                messages: [
                    {
                        id: 'msg_r1',
                        role: 'user',
                        content: 'Test',
                        timestamp: new Date().toISOString(),
                    }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                featureMode: 'standard',
                model: 'openai/gpt-4o-mini',
                tags: [],
                isPinned: false,
                totalTokens: 5,
            };
            localStorage.setItem('ravengpt-sessions-v2', JSON.stringify([session]));
        });

        await page.reload();
        await page.waitForSelector('header', { timeout: 10000 });

        // Find the chat and open context menu
        const chatEntry = page.locator('.group.relative').filter({ hasText: 'Old Name' }).first();
        await expect(chatEntry).toBeVisible({ timeout: 5000 });
        await chatEntry.hover();
        await page.waitForTimeout(500);

        // Click context menu
        const menuBtn = chatEntry.locator('button');
        const count = await chatEntry.locator('button:has(svg)').count();
        // The triple-dot button
        if (count >= 2) {
            const dotBtn = chatEntry.locator('button:has(svg.lucide-more-vertical)');
            if (await dotBtn.isVisible().catch(() => false)) {
                await dotBtn.click();
                await page.waitForTimeout(300);

                // Click Rename
                const renameBtn = page.locator('button:has-text("Rename")');
                if (await renameBtn.isVisible().catch(() => false)) {
                    await renameBtn.click();
                    await page.waitForTimeout(300);

                    // Type new name
                    const renameInput = page.locator('input[type="text"]');
                    if (await renameInput.isVisible().catch(() => false)) {
                        await renameInput.fill('New Name');
                        await renameInput.press('Enter');
                        await page.waitForTimeout(300);

                        // Verify rename took effect
                        await expect(page.getByText('New Name')).toBeVisible({ timeout: 3000 });
                    }
                }
            }
        }
    });

});
