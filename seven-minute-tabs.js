/*
* This content is licensed according to the W3C Software License at
* https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
* Heavily modified to web component by Zach Leatherman
*/
class SevenMinuteTabs extends HTMLElement {
  constructor() {
    super();

    this._init = this._init.bind(this);
    this._observer = new MutationObserver(this._init);
  }

  get keys() {
    return {
      end: 35,
      home: 36,
      left: 37,
      up: 38,
      right: 39,
      down: 40
    };
  }

  // Add or substract depending on key pressed
  get direction() {
    return {
      37: -1,
      38: -1,
      39: 1,
      40: 1
    };
  }

  connectedCallback() {
    if (this.children.length) {
      this._init();
    }
    this._observer.observe(this, { childList: true });
  }

  _init() {
    this.tablist = this.querySelector('[role="tablist"]');
    this.buttons = this.querySelectorAll('[role="tab"]');
    this.panels = this.querySelectorAll('[role="tabpanel"]');
    this.delay = this.determineDelay();
    this.persistSelection = this.hasAttribute("persist");
    this.pruneMismatchedButtons = this.hasAttribute("prune");

    if(this.pruneMismatchedButtons) {
      for(let button of this.buttons) {
        if(!this.querySelector(button.getAttribute("href"))) {
          (button.closest("li") || button)?.remove();
        }
      }
    }

    if(!this.tablist || !this.buttons.length || !this.panels.length) {
      return;
    }

    // This order is important
    this.initButtons();
    this.initPanels();
  }

  getTabIdFromHref(hash) {
    let index = hash.indexOf("#");
    if(index > -1) {
      return hash.substr(index + 1);
    }
    return hash;
  }

  getButtonIdFromTabId(tabId) {
    return `${tabId}-btn`;
  }

  initButtons() {
    let count = 0;
    let hasASelectedButton = false;

    if(this.persistSelection) {
      let persisted = sessionStorage.getItem("seven-minute-tabs-persisted");
      if(persisted) {
        for(let button of this.buttons) {
          let compare = button.getAttribute("data-tabs-persist") || this.getTabIdFromHref(button.getAttribute("href"));
          if(compare == persisted) {
            button.setAttribute("aria-selected", "true");
            hasASelectedButton = true;
            break;
          }
        }
      }
    }

    if(!hasASelectedButton) {
      hasASelectedButton = Array.from(this.buttons).filter(btn => btn.getAttribute("aria-selected") === "true").length > 0;
    }

    for(let button of this.buttons) {
      let isSelected = button.getAttribute("aria-selected") === "true";
      if(!hasASelectedButton && count === 0) {
        isSelected = true;
      }

      // Attributes
      if(!button.hasAttribute("aria-selected")) {
        button.setAttribute("aria-selected", isSelected);
      }
      button.setAttribute("tabindex", isSelected ? "0" : "-1");

      let tabId = this.getTabIdFromHref(button.getAttribute("href"));
      if(!button.hasAttribute("aria-controls")) {
        button.setAttribute("aria-controls", tabId);
      }
      if(!button.hasAttribute("id")) {
        button.setAttribute("id", this.getButtonIdFromTabId(tabId));
      }

      // Events
      button.addEventListener('click', this.clickEventListener.bind(this));
      button.addEventListener('keydown', this.keydownEventListener.bind(this));
      button.addEventListener('keyup', this.keyupEventListener.bind(this));

      button.index = count++;
    }
  }

  initPanels() {
    let selectedPanelId = this.querySelector('[role="tab"][aria-selected="true"]').getAttribute("aria-controls");
    for(let panel of this.panels) {
      if(panel.getAttribute("id") !== selectedPanelId) {
        panel.setAttribute("hidden", "");
      }
      panel.setAttribute("tabindex", "0");

      if(!panel.hasAttribute("aria-labelledby")) {
        let tabId = panel.getAttribute("id");
        panel.setAttribute("aria-labelledby", this.getButtonIdFromTabId(tabId));
      }
    }
  }

  clickEventListener(event) {
    let button = event.target;
    if(button.tagName === "A" || button.tagName === "BUTTON" && button.getAttribute("type") === "submit") {
      event.preventDefault();
    }

    this.activateTab(button, false);
  }

  // Handle keydown on tabs
  keydownEventListener(event) {
    var key = event.keyCode;

    switch (key) {
      case this.keys.end:
        event.preventDefault();
        // Activate last tab
        this.activateTab(this.buttons[this.buttons.length - 1]);
        break;
      case this.keys.home:
        event.preventDefault();
        // Activate first tab
        this.activateTab(this.buttons[0]);
        break;

      // Up and down are in keydown
      // because we need to prevent page scroll >:)
      case this.keys.up:
      case this.keys.down:
        this.determineOrientation(event);
        break;
    };
  }

  // Handle keyup on tabs
  keyupEventListener(event) {
    var key = event.keyCode;

    switch (key) {
      case this.keys.left:
      case this.keys.right:
        this.determineOrientation(event);
        break;
    };
  }

  // When a tablist’s aria-orientation is set to vertical,
  // only up and down arrow should function.
  // In all other cases only left and right arrow function.
  determineOrientation(event) {
    var key = event.keyCode;
    var vertical = this.tablist.getAttribute('aria-orientation') == 'vertical';
    var proceed = false;

    if (vertical) {
      if (key === this.keys.up || key === this.keys.down) {
        event.preventDefault();
        proceed = true;
      };
    }
    else {
      if (key === this.keys.left || key === this.keys.right) {
        proceed = true;
      };
    };

    if (proceed) {
      this.switchTabOnArrowPress(event);
    };
  }

  // Either focus the next, previous, first, or last tab
  // depending on key pressed
  switchTabOnArrowPress(event) {
    var pressed = event.keyCode;

    for (let button of this.buttons) {
      button.addEventListener('focus', this.focusEventHandler.bind(this));
    };

    if (this.direction[pressed]) {
      var target = event.target;
      if (target.index !== undefined) {
        if (this.buttons[target.index + this.direction[pressed]]) {
          this.buttons[target.index + this.direction[pressed]].focus();
        }
        else if (pressed === this.keys.left || pressed === this.keys.up) {
          this.focusLastTab();
        }
        else if (pressed === this.keys.right || pressed == this.keys.down) {
          this.focusFirstTab();
        }
      }
    }
  }

  // Activates any given tab panel
  activateTab (tab, setFocus) {
    if(tab.getAttribute("role") !== "tab") {
      tab = tab.closest('[role="tab"]');
    }

    setFocus = setFocus || true;

    // Deactivate all other tabs
    this.deactivateTabs();

    // Remove tabindex attribute
    tab.removeAttribute('tabindex');

    // Set the tab as selected
    tab.setAttribute('aria-selected', 'true');

    // Get the value of aria-controls (which is an ID)
    var controls = tab.getAttribute('aria-controls');

    // Remove hidden attribute from tab panel to make it visible
    var panel = document.getElementById(controls);
    if(panel) {
      panel.removeAttribute('hidden');

      if(this.persistSelection) { // panel must exist to persist
        sessionStorage.setItem("seven-minute-tabs-persisted", tab.getAttribute("data-tabs-persist") || this.getTabIdFromHref(tab.getAttribute("href")));
      }
    }

    // Set focus when required
    if (setFocus) {
      tab.focus();
    }
  }

  // Deactivate all tabs and tab panels
  deactivateTabs() {
    for (let button of this.buttons) {
      button.setAttribute('tabindex', '-1');
      button.setAttribute('aria-selected', 'false');
      button.removeEventListener('focus', this.focusEventHandler.bind(this));
    }

    for (let panel of this.panels) {
      panel.setAttribute('hidden', 'hidden');
    }
  }

  focusFirstTab() {
    this.buttons[0].focus();
  }

  focusLastTab() {
    this.buttons[this.buttons.length - 1].focus();
  }

  // Determine whether there should be a delay
  // when user navigates with the arrow keys
  determineDelay() {
    var hasDelay = this.tablist.hasAttribute('data-delay');
    var delay = 0;

    if (hasDelay) {
      var delayValue = this.tablist.getAttribute('data-delay');
      if (delayValue) {
        delay = delayValue;
      }
      else {
        // If no value is specified, default to 300ms
        delay = 300;
      };
    };

    return delay;
  }

  focusEventHandler(event) {
    var target = event.target;

    setTimeout(this.checkTabFocus.bind(this), this.delay, target);
  };

  // Only activate tab on focus if it still has focus after the delay
  checkTabFocus(target) {
    let focused = document.activeElement;

    if (target === focused) {
      this.activateTab(target, false);
    }
  }
}

window.customElements.define("seven-minute-tabs", SevenMinuteTabs);
