import fetch from 'node-fetch';

const BASE_URL = 'https://promptnexus-1rqws8it8-patel-shyyams-projects.vercel.app/api';
// Using the same logic as verify_favorites.ts but targeting PROD

async function verifyProd() {
    console.log('--- Starting PROD Verification ---');
    console.log('Targeting:', BASE_URL);

    try {
        // 1. Check Health/Feedback first (public-ish)
        console.log('Checking Feedback Endpoint...');
        const fbRes = await fetch(`${BASE_URL}/feedback`);
        if (fbRes.ok) {
            const text = await fbRes.text();
            try {
                const feedback = JSON.parse(text);
                console.log('Feedback API OK. Count:', feedback.length);
                if (feedback.length > 0) {
                    console.log('Feedback[0] createdAt type:', typeof feedback[0].createdAt);
                }
            } catch (e) {
                console.error('API returned non-JSON:', text.substring(0, 500)); // Print first 500 chars
            }
        } else {
            console.error('Feedback API Failed:', fbRes.status, await fbRes.text());
        }

        // 2. Login
        console.log('Attempting Login...');
        // Note: We need a user that exists in PROD. 
        // If the DB is shared (Supabase), the user 'shyam_27' from local testing might exist if created there.
        // If not, we try to register a random test user.
        const uniqueName = 'prod_test_' + Math.floor(Math.random() * 1000);

        let userId = '';
        let promptId = '';

        const regRes = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: uniqueName, password: 'password123', displayName: 'Prod Test' })
        });
        const regData = await regRes.json();

        if (regData.success) {
            userId = regData.user.id;
            console.log('Registered Prod User:', userId);
        } else {
            console.log('Registration failed (might exist), trying login...');
            // Try a known fallback or basic login if possible, but random creates are safer for prod verification without credentials.
            console.error('Cannot proceed with Auth verification without valid credentials.');
            // Skip to public prompt check
        }

        if (userId) {
            // 3. Create Prompt
            console.log('Creating Prompt...');
            const createRes = await fetch(`${BASE_URL}/prompts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Prod Fav Test',
                    content: 'Testing favorites in production',
                    model: 'Gemini',
                    tags: ['prod-test'],
                    authorId: userId
                })
            });
            const createData = await createRes.json();
            if (createData.success) {
                promptId = createData.prompt.id;
                console.log('Created Prompt:', promptId);

                // 4. Toggle Favorite
                console.log('Toggling Favorite...');
                const favRes = await fetch(`${BASE_URL}/prompts/${promptId}/favorite`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                });
                if (favRes.status === 404) {
                    console.error('ERROR: Favorite Endpoint 404 - API NOT UPDATED?');
                } else {
                    const favData = await favRes.json();
                    console.log('Favorite Response:', favData);
                }
            }
        }

    } catch (e) {
        console.error('Verification Error:', e);
    }
}

verifyProd();
