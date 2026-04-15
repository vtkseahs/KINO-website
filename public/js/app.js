
    const normPath = (path) => (!path||path==='/') ? '/' : path.replace(/\/+$/, '');
    const fileName = (path) => (normPath(path).split('/').pop()||'/');

    const navigationClick = () => {
        const nav = document.querySelector('.navigation');
        if (!nav) return;

        const links = nav.querySelectorAll('a[href]');
        if (!links.length) return;

        const tekPath = normPath(location.pathname);
        let bestPath = null;

        for (const a of links) {
            const url = new URL(a.href);
            if (normPath(url.pathname)===tekPath) {
                bestPath = a;
                break;
            }
        }
        if (!bestPath) {
            const tekFile = fileName(tekPath);
            let oneFile=null;
            let cnt=0;
            for (const a of links) {
                const url = new URL(a.href);
                if (fileName(url.pathname)===tekFile) {
                    oneFile = a;
                    cnt++;
                    if (cnt>1){
                        break;
                    }
                }
            }
            if (cnt===1){
                bestPath=oneFile;
            }
        }
        links.forEach(a => a.classList.remove('nav-active'));
        if (bestPath) bestPath.classList.add('nav-active');
    };


    window.addEventListener("load", () => {
        const navEntry = performance.getEntriesByType("navigation")[0];
        const box = document.getElementById("loadTime");
        if (!box || !navEntry) return;
        const clientMs = Math.round(navEntry.loadEventEnd || performance.now());
        const serverMs = box.dataset.serverElapsedTime;

        if (serverMs) {
            box.innerText = `Сервер: ${serverMs} мс | Клиент: ${clientMs} мс`;
        } else {
            box.innerText = `Клиент: ${clientMs} мс`;
        }
    });

    document.addEventListener("DOMContentLoaded", navigationClick);

