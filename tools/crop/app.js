(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const elements = {
    addRegionBtn: $("#addRegionBtn"),
    canvas: $("#previewCanvas"),
    canvasStage: $("#canvasStage"),
    chooseBtn: $("#chooseBtn"),
    downloadAllBtn: $("#downloadAllBtn"),
    dropzone: $("#dropzone"),
    fileDimensions: $("#fileDimensions"),
    fileInput: $("#fileInput"),
    fileName: $("#fileName"),
    generateBtn: $("#generateBtn"),
    imageMeta: $("#imageMeta"),
    imageType: $("#imageType"),
    message: $("#message"),
    regionCount: $("#regionCount"),
    regionEditor: $("#regionEditor"),
    regionHeight: $("#regionHeight"),
    regionList: $("#regionList"),
    regionWidth: $("#regionWidth"),
    regionX: $("#regionX"),
    regionY: $("#regionY"),
    removeRegionBtn: $("#removeRegionBtn"),
    replaceBtn: $("#replaceBtn"),
    resetBtn: $("#resetBtn"),
    resultsGrid: $("#resultsGrid"),
    resultsPanel: $("#resultsPanel"),
    resultsSummary: $("#resultsSummary"),
    splitPresetBtn: $("#splitPresetBtn")
  };

  const context = elements.canvas.getContext("2d");
  const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  const regionColors = ["#8ed8ff", "#f3c874", "#83e7c2", "#ef9bc8", "#c4a6ff", "#ff9f9f"];
  const state = {
    file: null,
    image: null,
    regions: [],
    selectedId: null,
    nextId: 1,
    interaction: null,
    results: []
  };

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function selectedRegion() {
    return state.regions.find((region) => region.id === state.selectedId) || null;
  }

  function makeRegion(x, y, width, height) {
    return {
      id: state.nextId++,
      x,
      y,
      width,
      height,
      ratio: "free",
      color: regionColors[(state.nextId - 2) % regionColors.length]
    };
  }

  function applySplitPreset() {
    if (!state.image) return;
    const leftWidth = Math.floor(state.image.naturalWidth / 2);
    state.regions = [
      makeRegion(0, 0, leftWidth, state.image.naturalHeight),
      makeRegion(leftWidth, 0, state.image.naturalWidth - leftWidth, state.image.naturalHeight)
    ];
    state.selectedId = state.regions[0].id;
    clearResults();
    renderAll();
    setMessage("已应用默认的左右对半设置，可继续添加或调整区域。");
  }

  function addRegion() {
    if (!state.image) return;
    const width = Math.max(1, Math.round(state.image.naturalWidth * 0.6));
    const height = Math.max(1, Math.round(state.image.naturalHeight * 0.6));
    const offset = (state.regions.length % 5) * 0.03;
    const x = clamp(Math.round(state.image.naturalWidth * (0.2 + offset)), 0, state.image.naturalWidth - width);
    const y = clamp(Math.round(state.image.naturalHeight * (0.2 + offset)), 0, state.image.naturalHeight - height);
    const region = makeRegion(x, y, width, height);
    state.regions.push(region);
    state.selectedId = region.id;
    clearResults();
    renderAll();
    setMessage(`已添加区域 ${state.regions.length}。`);
  }

  function removeSelectedRegion() {
    const index = state.regions.findIndex((region) => region.id === state.selectedId);
    if (index < 0) return;
    state.regions.splice(index, 1);
    const next = state.regions[Math.min(index, state.regions.length - 1)];
    state.selectedId = next ? next.id : null;
    clearResults();
    renderAll();
    setMessage(state.regions.length ? "已删除当前区域。" : "当前没有裁剪区域，请添加一个区域。");
  }

  function setMessage(text, isError = false) {
    elements.message.textContent = text;
    elements.message.style.color = isError ? "#ffb4b4" : "";
  }

  function configureCanvas() {
    const maxPreviewSide = 1400;
    const scale = Math.min(1, maxPreviewSide / Math.max(state.image.naturalWidth, state.image.naturalHeight));
    elements.canvas.width = Math.max(1, Math.round(state.image.naturalWidth * scale));
    elements.canvas.height = Math.max(1, Math.round(state.image.naturalHeight * scale));
  }

  function drawPreview() {
    if (!state.image) return;
    const canvasScale = elements.canvas.width / state.image.naturalWidth;
    context.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    context.drawImage(state.image, 0, 0, elements.canvas.width, elements.canvas.height);
    context.fillStyle = "rgb(5 13 20 / 62%)";
    context.fillRect(0, 0, elements.canvas.width, elements.canvas.height);

    state.regions.forEach((region, index) => {
      const x = region.x * canvasScale;
      const y = region.y * canvasScale;
      const width = region.width * canvasScale;
      const height = region.height * canvasScale;
      context.drawImage(
        state.image,
        region.x,
        region.y,
        region.width,
        region.height,
        x,
        y,
        width,
        height
      );
      context.save();
      context.strokeStyle = region.color;
      context.lineWidth = region.id === state.selectedId ? 3 : 1.5;
      context.strokeRect(x + 0.75, y + 0.75, Math.max(0, width - 1.5), Math.max(0, height - 1.5));
      drawRegionLabel(index + 1, x, y, region.color);
      if (region.id === state.selectedId) drawHandles(x, y, width, height, region.color);
      context.restore();
    });
  }

  function drawRegionLabel(number, x, y, color) {
    const label = String(number).padStart(2, "0");
    context.font = "600 12px system-ui, sans-serif";
    const labelWidth = context.measureText(label).width + 14;
    const labelY = y < 27 ? y + 4 : y - 25;
    context.fillStyle = color;
    context.fillRect(x, labelY, labelWidth, 21);
    context.fillStyle = "#142431";
    context.fillText(label, x + 7, labelY + 15);
  }

  function drawHandles(x, y, width, height, color) {
    const size = 10;
    const points = [[x, y], [x + width, y], [x, y + height], [x + width, y + height]];
    context.fillStyle = "#182532";
    context.strokeStyle = color;
    context.lineWidth = 2;
    points.forEach(([pointX, pointY]) => {
      context.fillRect(pointX - size / 2, pointY - size / 2, size, size);
      context.strokeRect(pointX - size / 2, pointY - size / 2, size, size);
    });
  }

  function renderRegionList() {
    elements.regionList.replaceChildren();
    if (!state.regions.length) {
      const empty = document.createElement("p");
      empty.className = "crop-empty-copy";
      empty.textContent = "还没有裁剪区域。";
      elements.regionList.append(empty);
      return;
    }

    state.regions.forEach((region, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `crop-region-item${region.id === state.selectedId ? " is-active" : ""}`;
      button.style.setProperty("--region-color", region.color);
      button.setAttribute("aria-pressed", String(region.id === state.selectedId));
      const swatch = document.createElement("span");
      swatch.className = "crop-region-item__swatch";
      swatch.setAttribute("aria-hidden", "true");
      const copy = document.createElement("span");
      copy.className = "crop-region-item__copy";
      const title = document.createElement("strong");
      title.textContent = `区域 ${index + 1}`;
      const size = document.createElement("small");
      size.textContent = `${Math.round(region.width)} × ${Math.round(region.height)} px`;
      copy.append(title, size);
      const order = document.createElement("span");
      order.className = "crop-region-item__index";
      order.textContent = String(index + 1).padStart(2, "0");
      button.append(swatch, copy, order);
      button.addEventListener("click", () => {
        state.selectedId = region.id;
        renderAll();
      });
      elements.regionList.append(button);
    });
  }

  function syncEditor(updateValues = true) {
    const region = selectedRegion();
    elements.regionEditor.disabled = !region;
    elements.removeRegionBtn.disabled = !region;
    if (region && updateValues) {
      elements.regionX.value = Math.round(region.x);
      elements.regionY.value = Math.round(region.y);
      elements.regionWidth.value = Math.round(region.width);
      elements.regionHeight.value = Math.round(region.height);
      elements.regionX.max = Math.max(0, state.image.naturalWidth - 1);
      elements.regionY.max = Math.max(0, state.image.naturalHeight - 1);
      elements.regionWidth.max = state.image.naturalWidth;
      elements.regionHeight.max = state.image.naturalHeight;
    }
    document.querySelectorAll("[data-ratio]").forEach((button) => {
      button.setAttribute("aria-pressed", String(Boolean(region) && String(region.ratio) === button.dataset.ratio));
    });
  }

  function renderAll() {
    const hasImage = Boolean(state.image);
    elements.regionCount.textContent = `${state.regions.length} 个区域`;
    elements.addRegionBtn.disabled = !hasImage;
    elements.splitPresetBtn.disabled = !hasImage;
    elements.resetBtn.disabled = !hasImage;
    elements.generateBtn.disabled = !hasImage || state.regions.length === 0;
    elements.generateBtn.textContent = state.regions.length ? `生成 ${state.regions.length} 张裁剪图片` : "生成裁剪结果";
    renderRegionList();
    syncEditor();
    drawPreview();
  }

  function clearResults() {
    state.results.forEach((result) => URL.revokeObjectURL(result.url));
    state.results = [];
    elements.resultsGrid.replaceChildren();
    elements.resultsPanel.classList.add("is-hidden");
  }

  async function loadFile(file) {
    if (!file || !supportedTypes.has(file.type)) {
      setMessage("请选择 JPG、PNG 或 WEBP 图片。", true);
      return;
    }
    const sourceUrl = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      URL.revokeObjectURL(sourceUrl);
      state.file = file;
      state.image = image;
      state.nextId = 1;
      state.regions = [];
      state.selectedId = null;
      clearResults();
      configureCanvas();
      elements.fileName.textContent = file.name;
      elements.fileDimensions.textContent = `${image.naturalWidth} × ${image.naturalHeight} px`;
      elements.imageType.textContent = file.type.split("/")[1].toUpperCase().replace("JPEG", "JPG");
      elements.dropzone.classList.add("is-hidden");
      elements.canvasStage.classList.remove("is-hidden");
      elements.imageMeta.classList.remove("is-hidden");
      elements.replaceBtn.classList.remove("is-hidden");
      applySplitPreset();
    };
    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      setMessage("图片读取失败，请换一张图片重试。", true);
    };
    image.src = sourceUrl;
  }

  function pointFromEvent(event) {
    const bounds = elements.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * state.image.naturalWidth / bounds.width,
      y: (event.clientY - bounds.top) * state.image.naturalHeight / bounds.height
    };
  }

  function hitTest(point) {
    const canvasScale = elements.canvas.getBoundingClientRect().width / state.image.naturalWidth;
    const tolerance = 13 / canvasScale;
    const ordered = [...state.regions].sort((a, b) => Number(a.id === state.selectedId) - Number(b.id === state.selectedId));
    for (let index = ordered.length - 1; index >= 0; index--) {
      const region = ordered[index];
      const corners = {
        nw: [region.x, region.y],
        ne: [region.x + region.width, region.y],
        sw: [region.x, region.y + region.height],
        se: [region.x + region.width, region.y + region.height]
      };
      for (const [mode, [x, y]] of Object.entries(corners)) {
        if (Math.abs(point.x - x) <= tolerance && Math.abs(point.y - y) <= tolerance) return { region, mode };
      }
      if (point.x >= region.x && point.x <= region.x + region.width && point.y >= region.y && point.y <= region.y + region.height) {
        return { region, mode: "move" };
      }
    }
    return null;
  }

  function resizeFromCorner(region, mode, point) {
    const source = state.interaction.original;
    const right = source.x + source.width;
    const bottom = source.y + source.height;
    const anchors = {
      nw: [right, bottom, -1, -1],
      ne: [source.x, bottom, 1, -1],
      sw: [right, source.y, -1, 1],
      se: [source.x, source.y, 1, 1]
    };
    const [anchorX, anchorY, directionX, directionY] = anchors[mode];
    const minSize = Math.max(4, Math.min(state.image.naturalWidth, state.image.naturalHeight) * 0.01);
    const limitedX = directionX > 0
      ? clamp(point.x, anchorX + minSize, state.image.naturalWidth)
      : clamp(point.x, 0, anchorX - minSize);
    const limitedY = directionY > 0
      ? clamp(point.y, anchorY + minSize, state.image.naturalHeight)
      : clamp(point.y, 0, anchorY - minSize);
    let width = Math.abs(limitedX - anchorX);
    let height = Math.abs(limitedY - anchorY);

    if (region.ratio !== "free") {
      const ratio = Number(region.ratio);
      if (width / height > ratio) height = width / ratio;
      else width = height * ratio;
      const maxWidth = directionX > 0 ? state.image.naturalWidth - anchorX : anchorX;
      const maxHeight = directionY > 0 ? state.image.naturalHeight - anchorY : anchorY;
      const fit = Math.min(1, maxWidth / width, maxHeight / height);
      width *= fit;
      height *= fit;
    }

    region.width = width;
    region.height = height;
    region.x = directionX > 0 ? anchorX : anchorX - width;
    region.y = directionY > 0 ? anchorY : anchorY - height;
  }

  function updateFromEditor(event) {
    const region = selectedRegion();
    if (!region || !state.image) return;
    const input = event.currentTarget;
    const value = Number(input.value);
    if (!Number.isFinite(value)) return;
    if (input === elements.regionX) region.x = clamp(value, 0, state.image.naturalWidth - region.width);
    if (input === elements.regionY) region.y = clamp(value, 0, state.image.naturalHeight - region.height);
    if (input === elements.regionWidth) {
      region.width = clamp(value, 1, state.image.naturalWidth - region.x);
      region.ratio = "free";
    }
    if (input === elements.regionHeight) {
      region.height = clamp(value, 1, state.image.naturalHeight - region.y);
      region.ratio = "free";
    }
    clearResults();
    renderAll();
  }

  function applyRatio(value) {
    const region = selectedRegion();
    if (!region) return;
    region.ratio = value;
    if (value !== "free") {
      const ratio = Number(value);
      const centerX = region.x + region.width / 2;
      const centerY = region.y + region.height / 2;
      let width = region.width;
      let height = region.height;
      if (width / height > ratio) width = height * ratio;
      else height = width / ratio;
      region.x = clamp(centerX - width / 2, 0, state.image.naturalWidth - width);
      region.y = clamp(centerY - height / 2, 0, state.image.naturalHeight - height);
      region.width = width;
      region.height = height;
    }
    clearResults();
    renderAll();
  }

  function outputExtension() {
    return state.file.type === "image/jpeg" ? "jpg" : state.file.type.split("/")[1];
  }

  function outputName(index) {
    const base = state.file.name.replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]+/g, "-") || "image";
    return `${base}-crop-${String(index + 1).padStart(2, "0")}.${outputExtension()}`;
  }

  function cropToBlob(region) {
    const x = Math.round(region.x);
    const y = Math.round(region.y);
    const width = Math.max(1, Math.round(region.width));
    const height = Math.max(1, Math.round(region.height));
    const output = document.createElement("canvas");
    output.width = width;
    output.height = height;
    const outputContext = output.getContext("2d");
    outputContext.drawImage(state.image, x, y, width, height, 0, 0, width, height);
    return new Promise((resolve, reject) => {
      output.toBlob((blob) => blob ? resolve(blob) : reject(new Error("图片编码失败")), state.file.type, 0.92);
    });
  }

  async function generateResults() {
    if (!state.image || !state.regions.length) return;
    elements.generateBtn.disabled = true;
    setMessage("正在生成裁剪图片…");
    clearResults();
    try {
      const blobs = await Promise.all(state.regions.map(cropToBlob));
      state.results = blobs.map((blob, index) => ({ blob, name: outputName(index), url: URL.createObjectURL(blob) }));
      renderResults();
      setMessage(`已生成 ${state.results.length} 张裁剪图片，不包含原始图片。`);
    } catch (error) {
      setMessage(error.message || "生成失败，请重试。", true);
    } finally {
      elements.generateBtn.disabled = state.regions.length === 0;
    }
  }

  function renderResults() {
    elements.resultsGrid.replaceChildren();
    state.results.forEach((result, index) => {
      const card = document.createElement("article");
      card.className = "crop-result-card";
      const preview = document.createElement("img");
      preview.src = result.url;
      preview.alt = `裁剪区域 ${index + 1} 的结果`;
      const footer = document.createElement("div");
      footer.className = "crop-result-card__footer";
      const copy = document.createElement("span");
      copy.className = "crop-result-card__copy";
      const name = document.createElement("strong");
      name.textContent = result.name;
      const size = document.createElement("small");
      size.textContent = `${Math.max(1, Math.round(state.regions[index].width))} × ${Math.max(1, Math.round(state.regions[index].height))} px`;
      copy.append(name, size);
      const download = document.createElement("a");
      download.className = "crop-result-card__download";
      download.href = result.url;
      download.download = result.name;
      download.textContent = "保存";
      footer.append(copy, download);
      card.append(preview, footer);
      elements.resultsGrid.append(card);
    });
    elements.resultsSummary.textContent = `共 ${state.results.length} 张，仅包含所选裁剪区域。`;
    elements.resultsPanel.classList.remove("is-hidden");
    elements.resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function downloadAll() {
    state.results.forEach((result, index) => {
      window.setTimeout(() => {
        const link = document.createElement("a");
        link.href = result.url;
        link.download = result.name;
        link.click();
      }, index * 160);
    });
  }

  elements.chooseBtn.addEventListener("click", () => elements.fileInput.click());
  elements.replaceBtn.addEventListener("click", () => elements.fileInput.click());
  elements.fileInput.addEventListener("change", () => {
    const file = elements.fileInput.files[0];
    elements.fileInput.value = "";
    loadFile(file);
  });
  elements.addRegionBtn.addEventListener("click", addRegion);
  elements.removeRegionBtn.addEventListener("click", removeSelectedRegion);
  elements.splitPresetBtn.addEventListener("click", applySplitPreset);
  elements.resetBtn.addEventListener("click", applySplitPreset);
  elements.generateBtn.addEventListener("click", generateResults);
  elements.downloadAllBtn.addEventListener("click", downloadAll);

  ["dragenter", "dragover"].forEach((type) => {
    elements.dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      elements.dropzone.classList.add("is-dragging");
    });
  });
  ["dragleave", "drop"].forEach((type) => {
    elements.dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      elements.dropzone.classList.remove("is-dragging");
    });
  });
  elements.dropzone.addEventListener("drop", (event) => loadFile(event.dataTransfer.files[0]));

  elements.canvas.addEventListener("pointerdown", (event) => {
    if (!state.image) return;
    const point = pointFromEvent(event);
    const hit = hitTest(point);
    if (!hit) return;
    state.selectedId = hit.region.id;
    state.interaction = {
      mode: hit.mode,
      start: point,
      original: { x: hit.region.x, y: hit.region.y, width: hit.region.width, height: hit.region.height }
    };
    elements.canvas.setPointerCapture(event.pointerId);
    renderAll();
  });

  elements.canvas.addEventListener("pointermove", (event) => {
    if (!state.interaction) return;
    const region = selectedRegion();
    const point = pointFromEvent(event);
    if (state.interaction.mode === "move") {
      const deltaX = point.x - state.interaction.start.x;
      const deltaY = point.y - state.interaction.start.y;
      region.x = clamp(state.interaction.original.x + deltaX, 0, state.image.naturalWidth - region.width);
      region.y = clamp(state.interaction.original.y + deltaY, 0, state.image.naturalHeight - region.height);
    } else {
      resizeFromCorner(region, state.interaction.mode, point);
    }
    syncEditor();
    drawPreview();
  });

  function finishPointerInteraction(event) {
    if (!state.interaction) return;
    state.interaction = null;
    if (elements.canvas.hasPointerCapture(event.pointerId)) elements.canvas.releasePointerCapture(event.pointerId);
    clearResults();
    renderAll();
    setMessage("区域已更新。生成结果后可以逐张保存或保存全部。");
  }

  elements.canvas.addEventListener("pointerup", finishPointerInteraction);
  elements.canvas.addEventListener("pointercancel", finishPointerInteraction);

  elements.canvas.addEventListener("keydown", (event) => {
    const region = selectedRegion();
    if (!region || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const amount = event.shiftKey ? 10 : 1;
    if (event.key === "ArrowLeft") region.x = clamp(region.x - amount, 0, state.image.naturalWidth - region.width);
    if (event.key === "ArrowRight") region.x = clamp(region.x + amount, 0, state.image.naturalWidth - region.width);
    if (event.key === "ArrowUp") region.y = clamp(region.y - amount, 0, state.image.naturalHeight - region.height);
    if (event.key === "ArrowDown") region.y = clamp(region.y + amount, 0, state.image.naturalHeight - region.height);
    clearResults();
    renderAll();
  });

  [elements.regionX, elements.regionY, elements.regionWidth, elements.regionHeight]
    .forEach((input) => input.addEventListener("change", updateFromEditor));
  document.querySelectorAll("[data-ratio]").forEach((button) => {
    button.addEventListener("click", () => applyRatio(button.dataset.ratio));
  });

  window.addEventListener("beforeunload", () => {
    state.results.forEach((result) => URL.revokeObjectURL(result.url));
  });
})();
