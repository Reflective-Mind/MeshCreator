import { useEffect, useRef, useState } from 'react';
import styles from '../styles/MeshGenerator.module.css';
import { examples, loadExample } from '../utils/examples';

const MeshGenerator = () => {
  const viewerRef = useRef(null);
  const codeEditorRef = useRef(null);
  const [status, setStatus] = useState('Ready');
  const [meshInfo, setMeshInfo] = useState({ vertices: 0, faces: 0 });
  const [generatedMesh, setGeneratedMesh] = useState(null);
  const [scene, setScene] = useState(null);
  const [camera, setCamera] = useState(null);
  const [renderer, setRenderer] = useState(null);
  const [controls, setControls] = useState(null);
  
  // Initialize the code editor
  useEffect(() => {
    if (typeof window !== 'undefined' && codeEditorRef.current) {
      const initCodeEditor = () => {
        // Check if CodeMirror is available
        if (window.CodeMirror) {
          const editor = window.CodeMirror(codeEditorRef.current, {
            value: examples.cube,
            mode: 'javascript',
            theme: 'monokai',
            lineNumbers: true,
            matchBrackets: true,
            indentUnit: 2,
            tabSize: 2,
            lineWrapping: true,
            extraKeys: { 'Ctrl-Space': 'autocomplete' }
          });
          return editor;
        }
        return null;
      };
      
      const editor = initCodeEditor();
      
      return () => {
        if (editor) {
          editor.toTextArea();
        }
      };
    }
  }, []);
  
  // Initialize Three.js viewer
  useEffect(() => {
    if (typeof window !== 'undefined' && viewerRef.current) {
      const initViewer = () => {
        // Set up scene
        const newScene = new window.THREE.Scene();
        newScene.background = new window.THREE.Color(0x1a1a1a);
        
        // Set up camera
        const camera = new window.THREE.PerspectiveCamera(
          75, 
          viewerRef.current.clientWidth / viewerRef.current.clientHeight, 
          0.1, 
          1000
        );
        camera.position.z = 5;
        
        // Set up renderer
        const renderer = new window.THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = window.THREE.PCFSoftShadowMap;
        viewerRef.current.appendChild(renderer.domElement);
        
        // Add lights
        const ambientLight = new window.THREE.AmbientLight(0xffffff, 0.4);
        newScene.add(ambientLight);
        
        const directionalLight = new window.THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.bias = -0.001;
        newScene.add(directionalLight);
        
        // Add a grid helper
        const gridHelper = new window.THREE.GridHelper(10, 10);
        gridHelper.material.opacity = 0.2;
        gridHelper.material.transparent = true;
        newScene.add(gridHelper);
        
        // Set up controls
        const controls = new window.THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        
        // Store references
        setScene(newScene);
        setCamera(camera);
        setRenderer(renderer);
        setControls(controls);
        
        // Animation loop
        const animate = () => {
          requestAnimationFrame(animate);
          
          if (controls) {
            controls.update();
          }
          
          if (renderer && newScene && camera) {
            renderer.render(newScene, camera);
          }
        };
        
        animate();
        
        // Handle window resize
        const handleResize = () => {
          if (camera && renderer && viewerRef.current) {
            camera.aspect = viewerRef.current.clientWidth / viewerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight);
          }
        };
        
        window.addEventListener('resize', handleResize);
        
        return () => {
          window.removeEventListener('resize', handleResize);
          if (renderer && viewerRef.current) {
            viewerRef.current.removeChild(renderer.domElement);
          }
        };
      };
      
      const cleanup = initViewer();
      return cleanup;
    }
  }, []);
  
  // Generate mesh from code
  const generateMesh = () => {
    if (!scene || !codeEditorRef.current || !camera) return;
    
    try {
      setStatus('Generating mesh...');
      
      // Get the code from the editor
      const code = codeEditorRef.current.CodeMirror?.getValue() || examples.cube;
      
      // Clear previous mesh
      if (generatedMesh) {
        scene.remove(generatedMesh);
      }
      
      // Create a namespace for the generated mesh
      const namespace = {
        THREE: window.THREE,
        scene,
        logStatus: (message) => setStatus(message)
      };
      
      // Execute the code
      const newMesh = new window.THREE.Group();
      const fn = new Function('generatedMesh', ...Object.keys(namespace), code);
      fn(newMesh, ...Object.values(namespace));
      
      // Add the mesh to the scene
      scene.add(newMesh);
      setGeneratedMesh(newMesh);
      
      // Update mesh info
      updateMeshInfo(newMesh);
      
      // Adjust camera to fit the mesh
      fitCameraToMesh(newMesh, camera);
      
    } catch (error) {
      console.error('Error generating mesh:', error);
      setStatus(`Error: ${error.message}`);
    }
  };
  
  // Update mesh information (vertices and faces)
  const updateMeshInfo = (mesh) => {
    let vertices = 0;
    let faces = 0;
    
    mesh.traverse((object) => {
      if (object.isMesh) {
        const geometry = object.geometry;
        
        if (geometry.isBufferGeometry) {
          vertices += geometry.attributes.position.count;
          
          if (geometry.index !== null) {
            faces += geometry.index.count / 3;
          } else {
            faces += geometry.attributes.position.count / 3;
          }
        }
      }
    });
    
    setMeshInfo({ vertices, faces: Math.floor(faces) });
  };
  
  // Adjust camera to fit the mesh
  const fitCameraToMesh = (mesh, camera) => {
    const box = new window.THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new window.THREE.Vector3());
    const center = box.getCenter(new window.THREE.Vector3());
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
    
    // Add some padding
    cameraZ *= 1.5;
    
    camera.position.z = cameraZ;
    
    // Center the camera on the mesh
    const offset = new window.THREE.Vector3();
    offset.copy(camera.position).sub(center);
    camera.position.copy(center).add(offset);
    
    camera.lookAt(center);
    
    // Update the orbit controls
    if (controls) {
      controls.target.copy(center);
      controls.update();
    }
  };
  
  // Load an example
  const loadExampleCode = (exampleType) => {
    if (codeEditorRef.current && codeEditorRef.current.CodeMirror) {
      const editor = codeEditorRef.current.CodeMirror;
      
      // Handle built-in examples
      if (examples[exampleType]) {
        editor.setValue(examples[exampleType]);
        setStatus(`Loaded ${exampleType} example`);
        return;
      }
      
      // Handle complex examples
      loadExample(exampleType)
        .then(code => {
          if (typeof code === 'string') {
            editor.setValue(code);
            setStatus(`Loaded ${exampleType} example`);
          }
        })
        .catch(error => {
          console.error('Error loading example:', error);
          setStatus(`Error loading example: ${error.message}`);
        });
    }
  };
  
  return (
    <div className="container">
      <div className="sidebar">
        <h1 className="title">Unreal Engine Mesh Creator</h1>
        
        <div className="codeEditorContainer" ref={codeEditorRef}></div>
        
        <button className="button primaryBtn" onClick={generateMesh}>
          Generate Mesh
        </button>
        
        <div className="panelLabel">Examples:</div>
        <div className="exampleButtons">
          <button className="button" onClick={() => loadExampleCode('cube')}>Cube</button>
          <button className="button" onClick={() => loadExampleCode('sphere')}>Sphere</button>
          <button className="button" onClick={() => loadExampleCode('cylinder')}>Cylinder</button>
          <button className="button" onClick={() => loadExampleCode('torus')}>Torus</button>
        </div>
        
        <div className="panelLabel">Mesh Info:</div>
        <div className="status">
          Vertices: {meshInfo.vertices}, Faces: {meshInfo.faces}
        </div>
      </div>
      
      <div className="viewport">
        <div className="viewer" ref={viewerRef}></div>
        
        <div className="statusContainer">
          <div className="status">
            Status: <span className={status.includes('Error') ? 'error' : 'success'}>{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeshGenerator;
