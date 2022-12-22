! function (e, n) {
    "object" == typeof exports && "undefined" != typeof module ? n(exports) : "function" == typeof define && define.amd ? define(["exports"], n) : n((e = e || self).window = e.window || {})
}(this, function (e) {
    "use strict";

    function f() {
        return w || "undefined" != typeof window && (w = window.gsap) && w.registerPlugin && w
    }

    function g(e, n) {
        return !!(void 0 === e ? n : e && !~(e + "").indexOf("false"))
    }

    function h(e) {
        if (w = e || f()) {
            r = w.registerEase;
            var n, t = w.parseEase(),
                o = function createConfig(t) {
                    return function (e) {
                        var n = .5 + e / 2;
                        t.config = function (e) {
                            return t(2 * (1 - e) * e * n + e * e)
                        }
                    }
                };
            for (n in t) t[n].config || o(t[n]);
            for (n in r("slow", a), r("expoScale", s), r("rough", u), c) "version" !== n && w.core.globals(n, c[n])
        }
    }

    function i(e, n, t) {
        var o = (e = Math.min(1, e || .7)) < 1 ? n || 0 === n ? n : .7 : 0,
            r = (1 - e) / 2,
            i = r + e,
            a = g(t);
        return function (e) {
            var n = e + (.5 - e) * o;
            return e < r ? a ? 1 - (e = 1 - e / r) * e : n - (e = 1 - e / r) * e * e * e * n : i < e ? a ? 1 === e ? 0 : 1 - (e = (e - i) / r) * e : n + (e - n) * (e = (e - i) / r) * e * e * e : a ? 1 : n
        }
    }

    function j(n, e, t) {
        var o = Math.log(e / n),
            r = e - n;
        return t = t && w.parseEase(t),
            function (e) {
                return (n * Math.exp(o * (t ? t(e) : e)) - n) / r
            }
    }

    function k(e, n, t) {
        this.t = e, this.v = n, t && (((this.next = t).prev = this).c = t.v - n, this.gap = t.t - e)
    }

    function l(e) {
        "object" != typeof e && (e = {
            points: +e || 20
        });
        for (var n, t, o, r, i, a, f, s = e.taper || "none", u = [], c = 0, p = 0 | (+e.points || 20), l = p, v = g(e.randomize, !0), d = g(e.clamp), h = w ? w.parseEase(e.template) : 0, x = .4 * (+e.strength || 1); - 1 < --l;) n = v ? Math.random() : 1 / p * l, t = h ? h(n) : n, o = "none" === s ? x : "out" === s ? (r = 1 - n) * r * x : "in" === s ? n * n * x : n < .5 ? (r = 2 * n) * r * .5 * x : (r = 2 * (1 - n)) * r * .5 * x, v ? t += Math.random() * o - .5 * o : l % 2 ? t += .5 * o : t -= .5 * o, d && (1 < t ? t = 1 : t < 0 && (t = 0)), u[c++] = {
            x: n,
            y: t
        };
        for (u.sort(function (e, n) {
                return e.x - n.x
            }), a = new k(1, 1, null), l = p; l--;) i = u[l], a = new k(i.x, i.y, a);
        return f = new k(0, 0, a.t ? a : a.next),
            function (e) {
                var n = f;
                if (e > n.t) {
                    for (; n.next && e >= n.t;) n = n.next;
                    n = n.prev
                } else
                    for (; n.prev && e <= n.t;) n = n.prev;
                return (f = n).v + (e - n.t) / n.gap * n.c
            }
    }
    var w, r, a = i(.7);
    (a.ease = a).config = i;
    var s = j(1, 2);
    s.config = j;
    var u = l();
    (u.ease = u).config = l;
    var c = {
        SlowMo: a,
        RoughEase: u,
        ExpoScaleEase: s
    };
    for (var n in c) c[n].register = h, c[n].version = "3.0.0";
    f() && w.registerPlugin(a), e.EasePack = c, e.ExpoScaleEase = s, e.RoughEase = u, e.SlowMo = a, e.default = c, Object.defineProperty(e, "__esModule", {
        value: !0
    })
});