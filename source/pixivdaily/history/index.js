// 日期筛选
function filterDates() {
    const links = document.getElementById("date-container").querySelectorAll("a");
    const yearSelect = document.getElementById("year-select");
    const monthSelect = document.getElementById("month-select");
    const daySelect = document.getElementById("day-select");
    const year = Number(yearSelect.value);
    const month = Number(monthSelect.value);
    const day = Number(daySelect.value);

    links.forEach(link => {
        const linkDate = link.getAttribute("data-key");
        const linkYear = Number(linkDate.slice(0, 4));
        const linkMonth = Number(linkDate.slice(4, 6));
        const linkDay = Number(linkDate.slice(6, 8));

        const matchesYear = !year || linkYear === year;
        const matchesMonth = !month || linkMonth === month;
        const matchesDay = !day || linkDay === day;

        if (matchesYear && matchesMonth && matchesDay) {
            link.style.display = "";
        } else {
            link.style.display = "none";
        }
    });
}

function main(dateList) {
    // 数据初始化
    const container = document.getElementById("date-container");
    const years = new Set();
    dateList.forEach(date => {
        const link = document.createElement("a");
        link.href = `/pixivdaily/?d=${date}`;
        const year = date.slice(0, 4);
        const month = date.slice(4, 6);
        const day = date.slice(6, 8);
        link.textContent = `${year}年${month}月${day}日`;
        link.setAttribute("data-key", date);
        container.appendChild(link);

        years.add(year); // 记录年份
    });

    // 获取各个选择框
    const yearSelect = document.getElementById("year-select");
    const monthSelect = document.getElementById("month-select");
    const daySelect = document.getElementById("day-select");
    const showAllButton = document.getElementById("showall-btn");

    // 添加年份选项
    Array.from(years).sort().forEach(year => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });

    // 绑定筛选事件
    yearSelect.onchange = filterDates;
    monthSelect.onchange = filterDates;
    daySelect.onchange = filterDates;
    showAllButton.onclick = () => { yearSelect.value = monthSelect.value = daySelect.value = ""; filterDates(); };
}

function init() {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "/pixivrank/index.txt", true);
    xhr.responseType = "text";

    xhr.onload = function () {
        if (xhr.status === 200) {
            let dateList = xhr.response.trim().split("\n").map(line => line.trim()) // 每一行为一个日期, 格式为YYYYMMDD
            main(dateList);
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