(() => {
  "use strict";

  const nameInput = document.querySelector("#full-name");
  const shapeInput = document.querySelector("#shape");
  const textColorInput = document.querySelector("#text-color");
  const heroAvatar = document.querySelector("#hero-avatar");
  const previewName = document.querySelector("#preview-name");
  const colourSwatch = document.querySelector("#colour-swatch");
  const colourValue = document.querySelector("#colour-value");
  const status = document.querySelector("#status");
  const copyColourButton = document.querySelector("#copy-colour");

  let current = { initials: "AM", name: "Alex Morgan", background: "#64748B", foreground: "#FFFFFF", shape: "circle" };

  // A stable string hash means the same name always produces the same colour.
  function hashName(value) {
    let hash = 2166136261;
    for (const char of value.normalize("NFKC").toLocaleLowerCase("en")) {
      hash ^= char.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function nameToColour(name) {
    const hash = hashName(name.trim() || "anonymous");
    // Keep saturation and lightness in a readable range; hue is derived from the name.
    const hue = hash % 360;
    const saturation = 48 + ((hash >>> 9) % 19); // 48–66%
    const lightness = 38 + ((hash >>> 17) % 13); // 38–50%
    return hslToHex(hue, saturation, lightness);
  }

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const value = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return Math.round(255 * value).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
  }

  function getInitials(name) {
    const parts = name.trim().split(/\s+/u).filter(Boolean);
    if (!parts.length) return "??";
    if (parts.length === 1) {
      const chars = Array.from(parts[0]);
      return ((chars[0] || "?") + (chars[1] || chars[0] || "?")).toLocaleUpperCase();
    }
    return (Array.from(parts[0])[0] + Array.from(parts[parts.length - 1])[0]).toLocaleUpperCase();
  }

  function luminance(hex) {
    const rgb = hex.match(/[a-f\d]{2}/gi).map(part => parseInt(part, 16) / 255);
    const linear = rgb.map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  }

  function getForeground(background) {
    if (textColorInput.value === "white") return "#FFFFFF";
    if (textColorInput.value === "black") return "#111318";
    return luminance(background) > 0.34 ? "#111318" : "#FFFFFF";
  }

  function shapeClass(shape) {
    return shape === "rounded" ? "avatar-rounded" : shape === "square" ? "avatar-square" : "avatar-circle";
  }

  function update() {
    const name = nameInput.value.trim();
    const displayName = name || "Your name";
    const initials = getInitials(name);
    const background = nameToColour(name);
    const foreground = getForeground(background);
    const shape = shapeInput.value;
    current = { initials, name: displayName, background, foreground, shape };

    previewName.textContent = displayName;
    colourSwatch.style.backgroundColor = background;
    colourValue.textContent = background;

    [heroAvatar, document.querySelector("#avatar-24"), document.querySelector("#avatar-32"), document.querySelector("#avatar-40")].forEach(el => {
      el.textContent = initials;
      el.style.backgroundColor = background;
      el.style.color = foreground;
      el.classList.remove("avatar-circle", "avatar-rounded", "avatar-square");
      el.classList.add(shapeClass(shape));
      el.setAttribute("aria-label", `${initials} avatar for ${displayName}`);
    });
    status.textContent = "";
  }

  function makeSvg(size) {
    const { initials, background, foreground, shape } = current;
    const radius = shape === "circle" ? size / 2 : shape === "rounded" ? size * 0.22 : 0;
    const fontSize = size * 0.35;
    const safeInitials = initials.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${safeInitials} avatar"><rect width="${size}" height="${size}" rx="${radius}" fill="${background}"/><text x="50%" y="50%" fill="${foreground}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="600" text-anchor="middle" dominant-baseline="central">${safeInitials}</text></svg>`;
  }

  function downloadSvg(size) {
    const blob = new Blob([makeSvg(size)], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const slug = current.name.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "avatar";
    anchor.href = url;
    anchor.download = `${slug}-avatar-${size}x${size}.svg`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  nameInput.addEventListener("input", update);
  shapeInput.addEventListener("change", update);
  textColorInput.addEventListener("change", update);

  document.querySelectorAll("[data-size]").forEach(button => {
    button.addEventListener("click", () => downloadSvg(Number(button.dataset.size)));
  });
  document.querySelector("#download-all").addEventListener("click", () => [24, 32, 40].forEach((size, index) => {
    window.setTimeout(() => downloadSvg(size), index * 180);
  }));
  copyColourButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(current.background);
      status.textContent = `${current.background} copied to clipboard.`;
    } catch {
      status.textContent = `Colour: ${current.background} (clipboard access unavailable).`;
    }
  });

  update();
})();