document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('movies-list')) return;

  const source = new EventSource('/movies/events');

  source.onmessage = () => {
    // Обновляем карточки, сохраняя текущий поисковый запрос.
    fetch(window.location.href, { headers: { 'Cache-Control': 'no-cache' } })
      .then(response => response.ok ? response.text() : Promise.reject())
      .then(html => {
        const next = new DOMParser().parseFromString(html, 'text/html').querySelector('#movies-list .best-movies');
        const current = document.querySelector('#movies-list .best-movies');
        if (next && current) current.replaceWith(next);
      })
      .catch(() => {});
  };
});
