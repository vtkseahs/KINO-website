document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('movies-list')) return;
  const source = new EventSource('/movies/events');

  source.onmessage = async () => {
    try {
      const response = await fetch(window.location.href, { cache: 'no-store' });
      if (!response.ok) return;
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      for (const selector of ['#movies-list .best-movies', '#catalog-pages']) {
        const updated = page.querySelector(selector);
        if (updated) document.querySelector(selector)?.replaceWith(updated);
      }
    } catch {
      // The event stream reconnects when the connection is available again.
    }
  };
});
