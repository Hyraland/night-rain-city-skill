# Night rain city · 夜雨城风格套件

A skill for AI coding agents (Claude Code and others that read `SKILL.md`) to build walkable three.js night cities
in one look: rain, wet mirror-like streets, glass towers with lit rooms, three-tone cyan toon shading, LED and
hologram signs, flying traffic, people under umbrellas, and the sound of the rain. Any street layout; shops,
sunken plazas, terraces and metro stations wherever you want them.

一个给 AI 编程助手用的技能包：用同一种建筑、光影和配色风格，搭出任意布局的夜雨未来城市街区——街道走向、
店铺、下沉广场、高台、地铁都可以自己决定。

## Use

Copy this folder into your skills directory as `night-rain-city` (for Claude Code:
`git clone <this repo> ~/.claude/skills/night-rain-city`), then ask for a
city in this style. The agent copies `engine/` into your project, writes a `district.js` for your streets and shops,
and runs it with `python3 serve.py`.

To try it directly (`engine/src/district.js` is a blank start, two streets; to see everything in use, copy
`examples/showcase/district.js` over it first):

```bash
cd engine && python3 serve.py 5189
```

and open http://localhost:5189/ (needs the network for three.js from jsDelivr).

## Contents

- `SKILL.md` - instructions for the agent
- `references/` - the style, the catalog of ready-made parts, the district format, the pieces and world API, extending, models of your own, testing, limits
- `examples/showcase/` - a district using most of the kit, with plain placeholder names
- `engine/` - the working page: `src/core` (rendering, rain, sky, walker, people, audio, music), `src/kit` (city
  building), `src/district.js` (a blank district to start from), `tuning.json` (the look), `blender/` (the cat sculpture's
  source script, and a script to make models ready)

See `CREDITS.md`.

## License

MIT, see `LICENSE`.
