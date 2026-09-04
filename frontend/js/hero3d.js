/* ═══════════════════════════════════════════════════════════════
   Pinterest Clone — Next-Gen 3D Animated Hero (Three.js WebGL)
   Features:
   - Sculpted 3D "PINTEREST" kinetic wordmark with liquid wave oscillation
   - Signature 3D floating ruby Pinterest Pin badge with metallic chrome needle
   - Orbiting translucent 3D glass inspiration cards (Pins)
   - 450 iridescent stardust nebula particles with crimson/gold/blue glow
   - Responsive aspect-ratio auto-scaling for mobile & desktop
   - Interactive mouse parallax & smooth scroll swoop into masonry feed
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

  let scene, camera, renderer;
  let textGroup, pinBadge, cardsGroup, particles;
  let mouseX = 0, mouseY = 0;
  let targetRotationX = 0, targetRotationY = 0;
  let scrollProgress = 0;
  const floatingCards = [];

  function init() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene setup with deep cinematic atmospheric fog
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06060a, 0.012);

    // 2. Camera
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 36);

    // 3. WebGL Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // 4. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Pinterest signature crimson key light
    const redLight = new THREE.DirectionalLight(0xe60023, 3.2);
    redLight.position.set(24, 20, 22);
    scene.add(redLight);

    // Cool rim light for Apple-style metallic reflection
    const blueLight = new THREE.DirectionalLight(0x0071e3, 2.4);
    blueLight.position.set(-25, -12, 18);
    scene.add(blueLight);

    // Warm specular fill light
    const goldLight = new THREE.DirectionalLight(0xffb800, 1.2);
    goldLight.position.set(0, -20, 15);
    scene.add(goldLight);

    // Center focal point light
    const centerLight = new THREE.PointLight(0xffffff, 2.5, 60);
    centerLight.position.set(0, 2, 16);
    scene.add(centerLight);

    // 5. Build 3D "PINTEREST" Letters
    textGroup = new THREE.Group();
    buildPinterestLetters();
    scene.add(textGroup);

    // 6. Build 3D Signature Pinterest Pin Badge
    buildPinBadge();

    // 7. Build Floating 3D Glass Inspiration Cards
    cardsGroup = new THREE.Group();
    buildFloatingCards();
    scene.add(cardsGroup);

    // 8. Swirling Starlight Particle Nebula
    createParticles();

    // 9. Initial Scale Adjustment for Screen Size
    adjustScale();

    // 10. Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', onWindowScroll, { passive: true });

    // Scroll to explore button
    const exploreBtn = document.getElementById('heroExploreBtn');
    if (exploreBtn) {
      exploreBtn.addEventListener('click', () => {
        const feedTop = container.offsetHeight - 40;
        window.scrollTo({ top: feedTop, behavior: 'smooth' });
      });
    }

    animate();
  }

  // ─── Procedural 3D "PINTEREST" Kinetic Wordmark ───────────────────
  function buildPinterestLetters() {
    const silverMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf8f9fa,
      metalness: 0.88,
      roughness: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.95,
      transmission: 0.12,
      ior: 1.52
    });

    const barRadius = 0.46;

    function createBar(len, rx = 0, ry = 0, rz = 0, x = 0, y = 0, z = 0) {
      const geo = new THREE.CylinderGeometry(barRadius, barRadius, len, 24);
      const mesh = new THREE.Mesh(geo, silverMaterial);
      mesh.rotation.set(rx, ry, rz);
      mesh.position.set(x, y, z);
      return mesh;
    }

    function createArc(r, tube, arc, x = 0, y = 0, z = 0, rz = 0) {
      const geo = new THREE.TorusGeometry(r, tube, 20, 36, arc);
      const mesh = new THREE.Mesh(geo, silverMaterial);
      mesh.rotation.z = rz;
      mesh.position.set(x, y, z);
      return mesh;
    }

    // 1. 'P' (center -13.6)
    const pGroup = new THREE.Group();
    pGroup.position.x = -13.6;
    pGroup.add(createBar(6.2, 0, 0, 0, -0.7, 0, 0));
    pGroup.add(createArc(1.4, barRadius, Math.PI, -0.7, 1.5, 0, -Math.PI / 2));
    textGroup.add(pGroup);

    // 2. 'I' (center -10.2)
    const iGroup = new THREE.Group();
    iGroup.position.x = -10.2;
    iGroup.add(createBar(6.2, 0, 0, 0, 0, 0, 0));
    iGroup.add(createBar(2.2, 0, 0, Math.PI / 2, 0, 2.9, 0));
    iGroup.add(createBar(2.2, 0, 0, Math.PI / 2, 0, -2.9, 0));
    textGroup.add(iGroup);

    // 3. 'N' (center -6.8)
    const nGroup = new THREE.Group();
    nGroup.position.x = -6.8;
    nGroup.add(createBar(6.2, 0, 0, 0, -1.05, 0, 0));
    nGroup.add(createBar(6.2, 0, 0, 0, 1.05, 0, 0));
    nGroup.add(createBar(6.5, 0, 0, -0.34, 0, 0, 0));
    textGroup.add(nGroup);

    // 4. 'T' (center -3.4)
    const t1Group = new THREE.Group();
    t1Group.position.x = -3.4;
    t1Group.add(createBar(6.0, 0, 0, 0, 0, -0.2, 0));
    t1Group.add(createBar(3.0, 0, 0, Math.PI / 2, 0, 2.8, 0));
    textGroup.add(t1Group);

    // 5. 'E' (center 0.0)
    const e1Group = new THREE.Group();
    e1Group.position.x = 0.0;
    e1Group.add(createBar(6.2, 0, 0, 0, -0.9, 0, 0));
    e1Group.add(createBar(2.2, 0, 0, Math.PI / 2, 0.1, 2.9, 0));
    e1Group.add(createBar(1.7, 0, 0, Math.PI / 2, -0.15, 0.0, 0));
    e1Group.add(createBar(2.2, 0, 0, Math.PI / 2, 0.1, -2.9, 0));
    textGroup.add(e1Group);

    // 6. 'R' (center 3.4)
    const rGroup = new THREE.Group();
    rGroup.position.x = 3.4;
    rGroup.add(createBar(6.2, 0, 0, 0, -0.8, 0, 0));
    rGroup.add(createArc(1.35, barRadius, Math.PI, -0.8, 1.5, 0, -Math.PI / 2));
    rGroup.add(createBar(3.4, 0, 0, -0.58, 0.35, -1.45, 0));
    textGroup.add(rGroup);

    // 7. 'E' (center 6.8)
    const e2Group = new THREE.Group();
    e2Group.position.x = 6.8;
    e2Group.add(createBar(6.2, 0, 0, 0, -0.9, 0, 0));
    e2Group.add(createBar(2.2, 0, 0, Math.PI / 2, 0.1, 2.9, 0));
    e2Group.add(createBar(1.7, 0, 0, Math.PI / 2, -0.15, 0.0, 0));
    e2Group.add(createBar(2.2, 0, 0, Math.PI / 2, 0.1, -2.9, 0));
    textGroup.add(e2Group);

    // 8. 'S' (center 10.2)
    const sGroup = new THREE.Group();
    sGroup.position.x = 10.2;
    sGroup.add(createBar(1.8, 0, 0, Math.PI / 2, 0, 2.9, 0));
    sGroup.add(createBar(1.6, 0, 0, 0, -0.85, 2.05, 0));
    sGroup.add(createBar(1.8, 0, 0, Math.PI / 2, 0, 0.0, 0));
    sGroup.add(createBar(1.6, 0, 0, 0, 0.85, -1.05, 0));
    sGroup.add(createBar(1.8, 0, 0, Math.PI / 2, 0, -2.9, 0));
    textGroup.add(sGroup);

    // 9. 'T' (center 13.6)
    const t2Group = new THREE.Group();
    t2Group.position.x = 13.6;
    t2Group.add(createBar(6.0, 0, 0, 0, 0, -0.2, 0));
    t2Group.add(createBar(3.0, 0, 0, Math.PI / 2, 0, 2.8, 0));
    textGroup.add(t2Group);
  }

  // ─── Signature 3D Pinterest Red Pin Emblem ─────────────────────────
  function buildPinBadge() {
    pinBadge = new THREE.Group();

    // Glossy Pinterest Ruby Head
    const rubyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe60023,
      emissive: 0x660010,
      metalness: 0.5,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 0.98
    });

    // Outer spherical cap
    const sphereGeo = new THREE.SphereGeometry(1.6, 32, 32);
    const sphereMesh = new THREE.Mesh(sphereGeo, rubyMaterial);
    sphereMesh.scale.set(1.1, 1.1, 0.55);
    pinBadge.add(sphereMesh);

    // Chrome needle
    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8ecf1,
      metalness: 0.95,
      roughness: 0.1
    });
    const needleGeo = new THREE.ConeGeometry(0.24, 3.6, 24);
    const needleMesh = new THREE.Mesh(needleGeo, chromeMaterial);
    needleMesh.rotation.x = Math.PI;
    needleMesh.position.set(0, -2.4, 0);
    pinBadge.add(needleMesh);

    // White embossed 'P' inside the badge
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pStem = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.5, 16), whiteMat);
    pStem.position.set(-0.25, 0.05, 0.45);
    pinBadge.add(pStem);

    const pLoop = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.14, 16, 24, Math.PI), whiteMat);
    pLoop.rotation.z = -Math.PI / 2;
    pLoop.position.set(-0.25, 0.38, 0.45);
    pinBadge.add(pLoop);

    // Soft local glow light
    const badgeLight = new THREE.PointLight(0xe60023, 2.5, 15);
    badgeLight.position.set(0, 0, 3);
    pinBadge.add(badgeLight);

    pinBadge.position.set(0, 5.8, 2);
    scene.add(pinBadge);
  }

  // ─── Floating 3D Glass Inspiration Cards (Pins in Space) ───────────
  function buildFloatingCards() {
    const cardData = [
      { x: -19, y: 4.5, z: -7, rx: 0.12, ry: 0.25, color: 0xe60023 },
      { x: 19, y: 5.5, z: -6, rx: -0.15, ry: -0.22, color: 0x0071e3 },
      { x: -16, y: -6.0, z: -5, rx: 0.18, ry: 0.15, color: 0xffb800 },
      { x: 17, y: -5.5, z: -8, rx: -0.12, ry: -0.2, color: 0xff2a6d },
      { x: -9, y: 8.5, z: -11, rx: 0.1, ry: 0.1, color: 0x34c759 },
      { x: 9, y: 8.0, z: -10, rx: -0.1, ry: -0.15, color: 0xaf52de }
    ];

    cardData.forEach((cd, i) => {
      const cardGroup = new THREE.Group();
      cardGroup.position.set(cd.x, cd.y, cd.z);
      cardGroup.rotation.set(cd.rx, cd.ry, 0);

      // Glass body
      const cardGeo = new THREE.BoxGeometry(3.0, 4.4, 0.08);
      const cardMat = new THREE.MeshPhysicalMaterial({
        color: 0x14141e,
        metalness: 0.1,
        roughness: 0.2,
        transmission: 0.7,
        opacity: 0.75,
        transparent: true,
        clearcoat: 1.0
      });
      const cardMesh = new THREE.Mesh(cardGeo, cardMat);
      cardGroup.add(cardMesh);

      // Glowing border edge
      const edgeGeo = new THREE.EdgesGeometry(cardGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: cd.color,
        transparent: true,
        opacity: 0.45
      });
      const edgeMesh = new THREE.LineSegments(edgeGeo, edgeMat);
      cardGroup.add(edgeMesh);

      cardsGroup.add(cardGroup);
      floatingCards.push({
        group: cardGroup,
        baseX: cd.x,
        baseY: cd.y,
        baseZ: cd.z,
        baseRx: cd.rx,
        baseRy: cd.ry,
        speed: 0.8 + i * 0.25
      });
    });
  }

  // ─── Swirling Starlight Nebula Particles ───────────────────────────
  function createParticles() {
    const count = 450;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Cylindrical/galaxy distribution around the letters
      const radius = 10 + Math.random() * 28;
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 45;
      positions[i * 3 + 2] = Math.sin(angle) * radius * 0.6 + (Math.random() - 0.5) * 20;

      // Color variation: Pinterest Red, Coral Rose, Electric Blue, Diamond White
      const r = Math.random();
      if (r < 0.35) {
        colors[i * 3] = 0.90; colors[i * 3 + 1] = 0.0; colors[i * 3 + 2] = 0.14; // #E60023
      } else if (r < 0.6) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.25; colors[i * 3 + 2] = 0.45; // Coral Rose
      } else if (r < 0.8) {
        colors[i * 3] = 0.0; colors[i * 3 + 1] = 0.44; colors[i * 3 + 2] = 0.89; // Cyan Blue
      } else {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 0.85; // Pure White/Gold
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.38,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);
  }

  // ─── Responsive Scaling ───────────────────────────────────────────
  function adjustScale() {
    if (!container || !textGroup) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / height;

    if (aspect < 0.8) {
      // Mobile portrait
      textGroup.scale.setScalar(0.48);
      if (pinBadge) pinBadge.scale.setScalar(0.7);
    } else if (aspect < 1.2) {
      // Tablet
      textGroup.scale.setScalar(0.72);
      if (pinBadge) pinBadge.scale.setScalar(0.85);
    } else {
      // Desktop
      textGroup.scale.setScalar(1.0);
      if (pinBadge) pinBadge.scale.setScalar(1.0);
    }
  }

  // ─── Event Handlers ───────────────────────────────────────────────
  function onWindowResize() {
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    adjustScale();
  }

  function onMouseMove(e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    targetRotationY = mouseX * 0.28;
    targetRotationX = -mouseY * 0.20;
  }

  function onWindowScroll() {
    const heroHeight = container.offsetHeight || window.innerHeight;
    const scrollY = window.scrollY;
    scrollProgress = Math.min(Math.max(scrollY / heroHeight, 0), 1);
  }

  // ─── Render Animation Loop ────────────────────────────────────────
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // 1. Text Group Interactive Tilting & Liquid Wave Motion
    if (textGroup) {
      textGroup.rotation.y += (targetRotationY - textGroup.rotation.y) * 0.05;
      textGroup.rotation.x += (targetRotationX - textGroup.rotation.x) * 0.05;

      // Individual kinetic wave bobbing on each of the 9 letters
      textGroup.children.forEach((letter, idx) => {
        letter.position.y = Math.sin(elapsedTime * 2.2 + idx * 0.42) * 0.38;
        letter.rotation.y = Math.sin(elapsedTime * 1.5 + idx * 0.3) * 0.06;
      });
    }

    // 2. Pinterest Pin Badge floating & gentle oscillation
    if (pinBadge) {
      pinBadge.position.y = 5.8 + Math.sin(elapsedTime * 2.0) * 0.45;
      pinBadge.rotation.y = Math.sin(elapsedTime * 1.2) * 0.25;
      pinBadge.rotation.z = Math.cos(elapsedTime * 1.4) * 0.08;
    }

    // 3. Floating 3D Cards orbit & wobble
    floatingCards.forEach((fc) => {
      fc.group.position.y = fc.baseY + Math.sin(elapsedTime * fc.speed) * 0.6;
      fc.group.rotation.x = fc.baseRx + Math.sin(elapsedTime * fc.speed * 0.8) * 0.08;
      fc.group.rotation.y = fc.baseRy + Math.cos(elapsedTime * fc.speed * 0.7) * 0.1;
    });

    // 4. Particle Vortex Rotation
    if (particles) {
      particles.rotation.y = elapsedTime * 0.035;
      particles.rotation.x = elapsedTime * 0.015;
    }

    // 5. Scroll Zoom Effect into Masonry Feed
    const targetZ = 36 - scrollProgress * 30; // Camera accelerates forward through letters
    camera.position.z += (targetZ - camera.position.z) * 0.12;
    camera.position.y = scrollProgress * 6;

    // Disperse cards outward on scroll
    if (cardsGroup) {
      cardsGroup.children.forEach((c, idx) => {
        c.position.z = floatingCards[idx].baseZ + scrollProgress * 18;
      });
    }

    // Fade canvas out smoothly when approaching feed
    container.style.opacity = Math.max(0, 1 - scrollProgress * 1.2).toString();
    container.style.pointerEvents = scrollProgress >= 0.96 ? 'none' : 'auto';

    renderer.render(scene, camera);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
