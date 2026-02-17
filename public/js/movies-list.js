document.addEventListener("DOMContentLoaded", () => {
    const moviesContainer = document.getElementById("movies-list");
    if (!moviesContainer) return;

    // настраиваем библиотеку List.js для каталога фильмов
    const options = {
        // берем элементы по тексту которых будет идти поиск и сортировка (название и описание)
        valueNames: ["movie-title", "movie-meta"]
    };
    //инициализируем List.js на контейнере с айди movies-list
    new List(moviesContainer, options);
});
