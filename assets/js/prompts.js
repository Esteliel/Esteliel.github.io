(function () {
  'use strict';

  var STORAGE_KEY = 'esteliel.prompt-manager.v1';
  var seedPrompts = [
    {
      id: 'writing-polish',
      title: '文章润色助手',
      category: '写作',
      tags: ['中文', '润色'],
      description: '保留原意，改善一段文字的节奏、清晰度和语气。',
      content: '请帮我润色下面的文字。保留原意和事实，不要凭空补充信息。\n\n要求：\n1. 先给出润色后的版本。\n2. 再用 3 条要点说明主要改动。\n3. 使用自然、克制的中文。\n\n原文：\n{{在这里粘贴文字}}'
    },
    {
      id: 'meeting-summary',
      title: '会议纪要整理',
      category: '工作',
      tags: ['总结', '结构化'],
      description: '将零散的会议记录整理成可执行的纪要。',
      content: '请把下面的会议记录整理成结构清晰的会议纪要。\n\n输出格式：\n- 会议主题\n- 关键结论\n- 待办事项（负责人 / 截止时间 / 状态）\n- 待确认问题\n\n不要猜测记录中没有出现的信息；缺失内容请标记为“待补充”。\n\n会议记录：\n{{在这里粘贴记录}}'
    },
    {
      id: 'idea-expander',
      title: '把想法变成计划',
      category: '思考',
      tags: ['拆解', '行动'],
      description: '从一个模糊的想法出发，拆出下一步能执行的计划。',
      content: '我有一个想法：{{描述想法}}\n\n请先用一句话复述你对它的理解，然后帮我：\n1. 明确目标和成功标准。\n2. 列出实现它需要解决的 3—5 个关键问题。\n3. 给出一个一周内可以开始的最小行动计划。\n4. 指出最大的风险，以及一个低成本的验证方式。'
    }
  ];

  var list = document.getElementById('prompt-list');
  if (!list) return;

  var search = document.getElementById('prompt-search');
  var category = document.getElementById('prompt-category');
  var summary = document.getElementById('prompt-summary');
  var empty = document.getElementById('prompt-empty');
  var emptyTitle = document.getElementById('prompt-empty-title');
  var emptyCopy = document.getElementById('prompt-empty-copy');
  var dialog = document.getElementById('prompt-dialog');
  var form = document.getElementById('prompt-form');
  var importInput = document.getElementById('prompt-import');
  var state = {
    prompts: loadPrompts(),
    query: '',
    category: ''
  };

  function loadPrompts() {
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(normalizePrompt).filter(Boolean);
      }
    } catch (error) {
      // Private browsing and disabled storage should not make the page unusable.
    }
    return seedPrompts.map(normalizePrompt);
  }

  function savePrompts() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.prompts));
    } catch (error) {
      // Keep the in-memory list available if storage is unavailable.
    }
  }

  function normalizePrompt(prompt) {
    if (!prompt || typeof prompt !== 'object') return null;
    var title = String(prompt.title || '').trim();
    var content = String(prompt.content || '').trim();
    if (!title || !content) return null;
    var tags = Array.isArray(prompt.tags) ? prompt.tags : String(prompt.tags || '').split(/[,，]/);
    return {
      id: String(prompt.id || createId()),
      title: title.slice(0, 80),
      category: String(prompt.category || '未分类').trim().slice(0, 30) || '未分类',
      tags: tags.map(function (tag) { return String(tag).trim(); }).filter(Boolean).filter(unique).slice(0, 12),
      description: String(prompt.description || '').trim().slice(0, 160),
      content: content,
      updatedAt: prompt.updatedAt || new Date().toISOString()
    };
  }

  function unique(value, index, values) {
    return values.indexOf(value) === index;
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'prompt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getFilteredPrompts() {
    var query = state.query.toLocaleLowerCase();
    return state.prompts.filter(function (prompt) {
      var matchesCategory = !state.category || prompt.category === state.category;
      if (!matchesCategory) return false;
      if (!query) return true;
      var searchable = [prompt.title, prompt.category, prompt.description, prompt.content].concat(prompt.tags).join(' ').toLocaleLowerCase();
      return searchable.indexOf(query) !== -1;
    });
  }

  function renderCategories() {
    var categories = state.prompts.map(function (prompt) { return prompt.category; }).filter(unique).sort();
    var options = '<option value="">全部分类</option>' + categories.map(function (item) {
      return '<option value="' + escapeHtml(item) + '">' + escapeHtml(item) + '</option>';
    }).join('');
    category.innerHTML = options;
    category.value = categories.indexOf(state.category) === -1 ? '' : state.category;
    state.category = category.value;
  }

  function render() {
    renderCategories();
    var visible = getFilteredPrompts();
    summary.textContent = state.prompts.length + ' 条提示词 · 当前显示 ' + visible.length + ' 条';
    list.innerHTML = visible.map(renderCard).join('');
    var noPrompts = state.prompts.length === 0;
    empty.hidden = visible.length !== 0;
    emptyTitle.textContent = noPrompts ? '还没有提示词' : '还没有匹配的提示词';
    emptyCopy.textContent = noPrompts ? '新建一条提示词，把常用工作流收进来。' : '换个关键词，或者清除筛选试试。';
  }

  function renderCard(prompt) {
    var tags = prompt.tags.map(function (tag) {
      return '<span class="prompt-tag">' + escapeHtml(tag) + '</span>';
    }).join('');
    var preview = prompt.content.length > 420 ? prompt.content.slice(0, 420) + '…' : prompt.content;
    return '<article class="prompt-card" data-prompt-id="' + escapeHtml(prompt.id) + '">' +
      '<header class="prompt-card__header"><h2>' + escapeHtml(prompt.title) + '</h2><span class="prompt-card__category">' + escapeHtml(prompt.category) + '</span></header>' +
      '<p class="prompt-card__description">' + escapeHtml(prompt.description || '暂无简介') + '</p>' +
      '<pre class="prompt-card__content"><code>' + escapeHtml(preview) + '</code></pre>' +
      '<div class="prompt-card__tags" aria-label="标签">' + tags + '</div>' +
      '<footer class="prompt-card__footer">' +
        '<button class="button button--quiet" type="button" data-action="copy" aria-label="复制：' + escapeHtml(prompt.title) + '">复制</button>' +
        '<button class="button button--quiet" type="button" data-action="edit" aria-label="编辑：' + escapeHtml(prompt.title) + '">编辑</button>' +
        '<button class="button button--quiet" type="button" data-action="delete" aria-label="删除：' + escapeHtml(prompt.title) + '">删除</button>' +
      '</footer>' +
    '</article>';
  }

  function openForm(prompt) {
    form.reset();
    document.getElementById('prompt-id').value = prompt ? prompt.id : '';
    document.getElementById('prompt-title').value = prompt ? prompt.title : '';
    document.getElementById('prompt-form-category').value = prompt ? prompt.category : '';
    document.getElementById('prompt-tags').value = prompt ? prompt.tags.join('，') : '';
    document.getElementById('prompt-description').value = prompt ? prompt.description : '';
    document.getElementById('prompt-content').value = prompt ? prompt.content : '';
    document.getElementById('prompt-dialog-title').textContent = prompt ? '编辑提示词' : '新建提示词';
    setFormError('');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', 'open');
    window.setTimeout(function () { document.getElementById('prompt-title').focus(); }, 0);
  }

  function closeForm() {
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  }

  function setFormError(message) {
    var error = document.getElementById('prompt-form-error');
    error.textContent = message;
    error.hidden = !message;
  }

  function readForm() {
    var tags = document.getElementById('prompt-tags').value.split(/[,，]/).map(function (tag) {
      return tag.trim();
    }).filter(Boolean).filter(unique).slice(0, 12);
    return normalizePrompt({
      id: document.getElementById('prompt-id').value || createId(),
      title: document.getElementById('prompt-title').value,
      category: document.getElementById('prompt-form-category').value,
      tags: tags,
      description: document.getElementById('prompt-description').value,
      content: document.getElementById('prompt-content').value,
      updatedAt: new Date().toISOString()
    });
  }

  function copyPrompt(prompt, button) {
    var write = Promise.resolve().then(function () {
      if (!window.navigator.clipboard || !window.isSecureContext) throw new Error('clipboard unavailable');
      return window.navigator.clipboard.writeText(prompt.content);
    }).catch(function () {
      return new Promise(function (resolve, reject) {
        var textarea = document.createElement('textarea');
        textarea.value = prompt.content;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        var copied = false;
        try { copied = document.execCommand('copy'); } catch (error) { copied = false; }
        textarea.remove();
        if (copied) resolve();
        else reject(new Error('copy failed'));
      });
    });
    write.then(function () {
      button.textContent = '已复制';
      button.classList.add('is-copied');
      window.setTimeout(function () {
        button.textContent = '复制';
        button.classList.remove('is-copied');
      }, 1600);
    }).catch(function () {
      button.textContent = '复制失败';
      window.setTimeout(function () { button.textContent = '复制'; }, 1600);
    });
  }

  function exportPrompts() {
    var blob = new Blob([JSON.stringify(state.prompts, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'esteliel-prompts.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function importPrompts(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error('not an array');
        var imported = parsed.map(normalizePrompt).filter(Boolean);
        if (!imported.length) throw new Error('empty');
        if (!window.confirm('导入将替换当前的 ' + state.prompts.length + ' 条提示词，确定继续吗？')) {
          importInput.value = '';
          return;
        }
        state.prompts = imported;
        state.query = '';
        state.category = '';
        search.value = '';
        savePrompts();
        render();
      } catch (error) {
        window.alert('导入失败：请确认文件是有效的提示词 JSON。');
      }
      importInput.value = '';
    };
    reader.readAsText(file);
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-action]');
    if (!button) return;
    var action = button.getAttribute('data-action');
    if (action === 'new') return openForm();
    if (action === 'cancel') return closeForm();
    if (action === 'export') return exportPrompts();
    if (action === 'import') return importInput.click();
    if (action === 'clear-filters') {
      state.query = '';
      state.category = '';
      search.value = '';
      render();
      return;
    }
    var card = button.closest('[data-prompt-id]');
    if (!card) return;
    var prompt = state.prompts.find(function (item) { return item.id === card.getAttribute('data-prompt-id'); });
    if (!prompt) return;
    if (action === 'copy') return copyPrompt(prompt, button);
    if (action === 'edit') return openForm(prompt);
    if (action === 'delete' && window.confirm('确定删除“' + prompt.title + '”吗？')) {
      state.prompts = state.prompts.filter(function (item) { return item.id !== prompt.id; });
      savePrompts();
      render();
    }
  });

  search.addEventListener('input', function (event) {
    state.query = event.target.value.trim();
    render();
  });

  category.addEventListener('change', function (event) {
    state.category = event.target.value;
    render();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var prompt = readForm();
    if (!prompt) {
      setFormError('标题和提示词内容不能为空。');
      return;
    }
    var existingIndex = state.prompts.findIndex(function (item) { return item.id === prompt.id; });
    if (existingIndex === -1) state.prompts.unshift(prompt);
    else state.prompts[existingIndex] = prompt;
    savePrompts();
    closeForm();
    render();
  });

  importInput.addEventListener('change', function (event) { importPrompts(event.target.files[0]); });
  window.addEventListener('storage', function (event) {
    if (event.key !== STORAGE_KEY) return;
    state.prompts = loadPrompts();
    render();
  });

  render();
})();
