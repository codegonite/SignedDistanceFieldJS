// https://iquilezles.org/articles/distfunctions/
// https://iquilezles.org/articles/distfunctions2d/
// https://iquilezles.org/articles/smin/
// https://iquilezles.org/articles/raymarchingdf/

const EPSILON = 1e-6
const INV_TWO_EPSILON = 1 / (2 * EPSILON)

const SAMPLE_OCTREE_KIND_FULL    = 0x01
const SAMPLE_OCTREE_KIND_EMPTY   = 0x02
const SAMPLE_OCTREE_KIND_ROOT    = 0x04
const SAMPLE_OCTREE_KIND_LEAF    = 0x08

const SAMPLE_OCTREE_FULL_OR_EMPTY = SAMPLE_OCTREE_KIND_FULL | SAMPLE_OCTREE_KIND_EMPTY

const ALL_SAMPLES_INSIDE = 0xFF
const ALL_SAMPLES_OUTSIDE = 0x00

const STL_HEADER_SIZE = 80
const STL_TRIANGLE_OFFSET = 84
const STL_BYTES_PER_TRIANGLE = 50

const INTERSECTION_DEPTH_MAX = 256

const ONE_MINUS_INV_SQRT2 = 0.2928932188134524
const LOG2                = 0.6931471805599453

export function clamp(value, min, max) {
    if (value > max) return max
    if (value < min) return min
    return value
}

export function lerp(a, b, t) {
    return (b - a) * t + a
}

export function distanceFromOrigin(x, y, z) {
    return Math.sqrt(x*x + y*y + z*z)
}

export function smoothMinExp(a, b, k) {
    const exp2a = Math.pow(2, -a / k)
    const exp2b = Math.pow(2, -b / k)
    const r = exp2a + exp2b
    return -k * Math.log2(r)
}

export function smoothMinRoot(a, b, k) {
    const k2 = k * 2.0
    const x = b - a
    const sqrtTerm = Math.sqrt(x * x + k2 * k2)
    return 0.5 * (a + b - sqrtTerm)
}

export function smoothMinSigmoid(a, b, k) {
    const kLog2 = k * LOG2
    const x = b - a
    const exp2Term = Math.pow(2, x / kLog2)
    return a + x / (1.0 - exp2Term)
}

export function smoothMinQuadratic(a, b, k) {
    const k4 = k * 4.0
    const absDiff = Math.abs(a - b)
    const h = Math.max(k4 - absDiff, 0.0) / k4
    return Math.min(a, b) - h * h * k4 * (1.0 / 4.0)
}

export function smoothMinCubic(a, b, k) {
    const k6 = k * 6.0
    const absDiff = Math.abs(a - b)
    const h = Math.max(k6 - absDiff, 0.0) / k6
    return Math.min(a, b) - h * h * h * k6 * (1.0 / 6.0)
}

export function smoothMinQuartic(a, b, k) {
    const k16_3 = k * (16.0 / 3.0)
    const absDiff = Math.abs(a - b)
    const h = Math.max(k16_3 - absDiff, 0.0) / k16_3
    return Math.min(a, b) - h * h * h * (4.0 - h) * k16_3 * (1.0 / 16.0)
}

export function smoothMinCircular(a, b, k) {
    const kAdjusted = k / ONE_MINUS_INV_SQRT2
    const absDiff = Math.abs(a - b)
    const h = Math.max(kAdjusted - absDiff, 0.0) / kAdjusted
    const sqrtTerm = Math.sqrt(1.0 - h * (h - 2.0))
    return Math.min(a, b) - kAdjusted * 0.5 * (1.0 + h - sqrtTerm)
}

export function smoothMinCircularGeometrical(a, b, k) {
    const kAdjusted = k / ONE_MINUS_INV_SQRT2
    const dx = Math.max(kAdjusted - a, 0.0)
    const dy = Math.max(kAdjusted - b, 0.0)
    const dist = Math.sqrt(dx * dx + dy * dy)
    return Math.max(kAdjusted, Math.min(a, b)) - dist
}

export function smoothMaxExp(a, b, k) {
    const exp2a = Math.pow(2, a / k)
    const exp2b = Math.pow(2, b / k)
    const r = exp2a + exp2b
    return k * Math.log2(r)
}

export function smoothMaxRoot(a, b, k) {
    const k2 = k * 2.0
    const x = a - b
    const sqrtTerm = Math.sqrt(x * x + k2 * k2)
    return 0.5 * (a + b + sqrtTerm)
}

export function smoothMaxSigmoid(a, b, k) {
    const kLog2 = k * LOG2
    const x = a - b
    const exp2Term = Math.pow(2, x / kLog2)
    return a - x / (1.0 - exp2Term)
}

export function smoothMaxQuadratic(a, b, k) {
    const k4 = k * 4.0
    const absDiff = Math.abs(b - a)
    const h = Math.max(k4 - absDiff, 0.0) / k4
    return Math.max(a, b) + h * h * k4 * (1.0 / 4.0)
}

export function smoothMaxCubic(a, b, k) {
    const k6 = k * 6.0
    const absDiff = Math.abs((-a) + b)
    const h = Math.max(k6 - absDiff, 0.0) / k6
    return Math.max(a, b) + h * h * h * k6 * (1.0 / 6.0)
}

export function smoothMaxQuartic(a, b, k) {
    const k16_3 = k * (16.0 / 3.0)
    const absDiff = Math.abs((-a) + b)
    const h = Math.max(k16_3 - absDiff, 0.0) / k16_3
    return Math.max(a, b) + h * h * h * (4.0 - h) * k16_3 * (1.0 / 16.0)
}

export function smoothMaxCircular(a, b, k) {
    const kAdjusted = k / ONE_MINUS_INV_SQRT2
    const absDiff = Math.abs((-a) + b)
    const h = Math.max(kAdjusted - absDiff, 0.0) / kAdjusted
    const sqrtTerm = Math.sqrt(1.0 - h * (h - 2.0))
    return Math.max(a, b) + kAdjusted * 0.5 * (1.0 + h - sqrtTerm)
}

export function smoothMaxCircularGeometrical(a, b, k) {
    const kAdjusted = k / ONE_MINUS_INV_SQRT2
    const dx = Math.max(kAdjusted + a, 0.0)
    const dy = Math.max(kAdjusted + b, 0.0)
    const dist = Math.sqrt(dx * dx + dy * dy)
    return -Math.max(kAdjusted, -Math.max(a, b)) + dist
}

function getHighestDepthNode(node0, node1, node2, node3) {
    let lowest = node0.depth < node1.depth ? node0 : node1
    lowest = lowest.depth < node2.depth ? lowest : node2
    lowest = lowest.depth < node3.depth ? lowest : node3
    return lowest
}

function interpolatePoint(field, minX, minY, minZ, maxX, maxY, maxZ, x, y, z) {
    const dx = (x - minX) / (maxX - minX), oneMinusDx = 1 - dx
    const dy = (y - minY) / (maxY - minY), oneMinusDy = 1 - dy
    const dz = (z - minZ) / (maxZ - minZ), oneMinusDz = 1 - dz

    const c000 = field.calculateSignedDistance(minX, minY, minZ)
    const c100 = field.calculateSignedDistance(maxX, minY, minZ)
    const c110 = field.calculateSignedDistance(maxX, maxY, minZ)
    const c010 = field.calculateSignedDistance(minX, maxY, minZ)
    const c001 = field.calculateSignedDistance(minX, minY, maxZ)
    const c101 = field.calculateSignedDistance(maxX, minY, maxZ)
    const c111 = field.calculateSignedDistance(maxX, maxY, maxZ)
    const c011 = field.calculateSignedDistance(minX, maxY, maxZ)

    const x00 = c000 * oneMinusDx + c100 * dx
    const x01 = c001 * oneMinusDx + c101 * dx
    const x10 = c010 * oneMinusDx + c110 * dx
    const x11 = c011 * oneMinusDx + c111 * dx

    const y0 = x00 * oneMinusDy + x10 * dy
    const y1 = x01 * oneMinusDy + x11 * dy

    return y0 * oneMinusDz + y1 * dz
}

export function triangulateSignedDistanceField(field, boundingBox = field.boundingBox, subdivisionCount = 8, mergeThreshold = 0.0005) {
    const tree = new SampleOctreeRoot(
        boundingBox.minX,
        boundingBox.minY,
        boundingBox.minZ,
        boundingBox.maxX,
        boundingBox.maxY,
        boundingBox.maxZ,
    ).sampleSignedDistanceField(field, subdivisionCount, mergeThreshold)
    const _builder = new SampleOctreeMeshBuilder()
    _builder.processCell(tree)
    return _builder.getMesh()
}

export function box(sizeX = 20, sizeY = 20, sizeZ = 20, cornerRadius = 0) { return new BoxSignedDistanceField3(sizeX, sizeY, sizeZ, cornerRadius); }
export function boxFrame(sizeX = 20, sizeY = 20, sizeZ = 20, frameSize = 5) { return new BoxFrameSignedDistanceField3(sizeX, sizeY, sizeZ, frameSize); }
export function sphere(radius = 5) { return new SphereSignedDistanceField3(radius); }
export function torus(radiusOuter = 20, radiusInner = 5) { return new TorusSignedDistanceField3(radiusOuter, radiusInner); }
export function cylinder(radius = 10, height = Infinity) { return new CylinderSignedDistanceField3(radius, height); }
export function plane(plane_ = new Plane()) { return new PlaneSignedDistanceField3(plane_); }
export function cone(radius, height) { return new ConeSignedDistanceField3(radius, height); }

export function convertToSTL(mesh) {
    if (mesh instanceof TriangleMesh == false) {
        throw new Error("input mesh must be a 'TriangleMesh'!")
    }

    const triangleCount = mesh.indices.length / 3
    const buffer = new ArrayBuffer(STL_TRIANGLE_OFFSET + STL_BYTES_PER_TRIANGLE * triangleCount)
    const view = new DataView(buffer)

    view.setUint32(STL_HEADER_SIZE, triangleCount, true)

    let offset = STL_HEADER_SIZE + 4
    for (let idx = 0; idx < mesh.indices.length; idx += 3) {
        const position0 = mesh.vertices[mesh.indices[idx + 0]].position
        const position1 = mesh.vertices[mesh.indices[idx + 1]].position
        const position2 = mesh.vertices[mesh.indices[idx + 2]].position

        tempPlane.fromVectors(position0, position1, position2)

        view.setFloat32(offset,      tempPlane.normalX, true)
        view.setFloat32(offset + 4,  tempPlane.normalY, true)
        view.setFloat32(offset + 8,  tempPlane.normalZ, true)

        view.setFloat32(offset + 12, position0.x, true)
        view.setFloat32(offset + 16, position0.y, true)
        view.setFloat32(offset + 20, position0.z, true)

        view.setFloat32(offset + 24, position1.x, true)
        view.setFloat32(offset + 28, position1.y, true)
        view.setFloat32(offset + 32, position1.z, true)

        view.setFloat32(offset + 36, position2.x, true)
        view.setFloat32(offset + 40, position2.y, true)
        view.setFloat32(offset + 44, position2.z, true)

        view.setUint16(offset + 48,  0, true)
        offset += STL_BYTES_PER_TRIANGLE
    }

    return new Uint8Array(buffer)
}

export function convertToOBJ(mesh) {
    if (mesh instanceof TriangleMesh == false) {
        throw new Error("input mesh must be a 'TriangleMesh'!")
    }

    let output = ""
    for (let idx = 0; idx < mesh.vertices.length; ++idx) {
        const position = mesh.vertices[idx].position
        output += `v ${position.x}, ${position.y}, ${position.z}\n`
    }

    for (let idx = 0; idx < mesh.indices.length; idx += 3) {
        const index0 = mesh.indices[idx + 0] + 1
        const index1 = mesh.indices[idx + 1] + 1
        const index2 = mesh.indices[idx + 2] + 1
        output += `f ${index0}, ${index1}, ${index2}\n`
    }

    return output
}

export class Vector2 {
    static fromObject(v) { return new Vector2(v.x, v.y); }
    static fromArray(v)  { return new Vector2(v[0], v[1]); }

    constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
    }

    *[Symbol.iterator]() {
        yield this.x
        yield this.y
    }

    clone() { return new Vector2(this.x, this.y); }
    toObject() { return { x: this.x, y: this.y }; }
    toArray() { return [this.x, this.y]; }

    distance(other) {
        const dx = other.x - this.x
        const dy = other.y - this.y
        return Math.sqrt(dx * dx + dy * dy)
    }

    magnitudeSquared() {
        return this.x * this.x + this.y * this.y
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }

    dot(other) {
        return this.x * other.x + this.y * other.y
    }

    apply(callback) {
        this.x = callback(this.x)
        this.y = callback(this.y)
        return this
    }

    min(other) {
        this.x = Math.min(this.x, other.x)
        this.y = Math.min(this.y, other.y)
        return this
    }

    max(other) {
        this.x = Math.max(this.x, other.x)
        this.y = Math.max(this.y, other.y)
        return this
    }

    clamp(v0, v1) {
        this.x = clamp(this.x, v0.x, v1.x)
        this.y = clamp(this.y, v0.y, v1.y)
        return this
    }

    neg() {
        this.x = -this.x
        this.y = -this.y
        return this
    }

    add(other) {
        this.x += other.x
        this.y += other.y
        return this
    }

    sub(other) {
        this.x -= other.x
        this.y -= other.y
        return this
    }

    mul(other) {
        this.x *= other.x
        this.y *= other.y
        return this
    }

    div(other) {
        this.x /= other.x
        this.y /= other.y
        return this
    }

    addScalar(scalar) {
        this.x += scalar
        this.y += scalar
        return this
    }

    subScalar(scalar) {
        this.x -= scalar
        this.y -= scalar
        return this
    }

    mulScalar(scalar) {
        this.x *= scalar
        this.y *= scalar
        return this
    }

    divScalar(scalar) {
        this.x /= scalar
        this.y /= scalar
        return this
    }

    setLength(length) {
        const lengthSquared = this.x * this.x + this.y * this.y
        if (lengthSquared === 0) {
            this.x = this.y = 0
            return this
        }
        const factor = length / Math.sqrt(lengthSquared)
        this.x *= factor
        this.y *= factor
        return this
    }

    normalize() {
        const lengthSquared = this.x * this.x + this.y * this.y
        if (lengthSquared === 0) {
            this.x = this.y = 0
            return this
        }
        const factor = 1 / Math.sqrt(lengthSquared)
        this.x *= factor
        this.y *= factor
        return this
    }

    transformMatrix4(matrix) {
        const x = this.x, y = this.y
        this.x = x * matrix.m00 + y * matrix.m10 + matrix.m20
        this.y = x * matrix.m01 + y * matrix.m11 + matrix.m21
        return this
    }

    transformMatrix3(matrix) {
        const x = this.x, y = this.y
        this.x = x * matrix.m00 + y * matrix.m10 + matrix.m20
        this.y = x * matrix.m01 + y * matrix.m11 + matrix.m21
        return this
    }

    transformMatrix2(matrix) {
        const x = this.x, y = this.y
        this.x = x * matrix.m00 + y * matrix.m10
        this.y = x * matrix.m01 + y * matrix.m11
        return this
    }

    cross() {
        return this.x * this.y - this.y * this.x
    }

    set(x, y) {
        this.x = x
        this.y = y
        return this
    }

    copy(other) {
        this.x = other.x
        this.y = other.y
        return this
    }

    addScaledVector(other, scalar) {
        this.x += other.x * scalar
        this.y += other.y * scalar
        return this
    }

    subScaledVector(other, scalar) {
        this.x -= other.x * scalar
        this.y -= other.y * scalar
        return this
    }

    negVector(other) {
        this.x = -other.x
        this.y = -other.y
        return this
    }

    addVectors(v0, v1) {
        this.x = v0.x + v1.x
        this.y = v0.y + v1.y
        return this
    }

    subVectors(v0, v1) {
        this.x = v0.x - v1.x
        this.y = v0.y - v1.y
        return this
    }

    mulVectors(v0, v1) {
        this.x = v0.x * v1.x
        this.y = v0.y * v1.y
        return this
    }

    divVectors(v0, v1) {
        this.x = v0.x / v1.x
        this.y = v0.y / v1.y
        return this
    }

    lerpVectors(v0, v1, t = 0) {
        this.x = (v1.x - v0.x) * t + v0.x
        this.y = (v1.y - v0.y) * t + v0.y
        return this
    }
}

export class Vector3 {
    static fromObject(v) { return new Vector3(v.x, v.y, v.z); }
    static fromArray(v)  { return new Vector3(v[0], v[1], v[2]); }

    constructor(x=0, y=0, z=0) {
        this.x = x
        this.y = y
        this.z = z
    }

    *[Symbol.iterator]() {
        yield this.x
        yield this.y
        yield this.z
    }

    clone() { return new Vector3(this.x, this.y, this.z); }
    toObject() { return { x: this.x, y: this.y, z: this.z }; }
    toArray() { return [ this.x, this.y, this.z ]; }

    distance(other) {
        const x = other.x - this.x
        const y = other.y - this.y
        const z = other.z - this.z
        return Math.sqrt(x*x + y*y + z*z)
    }

    magnitudeSquared() {
        return this.x*this.x + this.y*this.y + this.z*this.z
    }
    
    magnitude() {
        return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z)
    }
    
    dot(other) {
        return this.x*other.x + this.y*other.y + this.z*other.z
    }

    apply(callback) {
        this.x = callback(this.x)
        this.y = callback(this.y)
        this.z = callback(this.z)
        return this
    }

    min(other) {
        this.x = Math.min(this.x, other.x)
        this.y = Math.min(this.y, other.y)
        this.z = Math.min(this.z, other.z)
        return this
    }

    max(other) {
        this.x = Math.max(this.x, other.x)
        this.y = Math.max(this.y, other.y)
        this.z = Math.max(this.z, other.z)
        return this
    }

    clamp(v0, v1) {
        this.x = clamp(this.x, v0.x, v1.x)
        this.y = clamp(this.y, v0.y, v1.y)
        this.z = clamp(this.z, v0.z, v1.z)
        return this
    }

    neg() {
        this.x = -this.x
        this.y = -this.y
        this.z = -this.z
        return this
    }

    add(other) {
        this.x += other.x
        this.y += other.y
        this.z += other.z
        return this
    }

    sub(other) {
        this.x -= other.x
        this.y -= other.y
        this.z -= other.z
        return this
    }

    mul(other) {
        this.x *= other.x
        this.y *= other.y
        this.z *= other.z
        return this
    }

    div(other) {
        this.x /= other.x
        this.y /= other.y
        this.z /= other.z
        return this
    }

    addScalar(scalar) {
        this.x += scalar
        this.y += scalar
        this.z += scalar
        return this
    }

    subScalar(scalar) {
        this.x -= scalar
        this.y -= scalar
        this.z -= scalar
        return this
    }

    mulScalar(scalar) {
        this.x *= scalar
        this.y *= scalar
        this.z *= scalar
        return this
    }

    divScalar(scalar) {
        this.x /= scalar
        this.y /= scalar
        this.z /= scalar
        return this
    }

    setLength(length) {
        const x0=this.x, y0=this.y, z0=this.z
        const lengthSquared = x0*x0 + y0*y0 + z0*z0

        if (lengthSquared == 0) {
            this.x = this.y = this.z = 0
            return this
        }

        const factor = length / Math.sqrt(lengthSquared)
        this.x = x0 * factor
        this.y = y0 * factor
        this.z = z0 * factor
        return this
    }

    normalize() {
        const x0=this.x, y0=this.y, z0=this.z
        const lengthSquared = x0*x0 + y0*y0 + z0*z0

        if (lengthSquared !== 0) {
            const factor = 1 / Math.sqrt(lengthSquared)
            this.x = x0 * factor
            this.y = y0 * factor
            this.z = z0 * factor
            return this
        }

        this.x = this.y = this.z = 0
        return this
    }

    transformMatrix3(m) {
        const x = this.x, y = this.y, z = this.z
        this.x = x*m.m00 + y*m.m10 + z*m.m20
        this.y = x*m.m01 + y*m.m11 + z*m.m21
        this.z = x*m.m02 + y*m.m12 + z*m.m22
        return this
    }

    transformMatrix4(m) {
        const x = this.x, y = this.y, z = this.z
        this.x = x*m.m00 + y*m.m10 + z*m.m20 + m.m30
        this.y = x*m.m01 + y*m.m11 + z*m.m21 + m.m31
        this.z = x*m.m02 + y*m.m12 + z*m.m22 + m.m32
        return this
    }

    cross(other) {
        const x0 = this.x,  y0 = this.y,  z0 = this.z
        const x1 = other.x, y1 = other.y, z1 = other.z
        this.x = y0 * z1 - y1 * z0
        this.y = z0 * x1 - z1 * x0
        this.z = x0 * y1 - x1 * y0
        return this
    }

    set(x, y, z) {
        this.x = x
        this.y = y
        this.z = z
        return this
    }

    copy(other) {
        this.x = other.x
        this.y = other.y
        this.z = other.z
        return this
    }

    addScaledVector(other, scalar) {
        this.x += other.x * scalar
        this.y += other.y * scalar
        this.z += other.z * scalar
        return this
    }

    subScaledVector(other, scalar) {
        this.x -= other.x * scalar
        this.y -= other.y * scalar
        this.z -= other.z * scalar
        return this
    }


    negVector(other) {
        this.x = -other.x
        this.y = -other.y
        this.z = -other.z
        return this
    }

    addVectors(v0, v1) {
        this.x = v0.x+v1.x
        this.y = v0.y+v1.y
        this.z = v0.z+v1.z
        return this
    }

    subVectors(v0, v1) {
        this.x = v0.x-v1.x
        this.y = v0.y-v1.y
        this.z = v0.z-v1.z
        return this
    }

    mulVectors(v0, v1) {
        this.x = v0.x*v1.x
        this.y = v0.y*v1.y
        this.z = v0.z*v1.z
        return this
    }

    divVectors(v0, v1) {
        this.x = v0.x/v1.x
        this.y = v0.y/v1.y
        this.z = v0.z/v1.z
        return this
    }

    lerpVectors(v0, v1, t = 0) {
        const x0 = v0.x, y0 = v0.y, z0 = v0.z
        const x1 = v1.x, y1 = v1.y, z1 = v1.z

        this.x = (x1 - x0) * t + x0
        this.y = (y1 - y0) * t + y0
        this.z = (z1 - z0) * t + z0
        return this
    }

    crossVectors(v0, v1) {
        const x0 = v0.x, y0 = v0.y, z0 = v0.z
        const x1 = v1.x, y1 = v1.y, z1 = v1.z
        this.x = y0 * z1 - y1 * z0
        this.y = z0 * x1 - z1 * x0
        this.z = x0 * y1 - x1 * y0
        return this
    }
}

export class Vector4 {
    static fromObject(v) { return new Vector4(v.x, v.y, v.z, v.w); }
    static fromArray(v)  { return new Vector4(v[0], v[1], v[2], v[3]); }

    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x
        this.y = y
        this.z = z
        this.w = w
    }

    *[Symbol.iterator]() {
        yield this.x
        yield this.y
        yield this.z
        yield this.w
    }

    clone() { return new Vector4(this.x, this.y, this.z, this.w); }
    toObject() { return { x: this.x, y: this.y, z: this.z, w: this.w }; }
    toArray() { return [this.x, this.y, this.z, this.w]; }

    distance(other) {
        const dx = other.x - this.x
        const dy = other.y - this.y
        const dz = other.z - this.z
        return Math.sqrt(dx * dx + dy * dy + dz * dz)
    }

    magnitudeSquared() {
        return this.x * this.x + this.y * this.y + this.z * this.z
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
    }

    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w
    }

    apply(callback) {
        this.x = callback(this.x)
        this.y = callback(this.y)
        this.z = callback(this.z)
        this.w = callback(this.w)
        return this
    }

    min(other) {
        this.x = Math.min(this.x, other.x)
        this.y = Math.min(this.y, other.y)
        this.z = Math.min(this.z, other.z)
        this.w = Math.min(this.w, other.w)
        return this
    }

    max(other) {
        this.x = Math.max(this.x, other.x)
        this.y = Math.max(this.y, other.y)
        this.z = Math.max(this.z, other.z)
        this.w = Math.max(this.w, other.w)
        return this
    }

    clamp(v0, v1) {
        this.x = clamp(this.x, v0.x, v1.x)
        this.y = clamp(this.y, v0.y, v1.y)
        this.z = clamp(this.z, v0.z, v1.z)
        this.w = clamp(this.w, v0.w, v1.w)
        return this
    }

    neg() {
        this.x = -this.x
        this.y = -this.y
        this.z = -this.z
        this.w = -this.w
        return this
    }

    add(other) {
        this.x += other.x
        this.y += other.y
        this.z += other.z
        this.w += other.w
        return this
    }

    sub(other) {
        this.x -= other.x
        this.y -= other.y
        this.z -= other.z
        this.w -= other.w
        return this
    }

    mul(other) {
        this.x *= other.x
        this.y *= other.y
        this.z *= other.z
        this.w *= other.w
        return this
    }

    div(other) {
        this.x /= other.x
        this.y /= other.y
        this.z /= other.z
        this.w /= other.w
        return this
    }

    addScalar(scalar) {
        this.x += scalar
        this.y += scalar
        this.z += scalar
        this.w += scalar
        return this
    }

    subScalar(scalar) {
        this.x -= scalar
        this.y -= scalar
        this.z -= scalar
        this.w -= scalar
        return this
    }

    mulScalar(scalar) {
        this.x *= scalar
        this.y *= scalar
        this.z *= scalar
        this.w *= scalar
        return this
    }

    divScalar(scalar) {
        this.x /= scalar
        this.y /= scalar
        this.z /= scalar
        this.w /= scalar
        return this
    }

    setLength(length) {
        const lengthSquared = this.x * this.x + this.y * this.y + this.z * this.z
        if (lengthSquared === 0) {
            this.x = 0
            this.y = 0
            this.z = 0
            this.w = 1
            return this
        }
        const factor = length / Math.sqrt(lengthSquared)
        this.x *= factor
        this.y *= factor
        this.z *= factor
        this.w *= factor
        return this
    }

    normalize() {
        const lengthSquared = this.x * this.x + this.y * this.y + this.z * this.z
        if (lengthSquared === 0) {
            this.x = 0
            this.y = 0
            this.z = 0
            this.w = 1
            return this
        }
        const factor = 1 / Math.sqrt(lengthSquared)
        this.x *= factor
        this.y *= factor
        this.z *= factor
        this.w *= factor
        return this
    }

    transformMatrix4(m) {
        const x = this.x, y = this.y, z = this.z, w = this.w
        this.x = x * m.m00 + y * m.m10 + z * m.m20 + w * m.m30
        this.y = x * m.m01 + y * m.m11 + z * m.m21 + w * m.m31
        this.z = x * m.m02 + y * m.m12 + z * m.m22 + w * m.m32
        this.w = x * m.m03 + y * m.m13 + z * m.m23 + w * m.m33
        return this
    }

    cross(other) {
        const x0 = this.x, y0 = this.y, z0 = this.z, w0 = this.w
        const x1 = other.x, y1 = other.y, z1 = other.z, w1 = other.w
        this.x = y0 * z1 - y1 * z0
        this.y = z0 * x1 - z1 * x0
        this.z = x0 * y1 - x1 * y0
        this.w = w0
        return this
    }

    set(x, y, z, w) {
        this.x = x
        this.y = y
        this.z = z
        this.w = w
        return this
    }

    copy(other) {
        this.x = other.x
        this.y = other.y
        this.z = other.z
        this.w = other.w
        return this
    }

    addScaledVector(other, scalar) {
        this.x += other.x * scalar
        this.y += other.y * scalar
        this.z += other.z * scalar
        this.w += other.w * scalar
        return this
    }

    subScaledVector(other, scalar) {
        this.x -= other.x * scalar
        this.y -= other.y * scalar
        this.z -= other.z * scalar
        this.w -= other.w * scalar
        return this
    }

    negVector(other) {
        this.x = -other.x
        this.y = -other.y
        this.z = -other.z
        this.w = -other.w
        return this
    }

    addVectors(v0, v1) {
        this.x = v0.x + v1.x
        this.y = v0.y + v1.y
        this.z = v0.z + v1.z
        this.w = v0.w + v1.w
        return this
    }

    subVectors(v0, v1) {
        this.x = v0.x - v1.x
        this.y = v0.y - v1.y
        this.z = v0.z - v1.z
        this.w = v0.w - v1.w
        return this
    }

    mulVectors(v0, v1) {
        this.x = v0.x * v1.x
        this.y = v0.y * v1.y
        this.z = v0.z * v1.z
        this.w = v0.w * v1.w
        return this
    }

    divVectors(v0, v1) {
        this.x = v0.x / v1.x
        this.y = v0.y / v1.y
        this.z = v0.z / v1.z
        this.w = v0.w / v1.w
        return this
    }

    lerpVectors(v0, v1, t = 0) {
        this.x = (v1.x - v0.x) * t + v0.x
        this.y = (v1.y - v0.y) * t + v0.y
        this.z = (v1.z - v0.z) * t + v0.z
        this.w = (v1.w - v0.w) * t + v0.w
        return this
    }

    crossVectors(v0, v1) {
        const x0 = v0.x, y0 = v0.y, z0 = v0.z, w0 = v0.w
        const x1 = v1.x, y1 = v1.y, z1 = v1.z, w1 = v1.w
        this.x = y0 * z1 - y1 * z0
        this.y = z0 * x1 - z1 * x0
        this.z = x0 * y1 - x1 * y0
        this.w = w0
        return this
    }
}

export class BoundingBox2 {
    constructor(minX = 0, minY = 0, maxX = 0, maxY = 0) {
        this.minX = minX
        this.maxX = maxX
        this.minY = minY
        this.maxY = maxY
    }

    clone() {
        return new BoundingBox2(this.minX, this.minY, this.maxX, this.maxY)
    }

    set(minX = 0, minY = 0, maxX = 0, maxY = 0) {
        this.minX = minX
        this.maxX = maxX
        this.minY = minY
        this.maxY = maxY
        return this
    }

    copy(box) {
        this.minX = box.minX
        this.maxX = box.maxX
        this.minY = box.minY
        this.maxY = box.maxY
        return this
    }

    grow(size) {
        this.minX -= size
        this.minY -= size
        this.maxX += size
        this.maxY += size
        return this
    }

    mul(factor) {
        this.minX *= factor
        this.minY *= factor
        this.maxX *= factor
        this.maxY *= factor
        return this
    }

    transformMatrix2(matrix) {
        const r0 = matrix.m00, r1 = matrix.m01
        const u0 = matrix.m10, u1 = matrix.m11

        const xa0 = r0 * this.minX, xa1 = r1 * this.minX
        const xb0 = r0 * this.maxX, xb1 = r1 * this.maxX
        const ya0 = u0 * this.minY, ya1 = u1 * this.minY
        const yb0 = u0 * this.maxY, yb1 = u1 * this.maxY

        const min0_x = Math.min(xa0, xb0), min1_x = Math.min(xa1, xb1)
        const max0_x = Math.max(xa0, xb0), max1_x = Math.max(xa1, xb1)
        const min0_y = Math.min(ya0, yb0), min1_y = Math.min(ya1, yb1)
        const max0_y = Math.max(ya0, yb0), max1_y = Math.max(ya1, yb1)

        this.minX = min0_x + min0_y
        this.minY = min1_x + min1_y
        this.maxX = max0_x + max0_y
        this.maxY = max1_x + max1_y
        return this
    }

    transformMatrix3(matrix) {
        const r0 = matrix.m00, r1 = matrix.m01
        const u0 = matrix.m10, u1 = matrix.m11
        const t0 = matrix.m20, t1 = matrix.m21

        const xa0 = r0 * this.minX, xa1 = r1 * this.minX
        const xb0 = r0 * this.maxX, xb1 = r1 * this.maxX
        const ya0 = u0 * this.minY, ya1 = u1 * this.minY
        const yb0 = u0 * this.maxY, yb1 = u1 * this.maxY

        const min0_x = Math.min(xa0, xb0), min1_x = Math.min(xa1, xb1)
        const max0_x = Math.max(xa0, xb0), max1_x = Math.max(xa1, xb1)
        const min0_y = Math.min(ya0, yb0), min1_y = Math.min(ya1, yb1)
        const max0_y = Math.max(ya0, yb0), max1_y = Math.max(ya1, yb1)

        this.minX = min0_x + min0_y + t0
        this.minY = min1_x + min1_y + t1
        this.maxX = max0_x + max0_y + t0
        this.maxY = max1_x + max1_y + t1
        return this
    }

    unionBoxes(box0, box1) {
        this.minX = Math.min(box0.minX, box1.minX)
        this.minY = Math.min(box0.minY, box1.minY)
        this.maxX = Math.max(box0.maxX, box1.maxX)
        this.maxY = Math.max(box0.maxY, box1.maxY)
        return this
    }

    intersectBoxes(box0, box1) {
        this.minX = Math.max(box0.minX, box1.minX)
        this.minY = Math.max(box0.minY, box1.minY)
        this.maxX = Math.min(box0.maxX, box1.maxX)
        this.maxY = Math.min(box0.maxY, box1.maxY)
        return this
    }

    union(box) {
        return this.unionBoxes(this, box)
    }

    intersect(box) {
        return this.intersectBoxes(this, box)
    }
}

export class BoundingBox3 {
    constructor(minX = 0, minY = 0, minZ = 0, maxX = 0, maxY = 0, maxZ = 0) {
        this.minX = minX
        this.minY = minY
        this.minZ = minZ
        this.maxX = maxX
        this.maxY = maxY
        this.maxZ = maxZ
    }

    clone() {
        return new BoundingBox3(this.minX, this.minY, this.minZ,
                                this.maxX, this.maxY, this.maxZ)
    }

    set(minX = 0, minY = 0, minZ = 0, maxX = 0, maxY = 0, maxZ = 0) {
        this.minX = minX
        this.minY = minY
        this.minZ = minZ
        this.maxX = maxX
        this.maxY = maxY
        this.maxZ = maxZ
        return this
    }

    copy(box) {
        this.minX = box.minX
        this.minY = box.minY
        this.minZ = box.minZ
        this.maxX = box.maxX
        this.maxY = box.maxY
        this.maxZ = box.maxZ
        return this
    }

    grow(size) {
        this.minX -= size
        this.minY -= size
        this.minZ -= size
        this.maxX += size
        this.maxY += size
        this.maxZ += size
        return this
    }

    mul(factor) {
        this.minX *= factor
        this.minY *= factor
        this.minZ *= factor
        this.maxX *= factor
        this.maxY *= factor
        this.maxZ *= factor
        return this
    }

    transformMatrix3(matrix) {
        const r0 = matrix.m00, r1 = matrix.m01, r2 = matrix.m02
        const u0 = matrix.m10, u1 = matrix.m11, u2 = matrix.m12
        const b0 = matrix.m20, b1 = matrix.m21, b2 = matrix.m22

        const xa0 = r0 * this.minX, xa1 = r1 * this.minX, xa2 = r2 * this.minX
        const xb0 = r0 * this.maxX, xb1 = r1 * this.maxX, xb2 = r2 * this.maxX
        const ya0 = u0 * this.minY, ya1 = u1 * this.minY, ya2 = u2 * this.minY
        const yb0 = u0 * this.maxY, yb1 = u1 * this.maxY, yb2 = u2 * this.maxY
        const za0 = b0 * this.minZ, za1 = b1 * this.minZ, za2 = b2 * this.minZ
        const zb0 = b0 * this.maxZ, zb1 = b1 * this.maxZ, zb2 = b2 * this.maxZ

        const min0_x = Math.min(xa0, xb0), min1_x = Math.min(xa1, xb1), min2_x = Math.min(xa2, xb2)
        const max0_x = Math.max(xa0, xb0), max1_x = Math.max(xa1, xb1), max2_x = Math.max(xa2, xb2)
        const min0_y = Math.min(ya0, yb0), min1_y = Math.min(ya1, yb1), min2_y = Math.min(ya2, yb2)
        const max0_y = Math.max(ya0, yb0), max1_y = Math.max(ya1, yb1), max2_y = Math.max(ya2, yb2)
        const min0_z = Math.min(za0, zb0), min1_z = Math.min(za1, zb1), min2_z = Math.min(za2, zb2)
        const max0_z = Math.max(za0, zb0), max1_z = Math.max(za1, zb1), max2_z = Math.max(za2, zb2)

        this.minX = min0_x + min0_y + min0_z
        this.minY = min1_x + min1_y + min1_z
        this.minZ = min2_x + min2_y + min2_z
        this.maxX = max0_x + max0_y + max0_z
        this.maxY = max1_x + max1_y + max1_z
        this.maxZ = max2_x + max2_y + max2_z
        return this
    }
    
    transformMatrix4(matrix) {
        const r0 = matrix.m00, r1 = matrix.m01, r2 = matrix.m02
        const u0 = matrix.m10, u1 = matrix.m11, u2 = matrix.m12
        const b0 = matrix.m20, b1 = matrix.m21, b2 = matrix.m22
        const t0 = matrix.m30, t1 = matrix.m31, t2 = matrix.m32

        const xa0 = r0 * this.minX, xa1 = r1 * this.minX, xa2 = r2 * this.minX
        const xb0 = r0 * this.maxX, xb1 = r1 * this.maxX, xb2 = r2 * this.maxX
        const ya0 = u0 * this.minY, ya1 = u1 * this.minY, ya2 = u2 * this.minY
        const yb0 = u0 * this.maxY, yb1 = u1 * this.maxY, yb2 = u2 * this.maxY
        const za0 = b0 * this.minZ, za1 = b1 * this.minZ, za2 = b2 * this.minZ
        const zb0 = b0 * this.maxZ, zb1 = b1 * this.maxZ, zb2 = b2 * this.maxZ

        const min0_x = Math.min(xa0, xb0), min1_x = Math.min(xa1, xb1), min2_x = Math.min(xa2, xb2)
        const max0_x = Math.max(xa0, xb0), max1_x = Math.max(xa1, xb1), max2_x = Math.max(xa2, xb2)
        const min0_y = Math.min(ya0, yb0), min1_y = Math.min(ya1, yb1), min2_y = Math.min(ya2, yb2)
        const max0_y = Math.max(ya0, yb0), max1_y = Math.max(ya1, yb1), max2_y = Math.max(ya2, yb2)
        const min0_z = Math.min(za0, zb0), min1_z = Math.min(za1, zb1), min2_z = Math.min(za2, zb2)
        const max0_z = Math.max(za0, zb0), max1_z = Math.max(za1, zb1), max2_z = Math.max(za2, zb2)

        this.minX = min0_x + min0_y + min0_z + t0
        this.minY = min1_x + min1_y + min1_z + t1
        this.minZ = min2_x + min2_y + min2_z + t2
        this.maxX = max0_x + max0_y + max0_z + t0
        this.maxY = max1_x + max1_y + max1_z + t1
        this.maxZ = max2_x + max2_y + max2_z + t2
        return this
    }

    unionBoxes(box0, box1) {
        this.minX = Math.min(box0.minX, box1.minX)
        this.minY = Math.min(box0.minY, box1.minY)
        this.minZ = Math.min(box0.minZ, box1.minZ)
        this.maxX = Math.max(box0.maxX, box1.maxX)
        this.maxY = Math.max(box0.maxY, box1.maxY)
        this.maxZ = Math.max(box0.maxZ, box1.maxZ)
        return this
    }

    intersectBoxes(box0, box1) {
        this.minX = Math.max(box0.minX, box1.minX)
        this.minY = Math.max(box0.minY, box1.minY)
        this.minZ = Math.max(box0.minZ, box1.minZ)
        this.maxX = Math.min(box0.maxX, box1.maxX)
        this.maxY = Math.min(box0.maxY, box1.maxY)
        this.maxZ = Math.min(box0.maxZ, box1.maxZ)
        return this
    }

    union(box) {
        return this.unionBoxes(this, box)
    }

    intersect(box) {
        return this.intersectBoxes(this, box)
    }
}

export class Plane {
    constructor(normalX, normalY, normalZ, distance) {
        this.normalX = normalX
        this.normalY = normalY
        this.normalZ = normalZ
        this.distance = distance
    }

    getOrigin(out = new Vector3()) {
        return out.set(this.normalX * this.distance,
                       this.normalY * this.distance,
                       this.normalZ * this.distance)
    }

    getNormal(out = new Vector3()) {
        return out.set(this.normalX,
                       this.normalY,
                       this.normalZ)
    }

    clone() {
        return new Plane(this.normalX, this.normalY, this.normalZ, this.distance)
    }

    dotPlane(plane) {
        return this.normalX * plane.normalX + this.normalY * plane.normalY + this.normalZ * plane.normalZ
    }

    dotVector(vector) {
        return this.normalX * vector.x + this.normalY * vector.y + this.normalZ * vector.z
    }

    copy(other) {
        this.normalX = other.normalX
        this.normalY = other.normalY
        this.normalZ = other.normalZ
        this.distance = other.distance
        return this
    }

    equals(other) {
        const x = other.normalX - this.normalX
        const y = other.normalY - this.normalY
        const z = other.normalZ - this.normalZ
        const planeDistance = Math.abs(this.distance - other.distance)
        const originDistance = Math.sqrt(x*x + y*y + z*z)
        return planeDistance <= EPSILON && originDistance <= EPSILON
    }

    flip() {
        this.normalX = -this.normalX
        this.normalY = -this.normalY
        this.normalZ = -this.normalZ
        this.distance = -this.distance
        return this
    }

    distanceToPoint(x, y, z) {
        return x * this.normalX + y * this.normalY + z * this.normalZ - this.distance
    }

    projectionOfPoint(x, y, z) {
        const a = x * this.normalX + y * this.normalY + z * this.normalZ - this.distance
        return new Vector3(x - a * this.normalX,
                           y - a * this.normalY,
                           z - a * this.normalZ)
    }

    transformMatrix3(matrix, inverseMatrix) {
        const x=this.normalX, y=this.normalY, z=this.normalZ, d=this.distance

        const origin0 = x*d*matrix.m00 + y*d*matrix.m10 + z*d*matrix.m20
        const origin1 = x*d*matrix.m01 + y*d*matrix.m11 + z*d*matrix.m21
        const origin2 = x*d*matrix.m02 + y*d*matrix.m12 + z*d*matrix.m22

        const normal0 = x*inverseMatrix.m00 + y*inverseMatrix.m10 + z*inverseMatrix.m20
        const normal1 = x*inverseMatrix.m01 + y*inverseMatrix.m11 + z*inverseMatrix.m21
        const normal2 = x*inverseMatrix.m02 + y*inverseMatrix.m12 + z*inverseMatrix.m22

        const distance = normal0*origin0 + normal1*origin1 + normal2*origin2

        this.normalX = normal0
        this.normalY = normal1
        this.normalZ = normal2
        this.distance = distance
        return this
    }

    transformMatrix4(matrix, inverseMatrix) {
        const x=this.normalX, y=this.normalY, z=this.normalZ, d=this.distance

        const origin0 = x*d*matrix.m00 + y*d*matrix.m10 + z*d*matrix.m20 + matrix.m30
        const origin1 = x*d*matrix.m01 + y*d*matrix.m11 + z*d*matrix.m21 + matrix.m31
        const origin2 = x*d*matrix.m02 + y*d*matrix.m12 + z*d*matrix.m22 + matrix.m32

        const normal0 = x*inverseMatrix.m00 + y*inverseMatrix.m10 + z*inverseMatrix.m20
        const normal1 = x*inverseMatrix.m01 + y*inverseMatrix.m11 + z*inverseMatrix.m21
        const normal2 = x*inverseMatrix.m02 + y*inverseMatrix.m12 + z*inverseMatrix.m22

        const distance = normal0*origin0 + normal1*origin1 + normal2*origin2

        this.normalX = normal0
        this.normalY = normal1
        this.normalZ = normal2
        this.distance = distance
        return this
    }

    fromNormalAndPoint(normalX, normalY, normalZ, pointX, pointY, pointZ) {
        const distance = normalX*pointX + normalY*pointY + normalZ*pointZ
        this.normalX = normalX
        this.normalY = normalY
        this.normalZ = normalZ
        this.distance = distance
        return this
    }

    fromPoints(x0, y0, z0, x1, y1, z1, x2, y2, z2) {
        const dx0     = x1 - x0
        const dy0     = y1 - y0
        const dz0     = z1 - z0
        const dx1     = x2 - x0
        const dy1     = y2 - y0
        const dz1     = z2 - z0
        const crossX = dy0 * dz1 - dy1 * dz0
        const crossY = dz0 * dx1 - dz1 * dx0
        const crossZ = dx0 * dy1 - dx1 * dy0
        const lengthSquared = crossX*crossX + crossY*crossY + crossZ*crossZ

        if (lengthSquared === 0) {
            return new Plane(0, 0, 0, 0)
        }

        const factor   = 1.0 / Math.sqrt(lengthSquared)
        const normalX = crossX * factor
        const normalY = crossY * factor
        const normalZ = crossZ * factor
        const distance = normalX*x0 + normalY*y0 + normalZ*z0

        this.normalX = normalX
        this.normalY = normalY
        this.normalZ = normalZ
        this.distance = distance
        return this
    }

    fromVectors(v0, v1, v2) {
        return this.fromPoints(v0.x, v0.y, v0.z,
                               v1.x, v1.y, v1.z,
                               v2.x, v2.y, v2.z)
    }
}

export class Matrix2 {
    static identity() {
        return new Matrix2(1, 0,
                           0, 1)
    }

    static scale(x, y) {
        return new Matrix2(x, 0,
                           0, y)
    }

    static rotate(angle) {
        const c = Math.cos(angle)
        const s = Math.sin(angle)
        return new Matrix2(c, -s,
                           s,  c)
    }

    constructor(m00=1, m10=0, m01=0, m11=1) {
        this.m00 = m00
        this.m01 = m01
        this.m10 = m10
        this.m11 = m11
    }

    clone() {
        return new Matrix2(this.m00, this.m10,
                           this.m01, this.m11)
    }

    determinant() {
        return this.m00 * this.m11 - this.m10 * this.m01
    }

    isIdentity() {
        return this.m00 === 1 && this.m01 === 0
        &&     this.m10 === 0 && this.m11 === 1
    }

    equals(other) {
        return Math.abs(this.m00 - other.m00) <= EPSILON && Math.abs(this.m10 - other.m10) <= EPSILON
        &&     Math.abs(this.m01 - other.m01) <= EPSILON && Math.abs(this.m11 - other.m11) <= EPSILON
    }
    
    identity() {
        this.m00 = 1
        this.m01 = 0
        this.m10 = 0
        this.m11 = 1
        return this
    }

    set(m00, m01, m10, m11) {
        this.m00 = m00
        this.m01 = m01
        this.m10 = m10
        this.m11 = m11
        return this
    }

    copy(other) {
        this.m00 = other.m00
        this.m01 = other.m01
        this.m10 = other.m10
        this.m11 = other.m11
        return this
    }

    transposeMatrix(matrix) {
        const m00 = matrix.m00, m01 = matrix.m01
        const m10 = matrix.m10, m11 = matrix.m11

        this.m00 = m00
        this.m01 = m10
        this.m10 = m01
        this.m11 = m11
        return this
    }

    mulMatrices(matrix0, matrix1) {
        const a00 = matrix0.m00, a01 = matrix0.m01
        const a10 = matrix0.m10, a11 = matrix0.m11

        const b00 = matrix1.m00, b01 = matrix1.m01
        const b10 = matrix1.m10, b11 = matrix1.m11

        this.m00 = a00 * b00 + a01 * b10
        this.m01 = a00 * b01 + a01 * b11
        this.m10 = a10 * b00 + a11 * b10
        this.m11 = a10 * b01 + a11 * b11
        return this
    }

    inverseMatrix(matrix) {
        const m00 = matrix.m00, m01 = matrix.m01
        const m10 = matrix.m10, m11 = matrix.m11

        const determinant = m00 * m11 - m10 * m01

        if (determinant === 0) {
            throw new Error("Determinant of the matrix cannot be zero!")
        }

        const factor = 1 / determinant

        this.m00 = m11 * factor
        this.m01 = m10 * factor
        this.m10 = m01 * factor
        this.m11 = m00 * factor

        return this
    }

    scaleMatrix(matrix, x, y) {
        const m00 = matrix.m00, m01 = matrix.m01
        const m10 = matrix.m10, m11 = matrix.m11

        this.m00 = x * m00
        this.m01 = y * m01
        this.m10 = x * m10
        this.m11 = y * m11
        return this
    }

    rotateMatrix(matrix, angle) {
        const m00 = matrix.m00, m01 = matrix.m01
        const m10 = matrix.m10, m11 = matrix.m11

        const c = Math.cos(angle)
        const s = Math.sin(angle)

        this.m00 = c * m00 - s * m01
        this.m01 = c * m01 + s * m00
        this.m10 = c * m10 - s * m11
        this.m11 = c * m11 + s * m10
        return this
    }

    transpose() {
        return this.transposeMatrix(this)
    }

    inverse() {
        return this.inverseMatrix(this)
    }

    scale(x, y) {
        return this.scaleMatrix(this, x, y)
    }

    rotate(angle) {
        return this.rotateMatrix(this, angle)
    }
}

export class Matrix3 {
    static identity() {
        return new Matrix3(1, 0, 0,
                           0, 1, 0,
                           0, 0, 1)
    }

    static scale(x, y, z) {
        return new Matrix3(x, 0, 0,
                           0, y, 0,
                           0, 0, z)
    }

    static translate(x, y) {
        return new Matrix3(1, 0, x,
                           0, 1, y,
                           0, 0, 1)
    }

    static rotateX(angle) {
        const c = Math.cos(angle)
        const s = Math.sin(angle)
        return new Matrix3(1, 0, 0,
                           0, c, -s,
                           0, s, c)
    }

    static rotateY(angle) {
        const c = Math.cos(angle)
        const s = Math.sin(angle)
        return new Matrix3(c, 0, s,
                           0, 1, 0,
                          -s, 0, c)
    }

    static rotateZ(angle) {
        const c = Math.cos(angle)
        const s = Math.sin(angle)
        return new Matrix3(c, -s, 0,
                           s,  c, 0,
                           0,  0, 1)
    }

    static rotate(axisX, axisY, axisZ, angle) {
        const c = Math.cos(angle)
        const s = Math.sin(angle)
        const oneMinusC = 1 - c

        const length = Math.sqrt(axisX * axisX + axisY * axisY + axisZ * axisZ)
        
        if (length == 0) {
            throw new Error("axis vector length must be non zero!")
        }

        const factor = 1 / length
        const x = factor * axisX
        const y = factor * axisY
        const z = factor * axisZ

        const xy = x*y, xs = x*s, xx = x*x
        const xz = x*z, ys = y*s, yy = y*y
        const yz = y*z, zs = z*s, zz = z*z

        const b00 = c + xx*oneMinusC
        const b10 = xy*oneMinusC - zs
        const b20 = xz*oneMinusC + ys

        const b01 = xy*oneMinusC + zs
        const b11 = yy*oneMinusC + c
        const b21 = yz*oneMinusC - xs

        const b02 = xz*oneMinusC - ys
        const b12 = yz*oneMinusC + xs
        const b22 = zz*oneMinusC + c

        return new Matrix3(b00, b10, b20,
                           b01, b11, b21,
                           b02, b12, b22)
    }

    constructor(
        m00=1, m10=0, m20=0,
        m01=0, m11=1, m21=0,
        m02=0, m12=0, m22=1
    ) {
        this.m00 = m00
        this.m01 = m01
        this.m02 = m02

        this.m10 = m10
        this.m11 = m11
        this.m12 = m12

        this.m20 = m20
        this.m21 = m21
        this.m22 = m22
    }

    clone() {
        return new Matrix3(this.m00, this.m10, this.m20,
                           this.m01, this.m11, this.m21,
                           this.m02, this.m12, this.m22)
    }

    determinant() {
        return this.m00 * (this.m11 * this.m22 - this.m12 * this.m21)
             - this.m01 * (this.m10 * this.m22 - this.m12 * this.m20)
             + this.m02 * (this.m10 * this.m21 - this.m11 * this.m20)
    }

    isIdentity() {
        return this.m00 === 1 && this.m01 === 0 && this.m02 === 0
        &&     this.m10 === 0 && this.m11 === 1 && this.m12 === 0
        &&     this.m20 === 0 && this.m21 === 0 && this.m22 === 1
    }

    equals(other) {
        return Math.abs(this.m00 - other.m00) <= EPSILON && Math.abs(this.m10 - other.m10) <= EPSILON
        &&     Math.abs(this.m20 - other.m20) <= EPSILON && Math.abs(this.m01 - other.m01) <= EPSILON
        &&     Math.abs(this.m11 - other.m11) <= EPSILON && Math.abs(this.m21 - other.m21) <= EPSILON
        &&     Math.abs(this.m02 - other.m02) <= EPSILON && Math.abs(this.m12 - other.m12) <= EPSILON
        &&     Math.abs(this.m22 - other.m22) <= EPSILON
    }

    identity() {
        this.m00 = 1
        this.m01 = 0
        this.m02 = 0
        this.m10 = 0
        this.m11 = 1
        this.m12 = 0
        this.m20 = 0
        this.m21 = 0
        this.m22 = 1
        return this
    }

    set(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
        this.m00 = m00
        this.m01 = m01
        this.m02 = m02
        this.m10 = m10
        this.m11 = m11
        this.m12 = m12
        this.m20 = m20
        this.m21 = m21
        this.m22 = m22
        return this
    }

    copy(other) {
        this.m00 = other.m00
        this.m01 = other.m01
        this.m02 = other.m02
        this.m10 = other.m10
        this.m11 = other.m11
        this.m12 = other.m12
        this.m20 = other.m20
        this.m21 = other.m21
        this.m22 = other.m22
        return this
    }

    transposeMatrix(matrix) {
        const m00 = matrix.m00, m01 = matrix.m01, m02 = matrix.m02
        const m10 = matrix.m10, m11 = matrix.m11, m12 = matrix.m12
        const m20 = matrix.m20, m21 = matrix.m21, m22 = matrix.m22

        this.m00 = m00
        this.m01 = m10
        this.m02 = m20
        this.m10 = m01
        this.m11 = m11
        this.m12 = m21
        this.m20 = m02
        this.m21 = m12
        this.m22 = m22
        return this
    }

    mulMatrices(matrix0, matrix1) {
        const a00 = matrix0.m00, a01 = matrix0.m01, a02 = matrix0.m02
        const a10 = matrix0.m10, a11 = matrix0.m11, a12 = matrix0.m12
        const a20 = matrix0.m20, a21 = matrix0.m21, a22 = matrix0.m22

        const b00 = matrix1.m00, b01 = matrix1.m01, b02 = matrix1.m02
        const b10 = matrix1.m10, b11 = matrix1.m11, b12 = matrix1.m12
        const b20 = matrix1.m20, b21 = matrix1.m21, b22 = matrix1.m22

        this.m00 = a00 * b00 + a01 * b10 + a02 * b20
        this.m01 = a00 * b01 + a01 * b11 + a02 * b21
        this.m02 = a00 * b02 + a01 * b12 + a02 * b22
        this.m10 = a10 * b00 + a11 * b10 + a12 * b20
        this.m11 = a10 * b01 + a11 * b11 + a12 * b21
        this.m12 = a10 * b02 + a11 * b12 + a12 * b22
        this.m20 = a20 * b00 + a21 * b10 + a22 * b20
        this.m21 = a20 * b01 + a21 * b11 + a22 * b21
        this.m22 = a20 * b02 + a21 * b12 + a22 * b22
        return this
    }

    inverseMatrix(matrix) {
        const m00 = matrix.m00, m01 = matrix.m01, m02 = matrix.m02
        const m10 = matrix.m10, m11 = matrix.m11, m12 = matrix.m12
        const m20 = matrix.m20, m21 = matrix.m21, m22 = matrix.m22

        const cofactor00 = m11 * m22 - m12 * m21
        const cofactor10 = m02 * m21 - m01 * m22
        const cofactor20 = m01 * m12 - m02 * m11

        const cofactor01 = m12 * m20 - m10 * m22
        const cofactor11 = m00 * m22 - m02 * m20
        const cofactor21 = m02 * m10 - m00 * m12

        const cofactor02 = m10 * m21 - m11 * m20
        const cofactor12 = m01 * m20 - m00 * m21
        const cofactor22 = m00 * m11 - m01 * m10

        const determinant = m00 * cofactor00 + m10 * cofactor10 + m20 * cofactor20

        if (determinant === 0) {
            throw new Error("Determinant of the matrix cannot be zero!")
        }

        const factor = 1 / determinant

        this.m00 = cofactor00 * factor
        this.m01 = cofactor10 * factor
        this.m02 = cofactor20 * factor

        this.m10 = cofactor01 * factor
        this.m11 = cofactor11 * factor
        this.m12 = cofactor21 * factor

        this.m20 = cofactor02 * factor
        this.m21 = cofactor12 * factor
        this.m22 = cofactor22 * factor

        return this
    }

    scaleMatrix(matrix, x, y, z) {
        const m00 = matrix.m00, m01 = matrix.m01, m02 = matrix.m02
        const m10 = matrix.m10, m11 = matrix.m11, m12 = matrix.m12
        const m20 = matrix.m20, m21 = matrix.m21, m22 = matrix.m22

        this.m00 = x * m00
        this.m01 = y * m01
        this.m02 = z * m02
        this.m10 = x * m10
        this.m11 = y * m11
        this.m12 = z * m12
        this.m20 = x * m20
        this.m21 = y * m21
        this.m22 = z * m22
        return this
    }

    translateMatrix(matrix, x, y, z) {
        const m00 = matrix.m00, m01 = matrix.m01, m02 = matrix.m02
        const m10 = matrix.m10, m11 = matrix.m11, m12 = matrix.m12
        const m20 = matrix.m20, m21 = matrix.m21, m22 = matrix.m22

        this.m03 = x * m00 + y * m01 + z * m02
        this.m13 = x * m10 + y * m11 + z * m12
        this.m23 = x * m20 + y * m21 + z * m22
        return this
    }

    rotateMatrixX(matrix, angle) {
        const m01 = matrix.m01, m02 = matrix.m02
        const m11 = matrix.m11, m12 = matrix.m12
        const m21 = matrix.m21, m22 = matrix.m22

        const c = Math.cos(angle)
        const s = Math.sin(angle)

        this.m01 = c * m01 - s * m02
        this.m02 = c * m02 + s * m01
        this.m11 = c * m11 - s * m12
        this.m12 = c * m12 + s * m11
        this.m21 = c * m21 - s * m22
        this.m22 = c * m22 + s * m21
        return this
    }

    rotateMatrixY(matrix, angle) {
        const m00 = matrix.m00, m02 = matrix.m02
        const m10 = matrix.m10, m12 = matrix.m12
        const m20 = matrix.m20, m22 = matrix.m22

        const c = Math.cos(angle)
        const s = Math.sin(angle)

        this.m00 = c * m00 + s * m02
        this.m02 = c * m02 - s * m00
        this.m10 = c * m10 + s * m12
        this.m12 = c * m12 - s * m10
        this.m20 = c * m20 + s * m22
        this.m22 = c * m22 - s * m20
        return this
    }

    rotateMatrixZ(matrix, angle) {
        const m00 = matrix.m00, m01 = matrix.m01
        const m10 = matrix.m10, m11 = matrix.m11
        const m20 = matrix.m20, m21 = matrix.m21

        const c = Math.cos(angle)
        const s = Math.sin(angle)

        this.m00 = c * m00 - s * m01
        this.m01 = c * m01 + s * m00
        this.m10 = c * m10 - s * m11
        this.m11 = c * m11 + s * m10
        this.m20 = c * m20 - s * m21
        this.m21 = c * m21 + s * m20
        return this
    }

    rotateMatrix(matrix, axisX, axisY, axisZ, angle) {
        const m00 = matrix.m00, m01 = matrix.m01, m02 = matrix.m02
        const m10 = matrix.m10, m11 = matrix.m11, m12 = matrix.m12
        const m20 = matrix.m20, m21 = matrix.m21, m22 = matrix.m22

        const c = Math.cos(angle)
        const s = Math.sin(angle)
        const oneMinusC = 1 - c

        const length = Math.sqrt(axisX * axisX + axisY * axisY + axisZ * axisZ)

        if (length == 0) {
            throw new Error("axis vector length must be non zero!")
        }

        const factor = 1 / length
        const x = factor * axisX
        const y = factor * axisY
        const z = factor * axisZ

        const xy = x * y, xs = x * s, xx = x * x
        const xz = x * z, ys = y * s, yy = y * y
        const yz = y * z, zs = z * s, zz = z * z

        const b00 = c + xx * oneMinusC
        const b10 = xy * oneMinusC - zs
        const b20 = xz * oneMinusC + ys

        const b01 = xy * oneMinusC + zs
        const b11 = yy * oneMinusC + c
        const b21 = yz * oneMinusC - xs

        const b02 = xz * oneMinusC - ys
        const b12 = yz * oneMinusC + xs
        const b22 = zz * oneMinusC + c

        this.m00 = m10 * b10 + m20 * b20 + m00 * b00
        this.m01 = m00 * b01 + m20 * b21 + m10 * b11
        this.m02 = m00 * b02 + m10 * b12 + m20 * b22
        this.m10 = m11 * b10 + m21 * b20 + m01 * b00
        this.m11 = m01 * b01 + m21 * b21 + m11 * b11
        this.m12 = m01 * b02 + m11 * b12 + m21 * b22
        this.m20 = m12 * b10 + m22 * b20 + m02 * b00
        this.m21 = m02 * b01 + m22 * b21 + m12 * b11
        this.m22 = m02 * b02 + m12 * b12 + m22 * b22
        return this
    }
    
    transpose() {
        return this.transposeMatrix(this)
    }

    inverse() {
        return this.inverseMatrix(this)
    }

    scale(x, y, z) {
        return this.scaleMatrix(this, x, y, z)
    }

    translate(x, y, z) {
        return this.translateMatrix(this, x, y, z)
    }

    rotateX(angle) {
        return this.rotateMatrixX(this, angle)
    }

    rotateY(angle) {
        return this.rotateMatrixY(this, angle)
    }

    rotateZ(angle) {
        return this.rotateMatrixZ(this, angle)
    }

    rotate(axisX, axisY, axisZ, angle) {
        return this.rotateMatrix(this, axisX, axisY, axisZ, angle)
    }
}

export class Matrix4 {
    static identity() {
        return new Matrix4(1, 0, 0, 0,
                           0, 1, 0, 0,
                           0, 0, 1, 0,
                           0, 0, 0, 1)
    }

    static scale(x, y, z) {
        return new Matrix4(x, 0, 0, 0,
                           0, y, 0, 0,
                           0, 0, z, 0,
                           0, 0, 0, 1)
    }

    static translate(x, y, z) {
        return new Matrix4(0, 0, 0, 0,
                           0, 0, 0, 0,
                           0, 0, 0, 0,
                           x, y, z, 1)
    }

    static rotateX(angle) {
        const c = Math.cos(angle)
        const s = Math.sin(angle)
        return new Matrix4(1, 0, 0, 0,
                           0, c,-s, 0,
                           0, s, c, 0,
                           0, 0, 0, 1)
    }

    static rotateY(angle) {
        const c = Math.cos(angle)
        const s = Math.sin(angle)
        return new Matrix4(c, 0, s, 0,
                           0, 1, 0, 0,
                          -s, 0, c, 0,
                           0, 0, 0, 1)
    }

    static rotateZ(angle) {
        const c = Math.cos(angle)
        const s = Math.sin(angle)
        return new Matrix4(c,-s, 0, 0,
                           s, c, 0, 0,
                           0, 0, 1, 0,
                           0, 0, 0, 1)
    }

    static rotate(axisX, axisY, axisZ, angle) {
        const c = Math.cos(angle)
        const s = Math.sin(angle)
        const oneMinusC = 1 - c

        const length = Math.sqrt(axisX * axisX + axisY * axisY + axisZ * axisZ)
        
        if (length == 0) {
            throw new Error("axis vector length must be non zero!")
        }

        const factor = 1 / length
        const x = factor * axisX
        const y = factor * axisY
        const z = factor * axisZ

        const xy = x*y, xs = x*s, xx = x*x
        const xz = x*z, ys = y*s, yy = y*y
        const yz = y*z, zs = z*s, zz = z*z

        const b00 = c + xx*oneMinusC
        const b10 = xy*oneMinusC - zs
        const b20 = xz*oneMinusC + ys

        const b01 = xy*oneMinusC + zs
        const b11 = yy*oneMinusC + c
        const b21 = yz*oneMinusC - xs

        const b02 = xz*oneMinusC - ys
        const b12 = yz*oneMinusC + xs
        const b22 = zz*oneMinusC + c

        return new Matrix4(b00, b10, b20, 0,
                           b01, b11, b21, 0,
                           b02, b12, b22, 0,
                           0,   0,   0,   1)
    }

    constructor(
        m00=1, m10=0, m20=0, m30=0,
        m01=0, m11=1, m21=0, m31=0,
        m02=0, m12=0, m22=1, m32=0,
        m03=0, m13=0, m23=0, m33=1,
    ) {
        this.m00 = m00
        this.m01 = m01
        this.m02 = m02
        this.m03 = m03

        this.m10 = m10
        this.m11 = m11
        this.m12 = m12
        this.m13 = m13

        this.m20 = m20
        this.m21 = m21
        this.m22 = m22
        this.m23 = m23

        this.m30 = m30
        this.m31 = m31
        this.m32 = m32
        this.m33 = m33
    }

    clone() {
        return new Matrix4(this.m00, this.m10, this.m20, this.m30,
                           this.m01, this.m11, this.m21, this.m31,
                           this.m02, this.m12, this.m22, this.m32,
                           this.m03, this.m13, this.m23, this.m33)
    }

    determinant() {
        const subfactor0 = this.m22 * this.m33 - this.m23 * this.m32
        const subfactor1 = this.m21 * this.m33 - this.m23 * this.m31
        const subfactor2 = this.m21 * this.m32 - this.m22 * this.m31
        const subfactor3 = this.m20 * this.m33 - this.m23 * this.m30
        const subfactor4 = this.m20 * this.m32 - this.m22 * this.m30
        const subfactor5 = this.m20 * this.m31 - this.m21 * this.m30

        const cofactor00 = this.m11 * subfactor0 - this.m12 * subfactor1 + this.m13 * subfactor2
        const cofactor01 = this.m10 * subfactor0 - this.m12 * subfactor3 + this.m13 * subfactor4
        const cofactor02 = this.m10 * subfactor1 - this.m11 * subfactor3 + this.m13 * subfactor5
        const cofactor03 = this.m10 * subfactor2 - this.m11 * subfactor4 + this.m12 * subfactor5

        return this.m00 * cofactor00 - this.m01 * cofactor01
             + this.m02 * cofactor02 - this.m03 * cofactor03
    }

    isIdentity() {
        return this.m00 === 1 && this.m01 === 0 && this.m02 === 0 && this.m03 === 0
        &&     this.m10 === 0 && this.m11 === 1 && this.m12 === 0 && this.m13 === 0
        &&     this.m20 === 0 && this.m21 === 0 && this.m22 === 1 && this.m23 === 0
        &&     this.m30 === 0 && this.m31 === 0 && this.m32 === 0 && this.m33 === 1
    }

    equals(other) {
        return Math.abs(this.m00 - other.m00) <= EPSILON && Math.abs(this.m10 - other.m10) <= EPSILON
        &&     Math.abs(this.m20 - other.m20) <= EPSILON && Math.abs(this.m30 - other.m30) <= EPSILON
        &&     Math.abs(this.m01 - other.m01) <= EPSILON && Math.abs(this.m11 - other.m11) <= EPSILON
        &&     Math.abs(this.m21 - other.m21) <= EPSILON && Math.abs(this.m31 - other.m31) <= EPSILON
        &&     Math.abs(this.m02 - other.m02) <= EPSILON && Math.abs(this.m12 - other.m12) <= EPSILON
        &&     Math.abs(this.m22 - other.m22) <= EPSILON && Math.abs(this.m32 - other.m32) <= EPSILON
        &&     Math.abs(this.m03 - other.m03) <= EPSILON && Math.abs(this.m13 - other.m13) <= EPSILON
        &&     Math.abs(this.m23 - other.m23) <= EPSILON && Math.abs(this.m33 - other.m33) <= EPSILON
    }
    
    identity() {
        this.m00 = 1
        this.m01 = 0
        this.m02 = 0
        this.m03 = 0
        this.m10 = 0
        this.m11 = 1
        this.m12 = 0
        this.m13 = 0
        this.m20 = 0
        this.m21 = 0
        this.m22 = 1
        this.m23 = 0
        this.m30 = 0
        this.m31 = 0
        this.m32 = 0
        this.m33 = 1
        return this
    }

    set(m00, m01, m02, m03, m10, m11, m12, m13,
        m20, m21, m22, m23, m30, m31, m32, m33)
    {
        this.m00 = m00
        this.m01 = m01
        this.m02 = m02
        this.m03 = m03
        this.m10 = m10
        this.m11 = m11
        this.m12 = m12
        this.m13 = m13
        this.m20 = m20
        this.m21 = m21
        this.m22 = m22
        this.m23 = m23
        this.m30 = m30
        this.m31 = m31
        this.m32 = m32
        this.m33 = m33
        return this
    }

    
    setCols(m00, m01, m02, m03, m10, m11, m12, m13,
            m20, m21, m22, m23, m30, m31, m32, m33)
    {
        this.m00 = m00
        this.m01 = m01
        this.m02 = m02
        this.m03 = m03
        this.m10 = m10
        this.m11 = m11
        this.m12 = m12
        this.m13 = m13
        this.m20 = m20
        this.m21 = m21
        this.m22 = m22
        this.m23 = m23
        this.m30 = m30
        this.m31 = m31
        this.m32 = m32
        this.m33 = m33
        return this
    }

    
    setRows(m00, m10, m20, m30, m01, m11, m21, m31,
            m02, m12, m22, m32, m03, m13, m23, m33)
    {
        this.m00 = m00
        this.m01 = m01
        this.m02 = m02
        this.m03 = m03
        this.m10 = m10
        this.m11 = m11
        this.m12 = m12
        this.m13 = m13
        this.m20 = m20
        this.m21 = m21
        this.m22 = m22
        this.m23 = m23
        this.m30 = m30
        this.m31 = m31
        this.m32 = m32
        this.m33 = m33
        return this
    }


    copy(other) {
        this.m00 = other.m00
        this.m01 = other.m01
        this.m02 = other.m02
        this.m03 = other.m03
        this.m10 = other.m10
        this.m11 = other.m11
        this.m12 = other.m12
        this.m13 = other.m13
        this.m20 = other.m20
        this.m21 = other.m21
        this.m22 = other.m22
        this.m23 = other.m23
        this.m30 = other.m30
        this.m31 = other.m31
        this.m32 = other.m32
        this.m33 = other.m33
        return this
    }

    transposeMatrix(matrix) {
        const m00 = matrix.m00, m01 = matrix.m01, m02 = matrix.m02, m03 = matrix.m03
        const m10 = matrix.m10, m11 = matrix.m11, m12 = matrix.m12, m13 = matrix.m13
        const m20 = matrix.m20, m21 = matrix.m21, m22 = matrix.m22, m23 = matrix.m23
        const m30 = matrix.m30, m31 = matrix.m31, m32 = matrix.m32, m33 = matrix.m33

        this.m00 = m00
        this.m01 = m10
        this.m02 = m20
        this.m03 = m30
        this.m10 = m01
        this.m11 = m11
        this.m12 = m21
        this.m13 = m31
        this.m20 = m02
        this.m21 = m12
        this.m22 = m22
        this.m23 = m32
        this.m30 = m03
        this.m31 = m13
        this.m32 = m23
        this.m33 = m33
        return this
    }

    mulMatrices(matrix0, matrix1) {
        const a00 = matrix0.m00, a01 = matrix0.m01, a02 = matrix0.m02, a03 = matrix0.m03
        const a10 = matrix0.m10, a11 = matrix0.m11, a12 = matrix0.m12, a13 = matrix0.m13
        const a20 = matrix0.m20, a21 = matrix0.m21, a22 = matrix0.m22, a23 = matrix0.m23
        const a30 = matrix0.m30, a31 = matrix0.m31, a32 = matrix0.m32, a33 = matrix0.m33

        const b00 = matrix1.m00, b01 = matrix1.m01, b02 = matrix1.m02, b03 = matrix1.m03
        const b10 = matrix1.m10, b11 = matrix1.m11, b12 = matrix1.m12, b13 = matrix1.m13
        const b20 = matrix1.m20, b21 = matrix1.m21, b22 = matrix1.m22, b23 = matrix1.m23
        const b30 = matrix1.m30, b31 = matrix1.m31, b32 = matrix1.m32, b33 = matrix1.m33

        this.m00 = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03
        this.m01 = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13
        this.m02 = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23
        this.m03 = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33
        this.m10 = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03
        this.m11 = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13
        this.m12 = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23
        this.m13 = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33
        this.m20 = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03
        this.m21 = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13
        this.m22 = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23
        this.m23 = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33
        this.m30 = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03
        this.m31 = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13
        this.m32 = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23
        this.m33 = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33
        return this
    }

    inverseMatrix(matrix) {
        const m00 = matrix.m00, m01 = matrix.m01, m02 = matrix.m02, m03 = matrix.m03
        const m10 = matrix.m10, m11 = matrix.m11, m12 = matrix.m12, m13 = matrix.m13
        const m20 = matrix.m20, m21 = matrix.m21, m22 = matrix.m22, m23 = matrix.m23
        const m30 = matrix.m30, m31 = matrix.m31, m32 = matrix.m32, m33 = matrix.m33

        const subfactor0  = m22 * m33 - m23 * m32
        const subfactor1  = m12 * m33 - m23 * m31
        const subfactor2  = m12 * m32 - m22 * m31
        const subfactor3  = m02 * m33 - m23 * m30
        const subfactor4  = m02 * m32 - m22 * m30
        const subfactor5  = m02 * m31 - m21 * m30

        const subfactor6  = m20 * m13 - m03 * m12
        const subfactor7  = m10 * m13 - m03 * m11
        const subfactor8  = m10 * m12 - m02 * m11
        const subfactor9  = m00 * m13 - m03 * m10
        const subfactor10 = m00 * m12 - m02 * m10
        const subfactor11 = m00 * m11 - m01 * m10

        const cofactor00 = m11 * subfactor0  - m12 * subfactor1  + m13 * subfactor2
        const cofactor01 = m21 * subfactor3  - m13 * subfactor4  - m10 * subfactor0
        const cofactor02 = m01 * subfactor1  - m11 * subfactor3  + m13 * subfactor5
        const cofactor03 = m11 * subfactor4  - m12 * subfactor5  - m10 * subfactor2

        const cofactor10 = m20 * subfactor1  - m03 * subfactor2  - m01 * subfactor0
        const cofactor11 = m00 * subfactor0  - m02 * subfactor3  + m03 * subfactor4
        const cofactor12 = m10 * subfactor3  - m03 * subfactor5  - m00 * subfactor1
        const cofactor13 = m00 * subfactor2  - m01 * subfactor4  + m02 * subfactor5

        const cofactor20 = m13 * subfactor6  - m32 * subfactor7  + m33 * subfactor8
        const cofactor21 = m23 * subfactor9  - m33 * subfactor10 - m30 * subfactor6
        const cofactor22 = m03 * subfactor7  - m31 * subfactor9  + m33 * subfactor11
        const cofactor23 = m13 * subfactor10 - m32 * subfactor11 - m30 * subfactor8

        const cofactor30 = m22 * subfactor7  - m23 * subfactor8  - m21 * subfactor6
        const cofactor31 = m02 * subfactor6  - m22 * subfactor9  + m23 * subfactor10
        const cofactor32 = m12 * subfactor9  - m23 * subfactor11 - m20 * subfactor7
        const cofactor33 = m02 * subfactor8  - m21 * subfactor10 + m22 * subfactor11

        const determinant = m00 * cofactor00 + m01 * cofactor01 + m02 * cofactor02 + m03 * cofactor03

        if (determinant === 0) {
            throw new Error("Determinant of the cofactor matrix cannot be zero!")
        }

        const factor = 1 / determinant

        this.m00 = cofactor00 * factor
        this.m01 = cofactor10 * factor
        this.m02 = cofactor20 * factor
        this.m03 = cofactor30 * factor

        this.m10 = cofactor01 * factor
        this.m11 = cofactor11 * factor
        this.m12 = cofactor21 * factor
        this.m13 = cofactor31 * factor

        this.m20 = cofactor02 * factor
        this.m21 = cofactor12 * factor
        this.m22 = cofactor22 * factor
        this.m23 = cofactor32 * factor

        this.m30 = cofactor03 * factor
        this.m31 = cofactor13 * factor
        this.m32 = cofactor23 * factor
        this.m33 = cofactor33 * factor

        return this
    }

    scaleMatrix(matrix, x, y, z) {
        const m00 = matrix.m00, m01 = matrix.m01, m02 = matrix.m02
        const m10 = matrix.m10, m11 = matrix.m11, m12 = matrix.m12
        const m20 = matrix.m20, m21 = matrix.m21, m22 = matrix.m22
        const m30 = matrix.m30, m31 = matrix.m31, m32 = matrix.m32

        this.m00 = x * m00
        this.m01 = y * m01
        this.m02 = z * m02
        this.m10 = x * m10
        this.m11 = y * m11
        this.m12 = z * m12
        this.m20 = x * m20
        this.m21 = y * m21
        this.m22 = z * m22
        this.m30 = x * m30
        this.m31 = y * m31
        this.m32 = z * m32
        return this
    }

    translateMatrix(matrix, x, y, z) {
        const m00 = matrix.m00, m01 = matrix.m01, m02 = matrix.m02, m03 = matrix.m03
        const m10 = matrix.m10, m11 = matrix.m11, m12 = matrix.m12, m13 = matrix.m13
        const m20 = matrix.m20, m21 = matrix.m21, m22 = matrix.m22, m23 = matrix.m23
        const m30 = matrix.m30, m31 = matrix.m31, m32 = matrix.m32, m33 = matrix.m33

        this.m00 = m00 + x * m03
        this.m10 = m10 + x * m13
        this.m20 = m20 + x * m23
        this.m30 = m30 + x * m33

        this.m01 = m01 + y * m03
        this.m11 = m11 + y * m13
        this.m21 = m21 + y * m23
        this.m31 = m31 + y * m33
        
        this.m02 = m02 + z * m03
        this.m12 = m12 + z * m13
        this.m22 = m22 + z * m23
        this.m32 = m32 + z * m33

        this.m03 = m03
        this.m13 = m13
        this.m23 = m23
        this.m33 = m33

        // this.m00 = x * m03 + m00
        // this.m10 = x * m13 + m10
        // this.m20 = x * m23 + m20
        // this.m30 = x * m33 + m30
        // this.m01 = y * m03 + m01
        // this.m11 = y * m13 + m11
        // this.m21 = y * m23 + m21
        // this.m31 = y * m33 + m31
        // this.m02 = z * m03 + m02
        // this.m12 = z * m13 + m12
        // this.m22 = z * m23 + m22
        // this.m32 = z * m03 + m32
        // this.m03 = m03
        // this.m13 = m13
        // this.m23 = m23
        // this.m33 = m33

        // this.m03 = x * m00 + y * m01 + z * m02 + m03
        // this.m13 = x * m10 + y * m11 + z * m12 + m13
        // this.m23 = x * m20 + y * m21 + z * m22 + m23
        // this.m33 = x * m30 + y * m31 + z * m32 + m33
        
        // this.m30 = x * m00 + y * m01 + z * m02 + m03
        // this.m31 = x * m10 + y * m11 + z * m12 + m13
        // this.m32 = x * m20 + y * m21 + z * m22 + m23
        // this.m33 = x * m30 + y * m31 + z * m32 + m33
        return this
    }

    rotateMatrixX(matrix, angle) {
        const m01 = matrix.m01, m02 = matrix.m02
        const m11 = matrix.m11, m12 = matrix.m12
        const m21 = matrix.m21, m22 = matrix.m22
        const m31 = matrix.m31, m32 = matrix.m32

        const c = Math.cos(angle)
        const s = Math.sin(angle)

        this.m01 = c * m01 - s * m02
        this.m02 = c * m02 + s * m01
        this.m11 = c * m11 - s * m12
        this.m12 = c * m12 + s * m11
        this.m21 = c * m21 - s * m22
        this.m22 = c * m22 + s * m21
        this.m31 = c * m31 - s * m32
        this.m32 = c * m32 + s * m31
        return this
    }

    rotateMatrixY(matrix, angle) {
        const m00 = matrix.m00, m02 = matrix.m02
        const m10 = matrix.m10, m12 = matrix.m12
        const m20 = matrix.m20, m22 = matrix.m22
        const m30 = matrix.m30, m32 = matrix.m32

        const c = Math.cos(angle)
        const s = Math.sin(angle)

        this.m00 = c * m00 + s * m02
        this.m02 = c * m02 - s * m00
        this.m10 = c * m10 + s * m12
        this.m12 = c * m12 - s * m10
        this.m20 = c * m20 + s * m22
        this.m22 = c * m22 - s * m20
        this.m30 = c * m30 + s * m32
        this.m32 = c * m32 - s * m30
        return this
    }

    rotateMatrixZ(matrix, angle) {
        const m00 = matrix.m00, m01 = matrix.m01
        const m10 = matrix.m10, m11 = matrix.m11
        const m20 = matrix.m20, m21 = matrix.m21
        const m30 = matrix.m30, m31 = matrix.m31

        const c = Math.cos(angle)
        const s = Math.sin(angle)

        this.m00 = c * m00 - s * m01
        this.m01 = c * m01 + s * m00
        this.m10 = c * m10 - s * m11
        this.m11 = c * m11 + s * m10
        this.m20 = c * m20 - s * m21
        this.m21 = c * m21 + s * m20
        this.m30 = c * m30 - s * m31
        this.m31 = c * m31 + s * m30
        return this
    }

    rotateMatrix(matrix, axisX, axisY, axisZ, angle) {
        const m00 = matrix.m00, m01 = matrix.m01, m02 = matrix.m02, m03 = matrix.m03
        const m10 = matrix.m10, m11 = matrix.m11, m12 = matrix.m12, m13 = matrix.m13
        const m20 = matrix.m20, m21 = matrix.m21, m22 = matrix.m22, m23 = matrix.m23

        const c = Math.cos(angle)
        const s = Math.sin(angle)
        const oneMinusC = 1 - c

        const length = Math.sqrt(axisX * axisX + axisY * axisY + axisZ * axisZ)

        if (length == 0) {
            throw new Error("axis vector length must be non zero!")
        }

        const factor = 1 / length
        const x = factor * axisX
        const y = factor * axisY
        const z = factor * axisZ

        const xy = x * y, xs = x * s, xx = x * x
        const xz = x * z, ys = y * s, yy = y * y
        const yz = y * z, zs = z * s, zz = z * z

        const b00 = c + xx * oneMinusC
        const b10 = xy * oneMinusC - zs
        const b20 = xz * oneMinusC + ys

        const b01 = xy * oneMinusC + zs
        const b11 = yy * oneMinusC + c
        const b21 = yz * oneMinusC - xs

        const b02 = xz * oneMinusC - ys
        const b12 = yz * oneMinusC + xs
        const b22 = zz * oneMinusC + c

        this.m00 = m10 * b10 + m20 * b20 + m00 * b00
        this.m01 = m00 * b01 + m20 * b21 + m10 * b11
        this.m02 = m00 * b02 + m10 * b12 + m20 * b22
        this.m10 = m11 * b10 + m21 * b20 + m01 * b00
        this.m11 = m01 * b01 + m21 * b21 + m11 * b11
        this.m12 = m01 * b02 + m11 * b12 + m21 * b22
        this.m20 = m12 * b10 + m22 * b20 + m02 * b00
        this.m21 = m02 * b01 + m22 * b21 + m12 * b11
        this.m22 = m02 * b02 + m12 * b12 + m22 * b22
        this.m30 = m13 * b10 + m23 * b20 + m03 * b00
        this.m31 = m03 * b01 + m23 * b21 + m13 * b11
        this.m32 = m03 * b02 + m13 * b12 + m23 * b22
        return this
    }

    transpose() {
        return this.transposeMatrix(this)
    }

    inverse() {
        return this.inverseMatrix(this)
    }

    scale(x, y, z) {
        return this.scaleMatrix(this, x, y, z)
    }

    translate(x, y, z) {
        return this.translateMatrix(this, x, y, z)
    }

    rotateX(angle) {
        return this.rotateMatrixX(this, angle)
    }

    rotateY(angle) {
        return this.rotateMatrixY(this, angle)
    }

    rotateZ(angle) {
        return this.rotateMatrixZ(this, angle)
    }

    rotate(axisX, axisY, axisZ, angle) {
        return this.rotateMatrix(this, axisX, axisY, axisZ, angle)
    }
}

export class Vertex {
    constructor(
        position = new Vector3(0, 0, 0),
        normal = new Vector3(0, 0, 0),
        colour = new Vector4(0, 0, 0, 1),
        textureCoords = new Vector2(0, 0),
        textureId = 0
    ) {
        this.position = position
        this.normal = normal
        this.colour = colour
        this.textureCoords = textureCoords
        this.textureId = textureId
    }
}

export class TriangleMesh {
    constructor(vertices = [], indices = []) {
        this.vertices = vertices
        this.indices = indices
    }
}

class QEFSolver3 {
    constructor() {
        this.ata00 = 0
        this.ata10 = 0
        this.ata20 = 0
        this.ata11 = 0
        this.ata21 = 0
        this.ata22 = 0
        this.atb0 = 0
        this.atb1 = 0
        this.atb2 = 0
        this.btb  = 0
    }

    addIntersection(x, y, z, normalX, normalY, normalZ) {
        const positionDotNormal = x * normalX + y * normalY + z * normalZ

        this.ata00 += normalX * normalX
        this.ata10 += 0
        this.ata20 += 0
        this.ata11 += 0
        this.ata21 += 0
        this.ata22 += 0
        this.atb0  += 0
        this.atb1  += 0
        this.atb2  += 0
        this.btb   += 0
    }
}

class SampleEdge {
    constructor(x0, y0, z0, sample0, x1, y1, z1, sample1) {
        this.x0 = x0
        this.y0 = y0
        this.z0 = z0
        this.x1 = x1
        this.y1 = y1
        this.z1 = z1
        this.sample0 = sample0
        this.sample1 = sample1
    }

    set(x0, y0, z0, sample0, x1, y1, z1, sample1) {
        this.x0 = x0
        this.y0 = y0
        this.z0 = z0
        this.x1 = x1
        this.y1 = y1
        this.z1 = z1
        this.sample0 = sample0
        this.sample1 = sample1
    }
}

export class SampleOctreeRoot {
    constructor(minX, minY, minZ, maxX, maxY, maxZ, depth = 0) {
        this.kind  = SAMPLE_OCTREE_KIND_ROOT
        this.minX = minX
        this.minY = minY
        this.minZ = minZ
        this.maxX = maxX
        this.maxY = maxY
        this.maxZ = maxZ
        this.depth = depth
        this.node000 = null
        this.node100 = null
        this.node110 = null
        this.node010 = null
        this.node001 = null
        this.node101 = null
        this.node111 = null
        this.node011 = null
        this.sample000 = null
        this.sample100 = null
        this.sample110 = null
        this.sample010 = null
        this.sample001 = null
        this.sample101 = null
        this.sample111 = null
        this.sample011 = null
    }

    sampleSignedDistanceField(field, maxDepth, mergeThreshold = null) {
        const minX = this.minX, maxX = this.maxX, centerX = (maxX + minX) / 2
        const minY = this.minY, maxY = this.maxY, centerY = (maxY + minY) / 2
        const minZ = this.minZ, maxZ = this.maxZ, centerZ = (maxZ + minZ) / 2

        const centerSample = field.calculateSignedDistance(centerX, centerY, centerZ)
        const centerRightSample = field.calculateSignedDistance(maxX, centerY, centerZ)
        const centerLeftSample = field.calculateSignedDistance(minX, centerY, centerZ)
        const centerNearSample = field.calculateSignedDistance(centerX, minY, centerZ)
        const centerFarSample = field.calculateSignedDistance(centerX, maxY, centerZ)
        const centerTopSample = field.calculateSignedDistance(centerX, centerY, maxZ)
        const centerBottomSample = field.calculateSignedDistance(centerX, centerY, minZ)

        if (mergeThreshold != null) {
            const centerInterp = interpolatePoint(field, minX, minY, minZ, maxX, maxY, maxZ, centerX, centerY, centerZ)
            const centerRightInterp = interpolatePoint(field, minX, minY, minZ, maxX, maxY, maxZ, maxX, centerY, centerZ)
            const centerLeftInterp = interpolatePoint(field, minX, minY, minZ, maxX, maxY, maxZ, minX, centerY, centerZ)
            const centerNearInterp = interpolatePoint(field, minX, minY, minZ, maxX, maxY, maxZ, centerX, minY, centerZ)
            const centerFarInterp = interpolatePoint(field, minX, minY, minZ, maxX, maxY, maxZ, centerX, maxY, centerZ)
            const centerTopInterp = interpolatePoint(field, minX, minY, minZ, maxX, maxY, maxZ, centerX, centerY, maxZ)
            const centerBottomInterp = interpolatePoint(field, minX, minY, minZ, maxX, maxY, maxZ, centerX, centerY, minZ)
            
            const accurateBilinearInterpolation = Math.abs(centerSample - centerInterp) <= mergeThreshold
            &&                                      Math.abs(centerRightSample - centerRightInterp) <= mergeThreshold
            &&                                      Math.abs(centerLeftSample - centerLeftInterp) <= mergeThreshold
            &&                                      Math.abs(centerNearSample - centerNearInterp) <= mergeThreshold
            &&                                      Math.abs(centerFarSample - centerFarInterp) <= mergeThreshold
            &&                                      Math.abs(centerTopSample - centerTopInterp) <= mergeThreshold
            &&                                      Math.abs(centerBottomSample - centerBottomInterp) <= mergeThreshold

            if (accurateBilinearInterpolation) {
                const result = new SampleOctreeLeaf(minX, minY, minZ, maxX, maxY, maxZ, this.depth)
                result.sample000 = field.calculateSignedDistance(minX, minY, minZ)
                result.sample001 = field.calculateSignedDistance(minX, minY, maxZ)
                result.sample010 = field.calculateSignedDistance(minX, maxY, minZ)
                result.sample011 = field.calculateSignedDistance(minX, maxY, maxZ)
                result.sample100 = field.calculateSignedDistance(maxX, minY, minZ)
                result.sample101 = field.calculateSignedDistance(maxX, minY, maxZ)
                result.sample110 = field.calculateSignedDistance(maxX, maxY, minZ)
                result.sample111 = field.calculateSignedDistance(maxX, maxY, maxZ)
                return result.sampleSignedDistanceField(field, maxDepth, mergeThreshold)
            }
        }

        const nextDepth = this.depth + 1
        if (nextDepth == maxDepth) {
            this.node000 = new SampleOctreeLeaf(minX, minY, minZ, centerX, centerY, centerZ, maxDepth)
            this.node001 = new SampleOctreeLeaf(minX, minY, centerZ, centerX, centerY, maxZ, maxDepth)
            this.node010 = new SampleOctreeLeaf(minX, centerY, minZ, centerX, maxY, centerZ, maxDepth)
            this.node011 = new SampleOctreeLeaf(minX, centerY, centerZ, centerX, maxY, maxZ, maxDepth)
            this.node100 = new SampleOctreeLeaf(centerX, minY, minZ, maxX, centerY, centerZ, maxDepth)
            this.node101 = new SampleOctreeLeaf(centerX, minY, centerZ, maxX, centerY, maxZ, maxDepth)
            this.node110 = new SampleOctreeLeaf(centerX, centerY, minZ, maxX, maxY, centerZ, maxDepth)
            this.node111 = new SampleOctreeLeaf(centerX, centerY, centerZ, maxX, maxY, maxZ, maxDepth)
        }
        else {
            this.node000 = new SampleOctreeRoot(minX, minY, minZ, centerX, centerY, centerZ, nextDepth)
            this.node001 = new SampleOctreeRoot(minX, minY, centerZ, centerX, centerY, maxZ, nextDepth)
            this.node010 = new SampleOctreeRoot(minX, centerY, minZ, centerX, maxY, centerZ, nextDepth)
            this.node011 = new SampleOctreeRoot(minX, centerY, centerZ, centerX, maxY, maxZ, nextDepth)
            this.node100 = new SampleOctreeRoot(centerX, minY, minZ, maxX, centerY, centerZ, nextDepth)
            this.node101 = new SampleOctreeRoot(centerX, minY, centerZ, maxX, centerY, maxZ, nextDepth)
            this.node110 = new SampleOctreeRoot(centerX, centerY, minZ, maxX, maxY, centerZ, nextDepth)
            this.node111 = new SampleOctreeRoot(centerX, centerY, centerZ, maxX, maxY, maxZ, nextDepth)
        }

        const centerMinMinSample = field.calculateSignedDistance(centerX, minY, minZ)
        const centerMaxMinSample = field.calculateSignedDistance(centerX, maxY, minZ)
        const centerMaxMaxSample = field.calculateSignedDistance(centerX, maxY, maxZ)
        const centerMinMaxSample = field.calculateSignedDistance(centerX, minY, maxZ)
        const minCenterMinSample = field.calculateSignedDistance(minX, centerY, minZ)
        const maxCenterMinSample = field.calculateSignedDistance(maxX, centerY, minZ)
        const maxCenterMaxSample = field.calculateSignedDistance(maxX, centerY, maxZ)
        const minCenterMaxSample = field.calculateSignedDistance(minX, centerY, maxZ)
        const minMinCenterSample = field.calculateSignedDistance(minX, minY, centerZ)
        const maxMinCenterSample = field.calculateSignedDistance(maxX, minY, centerZ)
        const maxMaxCenterSample = field.calculateSignedDistance(maxX, maxY, centerZ)
        const minMaxCenterSample = field.calculateSignedDistance(minX, maxY, centerZ)

        // calculate corners
        this.sample000 ??= field.calculateSignedDistance(minX, minY, minZ)
        this.sample001 ??= field.calculateSignedDistance(minX, minY, maxZ)
        this.sample010 ??= field.calculateSignedDistance(minX, maxY, minZ)
        this.sample011 ??= field.calculateSignedDistance(minX, maxY, maxZ)
        this.sample100 ??= field.calculateSignedDistance(maxX, minY, minZ)
        this.sample101 ??= field.calculateSignedDistance(maxX, minY, maxZ)
        this.sample110 ??= field.calculateSignedDistance(maxX, maxY, minZ)
        this.sample111 ??= field.calculateSignedDistance(maxX, maxY, maxZ)

        // distibute corners
        this.node000.sample000 = this.sample000
        this.node001.sample001 = this.sample001
        this.node010.sample010 = this.sample010
        this.node011.sample011 = this.sample011
        this.node100.sample100 = this.sample100
        this.node101.sample101 = this.sample101
        this.node110.sample110 = this.sample110
        this.node111.sample111 = this.sample111

        // distibute center
        this.node000.sample111 = centerSample
        this.node001.sample110 = centerSample
        this.node010.sample101 = centerSample
        this.node011.sample100 = centerSample
        this.node100.sample011 = centerSample
        this.node101.sample010 = centerSample
        this.node110.sample001 = centerSample
        this.node111.sample000 = centerSample

        // distibute faces left-right
        this.node100.sample111 = centerRightSample
        this.node101.sample110 = centerRightSample
        this.node110.sample101 = centerRightSample
        this.node111.sample100 = centerRightSample

        this.node000.sample011 = centerLeftSample
        this.node001.sample010 = centerLeftSample
        this.node010.sample001 = centerLeftSample
        this.node011.sample000 = centerLeftSample

        // distibute faces near-far
        this.node010.sample111 = centerFarSample
        this.node011.sample110 = centerFarSample
        this.node110.sample011 = centerFarSample
        this.node111.sample010 = centerFarSample

        this.node000.sample101 = centerNearSample
        this.node001.sample100 = centerNearSample
        this.node100.sample001 = centerNearSample
        this.node101.sample000 = centerNearSample

        // distibute faces bottom-top
        this.node001.sample111 = centerTopSample
        this.node011.sample101 = centerTopSample
        this.node101.sample011 = centerTopSample
        this.node111.sample001 = centerTopSample

        this.node000.sample110 = centerBottomSample
        this.node010.sample100 = centerBottomSample
        this.node100.sample010 = centerBottomSample
        this.node110.sample000 = centerBottomSample

        // distibute edges
        this.node100.sample000 = this.node000.sample100 = centerMinMinSample
        this.node110.sample010 = this.node010.sample110 = centerMaxMinSample
        this.node111.sample011 = this.node011.sample111 = centerMaxMaxSample
        this.node101.sample001 = this.node001.sample101 = centerMinMaxSample
        this.node010.sample000 = this.node000.sample010 = minCenterMinSample
        this.node110.sample100 = this.node100.sample110 = maxCenterMinSample
        this.node111.sample101 = this.node101.sample111 = maxCenterMaxSample
        this.node011.sample001 = this.node001.sample011 = minCenterMaxSample
        this.node001.sample000 = this.node000.sample001 = minMinCenterSample
        this.node101.sample100 = this.node100.sample101 = maxMinCenterSample
        this.node111.sample110 = this.node110.sample111 = maxMaxCenterSample
        this.node011.sample010 = this.node010.sample011 = minMaxCenterSample

        this.sample000 = null
        this.sample001 = null
        this.sample010 = null
        this.sample011 = null
        this.sample100 = null
        this.sample101 = null
        this.sample110 = null
        this.sample111 = null

        this.node000 = this.node000.sampleSignedDistanceField(field, maxDepth, mergeThreshold)
        this.node001 = this.node001.sampleSignedDistanceField(field, maxDepth, mergeThreshold)
        this.node010 = this.node010.sampleSignedDistanceField(field, maxDepth, mergeThreshold)
        this.node011 = this.node011.sampleSignedDistanceField(field, maxDepth, mergeThreshold)
        this.node100 = this.node100.sampleSignedDistanceField(field, maxDepth, mergeThreshold)
        this.node101 = this.node101.sampleSignedDistanceField(field, maxDepth, mergeThreshold)
        this.node110 = this.node110.sampleSignedDistanceField(field, maxDepth, mergeThreshold)
        this.node111 = this.node111.sampleSignedDistanceField(field, maxDepth, mergeThreshold)

        const childrenKind = this.node000.kind | this.node100.kind | this.node110.kind | this.node010.kind
        |                    this.node001.kind | this.node101.kind | this.node111.kind | this.node011.kind

        if (childrenKind == SAMPLE_OCTREE_KIND_FULL) {
            return _SAMPLE_OCTREE_FULL
        }

        if (childrenKind == SAMPLE_OCTREE_KIND_EMPTY) {
            return _SAMPLE_OCTREE_EMPTY
        }

        return this
    }
}

export class SampleOctreeLeaf {
    constructor(minX, minY, minZ, maxX, maxY, maxZ, depth) {
        this.kind = SAMPLE_OCTREE_KIND_LEAF
        this.minX = minX
        this.minY = minY
        this.minZ = minZ
        this.maxX = maxX
        this.maxY = maxY
        this.maxZ = maxZ
        this.depth = depth
        this.sample000 = 0
        this.sample100 = 0
        this.sample110 = 0
        this.sample010 = 0
        this.sample001 = 0
        this.sample101 = 0
        this.sample111 = 0
        this.sample011 = 0
        this.surfaceVertex = null
    }

    #getNodeState() {
        let nodeState = 0
        if (this.sample000 < 0) nodeState |= 0x01
        if (this.sample001 < 0) nodeState |= 0x02
        if (this.sample010 < 0) nodeState |= 0x04
        if (this.sample011 < 0) nodeState |= 0x08
        if (this.sample100 < 0) nodeState |= 0x10
        if (this.sample101 < 0) nodeState |= 0x20
        if (this.sample110 < 0) nodeState |= 0x40
        if (this.sample111 < 0) nodeState |= 0x80
        return nodeState
    }

    #getTemporaryEdges(edges) {
        const minX = this.minX, minY = this.minY, minZ = this.minZ
        const maxX = this.maxX, maxY = this.maxY, maxZ = this.maxZ

        edges[ 0].set(minX, minY, minZ, this.sample000, maxX, minY, minZ, this.sample100)
        edges[ 1].set(minX, maxY, minZ, this.sample010, maxX, maxY, minZ, this.sample110)
        edges[ 2].set(minX, minY, maxZ, this.sample001, maxX, minY, maxZ, this.sample101)
        edges[ 3].set(minX, maxY, maxZ, this.sample011, maxX, maxY, maxZ, this.sample111)
        edges[ 4].set(minX, minY, minZ, this.sample000, minX, maxY, minZ, this.sample010)
        edges[ 5].set(maxX, minY, minZ, this.sample100, maxX, maxY, minZ, this.sample110)
        edges[ 6].set(minX, minY, maxZ, this.sample001, minX, maxY, maxZ, this.sample011)
        edges[ 7].set(maxX, minY, maxZ, this.sample101, maxX, maxY, maxZ, this.sample111)
        edges[ 8].set(minX, minY, minZ, this.sample000, minX, minY, maxZ, this.sample001)
        edges[ 9].set(maxX, minY, minZ, this.sample100, maxX, minY, maxZ, this.sample101)
        edges[10].set(maxX, maxY, minZ, this.sample110, maxX, maxY, maxZ, this.sample111)
        edges[11].set(minX, maxY, minZ, this.sample010, minX, maxY, maxZ, this.sample011)

        return edges
    }

    sampleSignedDistanceField(field) {
        const nodeState = this.#getNodeState()
        if (nodeState == ALL_SAMPLES_INSIDE) return _SAMPLE_OCTREE_FULL
        if (nodeState == ALL_SAMPLES_OUTSIDE) return _SAMPLE_OCTREE_EMPTY

        const position = this.calculateSurfacePosition(field)
        position.x = clamp(position.x, this.minX, this.maxX)
        position.y = clamp(position.y, this.minY, this.maxY)
        position.z = clamp(position.z, this.minZ, this.maxZ)
        const normal = field.calculateGradient(position.x, position.y, position.z).normalize()
        this.surfaceVertex = new Vertex(position, normal)
        return this
    }
    
    calculateSurfacePosition() {
        const edges = this.#getTemporaryEdges(_tempEdges)

        let x = 0, y = 0, z = 0, intersectionCount = 0
        for (let idx = 0; idx < edges.length; ++idx) {
            const edge = edges[idx]
            const dx = edge.x1 - edge.x0
            const dy = edge.y1 - edge.y0
            const dz = edge.z1 - edge.z0
            
            if ((edge.sample0 < 0) != (edge.sample1 < 0)) {
                const t = Math.abs(edge.sample0) / (Math.abs(edge.sample0) + Math.abs(edge.sample1))
                x += dx * t + edge.x0
                y += dy * t + edge.y0
                z += dz * t + edge.z0
                intersectionCount += 1
            }
        }

        if (intersectionCount == 0) {
            return null
        }

        const factor = 1 / intersectionCount
        return new Vector3(x * factor, y * factor, z * factor)
    }
}

export class SampleOctreeEmpty {
    constructor() {
        this.kind = SAMPLE_OCTREE_KIND_EMPTY
    }
}

export class SampleOctreeFull {
    constructor() {
        this.kind = SAMPLE_OCTREE_KIND_FULL
    }
}

export class SampleOctreeMeshBuilder {
    constructor() {
        this.vertices = []
        this.indices = []
    }

    getMesh() {
        return new TriangleMesh(this.vertices, this.indices)
    }

    clear() {
        this.vertices = []
        this.indices = []
    }

    buildMesh(... nodes) {
        for (let idx = 0; idx < nodes.length; ++idx) {
            this.processCell(nodes[idx])
        }

        return new TriangleMesh(this.vertices, this.indices)
    }

    addTriangle(node0, node1, node2, shouldFlip = false) {
        const vertexCount = this.vertices.length
        
        if (shouldFlip) {
            this.indices.push(vertexCount + 2, vertexCount + 1, vertexCount + 0)
        }
        else {
            this.indices.push(vertexCount + 0, vertexCount + 1, vertexCount + 2)
        }

        this.vertices.push(
            node0.surfaceVertex,
            node1.surfaceVertex,
            node2.surfaceVertex,
        )
    }

    addQuad(node0, node1, node2, node3, shouldFlip = false) {
        if (node0 == node2 || node1 == node3) {
            throw new Error("Invalid quad winding!")
        }

        if (node0 == node1) return this.addTriangle(node0, node2, node3, shouldFlip)
        if (node0 == node3) return this.addTriangle(node0, node1, node2, shouldFlip)
        if (node1 == node2) return this.addTriangle(node0, node1, node3, shouldFlip)
        if (node2 == node3) return this.addTriangle(node0, node1, node2, shouldFlip)

        const vertexCount = this.vertices.length
        
        if (shouldFlip) {
            this.indices.push(vertexCount + 3, vertexCount + 2, vertexCount + 0,
                              vertexCount + 2, vertexCount + 1, vertexCount + 0)
        }
        else {
            this.indices.push(vertexCount + 0, vertexCount + 1, vertexCount + 2,
                              vertexCount + 0, vertexCount + 2, vertexCount + 3)
        }

        this.vertices.push(
            node0.surfaceVertex,
            node1.surfaceVertex,
            node2.surfaceVertex,
            node3.surfaceVertex,
        )
    }

    processCell(node) {
        if (node.kind != SAMPLE_OCTREE_KIND_ROOT) {
            return
        }

        this.processCell(node.node000)
        this.processCell(node.node001)
        this.processCell(node.node010)
        this.processCell(node.node011)
        this.processCell(node.node100)
        this.processCell(node.node101)
        this.processCell(node.node110)
        this.processCell(node.node111)

        this.processFaceX(node.node000, node.node100)
        this.processFaceX(node.node010, node.node110)
        this.processFaceX(node.node011, node.node111)
        this.processFaceX(node.node001, node.node101)

        this.processFaceY(node.node000, node.node010)
        this.processFaceY(node.node100, node.node110)
        this.processFaceY(node.node101, node.node111)
        this.processFaceY(node.node001, node.node011)

        this.processFaceZ(node.node000, node.node001)
        this.processFaceZ(node.node100, node.node101)
        this.processFaceZ(node.node110, node.node111)
        this.processFaceZ(node.node010, node.node011)

        this.processEdgeX(node.node000, node.node010, node.node011, node.node001)
        this.processEdgeX(node.node100, node.node110, node.node111, node.node101)

        this.processEdgeY(node.node000, node.node100, node.node101, node.node001)
        this.processEdgeY(node.node010, node.node110, node.node111, node.node011)

        this.processEdgeZ(node.node000, node.node100, node.node110, node.node010)
        this.processEdgeZ(node.node001, node.node101, node.node111, node.node011)
    }

    processFaceX(node0, node1) {
        const kind = node0.kind | node1.kind
        if ((kind & SAMPLE_OCTREE_FULL_OR_EMPTY) || (kind & SAMPLE_OCTREE_KIND_ROOT) == 0) {
            return
        }

        let children000 = node0
        let children010 = node0
        let children100 = node1
        let children110 = node1
        let children001 = node0
        let children011 = node0
        let children101 = node1
        let children111 = node1

        if (node0.kind == SAMPLE_OCTREE_KIND_ROOT) {
            children000 = node0.node100
            children010 = node0.node110
            children001 = node0.node101
            children011 = node0.node111
        }

        if (node1.kind == SAMPLE_OCTREE_KIND_ROOT) {
            children100 = node1.node000
            children110 = node1.node010
            children101 = node1.node001
            children111 = node1.node011
        }

        this.processFaceX(children000, children100)
        this.processFaceX(children010, children110)
        this.processFaceX(children011, children111)
        this.processFaceX(children001, children101)

        this.processEdgeY(children000, children100, children101, children001)
        this.processEdgeY(children010, children110, children111, children011)

        this.processEdgeZ(children000, children100, children110, children010)
        this.processEdgeZ(children001, children101, children111, children011)
    }

    processFaceY(node0, node1) {
        const kind = node0.kind | node1.kind
        if ((kind & SAMPLE_OCTREE_FULL_OR_EMPTY) || (kind & SAMPLE_OCTREE_KIND_ROOT) == 0) {
            return
        }

        let children000 = node0
        let children100 = node0
        let children010 = node1
        let children110 = node1
        let children001 = node0
        let children101 = node0
        let children011 = node1
        let children111 = node1

        if (node0.kind == SAMPLE_OCTREE_KIND_ROOT) {
            children000 = node0.node010
            children100 = node0.node110
            children001 = node0.node011
            children101 = node0.node111
        }

        if (node1.kind == SAMPLE_OCTREE_KIND_ROOT) {
            children010 = node1.node000
            children110 = node1.node100
            children011 = node1.node001
            children111 = node1.node101
        }

        this.processFaceY(children000, children010)
        this.processFaceY(children100, children110)
        this.processFaceY(children101, children111)
        this.processFaceY(children001, children011)

        this.processEdgeX(children000, children010, children011, children001)
        this.processEdgeX(children100, children110, children111, children101)

        this.processEdgeZ(children000, children100, children110, children010)
        this.processEdgeZ(children001, children101, children111, children011)
    }

    processFaceZ(node0, node1) {
        const kind = node0.kind | node1.kind
        if ((kind & SAMPLE_OCTREE_FULL_OR_EMPTY) || (kind & SAMPLE_OCTREE_KIND_ROOT) == 0) {
            return
        }

        let children000 = node0
        let children100 = node0
        let children001 = node1
        let children101 = node1
        let children010 = node0
        let children110 = node0
        let children011 = node1
        let children111 = node1

        if (node0.kind == SAMPLE_OCTREE_KIND_ROOT) {
            children000 = node0.node001
            children100 = node0.node101
            children010 = node0.node011
            children110 = node0.node111
        }

        if (node1.kind == SAMPLE_OCTREE_KIND_ROOT) {
            children001 = node1.node000
            children101 = node1.node100
            children011 = node1.node010
            children111 = node1.node110
        }

        this.processFaceZ(children000, children001)
        this.processFaceZ(children100, children101)
        this.processFaceZ(children110, children111)
        this.processFaceZ(children010, children011)

        this.processEdgeX(children000, children010, children011, children001)
        this.processEdgeX(children100, children110, children111, children101)

        this.processEdgeY(children000, children100, children101, children001)
        this.processEdgeY(children010, children110, children111, children011)
    }

    processEdgeX(node0, node1, node2, node3) {
        const kind = node0.kind | node1.kind | node2.kind | node3.kind

        if (kind & SAMPLE_OCTREE_FULL_OR_EMPTY) {
            return
        }

        if ((kind & SAMPLE_OCTREE_KIND_ROOT) == 0) {
            const test = getHighestDepthNode(node0, node1, node2, node3)

            let shouldFlip = false
            switch (test) {
            case node0: shouldFlip = node0.sample111 < node0.sample011; break
            case node1: shouldFlip = node1.sample101 < node1.sample001; break
            case node2: shouldFlip = node2.sample100 < node2.sample000; break
            case node3: shouldFlip = node3.sample110 < node3.sample010; break
            }

            this.addQuad(node0, node1, node2, node3, shouldFlip)
        }
        else {
            const children000 = node0.kind == SAMPLE_OCTREE_KIND_ROOT ? node0.node011 : node0
            const children100 = node0.kind == SAMPLE_OCTREE_KIND_ROOT ? node0.node111 : node0
            const children010 = node1.kind == SAMPLE_OCTREE_KIND_ROOT ? node1.node001 : node1
            const children110 = node1.kind == SAMPLE_OCTREE_KIND_ROOT ? node1.node101 : node1
            const children001 = node3.kind == SAMPLE_OCTREE_KIND_ROOT ? node3.node010 : node3
            const children101 = node3.kind == SAMPLE_OCTREE_KIND_ROOT ? node3.node110 : node3
            const children011 = node2.kind == SAMPLE_OCTREE_KIND_ROOT ? node2.node000 : node2
            const children111 = node2.kind == SAMPLE_OCTREE_KIND_ROOT ? node2.node100 : node2

            this.processEdgeX(children000, children010, children011, children001)
            this.processEdgeX(children100, children110, children111, children101)
        }
    }

    processEdgeY(node0, node1, node2, node3) {
        const kind = node0.kind | node1.kind | node2.kind | node3.kind

        if (kind & SAMPLE_OCTREE_FULL_OR_EMPTY) {
            return
        }

        if ((kind & SAMPLE_OCTREE_KIND_ROOT) == 0) {
            const test = getHighestDepthNode(node0, node1, node2, node3)

            let shouldFlip = false
            switch (test) {
            case node0: shouldFlip = node0.sample101 < node0.sample111; break
            case node1: shouldFlip = node1.sample001 < node1.sample011; break
            case node2: shouldFlip = node2.sample000 < node2.sample010; break
            case node3: shouldFlip = node3.sample100 < node3.sample110; break
            }

            this.addQuad(node0, node1, node2, node3, shouldFlip)
        }
        else {
            const children000 = node0.kind == SAMPLE_OCTREE_KIND_ROOT ? node0.node101 : node0
            const children010 = node0.kind == SAMPLE_OCTREE_KIND_ROOT ? node0.node111 : node0
            const children100 = node1.kind == SAMPLE_OCTREE_KIND_ROOT ? node1.node001 : node1
            const children110 = node1.kind == SAMPLE_OCTREE_KIND_ROOT ? node1.node011 : node1
            const children001 = node3.kind == SAMPLE_OCTREE_KIND_ROOT ? node3.node100 : node3
            const children011 = node3.kind == SAMPLE_OCTREE_KIND_ROOT ? node3.node110 : node3
            const children101 = node2.kind == SAMPLE_OCTREE_KIND_ROOT ? node2.node000 : node2
            const children111 = node2.kind == SAMPLE_OCTREE_KIND_ROOT ? node2.node010 : node2

            this.processEdgeY(children000, children100, children101, children001)
            this.processEdgeY(children010, children110, children111, children011)
        }
    }

    processEdgeZ(node0, node1, node2, node3) {
        const kind = node0.kind | node1.kind | node2.kind | node3.kind

        if (kind & SAMPLE_OCTREE_FULL_OR_EMPTY) {
            return
        }

        if ((kind & SAMPLE_OCTREE_KIND_ROOT) == 0) {
            const test = getHighestDepthNode(node0, node1, node2, node3)

            let shouldFlip = false
            switch (test) {
            case node0: shouldFlip = node0.sample111 < node0.sample110; break
            case node1: shouldFlip = node1.sample011 < node1.sample010; break
            case node2: shouldFlip = node2.sample001 < node2.sample000; break
            case node3: shouldFlip = node3.sample101 < node3.sample100; break
            }

            this.addQuad(node0, node1, node2, node3, shouldFlip)
        }
        else {
            const children000 = node0.kind == SAMPLE_OCTREE_KIND_ROOT ? node0.node110 : node0
            const children001 = node0.kind == SAMPLE_OCTREE_KIND_ROOT ? node0.node111 : node0
            const children100 = node1.kind == SAMPLE_OCTREE_KIND_ROOT ? node1.node010 : node1
            const children101 = node1.kind == SAMPLE_OCTREE_KIND_ROOT ? node1.node011 : node1
            const children010 = node3.kind == SAMPLE_OCTREE_KIND_ROOT ? node3.node100 : node3
            const children011 = node3.kind == SAMPLE_OCTREE_KIND_ROOT ? node3.node101 : node3
            const children110 = node2.kind == SAMPLE_OCTREE_KIND_ROOT ? node2.node000 : node2
            const children111 = node2.kind == SAMPLE_OCTREE_KIND_ROOT ? node2.node001 : node2

            this.processEdgeZ(children000, children100, children110, children010)
            this.processEdgeZ(children001, children101, children111, children011)
        }
    }
}

const index000 = 0
const index100 = 1
const index110 = 2
const index010 = 3
const index001 = 4
const index101 = 5
const index111 = 6
const index011 = 7

export class SampleOctreeRoot_ {
    constructor(boundingBox, depth = 0) {
        this.kind  = SAMPLE_OCTREE_KIND_ROOT
        this.boundingBox = boundingBox
        this.depth = depth
        this.nodes = [
            null, null, null, null,
            null, null, null, null,
        ]
        this.samples = [
            null, null, null, null,
            null, null, null, null,
        ]
    }

    sampleSignedDistanceField(field, maxDepth, mergeThreshold = null) {
        const minX = this.minX, maxX = this.maxX, centerX = (maxX + minX) / 2
        const minY = this.minY, maxY = this.maxY, centerY = (maxY + minY) / 2
        const minZ = this.minZ, maxZ = this.maxZ, centerZ = (maxZ + minZ) / 2

        const centerSample = field.calculateSignedDistance(centerX, centerY, centerZ)
        const centerRightSample = field.calculateSignedDistance(maxX, centerY, centerZ)
        const centerLeftSample = field.calculateSignedDistance(minX, centerY, centerZ)
        const centerNearSample = field.calculateSignedDistance(centerX, minY, centerZ)
        const centerFarSample = field.calculateSignedDistance(centerX, maxY, centerZ)
        const centerTopSample = field.calculateSignedDistance(centerX, centerY, maxZ)
        const centerBottomSample = field.calculateSignedDistance(centerX, centerY, minZ)

        if (mergeThreshold != null) {
            const centerInterp = interpolatePoint(field, minX, minY, minZ, maxX, maxY, maxZ, centerX, centerY, centerZ)
            const centerRightInterp = interpolatePoint(field, minX, minY, minZ, maxX, maxY, maxZ, maxX, centerY, centerZ)
            const centerLeftInterp = interpolatePoint(field, minX, minY, minZ, maxX, maxY, maxZ, minX, centerY, centerZ)
            const centerNearInterp = interpolatePoint(field, minX, minY, minZ, maxX, maxY, maxZ, centerX, minY, centerZ)
            const centerFarInterp = interpolatePoint(field, minX, minY, minZ, maxX, maxY, maxZ, centerX, maxY, centerZ)
            const centerTopInterp = interpolatePoint(field, minX, minY, minZ, maxX, maxY, maxZ, centerX, centerY, maxZ)
            const centerBottomInterp = interpolatePoint(field, minX, minY, minZ, maxX, maxY, maxZ, centerX, centerY, minZ)
            
            const accurateBilinearInterpolation = Math.abs(centerSample - centerInterp) <= mergeThreshold
            &&                                      Math.abs(centerRightSample - centerRightInterp) <= mergeThreshold
            &&                                      Math.abs(centerLeftSample - centerLeftInterp) <= mergeThreshold
            &&                                      Math.abs(centerNearSample - centerNearInterp) <= mergeThreshold
            &&                                      Math.abs(centerFarSample - centerFarInterp) <= mergeThreshold
            &&                                      Math.abs(centerTopSample - centerTopInterp) <= mergeThreshold
            &&                                      Math.abs(centerBottomSample - centerBottomInterp) <= mergeThreshold

            if (accurateBilinearInterpolation) {
                const result = new SampleOctreeLeaf(minX, minY, minZ, maxX, maxY, maxZ, this.depth)
                result.sample000 = field.calculateSignedDistance(minX, minY, minZ)
                result.sample001 = field.calculateSignedDistance(minX, minY, maxZ)
                result.sample010 = field.calculateSignedDistance(minX, maxY, minZ)
                result.sample011 = field.calculateSignedDistance(minX, maxY, maxZ)
                result.sample100 = field.calculateSignedDistance(maxX, minY, minZ)
                result.sample101 = field.calculateSignedDistance(maxX, minY, maxZ)
                result.sample110 = field.calculateSignedDistance(maxX, maxY, minZ)
                result.sample111 = field.calculateSignedDistance(maxX, maxY, maxZ)
                return result.sampleSignedDistanceField(field, maxDepth, mergeThreshold)
            }
        }

        const nextDepth = this.depth + 1
        if (nextDepth == maxDepth) {
            this.node000 = new SampleOctreeLeaf(minX, minY, minZ, centerX, centerY, centerZ, maxDepth)
            this.node001 = new SampleOctreeLeaf(minX, minY, centerZ, centerX, centerY, maxZ, maxDepth)
            this.node010 = new SampleOctreeLeaf(minX, centerY, minZ, centerX, maxY, centerZ, maxDepth)
            this.node011 = new SampleOctreeLeaf(minX, centerY, centerZ, centerX, maxY, maxZ, maxDepth)
            this.node100 = new SampleOctreeLeaf(centerX, minY, minZ, maxX, centerY, centerZ, maxDepth)
            this.node101 = new SampleOctreeLeaf(centerX, minY, centerZ, maxX, centerY, maxZ, maxDepth)
            this.node110 = new SampleOctreeLeaf(centerX, centerY, minZ, maxX, maxY, centerZ, maxDepth)
            this.node111 = new SampleOctreeLeaf(centerX, centerY, centerZ, maxX, maxY, maxZ, maxDepth)
        }
        else {
            this.node000 = new SampleOctreeRoot(minX, minY, minZ, centerX, centerY, centerZ, nextDepth)
            this.node001 = new SampleOctreeRoot(minX, minY, centerZ, centerX, centerY, maxZ, nextDepth)
            this.node010 = new SampleOctreeRoot(minX, centerY, minZ, centerX, maxY, centerZ, nextDepth)
            this.node011 = new SampleOctreeRoot(minX, centerY, centerZ, centerX, maxY, maxZ, nextDepth)
            this.node100 = new SampleOctreeRoot(centerX, minY, minZ, maxX, centerY, centerZ, nextDepth)
            this.node101 = new SampleOctreeRoot(centerX, minY, centerZ, maxX, centerY, maxZ, nextDepth)
            this.node110 = new SampleOctreeRoot(centerX, centerY, minZ, maxX, maxY, centerZ, nextDepth)
            this.node111 = new SampleOctreeRoot(centerX, centerY, centerZ, maxX, maxY, maxZ, nextDepth)
        }

        const centerMinMinSample = field.calculateSignedDistance(centerX, minY, minZ)
        const centerMaxMinSample = field.calculateSignedDistance(centerX, maxY, minZ)
        const centerMaxMaxSample = field.calculateSignedDistance(centerX, maxY, maxZ)
        const centerMinMaxSample = field.calculateSignedDistance(centerX, minY, maxZ)
        const minCenterMinSample = field.calculateSignedDistance(minX, centerY, minZ)
        const maxCenterMinSample = field.calculateSignedDistance(maxX, centerY, minZ)
        const maxCenterMaxSample = field.calculateSignedDistance(maxX, centerY, maxZ)
        const minCenterMaxSample = field.calculateSignedDistance(minX, centerY, maxZ)
        const minMinCenterSample = field.calculateSignedDistance(minX, minY, centerZ)
        const maxMinCenterSample = field.calculateSignedDistance(maxX, minY, centerZ)
        const maxMaxCenterSample = field.calculateSignedDistance(maxX, maxY, centerZ)
        const minMaxCenterSample = field.calculateSignedDistance(minX, maxY, centerZ)

        // calculate corners
        this.sample000 ??= field.calculateSignedDistance(minX, minY, minZ)
        this.sample001 ??= field.calculateSignedDistance(minX, minY, maxZ)
        this.sample010 ??= field.calculateSignedDistance(minX, maxY, minZ)
        this.sample011 ??= field.calculateSignedDistance(minX, maxY, maxZ)
        this.sample100 ??= field.calculateSignedDistance(maxX, minY, minZ)
        this.sample101 ??= field.calculateSignedDistance(maxX, minY, maxZ)
        this.sample110 ??= field.calculateSignedDistance(maxX, maxY, minZ)
        this.sample111 ??= field.calculateSignedDistance(maxX, maxY, maxZ)

        // distibute corners
        this.node000.sample000 = this.sample000
        this.node001.sample001 = this.sample001
        this.node010.sample010 = this.sample010
        this.node011.sample011 = this.sample011
        this.node100.sample100 = this.sample100
        this.node101.sample101 = this.sample101
        this.node110.sample110 = this.sample110
        this.node111.sample111 = this.sample111

        // distibute center
        this.node000.sample111 = centerSample
        this.node001.sample110 = centerSample
        this.node010.sample101 = centerSample
        this.node011.sample100 = centerSample
        this.node100.sample011 = centerSample
        this.node101.sample010 = centerSample
        this.node110.sample001 = centerSample
        this.node111.sample000 = centerSample

        // distibute faces left-right
        this.node100.sample111 = centerRightSample
        this.node101.sample110 = centerRightSample
        this.node110.sample101 = centerRightSample
        this.node111.sample100 = centerRightSample

        this.node000.sample011 = centerLeftSample
        this.node001.sample010 = centerLeftSample
        this.node010.sample001 = centerLeftSample
        this.node011.sample000 = centerLeftSample

        // distibute faces near-far
        this.node010.sample111 = centerFarSample
        this.node011.sample110 = centerFarSample
        this.node110.sample011 = centerFarSample
        this.node111.sample010 = centerFarSample

        this.node000.sample101 = centerNearSample
        this.node001.sample100 = centerNearSample
        this.node100.sample001 = centerNearSample
        this.node101.sample000 = centerNearSample

        // distibute faces bottom-top
        this.node001.sample111 = centerTopSample
        this.node011.sample101 = centerTopSample
        this.node101.sample011 = centerTopSample
        this.node111.sample001 = centerTopSample

        this.node000.sample110 = centerBottomSample
        this.node010.sample100 = centerBottomSample
        this.node100.sample010 = centerBottomSample
        this.node110.sample000 = centerBottomSample

        // distibute edges
        this.node100.sample000 = this.node000.sample100 = centerMinMinSample
        this.node110.sample010 = this.node010.sample110 = centerMaxMinSample
        this.node111.sample011 = this.node011.sample111 = centerMaxMaxSample
        this.node101.sample001 = this.node001.sample101 = centerMinMaxSample
        this.node010.sample000 = this.node000.sample010 = minCenterMinSample
        this.node110.sample100 = this.node100.sample110 = maxCenterMinSample
        this.node111.sample101 = this.node101.sample111 = maxCenterMaxSample
        this.node011.sample001 = this.node001.sample011 = minCenterMaxSample
        this.node001.sample000 = this.node000.sample001 = minMinCenterSample
        this.node101.sample100 = this.node100.sample101 = maxMinCenterSample
        this.node111.sample110 = this.node110.sample111 = maxMaxCenterSample
        this.node011.sample010 = this.node010.sample011 = minMaxCenterSample

        this.sample000 = null
        this.sample001 = null
        this.sample010 = null
        this.sample011 = null
        this.sample100 = null
        this.sample101 = null
        this.sample110 = null
        this.sample111 = null

        this.node000 = this.node000.sampleSignedDistanceField(field, maxDepth, mergeThreshold)
        this.node001 = this.node001.sampleSignedDistanceField(field, maxDepth, mergeThreshold)
        this.node010 = this.node010.sampleSignedDistanceField(field, maxDepth, mergeThreshold)
        this.node011 = this.node011.sampleSignedDistanceField(field, maxDepth, mergeThreshold)
        this.node100 = this.node100.sampleSignedDistanceField(field, maxDepth, mergeThreshold)
        this.node101 = this.node101.sampleSignedDistanceField(field, maxDepth, mergeThreshold)
        this.node110 = this.node110.sampleSignedDistanceField(field, maxDepth, mergeThreshold)
        this.node111 = this.node111.sampleSignedDistanceField(field, maxDepth, mergeThreshold)

        const childrenKind = this.node000.kind | this.node100.kind | this.node110.kind | this.node010.kind
        |                    this.node001.kind | this.node101.kind | this.node111.kind | this.node011.kind

        if (childrenKind == SAMPLE_OCTREE_KIND_FULL) {
            return _SAMPLE_OCTREE_FULL
        }

        if (childrenKind == SAMPLE_OCTREE_KIND_EMPTY) {
            return _SAMPLE_OCTREE_EMPTY
        }

        return this
    }
}

export class SampleOctreeLeaf_ {
    constructor(minX, minY, minZ, maxX, maxY, maxZ, depth) {
        this.kind = SAMPLE_OCTREE_KIND_LEAF
        this.minX = minX
        this.minY = minY
        this.minZ = minZ
        this.maxX = maxX
        this.maxY = maxY
        this.maxZ = maxZ
        this.depth = depth
        this.sample000 = 0
        this.sample100 = 0
        this.sample110 = 0
        this.sample010 = 0
        this.sample001 = 0
        this.sample101 = 0
        this.sample111 = 0
        this.sample011 = 0
        this.surfaceVertex = null
    }

    #getNodeState() {
        let nodeState = 0
        if (this.sample000 < 0) nodeState |= 0x01
        if (this.sample001 < 0) nodeState |= 0x02
        if (this.sample010 < 0) nodeState |= 0x04
        if (this.sample011 < 0) nodeState |= 0x08
        if (this.sample100 < 0) nodeState |= 0x10
        if (this.sample101 < 0) nodeState |= 0x20
        if (this.sample110 < 0) nodeState |= 0x40
        if (this.sample111 < 0) nodeState |= 0x80
        return nodeState
    }

    #getTemporaryEdges(edges) {
        const minX = this.minX, minY = this.minY, minZ = this.minZ
        const maxX = this.maxX, maxY = this.maxY, maxZ = this.maxZ

        edges[ 0].set(minX, minY, minZ, this.sample000, maxX, minY, minZ, this.sample100)
        edges[ 1].set(minX, maxY, minZ, this.sample010, maxX, maxY, minZ, this.sample110)
        edges[ 2].set(minX, minY, maxZ, this.sample001, maxX, minY, maxZ, this.sample101)
        edges[ 3].set(minX, maxY, maxZ, this.sample011, maxX, maxY, maxZ, this.sample111)
        edges[ 4].set(minX, minY, minZ, this.sample000, minX, maxY, minZ, this.sample010)
        edges[ 5].set(maxX, minY, minZ, this.sample100, maxX, maxY, minZ, this.sample110)
        edges[ 6].set(minX, minY, maxZ, this.sample001, minX, maxY, maxZ, this.sample011)
        edges[ 7].set(maxX, minY, maxZ, this.sample101, maxX, maxY, maxZ, this.sample111)
        edges[ 8].set(minX, minY, minZ, this.sample000, minX, minY, maxZ, this.sample001)
        edges[ 9].set(maxX, minY, minZ, this.sample100, maxX, minY, maxZ, this.sample101)
        edges[10].set(maxX, maxY, minZ, this.sample110, maxX, maxY, maxZ, this.sample111)
        edges[11].set(minX, maxY, minZ, this.sample010, minX, maxY, maxZ, this.sample011)

        return edges
    }

    sampleSignedDistanceField(field) {
        const nodeState = this.#getNodeState()
        if (nodeState == ALL_SAMPLES_INSIDE) return _SAMPLE_OCTREE_FULL
        if (nodeState == ALL_SAMPLES_OUTSIDE) return _SAMPLE_OCTREE_EMPTY

        const position = this.calculateSurfacePosition(field)
        position.x = clamp(position.x, this.minX, this.maxX)
        position.y = clamp(position.y, this.minY, this.maxY)
        position.z = clamp(position.z, this.minZ, this.maxZ)
        const normal = field.calculateGradient(position.x, position.y, position.z).normalize()
        this.surfaceVertex = new Vertex(position, normal)
        return this
    }
    
    calculateSurfacePosition() {
        const edges = this.#getTemporaryEdges(_tempEdges)

        let x = 0, y = 0, z = 0, intersectionCount = 0
        for (let idx = 0; idx < edges.length; ++idx) {
            const edge = edges[idx]
            const dx = edge.x1 - edge.x0
            const dy = edge.y1 - edge.y0
            const dz = edge.z1 - edge.z0
            
            if ((edge.sample0 < 0) != (edge.sample1 < 0)) {
                const t = Math.abs(edge.sample0) / (Math.abs(edge.sample0) + Math.abs(edge.sample1))
                x += dx * t + edge.x0
                y += dy * t + edge.y0
                z += dz * t + edge.z0
                intersectionCount += 1
            }
        }

        if (intersectionCount == 0) {
            return null
        }

        const factor = 1 / intersectionCount
        return new Vector3(x * factor, y * factor, z * factor)
    }
}

export class SampleOctreeEmpty_ {
    constructor() {
        this.kind = SAMPLE_OCTREE_KIND_EMPTY
    }
}

export class SampleOctreeFull_ {
    constructor() {
        this.kind = SAMPLE_OCTREE_KIND_FULL
    }
}

export class SampleOctreeMeshBuilder_ {
    constructor() {
        this.vertices = []
        this.indices = []
    }

    getMesh() {
        return new TriangleMesh(this.vertices, this.indices)
    }

    clear() {
        this.vertices = []
        this.indices = []
    }

    addTriangle(node0, node1, node2, shouldFlip = false) {
        const vertexCount = this.vertices.length
        
        if (shouldFlip) {
            this.indices.push(vertexCount + 2, vertexCount + 1, vertexCount + 0)
        }
        else {
            this.indices.push(vertexCount + 0, vertexCount + 1, vertexCount + 2)
        }

        this.vertices.push(
            node0.surfaceVertex,
            node1.surfaceVertex,
            node2.surfaceVertex,
        )
    }

    addQuad(node0, node1, node2, node3, shouldFlip = false) {
        if (node0 == node2 || node1 == node3) {
            throw new Error("Invalid quad winding!")
        }

        if (node0 == node1) return this.addTriangle(node0, node2, node3, shouldFlip)
        if (node0 == node3) return this.addTriangle(node0, node1, node2, shouldFlip)
        if (node1 == node2) return this.addTriangle(node0, node1, node3, shouldFlip)
        if (node2 == node3) return this.addTriangle(node0, node1, node2, shouldFlip)

        const vertexCount = this.vertices.length
        
        if (shouldFlip) {
            this.indices.push(vertexCount + 3, vertexCount + 2, vertexCount + 0,
                              vertexCount + 2, vertexCount + 1, vertexCount + 0)
        }
        else {
            this.indices.push(vertexCount + 0, vertexCount + 1, vertexCount + 2,
                              vertexCount + 0, vertexCount + 2, vertexCount + 3)
        }

        this.vertices.push(
            node0.surfaceVertex,
            node1.surfaceVertex,
            node2.surfaceVertex,
            node3.surfaceVertex,
        )
    }

    processCell(node) {
        if (node.kind != SAMPLE_OCTREE_KIND_ROOT) {
            return
        }

        this.processCell(node.node000)
        this.processCell(node.node001)
        this.processCell(node.node010)
        this.processCell(node.node011)
        this.processCell(node.node100)
        this.processCell(node.node101)
        this.processCell(node.node110)
        this.processCell(node.node111)

        this.processFaceX(node.node000, node.node100)
        this.processFaceX(node.node010, node.node110)
        this.processFaceX(node.node011, node.node111)
        this.processFaceX(node.node001, node.node101)

        this.processFaceY(node.node000, node.node010)
        this.processFaceY(node.node100, node.node110)
        this.processFaceY(node.node101, node.node111)
        this.processFaceY(node.node001, node.node011)

        this.processFaceZ(node.node000, node.node001)
        this.processFaceZ(node.node100, node.node101)
        this.processFaceZ(node.node110, node.node111)
        this.processFaceZ(node.node010, node.node011)

        this.processEdgeX(node.node000, node.node010, node.node011, node.node001)
        this.processEdgeX(node.node100, node.node110, node.node111, node.node101)

        this.processEdgeY(node.node000, node.node100, node.node101, node.node001)
        this.processEdgeY(node.node010, node.node110, node.node111, node.node011)

        this.processEdgeZ(node.node000, node.node100, node.node110, node.node010)
        this.processEdgeZ(node.node001, node.node101, node.node111, node.node011)
    }

    processFaceX(node0, node1) {
        const kind = node0.kind | node1.kind
        if ((kind & SAMPLE_OCTREE_FULL_OR_EMPTY) || (kind & SAMPLE_OCTREE_KIND_ROOT) == 0) {
            return
        }

        let children000 = node0
        let children010 = node0
        let children100 = node1
        let children110 = node1
        let children001 = node0
        let children011 = node0
        let children101 = node1
        let children111 = node1

        if (node0.kind == SAMPLE_OCTREE_KIND_ROOT) {
            children000 = node0.node100
            children010 = node0.node110
            children001 = node0.node101
            children011 = node0.node111
        }

        if (node1.kind == SAMPLE_OCTREE_KIND_ROOT) {
            children100 = node1.node000
            children110 = node1.node010
            children101 = node1.node001
            children111 = node1.node011
        }

        this.processFaceX(children000, children100)
        this.processFaceX(children010, children110)
        this.processFaceX(children011, children111)
        this.processFaceX(children001, children101)

        this.processEdgeY(children000, children100, children101, children001)
        this.processEdgeY(children010, children110, children111, children011)

        this.processEdgeZ(children000, children100, children110, children010)
        this.processEdgeZ(children001, children101, children111, children011)
    }

    processFaceY(node0, node1) {
        const kind = node0.kind | node1.kind
        if ((kind & SAMPLE_OCTREE_FULL_OR_EMPTY) || (kind & SAMPLE_OCTREE_KIND_ROOT) == 0) {
            return
        }

        let children000 = node0
        let children100 = node0
        let children010 = node1
        let children110 = node1
        let children001 = node0
        let children101 = node0
        let children011 = node1
        let children111 = node1

        if (node0.kind == SAMPLE_OCTREE_KIND_ROOT) {
            children000 = node0.node010
            children100 = node0.node110
            children001 = node0.node011
            children101 = node0.node111
        }

        if (node1.kind == SAMPLE_OCTREE_KIND_ROOT) {
            children010 = node1.node000
            children110 = node1.node100
            children011 = node1.node001
            children111 = node1.node101
        }

        this.processFaceY(children000, children010)
        this.processFaceY(children100, children110)
        this.processFaceY(children101, children111)
        this.processFaceY(children001, children011)

        this.processEdgeX(children000, children010, children011, children001)
        this.processEdgeX(children100, children110, children111, children101)

        this.processEdgeZ(children000, children100, children110, children010)
        this.processEdgeZ(children001, children101, children111, children011)
    }

    processFaceZ(node0, node1) {
        const kind = node0.kind | node1.kind
        if ((kind & SAMPLE_OCTREE_FULL_OR_EMPTY) || (kind & SAMPLE_OCTREE_KIND_ROOT) == 0) {
            return
        }

        let children000 = node0
        let children100 = node0
        let children001 = node1
        let children101 = node1
        let children010 = node0
        let children110 = node0
        let children011 = node1
        let children111 = node1

        if (node0.kind == SAMPLE_OCTREE_KIND_ROOT) {
            children000 = node0.node001
            children100 = node0.node101
            children010 = node0.node011
            children110 = node0.node111
        }

        if (node1.kind == SAMPLE_OCTREE_KIND_ROOT) {
            children001 = node1.node000
            children101 = node1.node100
            children011 = node1.node010
            children111 = node1.node110
        }

        this.processFaceZ(children000, children001)
        this.processFaceZ(children100, children101)
        this.processFaceZ(children110, children111)
        this.processFaceZ(children010, children011)

        this.processEdgeX(children000, children010, children011, children001)
        this.processEdgeX(children100, children110, children111, children101)

        this.processEdgeY(children000, children100, children101, children001)
        this.processEdgeY(children010, children110, children111, children011)
    }

    processEdgeX(node0, node1, node2, node3) {
        const kind = node0.kind | node1.kind | node2.kind | node3.kind

        if (kind & SAMPLE_OCTREE_FULL_OR_EMPTY) {
            return
        }

        if ((kind & SAMPLE_OCTREE_KIND_ROOT) == 0) {
            const test = getHighestDepthNode(node0, node1, node2, node3)

            let shouldFlip = false
            switch (test) {
            case node0: shouldFlip = node0.sample111 < node0.sample011; break
            case node1: shouldFlip = node1.sample101 < node1.sample001; break
            case node2: shouldFlip = node2.sample100 < node2.sample000; break
            case node3: shouldFlip = node3.sample110 < node3.sample010; break
            }

            this.addQuad(node0, node1, node2, node3, shouldFlip)
        }
        else {
            const children000 = node0.kind == SAMPLE_OCTREE_KIND_ROOT ? node0.node011 : node0
            const children100 = node0.kind == SAMPLE_OCTREE_KIND_ROOT ? node0.node111 : node0
            const children010 = node1.kind == SAMPLE_OCTREE_KIND_ROOT ? node1.node001 : node1
            const children110 = node1.kind == SAMPLE_OCTREE_KIND_ROOT ? node1.node101 : node1
            const children001 = node3.kind == SAMPLE_OCTREE_KIND_ROOT ? node3.node010 : node3
            const children101 = node3.kind == SAMPLE_OCTREE_KIND_ROOT ? node3.node110 : node3
            const children011 = node2.kind == SAMPLE_OCTREE_KIND_ROOT ? node2.node000 : node2
            const children111 = node2.kind == SAMPLE_OCTREE_KIND_ROOT ? node2.node100 : node2

            this.processEdgeX(children000, children010, children011, children001)
            this.processEdgeX(children100, children110, children111, children101)
        }
    }

    processEdgeY(node0, node1, node2, node3) {
        const kind = node0.kind | node1.kind | node2.kind | node3.kind

        if (kind & SAMPLE_OCTREE_FULL_OR_EMPTY) {
            return
        }

        if ((kind & SAMPLE_OCTREE_KIND_ROOT) == 0) {
            const test = getHighestDepthNode(node0, node1, node2, node3)

            let shouldFlip = false
            switch (test) {
            case node0: shouldFlip = node0.sample101 < node0.sample111; break
            case node1: shouldFlip = node1.sample001 < node1.sample011; break
            case node2: shouldFlip = node2.sample000 < node2.sample010; break
            case node3: shouldFlip = node3.sample100 < node3.sample110; break
            }

            this.addQuad(node0, node1, node2, node3, shouldFlip)
        }
        else {
            const children000 = node0.kind == SAMPLE_OCTREE_KIND_ROOT ? node0.node101 : node0
            const children010 = node0.kind == SAMPLE_OCTREE_KIND_ROOT ? node0.node111 : node0
            const children100 = node1.kind == SAMPLE_OCTREE_KIND_ROOT ? node1.node001 : node1
            const children110 = node1.kind == SAMPLE_OCTREE_KIND_ROOT ? node1.node011 : node1
            const children001 = node3.kind == SAMPLE_OCTREE_KIND_ROOT ? node3.node100 : node3
            const children011 = node3.kind == SAMPLE_OCTREE_KIND_ROOT ? node3.node110 : node3
            const children101 = node2.kind == SAMPLE_OCTREE_KIND_ROOT ? node2.node000 : node2
            const children111 = node2.kind == SAMPLE_OCTREE_KIND_ROOT ? node2.node010 : node2

            this.processEdgeY(children000, children100, children101, children001)
            this.processEdgeY(children010, children110, children111, children011)
        }
    }

    processEdgeZ(node0, node1, node2, node3) {
        const kind = node0.kind | node1.kind | node2.kind | node3.kind

        if (kind & SAMPLE_OCTREE_FULL_OR_EMPTY) {
            return
        }

        if ((kind & SAMPLE_OCTREE_KIND_ROOT) == 0) {
            const test = getHighestDepthNode(node0, node1, node2, node3)

            let shouldFlip = false
            switch (test) {
            case node0: shouldFlip = node0.sample111 < node0.sample110; break
            case node1: shouldFlip = node1.sample011 < node1.sample010; break
            case node2: shouldFlip = node2.sample001 < node2.sample000; break
            case node3: shouldFlip = node3.sample101 < node3.sample100; break
            }

            this.addQuad(node0, node1, node2, node3, shouldFlip)
        }
        else {
            const children000 = node0.kind == SAMPLE_OCTREE_KIND_ROOT ? node0.node110 : node0
            const children001 = node0.kind == SAMPLE_OCTREE_KIND_ROOT ? node0.node111 : node0
            const children100 = node1.kind == SAMPLE_OCTREE_KIND_ROOT ? node1.node010 : node1
            const children101 = node1.kind == SAMPLE_OCTREE_KIND_ROOT ? node1.node011 : node1
            const children010 = node3.kind == SAMPLE_OCTREE_KIND_ROOT ? node3.node100 : node3
            const children011 = node3.kind == SAMPLE_OCTREE_KIND_ROOT ? node3.node101 : node3
            const children110 = node2.kind == SAMPLE_OCTREE_KIND_ROOT ? node2.node000 : node2
            const children111 = node2.kind == SAMPLE_OCTREE_KIND_ROOT ? node2.node001 : node2

            this.processEdgeZ(children000, children100, children110, children010)
            this.processEdgeZ(children001, children101, children111, children011)
        }
    }
}

export class ByteWriter {
    constructor(data = []) {
        this._offset = 0
        this._data = Array.from(data)
    }

    setOffset(offset)    { this._offset = offset; }

    writeUint8(value)    { this._data[this._offset++] = (value      ) & 0xFF; }
    writeUint16LE(value) { this._data[this._offset++] = (value      ) & 0xFF; this._data[this._offset++] = (value >>  8) & 0xFF; }
    writeUint32LE(value) { this._data[this._offset++] = (value      ) & 0xFF; this._data[this._offset++] = (value >>  8) & 0xFF
                           this._data[this._offset++] = (value >> 16) & 0xFF; this._data[this._offset++] = (value >> 24) & 0xFF; }
    writeUint64LE(value) { this._data[this._offset++] = (value      ) & 0xFF; this._data[this._offset++] = (value >>  8) & 0xFF
                           this._data[this._offset++] = (value >> 16) & 0xFF; this._data[this._offset++] = (value >> 24) & 0xFF
                           this._data[this._offset++] = (value >> 32) & 0xFF; this._data[this._offset++] = (value >> 40) & 0xFF
                           this._data[this._offset++] = (value >> 48) & 0xFF; this._data[this._offset++] = (value >> 56) & 0xFF; }
    writeUint16BE(value) { this._data[this._offset++] = (value >>  8) & 0xFF; this._data[this._offset++] = (value      ) & 0xFF; }
    writeUint32BE(value) { this._data[this._offset++] = (value >> 24) & 0xFF; this._data[this._offset++] = (value >> 16) & 0xFF
                           this._data[this._offset++] = (value >>  8) & 0xFF; this._data[this._offset++] = (value      ) & 0xFF; }
    writeUint64BE(value) { this._data[this._offset++] = (value >> 56) & 0xFF; this._data[this._offset++] = (value >> 48) & 0xFF
                           this._data[this._offset++] = (value >> 40) & 0xFF; this._data[this._offset++] = (value >> 32) & 0xFF
                           this._data[this._offset++] = (value >> 24) & 0xFF; this._data[this._offset++] = (value >> 16) & 0xFF
                           this._data[this._offset++] = (value >>  8) & 0xFF; this._data[this._offset++] = (value      ) & 0xFF; }

    writeInt8(value)    { this._data[this._offset++] = (value      ) & 0xFF; }
    writeInt16LE(value) { this._data[this._offset++] = (value      ) & 0xFF; this._data[this._offset++] = (value >>  8) & 0xFF; }
    writeInt32LE(value) { this._data[this._offset++] = (value      ) & 0xFF; this._data[this._offset++] = (value >>  8) & 0xFF
                          this._data[this._offset++] = (value >> 16) & 0xFF; this._data[this._offset++] = (value >> 24) & 0xFF; }
    writeInt64LE(value) { this._data[this._offset++] = (value      ) & 0xFF; this._data[this._offset++] = (value >>  8) & 0xFF
                          this._data[this._offset++] = (value >> 16) & 0xFF; this._data[this._offset++] = (value >> 24) & 0xFF
                          this._data[this._offset++] = (value >> 32) & 0xFF; this._data[this._offset++] = (value >> 40) & 0xFF
                          this._data[this._offset++] = (value >> 48) & 0xFF; this._data[this._offset++] = (value >> 56) & 0xFF; }
    writeInt16BE(value) { this._data[this._offset++] = (value >>  8) & 0xFF; this._data[this._offset++] = (value      ) & 0xFF; }
    writeInt32BE(value) { this._data[this._offset++] = (value >> 24) & 0xFF; this._data[this._offset++] = (value >> 16) & 0xFF
                          this._data[this._offset++] = (value >>  8) & 0xFF; this._data[this._offset++] = (value      ) & 0xFF; }
    writeInt64BE(value) { this._data[this._offset++] = (value >> 56) & 0xFF; this._data[this._offset++] = (value >> 48) & 0xFF
                          this._data[this._offset++] = (value >> 40) & 0xFF; this._data[this._offset++] = (value >> 32) & 0xFF
                          this._data[this._offset++] = (value >> 24) & 0xFF; this._data[this._offset++] = (value >> 16) & 0xFF
                          this._data[this._offset++] = (value >>  8) & 0xFF; this._data[this._offset++] = (value      ) & 0xFF; }

    writeUnsignedBytes(bytes) { for (const byte of bytes) this.writeUint8(byte); }
    writeSignedBytes(bytes)   { for (const byte of bytes) this.writeInt8(byte); }

    data() { return new Uint8Array(this._data); }
}

export class SignedDistanceField2 {
    calculateSignedDistance(x, y) {
        throw new Error("calculateSignedDistance is unimplemented!")
    }

    calculateGradient(x, y, outVector = new Vector2()) {
        const distanceMaxX = this.calculateSignedDistance(x + EPSILON, y)
        const distanceMinX = this.calculateSignedDistance(x - EPSILON, y)
        const distanceMaxY = this.calculateSignedDistance(x, y + EPSILON)
        const distanceMinY = this.calculateSignedDistance(x, y - EPSILON)
        return outVector.set((distanceMaxX - distanceMinX) * INV_TWO_EPSILON,
                              (distanceMaxY - distanceMinY) * INV_TWO_EPSILON)
    }
    
    raycast(x0, y0, dx, dy, distanceMax = Infinity) {
        let totalDistance = 0
        for (let idx = 0; idx < INTERSECTION_DEPTH_MAX && totalDistance < distanceMax; ++idx) {
            const radius = Math.abs(this.calculateSignedDistance(
                x0 + totalDistance * dx,
                y0 + totalDistance * dy))

            if (radius < EPSILON) {
                return totalDistance
            }
            
            totalDistance += radius
        }

        return null
    }
    
    transform(matrix = new Matrix3()) { return new TransformSignedDistanceField2(this, matrix); }
    shell(thickness = 1) { return new ShellSignedDistanceField2(this, thickness); }
    offset(distance = 1) { return new OffsetSignedDistanceField2(this, distance); }
    union(... fields) { return new UnionSignedDistanceField2([ this, ... fields ]); }
    difference(... fields) { return new DifferenceSignedDistanceField2([ this, ... fields ]); }
    intersection(... fields) { return new IntersectionSignedDistanceField2([ this, ... fields ]); }
    unionSmooth(... fields) { return new UnionSignedDistanceField2([ this, ... fields ], SMOOTHING_METHOD_DEFAULT_QUADRATIC); }
    differenceSmooth(... fields) { return new DifferenceSignedDistanceField2([ this, ... fields ], SMOOTHING_METHOD_DEFAULT_QUADRATIC); }
    intersectionSmooth(... fields) { return new IntersectionSignedDistanceField2([ this, ... fields ], SMOOTHING_METHOD_DEFAULT_QUADRATIC); }

    translate(x = 0, y = 0) { return this.transform(_m3_temp.identity().translate(x, y)); }
    rotate(angle = 0) { return this.transform(_m3_temp.identity().rotateZ(angle)); }
}

export class TransformSignedDistanceField2 extends SignedDistanceField2 {
    constructor(field, matrix = new Matrix3()) {
        super()
        this.inverseMatrix = matrix.clone().inverse()
        this.boundingBox = field.boundingBox.clone().transformMatrix3(matrix)
        this.field = field
    }

    calculateSignedDistance(x, y) {
        _v2_temp.set(x, y).transformMatrix3(this.inverseMatrix)
        return this.field.calculateSignedDistance(_v2_temp.x, _v2_temp.y)
    }
}

export class ShellSignedDistanceField2 extends SignedDistanceField2 {
    constructor(field, thickness) {
        super()
        this.boundingBox = field.boundingBox.clone().grow(this.halfThickness)
        this.halfThickness = 0.5 * thickness
        this.field = field
    }

    calculateSignedDistance(x, y) {
        return Math.abs(this.field.calculateSignedDistance(x, y)) - this.halfThickness
    }
}

export class OffsetSignedDistanceField2 extends SignedDistanceField2 {
    constructor(field, distance) {
        super()
        this.boundingBox = field.boundingBox.clone().grow(this.distance)
        this.distance = distance
        this.field = field
    }

    calculateSignedDistance(x, y) {
        return this.field.calculateSignedDistance(x, y) - this.distance
    }
}

export class UnionSignedDistanceField2 extends SignedDistanceField2 {
    constructor(fields = [], smoothingMethod = SMOOTHING_METHOD_DEFAULT_NONE) {
        super()
        this.fields = fields
        this.boundingBox = this.fields[0].boundingBox.clone()
        this.smoothingMethod = smoothingMethod
        for (let idx = 1; idx < this.fields.length; ++idx) {
            this.boundingBox.union(this.fields[idx].boundingBox)
        }
    }

    setSmoothingMethod(method) { this.smoothingMethod = method; return this; }
    calculateSignedDistance(x, y) {
        let distance = this.fields[0].calculateSignedDistance(x, y)
        for (let idx = 1; idx < this.fields.length; ++idx) {
            distance = this.smoothingMethod.min(distance, this.fields[idx].calculateSignedDistance(x, y))
        }
        return distance
    }
}

export class DifferenceSignedDistanceField2 extends SignedDistanceField2 {
    constructor(fields = [], smoothingMethod = SMOOTHING_METHOD_DEFAULT_NONE) {
        super()
        this.fields = fields
        this.boundingBox = this.fields[0].boundingBox.clone()
        this.smoothingMethod = smoothingMethod
    }

    setSmoothingMethod(method) { this.smoothingMethod = method; return this; }
    calculateSignedDistance(x, y) {
        let distance = this.fields[0].calculateSignedDistance(x, y)
        for (let idx = 1; idx < this.fields.length; ++idx) {
            distance = this.smoothingMethod.max(distance, -this.fields[idx].calculateSignedDistance(x, y))
        }
        return distance
    }
}

export class IntersectionSignedDistanceField2 extends SignedDistanceField2 {
    constructor(fields = [], smoothingMethod = SMOOTHING_METHOD_DEFAULT_NONE) {
        super()
        this.fields = fields
        this.boundingBox = this.fields[0].boundingBox.clone()
        this.smoothingMethod = smoothingMethod
        for (let idx = 1; idx < this.fields.length; ++idx) {
            this.boundingBox.intersect(this.fields[idx].boundingBox)
        }
    }

    calculateSignedDistance(x, y) {
        let distance = this.fields[0].calculateSignedDistance(x, y)
        for (let idx = 1; idx < this.fields.length; ++idx) {
            distance = this.smoothingMethod.max(distance, this.fields[idx].calculateSignedDistance(x, y))
        }
        return distance
    }
}

export class SignedDistanceField3 {
    calculateSignedDistance(x, y, z) {
        throw new Error("calculateSignedDistance is unimplemented!")
    }

    calculateGradient(x, y, z, outVector = new Vector3()) {
        const sample0 = this.calculateSignedDistance(x + EPSILON, y - EPSILON, z - EPSILON)
        const sample1 = this.calculateSignedDistance(x - EPSILON, y - EPSILON, z + EPSILON)
        const sample2 = this.calculateSignedDistance(x - EPSILON, y + EPSILON, z - EPSILON)
        const sample3 = this.calculateSignedDistance(x + EPSILON, y + EPSILON, z + EPSILON)
        return outVector.set(
            + sample0 - sample1 - sample2 + sample3,
            - sample0 - sample1 + sample2 + sample3,
            - sample0 + sample1 - sample2 + sample3,
        ).normalize()
    }

    raycast(x0, y0, z0, dx, dy, dz, distanceMax = Infinity) {
        for (let idx = 0, totalDistance = 0; idx < INTERSECTION_DEPTH_MAX && totalDistance < distanceMax; ++idx) {
            const radius = Math.abs(this.calculateSignedDistance(
                x0 + totalDistance * dx,
                y0 + totalDistance * dy,
                z0 + totalDistance * dz))

            if (radius < EPSILON) {
                return totalDistance
            }
            
            totalDistance += radius
        }

        return null
    }

    transform(matrix = new Matrix4()) { return new TransformSignedDistanceField3(this, matrix); }
    rotateX(angle = 0) { return this.transform(_m4_temp.identity().rotateX(angle)); }
    rotateY(angle = 0) { return this.transform(_m4_temp.identity().rotateY(angle)); }
    rotateZ(angle = 0) { return this.transform(_m4_temp.identity().rotateZ(angle)); }
    twist(angle = 0) { return new TwistSignedDistanceField3(this, angle); }
    shell(thickness = 1) { return new ShellSignedDistanceField3(this, thickness); }
    offset(distance = 1) { return new OffsetSignedDistanceField3(this, distance); }
    union(... fields) { return new UnionSignedDistanceField3([ this, ... fields ]); }
    difference(... fields) { return new DifferenceSignedDistanceField3([ this, ... fields ]); }
    intersection(... fields) { return new IntersectionSignedDistanceField3([ this, ... fields ]); }
    unionSmooth(... fields) { return new UnionSignedDistanceField3([ this, ... fields ], SMOOTHING_METHOD_DEFAULT_QUADRATIC); }
    differenceSmooth(... fields) { return new DifferenceSignedDistanceField3([ this, ... fields ], SMOOTHING_METHOD_DEFAULT_QUADRATIC); }
    intersectionSmooth(... fields) { return new IntersectionSignedDistanceField3([ this, ... fields ], SMOOTHING_METHOD_DEFAULT_QUADRATIC); }

    translate(x = 0, y = 0, z = 0) {
        return this.transform(_m4_temp.identity().translate(x, y, z))
    }

    rotate(x = 0, y = 0, z = 1, angle = 0) {
        return this.transform(_m4_temp.identity().rotate(x, y, z, angle))
    }
}

export class BoxSignedDistanceField3 extends SignedDistanceField3 {
    constructor(sizeX, sizeY, sizeZ, cornerRadius = 0) {
        super()
        this.cornerRadius = cornerRadius
        this.halfSizeX = 0.5 * sizeX
        this.halfSizeY = 0.5 * sizeY
        this.halfSizeZ = 0.5 * sizeZ
        this.boundingBox = new BoundingBox3(-this.halfSizeX, -this.halfSizeY, -this.halfSizeZ,
                                              this.halfSizeX,  this.halfSizeY,  this.halfSizeZ)
    }

    calculateSignedDistance(x, y, z) {
        const posX = Math.abs(x) - this.halfSizeX + this.cornerRadius
        const posY = Math.abs(y) - this.halfSizeY + this.cornerRadius
        const posZ = Math.abs(z) - this.halfSizeZ + this.cornerRadius
        const dx = Math.max(posX, 0)
        const dy = Math.max(posY, 0)
        const dz = Math.max(posZ, 0)
        const side = Math.min(Math.max(posX, posY, posZ), 0.0)
        return Math.sqrt(dx*dx + dy*dy + dz*dz) + side - this.cornerRadius
    }
}

export class BoxFrameSignedDistanceField3 extends SignedDistanceField3 {
    constructor(sizeX, sizeY, sizeZ, frameSize = 5) {
        super()
        this.frameSize = frameSize
        this.halfSizeX = 0.5 * sizeX
        this.halfSizeY = 0.5 * sizeY
        this.halfSizeZ = 0.5 * sizeZ
        this.boundingBox = new BoundingBox3(-this.halfSizeX, -this.halfSizeY, -this.halfSizeZ,
                                              this.halfSizeX,  this.halfSizeY,  this.halfSizeZ)
    }

    calculateSignedDistance(x, y, z) {
        const p0 = Math.abs(x) - this.halfSizeX
        const p1 = Math.abs(y) - this.halfSizeY
        const p2 = Math.abs(z) - this.halfSizeZ
        const q0 = Math.abs(p0 + this.frameSize) - this.frameSize
        const q1 = Math.abs(p1 + this.frameSize) - this.frameSize
        const q2 = Math.abs(p2 + this.frameSize) - this.frameSize

        return Math.min(
            distanceFromOrigin(Math.max(q0, 0), Math.max(q1, 0), Math.max(p2, 0)) + Math.min(Math.max(q0, q1, p2), 0.0),
            distanceFromOrigin(Math.max(p0, 0), Math.max(q1, 0), Math.max(q2, 0)) + Math.min(Math.max(p0, q1, q2), 0.0),
            distanceFromOrigin(Math.max(q0, 0), Math.max(p1, 0), Math.max(q2, 0)) + Math.min(Math.max(q0, p1, q2), 0.0)
        )
    }
}

export class SphereSignedDistanceField3 extends SignedDistanceField3 {
    constructor(radius = 5) {
        super()
        this.radius = radius
        this.boundingBox = new BoundingBox3(-radius, -radius, -radius,
                                              radius,  radius,  radius)
    }

    calculateSignedDistance(x, y, z) {
        return Math.sqrt(x*x + y*y + z*z) - this.radius
    }
}

export class TorusSignedDistanceField3 extends SignedDistanceField3 {
    constructor(outerRadius = 10, innerRadius = 5) {
        super()
        const farthestRadius = outerRadius + innerRadius
        this.innerRadius = innerRadius
        this.outerRadius = outerRadius
        this.boundingBox = new BoundingBox3(-farthestRadius, -farthestRadius, -innerRadius,
                                              farthestRadius,  farthestRadius,  innerRadius)
    }

    calculateSignedDistance(x, y, z) {
        const distanceXy = Math.sqrt(x*x + y*y) - this.outerRadius
        return Math.sqrt(distanceXy * distanceXy + z*z) - this.innerRadius
    }
}

export class CylinderSignedDistanceField3 extends SignedDistanceField3 {
    constructor(radius = 10, height = 20) {
        super()
        this.radius = radius
        this.halfHeight = 0.5 * height
        this.boundingBox = new BoundingBox3(-this.radius, -this.radius, -this.halfHeight,
                                              this.radius,  this.radius,  this.halfHeight)
    }

    calculateSignedDistance(x, y, z) {
        const d0 = Math.abs(Math.sqrt(x*x + y*y)) - this.radius
        const d1 = Math.abs(z) - this.halfHeight
        const a0 = Math.max(d0,0.0)
        const a1 = Math.max(d1,0.0)
        return Math.min(Math.max(d0,d1),0.0) + Math.sqrt(a0*a0 + a1*a1)
    }
}

export class PlaneSignedDistanceField3 extends SignedDistanceField3 {
    constructor(plane = new Plane(0, 0, 1, 0)) {
        super()
        this.plane = plane
        this.boundingBox = new BoundingBox3(Infinity,  Infinity,  Infinity,
                                            -Infinity, -Infinity, -Infinity)
    }

    calculateSignedDistance(x, y, z) {
        return this.plane.distanceToPoint(x, y, z)
    }
}

export class ConeSignedDistanceField3 extends SignedDistanceField3 {
    constructor(radius = 10, height = 20) {
        super()
        this.radius = radius
        this.height = height
        this.boundingBox = new BoundingBox3(-this.radius, -this.radius,-this.height,
                                              this.radius,  this.radius, this.height)
    }

    calculateSignedDistance(x, y, z) {
        const qx =  this.radius
        const qy = -this.height
        const wx = Math.sqrt(x * x + y * y)
        const wy = z
        const factor = clamp((wx * qx + wy * qy) / (qx * qx + qy * qy), 0.0, 1.0)
        const ax = wx - qx * factor
        const ay = wy - qy * factor
        const bx = wx - qx * clamp(wx / qx, 0.0, 1.0 )
        const by = wy - qy
        const k = Math.sign(qy)
        const d = Math.min(ax * ax + ay * ay, bx * bx + by * by)
        const s = Math.max(k * (wx * qy - wy * qx), k * (wy - qy))
        return Math.sqrt(d) * Math.sign(s)
    }
}

export class TransformSignedDistanceField3 extends SignedDistanceField3 {
    constructor(field, matrix = new Matrix4()) {
        super()
        this.inverseMatrix = matrix.clone().inverse()
        this.boundingBox = field.boundingBox.clone().transformMatrix4(matrix)
        this.field = field
    }

    calculateSignedDistance(x, y, z) {
        _v3_temp.set(x, y, z).transformMatrix4(this.inverseMatrix)
        return this.field.calculateSignedDistance(_v3_temp.x, _v3_temp.y, _v3_temp.z)
    }
}

export class TwistSignedDistanceField3 extends SignedDistanceField3 {
    constructor(field, angle) {
        super()
        this.field = field
        this.k = angle / (field.boundingBox.maxZ - field.boundingBox.minZ)
        const min = Math.min(field.boundingBox.minX, field.boundingBox.minY)
        const max = Math.max(field.boundingBox.maxX, field.boundingBox.maxY)
        this.boundingBox = new BoundingBox3(min, min, field.boundingBox.minZ,
                                             max, max, field.boundingBox.maxZ)
    }

    calculateSignedDistance(x, y, z) {
        const c = Math.cos(z * this.k)
        const s = Math.sin(z * this.k)
        const rotatedX = x * c - y * s
        const rotatedY = x * s + y * c
        return this.field.calculateSignedDistance(rotatedX, rotatedY, z)
    }
}

export class ShellSignedDistanceField3 extends SignedDistanceField3 {
    constructor(field, thickness) {
        super()
        this.field = field
        this.halfThickness = 0.5 * thickness
        this.boundingBox = field.boundingBox.clone().grow(this.halfThickness)
    }

    calculateSignedDistance(x, y, z) {
        return Math.abs(this.field.calculateSignedDistance(x, y, z)) - this.halfThickness
    }
}

export class OffsetSignedDistanceField3 extends SignedDistanceField3 {
    constructor(field, distance) {
        super()
        this.field = field
        this.distance = distance
        this.boundingBox = field.boundingBox.clone().grow(this.distance)
    }

    calculateSignedDistance(x, y, z) {
        return this.field.calculateSignedDistance(x, y, z) - this.distance
    }
}

export class UnionSignedDistanceField3 extends SignedDistanceField3 {
    constructor(fields, smoothingMethod = SMOOTHING_METHOD_DEFAULT_NONE) {
        super()
        this.fields = fields
        this.boundingBox = this.fields[0].boundingBox.clone()
        this.smoothingMethod = smoothingMethod
        for (let idx = 1; idx < this.fields.length; ++idx) {
            this.boundingBox.union(this.fields[idx].boundingBox)
        }
    }

    setSmoothingMethod(method) { this.smoothingMethod = method; return this; }
    calculateSignedDistance(x, y, z) {
        let distance = this.fields[0].calculateSignedDistance(x, y, z)
        for (let idx = 1; idx < this.fields.length; ++idx) {
            distance = this.smoothingMethod.min(distance, this.fields[idx].calculateSignedDistance(x, y, z))
        }
        return distance
    }
}

export class DifferenceSignedDistanceField3 extends SignedDistanceField3 {
    constructor(fields, smoothingMethod = SMOOTHING_METHOD_DEFAULT_NONE) {
        super()
        this.fields = fields
        this.boundingBox = this.fields[0].boundingBox.clone()
        this.smoothingMethod = smoothingMethod
    }

    setSmoothingMethod(method) { this.smoothingMethod = method; return this; }
    calculateSignedDistance(x, y, z) {
        let distance = this.fields[0].calculateSignedDistance(x, y, z)
        for (let idx = 1; idx < this.fields.length; ++idx) {
            distance = this.smoothingMethod.max(distance, -this.fields[idx].calculateSignedDistance(x, y, z))
        }
        return distance
    }
}

export class IntersectionSignedDistanceField3 extends SignedDistanceField3 {
    constructor(fields, smoothingMethod = SMOOTHING_METHOD_DEFAULT_NONE) {
        super()
        this.fields = fields
        this.boundingBox = this.fields[0].boundingBox.clone()
        this.smoothingMethod = smoothingMethod
        for (let idx = 1; idx < this.fields.length; ++idx) {
            this.boundingBox.intersect(this.fields[idx].boundingBox)
        }
    }

    setSmoothingMethod(method) { this.smoothingMethod = method; return this; }
    calculateSignedDistance(x, y, z) {
        let distance = this.fields[0].calculateSignedDistance(x, y, z)
        for (let idx = 1; idx < this.fields.length; ++idx) {
            distance = this.smoothingMethod.max(distance, this.fields[idx].calculateSignedDistance(x, y, z))
        }
        return distance
    }
}

export class SmoothingMethodNone {
    min(a, b) { return Math.min(a, b); }
    max(a, b) { return Math.max(a, b); }
}

export class SmoothingMethodExp {
    constructor(k) { this.k = k; }
    min(a, b) { return smoothMinExp(a, b, this.k); }
    max(a, b) { return smoothMaxExp(a, b, this.k); }
}

export class SmoothingMethodRoot {
    constructor(k) { this.k = k; }
    min(a, b) { return smoothMinRoot(a, b, this.k); }
    max(a, b) { return smoothMaxRoot(a, b, this.k); }
}

export class SmoothingMethodSigmoid {
    constructor(k) { this.k = k; }
    min(a, b) { return smoothMinSigmoid(a, b, this.k); }
    max(a, b) { return smoothMaxSigmoid(a, b, this.k); }
}

export class SmoothingMethodQuadratic {
    constructor(k) { this.k = k; }
    min(a, b) { return smoothMinQuadratic(a, b, this.k); }
    max(a, b) { return smoothMaxQuadratic(a, b, this.k); }
}

export class SmoothingMethodCubic {
    constructor(k) { this.k = k; }
    min(a, b) { return smoothMinCubic(a, b, this.k); }
    max(a, b) { return smoothMaxCubic(a, b, this.k); }
}

export class SmoothingMethodQuartic {
    constructor(k) { this.k = k; }
    min(a, b) { return smoothMinQuartic(a, b, this.k); }
    max(a, b) { return smoothMaxQuartic(a, b, this.k); }
}

export class SmoothingMethodCircular {
    constructor(k) { this.k = k; }
    min(a, b) { return smoothMinCircular(a, b, this.k); }
    max(a, b) { return smoothMaxCircular(a, b, this.k); }
}

export class SmoothingMethodCircularGeometrical {
    constructor(k) { this.k = k; }
    min(a, b) { return smoothMinCircularGeometrical(a, b, this.k); }
    max(a, b) { return smoothMaxCircularGeometrical(a, b, this.k); }
}

export class SmoothingMethodChamfer {
    constructor(radius) { this.radius = radius; }
    
    min(a, b) {
        const m = Math.min(a, b)

        if (a < this.radius && b < this.radius) {
            return Math.min(m, a + b - this.radius)
        } else {
            return m
        }
    }

    max(a, b) {
        const m = Math.max(a, b)

        if (a > -this.radius && b > -this.radius) {
            return Math.max(m, a + b + this.radius)
        } else {
            return m
        }
    }
}

export class SmoothingMethodCombine {
    constructor(... methods) {
        this.methods = methods
    }

    min(a, b) { return this.methods.reduce((value, method) => method.min(value, b), a); }
    max(a, b) { return this.methods.reduce((value, method) => method.max(value, b), a); }
}

export const SMOOTHING_METHOD_DEFAULT_NONE = new SmoothingMethodNone()
export const SMOOTHING_METHOD_DEFAULT_EXP = new SmoothingMethodExp(0.5)
export const SMOOTHING_METHOD_DEFAULT_ROOT = new SmoothingMethodRoot(0.5)
export const SMOOTHING_METHOD_DEFAULT_SIGMOID = new SmoothingMethodSigmoid(0.5)
export const SMOOTHING_METHOD_DEFAULT_QUADRATIC = new SmoothingMethodQuadratic(0.5)
export const SMOOTHING_METHOD_DEFAULT_CUBIC = new SmoothingMethodCubic(0.5)
export const SMOOTHING_METHOD_DEFAULT_QUARTIC = new SmoothingMethodQuartic(0.5)
export const SMOOTHING_METHOD_DEFAULT_CIRCULAR = new SmoothingMethodCircular(0.5)
export const SMOOTHING_METHOD_DEFAULT_CIRCULAR_GEOMETRICAL = new SmoothingMethodCircularGeometrical(0.5)

const _SAMPLE_OCTREE_FULL = new SampleOctreeFull()
const _SAMPLE_OCTREE_EMPTY = new SampleOctreeEmpty()
const tempPlane = new Plane()
const _m3_temp = new Matrix3()
const _m4_temp = new Matrix4()
const _v3_temp = new Vector3(0, 0, 0)
const _v2_temp = new Vector2(0, 0, 0)

const _tempEdges = [
    new SampleEdge(0, 0, 0, 0, 0, 0, 0, 0),
    new SampleEdge(0, 0, 0, 0, 0, 0, 0, 0),
    new SampleEdge(0, 0, 0, 0, 0, 0, 0, 0),
    new SampleEdge(0, 0, 0, 0, 0, 0, 0, 0),
    new SampleEdge(0, 0, 0, 0, 0, 0, 0, 0),
    new SampleEdge(0, 0, 0, 0, 0, 0, 0, 0),
    new SampleEdge(0, 0, 0, 0, 0, 0, 0, 0),
    new SampleEdge(0, 0, 0, 0, 0, 0, 0, 0),
    new SampleEdge(0, 0, 0, 0, 0, 0, 0, 0),
    new SampleEdge(0, 0, 0, 0, 0, 0, 0, 0),
    new SampleEdge(0, 0, 0, 0, 0, 0, 0, 0),
    new SampleEdge(0, 0, 0, 0, 0, 0, 0, 0),
]
