! function (e, t) {
    "object" == typeof exports && "undefined" != typeof module ? t(exports) : "function" == typeof define && define.amd ? define(["exports"], t) : t((e = e || self).window = e.window || {})
}(this, function (e) {
    "use strict";

    function j() {
        return "undefined" != typeof window
    }

    function k() {
        return r || j() && (r = window.gsap) && r.registerPlugin && r
    }

    function n(e) {
        return Math.round(1e4 * e) / 1e4
    }

    function o(e) {
        return parseFloat(e) || 0
    }

    function p(e, t) {
        var n = o(e);
        return ~e.indexOf("%") ? n / 100 * t : n
    }

    function q(e, t) {
        return o(e.getAttribute(t))
    }

    function s(e, t, n, r, i, s) {
        return M(Math.pow((o(n) - o(e)) * i, 2) + Math.pow((o(r) - o(t)) * s, 2))
    }

    function t(e) {
        return console.warn(e)
    }

    function u(e) {
        return "non-scaling-stroke" === e.getAttribute("vector-effect")
    }

    function x() {
        return String.fromCharCode.apply(null, arguments)
    }

    function B(e) {
        if (!(e = v(e)[0])) return 0;
        var r, i, o, a, d, f, h, l = e.tagName.toLowerCase(),
            c = e.style,
            x = 1,
            g = 1;
        u(e) && (g = e.getScreenCTM(), x = M(g.a * g.a + g.b * g.b), g = M(g.d * g.d + g.c * g.c));
        try {
            i = e.getBBox()
        } catch (e) {
            t("Some browsers won't measure invisible elements (like display:none or masks inside defs).")
        }
        var p = i || {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            },
            w = p.x,
            _ = p.y,
            y = p.width,
            m = p.height;
        if (i && (y || m) || !O[l] || (y = q(e, O[l][0]), m = q(e, O[l][1]), "rect" !== l && "line" !== l && (y *= 2, m *= 2), "line" === l && (w = q(e, "x1"), _ = q(e, "y1"), y = Math.abs(y - w), m = Math.abs(m - _))), "path" === l) a = c.strokeDasharray, c.strokeDasharray = "none", r = e.getTotalLength() || 0, n(x) !== n(g) && !b && (b = 1) && t("Warning: <path> length cannot be measured when vector-effect is non-scaling-stroke and the element isn't proportionally scaled."), r *= (x + g) / 2, c.strokeDasharray = a;
        else if ("rect" === l) r = 2 * y * x + 2 * m * g;
        else if ("line" === l) r = s(w, _, w + y, _ + m, x, g);
        else if ("polyline" === l || "polygon" === l)
            for (o = e.getAttribute("points").match(P) || [], "polygon" === l && o.push(o[0], o[1]), r = 0, d = 2; d < o.length; d += 2) r += s(o[d - 2], o[d - 1], o[d], o[d + 1], x, g) || 0;
        else "circle" !== l && "ellipse" !== l || (f = y / 2 * x, h = m / 2 * g, r = Math.PI * (3 * (f + h) - M((3 * f + h) * (f + 3 * h))));
        return r || 0
    }

    function C(e, t) {
        if (!(e = v(e)[0])) return [0, 0];
        t = t || B(e) + 1;
        var n = d.getComputedStyle(e),
            r = n.strokeDasharray || "",
            i = o(n.strokeDashoffset),
            s = r.indexOf(",");
        return s < 0 && (s = r.indexOf(" ")), t < (r = s < 0 ? t : o(r.substr(0, s))) && (r = t), [-i || 0, r - i || 0]
    }

    function D() {
        j() && (d = window, h = r = k(), v = r.utils.toArray, f = -1 !== ((d.navigator || {}).userAgent || "").indexOf("Edge"))
    }
    var r, v, d, f, h, b, P = /[-+=\.]*\d+[\.e\-\+]*\d*[e\-\+]*\d*/gi,
        O = {
            rect: ["width", "height"],
            circle: ["r", "r"],
            ellipse: ["rx", "ry"],
            line: ["x2", "y2"]
        },
        M = Math.sqrt,
        a = "DrawSVGPlugin",
        l = x(103, 114, 101, 101, 110, 115, 111, 99, 107, 46, 99, 111, 109),
        c = function (e) {
            
        }("undefined" != typeof window ? window.location.host : ""),
        i = {
            version: "3.10.4",
            name: "drawSVG",
            register: function register(e) {
                r = e, D()
            },
            init: function init(e, t) {
                if (!e.getBBox) return !1;
                h || D();
                var r, i, s, a = B(e);
                return this._style = e.style, this._target = e, t + "" == "true" ? t = "0 100%" : t ? -1 === (t + "").indexOf(" ") && (t = "0 " + t) : t = "0 0", i = function _parse(e, t, n) {
                    var r, i, o = e.indexOf(" ");
                    return i = o < 0 ? (r = void 0 !== n ? n + "" : e, e) : (r = e.substr(0, o), e.substr(o + 1)), r = p(r, t), (i = p(i, t)) < r ? [i, r] : [r, i]
                }(t, a, (r = C(e, a))[0]), this._length = n(a), this._dash = n(r[1] - r[0]), this._offset = n(-r[0]), this._dashPT = this.add(this, "_dash", this._dash, n(i[1] - i[0])), this._offsetPT = this.add(this, "_offset", this._offset, n(-i[0])), f && (s = d.getComputedStyle(e)).strokeLinecap !== s.strokeLinejoin && (i = o(s.strokeMiterlimit), this.add(e.style, "strokeMiterlimit", i, i + .01)), this._live = u(e) || ~(t + "").indexOf("live"), this._nowrap = ~(t + "").indexOf("nowrap"), this._props.push("drawSVG"), c
            },
            render: function render(e, t) {
                var n, r, i, o, s = t._pt,
                    a = t._style;
                if (s) {
                    for (t._live && (n = B(t._target)) !== t._length && (r = n / t._length, t._length = n, t._offsetPT && (t._offsetPT.s *= r, t._offsetPT.c *= r), t._dashPT ? (t._dashPT.s *= r, t._dashPT.c *= r) : t._dash *= r); s;) s.r(e, s.d), s = s._next;
                    i = t._dash || e && 1 !== e && 1e-4 || 0, n = t._length - i + .1, o = t._offset, i && o && i + Math.abs(o % t._length) > t._length - .2 && (o += o < 0 ? .1 : -.1) && (n += .1), a.strokeDashoffset = i ? o : o + .001, a.strokeDasharray = n < .2 ? "none" : i ? i + "px," + (t._nowrap ? 999999 : n) + "px" : "0px, 999999px"
                }
            },
            getLength: B,
            getPosition: C
        };
    k() && r.registerPlugin(i), e.DrawSVGPlugin = i, e.default = i;
    if (typeof (window) === "undefined" || window !== e) {
        Object.defineProperty(e, "__esModule", {
            value: !0
        })
    } else {
        delete e.default
    }
});