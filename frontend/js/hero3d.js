/* ═══════════════════════════════════════════════════════════════
   PinAI — 3D Animated Hero Intro (Three.js WebGL)
   Features illuminated 3D metallic "PINAI" typography with
   floating starlight particles and camera zoom on scroll into feed.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  const container = document.getElementById('hero3dContainer');
  if (!container) return;

  // Check user preference (can be toggled in Settings)
  if (localStorage.getItem('pinai_hero3d') === 'false') {
    container.style.display = 'none';
    const main = document.querySelector('.main');
    if (main) main.style.paddingTop = 'var(--navbar-height)';
    return;
  }

  let scene, camera, renderer, textGroup, particles;
  let mouseX = 0, mouseY = 0;
  let targetRotationX = 0, targetRotationY = 0;
  let scrollProgress = 0;

  function init() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050508, 0.015);

    // 2. Camera
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 32);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xff3b30, 2.5); // Apple Red
    dirLight1.position.set(20, 20, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x0071e3, 2.0); // Apple Blue
    dirLight2.position.set(-20, -10, 15);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 3, 50);
    pointLight.position.set(0, 0, 15);
    scene.add(pointLight);

    // 5. Build 3D "PINAI" Letters using procedural geometry
    textGroup = new THREE.Group();
    buildLetters();
    scene.add(textGroup);

    // 6. Floating Particles
    createParticles();

    // 7. Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', onWindowScroll, { passive: true });

    // Explore Button click
    const exploreBtn = document.getElementById('heroExploreBtn');
    if (exploreBtn) {
      exploreBtn.addEventListener('click', () => {
        const feedTop = container.offsetHeight - 50;
        window.scrollTo({ top: feedTop, behavior: 'smooth' });
      });
    }

    animate();
  }

  // ─── Procedural 3D Letter Construction ─────────────────────────
  function buildLetters() {
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.85,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
      transmission: 0.2,
      ior: 1.5
    });

    const letterDepth = 1.6;
    const barRadius = 0.55;

    // Helper: create cylinder bar
    function createCylinder(length, rx = 0, ry = 0, rz = 0, x = 0, y = 0, z = 0) {
      const geo = new THREE.CylinderGeometry(barRadius, barRadius, length, 24);
      const mesh = new THREE.Mesh(geo, material);
      mesh.rotation.set(rx, ry, rz);
      mesh.position.set(x, y, z);
      return mesh;
    }

    // Helper: create torus arc
    function createArc(radius, tube, arc, x = 0, y = 0, z = 0, rz = 0) {
      const geo = new THREE.TorusGeometry(radius, tube, 20, 36, arc);
      const mesh = new THREE.Mesh(geo, material);
      mesh.rotation.z = rz;
      mesh.position.set(x, y, z);
      return mesh;
    }

    // ─── Letter 'P' (center ~ -10)
    const pGroup = new THREE.Group();
    pGroup.position.x = -10.5;
    pGroup.add(createCylinder(7, 0, 0, 0, -1.2, 0, 0)); // vertical stem
    pGroup.add(createArc(1.8, barRadius, Math.PI, -1.2, 1.7, 0, -Math.PI / 2)); // loop
    textGroup.add(pGroup);

    // ─── Letter 'I' (center ~ -5)
    const i1Group = new THREE.Group();
    i1Group.position.x = -5.2;
    i1Group.add(createCylinder(7, 0, 0, 0, 0, 0, 0)); // stem
    i1Group.add(createCylinder(2.6, 0, 0, Math.PI / 2, 0, 3.2, 0)); // top serif
    i1Group.add(createCylinder(2.6, 0, 0, Math.PI / 2, 0, -3.2, 0)); // bottom serif
    textGroup.add(i1Group);

    // ─── Letter 'N' (center ~ 0)
    const nGroup = new THREE.Group();
    nGroup.position.x = 0;
    nGroup.add(createCylinder(7, 0, 0, 0, -1.8, 0, 0)); // left stem
    nGroup.add(createCylinder(7, 0, 0, 0, 1.8, 0, 0)); // right stem
    nGroup.add(createCylinder(7.8, 0, 0, -0.48, 0, 0, 0)); // diagonal
    textGroup.add(nGroup);

    // ─── Letter 'A' (center ~ 5.5)
    const aGroup = new THREE.Group();
    aGroup.position.x = 5.5;
    aGroup.add(createCylinder(7.2, 0, 0, 0.28, -1.1, 0, 0)); // left leg
    aGroup.add(createCylinder(7.2, 0, 0, -0.28, 1.1, 0, 0)); // right leg
    aGroup.add(createCylinder(2.2, 0, 0, Math.PI / 2, 0, -0.6, 0)); // crossbar
    textGroup.add(aGroup);

    // ─── Letter 'I' (center ~ 10.5)
    const i2Group = new THREE.Group();
    i2Group.position.x = 10.8;
    i2Group.add(createCylinder(7, 0, 0, 0, 0, 0, 0));
    i2Group.add(createCylinder(2.6, 0, 0, Math.PI / 2, 0, 3.2, 0));
    i2Group.add(createCylinder(2.6, 0, 0, Math.PI / 2, 0, -3.2, 0));
    textGroup.add(i2Group);
  }

  // ─── Floating Star Particles ───────────────────────────────────
  function createParticles() {
    const count = 350;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

      // Color variation (Apple red, electric blue, soft white)
      const choice = Math.random();
      if (choice < 0.3) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.23; colors[i * 3 + 2] = 0.19;
      } else if (choice < 0.6) {
        colors[i * 3] = 0.0; colors[i * 3 + 1] = 0.44; colors[i * 3 + 2] = 0.89;
      } else {
        colors[i * 3] = 0.9; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 1.0;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);
  }

  // ─── Event Handlers ────────────────────────────────────────────
  function onWindowResize() {
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function onMouseMove(e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    targetRotationY = mouseX * 0.35;
    targetRotationX = -mouseY * 0.25;
  }

  function onWindowScroll() {
    const heroHeight = container.offsetHeight || window.innerHeight;
    const scrollY = window.scrollY;
    scrollProgress = Math.min(Math.max(scrollY / heroHeight, 0), 1);
  }

  // ─── Animation Loop ────────────────────────────────────────────
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Subtle idle floating
    if (textGroup) {
      textGroup.rotation.y += (targetRotationY - textGroup.rotation.y) * 0.05;
      textGroup.rotation.x += (targetRotationX - textGroup.rotation.x) * 0.05;
      textGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.4;

      // Scroll-driven camera swooping and scale dispersion
      const targetZ = 32 - scrollProgress * 26; // zooms forward
      camera.position.z += (targetZ - camera.position.z) * 0.1;
      camera.position.y = scrollProgress * 5;

      // As user scrolls, disperse letters slightly and fade canvas
      textGroup.children.forEach((letter, idx) => {
        const offset = (idx - 2) * scrollProgress * 2.5;
        letter.position.z = Math.sin(elapsedTime * 2 + idx) * 0.2 + scrollProgress * 8;
        letter.rotation.y = Math.sin(elapsedTime + idx) * 0.1;
      });

      // Fade canvas out when scrolled past hero
      container.style.opacity = (1 - scrollProgress * 1.3).toString();
      if (scrollProgress >= 0.98) {
        container.style.pointerEvents = 'none';
      } else {
        container.style.pointerEvents = 'auto';
      }
    }

    // Particle rotation
    if (particles) {
      particles.rotation.y = elapsedTime * 0.04;
      particles.rotation.x = elapsedTime * 0.02;
    }

    renderer.render(scene, camera);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
