# Seven Minute Tabs

Tabs web component. Based heavily on the [Tabs with Automatic Activation example](https://www.w3.org/TR/wai-aria-practices/examples/tabs/tabs-1/tabs.html) from [WAI-ARIA Authoring Practices](https://www.w3.org/TR/wai-aria-practices/#tabpanel)

* [Demo](https://zachleat.github.io/seven-minute-tabs/demo.html)

## Installation

```
npm install @zachleat/seven-minute-tabs
```

## Features

* Code converted to be a web component.
* All styles have been removed and this component operates correctly without CSS. For longevity of the code all styling is left to independent project-specific themes.
* Progressively enhances from &lt;a&gt; with anchor links pointing to content panels.
* Adds `hidden` attribute to panels using JavaScript so that content still shows when JavaScript is not available.
* Adds `tabindex` using JavaScript so that content remains accessibile without JavaScript.
* Arrow key support. Adjusts for vertical `aria-orientation` values.
* Home/end key support.
* (Option to delete tabs was removed from the original example)

## Changelog

* `v3.0.1` Add `sync` attribute to activate all other matching tabs (in other tab groups) with the same `data-tab-persist="group:value"`.
* `v3.0.0` New tab selection persistence (via `persist` attribute) logic with `data-tab-persist="group:value"`. Defaults to `localStorage`. Use `persist="session"` for `sessionStorage`.
* `v2.0.2` Add `prune` attribute option to remove buttons that don’t have a matching panel.
* `v2.0.1` Add `persist` attribute option to persist selected tab to sessionStorage.
* `v2.0.0` Previous versions of this component required the `aria-selected`, `aria-labelledby`, `aria-controls`, and button/tab `id` attributes to exist in server rendered markup. If they don’t exist, they are now added automatically.


## License

* [W3C](https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document)