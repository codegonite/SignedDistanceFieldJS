import * as sdf from "../src/index.js";
import fs from "node:fs";

const LAYER_HEIGHT = 0.25;

class HexSocketBoltProfile {
    constructor({
        headDiameter =  5.75,
        headThickness = 3.00,
        boltDiameter =  3.00,
    }) {
        this.headDiameter = headDiameter;
        this.headThickness = headThickness;
        this.boltDiameter = boltDiameter;
    }

    hole(length, bridgingStepDepth = null) {
        let result = sdf.cylinder(0.5 * this.headDiameter, this.headThickness);

        result = result.union(
            sdf.cylinder(0.5 * this.boltDiameter, length).translate(0, 0, (length + this.headThickness) / 2),
        );

        if (bridgingStepDepth !== null || bridgingStepDepth !== undefined) {
            result = result.union(
                sdf.cylinder(0.5 * this.headDiameter, 2 * length).intersection(
                    new sdf.UnionSignedDistanceField3([
                        sdf.box(this.headDiameter, this.boltDiameter, bridgingStepDepth).translate(0, 0, 0.5 * (this.headThickness +     bridgingStepDepth)),
                        sdf.box(this.boltDiameter, this.boltDiameter, bridgingStepDepth).translate(0, 0, 0.5 * (this.headThickness + 3 * bridgingStepDepth)),
                    ])
                )
            );
        }

        return result;
    }
}

const HexSocketProfileM3 = new HexSocketBoltProfile({
    headDiameter:  5.50,
    headThickness: 2.50,
    boltDiameter:  3.00,
});

const HexSocketProfileM5 = new HexSocketBoltProfile({
    headDiameter:  8.50,
    headThickness: 5.00,
    boltDiameter:  5.00,
});

function nutT8() {
    return new sdf.UnionSignedDistanceField3([
        sdf.cylinder(0.5 * 22.0, 3.50).translate(0, 0,  3.5 / 2),
        sdf.cylinder(0.5 * 10.2, 10.0).translate(0, 0, 13.5 / 2),
    ]);
}

function main() {
    const PLATE_THICKNESS = 13;
    const PLATE_HEIGHT = 50;
    const PLATE_WIDTH = 65;
    let result = sdf.box(PLATE_WIDTH, PLATE_HEIGHT, PLATE_THICKNESS).translate(0, 0, PLATE_THICKNESS / 2);

    // result = result.difference(
    //     HexSocketProfileM3.hole(20, LAYER_HEIGHT),
    //     HexSocketProfileM3.hole(20, LAYER_HEIGHT),
    //     HexSocketProfileM3.hole(20, LAYER_HEIGHT),
    //     HexSocketProfileM3.hole(20, LAYER_HEIGHT),
    //     HexSocketProfileM3.hole(20, LAYER_HEIGHT),
    //     HexSocketProfileM3.hole(20, LAYER_HEIGHT),
    //     HexSocketProfileM3.hole(20, LAYER_HEIGHT),
    //     HexSocketProfileM3.hole(20, LAYER_HEIGHT)
    // );

    // result = result.difference(
    //     HexSocketProfileM3.hole(20, LAYER_HEIGHT),
    //     HexSocketProfileM3.hole(20, LAYER_HEIGHT),
    //     HexSocketProfileM3.hole(20, LAYER_HEIGHT),
    //     HexSocketProfileM3.hole(20, LAYER_HEIGHT),
    // );

    result = result.difference(
        sdf.cylinder(0.5 * 9).rotateX(Math.PI / 2),
        nutT8().rotateX(Math.PI / 2).translate(0, -PLATE_HEIGHT / 2, 0),
    );

    return result;
}

const result = main();
const mesh   = sdf.triangulateSignedDistanceField(result, result.boundingBox, 8, 0.005);
const buffer = sdf.convertToSTL(mesh);

console.log(result);
fs.writeFileSync("XZ_Gantry.stl", buffer);
