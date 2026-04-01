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
  }
}