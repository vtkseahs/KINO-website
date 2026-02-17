import {notifyError, notifySuccess} from "./notifications.js";

document.addEventListener("DOMContentLoaded", () => {
    const form= document.getElementById("review-form");
    const list= document.getElementById("reviews-list");
    const template= document.getElementById("review-template");

    const loader= document.getElementById("loader");
    const errorBox= document.getElementById("error-message");
    const key="kino_reviews";

    const showLoader = () => {
        if (loader) loader.classList.remove("hidden");
        if (list) list.classList.add("hidden");
        if (errorBox) errorBox.classList.add("hidden");
    };

    const hideLoader = () => {
        if (loader) loader.classList.add("hidden");
    };

    const showError = (message) => {
        if (!errorBox) return;
        errorBox.textContent = message;
        errorBox.classList.remove("hidden");
        if (list) list.classList.add("hidden");
    };

    const clearError = () => {
        if (!errorBox) return;
        errorBox.textContent = "";
        errorBox.classList.add("hidden");
        if (list) list.classList.remove("hidden");
    };

    const loadReviews=() =>{
        const data = JSON.parse(localStorage.getItem(key)||"[]");
        data.forEach(addReview);
    };

    const saveReviews=()=>{
        const items = list.querySelectorAll(".review-item:not(.remote-review)");
        const reviews = [];
        items.forEach(item => {
            reviews.push({
                title: item.querySelector(".review-title").textContent,
                author: item.dataset.author,
                text: item.querySelector(".review-text").textContent
            });
        });
        localStorage.setItem(key, JSON.stringify(reviews));
    };

    const addReview = ({title,author,text, isRemote=false}) => {
        const el = template.content.cloneNode(true);
        const item = el.querySelector(".review-item");

        item.dataset.author = author;
        item.querySelector(".review-title").textContent =title;
        item.querySelector(".review-author").textContent= `Автор: ${author}`;
        item.querySelector(".review-text").textContent = text;

        const editBtn =item.querySelector(".edit-button");

        if (isRemote) {
            item.classList.add("remote-review");
            if (editBtn) {
                editBtn.remove();
            }
        } else {
            if (editBtn) {
                editBtn.addEventListener("click", () => editReview(item));
            }
        }
        list.appendChild(el);
    };

    const editReview=(item) => {
        const oldText= item.querySelector(".review-text").textContent;
        const textArea = document.createElement("textarea");
        textArea.className="edit-area";
        textArea.value = oldText;
        item.querySelector(".review-text").replaceWith(textArea);

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Сохранить";
        saveBtn.className = "button save-button";
        item.appendChild(saveBtn);

        saveBtn.addEventListener("click", () =>{
            const p = document.createElement("p");
            p.className = "review-text";
            p.textContent = textArea.value;

            textArea.replaceWith(p);
            saveBtn.remove();
            saveReviews();
            notifySuccess("Рецензия успешно сохранена");
        });
    };

    const fetchRemoteReviews = async () => {
        clearError();
        showLoader();
        list.querySelectorAll(".remote-review").forEach((item) => item.remove());

        try {
            const userId = Math.floor(Math.random()*10)+1;
            const url = `https://jsonplaceholder.typicode.com/posts?userId=${userId}`;
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status===404) {
                    showError("Ошибка 404: запрошенные рецензии не найдены");
                    notifyError("Ошибка 404: запрошенные рецензии не найдены");
                } else {
                    showError(`Ошибка: сервер не отвечает: ${response.status}`);
                    notifyError(`Ошибка: сервер не отвечает: ${response.status}`);
                }
                return;
            }

            const data = await response.json();

            data.forEach((post) => {
                addReview({
                    title: post.title,
                    author: `Пользователь ${post.userId}`,
                    text: post.body,
                    isRemote: true
                });
            });

            clearError();
        } catch (error) {
            if (error instanceof TypeError) {
                showError("Ошибка: не удалось подключиться к серверу");
                notifyError("Ошибка: не удалось подключиться к серверу");
            }
        } finally {
            hideLoader();
        }
    };

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const author = document.getElementById("review-author").value;
        const email = document.getElementById("review-email").value;
        const title = document.getElementById("review-title").value;
        const text = document.getElementById("review-text").value;

        if (!email.includes("@")) {
            notifyError("Некорректный email");
            return;
        }
        const review = {title,author,text };
        addReview(review);
        saveReviews();
        form.reset();
        notifySuccess("Рецензия добавлена!");
    });
    loadReviews();
    fetchRemoteReviews();
});
