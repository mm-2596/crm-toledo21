/** Respaldo vectorial local: no depende de imágenes, fuentes ni CDN. */
export function HeroPoster() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "grid",
      placeItems: "center", pointerEvents: "none" }}>
      <svg viewBox="0 0 640 480" fill="none" style={{ width: "92%", height: "92%" }}>
        <path d="M74 278 342 145 566 256 301 394Z" fill="#211c18" stroke="#a9834f" strokeWidth="2" />
        <path d="M74 278v20l227 115 265-138v-19L301 394Z" fill="#161210" stroke="#a9834f" />
        <path d="m99 273 243-122 198 101-240 124Z" fill="#ad8964" />
        <path d="M100 271V147l241-119v124Z" fill="#e0d7c7" stroke="#d9ae74" />
        <path d="m341 28 130 66v125l-130-67Z" fill="#ede7dc" stroke="#d9ae74" />
        <path d="m471 219 69 33-80 43-70-35Z" fill="#c6b9a6" />
        <path d="m471 94 69 35v123M471 94l-80 42v124m0-124 69 34v125m80-166-80 41"
          stroke="#a9834f" strokeWidth="3" />
        <path d="m152 271 118-59 94 48-118 61Z" fill="#cec4b2" />
        <path d="m142 233 84-42 67 34-84 44Z" fill="#b4a793" />
        <path d="m142 233 67 36v-33l-67-35Z" fill="#d5cbb9" />
        <path d="m142 201 84-42 67 34-84 43Z" fill="#e1d8c8" />
        <path d="m152 192 74-37 64 33-11 8-53-26-62 31Z" fill="#f0e8da" />
        <path d="m244 279 53-27 39 20-52 28Z" fill="#b7ab98" stroke="#a9834f" />
        <path d="m244 279v16l40 21 52-27v-17l-52 28Z" fill="#c6b9a6" />
        <path d="m312 156 69-35 56 29-68 36Z" fill="#f4eee4" />
        <path d="m312 156 57 30 68-36v17l-68 36-57-29Z" fill="#b8a990" />
        <path d="m322 161 52-26 51 26-53 27Z" fill="#c3b29a" />
        <path d="m349 244 23-12 23 12-23 12Z" fill="#d9ae74" />
        <path d="M372 256v29" stroke="#947354" strokeWidth="5" />
        <path d="m518 207-14 7-14-7v21l14 7 14-7Z" fill="#b7ac9c" />
        <path d="M504 215v-49m0 27c-25-2-19-30 0-13m0 19c24-3 26-32 0-12"
          stroke="#657457" strokeWidth="8" strokeLinecap="round" />
        <path d="m185 109 53-26v42l-53 27Z" fill="#a49377" />
        <path d="m194 112 33-17v25l-33 17Z" fill="#c6b9a6" />
      </svg>
    </div>
  );
}
