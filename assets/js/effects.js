/**
 * Televista Visual Effects
 * Three.js particle constellation with mouse interaction, 3D card tilt
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ═══════════════════════════════════════════════════
  // THREE.JS — PARTICLE CONSTELLATION (HERO BG)
  // ═══════════════════════════════════════════════════

  function initParticleBackground() {
    if (typeof THREE === 'undefined') return;

    var hero = document.querySelector('.hero');
    if (!hero) return;

    var w = hero.offsetWidth;
    var h = hero.offsetHeight;

    var scene = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    cam.position.z = 30;

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.className = 'three-hero-bg';
    hero.insertBefore(renderer.domElement, hero.firstChild);

    // Particles
    var count = 40;
    var positions = new Float32Array(count * 3);
    var velocities = [];
    var spread = 65;

    for (var i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread * (h / w);
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
      velocities.push({
        x: (Math.random() - 0.5) * 0.025,
        y: (Math.random() - 0.5) * 0.025,
        z: (Math.random() - 0.5) * 0.01
      });
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var mat = new THREE.PointsMaterial({
      color: 0x006663,
      size: 0.22,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true
    });

    var points = new THREE.Points(geo, mat);
    scene.add(points);

    // Lines between nearby particles
    var lineMat = new THREE.LineBasicMaterial({
      color: 0x004643,
      transparent: true,
      opacity: 0.12
    });

    var lineGeo = new THREE.BufferGeometry();
    var linePositions = new Float32Array(count * count * 6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    var lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // Mouse tracking — world-space position for particle interaction
    var mouseX = 0;
    var mouseY = 0;
    var mouseWorldX = 0;
    var mouseWorldY = 0;
    var mouseActive = false;
    var repelRadius = 6;
    var repelStrength = 0.12;

    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      // Map to approximate world coords
      mouseWorldX = mouseX * (spread / 2);
      mouseWorldY = -mouseY * (spread / 2) * (h / w);
      mouseActive = true;
    }, { passive: true });

    hero.addEventListener('mouseleave', function () {
      mouseActive = false;
    });

    var isVisible = true;
    var obs = new IntersectionObserver(function (entries) {
      isVisible = entries[0].isIntersecting;
    }, { threshold: 0 });
    obs.observe(hero);

    var connectionDistance = 14;

    // Center dead zone — keeps particles away from the hero text
    var centerZoneW = 14;  // horizontal half-width in world units
    var centerZoneH = 8;   // vertical half-height in world units
    var centerRepel = 0.08; // push strength

    function animate() {
      requestAnimationFrame(animate);
      if (!isVisible) return;

      var pos = geo.attributes.position.array;

      // Move particles + mouse interaction + center avoidance
      for (var i = 0; i < count; i++) {
        var ix = i * 3;
        var iy = i * 3 + 1;
        var iz = i * 3 + 2;

        // Base drift
        pos[ix] += velocities[i].x;
        pos[iy] += velocities[i].y;
        pos[iz] += velocities[i].z;

        // Center text avoidance — push particles out of the center zone
        var ax = Math.abs(pos[ix]);
        var ay = Math.abs(pos[iy]);
        if (ax < centerZoneW && ay < centerZoneH) {
          // Push toward the nearest edge of the zone
          var pushX = (centerZoneW - ax) / centerZoneW * centerRepel;
          var pushY = (centerZoneH - ay) / centerZoneH * centerRepel;
          pos[ix] += pos[ix] >= 0 ? pushX : -pushX;
          pos[iy] += pos[iy] >= 0 ? pushY : -pushY;
        }

        // Mouse repel — particles gently push away from cursor
        if (mouseActive) {
          var dx = pos[ix] - mouseWorldX;
          var dy = pos[iy] - mouseWorldY;
          var dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < repelRadius && dist > 0.1) {
            var force = (1 - dist / repelRadius) * repelStrength;
            pos[ix] += (dx / dist) * force;
            pos[iy] += (dy / dist) * force;
          }
        }

        // Wrap around boundaries
        var halfSpread = spread / 2;
        if (pos[ix] > halfSpread) pos[ix] = -halfSpread;
        if (pos[ix] < -halfSpread) pos[ix] = halfSpread;
        if (pos[iy] > halfSpread) pos[iy] = -halfSpread;
        if (pos[iy] < -halfSpread) pos[iy] = halfSpread;
        if (pos[iz] > 8) pos[iz] = -8;
        if (pos[iz] < -8) pos[iz] = 8;
      }

      geo.attributes.position.needsUpdate = true;

      // Update connections
      var lp = lines.geometry.attributes.position.array;
      var idx = 0;
      for (var a = 0; a < count; a++) {
        for (var b = a + 1; b < count; b++) {
          var cdx = pos[a * 3] - pos[b * 3];
          var cdy = pos[a * 3 + 1] - pos[b * 3 + 1];
          var cdz = pos[a * 3 + 2] - pos[b * 3 + 2];
          var cdist = Math.sqrt(cdx * cdx + cdy * cdy + cdz * cdz);

          if (cdist < connectionDistance) {
            lp[idx++] = pos[a * 3];
            lp[idx++] = pos[a * 3 + 1];
            lp[idx++] = pos[a * 3 + 2];
            lp[idx++] = pos[b * 3];
            lp[idx++] = pos[b * 3 + 1];
            lp[idx++] = pos[b * 3 + 2];
          }
        }
      }
      for (var z = idx; z < lp.length; z++) lp[z] = 0;
      lines.geometry.attributes.position.needsUpdate = true;
      lines.geometry.setDrawRange(0, idx / 3);

      // Subtle scene rotation from mouse
      scene.rotation.y += (mouseX * 0.05 - scene.rotation.y) * 0.02;
      scene.rotation.x += (-mouseY * 0.03 - scene.rotation.x) * 0.02;

      renderer.render(scene, cam);
    }
    animate();

    // Handle resize
    window.addEventListener('resize', function () {
      var nw = hero.offsetWidth;
      var nh = hero.offsetHeight;
      cam.aspect = nw / nh;
      cam.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
  }

  // ═══════════════════════════════════════════════════
  // 3D CARD TILT EFFECT
  // ═══════════════════════════════════════════════════

  function initCardTilt() {
    var selectors = [
      '.why-choose-card',
      '.pricing-card',
      '.stat-card',
      '.benefit-card',
      '.process-card',
      '.industry-card'
    ];

    var cards = document.querySelectorAll(selectors.join(','));

    cards.forEach(function (card) {
      card.style.transition = 'transform 0.35s ease, box-shadow 0.35s ease';
      card.style.transformStyle = 'preserve-3d';
      card.style.willChange = 'transform';

      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;

        var rotateY = ((x - centerX) / centerX) * 4;
        var rotateX = ((centerY - y) / centerY) * 4;

        card.style.transform =
          'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale3d(1.02, 1.02, 1.02)';
        card.style.boxShadow =
          (rotateY * -0.5) + 'px ' + (rotateX * 0.5 + 8) + 'px 24px rgba(0, 70, 67, 0.12)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        card.style.boxShadow = '';
      });
    });
  }

  // ═══════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════

  function init() {
    initCardTilt();

    if (typeof THREE !== 'undefined') {
      initParticleBackground();
    } else {
      var attempts = 0;
      var check = setInterval(function () {
        attempts++;
        if (typeof THREE !== 'undefined') {
          clearInterval(check);
          initParticleBackground();
        }
        if (attempts > 100) clearInterval(check);
      }, 50);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
