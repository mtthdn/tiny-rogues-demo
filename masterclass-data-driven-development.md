# Data-Driven Development: From "What Is a Schema?" to the Semantic Web

*A masterclass using Tiny Rogues modding and quicue.ca as running examples.*

**Live demo:** [Graph Explorer](https://mtthdn.github.io/tiny-rogues-demo/) | [Mod Editor](https://mtthdn.github.io/tiny-rogues-demo/editor.html) | [JSON-LD Navigator](https://mtthdn.github.io/tiny-rogues-demo/explore.html) | [HTML version of this document](https://mtthdn.github.io/tiny-rogues-demo/learn.html)

---

## 1. What Is a Schema?

A schema is the **shape** of your data — not the data itself. It says what fields exist, what types they are, and what values are allowed.

You already make schemas every time you define a data structure. You just don't call it that.

Here's a Tiny Rogues weapon, the actual data:

```json
{
  "name": "Flameberge",
  "category": "Melee",
  "damage_type": "Fire",
  "damage_min": 130,
  "damage_max": 180,
  "scaling": "B+/—/—",
  "status_effect": "Burn",
  "description": "Heavy fire sword. All fire damage is elemental and inflicts Burn."
}
```

And here's the **schema** — the shape that all weapons must follow:

```
weapon:
  name:          string                                        # required
  category:      "Melee" | "Ranged" | "Magic"                 # one of three
  damage_type:   "Fire" | "Physical" | "Cold" | "Lightning"   # one of four
  damage_min:    integer                                       # number
  damage_max:    integer                                       # must be >= damage_min
  scaling:       string                                        # "STR/DEX/INT" format
  status_effect: "Burn" | "Chill" | "Shock" | "Bleed" | "None"
  description:   string
```

The schema tells a machine (or another developer) three things:

1. **What fields exist** — a weapon has `name`, `category`, `damage_min`, etc.
2. **What types they are** — `name` is text, `damage_min` is a number, `category` is one of three specific strings
3. **What constraints apply** — `damage_max` must be >= `damage_min`, `category` can only be Melee/Ranged/Magic

The schema is the contract. The data is an instance of that contract.

### Why This Matters for Modding

Without a schema, two mods that both touch the Flameberge might:
- Mod A sets `damage_max: 200`
- Mod B sets `damage_max: "very high"`

One is a number. One is a string. Without a schema, you won't know this is broken until the game crashes. With a schema, the mod loader rejects Mod B immediately: "damage_max must be an integer, got string."

**Schema = rules that catch mistakes before they become bugs.**

---

## 2. From Flat Data to a Graph

Here's a fact about Tiny Rogues that a flat weapon list can't express:

> The Flameberge inflicts **Burn**. Burn is a StatusEffect. The trait **Fire and Blood** lets Burn stack 3 times. The Pyromancer class starts with a weapon that inflicts Burn and has the Combustion trait that makes Burn explode.

This is a **graph** — things connected to other things:

```
Flameberge ──inflicts──→ Burn
Pyromancy Orb ──inflicts──→ Burn
Fire and Blood ──enhances──→ Burn
Combustion ──enhances──→ Burn
Pyromancer ──starts with──→ Pyromancy Orb
Pyromancer ──has trait──→ Combustion
Pyromancer ──has trait──→ Fire and Blood
```

Click on "Burn" and you see **everything that depends on it**: 5 weapons, 3 traits, 4 enchantments, 3 classes. That's not a list — it's a web of dependencies.

A schema for this graph needs to express not just "what fields does a weapon have" but "what can a weapon connect to." This is where `depends_on` comes in:

```json
{
  "name": "Flameberge",
  "@type": ["Weapon", "Melee"],
  "damage": "130-180",
  "status_effect": "Burn",
  "depends_on": ["Burn"]
}
```

The `depends_on` field says: "this thing references that thing." Now a tool can follow the link from Flameberge → Burn → Fire and Blood → Pyromancer and show you the entire dependency chain.

**This is the graph that the [editor](https://mtthdn.github.io/tiny-rogues-demo/editor.html) visualizes.** Every node is an entity. Every line is a `depends_on` relationship. Click a node, see everything connected.

---

## 3. What Is the Open Web?

The web runs on three ideas:

1. **URIs** (Uniform Resource Identifiers) — every thing gets a unique address
2. **HTTP** — you can ask for any URI and get something back
3. **Links** — things point to other things

When you visit `https://mtthdn.github.io/tiny-rogues-demo/editor.html`, you're using all three: the URI identifies the page, HTTP fetches it, and the page contains links to other pages.

The key insight: **URIs don't have to point to web pages.** They can identify *anything* — a weapon, a status effect, a class, a concept. The URI `https://quique.ca/tiny-rogues-demo/vocab/burn` doesn't have to be a page you visit. It's a **name** — a globally unique identifier for the concept "Burn status effect in Tiny Rogues."

This is the foundation of everything that follows.

---

## 4. What Is Linked Data?

Linked Data is the idea that **data should work like the web**: every thing has a URI, things link to other things, and you can follow the links.

Here's the Tiny Rogues mod data in **JSON-LD** (JSON for Linked Data):

```json
{
  "@context": {
    "game": "https://quique.ca/tiny-rogues-demo/vocab/",
    "name": "game:name",
    "depends_on": { "@id": "game:dependsOn", "@type": "@id" }
  },
  "@graph": [
    {
      "@id": "game:flameberge",
      "@type": ["Weapon", "Melee"],
      "name": "Flameberge",
      "damage": "130-180",
      "depends_on": ["Burn"]
    },
    {
      "@id": "game:burn",
      "@type": ["StatusEffect", "DoT"],
      "name": "Burn",
      "element": "Fire",
      "tick_damage": "90-125"
    }
  ]
}
```

Four special fields make this Linked Data:

| Field | What it does | Example |
|-------|-------------|---------|
| `@context` | Maps short names to full URIs | `"game"` → `"https://quique.ca/tiny-rogues-demo/vocab/"` |
| `@id` | Gives this thing a globally unique name | `"game:flameberge"` → `"https://quique.ca/tiny-rogues-demo/vocab/flameberge"` |
| `@type` | Says what kind of thing this is | `["Weapon", "Melee"]` |
| `@graph` | Contains a list of connected things | The whole dataset |

**Why this matters:**

- `@id` means any tool anywhere can refer to the Flameberge unambiguously — there's only one `game:flameberge` in the universe
- `@type` means a tool can filter "show me all Weapons" or "show me all StatusEffects" without knowing anything else about Tiny Rogues
- `@context` means you can use short names (`"Burn"`) in your data but machines resolve them to full URIs (`"https://quique.ca/tiny-rogues-demo/vocab/burn"`)
- `depends_on` with `"@type": "@id"` means the values are **links**, not just strings — `"Burn"` in `depends_on` is a reference to `game:burn`, not just the word "Burn"

**Linked Data = data with web-style links built in. Any tool that understands JSON-LD can navigate your data like a browser navigates web pages.**

---

## 5. What Is the Semantic Web?

The Semantic Web is Linked Data scaled up: instead of every game inventing its own vocabulary (`damage_min`, `tick_speed`, `status_effect`), communities agree on **shared vocabularies** so data from different sources can interoperate.

Real-world shared vocabularies:

| Vocabulary | What it describes | Used by |
|-----------|------------------|---------|
| **Schema.org** | Products, events, people, places | Google, Bing, every website with structured data |
| **PROV-O** | Who made what, when, how | Scientific datasets, audit trails |
| **DCAT** | Datasets and catalogs | Government open data portals worldwide |
| **Dublin Core** | Title, creator, date, subject | Every library catalog on earth |

The pattern: instead of inventing `"author"`, `"creator"`, `"made_by"`, and `"written_by"` in four different systems, everyone agrees to use `dcterms:creator`. Now a tool that understands Dublin Core can read metadata from *any* source that uses it.

For game modding, the Semantic Web pattern means:

1. **Tiny Rogues** defines `game:dependsOn` for its dependency relationships
2. **quicue.ca** defines `viz:node` and `viz:edge` for graph visualization
3. A mod tool that understands both vocabularies can take Tiny Rogues data, follow the `depends_on` links, and render it as a graph using the visualization schema — **without knowing anything specific about Tiny Rogues**

The tool doesn't need a Tiny Rogues plugin. It just needs to understand the vocabularies.

---

## 6. How quicue.ca Ties It All Together

quicue.ca is a constraint engine with a visualization layer. Here's the stack:

### Layer 1: CUE Schemas (the rules)

```cue
// The shape of a visualization node
#VizNode: {
    id:         string
    name:       string
    types:      [...string]     // what kind of thing
    depth:      int             // how deep in the dependency tree
    dependents: int             // how many things depend on this
}

// The shape of an edge (dependency)
#VizEdge: {
    source: string   // thing that is depended ON
    target: string   // thing that DEPENDS on source
}

// The complete visualization payload
#VizData: {
    nodes:   [...#VizNode]
    edges:   [...#VizEdge]
    metrics: { total: int, maxDepth: int, edges: int }
}
```

This is the schema for **any graph visualization**. It doesn't know about weapons or status effects. It knows about nodes, edges, depth, and dependency counts. Any dataset that can express "things that depend on other things" can be visualized with this schema.

### Layer 2: JSON-LD Data (the content)

The Tiny Rogues mod data (shown above) is JSON-LD with `@type`, `@id`, and `depends_on`. The quicue.ca tools read this data and produce a `#VizData` payload:

```json
{
  "nodes": [
    { "id": "burn", "name": "Burn", "types": ["StatusEffect", "DoT"], "depth": 0, "dependents": 12 },
    { "id": "flameberge", "name": "Flameberge", "types": ["Weapon", "Melee"], "depth": 1, "dependents": 0 }
  ],
  "edges": [
    { "source": "burn", "target": "flameberge" }
  ],
  "metrics": { "total": 52, "maxDepth": 3, "edges": 87 }
}
```

### Layer 3: D3.js Visualization (the display)

The `#VizData` JSON feeds directly into a D3.js force-directed graph. Nodes are circles. Edges are lines. Click a node, highlight its dependencies. Filter by type. Search by name.

**The key: the visualization tool knows nothing about Tiny Rogues.** It consumes `#VizData` — nodes and edges. You could feed it infrastructure dependencies, university course prerequisites, recipe ingredient trees, or any other graph. Same tool, different data.

### Layer 4: Constraint Validation (the safety net)

When two mods both modify the same entity, the constraint engine checks:

1. **Type compatibility**: Both mods agree on `@type`? Proceed.
2. **Field merging**: Non-overlapping fields merge cleanly.
3. **Conflict detection**: Same field, different values? **Specific error**: "Mod A sets Flameberge.damage to '130-180', Mod B sets it to '200-250'. Resolve conflict."

No silent breakage. No load-order bugs. If two mods are compatible, they merge. If they conflict, you get a clear error pointing at the exact field on the exact entity.

This is what CUE's **unification** does: `{a: 1} & {b: 2} = {a: 1, b: 2}` (merge). `{a: 1} & {a: 2} = error` (conflict). The schema defines what can merge and what can't.

---

## 7. The Whole Picture

```
Game Data (XML, JSON, spreadsheets)
        ↓ import
Schema Validation (CUE: type-check every field)
        ↓ validated
Linked Data (JSON-LD: @id, @type, depends_on)
        ↓ transform
Visualization Contract (#VizData: nodes + edges)
        ↓ render
Interactive Graph (D3.js: click, explore, filter)
```

Each layer is independent:

- **Change the game?** Swap the schema and data. Visualization still works.
- **Change the visualization?** Swap the renderer. Data still validates.
- **Add a mod?** Merge it with the base data. Conflicts caught automatically.
- **Share with another tool?** It reads JSON-LD natively. No export plugin needed.

### From Any Format to the Graph

If a game exports weapon data as XML:

```xml
<weapon name="Flameberge" category="Melee" element="Fire">
  <damage min="130" max="180"/>
  <scaling str="B+" dex="-" int="-"/>
  <status_effect>Burn</status_effect>
</weapon>
```

The pipeline reads it, validates it against the weapon schema, converts it to JSON-LD with `@id` and `depends_on`, runs the constraint engine to merge with mod data, and outputs `#VizData` for the interactive graph.

The format doesn't matter. XML, JSON, YAML, CSV — it all flows through the same pipeline. The **schema** is what makes it work, because the schema is the contract that every format must satisfy.

---

## TL;DR

| Concept | One-liner |
|---------|-----------|
| **Schema** | The shape your data must follow — fields, types, constraints |
| **Graph** | Things connected to other things via relationships |
| **Open Web** | Every thing gets a URI, things link to other things |
| **Linked Data** | Data with web-style links built in (JSON-LD: @id, @type, @context) |
| **Semantic Web** | Shared vocabularies so different datasets can interoperate |
| **CUE** | A language that defines schemas AND validates data AND merges cleanly |
| **quicue.ca** | CUE schemas + JSON-LD + D3.js visualization = data-driven everything |

A schema is just the rules. Once you have the rules, machines can validate, merge, visualize, and reason about your data — whether it's game mods, infrastructure, or knowledge graphs. Same tools, different schemas.

---

**Try it yourself:** [Graph Explorer](https://mtthdn.github.io/tiny-rogues-demo/) | [Mod Editor](https://mtthdn.github.io/tiny-rogues-demo/editor.html) | [JSON-LD Navigator](https://mtthdn.github.io/tiny-rogues-demo/explore.html) | [Source on GitHub](https://github.com/mtthdn/tiny-rogues-demo)
