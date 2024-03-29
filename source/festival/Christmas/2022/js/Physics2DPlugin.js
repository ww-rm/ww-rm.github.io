! function (e, i) {
    "object" == typeof exports && "undefined" != typeof module ? i(exports) : "function" == typeof define && define.amd ? define(["exports"], i) : i((e = e || self).window = e.window || {})
}(this, function (e) {
    "use strict";

    function h() {
        return s || "undefined" != typeof window && (s = window.gsap) && s.registerPlugin && s
    }

    function i(e) {
        return Math.round(1e4 * e) / 1e4
    }

    function l() {
        return String.fromCharCode.apply(null, arguments)
    }

    function o(e) {
        s = e || h(), u || (r = s.utils.getUnit, u = 1)
    }

    function p(e, i, t, n, l) {
        var s = e._gsap,
            o = s.get(e, i);
        this.p = i, this.set = s.set(e, i), this.s = this.val = parseFloat(o), this.u = r(o) || 0, this.vel = t || 0, this.v = this.vel / l, n || 0 === n ? (this.acc = n, this.a = this.acc / (l * l)) : this.acc = this.a = 0
    }
    var s, u, r, d = Math.PI / 180,
        a = "Physics2DPlugin",
        c = l(103, 114, 101, 101, 110, 115, 111, 99, 107, 46, 99, 111, 109),
        t = (function (e) {

        }(window ? window.location.host : ""), {
            version: "3.8.0",
            name: "physics2D",
            register: o,
            init: function init(e, i, t) {
                u || o();
                var n = this,
                    l = +i.angle || 0,
                    s = +i.velocity || 0,
                    r = +i.acceleration || 0,
                    a = i.xProp || "x",
                    c = i.yProp || "y",
                    f = i.accelerationAngle || 0 === i.accelerationAngle ? +i.accelerationAngle : l;
                n.target = e, n.tween = t, n.step = 0, n.sps = 30, i.gravity && (r = +i.gravity, f = 90), l *= d, f *= d, n.fr = 1 - (+i.friction || 0), n._props.push(a, c), n.xp = new p(e, a, Math.cos(l) * s, Math.cos(f) * r, n.sps), n.yp = new p(e, c, Math.sin(l) * s, Math.sin(f) * r, n.sps), n.skipX = n.skipY = 0
            },
            render: function render(e, t) {
                var n, l, s, o, r, a, c = t.xp,
                    p = t.yp,
                    f = t.tween,
                    u = t.target,
                    d = t.step,
                    h = t.sps,
                    v = t.fr,
                    w = t.skipX,
                    g = t.skipY,
                    y = f._from ? f._dur - f._time : f._time;
                if (1 === v) s = y * y * .5, n = c.s + c.vel * y + c.acc * s, l = p.s + p.vel * y + p.acc * s;
                else {
                    for (o = a = (0 | (y *= h)) - d, a < 0 && (c.v = c.vel / h, p.v = p.vel / h, c.val = c.s, p.val = p.s, o = a = (t.step = 0) | y), r = y % 1 * v; a--;) c.v += c.a, p.v += p.a, c.v *= v, p.v *= v, c.val += c.v, p.val += p.v;
                    n = c.val + c.v * r, l = p.val + p.v * r, t.step += o
                }
                w || c.set(u, c.p, i(n) + c.u), g || p.set(u, p.p, i(l) + p.u)
            },
            kill: function kill(e) {
                this.xp.p === e && (this.skipX = 1), this.yp.p === e && (this.skipY = 1)
            }
        });
    h() && s.registerPlugin(t), e.Physics2DPlugin = t, e.default = t;
    if (typeof (window) === "undefined" || window !== e) {
        Object.defineProperty(e, "__esModule", {
            value: !0
        })
    } else {
        delete e.default
    }
});