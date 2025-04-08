import * as sdf from "sdfjs";

let field = sdf.box(20, 20, 20);

field = field
    .intersection(sdf.sphere(13))
    .setSmoothingMethod(new sdf.SmoothingMethodQuadratic(0.10));

field = field.difference(
    sdf.cylinder(6, 20),
    sdf.cylinder(6, 20).rotateX(Math.PI / 2),
    sdf.cylinder(6, 20).rotateY(Math.PI / 2),
).setSmoothingMethod(new sdf.SmoothingMethodQuadratic(0.5))

const mesh = sdf.triangulateSignedDistanceField(
    field, // The signed distance field to sample from
    field.bounding_box, // The bounding box which to sample within
    8, // The subdivision count of the root node / maximum depth for the octree
    null // Merge theshold for adaptive sampling
);

// Create a buffer representing the mesh in stl file format
const buffer = sdf.convertToSTL(mesh);

// Print the buffer to the console
console.log(buffer);
