(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;

  const DEFAULT_LOCATION = {
    lat: 31.2304,
    lon: 121.4737,
    source: "MANUAL DEFAULT"
  };

  const ROMAN_HOURS = [
    "0", "I", "II", "III", "IV", "V",
    "VI", "VII", "VIII", "IX", "X", "XI",
    "XII", "XIII", "XIV", "XV", "XVI", "XVII",
    "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII"
  ];

  const SEASONS = [
    { label: "AUTUMNUS", className: "is-autumnus", start: 21, end: 27, labelHour: 0 },
    { label: "HIEMS", className: "is-hiems", start: 3, end: 9, labelHour: 6 },
    { label: "VER", className: "is-ver", start: 9, end: 15, labelHour: 12 },
    { label: "AESTAS", className: "is-aestas", start: 15, end: 21, labelHour: 18 }
  ];

  const PLANET_DEFS = [
    {
      key: "mercury",
      name: "MERCURY",
      symbol: "☿",
      lane: 386,
      elements: d => ({
        N: 48.3313 + 3.24587e-5 * d,
        i: 7.0047 + 5.00e-8 * d,
        w: 29.1241 + 1.01444e-5 * d,
        a: 0.387098,
        e: 0.205635 + 5.59e-10 * d,
        M: 168.6562 + 4.0923344368 * d
      })
    },
    {
      key: "venus",
      name: "VENUS",
      symbol: "♀",
      lane: 360,
      elements: d => ({
        N: 76.6799 + 2.46590e-5 * d,
        i: 3.3946 + 2.75e-8 * d,
        w: 54.8910 + 1.38374e-5 * d,
        a: 0.723330,
        e: 0.006773 - 1.302e-9 * d,
        M: 48.0052 + 1.6021302244 * d
      })
    },
    {
      key: "mars",
      name: "MARS",
      symbol: "♂",
      lane: 334,
      elements: d => ({
        N: 49.5574 + 2.11081e-5 * d,
        i: 1.8497 - 1.78e-8 * d,
        w: 286.5016 + 2.92961e-5 * d,
        a: 1.523688,
        e: 0.093405 + 2.516e-9 * d,
        M: 18.6021 + 0.5240207766 * d
      })
    },
    {
      key: "jupiter",
      name: "JUPITER",
      symbol: "♃",
      lane: 386,
      elements: d => ({
        N: 100.4542 + 2.76854e-5 * d,
        i: 1.3030 - 1.557e-7 * d,
        w: 273.8777 + 1.64505e-5 * d,
        a: 5.20256,
        e: 0.048498 + 4.469e-9 * d,
        M: 19.8950 + 0.0830853001 * d
      })
    },
    {
      key: "saturn",
      name: "SATURN",
      symbol: "♄",
      lane: 360,
      elements: d => ({
        N: 113.6634 + 2.38980e-5 * d,
        i: 2.4886 - 1.081e-7 * d,
        w: 339.3939 + 2.97661e-5 * d,
        a: 9.55475,
        e: 0.055546 - 9.499e-9 * d,
        M: 316.9670 + 0.0334442282 * d
      })
    },
    {
      key: "uranus",
      name: "URANUS",
      symbol: "♅",
      lane: 334,
      elements: d => ({
        N: 74.0005 + 1.3978e-5 * d,
        i: 0.7733 + 1.9e-8 * d,
        w: 96.6612 + 3.0565e-5 * d,
        a: 19.18171 - 1.55e-8 * d,
        e: 0.047318 + 7.45e-9 * d,
        M: 142.5905 + 0.011725806 * d
      })
    },
    {
      key: "neptune",
      name: "NEPTUNE",
      symbol: "♆",
      lane: 386,
      elements: d => ({
        N: 131.7806 + 3.0173e-5 * d,
        i: 1.7700 - 2.55e-7 * d,
        w: 272.8461 - 6.027e-6 * d,
        a: 30.05826 + 3.313e-8 * d,
        e: 0.008606 + 2.15e-9 * d,
        M: 260.2471 + 0.005995147 * d
      })
    }
  ];

  const state = {
    lat: DEFAULT_LOCATION.lat,
    lon: DEFAULT_LOCATION.lon,
    source: DEFAULT_LOCATION.source,
    live: true,
    heldDate: new Date()
  };

  const els = {
    svg: document.getElementById("clockSvg"),
    seasonBands: document.getElementById("seasonBands"),
    minorTicks: document.getElementById("minorTicks"),
    majorTicks: document.getElementById("majorTicks"),
    romanNumerals: document.getElementById("romanNumerals"),
    ornamentLayer: document.getElementById("ornamentLayer"),
    planetTracks: document.getElementById("planetTracks"),
    nightLayer: document.getElementById("nightLayer"),
    solarLayer: document.getElementById("solarLayer"),
    lunarLayer: document.getElementById("lunarLayer"),
    siderealLayer: document.getElementById("siderealLayer"),
    planetMarkers: document.getElementById("planetMarkers"),
    dateLine: document.getElementById("dateLine"),
    latLonLine: document.getElementById("latLonLine"),
    siderealLine: document.getElementById("siderealLine"),
    solarLine: document.getElementById("solarLine"),
    statusLine: document.getElementById("statusLine"),
    jdValue: document.getElementById("jdValue"),
    gmstValue: document.getElementById("gmstValue"),
    lstValue: document.getElementById("lstValue"),
    solarValue: document.getElementById("solarValue"),
    bodyRows: document.getElementById("bodyRows"),
    latInput: document.getElementById("latInput"),
    lonInput: document.getElementById("lonInput"),
    timeInput: document.getElementById("timeInput"),
    locateButton: document.getElementById("locateButton"),
    liveButton: document.getElementById("liveButton"),
    holdButton: document.getElementById("holdButton"),
    nowButton: document.getElementById("nowButton")
  };

  const handles = {
    siderealHour: null,
    siderealMinute: null,
    siderealSecond: null,
    sun: null,
    moon: null,
    night: null,
    planets: new Map()
  };

  init();

  function init() {
    buildDial();
    updateLocationInputs();
    updateTimeInput(new Date());
    bindEvents();
    tick();
    window.setInterval(tick, 1000);
    primeLocationFromPermission();
  }

  function bindEvents() {
    els.locateButton.addEventListener("click", () => useBrowserLocation(true));

    els.latInput.addEventListener("change", commitLocationInputs);
    els.lonInput.addEventListener("change", commitLocationInputs);

    els.timeInput.addEventListener("change", () => {
      const parsed = parseLocalDateTime(els.timeInput.value);
      if (parsed && !Number.isNaN(parsed.getTime())) {
        state.heldDate = parsed;
        setLiveMode(false);
        render(parsed);
      }
    });

    els.liveButton.addEventListener("click", () => setLiveMode(true));
    els.holdButton.addEventListener("click", () => {
      state.heldDate = currentRenderDate();
      setLiveMode(false);
      updateTimeInput(state.heldDate);
      render(state.heldDate);
    });
    els.nowButton.addEventListener("click", () => {
      state.heldDate = new Date();
      setLiveMode(true);
      updateTimeInput(state.heldDate);
      render(state.heldDate);
    });
  }

  function buildDial() {
    SEASONS.forEach(season => {
      svgEl("path", {
        class: `season-band ${season.className}`,
        d: arcPath(520, season.start, season.end)
      }, els.seasonBands);

      const labelPoint = polar(520, season.labelHour);
      svgEl("text", {
        class: "season-label",
        x: labelPoint.x,
        y: labelPoint.y
      }, els.seasonBands, season.label);
    });

    for (let i = 0; i < 96; i += 1) {
      if (i % 4 === 0) continue;
      const hour = i / 4;
      const outer = polar(436, hour);
      const inner = polar(i % 2 === 0 ? 421 : 427, hour);
      svgEl("line", {
        class: "minor-tick",
        x1: inner.x,
        y1: inner.y,
        x2: outer.x,
        y2: outer.y
      }, els.minorTicks);
    }

    for (let hour = 0; hour < 24; hour += 1) {
      const outer = polar(438, hour);
      const inner = polar(hour % 6 === 0 ? 385 : 400, hour);
      svgEl("line", {
        class: "major-tick",
        x1: inner.x,
        y1: inner.y,
        x2: outer.x,
        y2: outer.y
      }, els.majorTicks);

      const numeral = polar(456, hour);
      svgEl("text", {
        class: "hour-text",
        x: numeral.x,
        y: numeral.y
      }, els.romanNumerals, ROMAN_HOURS[hour]);
    }

    [148, 226, 302].forEach(radius => {
      svgEl("circle", { class: "ornament", r: radius }, els.ornamentLayer);
    });

    for (let hour = 0; hour < 24; hour += 2) {
      const a = polar(286, hour);
      const b = polar(286, hour + 8);
      svgEl("line", {
        class: "ornament",
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y
      }, els.ornamentLayer);
    }

    [334, 360, 386].forEach(radius => {
      svgEl("circle", { class: "planet-track", r: radius }, els.planetTracks);
    });

    handles.night = svgEl("g", {}, els.nightLayer);
    svgEl("line", {
      class: "night-hand",
      x1: 0,
      y1: 18,
      x2: 0,
      y2: -452
    }, handles.night);
    svgEl("circle", {
      class: "night-cap",
      cx: 0,
      cy: -464,
      r: 16
    }, handles.night);
    svgEl("path", {
      class: "night-cap",
      d: "M-7 -464 L0 -477 L7 -464 L0 -451 Z"
    }, handles.night);

    handles.sun = svgEl("g", {}, els.solarLayer);
    svgEl("line", {
      class: "hand-stem sun-stem",
      x1: 0,
      y1: 28,
      x2: 0,
      y2: -318
    }, handles.sun);
    const sunSymbol = svgEl("g", { transform: "translate(0 -344)" }, handles.sun);
    svgEl("circle", { class: "sun-disc", cx: 0, cy: 0, r: 18 }, sunSymbol);
    for (let i = 0; i < 12; i += 1) {
      const angle = i * 30;
      svgEl("line", {
        class: "sun-ray",
        x1: 0,
        y1: -25,
        x2: 0,
        y2: -39,
        transform: `rotate(${angle})`
      }, sunSymbol);
    }

    handles.moon = svgEl("g", {}, els.lunarLayer);
    svgEl("line", {
      class: "hand-stem moon-stem",
      x1: 0,
      y1: 24,
      x2: 0,
      y2: -292
    }, handles.moon);
    const moonSymbol = svgEl("g", { transform: "translate(0 -316)" }, handles.moon);
    svgEl("circle", { class: "moon-disc", cx: 0, cy: 0, r: 18 }, moonSymbol);
    svgEl("circle", { class: "moon-cut", cx: 9, cy: -2, r: 18 }, moonSymbol);

    handles.siderealHour = svgEl("g", {}, els.siderealLayer);
    svgEl("line", {
      class: "hand-stem hand-counter sidereal-hour",
      x1: 0,
      y1: 38,
      x2: 0,
      y2: -260
    }, handles.siderealHour);

    handles.siderealMinute = svgEl("g", {}, els.siderealLayer);
    svgEl("line", {
      class: "hand-stem hand-counter sidereal-minute",
      x1: 0,
      y1: 42,
      x2: 0,
      y2: -344
    }, handles.siderealMinute);

    handles.siderealSecond = svgEl("g", {}, els.siderealLayer);
    svgEl("line", {
      class: "hand-stem hand-counter sidereal-second",
      x1: 0,
      y1: 50,
      x2: 0,
      y2: -386
    }, handles.siderealSecond);

    PLANET_DEFS.forEach(def => {
      const marker = svgEl("g", {
        class: "planet-marker",
        id: `planet-${def.key}`
      }, els.planetMarkers);
      svgEl("rect", {
        x: -19,
        y: -17,
        width: 38,
        height: 34,
        rx: 7,
        ry: 7
      }, marker);
      svgEl("text", { x: 0, y: 1 }, marker, def.symbol);
      handles.planets.set(def.key, marker);
    });
  }

  function tick() {
    const date = currentRenderDate();
    if (state.live && document.activeElement !== els.timeInput) {
      updateTimeInput(date);
    }
    render(date);
  }

  function render(date) {
    const jd = julianDate(date);
    const sidereal = siderealTime(jd, state.lon);
    const ephemeris = computeEphemeris(jd);
    const sun = ephemeris.find(body => body.key === "sun");
    const moon = ephemeris.find(body => body.key === "moon");
    const apparentSolar = mod24(sidereal.lst - sun.raHours + 12);

    rotateHandle(handles.siderealHour, sidereal.lst * 15);
    rotateHandle(handles.siderealMinute, fractional(sidereal.lst) * 360);
    rotateHandle(handles.siderealSecond, fractional(sidereal.lst * 60) * 360);
    rotateHandle(handles.sun, sun.raHours * 15);
    rotateHandle(handles.night, mod24(sun.raHours + 12) * 15);
    rotateHandle(handles.moon, moon.raHours * 15);

    ephemeris
      .filter(body => body.type === "planet")
      .forEach(body => {
        const marker = handles.planets.get(body.key);
        const point = polar(body.lane, body.raHours);
        marker.setAttribute("transform", `translate(${round(point.x)} ${round(point.y)})`);
      });

    els.dateLine.textContent = `DATE ${formatLocalDateTime(date)}`;
    els.latLonLine.textContent = `LAT ${formatSigned(state.lat, 4)}  LON ${formatSigned(state.lon, 4)}`;
    els.siderealLine.textContent = `SIDEREAL ${formatHMS(sidereal.lst)}`;
    els.solarLine.textContent = `SOLAR ${formatHMS(apparentSolar)}`;
    els.statusLine.textContent = state.source;

    els.jdValue.textContent = jd.toFixed(5);
    els.gmstValue.textContent = formatHMS(sidereal.gmst);
    els.lstValue.textContent = formatHMS(sidereal.lst);
    els.solarValue.textContent = formatHMS(apparentSolar);

    renderBodyRows(ephemeris);
  }

  function renderBodyRows(ephemeris) {
    const rows = ephemeris.map(body => {
      const dec = `${body.decDeg >= 0 ? "+" : ""}${body.decDeg.toFixed(1)} deg`;
      const distance = body.distance ? `${body.distance.toFixed(body.distance > 3 ? 2 : 3)} AU` : "";
      return `
        <div class="body-row">
          <span class="glyph">${body.symbol}</span>
          <span>
            <span class="name">${body.name}</span>
            <span class="meta">RA ${formatRA(body.raHours)} · DEC ${dec}</span>
          </span>
          <strong>${distance}</strong>
        </div>
      `;
    }).join("");

    els.bodyRows.innerHTML = rows;
  }

  function currentRenderDate() {
    return state.live ? new Date() : new Date(state.heldDate.getTime());
  }

  function setLiveMode(live) {
    state.live = live;
    els.liveButton.classList.toggle("is-active", live);
    els.holdButton.classList.toggle("is-active", !live);
  }

  function commitLocationInputs() {
    const lat = Number(els.latInput.value);
    const lon = Number(els.lonInput.value);

    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      state.lat = clamp(lat, -90, 90);
      state.lon = normalizeLongitude(lon);
      state.source = "MANUAL LOCATION";
      updateLocationInputs();
      render(currentRenderDate());
    }
  }

  function updateLocationInputs() {
    els.latInput.value = state.lat.toFixed(4);
    els.lonInput.value = state.lon.toFixed(4);
  }

  function updateTimeInput(date) {
    els.timeInput.value = toLocalDateTimeValue(date);
  }

  function useBrowserLocation(userRequested) {
    if (!navigator.geolocation) {
      state.source = "LOCATION UNAVAILABLE";
      render(currentRenderDate());
      return;
    }

    state.source = "LOCATING";
    render(currentRenderDate());

    navigator.geolocation.getCurrentPosition(
      position => {
        state.lat = position.coords.latitude;
        state.lon = normalizeLongitude(position.coords.longitude);
        state.source = userRequested ? "BROWSER LOCATION" : "SAVED LOCATION";
        updateLocationInputs();
        render(currentRenderDate());
      },
      error => {
        const label = error && error.code === error.PERMISSION_DENIED ? "LOCATION DENIED" : "LOCATION FAILED";
        state.source = `${label} · MANUAL`;
        render(currentRenderDate());
      },
      {
        enableHighAccuracy: false,
        timeout: 9000,
        maximumAge: 300000
      }
    );
  }

  function primeLocationFromPermission() {
    if (!navigator.geolocation || !navigator.permissions || !navigator.permissions.query) return;

    navigator.permissions.query({ name: "geolocation" })
      .then(permission => {
        if (permission.state === "granted") {
          useBrowserLocation(false);
        }
      })
      .catch(() => {
        state.source = DEFAULT_LOCATION.source;
      });
  }

  function computeEphemeris(jd) {
    const d = jd - 2451543.5;
    const sunElements = {
      N: 0,
      i: 0,
      w: 282.9404 + 4.70935e-5 * d,
      a: 1.000000,
      e: 0.016709 - 1.151e-9 * d,
      M: 356.0470 + 0.9856002585 * d
    };
    const sunEcl = orbitPosition(sunElements);
    const sunEqu = rectEclToEqu(sunEcl.x, sunEcl.y, sunEcl.z, jd);
    const moon = moonPosition(jd, d, sunElements);

    const bodies = [
      {
        key: "sun",
        type: "luminary",
        name: "SOL",
        symbol: "☉",
        raHours: sunEqu.raHours,
        decDeg: sunEqu.decDeg,
        distance: sunEcl.r
      },
      moon
    ];

    PLANET_DEFS.forEach(def => {
      const heliocentric = orbitPosition(def.elements(d));
      const geocentric = {
        x: heliocentric.x + sunEcl.x,
        y: heliocentric.y + sunEcl.y,
        z: heliocentric.z + sunEcl.z
      };
      const equatorial = rectEclToEqu(geocentric.x, geocentric.y, geocentric.z, jd);
      bodies.push({
        key: def.key,
        type: "planet",
        name: def.name,
        symbol: def.symbol,
        lane: def.lane,
        raHours: equatorial.raHours,
        decDeg: equatorial.decDeg,
        distance: Math.hypot(geocentric.x, geocentric.y, geocentric.z)
      });
    });

    return bodies;
  }

  function moonPosition(jd, d, sunElements) {
    const N = normalizeDegrees(125.1228 - 0.0529538083 * d);
    const i = 5.1454;
    const w = normalizeDegrees(318.0634 + 0.1643573223 * d);
    const a = 60.2666;
    const e = 0.054900;
    const M = normalizeDegrees(115.3654 + 13.0649929509 * d);

    const raw = orbitPosition({ N, i, w, a, e, M });
    let lon = normalizeDegrees(Math.atan2(raw.y, raw.x) * RAD);
    let lat = Math.atan2(raw.z, Math.hypot(raw.x, raw.y)) * RAD;

    const Ms = normalizeDegrees(sunElements.M);
    const Ls = normalizeDegrees(sunElements.M + sunElements.w);
    const Lm = normalizeDegrees(N + w + M);
    const D = normalizeDegrees(Lm - Ls);
    const F = normalizeDegrees(Lm - N);

    lon +=
      -1.274 * sinDeg(M - 2 * D) +
      0.658 * sinDeg(2 * D) +
      -0.186 * sinDeg(Ms) +
      -0.059 * sinDeg(2 * M - 2 * D) +
      -0.057 * sinDeg(M - 2 * D + Ms) +
      0.053 * sinDeg(M + 2 * D) +
      0.046 * sinDeg(2 * D - Ms) +
      0.041 * sinDeg(M - Ms) +
      -0.035 * sinDeg(D) +
      -0.031 * sinDeg(M + Ms) +
      -0.015 * sinDeg(2 * F - 2 * D) +
      0.011 * sinDeg(M - 4 * D);

    lat +=
      -0.173 * sinDeg(F - 2 * D) +
      -0.055 * sinDeg(M - F - 2 * D) +
      -0.046 * sinDeg(M + F - 2 * D) +
      0.033 * sinDeg(F + 2 * D) +
      0.017 * sinDeg(2 * M + F);

    const lonRad = normalizeDegrees(lon) * DEG;
    const latRad = lat * DEG;
    const r = raw.r;
    const x = r * Math.cos(lonRad) * Math.cos(latRad);
    const y = r * Math.sin(lonRad) * Math.cos(latRad);
    const z = r * Math.sin(latRad);
    const equ = rectEclToEqu(x, y, z, jd);

    return {
      key: "moon",
      type: "luminary",
      name: "LUNA",
      symbol: "☾",
      raHours: equ.raHours,
      decDeg: equ.decDeg,
      distance: r / 23454.8
    };
  }

  function orbitPosition(elements) {
    const N = elements.N * DEG;
    const i = elements.i * DEG;
    const w = elements.w * DEG;
    const e = elements.e;
    const a = elements.a;
    const M = normalizeDegrees(elements.M) * DEG;
    const E = eccentricAnomaly(M, e);

    const xv = a * (Math.cos(E) - e);
    const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const v = Math.atan2(yv, xv);
    const r = Math.hypot(xv, yv);
    const u = v + w;

    const cosN = Math.cos(N);
    const sinN = Math.sin(N);
    const cosi = Math.cos(i);
    const sini = Math.sin(i);
    const cosu = Math.cos(u);
    const sinu = Math.sin(u);

    return {
      x: r * (cosN * cosu - sinN * sinu * cosi),
      y: r * (sinN * cosu + cosN * sinu * cosi),
      z: r * (sinu * sini),
      r
    };
  }

  function eccentricAnomaly(M, e) {
    let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
    for (let iteration = 0; iteration < 7; iteration += 1) {
      E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    }
    return E;
  }

  function rectEclToEqu(x, y, z, jd) {
    const T = (jd - 2451545.0) / 36525;
    const eps = (23.439291 - 0.0130042 * T) * DEG;
    const xe = x;
    const ye = y * Math.cos(eps) - z * Math.sin(eps);
    const ze = y * Math.sin(eps) + z * Math.cos(eps);
    const ra = normalizeRadians(Math.atan2(ye, xe));
    const dec = Math.atan2(ze, Math.hypot(xe, ye));

    return {
      raHours: ra * RAD / 15,
      decDeg: dec * RAD
    };
  }

  function siderealTime(jd, lon) {
    const d = jd - 2451545.0;
    const gmst = mod24(18.697374558 + 24.06570982441908 * d);
    const lst = mod24(gmst + lon / 15);
    return { gmst, lst };
  }

  function julianDate(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  function svgEl(name, attrs = {}, parent, text) {
    const el = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => {
      el.setAttribute(key, String(value));
    });
    if (text !== undefined) {
      el.textContent = text;
    }
    if (parent) {
      parent.appendChild(el);
    }
    return el;
  }

  function arcPath(radius, startHour, endHour) {
    const span = endHour - startHour;
    const start = polar(radius, startHour);
    const end = polar(radius, endHour);
    const largeArc = Math.abs(span) > 12 ? 1 : 0;
    return `M ${round(start.x)} ${round(start.y)} A ${radius} ${radius} 0 ${largeArc} 1 ${round(end.x)} ${round(end.y)}`;
  }

  function polar(radius, hour) {
    const angle = mod24(hour) / 24 * TAU;
    return {
      x: radius * Math.sin(angle),
      y: -radius * Math.cos(angle)
    };
  }

  function rotateHandle(node, degrees) {
    node.setAttribute("transform", `rotate(${round(degrees)})`);
  }

  function toLocalDateTimeValue(date) {
    const year = date.getFullYear();
    const month = pad2(date.getMonth() + 1);
    const day = pad2(date.getDate());
    const hour = pad2(date.getHours());
    const minute = pad2(date.getMinutes());
    const second = pad2(date.getSeconds());
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }

  function parseLocalDateTime(value) {
    if (!value) return null;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!match) return null;

    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6] || 0)
    );
  }

  function formatLocalDateTime(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
  }

  function formatHMS(hours) {
    const totalSeconds = Math.round(mod24(hours) * 3600) % 86400;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  }

  function formatRA(hours) {
    const totalMinutes = Math.round(mod24(hours) * 60) % 1440;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${pad2(h)}h ${pad2(m)}m`;
  }

  function formatSigned(value, decimals) {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(decimals)}`;
  }

  function normalizeLongitude(lon) {
    return ((lon + 180) % 360 + 360) % 360 - 180;
  }

  function normalizeDegrees(value) {
    return ((value % 360) + 360) % 360;
  }

  function normalizeRadians(value) {
    return ((value % TAU) + TAU) % TAU;
  }

  function mod24(value) {
    return ((value % 24) + 24) % 24;
  }

  function fractional(value) {
    return value - Math.floor(value);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function sinDeg(value) {
    return Math.sin(value * DEG);
  }

  function round(value) {
    return Number(value).toFixed(3);
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }
})();
