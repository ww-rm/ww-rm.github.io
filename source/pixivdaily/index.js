let DATELIST = null;
let CURRENT_DATE = null;
let CURRENT_TYPE = "monthly";
let PROXY_DOMAIN = "i.pixiv.re";

/** 生成一份 illust 的页面内容 */
function generateIllustHtml(illustInfo) {
    const description = `<div class="description">
        <div class="flex-line description-item">
            <span><span class="description-label">标题: </span>${illustInfo.illustTitle}</span>
            <span><span class="description-label">作者: </span>${illustInfo.userName}</span>
        </div>
        <div class="flex-line description-item">
            <a href="https://pixiv.net/artworks/${illustInfo.illustId}" target="_blank" rel="noopener noreferrer">
                <span class="description-label">PID: </span><span>${illustInfo.illustId}</span>
            </a>
            <a href="https://www.pixiv.net/users/${illustInfo.userId}" target="_blank" rel="noopener noreferrer">
                <span class="description-label">UID: </span><span>${illustInfo.userId}</span>
            </a>
        </div>
        <div class="description-item">
            <span><span class="description-label">标签: </span>${illustInfo.tags.map(e => "# " + e).join(", ")}</span>
        </div>
        <div class="description-item">
            <span>共 <span class="description-label">${illustInfo.urls.length}</span> 张, 可上下滑动查看其他页，点击图片访问原图</span>
        </div>
    </div>`;
    const hasLazyload = "lozad" in window; // 如果有懒加载则启用懒加载 data-src
    const imagelinks = illustInfo.urls.map(e => {
        const img = `<img ${hasLazyload ? "data-src" : "src"}="${e.urls.small.replace("i.pximg.net", PROXY_DOMAIN)}" alt="${e.urls.small.split("/").pop()}">`;
        return `<a href="${e.urls.original.replace("i.pximg.net", PROXY_DOMAIN)}" target="_blank" rel="noopener noreferrer">${img}</a>`;
    }).join("\n");
    const imagelist = `<div class="image-container"><div class="image-list">${imagelinks}</div></div>`;
    const illustHtml = `<div class="illust-container">${description}${imagelist}</div>`;

    return illustHtml;
}

function main() {
    if (DATELIST.length <= 0) return;
    CURRENT_DATE = DATELIST[0]; // 默认值最新的一天

    // 处理入参
    const params = new URLSearchParams(window.location.search);

    // 日期
    if (params.get("d")) {
        const d = params.get("d");
        if (DATELIST.includes(d)) {
            CURRENT_DATE = d;
        }
    }

    // 榜单类型
    if (params.get("t")) {
        const t = params.get("t");
        if (["monthly", "weekly", "daily"].includes(t)) {
            CURRENT_TYPE = t;
        }
    }

    // 反代站域名
    if (params.get("p")) {
        const p = params.get("p");
        console.log("Use another proxy domain:", p);
        PROXY_DOMAIN = p;
    }

    // 获取数据渲染页面
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `/pixivrank/${CURRENT_DATE.slice(0, 4)}/${CURRENT_DATE.slice(4, 6)}/${CURRENT_DATE.slice(6, 8)}/${CURRENT_TYPE}.json`, true);
    xhr.responseType = "json";

    xhr.onload = function () {
        if (xhr.status === 200) {
            const illustsData = xhr.response;
            if (!illustsData || typeof illustsData !== "object") {
                alert("Pixiv 信息获取失败！");
                return;
            }

            // 设置榜单类型链接
            document.getElementById(`typenav-${CURRENT_TYPE}`).classList.add("typenav-selected");
            const typenavUrl = new URL(window.location.href);
            ["monthly", "weekly", "daily"].forEach(t => {
                typenavUrl.searchParams.set("t", t);
                document.getElementById(`typenav-${t}`).setAttribute("href", typenavUrl.toString());
            })

            // 设置日期导航链接
            const currentDateIndex = DATELIST.indexOf(CURRENT_DATE);
            const datenavUrl = new URL(window.location.href);
            if (currentDateIndex > 0) {
                datenavUrl.searchParams.set("d", DATELIST[currentDateIndex - 1]);
                document.getElementById("datenav-next").setAttribute("href", datenavUrl.toString());
            } else {
                document.getElementById("datenav-next").style.display = "none";
            }
            if (currentDateIndex < DATELIST.length - 1) {
                datenavUrl.searchParams.set("d", DATELIST[currentDateIndex + 1]);
                document.getElementById("datenav-prev").setAttribute("href", datenavUrl.toString());
            } else {
                document.getElementById("datenav-prev").style.display = "none";
            }

            // 渲染插画内容
            const illustsContainer = document.getElementById("illusts");
            illustsContainer.innerHTML = illustsData.illusts.map(generateIllustHtml).join("\n");
            window.lozad && window.lozad("#illusts img").observe(); // 如果启用了懒加载，触发懒加载
        } else {
            alert("日期信息获取失败！");
        }
    };

    xhr.onerror = function () {
        alert("日期信息获取失败！");
    };

    xhr.send();
}

function init() {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/pixivrank/index.txt", true);
    xhr.responseType = "text";

    xhr.onload = function () {
        if (xhr.status === 200) {
            DATELIST = xhr.response.trim().split("\n").map(line => line.trim()); // 每一行为一个日期, 格式为YYYYMMDD
            main();
        } else {
            alert("日期信息获取失败！");
        }
    };

    xhr.onerror = function () {
        alert("日期信息获取失败！");
    };

    xhr.send();
}

init();