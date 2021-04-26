const PageRenderer = {
    METADATA: "/static/data/metadata.json",
    CATEGORIES: "/static/data/categories.json",
    CONTENTS: "./contents.json",

    renderMetadata: function () {
        fetch(PageRenderer.METADATA).then(response => {
            if (response.ok) {
                response.json().then(json => {
                    const siteMeta = document.querySelector(".site-meta");

                    let title = siteMeta.querySelector(".site-title").querySelector("a");
                    title.textContent = json["site-title"];
                    title.setAttribute("href", json["site-url"]);

                    let subTitle = siteMeta.querySelector(".site-subtitle").querySelector("p");
                    subTitle.innerHTML = json["site-subtitle"];

                    document.title = json["site-title"];
                })
            } else {
                console.log(response.status + ': ' + response.statusText);
            };
        }).catch(err => {
            console.log(err);
        });
    },

    renderCategories: function () {
        fetch(PageRenderer.CATEGORIES).then(response => {
            if (response.ok) {
                response.json().then(json => {
                    const tempNavItem = document.querySelector("#temp-site-nav-item");
                    const siteNavMenu = document.querySelector("#site-nav-menu");

                    siteNavMenu.innerHTML = "";
                    for (let i = 0; i < json.length; i++) {
                        let tmpNode = tempNavItem.content.querySelector("a");
                        tmpNode.setAttribute("href", json[i]["relpath"]);
                        tmpNode.setAttribute("title", json[i]["text"]);
                        tmpNode = tempNavItem.content.querySelector(".site-nav-menu-item");
                        tmpNode.textContent = json[i]["text"];

                        siteNavMenu.appendChild(document.importNode(tempNavItem.content, true));
                    }
                })
            } else {
                console.log(response.status + ': ' + response.statusText);
            };
        }).catch(err => {
            console.log(err);
        });
    },

    renderContents: function () {
        fetch(PageRenderer.CONTENTS).then(response => {
            if (response.ok) {
                response.json().then(json => {
                    const tempNavItem = document.querySelector("#temp-content-nav-item");
                    const contentNavMenu = document.querySelector("#content-nav-menu");

                    contentNavMenu.innerHTML = "";
                    for (let i = 0; i < json.length; i++) {
                        let tmpNode = tempNavItem.content.querySelector("a");
                        tmpNode.setAttribute("href", json[i]["relpath"]);
                        tmpNode.setAttribute("title", json[i]["description"]);
                        tmpNode = tempNavItem.content.querySelector(".content-nav-menu-item");
                        tmpNode.textContent = json[i]["description"];

                        contentNavMenu.appendChild(document.importNode(tempNavItem.content, true));
                    }
                })
            } else {
                console.log(response.status + ': ' + response.statusText);
            };
        }).catch(err => {
            console.log(err);
        });
    }

};