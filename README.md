# Seven Minute Tabs

Based heavily on the [Tabs with Automatic Activation example](https://www.w3.org/TR/wai-aria-practices/examples/tabs/tabs-1/tabs.html) from [WAI-ARIA Authoring Practices](https://www.w3.org/TR/wai-aria-practices/#tabpanel)

## Features

* Code converted to be a web component.
* All styles have been removed—only functionality remains. All styling is left to themes.
* Progressively enhances from &lt;a&gt; with anchor links pointing to content panels.
* Adds `hidden` attribute in JavaScript so that content still shows when JavaScript is not available.
* Adds `tabindex` in JavaScript to avoid accessibility problems without JavaScript.
* Arrow key support. Adjusts for vertical `aria-orientation` values.
* Home/end key support.
* (Option to delete tabs was removed from the original example)

## License

* [W3C](https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document)