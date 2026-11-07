import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function createElementClass() {
  function Element(tag) {
    this.tagName = String(tag || 'div').toUpperCase();
    this.attrs = {};
    this.children = [];
    this.parentElement = null;
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.style = {};
    const classes = new Set();
    this.classList = {
      add(...names) { names.forEach(name => classes.add(name)); },
      remove(...names) { names.forEach(name => classes.delete(name)); },
      toggle(name, force) {
        const on = force === undefined ? !classes.has(name) : !!force;
        if (on) classes.add(name); else classes.delete(name);
        return on;
      },
      contains(name) { return classes.has(name); }
    };
    this.scrollIntoView = function () {};
  }
  Element.prototype.getAttribute = function (name) {
    return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
  };
  Element.prototype.setAttribute = function (name, value) { this.attrs[name] = String(value); };
  Element.prototype.hasAttribute = function (name) { return Object.prototype.hasOwnProperty.call(this.attrs, name); };
  Element.prototype.closest = function (selector) {
    const tags = new Set(selector.split(',').map(part => part.trim().toLowerCase()));
    let node = this;
    while (node) {
      if (tags.has(String(node.tagName || '').toLowerCase())) return node;
      node = node.parentElement;
    }
    return null;
  };
  Element.prototype.appendChild = function (child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  };
  return Element;
}

export function boot(options = {}) {
  const Element = createElementClass();
  const elements = new Map();
  const listeners = {};
  const document = {
    getElementById(id) {
      if (!elements.has(id)) {
        const el = new Element('div');
        el.id = id;
        elements.set(id, el);
      }
      return elements.get(id);
    },
    querySelectorAll() { return []; },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    createElement(tag) { return new Element(tag); },
    body: new Element('body')
  };
  const storage = new Map(Object.entries(options.storage || {}));
  const localStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  };
  const pasteLog = [];
  const context = {
    console,
    setTimeout() { return 0; },
    clearTimeout() {},
    localStorage,
    document,
    navigator: {},
    Element,
    encodeURIComponent,
    decodeURIComponent,
    confirm() { return options.confirmResult === true; },
    URL,
    URLSearchParams,
    WuyiModel: require(path.join(root, 'model.js')),
    WuyiPaste: {
      pasteToLine(text) {
        pasteLog.push(text);
        return Promise.resolve({ ok: true, appended: false });
      }
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'events.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), context);
  context.__pasteLog = pasteLog;
  context.__listeners = listeners;
  context.__Element = Element;
  return context;
}

export function click(ctx, el) {
  const event = {
    target: el,
    cancelBubble: false,
    clientX: 0,
    clientY: 0,
    preventDefault() {},
    stopPropagation() { this.cancelBubble = true; }
  };
  for (const fn of ctx.__listeners.click || []) fn(event);
  return event;
}
