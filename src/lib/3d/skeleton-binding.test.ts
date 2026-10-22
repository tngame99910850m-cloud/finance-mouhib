import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
  attachRigidGarment,
  bindSkinnedGarment,
  defaultFitSpanForCategory,
  findAttachmentPoint,
  fitRigidGarmentToLandmarks,
} from "./skeleton-binding";

function makeBone(name: string): THREE.Bone {
  const bone = new THREE.Bone();
  bone.name = name;
  return bone;
}

function makeSkinnedMesh(boneNames: string[]): THREE.SkinnedMesh {
  const bones = boneNames.map(makeBone);
  const skeleton = new THREE.Skeleton(bones);
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.MeshStandardMaterial();
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.bind(skeleton);
  return mesh;
}

describe("bindSkinnedGarment", () => {
  it("binds successfully when bone names match the avatar skeleton", () => {
    const avatarSkeleton = new THREE.Skeleton([makeBone("hips"), makeBone("spine"), makeBone("chest")]);
    const garmentMesh = makeSkinnedMesh(["hips", "spine", "chest"]);

    const result = bindSkinnedGarment(garmentMesh, avatarSkeleton);

    expect(result.ok).toBe(true);
    expect(garmentMesh.skeleton.bones.map((b) => b.name)).toEqual(["hips", "spine", "chest"]);
    // Rebound to the avatar's actual bone instances, not clones.
    expect(garmentMesh.skeleton.bones[0]).toBe(avatarSkeleton.bones[0]);
  });

  it("rejects a garment whose bone names don't exist on the avatar", () => {
    const avatarSkeleton = new THREE.Skeleton([makeBone("hips"), makeBone("spine")]);
    const garmentMesh = makeSkinnedMesh(["hips", "left_arm_IK"]);

    const result = bindSkinnedGarment(garmentMesh, avatarSkeleton);

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("left_arm_IK");
  });

  it("rejects a garment mesh with no skeleton", () => {
    const avatarSkeleton = new THREE.Skeleton([makeBone("hips")]);
    const unskinned = new THREE.SkinnedMesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial());
    // bind with an empty skeleton to simulate "no real skeleton"
    unskinned.bind(new THREE.Skeleton([]));

    const result = bindSkinnedGarment(unskinned, avatarSkeleton);
    expect(result.ok).toBe(false);
  });
});

describe("findAttachmentPoint / attachRigidGarment", () => {
  function makeAvatarRoot(): THREE.Group {
    const root = new THREE.Group();
    const neck = new THREE.Object3D();
    neck.name = "neck";
    root.add(neck);
    return root;
  }

  it("finds a named attachment point", () => {
    const root = makeAvatarRoot();
    expect(findAttachmentPoint(root, "neck")).toBeDefined();
    expect(findAttachmentPoint(root, "waist")).toBeUndefined();
  });

  it("attaches a rigid object to an existing attachment point", () => {
    const root = makeAvatarRoot();
    const necklace = new THREE.Object3D();

    const result = attachRigidGarment(necklace, root, "neck");

    expect(result.ok).toBe(true);
    expect(necklace.parent?.name).toBe("neck");
  });

  it("reports a useful diagnostic for a missing attachment point instead of attaching incorrectly", () => {
    const root = makeAvatarRoot();
    const belt = new THREE.Object3D();

    const result = attachRigidGarment(belt, root, "waist");

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("waist");
    expect(belt.parent).toBeNull();
  });
});

describe("defaultFitSpanForCategory", () => {
  it("gives every category a sensible default span", () => {
    expect(defaultFitSpanForCategory("dresses")).toBe("full");
    expect(defaultFitSpanForCategory("outerwear")).toBe("full");
    expect(defaultFitSpanForCategory("tops")).toBe("upper");
    expect(defaultFitSpanForCategory("bottoms")).toBe("lower");
    expect(defaultFitSpanForCategory("shoes")).toBe("none");
    expect(defaultFitSpanForCategory("bags")).toBe("none");
    expect(defaultFitSpanForCategory("accessories")).toBe("none");
    expect(defaultFitSpanForCategory("hairstyles")).toBe("none");
  });
});

describe("fitRigidGarmentToLandmarks", () => {
  function makeAvatarRoot() {
    const root = new THREE.Group();
    const neck = new THREE.Object3D();
    neck.name = "neck";
    neck.position.set(0, 1.5, 0);
    const waist = new THREE.Object3D();
    waist.name = "waist";
    waist.position.set(0.1, 0.9, 0.2);
    const leftFoot = new THREE.Object3D();
    leftFoot.name = "left-foot";
    leftFoot.position.set(-0.1, 0, 0);
    const rightFoot = new THREE.Object3D();
    rightFoot.name = "right-foot";
    rightFoot.position.set(0.1, 0, 0);
    root.add(neck, waist, leftFoot, rightFoot);
    root.updateMatrixWorld(true);
    return { root, waist };
  }

  /** A box-shaped stand-in for a garment, with a deliberately garbled
   * baked-in transform (like the real per-file scale/offset nodes these
   * garment GLBs actually ship with) to prove the fit corrects for
   * whatever transform chain already exists, not just a clean mesh. */
  function makeGarment(): THREE.Object3D {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 1));
    const garbled = new THREE.Object3D();
    garbled.position.set(37, -12, 5);
    garbled.scale.set(3, 3, 3);
    garbled.add(mesh);
    const root = new THREE.Object3D();
    root.add(garbled);
    return root;
  }

  it("fits a full-span garment so its hem lands on the floor and its top lands at neck height, centered on the waist", () => {
    const { root: avatarRoot, waist } = makeAvatarRoot();
    const garment = makeGarment();

    const attachResult = attachRigidGarment(garment, avatarRoot, "waist");
    expect(attachResult.ok).toBe(true);

    const fitResult = fitRigidGarmentToLandmarks(garment, avatarRoot, "full");
    expect(fitResult.ok).toBe(true);

    garment.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(garment);

    expect(box.min.y).toBeCloseTo(0, 5); // floor
    expect(box.max.y).toBeCloseTo(1.5, 5); // neck
    expect((box.min.x + box.max.x) / 2).toBeCloseTo(waist.position.x, 5);
    expect((box.min.z + box.max.z) / 2).toBeCloseTo(waist.position.z, 5);
    // Uniform scale — the garment's authored 2:4:1 proportions must survive.
    const size = box.getSize(new THREE.Vector3());
    expect(size.x / size.y).toBeCloseTo(2 / 4, 5);
    expect(size.z / size.y).toBeCloseTo(1 / 4, 5);
  });

  it("fits an upper-span garment between waist and neck only", () => {
    const { root: avatarRoot } = makeAvatarRoot();
    const garment = makeGarment();
    attachRigidGarment(garment, avatarRoot, "waist");

    const fitResult = fitRigidGarmentToLandmarks(garment, avatarRoot, "upper");
    expect(fitResult.ok).toBe(true);

    garment.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(garment);
    expect(box.min.y).toBeCloseTo(0.9, 5); // waist
    expect(box.max.y).toBeCloseTo(1.5, 5); // neck
  });

  it("fits a lower-span garment between floor and waist only", () => {
    const { root: avatarRoot } = makeAvatarRoot();
    const garment = makeGarment();
    attachRigidGarment(garment, avatarRoot, "waist");

    const fitResult = fitRigidGarmentToLandmarks(garment, avatarRoot, "lower");
    expect(fitResult.ok).toBe(true);

    garment.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(garment);
    expect(box.min.y).toBeCloseTo(0, 5); // floor
    expect(box.max.y).toBeCloseTo(0.9, 5); // waist
  });

  it("is a no-op for fitSpan 'none'", () => {
    const { root: avatarRoot } = makeAvatarRoot();
    const garment = makeGarment();
    attachRigidGarment(garment, avatarRoot, "waist");
    const before = garment.position.clone();

    const fitResult = fitRigidGarmentToLandmarks(garment, avatarRoot, "none");

    expect(fitResult.ok).toBe(true);
    expect(garment.position.equals(before)).toBe(true);
  });

  it("reports a diagnostic instead of fitting when the avatar has no waist landmark", () => {
    const avatarRoot = new THREE.Group();
    const garment = makeGarment();
    avatarRoot.add(garment);

    const fitResult = fitRigidGarmentToLandmarks(garment, avatarRoot, "full");

    expect(fitResult.ok).toBe(false);
    expect(fitResult.reason).toContain("waist");
  });
});
