# Discord Post — Modding Discussion / Ask the Dev

**Forum post title:** To Good Home: 1 Knowledge Graph (barely used, house-trained)

---

Hey! Long-time Tiny Rogues player (Pyromancer main, obviously). Saw the 2026 post about the rewrite going data-driven with modding support and had a genuine "wait, that's literally my day job" moment.

I model things as typed dependency graphs for a living — you declare stuff and what it depends on, a constraint engine checks that your data is consistent, and then a graph engine computes what breaks when something changes, where the bottlenecks are, and what order things need to happen in. It's basically a schema system that argues with you when your JSON doesn't make sense.

When I read about the data-driven modding plans (and the Hytale shoutout — great taste), I realized a Pyromancer build path is structurally identical to a server deployment plan. Same graph shape, same analysis, different labels. So I built a quick interactive demo:

**https://quique.ca/tiny-rogues-demo/**

Three things to look at:

**Graph Explorer** (main page) — Two pre-built scenarios. The "Mod Pipeline" shows the 14-step dependency chain from concept art to Workshop upload. The "Build Data" shows what JSON entries need to exist for a fire mage build to work — and what cascades when you change the fire element definition. Click any node to see blast radius analysis.

**Mod Data Editor** ([editor.html](https://quique.ca/tiny-rogues-demo/editor.html)) — This is the fun one. It's pre-loaded with real Tiny Rogues data: Pyromancer class (3 INT, 1 STR, Fire Mastery passive), Pyromancy Orb (77-117 fire, inflicts Burn), Fire Fang (175-200 fire, Ranged), Firebomb Codex, and the Burn/Shock status effects. You can:
- Add new weapons, traits, enchantments, status effects, and classes
- Wire dependencies between them (Link Mode)
- See the dependency graph update in real-time
- Export the whole thing as structured JSON

The card view shows weapon stats with the actual scaling grade system (S+ through E, STR/DEX/INT). It's what a modder's workflow could look like — define content visually, see how it connects to everything else, export data files.

The part that might actually matter for the modding system: **the constraint validation layer**. Before the game ever loads a mod, the schema catches "you referenced a trait that doesn't exist" or "this weapon's scaling config is missing required fields." Lattice-based unification, if you're into that sort of thing — it's the same math that makes Haskell's type system work, applied to game data instead of code.

No pitch, no ask. Just a knowledge graph person who plays too much Tiny Rogues and wanted to see what happens when you point a dependency engine at game data. The answer is: it works embarrassingly well.

The rewrite being a free update is genuinely rare. That decision deserves good tools behind it.

---

*Notes for you (not part of the post):*
- The editor is pre-loaded with REAL game data from the wiki: Pyromancer, Fire Fang, Pyromancy Orb, Firebomb Codex, Burn, Shock
- Weapon scaling grades match the actual game system (S+ > S > A+ > A > ... > E)
- The build data scenario still uses illustrative names (fire-element, inferno-synergy, etc.) — not real game data
- If they bite, offer to model a real slice of their actual data format (once the March blog reveals it)
- If they ask "what is CUE?": "JSON with types. You define what your data should look like, and it tells you when it doesn't."
- If they ask about integration: CUE exports to JSON. Their Unity/C# code never sees CUE — it just validates the data pipeline
- Editor URL: https://quique.ca/tiny-rogues-demo/editor.html
