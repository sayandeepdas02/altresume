document.addEventListener('DOMContentLoaded', () => {
    const jwtInput = document.getElementById('jwtToken');
    const optimizeBtn = document.getElementById('optimizeBtn');
    const fillBtn = document.getElementById('fillBtn');
    const statusDiv = document.getElementById('status');
    const resultBox = document.getElementById('resultBox');
    const matchScore = document.getElementById('matchScore');

    // Load saved JWT on mount
    chrome.storage.local.get(['altresume_jwt'], (res) => {
        if(res.altresume_jwt) jwtInput.value = res.altresume_jwt;
    });

    const getJwt = () => {
        const jwt = jwtInput.value.trim();
        if(!jwt) {
            statusDiv.innerHTML = '<span class="error">Please provide your JWT Token!</span>';
            return null;
        }
        chrome.storage.local.set({ altresume_jwt: jwt });
        return jwt;
    };

    // -------------------------------------------------------------
    // FEATURE 1: JD Optimization
    // -------------------------------------------------------------
    function scrapeLinkedInJD() {
        const primary = document.querySelector('.jobs-description-content__text');
        if (primary && primary.innerText) return primary.innerText.trim();
        const fallback = document.querySelector('article');
        return fallback ? fallback.innerText.trim() : null;
    }

    optimizeBtn.addEventListener('click', async () => {
        const jwt = getJwt();
        if(!jwt) return;

        statusDiv.innerHTML = 'Scraping LinkedIn Job Description...';
        optimizeBtn.disabled = true;
        fillBtn.disabled = true;
        resultBox.style.display = 'none';

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes("linkedin.com/jobs")) {
                throw new Error("Please navigate to a LinkedIn Job posting.");
            }

            const injections = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: scrapeLinkedInJD,
            });
            
            const jdText = injections[0]?.result;
            
            if(!jdText || jdText.length < 50) {
                throw new Error("Failed to extract Job Description. Please fully open the job details.");
            }

            statusDiv.innerHTML = 'Sending to AltResume AI Engine...';
            
            const response = await fetch('http://localhost:8000/api/career/extension/optimize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`
                },
                body: JSON.stringify({ job_description: jdText })
            });

            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error || 'Failed to trigger optimization');
            
            statusDiv.innerHTML = '<span class="success">Optimization Complete!</span>';
            matchScore.innerText = `${data.match_score}%`;
            resultBox.style.display = 'block';

        } catch (err) {
            statusDiv.innerHTML = `<span class="error">${err.message}</span>`;
        } finally {
            optimizeBtn.disabled = false;
            fillBtn.disabled = false;
        }
    });

    // -------------------------------------------------------------
    // FEATURE 2: Auto-Fill Form
    // -------------------------------------------------------------
    function scrapeFormFields() {
        const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'));
        
        return inputs.map(input => {
            let label = '';
            // Try to find explicit label
            if (input.id) {
                const labelEl = document.querySelector(`label[for="${input.id}"]`);
                if (labelEl) label = labelEl.innerText.trim();
            }
            // Try to find parent label
            if (!label) {
                const parentLabel = input.closest('label');
                if (parentLabel) label = parentLabel.innerText.trim();
            }
            // Try aria-label
            if (!label) label = input.getAttribute('aria-label') || '';
            // Try placeholder
            if (!label) label = input.getAttribute('placeholder') || '';
            // Try name
            if (!label) label = input.getAttribute('name') || '';

            // Extract options for selects
            let options = [];
            if (input.tagName.toLowerCase() === 'select') {
                options = Array.from(input.querySelectorAll('option')).map(o => o.value).filter(v => v);
            }

            return {
                id: input.id || input.name || Math.random().toString(36).substr(2, 9),
                tag: input.tagName.toLowerCase(),
                type: input.type || 'text',
                name: input.name || '',
                label: label.replace(/\n/g, ' ').trim(),
                options: options
            };
        }).filter(f => f.label && f.type !== 'file'); // Ignore file uploads and inputs with absolutely no clue
    }

    function injectFormAnswers(answersMap) {
        let injectedCount = 0;
        const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select'));
        
        inputs.forEach(input => {
            const id = input.id || input.name;
            const answer = answersMap[id];
            
            if (answer !== undefined && answer !== "") {
                if (input.type === 'radio' || input.type === 'checkbox') {
                    // Match value
                    if (input.value === answer || answer === "Yes") {
                        input.checked = true;
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                        injectedCount++;
                    }
                } else {
                    input.value = answer;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    injectedCount++;
                }
            }
        });
        return injectedCount;
    }

    fillBtn.addEventListener('click', async () => {
        const jwt = getJwt();
        if(!jwt) return;

        statusDiv.innerHTML = 'Analyzing Form...';
        optimizeBtn.disabled = true;
        fillBtn.disabled = true;
        resultBox.style.display = 'none';

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // 1. Scrape form structure
            const injections = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: scrapeFormFields,
            });
            
            const formFields = injections[0]?.result;

            if(!formFields || formFields.length === 0) {
                throw new Error("No fillable form fields detected on this page.");
            }

            statusDiv.innerHTML = `Found ${formFields.length} fields. Generating answers...`;

            // Extract basic contextual info from page
            const domContext = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => ({ title: document.title, url: window.location.href })
            });

            // 2. Call backend for answers
            const response = await fetch('http://localhost:8000/api/career/extension/assist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`
                },
                body: JSON.stringify({ 
                    form_fields: formFields,
                    company: domContext[0]?.result.title,
                    role: "Job Application"
                })
            });

            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error || 'Failed to auto-fill form');

            statusDiv.innerHTML = 'Pasting answers into form...';
            
            // 3. Inject answers back into DOM
            const injectRes = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: injectFormAnswers,
                args: [data.answers]
            });

            const count = injectRes[0]?.result;
            statusDiv.innerHTML = `<span class="success">Filled ${count} fields seamlessly!</span>`;

        } catch (err) {
            statusDiv.innerHTML = `<span class="error">${err.message}</span>`;
        } finally {
            optimizeBtn.disabled = false;
            fillBtn.disabled = false;
        }
    });
});
