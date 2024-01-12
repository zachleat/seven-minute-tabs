/*
* This content is licensed according to the W3C Software License at
* https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
* Heavily modified to web component by Zach Leatherman
*/
class SevenMinuteTabs extends HTMLElement {
  static tagName = "seven-minute-tabs";

  static attrs = {
    persist: "persist",
    persistGroupKey: "data-tabs-persist",
    prune: "prune",
    sync: "sync",
  };

  static props = {
    groupStorageKey: "seven-minute-tabs-persist-tabs",
  };

  static keys = {
    end: 35,
    home: 36,
    left: 37,
    up: 38,
    right: 39,
    down: 40
  };

  // Add or substract depending on key pressed
  static direction = {
    37: -1,
    38: -1,
    39: 1,
    40: 1
  };

  constructor() {
    super();

    this._init = this._init.bind(this);
    this._observer = new MutationObserver(this._init);
  }

  get storage() {
    if(this.persistSelection === "session") {
      return sessionStorage;
    } else if(this.persistSelection) {
      return localStorage;
    }

    // noop
    return {
      getItem() {},
      setItem() {},
    };
  }

  get persistSelection() {
    if(!("_persist" in this)) {
      this._persist = false;
      if(this.hasAttribute(SevenMinuteTabs.attrs.persist)) {
        this._persist = this.getAttribute(SevenMinuteTabs.attrs.persist) || true;
      }
    }
    return this._persist;
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

    if(this.hasAttribute(SevenMinuteTabs.attrs.prune)) {
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
      let persisted = JSON.parse(this.storage.getItem(SevenMinuteTabs.props.groupStorageKey));
      if(persisted) {
        for(let button of this.buttons) {
          let [key, value] = this.getStorageValues(button);
          if(key && value && value == persisted[key]) {
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
      case SevenMinuteTabs.keys.end:
        event.preventDefault();
        // Activate last tab
        this.activateTab(this.buttons[this.buttons.length - 1]);
        break;
      case SevenMinuteTabs.keys.home:
        event.preventDefault();
        // Activate first tab
        this.activateTab(this.buttons[0]);
        break;

      // Up and down are in keydown
      // because we need to prevent page scroll >:)
      case SevenMinuteTabs.keys.up:
      case SevenMinuteTabs.keys.down:
        this.determineOrientation(event);
        break;
    };
  }

  // Handle keyup on tabs
  keyupEventListener(event) {
    var key = event.keyCode;

    switch (key) {
      case SevenMinuteTabs.keys.left:
      case SevenMinuteTabs.keys.right:
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
      if (key === SevenMinuteTabs.keys.up || key === SevenMinuteTabs.keys.down) {
        event.preventDefault();
        proceed = true;
      };
    }
    else {
      if (key === SevenMinuteTabs.keys.left || key === SevenMinuteTabs.keys.right) {
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

    if (SevenMinuteTabs.direction[pressed]) {
      var target = event.target;
      if (target.index !== undefined) {
        if (this.buttons[target.index + SevenMinuteTabs.direction[pressed]]) {
          this.buttons[target.index + SevenMinuteTabs.direction[pressed]].focus();
        }
        else if (pressed === SevenMinuteTabs.keys.left || pressed === SevenMinuteTabs.keys.up) {
          this.focusLastTab();
        }
        else if (pressed === SevenMinuteTabs.keys.right || pressed == SevenMinuteTabs.keys.down) {
          this.focusFirstTab();
        }
      }
    }
  }

  getStorageValues(tab) {
    let [key, value] = (tab.getAttribute(SevenMinuteTabs.attrs.persistGroupKey) || "").split(":");
    if(key && value) {
      return [key, value];
    }
    if(key) {
      return ["__global", key]
    }
    // let href = tab.getAttribute("href");
    // if(href) {
    //   return ["__global", this.getTabIdFromHref(href)];
    // }
    return [,];
  }

  syncRelatedTabs(activatedTab) {
    if(!this.hasAttribute(SevenMinuteTabs.attrs.sync)) {
      return;
    }

    let persistGroupKey = activatedTab.getAttribute(SevenMinuteTabs.attrs.persistGroupKey);
    let tabs = Array.from(document.querySelectorAll(`[${SevenMinuteTabs.attrs.persistGroupKey}="${persistGroupKey}"]`)).filter(tab => tab !== activatedTab);
    for(let tab of tabs) {
      // work with `is-land--seven-minute-tabs` rename, undefined components will be set when they’re activated
      let tabGroup = tab.closest(`[${SevenMinuteTabs.attrs.sync}]:defined`);
      if(tabGroup) {
        tabGroup.activateTab(tab, false, true);
      }
    }
  }

  // Activates any given tab panel
  activateTab (tab, setFocus = true, viaSync = false) {
    if(tab.getAttribute("role") !== "tab") {
      tab = tab.closest('[role="tab"]');
    }

    if(!viaSync) {
      this.syncRelatedTabs(tab);
    }

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
        let obj = JSON.parse(this.storage.getItem(SevenMinuteTabs.props.groupStorageKey));
        if(!obj) {
          obj = {};
        }

        let [key, value] = this.getStorageValues(tab);
        if(key && value) {
          obj[key] = value;
        }

        this.storage.setItem(SevenMinuteTabs.props.groupStorageKey, JSON.stringify(obj));
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

window.customElements.define(SevenMinuteTabs.tagName, SevenMinuteTabs);
