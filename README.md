# Signed Distance Field (SDF) JavaScript Library

A Signed Distance Field 3D modeler implemented using JavaScript.

## Overview

Signed Distance Fields (SDFs) represent 3D surfaces as implicit functions, which can be used to define and manipulate complex shapes. This library provides tools to perform boolean operations (intersection, union, difference) on SDFs and convertion to meshes using different algorithms.

Key features include:

- **Boolean Operations**: Perform intersection, union, and difference on SDFs.
- **Mesh Conversion Using Surface Nets**: Convertion of signed distance fields to meshes using the surface nets algorithm.
- **Mesh Output as STL or OBJ**: Meshes can be exported in stl or obj format.

For more information on implicit functions and SDFs, you can refer to [this Wikipedia article](https://en.wikipedia.org/wiki/Implicit_function).

## Examples

See [Csg Example](https://github.com/codegonite/SignedDistanceFieldJS/blob/master/examples/csg_example.js) for an example usage of this library.

```js
import * as sdf from "sdfjs";

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
console.log(buffer);
```

![CSG-EXAMPLE-PHOTO](https://github.com/codegonite/SignedDistanceFieldJS/blob/master/images/CSG-Example00.png)

## License

[GNU GENERAL PUBLIC LICENSE (GNU)](https://github.com/codegonite/SignedDistanceFieldJS/blob/master/LICENSE)
