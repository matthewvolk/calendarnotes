export default async function authFetch(url, token) {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error("Response not OK", res);
      return null;
    }
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error("Fetch failed", err);
    return null;
  }
}
