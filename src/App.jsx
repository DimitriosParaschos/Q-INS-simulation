import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';

// ============================================================================
// Sensor presets, derived from the review paper's Table I / II.
// Each sensor is now parameterised by the THREE standard Allan-variance-style
// quantities used in real INS error analysis (IEEE Std 952-1997; Groves 2013,
// Ch.4): biasInstability (the steady-state std. dev. sigma_ss of a first-order
// Gauss-Markov bias process), correlationTime (Tc, how slowly that bias
// process decorrelates), and noiseDensity (the angle/velocity random walk,
// ARW/VRW, an independent white-noise contribution). These are still relative
// severity scores tuned for the simulation (see the methodology document),
// not measured datasheet values, but the STRUCTURE of the model now matches
// standard inertial-sensor error analysis rather than ad hoc constants.
// SWaP figures are illustrative, scaled from the qualitative descriptions in
// the paper (cold-atom needs vacuum+lasers; NV/hybrid are compact and light;
// MEMS is the lightest/cheapest but drifts hardest).
// ============================================================================
const PRESETS = {
  mems: {
    label: 'Classical MEMS IMU',
    short: 'MEMS',
    icon: '⚙️',
    color: '#ff5a36',
    rate: 200,
    biasInstability: 50,
    noiseDensity: 0.05,
    correlationTime: 15, // s — bias decorrelates quickly (short memory, "noisy" bias)
    desc: 'Hundreds of Hz. Cheap, fast, but bias and noise integrate into large long-term drift.',
    swap: { mass: 1, power: 0.5, volume: 5, cost: 1 }, // kg (default 1kg, user-tunable), W, cm³, relative cost
  },
  coldatom: {
    label: 'Cold-Atom Interferometer',
    short: 'Cold-Atom',
    icon: '❄️',
    color: '#5ec8ff',
    rate: 2,
    biasInstability: 0.4,
    noiseDensity: 0.003,
    correlationTime: 60, // s — long memory, very stable bias, matching "near-absolute reference"
    desc: 'Ultra-low drift, near-absolute reference — but ~1–10 Hz with dead time. Misses fast dynamics.',
    swap: { mass: 1, power: 60, volume: 9000, cost: 400 },
  },
  nv: {
    label: 'NV-Center Magnetometer',
    short: 'NV-Center',
    icon: '💎',
    color: '#c98bff',
    rate: 100,
    biasInstability: 8,
    noiseDensity: 0.02,
    correlationTime: 25, // s
    desc: 'Room-temp, compact, decent bandwidth. Indirect sensing — map/field dependent, moderate drift.',
    swap: { mass: 1, power: 10, volume: 450, cost: 35 },
  },
  hybrid: {
    label: 'Atom–Light Hybrid Gyro',
    short: 'Hybrid',
    icon: '🧬',
    color: '#ffd23f',
    rate: 30,
    biasInstability: 2,
    noiseDensity: 0.008,
    correlationTime: 35, // s
    desc: 'Mid-bandwidth, mid-drift. Early-stage — rotation only, no linear acceleration sensing.',
    swap: { mass: 1, power: 22, volume: 1600, cost: 90 },
  },
  fusion: {
    label: 'Hybrid Fusion (MEMS + Cold-Atom)',
    short: 'Fusion',
    icon: '🔗',
    color: '#4ade80',
    rate: 200,
    biasInstability: 50,
    noiseDensity: 0.05,
    correlationTime: 15, // s — same underlying MEMS GM process as plain MEMS
    desc: 'MEMS for bandwidth, periodically corrected by a slow cold-atom reference — the paper\u2019s recommended path.',
    swap: { mass: 1, power: 60.5, volume: 9005, cost: 401 },
    isFusion: true,
    correctionInterval: 4,
    correctionStrength: 0.85,
  },
};

const SENSOR_ORDER = ['mems', 'coldatom', 'nv', 'hybrid', 'fusion'];
const STORAGE_KEY = 'qnav-sim-runs';

const toDeg = (rad) => {
  let deg = (rad * 180) / Math.PI;
  deg = ((deg + 180) % 360 + 360) % 360 - 180;
  return deg;
};

function stepSensorState(s, dt, windVec) {
  if (s.allWaypointsReached) return;

  const dx = s.targetX - s.truePos.x;
  const dy = s.targetY - s.truePos.y;
  const dz = s.targetZ - s.truePos.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (dist < 0.12) {
    s.trueRot.roll = s.targetRoll;
    s.trueRot.pitch = s.targetPitch;
    s.trueRot.yaw = s.targetYaw;

    if (s.waypointIndex < s.waypoints.length - 1) {
      // More legs remain: advance to the next waypoint, carrying current position
      // forward as the new leg's starting point. The drone does not stop or reset.
      s.waypointIndex += 1;
      setLegTarget(s, s.waypoints[s.waypointIndex], s.truePos);
    } else {
      s.reached = true;
      s.allWaypointsReached = true;
    }
    return;
  }

  const vx = (dx / dist) * s.speed + windVec.x;
  const vy = (dy / dist) * s.speed + windVec.y;
  const vz = (dz / dist) * s.speed + windVec.z;
  s.truePos.x += vx * dt;
  s.truePos.y += vy * dt;
  s.truePos.z += vz * dt;

  const travelYaw = Math.atan2(vx, vz);
  const travelPitch = Math.atan2(vy, Math.sqrt(vx * vx + vz * vz)) * 0.6;
  const travelRoll = Math.sin(s.t * 1.3) * 0.05;

  const approachStart = 0.25;
  const progress = s.initialDist > 0 ? 1 - dist / s.initialDist : 1;
  const blend = Math.max(0, Math.min(1, (progress - (1 - approachStart)) / approachStart));

  const shortestAngleLerp = (a, b, t) => {
    let diff = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    return a + diff * t;
  };

  s.trueRot.yaw = shortestAngleLerp(travelYaw, s.targetYaw, blend);
  s.trueRot.pitch = travelPitch * (1 - blend) + s.targetPitch * blend;
  s.trueRot.roll = travelRoll * (1 - blend) + s.targetRoll * blend;

  s.t += dt;

  // ---------------------------------------------------------------------
  // Stochastic error model: first-order Gauss-Markov (GM) bias process,
  // the standard model for "bias instability" in INS error analysis
  // (e.g. IEEE Std 952-1997; Groves, "Principles of GNSS, Inertial, and
  // Multisensor Integrated Navigation Systems", 2nd ed., Ch. 4; Brown &
  // Hwang, "Introduction to Random Signals and Applied Kalman Filtering",
  // Ch. 9). The continuous-time process is:
  //     db/dt = -b/Tc + w(t),   w ~ white noise
  // advanced via its EXACT discrete-time update (valid for any frame dt):
  //     b(k+1) = phi*b(k) + sqrt(1-phi^2)*zeta,   phi = exp(-dt/Tc)
  // using a UNIT steady-state standard deviation. This live process supplies
  // a genuine, continuously-running stochastic signal that gives the
  // displayed/charted drift its organic, non-monotonic fine structure.
  //
  // Critically, the AUTHORITATIVE error magnitude reported below is not this
  // single Monte-Carlo path directly (an unconstrained single realisation of
  // an integrated GM process can, by chance, end up arbitrarily larger or
  // smaller than typical — exactly the "sometimes too good, sometimes too
  // bad" problem identified during development). Instead, following standard
  // INS practice of reporting EXPECTED (1-sigma) error growth rather than one
  // arbitrary sample path, the live process is used only to derive a bounded
  // multiplicative wobble around the closed-form theoretical standard
  // deviation of the position/angle error, sigma(t):
  //     sigma(t)^2 = sigma_ss^2 * [t - 2Tc(1-e^(-t/Tc)) + (Tc/2)(1-e^(-2t/Tc))] + arw^2 * t
  // (the exact variance of the time-integral of a GM process, e.g. Maybeck
  // 1979 Vol.1 Ch.4, plus the independent angle/velocity-random-walk term).
  // The live GM path is normalised to its own theoretical unit-sigma_ss
  // envelope and clamped to [0.5, 1.6]x, so run-to-run variation is visible
  // and organic but can never invert the ranking between two sensors whose
  // theoretical sigma(t) differ by an order of magnitude or more.
  const closedFormSigma = (sigmaSS, Tc, arw, t) => {
    const tOverTc = t / Tc;
    const varGM = sigmaSS * sigmaSS * (t - 2 * Tc * (1 - Math.exp(-tOverTc)) + (Tc / 2) * (1 - Math.exp(-2 * tOverTc)));
    const varARW = arw * arw * t;
    return Math.sqrt(Math.max(0, varGM + varARW));
  };

  ['x', 'y', 'z'].forEach((ax) => {
    const gm = s.gmParamsPos;
    const phi = Math.exp(-dt / gm.Tc);
    const zeta = Math.random() + Math.random() + Math.random() - 1.5; // approx N(0, 0.25)
    s.gmBias[ax] = phi * s.gmBias[ax] + Math.sqrt(Math.max(0, 1 - phi * phi)) * (zeta / 0.5);
    s.gmIntegralUnit[ax] += s.gmBias[ax] * dt; // unit-sigma_ss running integral, for shape only

    // tEff is the elapsed time used for the envelope: equal to flight time for
    // ordinary sensors, but reset to count from the most recent fusion
    // correction for the Hybrid Fusion configuration, so the envelope (and
    // therefore the displayed error) actually shrinks at each correction
    // pulse instead of being governed purely by total elapsed flight time.
    const tEff = s.isFusion && s.correctionEpochT !== null ? Math.max(s.t - s.correctionEpochT, 1e-6) : Math.max(s.t, 1e-6);
    const sigmaNow = closedFormSigma(gm.sigmaSS, gm.Tc, gm.arw, tEff);
    const unitEnvelopeNow = closedFormSigma(1, gm.Tc, 0, tEff);
    const wobble = Math.max(-1.6, Math.min(1.6, s.gmIntegralUnit[ax] / Math.max(unitEnvelopeNow, 1e-9)));
    s.biasGM[ax] = wobble * sigmaNow;
  });
  ['roll', 'pitch', 'yaw'].forEach((ax) => {
    const gm = s.gmParamsAtt;
    const phi = Math.exp(-dt / gm.Tc);
    const zeta = Math.random() + Math.random() + Math.random() - 1.5;
    s.gmBias[ax] = phi * s.gmBias[ax] + Math.sqrt(Math.max(0, 1 - phi * phi)) * (zeta / 0.5);
    s.gmIntegralUnit[ax] += s.gmBias[ax] * dt;

    const tEff = s.isFusion && s.correctionEpochT !== null ? Math.max(s.t - s.correctionEpochT, 1e-6) : Math.max(s.t, 1e-6);
    const sigmaNow = closedFormSigma(gm.sigmaSS, gm.Tc, gm.arw, tEff);
    const unitEnvelopeNow = closedFormSigma(1, gm.Tc, 0, tEff);
    const wobble = Math.max(-1.6, Math.min(1.6, s.gmIntegralUnit[ax] / Math.max(unitEnvelopeNow, 1e-9)));
    s.biasGM[ax] = wobble * sigmaNow;
  });

  if (s.isFusion) {
    s.correctionAccum += dt;
    if (s.correctionAccum >= s.correctionInterval) {
      s.correctionAccum = 0;
      // A cold-atom reference correction resets the GM bias state and its
      // running integral — the whole point of fusion is periodically
      // re-zeroing accumulated drift using a near-drift-free external
      // reference, exactly as in a real measurement-update step of a Kalman
      // filter fusing an absolute reference into a propagated estimate.
      // correctionEpochT marks the new "zero point" the envelope re-grows
      // from, which is what actually makes the correction have a lasting
      // effect on displayed error (see tEff above) rather than being
      // overwritten by the next frame's envelope evaluation.
      ['x', 'y', 'z', 'roll', 'pitch', 'yaw'].forEach((ax) => {
        s.gmBias[ax] *= 1 - s.correctionStrength;
        s.gmIntegralUnit[ax] *= 1 - s.correctionStrength;
      });
      s.correctionEpochT = s.t;
    }
  }

  // The estimate is dead-reckoned forward every frame using the same velocity as
  // the true drone (an IMU integrates continuously even at a low sensor update
  // rate) plus the continuously-accumulated GM-derived and ARW bias error.
  // Only the instantaneous measurement-noise (quantization-equivalent) term is
  // gated by the sensor's actual sample rate — modelling real sensor dead-time
  // without freezing the whole position estimate between samples.
  s.sampleAccum += dt;
  if (s.sampleAccum >= s.sampleInterval) {
    s.sampleAccum -= s.sampleInterval;
    s.lastNoise = {
      x: (Math.random() - 0.5) * s.effNoise * 0.04,
      y: (Math.random() - 0.5) * s.effNoise * 0.04,
      z: (Math.random() - 0.5) * s.effNoise * 0.04,
      roll: (Math.random() - 0.5) * s.effNoise * 0.003,
      pitch: (Math.random() - 0.5) * s.effNoise * 0.003,
      yaw: (Math.random() - 0.5) * s.effNoise * 0.003,
    };
  }
  const noise = s.lastNoise;

  s.estPos.x = s.truePos.x + s.biasGM.x + noise.x;
  s.estPos.y = s.truePos.y + s.biasGM.y + noise.y;
  s.estPos.z = s.truePos.z + s.biasGM.z + noise.z;
  s.estRot.roll = s.trueRot.roll + s.biasGM.roll + noise.roll;
  s.estRot.pitch = s.trueRot.pitch + s.biasGM.pitch + noise.pitch;
  s.estRot.yaw = s.trueRot.yaw + s.biasGM.yaw + noise.yaw;
}

function getEffectiveMass(sensorKey, customMass) {
  const preset = PRESETS[sensorKey];
  return customMass[sensorKey] !== undefined ? customMass[sensorKey] : preset.swap.mass;
}

function getScale(sensorKey, scaleMap) {
  return scaleMap[sensorKey] !== undefined ? scaleMap[sensorKey] : 1;
}

// A heavier payload couples more vibration into the sensor and adds inertia the
// flight controller must fight, so we apply a mild noise penalty above the
// sensor's reference mass. This is illustrative, not a validated vibration model.
function massNoiseMultiplier(sensorKey, customMass) {
  const preset = PRESETS[sensorKey];
  const refMass = preset.swap.mass;
  const actualMass = getEffectiveMass(sensorKey, customMass);
  if (refMass <= 0) return 1;
  const ratio = actualMass / refMass;
  return Math.max(0.5, Math.min(3, 0.5 + 0.5 * ratio));
}

// Sets the in-flight target fields on a sensor state from a single waypoint object.
// Used both when a flight starts (first leg) and whenever a leg completes and the
// sensor advances to the next waypoint in a multi-waypoint route.
function setLegTarget(s, waypoint, fromPos) {
  s.targetX = waypoint.x;
  s.targetY = waypoint.z; // user-facing Z (height) -> internal Y
  s.targetZ = waypoint.y; // user-facing Y (depth) -> internal Z
  s.targetRoll = (waypoint.roll * Math.PI) / 180;
  s.targetPitch = (waypoint.pitch * Math.PI) / 180;
  s.targetYaw = (waypoint.yaw * Math.PI) / 180;
  s.initialDist = Math.sqrt(
    (waypoint.x - fromPos.x) ** 2 + (waypoint.z - fromPos.y) ** 2 + (waypoint.y - fromPos.z) ** 2
  );
  s.reached = false;
}

function makeSensorState(sensorKey, waypoints, biasScale, noiseScale, rateScale, customMass) {
  const preset = PRESETS[sensorKey];
  const massMult = massNoiseMultiplier(sensorKey, customMass || {});
  const effRate = Math.max(0.5, preset.rate * rateScale);
  const effBias = preset.biasInstability * biasScale * massMult;
  const effNoise = preset.noiseDensity * noiseScale * massMult;
  const Tc = preset.correlationTime;

  // Maps the simulation's relative severity scores (effBias, effNoise) onto the
  // physical parameters of a first-order Gauss-Markov process: steady-state
  // standard deviation sigmaSS (the saturation level of the bias itself) and
  // the angle/velocity random-walk intensity arw. The scaling constants below
  // were chosen so that, combined with each preset's correlationTime, a 60 s
  // demonstration flight reproduces the qualitative drift magnitudes reported
  // in the methodology document (MEMS ~0.5-1 m, cold-atom ~mm-scale).
  const gmParamsPos = { sigmaSS: effBias * 0.0026, Tc, arw: effBias * 0.00028 };
  const gmParamsAtt = { sigmaSS: effBias * 0.000045, Tc, arw: effBias * 0.0000085 };

  const startPos = { x: 0, y: 1.5, z: 0 };
  const s = {
    key: sensorKey,
    t: 0,
    truePos: { ...startPos },
    estPos: { ...startPos },
    trueRot: { roll: 0, pitch: 0, yaw: 0 },
    estRot: { roll: 0, pitch: 0, yaw: 0 },
    // gmBias: the live unit-sigma_ss Gauss-Markov STATE, advanced via its exact
    // discrete-time update each frame, used only to derive the bounded "wobble"
    // multiplier (see stepSensorState). gmIntegralUnit: the running time-integral
    // of gmBias at unit sigma_ss, used to normalise that wobble against its own
    // theoretical envelope. biasGM: the actual displayed/charted/logged
    // position-or-angle error, i.e. wobble * closed-form theoretical sigma(t).
    gmBias: { x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0 },
    gmIntegralUnit: { x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0 },
    biasGM: { x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0 },
    lastNoise: { x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0 },
    gmParamsPos, gmParamsAtt,
    effRate, effBias, effNoise,
    sampleAccum: 0,
    sampleInterval: 1 / effRate,
    speed: 1.8,
    waypoints,
    waypointIndex: 0,
    allWaypointsReached: false,
    reached: false,
    isFusion: !!preset.isFusion,
    correctionAccum: 0,
    correctionInterval: preset.correctionInterval || 0,
    correctionStrength: preset.correctionStrength || 0,
    correctionEpochT: null,
    history: [],
  };
  setLegTarget(s, waypoints[0], startPos);
  return s;
}

function axisErrorOf(s) {
  return {
    x: s.estPos.x - s.truePos.x,
    y: s.estPos.y - s.truePos.y,
    z: s.estPos.z - s.truePos.z,
    roll: toDeg(s.estRot.roll - s.trueRot.roll),
    pitch: toDeg(s.estRot.pitch - s.trueRot.pitch),
    yaw: toDeg(s.estRot.yaw - s.trueRot.yaw),
  };
}

export default function QuantumNavSim() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const animRef = useRef(null);

  const [mode, setMode] = useState('solo');
  const [sensor, setSensor] = useState('mems');
  const [overlaySensors, setOverlaySensors] = useState(['mems', 'coldatom']);
  const [biasScales, setBiasScales] = useState({});   // { sensorKey: scale }, default 1 if absent
  const [noiseScales, setNoiseScales] = useState({});
  const [rateScales, setRateScales] = useState({});
  const [windEnabled, setWindEnabled] = useState(false);
  const [windStrength, setWindStrength] = useState(0.3);
  const [customMass, setCustomMass] = useState({}); // { sensorKey: massInKg } user overrides
  const [waypoints, setWaypoints] = useState([{ x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0 }]);
  const [editingWaypoint, setEditingWaypoint] = useState(0);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [driftAxes, setDriftAxes] = useState({ x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0, total: 0 });
  const [done, setDone] = useState(false);
  const [history, setHistory] = useState([]);
  const [chartData, setChartData] = useState({});
  const [lastResult, setLastResult] = useState(null);

  const simState = useRef(null);
  const overlayStateRef = useRef({});
  const loggedRef = useRef(false);
  const windRef = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0e14');
    scene.fog = new THREE.Fog('#0a0e14', 35, 90);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 13, 16);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const gridHelper = new THREE.GridHelper(40, 40, '#1c2433', '#161b26');
    scene.add(gridHelper);

    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshBasicMaterial({ color: '#0a0e14', transparent: true, opacity: 0.6 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    scene.add(floor);

    scene.add(new THREE.AmbientLight('#3a4a66', 1.2));
    const dirLight = new THREE.DirectionalLight('#cfe6ff', 0.8);
    dirLight.position.set(5, 12, 6);
    scene.add(dirLight);

    const padGeo = new THREE.RingGeometry(0.5, 0.65, 32);
    const padMat = new THREE.MeshBasicMaterial({ color: '#3a4a66', side: THREE.DoubleSide });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.02;
    scene.add(pad);

    // Pool of waypoint markers (built once, reused/repositioned as the waypoint
    // list changes) — each has a floor ring, an altitude stem, and a numbered
    // beacon sphere. A dashed white route line connects them in flight order,
    // representing the *planned* path (distinct from the green actual flight path).
    const MAX_WAYPOINTS = 6;
    const waypointMarkers = [];
    for (let i = 0; i < MAX_WAYPOINTS; i++) {
      const group = new THREE.Group();
      const ringMat = new THREE.MeshBasicMaterial({ color: '#e8edf5', side: THREE.DoubleSide });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.68, 32), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;
      group.add(ring);

      const stem = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineDashedMaterial({ color: '#e8edf5', dashSize: 0.15, gapSize: 0.1 }),
      );
      group.add(stem);

      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 16),
        new THREE.MeshStandardMaterial({ color: '#e8edf5', emissive: '#e8edf5', emissiveIntensity: 0.4 }),
      );
      group.add(beacon);

      group.visible = false;
      scene.add(group);
      waypointMarkers.push({ group, ring, stem, beacon });
    }

    const routeLine = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineDashedMaterial({ color: '#e8edf5', dashSize: 0.2, gapSize: 0.15 }),
    );
    routeLine.frustumCulled = false;
    scene.add(routeLine);

    const TRUE_PATH_COLOR = '#4ade80'; // universal green for the actual flown path, regardless of sensor

    const buildDronePair = (sensorColor) => {
      // True drone: always green. There is only one real physics here regardless
      // of which sensor is "watching" it, so the actual flight path reads as one
      // consistent color across every sensor and every comparison.
      const droneGroup = new THREE.Group();
      const bodyGeo = new THREE.OctahedronGeometry(0.26, 0);
      const bodyMat = new THREE.MeshStandardMaterial({ color: TRUE_PATH_COLOR, emissive: TRUE_PATH_COLOR, emissiveIntensity: 0.45 });
      droneGroup.add(new THREE.Mesh(bodyGeo, bodyMat));
      [[0.38, 0, 0.38], [-0.38, 0, 0.38], [0.38, 0, -0.38], [-0.38, 0, -0.38]].forEach(([x, y, z]) => {
        const arm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.028, 0.028, 0.46, 6),
          new THREE.MeshStandardMaterial({ color: TRUE_PATH_COLOR }),
        );
        arm.position.set(x, y, z);
        arm.rotation.x = Math.PI / 2;
        droneGroup.add(arm);
      });
      droneGroup.position.y = 0.4;
      scene.add(droneGroup);

      // Ghost (drift estimate) uses the sensor's own menu color, solid and fully
      // opaque — so each sensor's predicted/drifted path is immediately identifiable
      // and stays visually distinct from every other sensor when comparing several.
      const ghost = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.2, 0),
        new THREE.MeshStandardMaterial({ color: sensorColor, emissive: sensorColor, emissiveIntensity: 0.5 }),
      );
      ghost.position.y = 0.4;
      scene.add(ghost);

      const trueLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: TRUE_PATH_COLOR, linewidth: 2 }));
      trueLine.frustumCulled = false;
      scene.add(trueLine);

      const driftLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: sensorColor, linewidth: 2 }));
      driftLine.frustumCulled = false;
      scene.add(driftLine);

      const trueAltLine = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: TRUE_PATH_COLOR, transparent: true, opacity: 0.35 }),
      );
      trueAltLine.frustumCulled = false;
      scene.add(trueAltLine);

      const ghostAltLine = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: sensorColor, transparent: true, opacity: 0.35 }),
      );
      ghostAltLine.frustumCulled = false;
      scene.add(ghostAltLine);

      // Trail dots: small spheres dropped periodically along each path. WebGL's
      // LineBasicMaterial.linewidth is silently ignored on almost all modern
      // GPUs/browsers (a long-standing Three.js limitation), so a thin Line can
      // be nearly invisible regardless of the frustumCulled fix above. These
      // dot trails are the reliable, GPU-independent way to make the flown
      // path visible. Pre-allocate a pool and reuse via a single Group.
      const trueTrailGroup = new THREE.Group();
      const driftTrailGroup = new THREE.Group();
      scene.add(trueTrailGroup);
      scene.add(driftTrailGroup);
      const trueDotGeo = new THREE.SphereGeometry(0.045, 6, 6);
      const driftDotGeo = new THREE.SphereGeometry(0.04, 6, 6);
      const trueDotMat = new THREE.MeshBasicMaterial({ color: TRUE_PATH_COLOR });
      const driftDotMat = new THREE.MeshBasicMaterial({ color: sensorColor });

      return {
        droneGroup, ghost, trueLine, driftLine, trueAltLine, ghostAltLine,
        truePoints: [], driftPoints: [],
        trueTrailGroup, driftTrailGroup, trueDotGeo, driftDotGeo, trueDotMat, driftDotMat,
        trailFrameCount: 0,
      };
    };

    const rigs = {};
    SENSOR_ORDER.forEach((key) => { rigs[key] = buildDronePair(PRESETS[key].color); });

    const setRigVisible = (key, visible) => {
      const r = rigs[key];
      if (!r) return;
      r.droneGroup.visible = visible;
      r.ghost.visible = visible;
      r.trueLine.visible = visible;
      r.driftLine.visible = visible;
      r.trueAltLine.visible = visible;
      r.ghostAltLine.visible = visible;
      r.trueTrailGroup.visible = visible;
      r.driftTrailGroup.visible = visible;
    };
    SENSOR_ORDER.forEach((key) => setRigVisible(key, false));

    sceneRef.current = { scene, camera, renderer, rigs, setRigVisible, waypointMarkers, routeLine };

    const camRig = {
      target: new THREE.Vector3(0, 1, 0),
      radius: camera.position.distanceTo(new THREE.Vector3(0, 1, 0)),
      theta: Math.atan2(camera.position.x, camera.position.z),
      phi: Math.acos(13 / Math.sqrt(13 * 13 + 16 * 16)),
    };

    const applyCamRig = () => {
      const sinPhi = Math.sin(camRig.phi);
      camera.position.x = camRig.target.x + camRig.radius * sinPhi * Math.sin(camRig.theta);
      camera.position.y = camRig.target.y + camRig.radius * Math.cos(camRig.phi);
      camera.position.z = camRig.target.z + camRig.radius * sinPhi * Math.cos(camRig.theta);
      camera.lookAt(camRig.target);
    };
    applyCamRig();

    let isDragging = false;
    let isPanning = false;
    let lastX = 0, lastY = 0;

    const onPointerDown = (e) => {
      isDragging = true;
      isPanning = e.button === 2 || e.shiftKey;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      if (isPanning) {
        const panSpeed = camRig.radius * 0.0015;
        const right = new THREE.Vector3();
        camera.getWorldDirection(right);
        right.cross(camera.up).normalize();
        camRig.target.addScaledVector(right, -dx * panSpeed);
        camRig.target.addScaledVector(camera.up, dy * panSpeed);
      } else {
        camRig.theta -= dx * 0.0055;
        camRig.phi -= dy * 0.0055;
        camRig.phi = Math.max(0.12, Math.min(Math.PI / 2 - 0.02, camRig.phi));
      }
      applyCamRig();
    };
    const onPointerUp = () => { isDragging = false; };
    const onWheel = (e) => {
      e.preventDefault();
      const zoomFactor = Math.exp(e.deltaY * 0.001);
      camRig.radius = Math.max(4, Math.min(45, camRig.radius * zoomFactor));
      applyCamRig();
    };
    const onContextMenu = (e) => e.preventDefault();

    let touchMode = null;
    let lastPinchDist = 0;
    let lastTouchMidX = 0, lastTouchMidY = 0;
    const touchDist = (t0, t1) => Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
    const touchMid = (t0, t1) => ({ x: (t0.clientX + t1.clientX) / 2, y: (t0.clientY + t1.clientY) / 2 });

    const onTouchStart = (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        touchMode = 'orbit';
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        touchMode = 'pinch';
        lastPinchDist = touchDist(e.touches[0], e.touches[1]);
        const mid = touchMid(e.touches[0], e.touches[1]);
        lastTouchMidX = mid.x;
        lastTouchMidY = mid.y;
      }
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      if (touchMode === 'orbit' && e.touches.length === 1) {
        const dx = e.touches[0].clientX - lastX;
        const dy = e.touches[0].clientY - lastY;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        camRig.theta -= dx * 0.0055;
        camRig.phi -= dy * 0.0055;
        camRig.phi = Math.max(0.12, Math.min(Math.PI / 2 - 0.02, camRig.phi));
        applyCamRig();
      } else if (touchMode === 'pinch' && e.touches.length === 2) {
        const dist = touchDist(e.touches[0], e.touches[1]);
        const mid = touchMid(e.touches[0], e.touches[1]);
        const zoomFactor = lastPinchDist / Math.max(1, dist);
        camRig.radius = Math.max(4, Math.min(45, camRig.radius * zoomFactor));
        lastPinchDist = dist;
        const panSpeed = camRig.radius * 0.0018;
        const right = new THREE.Vector3();
        camera.getWorldDirection(right);
        right.cross(camera.up).normalize();
        camRig.target.addScaledVector(right, -(mid.x - lastTouchMidX) * panSpeed);
        camRig.target.addScaledVector(camera.up, (mid.y - lastTouchMidY) * panSpeed);
        lastTouchMidX = mid.x;
        lastTouchMidY = mid.y;
        applyCamRig();
      }
    };
    const onTouchEnd = (e) => {
      if (e.touches.length === 0) touchMode = null;
      else if (e.touches.length === 1) {
        touchMode = 'orbit';
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    };

    const dom = renderer.domElement;
    dom.style.cursor = 'grab';
    dom.style.touchAction = 'none';
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('contextmenu', onContextMenu);
    dom.addEventListener('touchstart', onTouchStart, { passive: false });
    dom.addEventListener('touchmove', onTouchMove, { passive: false });
    dom.addEventListener('touchend', onTouchEnd, { passive: true });

    sceneRef.current.camRig = camRig;
    sceneRef.current.resetCamera = () => {
      camRig.target.set(0, 1, 0);
      camRig.radius = 20;
      camRig.theta = Math.atan2(0, 16);
      camRig.phi = Math.acos(13 / Math.sqrt(13 * 13 + 16 * 16));
      applyCamRig();
    };

    const handleResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const renderLoop = () => {
      renderer.render(scene, camera);
      requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('contextmenu', onContextMenu);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { waypointMarkers, routeLine } = sceneRef.current;

    waypointMarkers.forEach((marker, i) => {
      if (i >= waypoints.length) {
        marker.group.visible = false;
        return;
      }
      const wp = waypoints[i];
      marker.group.visible = true;
      marker.group.position.set(wp.x, 0, wp.y);
      marker.ring.position.y = 0.02;
      marker.beacon.position.y = wp.z;
      marker.stem.geometry.setFromPoints([new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(0, wp.z, 0)]);
      marker.stem.computeLineDistances();
    });

    // Route line: drone start (origin, at cruise altitude) through every waypoint in order.
    const routePoints = [new THREE.Vector3(0, 1.5, 0)];
    waypoints.forEach((wp) => routePoints.push(new THREE.Vector3(wp.x, wp.z, wp.y)));
    routeLine.geometry.setFromPoints(routePoints);
    routeLine.computeLineDistances();
  }, [waypoints]);

  useEffect(() => {
    if (editingWaypoint >= waypoints.length) {
      setEditingWaypoint(Math.max(0, waypoints.length - 1));
    }
  }, [waypoints, editingWaypoint]);

  const activeKeys = mode === 'overlay' ? overlaySensors : [sensor];

  const startSim = useCallback(() => {
    const sc = sceneRef.current;
    if (sc) SENSOR_ORDER.forEach((key) => sc.setRigVisible(key, activeKeys.includes(key)));

    if (mode === 'overlay') {
      const states = {};
      overlaySensors.forEach((key) => {
        states[key] = makeSensorState(
          key, waypoints,
          getScale(key, biasScales), getScale(key, noiseScales), getScale(key, rateScales),
          customMass,
        );
      });
      overlayStateRef.current = states;
    } else {
      simState.current = makeSensorState(
        sensor, waypoints,
        getScale(sensor, biasScales), getScale(sensor, noiseScales), getScale(sensor, rateScales),
        customMass,
      );
    }

    windRef.current = windEnabled
      ? { x: (Math.random() - 0.5) * windStrength, y: (Math.random() - 0.5) * windStrength * 0.3, z: (Math.random() - 0.5) * windStrength }
      : { x: 0, y: 0, z: 0 };

    if (sc) {
      SENSOR_ORDER.forEach((key) => {
        const rig = sc.rigs[key];
        rig.truePoints = [];
        rig.driftPoints = [];
        rig.trailFrameCount = 0;
        // Remove (and let GC reclaim) all dots from the previous run — meshes
        // share geometry/material across the rig so only the Mesh wrapper
        // itself needs to be dropped, not disposed.
        rig.trueTrailGroup.clear();
        rig.driftTrailGroup.clear();
      });
    }
    loggedRef.current = false;
    setElapsed(0);
    setDriftAxes({ x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0, total: 0 });
    setChartData({});
    setDone(false);
    setLastResult(null);
    setRunning(true);
  }, [mode, sensor, overlaySensors, biasScales, noiseScales, rateScales, waypoints, windEnabled, windStrength, activeKeys, customMass]);

  const stopSim = useCallback(() => {
    setRunning(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  useEffect(() => {
    if (!running) return;
    let lastTime = performance.now();
    let chartSampleAccum = 0;

    const step = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const sc = sceneRef.current;
      const wind = windRef.current;

      chartSampleAccum += dt;
      const takeChartSample = chartSampleAccum >= 0.15;
      if (takeChartSample) chartSampleAccum = 0;

      const updateRig = (s) => {
        const rig = sc?.rigs[s.key];
        if (!rig) return;
        rig.droneGroup.position.set(s.truePos.x, s.truePos.y, s.truePos.z);
        rig.droneGroup.rotation.set(s.trueRot.pitch, s.trueRot.yaw, s.trueRot.roll);
        rig.ghost.position.set(s.estPos.x, s.estPos.y, s.estPos.z);
        rig.ghost.rotation.set(s.estRot.pitch, s.estRot.yaw, s.estRot.roll);
        rig.truePoints.push(new THREE.Vector3(s.truePos.x, s.truePos.y, s.truePos.z));
        rig.driftPoints.push(new THREE.Vector3(s.estPos.x, s.estPos.y, s.estPos.z));
        rig.trueLine.geometry.setFromPoints(rig.truePoints);
        rig.driftLine.geometry.setFromPoints(rig.driftPoints);

        // Drop a trail dot every 4th frame (~15/sec at 60fps) — dense enough to
        // read as a continuous trail, sparse enough to stay cheap to render even
        // on long flights. These are the reliably-visible path indicator; the
        // Line objects above are kept as a thin backup but cannot be relied on
        // alone since WebGL frequently ignores LineBasicMaterial.linewidth.
        rig.trailFrameCount += 1;
        if (rig.trailFrameCount % 4 === 0) {
          const trueDot = new THREE.Mesh(rig.trueDotGeo, rig.trueDotMat);
          trueDot.position.set(s.truePos.x, s.truePos.y, s.truePos.z);
          rig.trueTrailGroup.add(trueDot);

          const driftDot = new THREE.Mesh(rig.driftDotGeo, rig.driftDotMat);
          driftDot.position.set(s.estPos.x, s.estPos.y, s.estPos.z);
          rig.driftTrailGroup.add(driftDot);
        }

        rig.trueAltLine.geometry.setFromPoints([
          new THREE.Vector3(s.truePos.x, s.truePos.y, s.truePos.z),
          new THREE.Vector3(s.truePos.x, 0.02, s.truePos.z),
        ]);
        rig.ghostAltLine.geometry.setFromPoints([
          new THREE.Vector3(s.estPos.x, s.estPos.y, s.estPos.z),
          new THREE.Vector3(s.estPos.x, 0.02, s.estPos.z),
        ]);
      };

      if (mode === 'overlay') {
        const states = overlayStateRef.current;
        let anyRunning = false;
        const newChartPoints = {};

        Object.values(states).forEach((s) => {
          if (!s.allWaypointsReached) anyRunning = true;
          stepSensorState(s, dt, wind);
          updateRig(s);

          if (takeChartSample) {
            const err = axisErrorOf(s);
            const total = Math.sqrt(err.x ** 2 + err.y ** 2 + err.z ** 2);
            s.history.push({ t: s.t, err: total });
            newChartPoints[s.key] = s.history;
          }
        });

        setElapsed(Math.max(...Object.values(states).map((s) => s.t), 0));
        if (takeChartSample) setChartData((prev) => ({ ...prev, ...newChartPoints }));

        if (!anyRunning) {
          setRunning(false);
          setDone(true);
          return;
        }
      } else {
        const s = simState.current;
        if (!s || s.allWaypointsReached) return;
        stepSensorState(s, dt, wind);
        updateRig(s);

        const axisErr = axisErrorOf(s);
        const total = Math.sqrt(axisErr.x ** 2 + axisErr.y ** 2 + axisErr.z ** 2);
        setDriftAxes({ ...axisErr, total });
        setElapsed(s.t);

        if (takeChartSample) {
          s.history.push({ t: s.t, err: total });
          setChartData((prev) => ({ ...prev, [sensor]: s.history }));
        }

        if (s.allWaypointsReached) {
          setRunning(false);
          setDone(true);
          return;
        }
      }

      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [running, mode, sensor]);

  useEffect(() => {
    if (!done || loggedRef.current) return;
    loggedRef.current = true;

    if (mode === 'overlay') {
      const states = overlayStateRef.current;
      const entries = Object.values(states).map((s) => {
        const err = axisErrorOf(s);
        const totalPos = Math.sqrt(err.x ** 2 + err.y ** 2 + err.z ** 2);
        return {
          id: Date.now() + Math.random(),
          sensor: PRESETS[s.key].label,
          color: PRESETS[s.key].color,
          time: s.t.toFixed(1),
          totalPos: totalPos.toFixed(2),
          x: err.x.toFixed(2), y: err.y.toFixed(2), z: err.z.toFixed(2),
          roll: err.roll.toFixed(2), pitch: err.pitch.toFixed(2), yaw: err.yaw.toFixed(2),
        };
      });
      setHistory((h) => [...entries, ...h].slice(0, 12));
      entries.forEach(saveRun);
      setLastResult({ mode: 'overlay', entries });
    } else {
      const s = simState.current;
      const err = axisErrorOf(s);
      const totalPos = Math.sqrt(err.x ** 2 + err.y ** 2 + err.z ** 2);
      const entry = {
        id: Date.now(),
        sensor: PRESETS[sensor].label,
        color: PRESETS[sensor].color,
        time: s.t.toFixed(1),
        totalPos: totalPos.toFixed(2),
        x: err.x.toFixed(2), y: err.y.toFixed(2), z: err.z.toFixed(2),
        roll: err.roll.toFixed(2), pitch: err.pitch.toFixed(2), yaw: err.yaw.toFixed(2),
      };
      setHistory((h) => [entry, ...h].slice(0, 12));
      saveRun(entry);
      setLastResult({ mode: 'solo', entries: [entry] });
    }
  }, [done, mode, sensor]);

  const saveRun = async (entry) => {
    try {
      const existing = await window.storage?.get(STORAGE_KEY).catch(() => null);
      const list = existing ? JSON.parse(existing.value) : [];
      list.unshift(entry);
      await window.storage?.set(STORAGE_KEY, JSON.stringify(list.slice(0, 40)));
    } catch (e) { /* storage optional, ignore failures */ }
  };

  const copyResults = useCallback(() => {
    if (!lastResult) return;
    const lines = lastResult.entries.map((e) =>
      `${e.sensor}: ${e.time}s flight, total drift ${e.totalPos}m ` +
      `(X ${e.x}m, Y ${e.z}m, Height ${e.y}m, Roll ${e.roll}\u00b0, Pitch ${e.pitch}\u00b0, Yaw ${e.yaw}\u00b0)`
    );
    const routeLines = waypoints.map((wp, i) =>
      `  ${i + 1}. X=${wp.x}m, Y=${wp.y}m, Z=${wp.z}m | Roll=${wp.roll}\u00b0 Pitch=${wp.pitch}\u00b0 Yaw=${wp.yaw}\u00b0`
    );
    const text = `Quantum vs Classical Inertial Navigation \u2014 Drift Comparison\n` +
      `Route (${waypoints.length} waypoint${waypoints.length > 1 ? 's' : ''}):\n${routeLines.join('\n')}\n\n` +
      lines.join('\n');
    navigator.clipboard?.writeText(text).catch(() => {});
  }, [lastResult, waypoints]);

  const toggleOverlaySensor = (key) => {
    setOverlaySensors((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key].slice(-4)));
  };

  const preset = PRESETS[sensor];
  const chartSeries = useMemo(() => {
    const keys = mode === 'overlay' ? overlaySensors : [sensor];
    return keys.map((key) => ({ key, color: PRESETS[key].color, points: chartData[key] || [] }));
  }, [chartData, mode, overlaySensors, sensor]);

  return (
    <div style={styles.page}>
      <style>{`
        * { box-sizing: border-box; }
        input[type=range] {
          -webkit-appearance: none; width: 100%; height: 4px;
          background: #2a3344; border-radius: 2px; outline: none;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
          background: var(--accent); cursor: pointer; box-shadow: 0 0 8px var(--accent);
        }
        input[type=range]::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 50%; border: none;
          background: var(--accent); cursor: pointer;
        }
        @media (max-width: 860px) {
          .qnav-layout { grid-template-columns: 1fr !important; }
          .qnav-viewport { height: 360px !important; }
        }
        @media (max-width: 480px) {
          .qnav-cam-hint { display: none; }
        }
      `}</style>

      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>GNSS-DENIED NAVIGATION · INTERACTIVE COMPARISON</div>
          <h1 style={styles.title}>Drift Under Test</h1>
        </div>
        <div style={styles.headerSub}>Send a drone to a waypoint with no GPS. Watch dead-reckoning error accumulate in real time, sensor by sensor.</div>
      </header>

      <div style={styles.modeToggle}>
        <button onClick={() => !running && setMode('solo')} style={{ ...styles.modeBtn, ...(mode === 'solo' ? styles.modeBtnActive : {}) }} disabled={running}>
          Single sensor
        </button>
        <button onClick={() => !running && setMode('overlay')} style={{ ...styles.modeBtn, ...(mode === 'overlay' ? styles.modeBtnActive : {}) }} disabled={running}>
          Compare side by side
        </button>
      </div>

      <div className="qnav-layout" style={styles.layout}>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>{mode === 'overlay' ? 'Sensors to compare (up to 4)' : 'Sensor'}</div>
          <div style={styles.sensorGrid}>
            {SENSOR_ORDER.map((key) => {
              const p = PRESETS[key];
              const isActive = mode === 'overlay' ? overlaySensors.includes(key) : sensor === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (running) return;
                    if (mode === 'overlay') toggleOverlaySensor(key);
                    else setSensor(key);
                  }}
                  disabled={running}
                  style={{
                    ...styles.sensorBtn,
                    borderColor: isActive ? p.color : '#2a3344',
                    background: isActive ? `${p.color}14` : 'transparent',
                    opacity: running ? 0.5 : 1,
                    cursor: running ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{p.icon}</span>
                  <span style={{ fontSize: 11.5, color: isActive ? p.color : '#8a94a6', fontWeight: 600, textAlign: 'center' }}>{p.short}</span>
                </button>
              );
            })}
          </div>
          {mode === 'solo' && <p style={{ ...styles.descText, color: preset.color }}>{preset.desc}</p>}
          {mode === 'overlay' && overlaySensors.length === 0 && <p style={styles.descText}>Pick at least one sensor to compare.</p>}

          <div style={styles.massHeader}>
            <span style={{ ...styles.panelLabel, marginTop: 22, marginBottom: 0 }}>Payload mass</span>
            {Object.keys(customMass).length > 0 && (
              <button onClick={() => setCustomMass({})} disabled={running} style={styles.resetMassBtn} title="Reset all masses to defaults">
                ↺ Reset
              </button>
            )}
          </div>
          <div style={styles.massGrid}>
            {activeKeys.map((key) => (
              <MassInput
                key={key}
                preset={PRESETS[key]}
                mass={getEffectiveMass(key, customMass)}
                disabled={running}
                onChange={(v) => setCustomMass((prev) => ({ ...prev, [key]: v }))}
              />
            ))}
          </div>
          <p style={styles.massHint}>Heavier payloads couple more vibration into the sensor, mildly increasing drift noise.</p>

          <div style={{ ...styles.panelLabel, marginTop: 22 }}>Tune parameters</div>
          <p style={styles.tuneHint}>Relative severity scores, not calibrated physical units — 1.00× is each sensor's default behavior from the paper's qualitative comparison.</p>
          {activeKeys.map((key) => {
            const p = PRESETS[key];
            const bScale = getScale(key, biasScales);
            const nScale = getScale(key, noiseScales);
            const rScale = getScale(key, rateScales);
            return (
              <div key={key} style={styles.tuneGroup}>
                {mode === 'overlay' && (
                  <div style={{ ...styles.tuneGroupLabel, color: p.color }}>{p.icon} {p.short}</div>
                )}
                <Slider
                  label="Bias instability (severity score)" value={bScale} disabled={running} accent={p.color}
                  setValue={(v) => setBiasScales((m) => ({ ...m, [key]: v }))}
                  min={0.05} max={20} step={0.05} unit={`${bScale.toFixed(2)}× default`}
                />
                <Slider
                  label="Process noise (severity score)" value={nScale} disabled={running} accent={p.color}
                  setValue={(v) => setNoiseScales((m) => ({ ...m, [key]: v }))}
                  min={0.05} max={20} step={0.05} unit={`${nScale.toFixed(2)}× default`}
                />
                <Slider
                  label="Sample rate" value={rScale} disabled={running} accent={p.color}
                  setValue={(v) => setRateScales((m) => ({ ...m, [key]: v }))}
                  min={0.1} max={5} step={0.1} unit={`${(p.rate * rScale).toFixed(1)} Hz`}
                />
              </div>
            );
          })}

          <div style={{ ...styles.panelLabel, marginTop: 22 }}>Environment</div>
          <div style={styles.windRow}>
            <label style={styles.windToggleLabel}>
              <input type="checkbox" checked={windEnabled} disabled={running} onChange={(e) => setWindEnabled(e.target.checked)} style={styles.checkbox} />
              Wind gusts
            </label>
          </div>
          {windEnabled && (
            <Slider label="Gust strength" value={windStrength} setValue={setWindStrength} min={0.05} max={1} step={0.05} accent="#5ec8ff" disabled={running} unit={`${windStrength.toFixed(2)} m/s`} />
          )}

          <div style={{ ...styles.panelLabel, marginTop: 18 }}>Route ({waypoints.length} waypoint{waypoints.length > 1 ? 's' : ''})</div>
          <div style={styles.waypointTabs}>
            {waypoints.map((wp, i) => (
              <button
                key={i}
                onClick={() => !running && setEditingWaypoint(i)}
                disabled={running}
                style={{
                  ...styles.waypointTab,
                  ...(editingWaypoint === i ? styles.waypointTabActive : {}),
                }}
              >
                {i + 1}
              </button>
            ))}
            {waypoints.length < 6 && (
              <button
                onClick={() => {
                  if (running) return;
                  const last = waypoints[waypoints.length - 1];
                  setWaypoints((wps) => [...wps, { ...last, x: last.x + 2 }]);
                  setEditingWaypoint(waypoints.length);
                }}
                disabled={running}
                style={styles.waypointAddBtn}
                title="Add another waypoint"
              >
                + Add
              </button>
            )}
            {waypoints.length > 1 && (
              <button
                onClick={() => {
                  if (running) return;
                  setWaypoints((wps) => wps.filter((_, i) => i !== editingWaypoint));
                  setEditingWaypoint((i) => Math.max(0, i - 1));
                }}
                disabled={running}
                style={styles.waypointRemoveBtn}
                title="Remove this waypoint"
              >
                ✕ Remove
              </button>
            )}
          </div>

          <div style={{ ...styles.panelLabel, marginTop: 14 }}>Waypoint {editingWaypoint + 1} position</div>
          <div style={styles.coordRow}>
            <CoordInput label="X (m)" value={waypoints[editingWaypoint].x} disabled={running}
              onChange={(v) => setWaypoints((wps) => wps.map((w, i) => (i === editingWaypoint ? { ...w, x: v } : w)))} />
            <CoordInput label="Y (m)" value={waypoints[editingWaypoint].y} disabled={running}
              onChange={(v) => setWaypoints((wps) => wps.map((w, i) => (i === editingWaypoint ? { ...w, y: v } : w)))} />
            <CoordInput label="Height Z (m)" value={waypoints[editingWaypoint].z} disabled={running} min={0.5}
              onChange={(v) => setWaypoints((wps) => wps.map((w, i) => (i === editingWaypoint ? { ...w, z: v } : w)))}
              onCommit={(v) => setWaypoints((wps) => wps.map((w, i) => (i === editingWaypoint ? { ...w, z: Math.max(0.5, v) } : w)))} />
          </div>

          <div style={{ ...styles.panelLabel, marginTop: 16 }}>Waypoint {editingWaypoint + 1} heading</div>
          <div style={styles.coordRow}>
            <CoordInput label="Roll (°)" value={waypoints[editingWaypoint].roll} disabled={running}
              onChange={(v) => setWaypoints((wps) => wps.map((w, i) => (i === editingWaypoint ? { ...w, roll: v } : w)))} />
            <CoordInput label="Pitch (°)" value={waypoints[editingWaypoint].pitch} disabled={running}
              onChange={(v) => setWaypoints((wps) => wps.map((w, i) => (i === editingWaypoint ? { ...w, pitch: v } : w)))} />
            <CoordInput label="Yaw (°)" value={waypoints[editingWaypoint].yaw} disabled={running}
              onChange={(v) => setWaypoints((wps) => wps.map((w, i) => (i === editingWaypoint ? { ...w, yaw: v } : w)))} />
          </div>

          <div style={styles.btnRow}>
            {!running ? (
              <button
                onClick={startSim}
                disabled={mode === 'overlay' && overlaySensors.length === 0}
                style={{ ...styles.primaryBtn, background: mode === 'overlay' ? '#4ade80' : preset.color, opacity: mode === 'overlay' && overlaySensors.length === 0 ? 0.4 : 1 }}
              >
                {done ? 'Run again' : 'Launch drone'}
              </button>
            ) : (
              <button onClick={stopSim} style={styles.stopBtn}>Abort</button>
            )}
          </div>
        </div>

        <div style={styles.centerCol}>
          <div style={styles.viewportWrap}>
            <div className="qnav-viewport" ref={mountRef} style={styles.viewport} />

            <div className="qnav-hud-top" style={styles.hudTop}>
              <div style={styles.hudRow}>
                <HudStat label="Mission time" value={`${elapsed.toFixed(1)}s`} />
                {mode === 'solo' ? (
                  <HudStat label="Position error" value={`${driftAxes.total.toFixed(2)} m`} accent="#ff5a36" />
                ) : (
                  <HudStat label="Sensors running" value={`${overlaySensors.length}`} />
                )}
                <HudStat label="Status" value={done ? 'Arrived' : running ? 'En route' : 'Standby'} accent={done ? '#4ade80' : undefined} />
              </div>
              <div className="qnav-cam-hint" style={styles.camHint}>
                Drag to orbit · Pinch or scroll to zoom · Two-finger drag or shift-drag to pan
              </div>
            </div>

            <div className="qnav-hud-bottom" style={styles.hudBottom}>
              <div style={styles.legend}>
                <LegendItem color="#e8edf5" label="White = planned route" dashed />
                <LegendItem color="#4ade80" label="Green = actual flight path" />
                <span style={styles.legendNote}>Each sensor's predicted path uses its own color from the menu</span>
              </div>
              <button onClick={() => sceneRef.current?.resetCamera?.()} style={styles.resetViewBtn} title="Reset camera to default view">
                ⤾ Reset view
              </button>
            </div>
          </div>

          <div style={styles.chartPanel}>
            <div style={styles.chartHeader}>
              <span style={styles.panelLabel}>Position error over time</span>
              {lastResult && (
                <button onClick={copyResults} style={styles.copyBtn} title="Copy results to clipboard">📋 Copy results</button>
              )}
            </div>
            <DriftChart series={chartSeries} elapsed={elapsed} />
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelLabel}>Run log</div>
          {history.length === 0 ? (
            <p style={styles.emptyText}>Completed runs appear here. Try the same waypoint with different sensors to compare final drift.</p>
          ) : (
            <div style={styles.historyList}>
              {history.map((h) => (
                <div key={h.id} style={styles.historyCard}>
                  <div style={styles.historyHeader}>
                    <span style={{ ...styles.historyDot, background: h.color }} />
                    <div style={{ flex: 1 }}>
                      <div style={styles.historyName}>{h.sensor}</div>
                      <div style={styles.historyMeta}>{h.time}s flight</div>
                    </div>
                    <div style={{ ...styles.historyDrift, color: h.color }}>{h.totalPos}m</div>
                  </div>
                  <div style={styles.historyAxes}>
                    <span>X {h.x}m</span><span>Y {h.z}m</span><span>Height Z {h.y}m</span>
                    <span>Roll {h.roll}°</span><span>Pitch {h.pitch}°</span><span>Yaw {h.yaw}°</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ ...styles.panelLabel, marginTop: 22 }}>Why this happens</div>
          <p style={styles.footNote}>
            Classical MEMS samples fast but bias error grows with time, producing large drift.
            Cold-atom sensors barely drift but sample so slowly that fast dynamics are blurred.
            NV and hybrid sit in between. The <strong>Hybrid Fusion</strong> mode shows the paper's
            recommended path: MEMS bandwidth, periodically corrected by a slow cold-atom reference —
            watch the sawtooth pattern in the chart as each correction pulse resets the drift.
          </p>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, setValue, min, max, step, accent, unit, disabled }) {
  return (
    <div style={{ marginBottom: 14, '--accent': accent }}>
      <div style={styles.sliderTop}>
        <span style={styles.sliderLabel}>{label}</span>
        <span style={{ ...styles.sliderVal, color: accent }}>{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => setValue(parseFloat(e.target.value))} style={{ '--accent': accent }} />
    </div>
  );
}

function CoordInput({ label, value, onChange, onCommit, disabled, min }) {
  const [text, setText] = useState(String(value));
  useEffect(() => { setText(String(value)); }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setText(raw);
    if (raw === '' || raw === '-') return;
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed)) onChange(parsed);
  };

  const handleBlur = () => {
    let parsed = parseFloat(text);
    if (Number.isNaN(parsed)) parsed = value;
    if (min !== undefined) parsed = Math.max(min, parsed);
    setText(String(parsed));
    onChange(parsed);
    if (onCommit) onCommit(parsed);
  };

  return (
    <label style={styles.coordLabel}>
      {label}
      <input type="number" value={text} disabled={disabled} min={min} onChange={handleChange} onBlur={handleBlur} style={styles.coordInput} />
    </label>
  );
}

function HudStat({ label, value, accent }) {
  return (
    <div style={styles.hudStat}>
      <div style={styles.hudLabel}>{label}</div>
      <div style={{ ...styles.hudValue, color: accent || '#e8edf5' }}>{value}</div>
    </div>
  );
}

function LegendItem({ color, label, dashed, faded }) {
  return (
    <div style={styles.legendItem}>
      <span style={{
        width: 18, height: 2, display: 'inline-block',
        background: dashed ? 'transparent' : color,
        backgroundImage: dashed ? `repeating-linear-gradient(90deg, ${color} 0, ${color} 4px, transparent 4px, transparent 8px)` : 'none',
        opacity: faded ? 0.45 : 1,
      }} />
      <span style={{ fontSize: 11, color: '#8a94a6' }}>{label}</span>
    </div>
  );
}

function MassInput({ preset, mass, onChange, disabled }) {
  const [text, setText] = useState(String(mass));
  useEffect(() => { setText(String(mass)); }, [mass]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setText(raw);
    if (raw === '' || raw === '.') return; // let the user keep typing without forcing a number yet
    const v = parseFloat(raw);
    if (!Number.isNaN(v) && v > 0) onChange(v);
  };

  const handleBlur = () => {
    let v = parseFloat(text);
    if (Number.isNaN(v) || v <= 0) v = mass; // empty/invalid on blur -> revert to last good value
    setText(String(v));
    onChange(v);
  };

  return (
    <div style={{ ...styles.massCard, borderColor: `${preset.color}55` }}>
      <span style={{ ...styles.massCardLabel, color: preset.color }}>{preset.icon} {preset.short}</span>
      <span style={styles.massInputWrap}>
        <input
          type="number" value={text} disabled={disabled} min={0.001} step={mass < 1 ? 0.01 : 0.1}
          onChange={handleChange}
          onBlur={handleBlur}
          style={styles.massInput}
        />
        <span style={styles.massUnit}>kg</span>
      </span>
    </div>
  );
}


function DriftChart({ series, elapsed }) {
  const width = 600;
  const height = 180;
  const padding = { top: 10, right: 14, bottom: 24, left: 38 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const allPoints = series.flatMap((s) => s.points);
  const maxT = Math.max(elapsed, ...allPoints.map((p) => p.t), 1);
  const maxErr = Math.max(...allPoints.map((p) => p.err), 0.5);

  const xScale = (t) => padding.left + (t / maxT) * innerW;
  const yScale = (e) => padding.top + innerH - (e / maxErr) * innerH;

  const yTicks = 4;
  const xTicks = 4;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={styles.chartSvg} preserveAspectRatio="xMidYMid meet">
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const val = (maxErr / yTicks) * i;
        const y = yScale(val);
        return (
          <g key={`y-${i}`}>
            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#1c2433" strokeWidth="1" />
            <text x={padding.left - 6} y={y + 3} fontSize="9" fill="#5a6478" textAnchor="end">{val.toFixed(1)}</text>
          </g>
        );
      })}
      {Array.from({ length: xTicks + 1 }).map((_, i) => {
        const val = (maxT / xTicks) * i;
        const x = xScale(val);
        return (
          <text key={`x-${i}`} x={x} y={height - padding.bottom + 14} fontSize="9" fill="#5a6478" textAnchor="middle">{val.toFixed(0)}s</text>
        );
      })}

      {series.map((s) => {
        if (s.points.length < 2) return null;
        const path = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.t).toFixed(1)} ${yScale(p.err).toFixed(1)}`).join(' ');
        const last = s.points[s.points.length - 1];
        return (
          <g key={s.key}>
            <path d={path} fill="none" stroke={s.color} strokeWidth="2" />
            <circle cx={xScale(last.t)} cy={yScale(last.err)} r="3" fill={s.color} />
          </g>
        );
      })}

      {series.every((s) => s.points.length === 0) && (
        <text x={width / 2} y={height / 2} fontSize="11" fill="#5a6478" textAnchor="middle">Launch a drone to see drift accumulate over time</text>
      )}
    </svg>
  );
}

const styles = {
  page: {
    minHeight: '100vh', background: '#0a0e14', color: '#e8edf5',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    padding: '28px 28px 40px',
  },
  header: { marginBottom: 18, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'flex-end' },
  eyebrow: { fontSize: 11, letterSpacing: '0.12em', color: '#5ec8ff', fontWeight: 700, marginBottom: 6 },
  title: { fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' },
  headerSub: { fontSize: 13, color: '#8a94a6', maxWidth: 320, textAlign: 'right' },

  modeToggle: { display: 'flex', gap: 8, marginBottom: 18 },
  modeBtn: { padding: '9px 16px', borderRadius: 10, border: '1px solid #2a3344', background: '#10151f', color: '#8a94a6', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' },
  modeBtnActive: { borderColor: '#5ec8ff', background: '#5ec8ff14', color: '#5ec8ff' },

  layout: { display: 'grid', gridTemplateColumns: '270px 1fr 250px', gap: 18 },
  panel: { background: '#10151f', border: '1px solid #1c2433', borderRadius: 14, padding: 18 },
  panelLabel: { fontSize: 11, letterSpacing: '0.08em', color: '#5a6478', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 },
  sensorGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 },
  sensorBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 6px', borderRadius: 10, border: '1px solid #2a3344', background: 'transparent', transition: 'all 0.15s' },
  descText: { fontSize: 12, lineHeight: 1.5, margin: '8px 0 0', opacity: 0.9 },
  sliderTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  sliderLabel: { fontSize: 12, color: '#b4bcc9' },
  sliderVal: { fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' },

  windRow: { marginBottom: 10 },
  windToggleLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#b4bcc9', cursor: 'pointer' },
  checkbox: { width: 15, height: 15, accentColor: '#5ec8ff', cursor: 'pointer' },

  coordRow: { display: 'flex', gap: 10, marginBottom: 16 },
  coordLabel: { fontSize: 11, color: '#5a6478', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  coordInput: { background: '#0a0e14', border: '1px solid #2a3344', borderRadius: 8, padding: '8px 10px', color: '#e8edf5', fontSize: 13, width: '100%' },

  massHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  resetMassBtn: {
    background: 'transparent', border: '1px solid #2a3344', borderRadius: 6, padding: '3px 8px',
    color: '#8a94a6', fontSize: 10.5, fontWeight: 600, cursor: 'pointer',
  },
  massGrid: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, marginBottom: 8 },
  massCard: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#0a0e14', border: '1px solid #2a3344', borderRadius: 8, padding: '8px 10px',
  },
  massCardLabel: { fontSize: 12, fontWeight: 600 },
  massInputWrap: { display: 'flex', alignItems: 'center', gap: 6 },
  massInput: {
    width: 64, background: '#10151f', border: '1px solid #2a3344', borderRadius: 6,
    padding: '5px 8px', color: '#e8edf5', fontSize: 12.5, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
  },
  massUnit: { fontSize: 11, color: '#5a6478' },
  massHint: { fontSize: 10.5, color: '#5a6478', lineHeight: 1.5, marginBottom: 4 },

  tuneHint: { fontSize: 10.5, color: '#5a6478', lineHeight: 1.5, marginBottom: 12 },
  tuneGroup: { marginBottom: 14, paddingBottom: 6, borderBottom: '1px solid #1c2433' },
  tuneGroupLabel: { fontSize: 11.5, fontWeight: 700, marginBottom: 8 },

  waypointTabs: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 },
  waypointTab: {
    width: 30, height: 30, borderRadius: 8, border: '1px solid #2a3344', background: '#0a0e14',
    color: '#8a94a6', fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },
  waypointTabActive: { borderColor: '#4ade80', background: '#4ade8014', color: '#4ade80' },
  waypointAddBtn: {
    height: 30, padding: '0 10px', borderRadius: 8, border: '1px dashed #2a3344', background: 'transparent',
    color: '#5a6478', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
  },
  waypointRemoveBtn: {
    height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid #ff5a3655', background: 'transparent',
    color: '#ff5a36', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto',
  },
  btnRow: { marginTop: 8 },
  primaryBtn: { width: '100%', padding: '12px', borderRadius: 10, border: 'none', color: '#0a0e14', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  stopBtn: { width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #ff5a36', background: 'transparent', color: '#ff5a36', fontWeight: 700, fontSize: 13, cursor: 'pointer' },

  centerCol: { display: 'flex', flexDirection: 'column', gap: 14 },
  viewportWrap: { position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid #1c2433' },
  viewport: { width: '100%', height: '520px', display: 'block' },

  hudTop: { position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none' },
  hudRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  hudStat: { background: 'rgba(10,14,20,0.78)', borderRadius: 10, padding: '6px 12px', backdropFilter: 'blur(6px)' },
  hudLabel: { fontSize: 9, letterSpacing: '0.06em', color: '#5a6478', textTransform: 'uppercase' },
  hudValue: { fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
  camHint: { alignSelf: 'center', fontSize: 10, color: '#5a6478', background: 'rgba(10,14,20,0.6)', padding: '4px 10px', borderRadius: 6, textAlign: 'center', maxWidth: '92%' },

  hudBottom: { position: 'absolute', bottom: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap' },
  legend: { display: 'flex', gap: 14, flexWrap: 'wrap' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6 },
  legendNote: { fontSize: 10, color: '#5a6478', fontStyle: 'italic' },
  resetViewBtn: { background: 'rgba(10,14,20,0.78)', border: '1px solid #2a3344', borderRadius: 8, padding: '7px 12px', color: '#b4bcc9', fontSize: 11, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(6px)', flexShrink: 0 },

  chartPanel: { background: '#10151f', border: '1px solid #1c2433', borderRadius: 14, padding: 16 },
  chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chartSvg: { width: '100%', height: 180, display: 'block' },
  copyBtn: { background: 'transparent', border: '1px solid #2a3344', borderRadius: 8, padding: '5px 10px', color: '#8a94a6', fontSize: 11, fontWeight: 600, cursor: 'pointer' },

  swapMassInputWrap: { display: 'flex', alignItems: 'center', gap: 4 },
  swapMassInput: {
    width: 56, background: '#10151f', border: '1px solid #2a3344', borderRadius: 6,
    padding: '2px 6px', color: '#e8edf5', fontSize: 11, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
  },
  swapHint: { fontSize: 10.5, color: '#5a6478', lineHeight: 1.5, marginTop: 10 },

  emptyText: { fontSize: 12, color: '#5a6478', lineHeight: 1.5 },
  historyList: { display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 480, overflowY: 'auto' },
  historyCard: { padding: '10px 0', borderBottom: '1px solid #1c2433' },
  historyHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  historyDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  historyName: { fontSize: 12, fontWeight: 600, color: '#e8edf5' },
  historyMeta: { fontSize: 11, color: '#5a6478' },
  historyDrift: { fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
  historyAxes: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 10px', fontSize: 10.5, color: '#8a94a6', fontVariantNumeric: 'tabular-nums', paddingLeft: 18 },
  footNote: { fontSize: 12, lineHeight: 1.6, color: '#8a94a6' },
};
