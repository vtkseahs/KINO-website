document.addEventListener('DOMContentLoaded', () => {
  const eventsList = document.getElementById('movies-events-list');
  if (!eventsList) return;

  const source = new EventSource('/movies/events');

  source.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (
      eventsList.children.length === 1 &&
      eventsList.children[0].textContent === 'Ожидание обновлений...'
    ) {
      eventsList.innerHTML = '';
    }

    const item = document.createElement('li');
    item.textContent = `[${data.time}] ${data.message}`;
    eventsList.prepend(item);

    while (eventsList.children.length > 5) {
      eventsList.removeChild(eventsList.lastChild);
    }

    // Обновляем карточки, сохраняя текущий поисковый запрос.
    fetch(window.location.href, { headers: { 'Cache-Control': 'no-cache' } })
      .then(response => response.ok ? response.text() : Promise.reject())
      .then(html => {
        const next = new DOMParser().parseFromString(html, 'text/html').querySelector('#movies-list .best-movies');
        const current = document.querySelector('#movies-list .best-movies');
        if (next && current) current.replaceWith(next);
      })
      .catch(() => {});

    if (window.toastr) {
      window.toastr.info(data.message, 'Событие каталога');
    }
  };
});
