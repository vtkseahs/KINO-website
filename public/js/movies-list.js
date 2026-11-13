document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('movies-list');
  const button = container?.querySelector('.sort');
  if (!button) return;
  button.addEventListener('click', () => {
    const list = container.querySelector('.best-movies');
    if (!list) return;
    [...list.children].sort((a, b) => (a.querySelector('.movie-title')?.textContent || '').localeCompare(b.querySelector('.movie-title')?.textContent || '', 'ru')).forEach(card => list.appendChild(card));
  });
});
