// Example code for different mesh types
export const examples = {
  cube: `// Create a basic cube mesh
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ 
    color: 0x00aaff,
    roughness: 0.4,
    metalness: 0.3
});
generatedMesh = new THREE.Mesh(geometry, material);

// Log information about the mesh
logStatus('Created a cube with 6 faces');`,

  sphere: `// Create a detailed sphere mesh
const geometry = new THREE.SphereGeometry(1, 64, 48);
const material = new THREE.MeshStandardMaterial({ 
    color: 0xff5500,
    roughness: 0.2,
    metalness: 0.7
});
generatedMesh = new THREE.Mesh(geometry, material);

// Log information about the mesh
logStatus('Created a sphere with high detail');`,

  cylinder: `// Create a cylinder mesh
const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
const material = new THREE.MeshStandardMaterial({ 
    color: 0x22cc22,
    roughness: 0.6,
    metalness: 0.1
});
generatedMesh = new THREE.Mesh(geometry, material);

// Log information about the mesh
logStatus('Created a cylinder with height 2 and radius 0.5');`,

  torus: `// Create a torus (donut) mesh
const geometry = new THREE.TorusGeometry(1, 0.4, 32, 100);
const material = new THREE.MeshStandardMaterial({ 
    color: 0xffcc00,
    roughness: 0.5,
    metalness: 0.5
});
generatedMesh = new THREE.Mesh(geometry, material);

// Log information about the mesh
logStatus('Created a torus with radius 1 and tube radius 0.4');`
};

// Returns the appropriate example code for the specified type
export const loadExample = (type) => {
  if (examples[type]) {
    return Promise.resolve(examples[type]);
  }
  
  return Promise.resolve(examples.cube);
};
