import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import ForceGraph3D from "3d-force-graph";
import * as THREE from "three";
import type { SimLink, SimNode } from "../lib/graph";

export type SizeMode = "value" | "degree";

export interface GraphSettings {
  sizeMode: SizeMode;
  linkDistance: number;
  repulsion: number;
  labels: boolean;
  orbit: boolean;
  particles: boolean;
}

export interface GraphHandle {
  flyToNode: (id: string) => void;
  resetView: () => void;
}

interface Props {
  nodes: SimNode[];
  links: SimLink[];
  settings: GraphSettings;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (node: SimNode | null) => void;
}

type AnyNode = SimNode & Record<string, any>;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function makeLabelSprite(text: string, color: string): THREE.Sprite {
  const pad = 18;
  const font = '600 30px "IBM Plex Mono", monospace';
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  const h = 52;
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext("2d")!;
  c.font = font;
  c.textBaseline = "middle";
  c.fillStyle = "rgba(6, 11, 20, 0.72)";
  const r = 12;
  c.beginPath();
  c.roundRect(1, 1, w - 2, h - 2, r);
  c.fill();
  c.strokeStyle = color + "66";
  c.lineWidth = 1.5;
  c.stroke();
  c.fillStyle = "#e8eff9";
  c.fillText(text, pad, h / 2 + 1);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.92 });
  const sprite = new THREE.Sprite(mat);
  const s = 0.075;
  sprite.scale.set(w * s, h * s, 1);
  return sprite;
}

export const GraphCanvas = memo(
  forwardRef<GraphHandle, Props>(function GraphCanvas(
    { nodes, links, settings, selectedId, onSelect, onHover },
    ref
  ) {
    const elRef = useRef<HTMLDivElement>(null);
    const fgRef = useRef<any>(null);
    const sphereGeo = useRef<THREE.SphereGeometry | null>(null);
    const ringRef = useRef<THREE.Mesh | null>(null);
    const starsRef = useRef<THREE.Points | null>(null);
    const rafRef = useRef(0);
    const animRef = useRef(0);
    const hoveredRef = useRef<AnyNode | null>(null);
    const flyRef = useRef<((dt: number) => boolean) | null>(null);

    const propsRef = useRef({ nodes, links, settings, selectedId, onSelect, onHover });
    propsRef.current = { nodes, links, settings, selectedId, onSelect, onHover };

    const radiusOf = (n: AnyNode) =>
      propsRef.current.settings.sizeMode === "value" ? n.rVal : n.rDeg;

    const buildBubble = (node: AnyNode) => {
      const r = radiusOf(node);
      node.__r = r;
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({
        color: node.color,
        roughness: 0.28,
        metalness: 0.22,
        emissive: new THREE.Color(node.color),
        emissiveIntensity: 0.22,
        transparent: true,
        opacity: 0.97,
      });
      const mesh = new THREE.Mesh(sphereGeo.current!, mat);
      mesh.scale.setScalar(r);
      g.add(mesh);

      const core = new THREE.Mesh(
        sphereGeo.current!,
        new THREE.MeshBasicMaterial({ color: "#0a1120", transparent: true, opacity: 0.35 })
      );
      core.scale.setScalar(r * 0.55);
      g.add(core);

      if (propsRef.current.settings.labels && propsRef.current.nodes.length <= 160) {
        const sprite = makeLabelSprite(node.label, node.color);
        sprite.position.y = r + 5.2;
        g.add(sprite);
        node.__label = sprite;
      } else {
        node.__label = null;
      }
      node.__obj = g;
      return g;
    };

    /* ------------------------------ mount ------------------------------ */
    useEffect(() => {
      const el = elRef.current!;
      if (!sphereGeo.current) sphereGeo.current = new THREE.SphereGeometry(1, 30, 22);

      const fg: any = new (ForceGraph3D as any)(el, { controlType: "orbit" });
      fgRef.current = fg;
      fg.backgroundColor("#060b14");
      fg.showNavInfo(false);
      fg.cameraPosition({ x: 0, y: 40, z: 340 }, { x: 0, y: 0, z: 0 }, 0);

      fg.nodeVal((n: AnyNode) => Math.pow((n.__r || 4) / 3, 2));
      fg.nodeThreeObject((n: AnyNode) => buildBubble(n));
      fg.linkOpacity(0.3);
      fg.linkCurvature(0.05);
      fg.linkWidth((l: any) => l.width || 1);
      fg.linkColor((l: any) => (l.source && l.source.color) || "#2a4368");
      fg.linkDirectionalParticles(2);
      fg.linkDirectionalParticleWidth(1.5);
      fg.linkDirectionalParticleSpeed((l: any) => l.speed || 0.004);
      fg.linkDirectionalParticleColor((l: any) => (l.source && l.source.color) || "#5eead4");

      fg.onNodeClick((n: AnyNode) => {
        propsRef.current.onSelect(n.id);
        flyToNode(n.id);
      });
      fg.onBackgroundClick(() => propsRef.current.onSelect(null));
      fg.onNodeHover((n: AnyNode | null) => {
        el.style.cursor = n ? "pointer" : "grab";
        if (hoveredRef.current && hoveredRef.current.__obj) {
          hoveredRef.current.__obj.scale.setScalar(1);
        }
        hoveredRef.current = n;
        if (n && n.__obj) n.__obj.scale.setScalar(1.22);
        propsRef.current.onHover(n ?? null);
      });

      const controls: any = fg.controls();
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.autoRotateSpeed = 0.55;
      controls.minDistance = 25;
      controls.maxDistance = 1400;

      /* ambient starfield */
      const scene: THREE.Scene = fg.scene();
      const starGeo = new THREE.BufferGeometry();
      const N = 550;
      const pos = new Float32Array(N * 3);
      const col = new Float32Array(N * 3);
      const tintA = new THREE.Color("#1f3a52");
      const tintB = new THREE.Color("#2a4038");
      const tintC = new THREE.Color("#41351f");
      for (let i = 0; i < N; i++) {
        const rad = 480 + Math.random() * 520;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = rad * Math.cos(phi);
        pos[i * 3 + 2] = rad * Math.sin(phi) * Math.sin(theta);
        const t = [tintA, tintB, tintC][Math.floor(Math.random() * 3)];
        col[i * 3] = t.r;
        col[i * 3 + 1] = t.g;
        col[i * 3 + 2] = t.b;
      }
      starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      starGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const stars = new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({
          size: 2.1,
          vertexColors: true,
          transparent: true,
          opacity: 0.85,
          sizeAttenuation: true,
          depthWrite: false,
        })
      );
      scene.add(stars);
      starsRef.current = stars;
      scene.fog = new THREE.FogExp2(new THREE.Color("#060b14"), 0.00085);

      /* selection ring */
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1, 0.05, 12, 80),
        new THREE.MeshBasicMaterial({ color: "#fbbf24", transparent: true, opacity: 0.95, depthWrite: false })
      );
      ring.visible = false;
      scene.add(ring);
      ringRef.current = ring;

      /* ambient loop */
      let last = performance.now();
      const loop = () => {
        rafRef.current = requestAnimationFrame(loop);
        const now = performance.now();
        const dt = now - last;
        last = now;
        stars.rotation.y += 0.00016 * (dt / 16.7);
        stars.rotation.x += 0.00005 * (dt / 16.7);
        if (flyRef.current) {
          const done = flyRef.current(dt);
          if (done) flyRef.current = null;
        }
        const sel = propsRef.current.selectedId;
        const ringMesh = ringRef.current!;
        if (sel && fgRef.current) {
          const n: AnyNode | undefined = fgRef.current
            .graphData()
            .nodes.find((x: AnyNode) => x.id === sel);
          if (n && n.x !== undefined) {
            ringMesh.visible = true;
            ringMesh.position.set(n.x, n.y, n.z);
            ringMesh.lookAt(fgRef.current.camera().position);
            const pulse = 1 + Math.sin(now * 0.004) * 0.07;
            const s = (n.__r || 4) * 1.65 * pulse;
            ringMesh.scale.setScalar(s);
          } else {
            ringMesh.visible = false;
          }
        } else {
          ringMesh.visible = false;
        }
        controls.update();
      };
      loop();

      const ro = new ResizeObserver(() => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && fgRef.current) fgRef.current.width(rect.width).height(rect.height);
      });
      ro.observe(el);

      if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
          if (fgRef.current) fgRef.current.refresh();
        });
      }

      return () => {
        ro.disconnect();
        cancelAnimationFrame(rafRef.current);
        cancelAnimationFrame(animRef.current);
        stars.geometry.dispose();
        (stars.material as THREE.Material).dispose();
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
        const f = fgRef.current;
        if (f) {
          try {
            (f as any)._destructor?.();
          } catch {
            /* noop */
          }
        }
        el.innerHTML = "";
        fgRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ------------------------------ data ------------------------------- */
    useEffect(() => {
      const fg = fgRef.current;
      if (!fg) return;
      if (hoveredRef.current) {
        hoveredRef.current = null;
        propsRef.current.onHover(null);
      }
      const data = {
        nodes: nodes.map((n) => ({ ...n })),
        links: links.map((l) => ({ ...l })),
      };
      fg.graphData(data);
      const t = window.setTimeout(() => {
        try {
          fg.zoomToFit(750, 80);
        } catch {
          /* noop */
        }
      }, 420);
      return () => window.clearTimeout(t);
    }, [nodes, links]);

    /* ---------------------------- settings ----------------------------- */
    const prevMode = useRef(settings.sizeMode);
    useEffect(() => {
      const fg = fgRef.current;
      if (!fg) return;
      const controls: any = fg.controls();
      controls.autoRotate = settings.orbit && !selectedId;

      try {
        fg.d3Force("link")?.distance(settings.linkDistance);
        fg.d3Force("charge")?.strength(-settings.repulsion);
        fg.d3ReheatSimulation(0.22);
      } catch {
        /* noop */
      }

      fg.linkDirectionalParticles(settings.particles ? 2 : 0);

      const modeChanged = prevMode.current !== settings.sizeMode;
      prevMode.current = settings.sizeMode;

      const simNodes: AnyNode[] = fg.graphData().nodes;
      for (const n of simNodes) {
        if (modeChanged && n.__obj) {
          const r = radiusOf(n);
          n.__r = r;
          const sphere = n.__obj.children[0];
          if (sphere) sphere.scale.setScalar(r);
          const core = n.__obj.children[1];
          if (core) core.scale.setScalar(r * 0.55);
          if (n.__label) n.__label.position.y = r + 5.2;
        }
        if (n.__label) n.__label.visible = settings.labels;
      }
      if (modeChanged) {
        try {
          fg.d3ReheatSimulation(0.35);
        } catch {
          /* noop */
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings, selectedId]);

    /* --------------------- selection focus / dim ----------------------- */
    useEffect(() => {
      const fg = fgRef.current;
      if (!fg) return;
      const simNodes: AnyNode[] = fg.graphData().nodes;
      const simLinks: any[] = fg.graphData().links;

      let neighbor: Set<string> | null = null;
      if (selectedId) {
        neighbor = new Set([selectedId]);
        for (const l of propsRef.current.links) {
          if (l.source === selectedId) neighbor.add(l.target);
          if (l.target === selectedId) neighbor.add(l.source);
        }
      }

      for (const n of simNodes) {
        if (!n.__obj) continue;
        const dimmed = neighbor !== null && !neighbor.has(n.id);
        const sphere = n.__obj.children[0] as THREE.Mesh | undefined;
        const core = n.__obj.children[1] as THREE.Mesh | undefined;
        if (sphere) {
          const m = sphere.material as THREE.MeshStandardMaterial;
          m.opacity = dimmed ? 0.09 : 0.97;
          m.emissiveIntensity = n.id === selectedId ? 0.55 : dimmed ? 0.02 : 0.22;
          m.depthWrite = !dimmed;
        }
        if (core) (core.material as THREE.MeshBasicMaterial).opacity = dimmed ? 0.02 : 0.35;
        if (n.__label) (n.__label.material as THREE.SpriteMaterial).opacity = dimmed ? 0.05 : 0.92;
      }

      /* NOTE: link line & photon materials are shared per color inside
         three-forcegraph, so we dim via per-link object visibility only. */
      for (const l of simLinks) {
        const touches =
          selectedId &&
          ((l.source?.id ?? l.source) === selectedId || (l.target?.id ?? l.target) === selectedId);
        const show = !selectedId || !!touches;
        if (l.__lineObj) l.__lineObj.visible = show;
        if (l.__photonsObj) l.__photonsObj.visible = show;
      }
    }, [selectedId, nodes]);

    /* ------------------------------ flying ----------------------------- */
    const animateCamera = (toPos: THREE.Vector3, toTarget: THREE.Vector3, ms = 850) => {
      const fg = fgRef.current;
      if (!fg) return;
      cancelAnimationFrame(animRef.current);
      const controls: any = fg.controls();
      const fromPos = new THREE.Vector3().copy(fg.camera().position);
      const fromTarget = new THREE.Vector3().copy(controls.target);
      let elapsed = 0;
      flyRef.current = (dt: number) => {
        elapsed += dt;
        const t = easeInOutCubic(clamp(elapsed / ms, 0, 1));
        const pos = fromPos.clone().lerp(toPos, t);
        const tar = fromTarget.clone().lerp(toTarget, t);
        fg.cameraPosition(pos, tar, 0);
        controls.target.copy(tar);
        return elapsed >= ms;
      };
    };

    const flyToNode = (id: string) => {
      const fg = fgRef.current;
      if (!fg) return;
      const n: AnyNode | undefined = fg.graphData().nodes.find((x: AnyNode) => x.id === id);
      if (!n || n.x === undefined) return;
      const nodePos = new THREE.Vector3(n.x, n.y, n.z);
      const cam = new THREE.Vector3().copy(fg.camera().position);
      const dir = cam.clone().sub(nodePos);
      if (dir.lengthSq() < 0.01) dir.set(0, 0, 1);
      dir.normalize();
      const dist = clamp((n.__r || 4) * 11 + 55, 85, 260);
      const toPos = nodePos.clone().add(dir.multiplyScalar(dist));
      animateCamera(toPos, nodePos);
    };

    useImperativeHandle(ref, () => ({
      flyToNode,
      resetView: () => animateCamera(new THREE.Vector3(0, 40, 340), new THREE.Vector3(0, 0, 0), 900),
    }));

    return <div ref={elRef} className="absolute inset-0" />;
  })
);
