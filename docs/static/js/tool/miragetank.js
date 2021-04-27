const MirageTank = {
    verbose: function (process, percent) {},
    _mergeImg: function (_cover, _secret, _dst) {
        // convert type
        const cover = new cv.Mat();
        const secret = new cv.Mat();
        _cover.convertTo(cover, cv.CV_64FC1);
        _secret.convertTo(secret, cv.CV_64FC1);

        // check for min(delta) >= 0, adjust pixels
        let c_min = 255;
        let s_max = 0;
        cover.data64F.forEach(e => c_min = Math.min(e, c_min));
        secret.data64F.forEach(e => s_max = Math.max(e, s_max));

        // adjust pixels, cover: [128, 255], secret: [0, 128]
        cover.data64F.forEach((e, i, a) => a[i] = e + ((128 - c_min) / (256 - c_min) ** 2) * (256 - e) ** 2)
        secret.data64F.forEach((e, i, a) => a[i] = e - ((s_max - 128) / s_max ** 2) * (e ** 2))

        // delta = cover - secret
        const mirage_a = new cv.Mat();
        cv.subtract(cover, secret, mirage_a);
        mirage_a.data64F.forEach((e, i, a) => a[i] = 255 - e);
        const mirage_grey = new cv.Mat(mirage_a.size(), mirage_a.type());
        mirage_grey.data64F.forEach((e, i, a) => a[i] = 255 * secret.data64F[i] / mirage_a.data64F[i]);

        // merge and convert to 8U4C
        const mat_vector = new cv.MatVector();
        mat_vector.push_back(mirage_grey);
        mat_vector.push_back(mirage_grey);
        mat_vector.push_back(mirage_grey);
        mat_vector.push_back(mirage_a);
        cv.merge(mat_vector, _dst);
        _dst.convertTo(_dst, cv.CV_8UC4);

        // free memory
        mat_vector.delete();
        mirage_grey.delete();
        mirage_a.delete();
        secret.delete();
        cover.delete();
    },
    _adjustimg: function (_cover, _secret) {
        cv.cvtColor(_cover, _cover, cv.COLOR_RGBA2GRAY);
        cv.cvtColor(_secret, _secret, cv.COLOR_RGBA2GRAY);

        const s_height = _secret.size().height;
        const s_width = _secret.size().width;

        let c_height = _cover.size().height;
        let c_width = _cover.size().width;

        if (c_height < s_height) {
            cv.resize(
                _cover, _cover,
                new cv.Size(Math.round(c_width * s_height / c_height), s_height),
                interpolation = cv.INTER_CUBIC
            );
            c_height = _cover.size().height;
            c_width = _cover.size().width;
        }

        if (c_width < s_width) {
            cv.resize(
                _cover, _cover,
                new cv.Size(s_width, Math.round(c_height * s_width / c_width)),
                interpolation = cv.INTER_CUBIC
            );
            c_height = _cover.size().height;
            c_width = _cover.size().width;
        }

        const delta_height = c_height - s_height;
        const delta_width = c_width - s_width;
        cv.copyMakeBorder(
            _secret, _secret,
            Math.floor(delta_height / 2), Math.ceil(delta_height / 2),
            Math.floor(delta_width / 2), Math.ceil(delta_width / 2),
            cv.BORDER_CONSTANT, [0, 0, 0, 0]
        );
    },
    makeimg: function (cover, secret) {
        cover = cover.clone();
        secret = secret.clone();
        const mirage = new cv.Mat();
        MirageTank._adjustimg(cover, secret);
        MirageTank._mergeImg(cover, secret, mirage);
        cover.delete();
        secret.delete();
        return mirage;
    }
}
