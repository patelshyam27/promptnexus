import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000/api';
let promptId = '';
let userId = '';

async function verify() {
    console.log('--- Starting Verification ---');

    // 1. Login to get user ID
    console.log('Logging in...');
    const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'shyam_27', password: 'password123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) {
        console.log('Login failed, trying to register...');
        const regRes = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'shyam_27_test', password: 'password123', displayName: 'Shyam Test' })
        });
        const regData = await regRes.json();
        if (!regData.success) {
            // Maybe user exists but password wrong? Try unique user
            console.log('Register failed, trying unique user...');
            const uniqueUser = 'user_' + Date.now();
            const regRes2 = await fetch(`${BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: uniqueUser, password: 'password123', displayName: 'Test User' })
            });
            const regData2 = await regRes2.json();
            if (!regData2.success) {
                console.error('Registration failed final', regData2);
                return;
            }
            userId = regData2.user.id;
        } else {
            userId = regData.user.id;
        }
    } else {
        userId = loginData.user.id;
    }
    console.log('User ID obtained:', userId);

    // 2. Create a prompt (if needed, or just get one)
    console.log('Getting prompts...');
    const getRes = await fetch(`${BASE_URL}/prompts?userId=${userId}`);
    const prompts = await getRes.json();
    if (prompts.length > 0) {
        promptId = prompts[0].id;
        console.log('Using existing prompt:', promptId);
        console.log('Initial isFavorited:', prompts[0].isFavorited);
    } else {
        console.log('Creating prompt...');
        const createRes = await fetch(`${BASE_URL}/prompts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Test Prompt for Fav',
                content: 'Content',
                model: 'Gemini',
                tags: ['test'],
                authorId: userId
            })
        });
        const createData = await createRes.json();
        promptId = createData.prompt.id;
        console.log('Created prompt:', promptId);
    }

    // 3. Toggle Favorite (ON)
    console.log('Toggling Favorite ON...');
    const favRes1 = await fetch(`${BASE_URL}/prompts/${promptId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });
    const favData1 = await favRes1.json();
    console.log('Favorite ON:', favData1.favorited);

    // 4. Verify in List
    const checkRes = await fetch(`${BASE_URL}/prompts?userId=${userId}`);
    const checkPrompts = await checkRes.json();
    const checkedPrompt = checkPrompts.find((p: any) => p.id === promptId);
    console.log('Verify isFavorited is TRUE:', checkedPrompt.isFavorited);

    // 5. Toggle Favorite (OFF)
    console.log('Toggling Favorite OFF...');
    const favRes2 = await fetch(`${BASE_URL}/prompts/${promptId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });
    const favData2 = await favRes2.json();
    console.log('Favorite OFF:', favData2.favorited);

    // 6. Check Feedback Date Format
    console.log('Checking Feedback...');
    const fbRes = await fetch(`${BASE_URL}/feedback`);
    const feedback = await fbRes.json();
    if (feedback.length > 0) {
        console.log('Feedback CreatedAt Type:', typeof feedback[0].createdAt);
        console.log('Feedback CreatedAt Value:', feedback[0].createdAt);
    } else {
        console.log('No feedback to check, adding one...');
        await fetch(`${BASE_URL}/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: 'verifier', message: 'Test msg' })
        });
        const fbRes2 = await fetch(`${BASE_URL}/feedback`);
        const feedback2 = await fbRes2.json();
        console.log('Feedback CreatedAt Type:', typeof feedback2[0].createdAt);
        console.log('Feedback CreatedAt Value:', feedback2[0].createdAt);
    }

    console.log('--- Verification Complete ---');
}

verify();
