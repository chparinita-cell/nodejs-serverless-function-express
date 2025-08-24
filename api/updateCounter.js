export default async function handler(request, response) {
  // Allow requests from any origin (for simplicity)
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const GITHUB_TOKEN = process.env.GIST_PAT;
  const GIST_ID = process.env.GIST_ID;
  const GIST_FILENAME = 'form_counter.txt';

  if (!GITHUB_TOKEN || !GIST_ID) {
    return response.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    // 1. Fetch the current count from the Gist
    const gistGetResponse = await fetch(`https://api.github.com/gists/${GIST_ID}`);
    if (!gistGetResponse.ok) throw new Error('Failed to fetch Gist.');
    const gistGetData = await gistGetResponse.json();
    const currentCount = parseInt(gistGetData.files[GIST_FILENAME].content, 10);

    // 2. Increment the count
    const newCount = currentCount + 1;

    // 3. Update the Gist with the new count
    const gistPatchResponse = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content: newCount.toString(),
          },
        },
      }),
    });

    if (!gistPatchResponse.ok) throw new Error('Failed to update Gist.');

    return response.status(200).json({ message: 'Count updated successfully!', newCount });

  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }
}
