/**
 * Self-drawing architectural plan behind the under-construction splash.
 * Pure SVG + CSS: every stroke uses pathLength="1" so one keyframe draws any
 * shape, and the `.s*` stage classes stagger the start times.
 */
const CSS = `
.bp-wrap{position:absolute;inset:0;overflow:hidden}
.bp-grid{position:absolute;inset:-10%;
  background-image:
    linear-gradient(rgba(168,127,63,.10) 1px,transparent 1px),
    linear-gradient(90deg,rgba(168,127,63,.10) 1px,transparent 1px);
  background-size:64px 64px;
  mask-image:radial-gradient(90% 70% at 60% 34%,#000 0%,transparent 78%);
  animation:bp-pan 60s linear infinite}
.bp-svg{position:absolute;top:48%;left:58%;width:min(124vh,92vw);
  transform:translate(-50%,-50%)}
.bp-sweep{position:absolute;top:0;bottom:0;width:22vw;pointer-events:none;
  background:linear-gradient(90deg,transparent,rgba(224,181,120,.05) 45%,rgba(224,181,120,.10) 50%,transparent);
  animation:bp-sweep 11s cubic-bezier(.55,0,.45,1) infinite 2.4s}
.bp-svg [class^=s]{stroke-dasharray:1;stroke-dashoffset:1;
  animation:bp-draw 1.6s cubic-bezier(.22,1,.36,1) forwards}
.bp-svg .s2{animation-delay:.5s}
.bp-svg .s3{animation-delay:1s}
.bp-svg .s4{animation-delay:1.45s;animation-duration:2.2s}
.bp-fade{opacity:0;animation:bp-fade 1.2s ease forwards 2.1s}
@keyframes bp-draw{to{stroke-dashoffset:0}}
@keyframes bp-fade{to{opacity:1}}
@keyframes bp-pan{to{background-position:64px 64px}}
@keyframes bp-sweep{0%{left:-25vw}100%{left:105vw}}
@media (max-width:768px){.bp-svg{top:36%;left:50%;width:158vw}}
@media (prefers-reduced-motion:reduce){
  .bp-grid,.bp-sweep{animation:none}
  .bp-sweep{display:none}
  .bp-svg [class^=s]{animation:none;stroke-dashoffset:0}
  .bp-fade{animation:none;opacity:1}}
`;

const AXIS_X = [300, 620, 860, 1020];
const AXIS_Y = [90, 300, 380, 610];

export default function BlueprintPlan() {
  return (
    <div className="bp-wrap" aria-hidden>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bp-grid" />
      <div className="bp-sweep" />
      <svg className="bp-svg" viewBox="0 0 1320 720" fill="none">
        {/* Structural grid: dashed axes with lettered / numbered bubbles. */}
        <g stroke="#a87f3f" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="10 8">
          {AXIS_X.map((x) => (
            <line key={x} className="s1" x1={x} y1="46" x2={x} y2="660" pathLength="1" />
          ))}
          {AXIS_Y.map((y) => (
            <line key={y} className="s1" x1="256" y1={y} x2="1080" y2={y} pathLength="1" />
          ))}
        </g>
        <g className="bp-fade" stroke="#a87f3f" strokeOpacity="0.55">
          {AXIS_X.map((x, i) => (
            <g key={x}>
              <circle cx={x} cy="34" r="15" />
              <text x={x} y="39" className="bp-tag" textAnchor="middle">
                {i + 1}
              </text>
            </g>
          ))}
          {AXIS_Y.map((y, i) => (
            <g key={y}>
              <circle cx="240" cy={y} r="15" />
              <text x="240" y={y + 5} className="bp-tag" textAnchor="middle">
                {String.fromCharCode(65 + i)}
              </text>
            </g>
          ))}
        </g>

        {/* Envelope, broken at every window opening. */}
        <g stroke="#e0b578" strokeWidth="5" strokeLinecap="square">
          <path className="s2" d="M300 90 H400 M520 90 H700 M860 90 H1020" pathLength="1" />
          <path className="s2" d="M1020 90 V180 M1020 300 V610" pathLength="1" />
          <path className="s2" d="M1020 610 H560 M420 610 H300" pathLength="1" />
          <path className="s2" d="M300 610 V90" pathLength="1" />
        </g>

        {/* Partitions, broken at every door opening. */}
        <g stroke="#c79a55" strokeWidth="3" strokeLinecap="square">
          <path className="s3" d="M620 90 V330 M620 390 V610" pathLength="1" />
          <path className="s3" d="M620 380 H800 M860 380 H1020" pathLength="1" />
          <path className="s3" d="M300 300 H470 M530 300 H620" pathLength="1" />
          <path className="s3" d="M860 380 V610" pathLength="1" />
        </g>

        {/* Glazing lines across the envelope openings. */}
        <g stroke="#e0b578" strokeWidth="1.4" strokeOpacity="0.9">
          <path className="s4" d="M400 90 H520 M700 90 H860" pathLength="1" />
          <path className="s4" d="M1020 180 V300 M420 610 H560" pathLength="1" />
        </g>

        {/* Door leaves + swings. */}
        <g stroke="#c79a55" strokeWidth="1.6" strokeOpacity="0.85">
          <path className="s4" d="M620 330 H680 A60 60 0 0 1 620 390" pathLength="1" />
          <path className="s4" d="M800 380 V440 A60 60 0 0 0 860 380" pathLength="1" />
          <path className="s4" d="M530 300 V360 A60 60 0 0 1 470 300" pathLength="1" />
        </g>

        {/* Stair core. */}
        <g stroke="#c79a55" strokeWidth="1.6" strokeOpacity="0.9">
          <path className="s4" d="M660 430 H770 V580 H660 Z" pathLength="1" />
          {Array.from({ length: 6 }, (_, i) => (
            <path key={i} className="s4" d={`M660 ${451 + i * 21} H770`} pathLength="1" />
          ))}
          <path className="s4" d="M715 570 V440 m0 0 l-11 15 m11-15 l11 15" pathLength="1" />
        </g>

        {/* Dimension string. */}
        <g stroke="#a87f3f" strokeOpacity="0.6" strokeWidth="1">
          <path className="s4" d="M300 656 H1020" pathLength="1" />
          <path className="s4" d="M300 648 v16 M620 648 v16 M1020 648 v16" pathLength="1" />
        </g>
        <g className="bp-fade">
          <text x="460" y="642" className="bp-tag" textAnchor="middle">
            11 400
          </text>
          <text x="820" y="642" className="bp-tag" textAnchor="middle">
            14 300
          </text>
          <text x="1052" y="82" className="bp-tag">
            GA—01 · PLAN · REV C
          </text>
        </g>
        <style>{`.bp-tag{fill:#c79a55;fill-opacity:.7;stroke:none;font:13px ui-monospace,monospace;letter-spacing:.08em}`}</style>
      </svg>
    </div>
  );
}
