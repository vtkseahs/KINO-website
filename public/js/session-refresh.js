const statusMessage = document.getElementById('session-status');

async function refreshSession() {
  try {
    const response = await fetch(statusMessage.dataset.refreshPath, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'st-auth-mode': 'cookie', rid: 'session' },
    });
    if (response.ok) {
      window.location.reload();
    } else {
      statusMessage.textContent = 'Сеанс закончился. Войдите снова.';
    }
  } catch {
    statusMessage.textContent =
      'Не удалось обновить сеанс. Попробуйте ещё раз.';
  }
}

if (navigator.locks) {
  void navigator.locks.request('kino-session-refresh', refreshSession);
} else {
  void refreshSession();
}
