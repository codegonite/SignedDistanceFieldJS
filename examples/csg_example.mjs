// import * as sdf from "sdfjs";
import * as sdf from "../src/index.js";

const field = sdf.box(20, 20, 20)
    .intersectionSmooth(0.5, sdf.sphere(13))
        .setSmoothingMethod(sdf.SMOOTHING_METHOD_QUADRATIC)
    .differenceSmooth(0.5,
        sdf.cylinder(6, 20),
        sdf.cylinder(6, 20).rotateX(Math.PI / 2),
        sdf.cylinder(6, 20).rotateY(Math.PI / 2),
    )
    .setSmoothingMethod(sdf.SMOOTHING_METHOD_QUADRATIC)

console.log(field);

const mesh = sdf.triangulateSignedDistanceField(field, field.bounding_box, 8, 0.01);

console.log(mesh);

const buffer = sdf.convertToSTL(mesh);

console.log(buffer);

import fs from "node:fs";

fs.writeFileSync("csg.stl", buffer);
