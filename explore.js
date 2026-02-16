(async function() {
  let graphResp;
  try {
    const resp = await fetch('mod-data.json');
    graphResp = await resp.json();
  } catch (e) {
    document.getElementById('empty-detail').textContent = 'Failed to load mod-data.json: ' + e.message;
    return;
  }
  const graph = graphResp['@graph'] || [];
  const context = graphResp['@context'] || {};

  // Type -> color (matches editor.html conventions)
  const TYPE_COLORS = {
    StatusEffect: '#fab387',  // peach
    Weapon: '#89b4fa',        // blue
    Class: '#f9e2af',         // yellow
    Trait: '#94e2d5',         // teal
    Enchantment: '#cba6f7',   // mauve
    // Secondary types
    DoT: '#f38ba8', Debuff: '#eba0ac',
    Melee: '#f38ba8', Ranged: '#a6e3a1', Magic: '#cba6f7',
    STR: '#f38ba8', DEX: '#a6e3a1', INT: '#89b4fa', Hybrid: '#b4befe',
    Strength: '#f38ba8', Dexterity: '#a6e3a1', Intelligence: '#89b4fa',
    Positive: '#a6e3a1', Legendary: '#f9e2af', Special: '#f5c2e7',
  };

  function typeColor(t) { return TYPE_COLORS[t] || '#6c7086'; }

  // Index resources by name
  const byName = {};
  graph.forEach(r => { byName[r.name] = r; });

  // Build reverse deps (who depends on me)
  const dependents = {};
  graph.forEach(r => {
    (r.depends_on || []).forEach(dep => {
      if (!dependents[dep]) dependents[dep] = [];
      dependents[dep].push(r.name);
    });
  });

  // Group by primary @type
  const byType = {};
  graph.forEach(r => {
    const types = r['@type'] || [];
    const primary = types[0] || 'Unknown';
    if (!byType[primary]) byType[primary] = [];
    byType[primary].push(r);
  });

  // Render resource list
  function renderList(filter) {
    filter = filter || '';
    const el = document.getElementById('resource-list');
    el.innerHTML = '';
    const lf = filter.toLowerCase();
    const typeOrder = ['StatusEffect', 'Weapon', 'Class', 'Trait', 'Enchantment'];
    const sortedTypes = typeOrder.filter(function(t) { return byType[t]; });

    sortedTypes.forEach(function(type) {
      const resources = byType[type].filter(function(r) {
        return !lf || r.name.toLowerCase().includes(lf) || type.toLowerCase().includes(lf) ||
          (r.element || '').toLowerCase().includes(lf) ||
          (r['@type'] || []).some(function(t) { return t.toLowerCase().includes(lf); });
      });
      if (!resources.length) return;

      const group = document.createElement('div');
      group.className = 'type-group';

      const label = document.createElement('div');
      label.className = 'type-label';
      label.textContent = type + 's (' + resources.length + ')';
      group.appendChild(label);

      resources.sort(function(a,b) { return a.name.localeCompare(b.name); }).forEach(function(r) {
        const item = document.createElement('div');
        item.className = 'resource-item';
        item.dataset.name = r.name;

        const dot = document.createElement('span');
        dot.className = 'type-dot';
        dot.style.background = typeColor(type);
        item.appendChild(dot);
        item.appendChild(document.createTextNode(r.name));

        item.addEventListener('click', function() { selectResource(r.name); });
        group.appendChild(item);
      });
      el.appendChild(group);
    });
  }

  // Select and display resource
  function selectResource(name) {
    const r = byName[name];
    if (!r) return;

    // Update selection state
    document.querySelectorAll('.resource-item').forEach(function(el) {
      el.classList.toggle('selected', el.dataset.name === name);
    });

    document.getElementById('empty-detail').style.display = 'none';
    const detail = document.getElementById('detail');
    detail.style.display = '';
    detail.innerHTML = '';

    const types = r['@type'] || [];
    const deps = r.depends_on || [];
    const revDeps = dependents[name] || [];

    // Header
    const header = document.createElement('div');
    header.className = 'detail-header';

    const h1 = document.createElement('h1');
    h1.textContent = r.name;
    header.appendChild(h1);

    const iri = document.createElement('div');
    iri.className = 'detail-iri';
    iri.textContent = r['@id'];
    header.appendChild(iri);

    const meta = document.createElement('div');
    meta.className = 'detail-meta';
    types.forEach(function(t) {
      const badge = document.createElement('span');
      badge.className = 'badge badge-type';
      badge.style.borderColor = typeColor(t);
      badge.style.color = typeColor(t);
      badge.textContent = t;
      meta.appendChild(badge);
    });
    if (r.element) {
      const badge = document.createElement('span');
      badge.className = 'badge badge-element';
      badge.textContent = r.element;
      meta.appendChild(badge);
    }
    if (r.scaling) {
      const badge = document.createElement('span');
      badge.className = 'badge badge-scaling';
      badge.textContent = r.scaling;
      meta.appendChild(badge);
    }
    header.appendChild(meta);
    detail.appendChild(header);

    // Description
    if (r.description) {
      const sec = document.createElement('div');
      sec.className = 'section';
      const p = document.createElement('p');
      p.style.cssText = 'color:var(--subtext0);font-size:0.85rem;line-height:1.5';
      p.textContent = r.description;
      sec.appendChild(p);
      detail.appendChild(sec);
    }

    // Properties (skip metadata fields)
    var skip = ['@id','@type','name','depends_on','description'];
    var props = Object.entries(r).filter(function(e) { return !skip.includes(e[0]); });
    if (props.length) {
      var sec = document.createElement('div');
      sec.className = 'section';
      var h3 = document.createElement('h3');
      h3.textContent = 'Properties';
      sec.appendChild(h3);
      props.forEach(function(e) {
        var row = document.createElement('div');
        row.className = 'prop-row';
        var lbl = document.createElement('span');
        lbl.className = 'prop-label';
        lbl.textContent = e[0].replace(/_/g, ' ');
        var val = document.createElement('span');
        val.className = 'prop-value';
        val.textContent = typeof e[1] === 'object' ? JSON.stringify(e[1]) : e[1];
        row.appendChild(lbl);
        row.appendChild(val);
        sec.appendChild(row);
      });
      detail.appendChild(sec);
    }

    // Dependencies (clickable)
    if (deps.length) {
      var sec = document.createElement('div');
      sec.className = 'section';
      var h3 = document.createElement('h3');
      h3.textContent = 'Depends On (' + deps.length + ')';
      sec.appendChild(h3);
      deps.forEach(function(d) {
        var link = document.createElement('a');
        link.className = 'dep-link';
        link.textContent = d;
        link.addEventListener('click', function() { selectResource(d); });
        sec.appendChild(link);
      });
      detail.appendChild(sec);
    }

    // Dependents (who depends on me)
    if (revDeps.length) {
      var sec = document.createElement('div');
      sec.className = 'section';
      var h3 = document.createElement('h3');
      h3.textContent = 'Depended On By (' + revDeps.length + ')';
      sec.appendChild(h3);
      revDeps.forEach(function(d) {
        var link = document.createElement('a');
        link.className = 'dep-link';
        link.textContent = d;
        link.addEventListener('click', function() { selectResource(d); });
        sec.appendChild(link);
      });
      detail.appendChild(sec);
    }

    // Right panel: context
    renderContext(name, r, deps, revDeps);
  }

  // Render right panel context
  function renderContext(name, r, deps, revDeps) {
    var statsEl = document.getElementById('context-stats');

    // Calculate transitive dependents count
    function countTransitive(startName) {
      var visited = new Set();
      var queue = [startName];
      while (queue.length) {
        var n = queue.shift();
        if (visited.has(n)) continue;
        visited.add(n);
        (dependents[n] || []).forEach(function(d) { queue.push(d); });
      }
      visited.delete(startName);
      return visited.size;
    }

    // Calculate transitive ancestors count
    function countAncestors(startName) {
      var visited = new Set();
      var queue = [startName];
      while (queue.length) {
        var n = queue.shift();
        if (visited.has(n)) continue;
        visited.add(n);
        var res = byName[n];
        if (res) (res.depends_on || []).forEach(function(d) { queue.push(d); });
      }
      visited.delete(startName);
      return visited.size;
    }

    var transitiveDeps = countTransitive(name);
    var transitiveAnc = countAncestors(name);

    statsEl.innerHTML = '';
    var statData = [
      ['Primary Type', (r['@type']||[])[0] || '-'],
      ['Element', r.element || '-'],
      ['Direct Deps', deps.length],
      ['Direct Dependents', revDeps.length],
      ['Transitive Reach', transitiveDeps],
      ['Transitive Ancestors', transitiveAnc],
    ];
    statData.forEach(function(s) {
      var row = document.createElement('div');
      row.className = 'stat-row';
      var lbl = document.createElement('span');
      lbl.className = 'stat-label';
      lbl.textContent = s[0];
      var val = document.createElement('span');
      val.className = 'stat-value';
      val.textContent = s[1];
      if (s[0] === 'Transitive Reach') val.style.color = 'var(--peach)';
      row.appendChild(lbl);
      row.appendChild(val);
      statsEl.appendChild(row);
    });

    // Dependency chain (walk up to root)
    var chain = document.getElementById('dep-chain');
    chain.innerHTML = '';
    var chainTitle = document.createElement('h2');
    chainTitle.textContent = 'Dependency Chain';
    chain.appendChild(chainTitle);
    var tree = document.createElement('div');
    tree.className = 'dep-tree';

    // Collect ancestors of current node
    var ancestors = new Set();
    function collectAncestors(rname) {
      var res = byName[rname];
      if (!res) return;
      (res.depends_on || []).forEach(function(d) {
        if (!ancestors.has(d)) {
          ancestors.add(d);
          collectAncestors(d);
        }
      });
    }
    collectAncestors(name);

    // Show chain from roots down to selected
    var roots = graph.filter(function(r) { return !(r.depends_on || []).length; }).map(function(r) { return r.name; });
    var relevantRoots = roots.filter(function(r) { return ancestors.has(r) || r === name; });

    function renderChain(rname, depth) {
      depth = depth || 0;
      var item = document.createElement('div');
      item.className = 'dep-tree-item';
      item.style.paddingLeft = (depth * 0.8) + 'rem';
      if (rname === name) {
        var strong = document.createElement('strong');
        strong.style.color = 'var(--blue)';
        strong.textContent = rname;
        item.appendChild(strong);
      } else {
        var a = document.createElement('a');
        a.textContent = rname;
        a.addEventListener('click', function() { selectResource(rname); });
        item.appendChild(a);
      }
      tree.appendChild(item);

      var children = (dependents[rname] || []).filter(function(c) { return ancestors.has(c) || c === name; });
      children.forEach(function(c) {
        if (c !== rname) renderChain(c, depth + 1);
      });
    }

    relevantRoots.forEach(function(r) { renderChain(r); });
    if (!relevantRoots.length && name) {
      var item = document.createElement('div');
      item.className = 'dep-tree-item dep-tree-root';
      var strong = document.createElement('strong');
      strong.style.color = 'var(--blue)';
      strong.textContent = name + ' (root)';
      item.appendChild(strong);
      tree.appendChild(item);
    }
    chain.appendChild(tree);

    // JSON-LD raw
    var jsonldSection = document.getElementById('jsonld-section');
    jsonldSection.style.display = '';
    document.getElementById('jsonld-raw').textContent = JSON.stringify(r, null, 2);
  }

  // Search
  document.getElementById('search').addEventListener('input', function(e) {
    renderList(e.target.value);
  });

  // Initial render
  renderList();

  // Global stats in right panel (before any selection)
  var totalEdges = graph.reduce(function(sum, r) { return sum + (r.depends_on || []).length; }, 0);
  var rootCount = graph.filter(function(r) { return !(r.depends_on || []).length; }).length;

  // Find top hub (most dependents)
  var depCounts = {};
  graph.forEach(function(r) {
    (r.depends_on || []).forEach(function(d) { depCounts[d] = (depCounts[d] || 0) + 1; });
  });
  var depEntries = Object.entries(depCounts).sort(function(a,b) { return b[1] - a[1]; });
  var topHub = depEntries[0];

  var globalStats = document.getElementById('context-stats');
  globalStats.innerHTML = '';
  var globalData = [
    ['Total Entities', graph.length],
    ['Total Edges', totalEdges],
    ['Entity Types', Object.keys(byType).length],
    ['Root Nodes', rootCount],
    ['Top Hub', topHub ? topHub[0] + ' (' + topHub[1] + ')' : '-'],
    ['JSON-LD Terms', Object.keys(context).length],
  ];
  globalData.forEach(function(s) {
    var row = document.createElement('div');
    row.className = 'stat-row';
    var lbl = document.createElement('span');
    lbl.className = 'stat-label';
    lbl.textContent = s[0];
    var val = document.createElement('span');
    val.className = 'stat-value';
    val.textContent = s[1];
    row.appendChild(lbl);
    row.appendChild(val);
    globalStats.appendChild(row);
  });

  // Select from hash
  var hash = window.location.hash.replace('#', '');
  if (hash && byName[hash]) selectResource(hash);
})();
