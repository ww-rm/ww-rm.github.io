/// <reference path="../../themes/next-custom/source/js/third-party/spine38/spine-webgl.d.ts" />

const ASSET_MAPPING = {
    "aerhangeersike_3": {
        "chName": "阿尔汉格尔斯克_与魔女同行",
        "skelNames": ["aerhangeersike_3"],
        "pages": ["aerhangeersike_3.png", "aerhangeersike_32.png", "aerhangeersike_33.png"]
    },
    "aersasi": {
        "chName": "阿尔萨斯",
        "skelNames": ["aersasi"],
        "pages": ["aersasi.png", "aersasi2.png", "aersasi3.png"]
    },
    "aidang_6": {
        "chName": "爱宕_满月之夜的狼",
        "skelNames": ["aidang_6"],
        "pages": ["aidang_6.png"]
    },
    "aierdeliqi_g": {
        "chName": "埃尔德里奇_改",
        "skelNames": ["aierdeliqi_g"],
        "pages": ["aierdeliqi_g.png", "aierdeliqi_g2.png"]
    },
    "aijier": {
        "chName": "埃吉尔",
        "skelNames": ["aijierT", "aijierM", "aijierB"],
        "pages": ["aijierT.png", "aijierM.png", "aijierB.png"]
    },
    "aimudeng_4": {
        "chName": "埃姆登_引路的双轨极星",
        "skelNames": ["aimudeng_4T", "aimudeng_4M", "aimudeng_4B"],
        "pages": ["aimudeng_4T.png", "aimudeng_4M.png", "aimudeng_4B.png"]
    },
    "aisaikesi_7": {
        "chName": "埃塞克斯_碧海之梦",
        "skelNames": ["aisaikesi_7T", "aisaikesi_7B"],
        "pages": ["aisaikesi_7T.png", "aisaikesi_7B.png"]
    },
    "aogusite_3": {
        "chName": "奥古斯特_被阳光照亮之时",
        "skelNames": ["aogusite_3"],
        "pages": ["aogusite_3.png"]
    },
    "bailong": {
        "chName": "白龙",
        "skelNames": ["bailongT", "bailongM", "bailongB"],
        "pages": ["bailongT.png", "bailongM.png", "bailongB.png"]
    },
    "banerwei_2": {
        "chName": "伴尔维_俩人的柔软体操",
        "skelNames": ["banerwei_2"],
        "pages": ["banerwei_2.png"]
    },
    "beierfasite_9": {
        "chName": "贝尔法斯特_至福的侍奉",
        "skelNames": ["beierfasite_9"],
        "pages": ["beierfasite_9.png"]
    },
    "bisimaiz": {
        "chName": "俾斯麦Zwei",
        "skelNames": ["bisimaiZT", "bisimaiZM", "bisimaiZB"],
        "pages": ["bisimaiZT.png", "bisimaiZM.png", "bisimaiZB.png"]
    },
    "bisimaiz_2": {
        "chName": "俾斯麦Zwei_清澈假日",
        "skelNames": ["bisimaiZ_2T", "bisimaiZ_2M", "bisimaiZ_2B"],
        "pages": ["bisimaiZ_2T.png", "bisimaiZ_2M.png", "bisimaiZ_2B.png"]
    },
    "bulaimodun_6": {
        "chName": "布莱默顿_特别的治愈时间",
        "skelNames": ["bulaimodun_6"],
        "pages": ["bulaimodun_6.png"]
    },
    "buleisite": {
        "chName": "布雷斯特",
        "skelNames": ["buleisite_T", "buleisite_B"],
        "pages": ["buleisite_T.png", "buleisite_B.png"]
    },
    "buli_super": {
        "chName": "特装型布里MKIII",
        "skelNames": ["buli_super"],
        "pages": ["buli_super.png"]
    },
    "dahuangfengii_2": {
        "chName": "大黄蜂II_驰骋于大海之上",
        "skelNames": ["dahuangfengII_2_T", "dahuangfengII_2_B"],
        "pages": ["dahuangfengII_2_T.png", "dahuangfengII_2_B.png"]
    },
    "daofeng": {
        "chName": "岛风",
        "skelNames": ["daofengT", "daofengB"],
        "pages": ["daofengT.png", "daofengB.png"]
    },
    "deleike": {
        "chName": "德雷克",
        "skelNames": ["deleike"],
        "pages": ["deleike.png"]
    },
    "diliyasite_3": {
        "chName": "的里雅斯特_热气蒸腾温泉夜",
        "skelNames": ["diliyasite_3T", "diliyasite_3M", "diliyasite_3B"],
        "pages": ["diliyasite_3T.png", "diliyasite_3M.png", "diliyasite_3B.png"]
    },
    "duyisibao_2": {
        "chName": "杜伊斯堡_两人的秘密特训",
        "skelNames": ["duyisibao_2"],
        "pages": ["duyisibao_2.png"]
    },
    "fage_2": {
        "chName": "法戈_纯白热潮",
        "skelNames": ["fage_2"],
        "pages": ["fage_2.png"]
    },
    "feiteliedadi": {
        "chName": "腓特烈大帝",
        "skelNames": ["feiteliedadi"],
        "pages": ["feiteliedadi.png"]
    },
    "fengyun_2": {
        "chName": "风云_烟火之夜、静谧之海",
        "skelNames": ["fengyun_2_T", "fengyun_2_B"],
        "pages": ["fengyun_2_T.png", "fengyun_2_B.png"]
    },
    "fulici": {
        "chName": "弗里茨",
        "skelNames": ["fulici"],
        "pages": ["fulici.png", "fulici2.png", "fulici3.png"]
    },
    "fuluoxiluofu_2": {
        "chName": "伏罗希洛夫_山间暖雪",
        "skelNames": ["fuluoxiluofu_2"],
        "pages": ["fuluoxiluofu_2.png"]
    },
    "gangyishawa_2": {
        "chName": "冈依沙瓦号_被封印的美人鱼",
        "skelNames": ["gangyishawa_2"],
        "pages": ["gangyishawa_2.png", "gangyishawa_22.png"]
    },
    "gaoxiong_6": {
        "chName": "高雄_破魔舰术-神护",
        "skelNames": ["gaoxiong_6T", "gaoxiong_6B"],
        "pages": ["gaoxiong_6T.png", "gaoxiong_6T2.png", "gaoxiong_6B.png"]
    },
    "geluosite_3": {
        "chName": "格罗斯特_魅紫旋舞",
        "skelNames": ["geluosite_3"],
        "pages": ["geluosite_3.png"]
    },
    "guandao": {
        "chName": "关岛",
        "skelNames": ["guandaoT", "guandaoB"],
        "pages": ["guandaoT.png", "guandaoB.png"]
    },
    "haerbin_3": {
        "chName": "哈尔滨_奢享于盛夏之滨",
        "skelNames": ["haerbin_3"],
        "pages": ["haerbin_3.png"]
    },
    "hemuhao_2": {
        "chName": "和睦号_友好的弗兰肯",
        "skelNames": ["hemuhao_2"],
        "pages": ["hemuhao_2.png", "hemuhao_22.png"]
    },
    "huajia_2": {
        "chName": "华甲_欢乐喜庆僵尸夜",
        "skelNames": ["huajia_2T", "huajia_2M", "huajia_2B"],
        "pages": ["huajia_2T.png", "huajia_2M.png", "huajia_2B.png"]
    },
    "huanchang_2": {
        "chName": "寰昌_月下蹁跹",
        "skelNames": ["huanchang_2T", "huanchang_2B"],
        "pages": ["huanchang_2T.png", "huanchang_2T2.png", "huanchang_2B.png", "huanchang_2B2.png"]
    },
    "huangjiacaifu_3": {
        "chName": "皇家财富号_海边的约定",
        "skelNames": ["huangjiacaifu_3T", "huangjiacaifu_3B"],
        "pages": ["huangjiacaifu_3T.png", "huangjiacaifu_3B.png"]
    },
    "huben_2": {
        "chName": "虎贲_舞虎迎春",
        "skelNames": ["huben_2"],
        "pages": ["huben_2.png", "huben_22.png", "huben_23.png"]
    },
    "jianye_5": {
        "chName": "樫野_新鲜与甜蜜",
        "skelNames": ["jianye_5"],
        "pages": ["jianye_5.png"]
    },
    "jingang_5": {
        "chName": "金刚_海浪之下的意外",
        "skelNames": ["jingang_5"],
        "pages": ["jingang_5.png", "jingang_52.png"]
    },
    "kaiersheng_2": {
        "chName": "凯尔圣_阳光下的跑者",
        "skelNames": ["kaiersheng_2"],
        "pages": ["kaiersheng_2.png"]
    },
    "kaiersheng_3": {
        "chName": "凯尔圣_神圣的怜悯并非恶事",
        "skelNames": ["kaiersheng_3"],
        "pages": ["kaiersheng_3.png", "kaiersheng_32.png"]
    },
    "kalangshitade": {
        "chName": "喀琅施塔得",
        "skelNames": ["kalangshitade"],
        "pages": ["kalangshitade.png"]
    },
    "kewei_5": {
        "chName": "可畏_凌乱的秘密加演",
        "skelNames": ["kewei_5T", "kewei_5"],
        "pages": ["kewei_5T.png", "kewei_5.png", "kewei_52.png"]
    },
    "lafeiii": {
        "chName": "拉菲II",
        "skelNames": ["lafeiII"],
        "pages": ["lafeiII.png", "lafeiII2.png"]
    },
    "lafei_12": {
        "chName": "拉菲_白日慵懒",
        "skelNames": ["lafei_12T", "lafei_12B"],
        "pages": ["lafei_12T.png", "lafei_12B.png"]
    },
    "linglai_2": {
        "chName": "绫濑_兔子小姐的更衣时间",
        "skelNames": ["linglai_2"],
        "pages": ["linglai_2.png", "linglai_22.png"]
    },
    "luna_2_doa": {
        "chName": "露娜_沙滩上的女神",
        "skelNames": ["luna_2_doa"],
        "pages": ["luna_2_doa.png"]
    },
    "lundun_3": {
        "chName": "伦敦_高效工作时间",
        "skelNames": ["lundun_3"],
        "pages": ["lundun_3.png"]
    },
    "luyisiweier_2": {
        "chName": "路易斯维尔_梦幻推荐",
        "skelNames": ["luyisiweier_2"],
        "pages": ["luyisiweier_2.png"]
    },
    "mabuerheide_5": {
        "chName": "马布尔黑德_雨天的非偶然相遇",
        "skelNames": ["mabuerheide_5T", "mabuerheide_5B"],
        "pages": ["mabuerheide_5T.png", "mabuerheide_5B.png"]
    },
    "masaiqu_2": {
        "chName": "马赛曲_战斗天使的健身训练",
        "skelNames": ["masaiqu_2"],
        "pages": ["masaiqu_2.png"]
    },
    "mojiaduoer": {
        "chName": "莫加多尔",
        "skelNames": ["mojiaduoer"],
        "pages": ["mojiaduoer.png", "mojiaduoer2.png"]
    },
    "nabulesi": {
        "chName": "那不勒斯",
        "skelNames": ["nabulesi"],
        "pages": ["nabulesi.png", "nabulesi2.png"]
    },
    "naximofu": {
        "chName": "纳希莫夫海军上将",
        "skelNames": ["naximofu"],
        "pages": ["naximofu.png", "naximofu2.png"]
    },
    "ougen_7": {
        "chName": "欧根亲王_闪耀达阵",
        "skelNames": ["ougen_7"],
        "pages": ["ougen_7.png", "ougen_72.png"]
    },
    "pulimaosi": {
        "chName": "普利茅斯",
        "skelNames": ["pulimaosi_T", "pulimaosi_M", "pulimaosi_B"],
        "pages": ["pulimaosi_T.png", "pulimaosi_M.png", "pulimaosi_B.png"]
    },
    "qianwei": {
        "chName": "前卫",
        "skelNames": ["qianweiT", "qianweiB"],
        "pages": ["qianweiT.png", "qianweiB.png"]
    },
    "qiershazhi": {
        "chName": "奇尔沙治",
        "skelNames": ["qiershazhi"],
        "pages": ["qiershazhi.png", "qiershazhi2.png"]
    },
    "shengdiyage_g": {
        "chName": "圣地亚哥_改",
        "skelNames": ["shengdiyage_g"],
        "pages": ["shengdiyage_g.png"]
    },
    "suweiaitongmengnew": {
        "chName": "苏维埃同盟",
        "skelNames": ["suweiaitongmengNew"],
        "pages": ["suweiaitongmengNew.png", "suweiaitongmengNew2.png", "suweiaitongmengNew3.png", "suweiaitongmengNew4.png", "suweiaitongmengNew5.png"]
    },
    "tashigan_4": {
        "chName": "塔什干_独属于你的邀约",
        "skelNames": ["tashigan_4"],
        "pages": ["tashigan_4.png", "tashigan_42.png", "tashigan_43.png"]
    },
    "tiancheng_cv": {
        "chName": "天城（航母）",
        "skelNames": ["tiancheng_cv"],
        "pages": ["tiancheng_cv.png", "tiancheng_cv2.png", "tiancheng_cv3.png"]
    },
    "tuzuo_3": {
        "chName": "土佐_水色间的游曳",
        "skelNames": ["tuzuo_3"],
        "pages": ["tuzuo_3.png", "tuzuo_32.png"]
    },
    "u96_4": {
        "chName": "U-96_WOLFEN DOLLY",
        "skelNames": ["u96_4"],
        "pages": ["u96_4.png", "u96_42.png"]
    },
    "weida_2": {
        "chName": "维达号_慵懒的黑天使",
        "skelNames": ["weida_2"],
        "pages": ["weida_2.png", "weida_22.png", "weida_23.png"]
    },
    "weizhang_2": {
        "chName": "尾张_波光潋滟",
        "skelNames": ["weizhang_2T", "weizhang_2B"],
        "pages": ["weizhang_2T.png", "weizhang_2B.png"]
    },
    "wuerlixi": {
        "chName": "乌尔里希",
        "skelNames": ["wuerlixi"],
        "pages": ["wuerlixi.png"]
    },
    "wuerlixi_4": {
        "chName": "乌尔里希_在教室中等待",
        "skelNames": ["wuerlixi_4"],
        "pages": ["wuerlixi_4.png", "wuerlixi_42.png"]
    },
    "wuqi": {
        "chName": "吾妻",
        "skelNames": ["wuqi"],
        "pages": ["wuqi.png"]
    },
    "wuzang": {
        "chName": "武藏",
        "skelNames": ["wuzang1", "wuzang2", "wuzang3", "wuzang4", "wuzang5", "wuzang6", "wuzang7"],
        "pages": ["wuzang1.png", "wuzang2.png", "wuzang3.png", "wuzang4.png", "wuzang5.png", "wuzang6.png", "wuzang7.png"]
    },
    "xiafei_3": {
        "chName": "霞飞_至高乐园",
        "skelNames": ["xiafei_3T", "xiafei_3B"],
        "pages": ["xiafei_3T.png", "xiafei_3B.png"]
    },
    "xili_g": {
        "chName": "夕立_改",
        "skelNames": ["xili_g"],
        "pages": ["xili_g.png"]
    },
    "xingdengbao": {
        "chName": "兴登堡",
        "skelNames": ["xingdengbao"],
        "pages": ["xingdengbao.png", "xingdengbao2.png", "xingdengbao3.png", "xingdengbao4.png"]
    },
    "xingzuo_2": {
        "chName": "星座_星选之夜",
        "skelNames": ["xingzuo_2"],
        "pages": ["xingzuo_2.png"]
    },
    "xinnong": {
        "chName": "信浓",
        "skelNames": ["xinnongT", "xinnongB"],
        "pages": ["xinnongT.png", "xinnongB.png"]
    },
    "xinzexi": {
        "chName": "新泽西",
        "skelNames": ["xinzexi"],
        "pages": ["xinzexi.png"]
    },
    "yaerweite_2": {
        "chName": "亚尔薇特_灼热中的秘密",
        "skelNames": ["yaerweite_2"],
        "pages": ["yaerweite_2.png"]
    },
    "yanusi_4": {
        "chName": "雅努斯_踌躇的换衣时间",
        "skelNames": ["yanusi_4"],
        "pages": ["yanusi_4.png"]
    },
    "yanzhan_g": {
        "chName": "厌战_改",
        "skelNames": ["yanzhan_g"],
        "pages": ["yanzhan_g.png"]
    },
    "yindianna_2": {
        "chName": "印第安纳_酒馆大劫案",
        "skelNames": ["yindianna_2"],
        "pages": ["yindianna_2.png"]
    },
    "yixian_2": {
        "chName": "逸仙_膏发凝脂",
        "skelNames": ["yixian_2T", "yixian_2M", "yixian_2B"],
        "pages": ["yixian_2T.png", "yixian_2M.png", "yixian_2B.png"]
    },
    "yuanchou": {
        "chName": "怨仇",
        "skelNames": ["yuanchouT", "yuanchouB"],
        "pages": ["yuanchouT.png", "yuanchouB.png"]
    },
    "yuanchou_2": {
        "chName": "怨仇_办公室的“意外”",
        "skelNames": ["yuanchou_2"],
        "pages": ["yuanchou_2.png"]
    },
    "yuekechengii": {
        "chName": "约克城II",
        "skelNames": ["yukechengIIT", "yukechengIIM", "yukechengIIB"],
        "pages": ["yukechengIIT.png", "yukechengIIM.png", "yukechengIIB.png"]
    },
    "yuekechengii_2": {
        "chName": "约克城II_白昼美人鱼",
        "skelNames": ["yuekechengII_2T", "yuekechengII_2B"],
        "pages": ["yuekechengII_2T.png", "yuekechengII_2B.png"]
    },
    "yuekegongjue_4": {
        "chName": "约克公爵_渊智的指路人",
        "skelNames": ["yuekegongjue_4"],
        "pages": ["yuekegongjue_4.png"]
    },
    "yueke_ger_3": {
        "chName": "约克（铁血）_相伴于泳池之夜",
        "skelNames": ["yueke_ger_3"],
        "pages": ["yueke_ger_3.png", "yueke_ger_32.png"]
    },
    "yunxian": {
        "chName": "云仙",
        "skelNames": ["yunxian"],
        "pages": ["yunxian.png", "yunxian2.png"]
    },
    "z52": {
        "chName": "Z52",
        "skelNames": ["z52"],
        "pages": ["z52.png"]
    },
    "z52_2": {
        "chName": "Z52_疾驰而来的兔小姐",
        "skelNames": ["z52_2"],
        "pages": ["z52_2.png"]
    }
}

const ASSET_PREFIX = "https://ww-rm.github.io/azurlane_spinepainting/"
const CANVAS_SIZE = 4096
const BGCOLOR_DARK = [0.17, 0.26, 0.44, 1];
const BGCOLOR_LIGHT = [0.44, 0.62, 0.76, 1];
const DEFAULT_SKIN = "buli_super";

/** @type {HTMLCanvasElement} */
var canvas = document.getElementById("canvas-spine");

/** @type {HTMLSelectElement} */
var animationSelect = document.getElementById("animation-select");

/** @type {RenderingContext} */
var context = null;
var shader = null;
var batcher = null;
var renderer = null;
var assetManager = null;
var mvp = new spine.webgl.Matrix4();

var spineObjects = [];
var lastFrameTime = Date.now() / 1000;
var loadTask = null;

var mvpScale = 1;
var mvpTranslationX = 0;
var mvpTranslationY = 0;
var mvpX = 0;
var mvpY = 0;
var mvpW = CANVAS_SIZE;
var mvpH = CANVAS_SIZE;

var dragSrc = null; // 记录拖放源点
var pinchDistance = null; // 记录双指缩放距离

/** 计算骨骼包围盒 */
function calculateBounds(skeleton) {
    skeleton.setToSetupPose();
    skeleton.updateWorldTransform();
    var offset = new spine.Vector2();
    var size = new spine.Vector2();
    skeleton.getBounds(offset, size, []);
    return { offset: offset, size: size };
}

/** 加载骨骼和动画状态 */
function loadSpineObject(assetPrefix, skelUrl, atlasUrl) {
    var atlas = new spine.TextureAtlas(
        assetManager.get(atlasUrl),
        (path) => assetManager.get(assetPrefix + path)
    );
    var skeletonBinary = new spine.SkeletonBinary(new spine.AtlasAttachmentLoader(atlas));
    var skeletonData = skeletonBinary.readSkeletonData(assetManager.get(skelUrl));
    var animationNames = skeletonData.animations.map(e => e.name);

    var skeleton = new spine.Skeleton(skeletonData);
    var bounds = calculateBounds(skeleton);
    var animationState = new spine.AnimationState(new spine.AnimationStateData(skeleton.data));

    return { skeleton: skeleton, state: animationState, bounds: bounds, animations: animationNames };
}

/** 重置显示位置 */
function resize() {
    var offsetX = spineObjects.length ? Math.min(...spineObjects.map(e => e.bounds.offset.x)) : 0;
    var offsetY = spineObjects.length ? Math.min(...spineObjects.map(e => e.bounds.offset.y)) : 0;
    var sizeX = spineObjects.length ? Math.max(...spineObjects.map(e => e.bounds.size.x)) : canvas.width;
    var sizeY = spineObjects.length ? Math.max(...spineObjects.map(e => e.bounds.size.y)) : canvas.height;
    var centerX = offsetX + sizeX / 2;
    var centerY = offsetY + sizeY / 2;
    var scale = Math.max(sizeX / canvas.width, sizeY / canvas.height);

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
    var centerX = mvpX + mvpW / 2 - mvpTranslationX;
    var centerY = mvpY + mvpH / 2 - mvpTranslationY;
    var w = mvpW / mvpScale;
    var h = mvpH / mvpScale;
    var x = centerX - w / 2;
    var y = centerY - h / 2;

    console.debug("updateMvp: ", x, y, w, h);
    mvp.ortho2d(x, y, w, h);
}

/** 渲染循环 */
function render() {
    var now = Date.now() / 1000;
    var delta = now - lastFrameTime;
    lastFrameTime = now;

    context.clear(context.COLOR_BUFFER_BIT);

    // 倒序渲染所有骨骼动画
    for (var i = spineObjects.length - 1; i >= 0; i--) {
        var obj = spineObjects[i];
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
    if (!assetManager)
        return;

    if (!ASSET_MAPPING[skinName]) {
        console.error(skinName, "not found");
        return;
    }
    var assetPrefix = ASSET_PREFIX + skinName + "/";
    var _SKEL = (name) => assetPrefix + name + ".skel";
    var _ATLAS = (name) => assetPrefix + name + ".atlas";

    var skelNames = ASSET_MAPPING[skinName].skelNames;
    var pages = ASSET_MAPPING[skinName].pages;

    skelNames.forEach(e => {
        assetManager.loadBinary(_SKEL(e));
        assetManager.loadText(_ATLAS(e));
    });
    pages.forEach(e => {
        assetManager.loadTexture(assetPrefix + e);
    })

    if (loadTask) {
        console.log(loadTask);
        console.log("remove last loadTask");
        clearInterval(loadTask);
        loadTask = null;
        return;
    }

    loadTask = setInterval(function () {
        if (assetManager.isLoadingComplete()) {
            spineObjects = [];
            skelNames.forEach(skelName => {
                try {
                    var spObj = loadSpineObject(assetPrefix, _SKEL(skelName), _ATLAS(skelName));
                    spineObjects.push(spObj);
                } catch (error) {
                    console.error(skinName, skelName, "load failed.");
                    console.error(error);
                }
            });

            // 资源加载完毕
            resize();
            setAnimationList();
            clearInterval(loadTask);
            loadTask = null;
        }
    }, 100);
}

/** 链接点击事件 */
function changeSkinHandler(event) {
    loadSkin(event.target.getAttribute('data-key'));
}

/** canvas 缩放事件 */
function canvasWheelHandler(event) {
    event.preventDefault();
    var scale = mvpScale * (1 - event.deltaY / 500);
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

    var deltaX = event.clientX - dragSrc.x;
    var deltaY = -(event.clientY - dragSrc.y);

    var scaleX = (mvpW / canvas.clientWidth) / mvpScale;
    var scaleY = (mvpH / canvas.clientHeight) / mvpScale;

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
    var dx = touches[0].clientX - touches[1].clientX;
    var dy = touches[0].clientY - touches[1].clientY;
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
        var newDistance = getDistance(event.touches);
        var scale = mvpScale * (newDistance / pinchDistance);
        mvpScale = Math.max(Math.min(scale, 100), 0.1);
        updateMvp();
        pinchDistance = newDistance; // 更新初始距离
    } else if (event.touches.length === 1 && dragSrc) {
        // 处理单指拖动
        var deltaX = event.touches[0].clientX - dragSrc.x;
        var deltaY = -(event.touches[0].clientY - dragSrc.y);

        var scaleX = (mvpW / canvas.clientWidth) / mvpScale;
        var scaleY = (mvpH / canvas.clientHeight) / mvpScale;

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

    var animationNames = spineObjects[0].animations;

    animationSelect.innerHTML = "";
    animationNames.forEach(name => {
        var option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        animationSelect.appendChild(option);
    });

    var initAnimation = animationNames[animationNames.length - 1];
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
    var value = document.querySelector('input[name="bgcolor"]:checked').value;
    setBackgroundColor(value);
}

function main() {
    // 生成皮肤列表
    var container = document.getElementById("shipnames-container");
    for (var key in ASSET_MAPPING) {
        value = ASSET_MAPPING[key];
        var link = document.createElement("a");
        link.href = "javascript:void(0)";
        link.textContent = value.chName;
        link.setAttribute("data-key", key);
        link.onclick = changeSkinHandler;
        container.appendChild(link);
    }

    // 创建绘图资源
    var config = { alpha: false };
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
        assetManager = new spine.webgl.AssetManager(context);
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

    // 事件绑定
    canvas.onwheel = canvasWheelHandler;
    canvas.onmousedown = canvasMouseDown;
    canvas.onmousemove = canvasMouseMove;
    canvas.onmouseup = canvasMouseUp;
    canvas.onmouseleave = canvasMouseUp;
    canvas.ontouchstart = canvasTouchStart;
    canvas.ontouchmove = canvasTouchMove;
    canvas.ontouchend = canvasTouchEnd;
    animationSelect.onchange = animationSelectChange;
    document.getElementsByName("bgcolor").forEach((radio) => {
        radio.onchange = backgroundColorChange;
    })

    // 加载一个默认皮肤
    loadSkin(DEFAULT_SKIN);
    render();
}

(function () { main(); }());
