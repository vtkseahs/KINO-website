function showToast(message, className) {
    Toastify({
        text: message, //текст уведомления
        duration: 3000, //длительность сообщения в мс
        gravity: "top", // где будет всплывать сообщ
        position: "right",
        close: true, //крестик
        className, //css класс
    }).showToast();
}

//вызов toastify с классом для успеха или ошибки

export function notifySuccess(message) {
    showToast(message, "toastify-success");
}

export function notifyError(message) {
    showToast(message, "toastify-error");
}
