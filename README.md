# Seven Minute Tabs

Tabs web component. Based heavily on the [Tabs with Automatic Activation example](https://www.w3.org/TR/wai-aria-practices/examples/tabs/tabs-1/tabs.html) from [WAI-ARIA Authoring Practices](https://www.w3.org/TR/wai-aria-practices/#tabpanel)

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

## License

* [W3C](https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document)