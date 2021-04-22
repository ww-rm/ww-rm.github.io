function f(sent) {
    document.writeln(sent);
}

const f2 = () => 1;
f(f2.toString())
let a = new Im