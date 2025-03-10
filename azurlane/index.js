/// <reference path="../../themes/next-custom/source/js/third-party/spine38/spine-webgl.d.ts" />

const CANVAS_SIZE = 4096
const BGCOLOR_DARK = [0.17, 0.26, 0.44, 1];
const BGCOLOR_LIGHT = [0.55, 0.77, 0.86, 1];

/** @type {Object<string, {chName: string, skelNames: string[], pages: string[]}>} */
let ASSET_MAPPING = null
let ASSET_PREFIX = "/azurlane_spinepainting/";
let DEFAULT_SKIN = "buli_super";

/** @type {HTMLCanvasElement} */
let canvas = document.getElementById("canvas-spine");

/** @type {HTMLSelectElement} */
let animationSelect = document.getElementById("animation-select");

/** @type {RenderingContext} */
let context = null;
let shader = null;
let batcher = null;
let renderer = null;
let mvp = new spine.webgl.Matrix4();

/** @type {Object<string, spine.webgl.AssetManager>} */
let assetsCache = {}

let spineObjects = [];
let lastFrameTime = Date.now() / 1000;
let loadTask = null;

let mvpScale = 1;
let mvpTranslationX = 0;
let mvpTranslationY = 0;
let mvpX = 0;
let mvpY = 0;
let mvpW = CANVAS_SIZE;
let mvpH = CANVAS_SIZE;

let dragSrc = null; // 记录拖放源点
let pinchDistance = null; // 记录双指缩放距离

/** 计算骨骼包围盒 */
function calculateBounds(skeleton) {
    skeleton.setToSetupPose();
    skeleton.updateWorldTransform();
    let offset = new spine.Vector2();
    let size = new spine.Vector2();
    skeleton.getBounds(offset, size, []);
    return { offset: offset, size: size };
}

/** 创建 Spine 对象 */
function createSpineObject(skelFileData, atlasFileData, textureLoader, scale = 1) {
    let atlas = new spine.TextureAtlas(atlasFileData, textureLoader);
    let skeletonBinary = new spine.SkeletonBinary(new spine.AtlasAttachmentLoader(atlas));
    skeletonBinary.scale = scale; // 部分存在不同缩放

    let skeletonData = skeletonBinary.readSkeletonData(skelFileData);
    let animationNames = skeletonData.animations.map(e => e.name);

    let skeleton = new spine.Skeleton(skeletonData);
    let bounds = calculateBounds(skeleton);
    let animationState = new spine.AnimationState(new spine.AnimationStateData(skeleton.data));

    return { skeleton: skeleton, state: animationState, bounds: bounds, animations: animationNames };
}

/** 重置显示位置 */
function resize() {
    let offsetX = spineObjects.length ? Math.min(...spineObjects.map(e => e.bounds.offset.x)) : 0;
    let offsetY = spineObjects.length ? Math.min(...spineObjects.map(e => e.bounds.offset.y)) : 0;
    let sizeX = spineObjects.length ? Math.max(...spineObjects.map(e => e.bounds.size.x)) : canvas.width;
    let sizeY = spineObjects.length ? Math.max(...spineObjects.map(e => e.bounds.size.y)) : canvas.height;
    let centerX = offsetX + sizeX / 2;
    let centerY = offsetY + sizeY / 2;
    let scale = Math.max(sizeX / canvas.width, sizeY / canvas.height);

    mvpW = canvas.width * scale;
    mvpH = canvas.height * scale;
    mvpX = centerX - mvpW / 2;
    mvpY = centerY - mvpH / 2;

    console.log("resize: ", mvpX, mvpY, mvpW, mvpH);
    mvp.ortho2d(mvpX, mvpY, mvpW, mvpH);

    mvpScale = 1;
    mvpTranslationX = 0;
    mvpTranslationY = 0;
}

/** 更新视图 */
function updateMvp() {
    // 先平移再中心缩放
    let centerX = mvpX + mvpW / 2 - mvpTranslationX;
    let centerY = mvpY + mvpH / 2 - mvpTranslationY;
    let w = mvpW / mvpScale;
    let h = mvpH / mvpScale;
    let x = centerX - w / 2;
    let y = centerY - h / 2;

    console.debug("updateMvp: ", x, y, w, h);
    mvp.ortho2d(x, y, w, h);
}

/** 渲染循环 */
function render() {
    let now = Date.now() / 1000;
    let delta = now - lastFrameTime;
    lastFrameTime = now;

    context.clear(context.COLOR_BUFFER_BIT);

    // 倒序渲染所有骨骼动画
    for (let i = spineObjects.length - 1; i >= 0; i--) {
        let obj = spineObjects[i];
        obj.state.update(delta);
        obj.state.apply(obj.skeleton);
        obj.skeleton.updateWorldTransform();

        shader.bind();
        shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);
        shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, mvp.values);

        batcher.begin(shader);

        renderer.draw(batcher, obj.skeleton);

        batcher.end();
        shader.unbind();
    }
    requestAnimationFrame(render);
}

/** 加载指定皮肤资源 */
function loadSkin(skinName) {
    if (!context) return;
    if (!ASSET_MAPPING[skinName]) {
        console.error(skinName, "not found");
        return;
    }
    let manager = assetsCache[skinName] || (assetsCache[skinName] = new spine.webgl.AssetManager(context));
    if (!manager) {
        delete assetsCache[skinName];
        return;
    }

    // 开始下载资源 (如果浏览器有缓存就不会重复下载)
    const skinMeta = ASSET_MAPPING[skinName];
    skinMeta.spines.forEach(e => {
        manager.loadBinary(e.skelUrl);
        manager.loadText(e.atlasUrl);
        e.pageUrls.forEach(v => manager.loadTexture(v))
    })

    // 移除上一个等待任务, 更改显示最新启动加载的皮肤, 但是曾经开始下载的资源依然会继续下载
    if (loadTask) {
        console.log(loadTask);
        console.log("remove last loadTask");
        clearInterval(loadTask);
        loadTask = null;
    }

    loadTask = setInterval(function () {
        let chName = skinMeta.chName;
        if (manager.isLoadingComplete()) {
            spineObjects = [];
            const spines = skinMeta.spines
            for (let i = 0; i < spines.length; i++) {
                let skelFileData = manager.get(spines[i].skelUrl);
                let atlasFileData = manager.get(spines[i].atlasUrl);
                let textureLoader = (path) => manager.get(skinMeta.prefix + path);
                try {
                    let spObj = createSpineObject(skelFileData, atlasFileData, textureLoader, spines[i].scale || 1);
                    spineObjects.push(spObj);
                } catch (error) {
                    console.error(skinName, i, "load failed.");
                    console.error(error);
                }
            };

            // 资源加载完毕
            resize();
            setAnimationList();
            document.getElementById("current-shipname").textContent = chName;
            document.getElementById("current-loading").textContent = "";
            clearInterval(loadTask);
            loadTask = null;
        } else {
            let progress = manager.getLoadProgress();
            let loaded = (progress.loaded / 1048576).toFixed(2);
            let total = (progress.total / 1048576).toFixed(2)
            let progressText = `正在加载[${loaded}/${total}MB]: ${chName}`;
            document.getElementById("current-loading").textContent = progressText;
        }
    }, 100);
}

/** 链接点击事件 */
function changeSkinHandler(event) {
    loadSkin(event.target.getAttribute("data-key"));
}

/** canvas 缩放事件 */
function canvasWheelHandler(event) {
    event.preventDefault();
    let scale = mvpScale * (1 - event.deltaY / 500);
    mvpScale = Math.max(Math.min(scale, 100), 0.1);
    updateMvp();
}

/** canvas 鼠标按下事件 */
function canvasMouseDown(event) {
    if (!(event.buttons & 1)) return;
    dragSrc = { x: event.clientX, y: event.clientY };
}

/** canvas 鼠标移动事件 */
function canvasMouseMove(event) {
    if (!(event.buttons & 1) || !dragSrc) return;

    let deltaX = event.clientX - dragSrc.x;
    let deltaY = -(event.clientY - dragSrc.y);

    let scaleX = (mvpW / canvas.clientWidth) / mvpScale;
    let scaleY = (mvpH / canvas.clientHeight) / mvpScale;

    mvpTranslationX += deltaX * scaleX;
    mvpTranslationY += deltaY * scaleY;
    updateMvp();

    dragSrc = { x: event.clientX, y: event.clientY };
}

/** canvas 鼠标释放事件 */
function canvasMouseUp(event) {
    if (!(event.buttons & 1)) return;
    dragSrc = null;
}

/** 获取两点之间的距离 */
function getDistance(touches) {
    let dx = touches[0].clientX - touches[1].clientX;
    let dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

/** canvas 触摸开始事件 */
function canvasTouchStart(event) {
    if (event.touches.length === 1) {
        // 单指拖动
        dragSrc = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    } else if (event.touches.length === 2) {
        // 双指缩放
        pinchDistance = getDistance(event.touches);
    }
}

/** canvas 触摸移动事件 */
function canvasTouchMove(event) {
    event.preventDefault();

    if (event.touches.length === 2 && pinchDistance) {
        // 处理双指缩放
        let newDistance = getDistance(event.touches);
        let scale = mvpScale * (newDistance / pinchDistance);
        mvpScale = Math.max(Math.min(scale, 100), 0.1);
        updateMvp();
        pinchDistance = newDistance; // 更新初始距离
    } else if (event.touches.length === 1 && dragSrc) {
        // 处理单指拖动
        let deltaX = event.touches[0].clientX - dragSrc.x;
        let deltaY = -(event.touches[0].clientY - dragSrc.y);

        let scaleX = (mvpW / canvas.clientWidth) / mvpScale;
        let scaleY = (mvpH / canvas.clientHeight) / mvpScale;

        mvpTranslationX += deltaX * scaleX;
        mvpTranslationY += deltaY * scaleY;
        updateMvp();

        dragSrc = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
}

/** canvas 触摸释放事件 */
function canvasTouchEnd(event) {
    if (event.touches.length < 2) {
        pinchDistance = null;
    }
    if (event.touches.length < 1) {
        dragSrc = null;
    }
}

/** 设置播放动画 */
function setAnimation(name) {
    spineObjects.forEach(e => {
        if (e.animations.includes(name)) {
            e.state.setAnimation(0, name, true);
        } else {
            console.log("Animation not found", name, e);
        }
    })
}

/** 设置动画列表 */
function setAnimationList() {
    if (spineObjects.length <= 0)
        return;

    let animationNames = spineObjects[0].animations;

    animationSelect.innerHTML = "";
    animationNames.forEach(name => {
        let option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        animationSelect.appendChild(option);
    });

    let initAnimation = animationNames[animationNames.length - 1];
    if (animationNames.includes("normal")) {
        initAnimation = "normal";
    } else if (animationNames.includes("idle")) {
        initAnimation = "idle";
    }
    setAnimation(initAnimation);
    animationSelect.value = initAnimation;
}

/** 选择动画事件 */
function animationSelectChange(event) {
    setAnimation(event.target.value);
}

/** 设置画布背景色 */
function setBackgroundColor(color) {
    if (color == "dark") {
        context.clearColor(...BGCOLOR_DARK);
        document.querySelector('input[name="bgcolor"][value="dark"]').checked = true;
    } else {
        context.clearColor(...BGCOLOR_LIGHT);
        document.querySelector('input[name="bgcolor"][value="light"]').checked = true;
    }
}

/** 背景色设置事件 */
function backgroundColorChange(event) {
    let value = document.querySelector('input[name="bgcolor"]:checked').value;
    setBackgroundColor(value);
}

/** 皮肤列表筛选事件 */
function filterSkinInputChange(event) {
    let text = event.target.value;
    console.log(text);
    let links = document.getElementById("shipnames-container").querySelectorAll("a");
    if (!text) {
        links.forEach(link => {
            link.style.backgroundColor = "";
            link.style.display = "";
        });
    } else {
        text = text.trim();
        console.log(text);
        links.forEach(link => {
            console.log(link.textContent);
            if (link.textContent.includes(text)) {
                link.style.backgroundColor = "lightyellow";
                link.style.display = "";
            } else {
                link.style.backgroundColor = "";
                link.style.display = "none";
            }
        });
    }
}

function init() {
    let params = new URLSearchParams(window.location.search);

    // 处理参数 p
    if (params.get("p")) {
        let altPrefix = params.get("p");
        if (!altPrefix.endsWith("/")) altPrefix += "/";
        console.log("Use another asset prefix:", altPrefix);
        ASSET_PREFIX = altPrefix;
    }

    // 通过 XHR 获取 JSON 数据
    let assetMappingUrl = ASSET_PREFIX + "preview.json";
    let xhr = new XMLHttpRequest();
    xhr.open("GET", assetMappingUrl, true);
    xhr.responseType = "json";

    xhr.onload = function () {
        if (xhr.status === 200) {
            let skinData = xhr.response;
            if (!skinData || typeof skinData !== "object") {
                alert("皮肤信息解析失败！");
                return;
            }

            // 将获取的皮肤数据赋值到 ASSET_MAPPING
            ASSET_MAPPING = skinData;

            // 处理参数 s
            if (params.get("s")) {
                let altDefaultSkin = params.get("s");
                if (ASSET_MAPPING[altDefaultSkin]) {
                    console.log("Use another default skin:", altDefaultSkin);
                    DEFAULT_SKIN = altDefaultSkin;
                }
            }

            // 执行 main 函数
            main();
        } else {
            // 处理加载失败
            alert("皮肤信息获取失败！");
        }
    };

    xhr.onerror = function () {
        alert("皮肤信息获取失败！");
    };

    xhr.send();
}

function main() {
    // 生成皮肤 url
    for (let key of Object.keys(ASSET_MAPPING)) {
        let prefix = ASSET_PREFIX + key + "/";
        ASSET_MAPPING[key]["prefix"] = prefix;
        let spines = ASSET_MAPPING[key].spines;
        for (let i = 0; i < spines.length; i++) {
            spines[i]["skelUrl"] = prefix + spines[i].skelName;
            spines[i]["atlasUrl"] = prefix + spines[i].atlasName;
            spines[i]["pageUrls"] = spines[i].pages.map(e => prefix + e);
        }
    }

    // 生成皮肤列表
    let container = document.getElementById("shipnames-container");
    for (let key of Object.keys(ASSET_MAPPING).sort()) {
        value = ASSET_MAPPING[key];
        let link = document.createElement("a");
        link.href = "javascript:void(0);";
        link.textContent = value.chName;
        link.setAttribute("data-key", key);
        link.onclick = changeSkinHandler;
        container.appendChild(link);
    }

    // 添加筛选高亮
    document.getElementById("filter-skin-input").oninput = filterSkinInputChange;

    // 创建绘图资源
    let config = { alpha: false };
    context = canvas.getContext("webgl", config) || canvas.getContext("experimental-webgl", config);
    if (!context) {
        console.error("WebGL 加载失败")
        alert("WebGL 加载失败");
        return;
    }
    try {
        shader = spine.webgl.Shader.newTwoColoredTextured(context);
        batcher = new spine.webgl.PolygonBatcher(context);
        renderer = new spine.webgl.SkeletonRenderer(context);
    }
    catch (error) {
        console.error(error);
        return;
    }

    // 设置绘图基本参数
    canvas.height = canvas.width = CANVAS_SIZE;
    setBackgroundColor("light");
    context.viewport(0, 0, canvas.width, canvas.height);
    renderer.premultipliedAlpha = true; // 碧蓝的东西默认是有 PMA 的

    // 交互事件绑定
    canvas.onwheel = canvasWheelHandler;
    canvas.onmousedown = canvasMouseDown;
    canvas.onmousemove = canvasMouseMove;
    canvas.onmouseup = canvasMouseUp;
    canvas.onmouseleave = canvasMouseUp;
    canvas.ontouchstart = canvasTouchStart;
    canvas.ontouchmove = canvasTouchMove;
    canvas.ontouchend = canvasTouchEnd;

    // 控制面板事件绑定
    animationSelect.onchange = animationSelectChange;
    document.getElementsByName("bgcolor").forEach((radio) => {
        radio.onchange = backgroundColorChange;
    })

    // 加载一个默认皮肤
    loadSkin(DEFAULT_SKIN);
    render();
}

(function () { init(); }());
