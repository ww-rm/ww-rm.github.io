---
title: Pixiv Daily
---

在下方选择日期查看对应的 Pixiv 榜单.

<style>
    .control-panel {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-items: center;
        box-sizing: border-box;
        width: 100%;
        padding: 5px;
        background-color: transparent;
        border-bottom: 1.2px solid #222;
    }

    .control-item {
        margin: 5px;
    }

    .control-item label {
        margin-right: 3px;
    }

    .control-item select {
        min-width: 75px;
        text-align: right;
    }

    #date-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        gap: 10px;
        width: 100%;
        max-height: 600px;
        overflow-y: auto;
        padding: 5px;
    }
</style>

<div class="control-panel">
    <div class="control-item">
        <label for="year">年:</label>
        <select id="year-select">
            <option value="">--</option>
        </select>
    </div>
    <div class="control-item">
        <label for="month">月:</label>
        <select id="month-select">
            <option value="">--</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
            <option value="11">11</option>
            <option value="12">12</option>
        </select>
    </div>
    <div class="control-item">
        <label for="day">日:</label>
        <select id="day-select">
            <option value="">--</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
            <option value="11">11</option>
            <option value="12">12</option>
            <option value="13">13</option>
            <option value="14">14</option>
            <option value="15">15</option>
            <option value="16">16</option>
            <option value="17">17</option>
            <option value="18">18</option>
            <option value="19">19</option>
            <option value="20">20</option>
            <option value="21">21</option>
            <option value="22">22</option>
            <option value="23">23</option>
            <option value="24">24</option>
            <option value="25">25</option>
            <option value="26">26</option>
            <option value="27">27</option>
            <option value="28">28</option>
            <option value="29">29</option>
            <option value="30">30</option>
            <option value="31">31</option>
        </select>
    </div>
    <div class="control-item">
        <button id="showall-btn">清除筛选</button>
    </div>
</div>

<div id="date-container"></div>

<script>
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
            link.href = `/pixivdaily/ranking/?date=${date}`;
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
        xhr.open("GET", "https://ww-rm.github.io/pixivrank/index.txt", true);
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
</script>