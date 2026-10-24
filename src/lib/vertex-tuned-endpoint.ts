/** Resolve a Vertex tuned Model Registry resource to its inference endpoint. */
export async function resolveVertexTunedEndpoint(resource: string, accessToken: string): Promise<string> {
    const value = resource.trim();
    const match = value.match(/^projects\/([^/]+)\/locations\/([^/]+)\/(endpoints|models)\/([^/]+)$/);
    if (!match) {
        throw new Error('Enter a Vertex AI endpoint or tuned model resource in projects/.../locations/... format.');
    }
    if (match[3] === 'endpoints') return value;

    const parent = `projects/${match[1]}/locations/${match[2]}`;
    let pageToken = '';
    do {
        const url = new URL(`https://${match[2]}-aiplatform.googleapis.com/v1/${parent}/tuningJobs`);
        url.searchParams.set('pageSize', '100');
        if (pageToken) url.searchParams.set('pageToken', pageToken);
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: 'no-store',
        });
        if (!response.ok) {
            throw new Error(`Could not look up the tuned model endpoint (Vertex AI ${response.status}). Check tuning job access or enter its endpoint resource directly.`);
        }
        const data: {
            tuningJobs?: Array<{ tunedModel?: { model?: string; endpoint?: string } }>;
            nextPageToken?: string;
        } = await response.json();
        const job = data.tuningJobs?.find(({ tunedModel }) => tunedModel?.model === value);
        if (job) {
            if (job.tunedModel?.endpoint) return job.tunedModel.endpoint;
            throw new Error('This tuned model has no inference endpoint yet. Check that its tuning job has completed.');
        }
        pageToken = data.nextPageToken || '';
    } while (pageToken);

    throw new Error('No tuning job was found for this model resource. Copy its endpoint from the Vertex AI tuning job details.');
}
