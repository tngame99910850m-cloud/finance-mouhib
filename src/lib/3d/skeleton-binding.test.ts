import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { attachRigidGarment, bindSkinnedGarment, findAttachmentPoint } from "./skeleton-binding";

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
