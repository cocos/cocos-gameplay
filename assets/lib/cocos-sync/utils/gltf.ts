import { Vec3 } from "cc";
import { SyncMeshData } from "../process/asset/mesh";
import { base642arraybuffer } from "./editor";

interface AttrDefine {
    attr: string,
    componentType: number,
    count: number,
    bytesPerElement: number,
    type: string
}

const _attributes = {
    vertices: {
        attr: 'POSITION',
        componentType: 5126,
        count: 3,
        bytesPerElement: 4,
        type: "VEC3"
    },
    normals: {
        attr: 'NORMAL',
        componentType: 5126,
        count: 3,
        bytesPerElement: 4,
        type: "VEC3"
    },
    colors: {
        attr: 'COLOR_0',
        componentType: 5126,
        count: 4,
        bytesPerElement: 4,
        type: "VEC4"
    },
    uv: {
        attr: 'TEXCOORD_0',
        componentType: 5126,
        count: 2,
        bytesPerElement: 4,
        type: "VEC2"
    },
    uv1: {
        attr: 'TEXCOORD_1',
        componentType: 5126,
        count: 2,
        bytesPerElement: 4,
        type: "VEC2"
    },
    boneWeights: {
        attr: 'WEIGHTS_0',
        componentType: 5126,
        count: 4,
        bytesPerElement: 4,
        type: "VEC4"
    },
    joints: {
        attr: 'JOINTS_0',
        componentType: 5126,
        count: 4,
        bytesPerElement: 4,
        type: "VEC4"
    },
    indices: {
        componentType: 5123,
        count: 1,
        bytesPerElement: 2,
        type: "SCALAR"
    }
};


export function toGltfMesh (mesh: SyncMeshData) {
    let gltf = {
        "asset": {
            "generator": "Khronos glTF Blender I/O v1.2.75",
            "version": "2.0"
        },
        "scene": 0,
        "scenes": [
            {
                "name": "Scene",
                "nodes": [
                    0
                ]
            }
        ],
        "nodes": [
            {
                "mesh": 0,
                "name": "Mesh"
            }
        ],
        "meshes": [
            {
                "name": mesh.meshName,
                "primitives": [] as any[]
            }
        ],
        "accessors": [] as any[],
        "bufferViews": [] as any[],
        "buffers": [] as any[]
    }

    let gltfMesh = gltf.meshes[0];

    let bufferIndex = 0;
    let subMeshes = mesh.detail && mesh.detail.subMeshes || [];
    for (let mi = 0; mi < subMeshes.length; mi++) {
        let subMesh = subMeshes[mi];

        let primitive = {
            indices: -1,
            attributes: {} as any,
            mode: 4
        }

        gltfMesh.primitives.push(primitive);

        let byteOffset = 0;
        let bufferViews = gltf.bufferViews;


        for (let attrName in _attributes) {
            let values = (subMesh as any)[attrName] as number[];
            if (!values || !values.length) {
                continue;
            }

            // primitive
            let attrDef = (_attributes as any)[attrName] as AttrDefine;

            if (attrDef === _attributes.indices) {
                primitive.indices = bufferIndex;
            }
            else {
                primitive.attributes[attrDef.attr] = bufferIndex;
            }

            // accessor
            let accessor: any = {
                bufferView: bufferIndex,
                componentType: attrDef.componentType,
                count: values.length / attrDef.count,
                type: attrDef.type,
            };

            if (attrDef === _attributes.vertices) {
                accessor.min = Vec3.toArray([], mesh.min || mesh.detail.min);
                accessor.max = Vec3.toArray([], mesh.max || mesh.detail.max);
            }

            gltf.accessors.push(accessor)

            // bufferView 
            let byteLength = values.length * attrDef.bytesPerElement;
            bufferViews.push({
                buffer: mi,
                byteOffset: byteOffset,
                byteLength: byteLength
            })


            byteOffset += byteLength;
            bufferIndex++;
        }

        let buffer = new ArrayBuffer(byteOffset);
        let float32Buffer = new Float32Array(buffer, 0, bufferViews[primitive.indices].byteOffset / 4);
        let uint16Buffer = new Uint16Array(buffer);

        for (let attrName in _attributes) {
            let values = (subMesh as any)[attrName] as number[];
            if (!values || !values.length) {
                continue;
            }

            let attrDef = (_attributes as any)[attrName] as AttrDefine;

            let bufferIndex;
            if (attrDef === _attributes.indices) {
                bufferIndex = primitive.indices;
            }
            else {
                bufferIndex = primitive.attributes[attrDef.attr];
            }

            if (attrDef.bytesPerElement === 2) {
                uint16Buffer.set(values, bufferViews[bufferIndex].byteOffset / 2);
            }
            else if (attrDef.bytesPerElement === 4) {
                float32Buffer.set(values, bufferViews[bufferIndex].byteOffset / 4);
            }
        }

        gltf.buffers.push({
            byteLength: byteOffset,
            uri: 'data:application/octet-stream;base64,' + base642arraybuffer.encode(buffer)
        })
    }

    return gltf;
}
