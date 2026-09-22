const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function getMeta() {
  try {
    const res = await fetch(`${API_URL}/v1/meta`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as {
      product: string;
      version: string;
      metros: { code: string; name: string }[];
    };
  } catch {
    return null;
  }
}

export default async function Home() {
  const meta = await getMeta();
  return (
    <main>
      <h1>Parity Admin</h1>
      <p>
        Phase 0 skeleton. Parser editor, playbook editor, integrity queue, flags, and dashboards
        arrive in Phase 1 and 3.
      </p>
      {meta ? (
        <ul>
          <li>
            API: {meta.product} v{meta.version}
          </li>
          <li>Metros: {meta.metros.map((m) => m.name).join(', ')}</li>
        </ul>
      ) : (
        <p>
          API not reachable at {API_URL}. Run <code>make dev</code>.
        </p>
      )}
    </main>
  );
}
