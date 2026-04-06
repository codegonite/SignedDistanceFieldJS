import * as sdf from "../src/index.js";
import fs from "node:fs";

let field = sdf.box(20, 20, 20);

field = field
    .intersection(sdf.sphere(13))
    .setSmoothingMethod(new sdf.SmoothingMethodQuadratic(0.10));

field = field.difference(
    sdf.cylinder(5, 40).union(
        sdf.cylinder(5, 40).rotateX(Math.PI / 2),
        sdf.cylinder(5, 40).rotateY(Math.PI / 2),
    ).setSmoothingMethod(new sdf.SmoothingMethodQuadratic(0.10)),
).setSmoothingMethod(
    new sdf.SmoothingMethodCombine(
        new sdf.SmoothingMethodChamfer(1),
        new sdf.SmoothingMethodQuadratic(0.10)
    )
);

const mesh = sdf.triangulateSignedDistanceField(
    field, // The signed distance field to sample from
    field.boundingBox, // The bounding box which to sample within
    8, // The subdivision count of the root node / maximum depth for the octree
    0.01 // Merge threshold for adaptive sampling
);

// Create a buffer representing the mesh in stl file format
const buffer = sdf.convertToSTL(mesh);

// Print the buffer to the console
fs.writeFileSync("test.stl", buffer);
