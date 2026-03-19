document.addEventListener('DOMContentLoaded', () => {
    const jwtInput = document.getElementById('jwtToken');
    const optimizeBtn = document.getElementById('optimizeBtn');
    const statusDiv = document.getElementById('status');
    const resultBox = document.getElementById('resultBox');
    const matchScore = document.getElementById('matchScore');

    // Load saved JWT on mount
    chrome.storage.local.get(['altresume_jwt'], (res) => {
        if(res.altresume_jwt) jwtInput.value = res.altresume_jwt;
    });

    // Injected scraping function that executes inside the DOM context
    function scrapeLinkedInJD() {
        const primary = document.querySelector('.jobs-description-content__text');
        if (primary && primary.innerText) return primary.innerText.trim();
        
        // Fallback for differing LinkedIn A/B layouts
        const fallback = document.querySelector('article');
        return fallback ? fallback.innerText.trim() : null;
    }

    optimizeBtn.addEventListener('click', async () => {
        const jwt = jwtInput.value.trim();
        if(!jwt) {
            statusDiv.innerHTML = '<span class="error">Please provide your JWT Token!</span>';
            return;
        }
        
        // Save JWT for future clicks
        chrome.storage.local.set({ altresume_jwt: jwt });

        statusDiv.innerHTML = 'Scraping LinkedIn Job Description...';
        optimizeBtn.disabled = true;
        resultBox.style.display = 'none';

        // Grab the current active Tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes("linkedin.com/jobs")) {
            statusDiv.innerHTML = '<span class="error">Please navigate to a LinkedIn Job posting.</span>';
            optimizeBtn.disabled = false;
            return;
        }

        try {
            // Trigger script injection
            const injections = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: scrapeLinkedInJD,
            });
            
            const jdText = injections[0]?.result;
            
            if(!jdText || jdText.length < 50) {
                statusDiv.innerHTML = '<span class="error">Failed to extract Job Description. Please fully open the job details.</span>';
                optimizeBtn.disabled = false;
                return;
            }

            statusDiv.innerHTML = 'Sending to AltResume AI Engine...';
            
            // Dispatch strictly to our local API (falling back to user's most recent uploaded resume gracefully)
            const response = await fetch('http://localhost:8000/api/optimize/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`
                },
                body: JSON.stringify({ job_description: jdText })
            });

            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error || 'Failed to trigger optimization');
            
            const taskId = data.task_id;
            statusDiv.innerHTML = `AI Engine working...`;

            // Setup polling loop equivalent to Next.js dashboard
            let attempts = 0;
            const poll = setInterval(async () => {
                attempts++;
                if (attempts > 30) { // 60s timeout roughly
                    clearInterval(poll);
                    statusDiv.innerHTML = `<span class="error">Timeout waiting for AI response.</span>`;
                    optimizeBtn.disabled = false;
                    return;
                }
                
                try {
                    const statusRes = await fetch(`http://localhost:8000/api/optimize/status/${taskId}/`, {
                        headers: { 'Authorization': `Bearer ${jwt}` }
                    });
                    const statusData = await statusRes.json();

                    if(statusData.status === 'completed') {
                        clearInterval(poll);
                        statusDiv.innerHTML = '<span class="success">Optimization Complete!</span>';
                        matchScore.innerText = `${statusData.match_score}%`;
                        resultBox.style.display = 'block';
                        optimizeBtn.disabled = false;
                    } else if (statusData.status === 'failed') {
                        clearInterval(poll);
                        statusDiv.innerHTML = `<span class="error">Error: ${statusData.error}</span>`;
                        optimizeBtn.disabled = false;
                    }
                } catch(e) {
                    clearInterval(poll);
                    statusDiv.innerHTML = `<span class="error">Connection Error during polling.</span>`;
                    optimizeBtn.disabled = false;
                }
            }, 2000);

        } catch (err) {
            statusDiv.innerHTML = `<span class="error">${err.message}</span>`;
            optimizeBtn.disabled = false;
        }
    });
});
