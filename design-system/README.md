# VanEscolar GPS — Design System “Faixa escolar”

Guia de referência: **Apple Human Interface Guidelines (iOS 26, Liquid Glass)**. Implementação alvo: **Expo / React Native**.

> Para pais acompanhando uma van em movimento, uma interface neutra e silenciosa com **um único sinal amarelo** torna “onde está / quando chega” instantâneo.

## Arquivos

| Arquivo | O que é |
| :--- | :--- |
| `styles.css` | **Fonte única da verdade.** Tokens (`:root` claro + `:root[data-theme="dark"]`) e classes de componentes. |
| `index.html` | Guia de estilo vivo: fundamentos + todos os componentes, Dev Mode (inspetor) e **Copy as prompt**. |
| `concept.html` | Duas telas-conceito (Rota ao vivo + Mensalidade) montadas só com componentes do sistema. |
| `icons.html` | Sprite SVG do guia + nomes equivalentes de SF Symbols para usar no app (`expo-symbols`). |
| `theme.js` | Alternador claro/escuro compartilhado entre as páginas. |

Abra `index.html` direto no navegador (sem build, sem servidor).

## Decisões do tema

- **Uma família de ação: tinta** (`--primary` #111113; branco no escuro). Botões, seleção e links de navegação.
- **Sinal: amarelo escolar** (`--signal` #F5B400) apenas na van ao vivo, no ETA e no status “a caminho”. Texto amarelo sobre branco usa `--signal-ink`.
- **Status com significado**: verde = embarcou/ativo, laranja = atraso, vermelho = emergência/vencida — sempre com texto.
- **Vidro só na camada de controle** (barras, botões sobre o mapa, menus, sheets). Listas e cards são sólidos. Nunca vidro sobre vidro.
- **Tipografia**: SF Pro do sistema, estilos de texto HIG; números de ETA/valores em SF Rounded tabular.
- Contraste verificado por cálculo WCAG para todo par `--x` / `--on-x` (texto ≥ 4.5:1).

## Mapeamento para o app Expo

| Token / componente | No app |
| :--- | :--- |
| Cores | `src/theme/colors.ts` com objetos `light`/`dark` + `useColorScheme()`; `Color.ios.*` do `expo-router` onde existir semântico HIG. |
| Materiais | `GlassView` (`expo-glass-effect`, iOS 26) → fallback `BlurView` (`expo-blur`, tint `systemMaterial` / `systemChromeMaterial`). |
| Tab bar | `NativeTabs` do Expo Router (barra de vidro nativa). |
| Navigation bar | Header nativo do `Stack` (`headerLargeTitle`, `headerTransparent`). |
| Sheets | `presentation: "formSheet"` + `sheetAllowedDetents`. |
| Switch, Picker, Slider, Menu, seções | `@expo/ui`. |
| Ícones | `expo-symbols` (`SymbolView`) — nomes em `icons.html`. |
| Cantos / sombras | `borderCurve: 'continuous'`; `boxShadow` (nunca `shadow*`/`elevation`). |

> Implementação: `src/components/ds/` (componentes) e `src/theme/` (tokens). O app usa Expo Router (`app/`).

## Android

O sistema é baseado no HIG, mas cada peça tem equivalente Material no Android (mesmos tokens):

| iOS | Android |
| :--- | :--- |
| Tab bar de vidro (`NativeTabs`) | Bottom navigation Material 3 com indicador `--signal-container` |
| Cabeçalho transparente com vidro | Top App Bar Material sobre `--grouped-bg` |
| SF Symbols | Material Symbols (mesmo `<Icon name>` via `expo-symbols`) |
| Liquid Glass / blur | Superfície sólida tonal + elevação (`GlassSurface`) |
| Sheet nativa (pageSheet) | Bottom sheet com cantos de 28dp e scrim |
| Action sheet | Diálogo Material com as ações |
| Escala ao tocar + haptics | Ripple Material |
| Alvo de toque 44pt | 48dp (`hitTarget`) |

## Como estender

**Adicionar um token**
1. Declare a variável no grupo certo de `:root` em `styles.css` (e o valor escuro em `:root[data-theme="dark"]`).
2. Se for um preenchimento, crie junto o par `--on-*` e verifique o contraste (≥ 4.5:1 texto, ≥ 3:1 ícones/bordas).
3. Inclua o nome em `varGroups` no `index.html` para entrar no prompt “Install design system”.
4. Nunca use valores crus em componentes — sempre o nome do token.

**Adicionar um componente**
1. Crie o bloco de classe em `styles.css`, só com tokens.
2. Adicione uma `<section id="<chave>">` no `index.html`, com todas as variantes × estados e `data-insp="<chave>"` em cada exemplo.
3. Adicione `SPECS.<chave>` (name, file, desc, native, props, tokens, metrics). O botão **Copy as prompt** aparece sozinho.
4. Adicione o link na barra lateral, na categoria HIG correta (Bars, Content, Controls, Modality, Status ou Extensions).

**Trocar o tema**
Edite apenas os tokens de `:root` (e do bloco escuro). Componentes, catálogo e telas-conceito se atualizam sozinhos.

## Catálogo (HIG)

- **Fundamentos:** Color, Typography, Materials, Corner radius, Spacing & layout, Elevation, Motion, Iconography
- **Bars:** Navigation bar, Tab bar, Toolbar, Search bar
- **Content:** Lists & tables (plain / grouped / inset-grouped), Section header/footer, Card, Disclosure group
- **Controls:** Button (plain / gray / tinted / bordered / bordered-prominent / filled + glass), Pull-down & pop-up, Segmented control, Slider, Stepper, Toggle, Pickers (wheel / date / time), Text field, Text editor, Progress (bar / activity), Page control
- **Modality:** Sheet, Action sheet, Alert, Popover, Context menu, Activity view
- **Status:** Badge
- **Extensões de domínio:** Avatar, Status pill, Van marker & stops, Route timeline, Message bubble, Live Activity
