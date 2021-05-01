import json
import sys
from argparse import ArgumentParser
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from warnings import warn

if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("-i", "--input_dir", default="pages", type=str, help="the input dir")
    parser.add_argument("-o", "--output_dir", default="docs", type=str, help="the output dir")

    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(exist_ok=True)

    # get targets files under input dir
    targets = ["**/*.*"]
    targets_filename = "targets.json"
    targets_path = input_dir.joinpath(targets_filename)
    if targets_path.exists():
        with targets_path.open("r", encoding="utf8") as f:
            targets = json.load(f)
    else:
        warn("The '{}' not found, all files under {} will be generated.".format(targets_filename, input_dir.as_posix()))

    # begin renderring
    total = 0
    processed = 0
    env = Environment(loader=FileSystemLoader(input_dir.as_posix(), encoding="utf8"))
    for target in targets:
        for filepath in input_dir.glob(target):
            total += 1
            filepath = filepath.relative_to(input_dir)

            # get input path and output path
            input_path = input_dir.joinpath(filepath)
            output_path = output_dir.joinpath(filepath)
            output_path.parent.mkdir(exist_ok=True)

            # render
            print(filepath.as_posix())
            output_path.write_text(env.get_template(filepath.as_posix()).render(), encoding="utf8")
            processed += 1

    print("Total: {} Processed: {}".format(total, processed))
