/* global document, window */
const jQuery = require('jquery');
window.$ = window.jQuery = jQuery;

const Turbolinks = require('turbolinks');
Turbolinks.start();

// TODO: Include as packages
require('../vendor/semantic-ui/semantic.min');
require('../vendor/jquery.tablesort');

require('./dashboard/ace');
require('./dashboard/autosave');
require('./dashboard/datepicker');
require('./dashboard/hideMessage');
require('./dashboard/range');
require('./dashboard/semantic');
require('./dashboard/sidebar');
require('./dashboard/sortable');
require('./dashboard/websocket');
require('./dashboard/wysiwyg');

// CSRF
$.ajaxSetup({
  headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') }
});

/* eslint-disable no-param-reassign */
const autoExpand = (field) => {
  field.style.resize = 'none';
  field.style.height = 'inherit';
  const computed = window.getComputedStyle(field);
  const height = parseInt(computed.getPropertyValue('border-top-width'), 10)
    + parseInt(computed.getPropertyValue('padding-top'), 10)
    + field.scrollHeight
    + parseInt(computed.getPropertyValue('padding-bottom'), 10)
    + parseInt(computed.getPropertyValue('border-bottom-width'), 10);
  field.style.height = `${height}px`;
};

const init = () => {
  [...document.querySelectorAll('textarea')].map(autoExpand);
  const settingsButton = document.getElementById('page-settings');
  settingsButton && settingsButton.addEventListener('click', () => {
    document.querySelector('.metadata').classList.toggle('open');
  });

  for (const link of [...document.querySelectorAll('.field__link')]) {
    const name = link.querySelector('input[type=text]');
    const sel = link.querySelector('select');
    const url = link.querySelector('input[type=url]');

    sel.addEventListener('change', () => {
      sel.classList.toggle('selected', !!sel.value);
      url.value = '';
      name.setAttribute('placeholder', sel.value ? sel.selectedOptions[0].textContent : '');
    });

    url.addEventListener('input', () => {
      sel.value = '';
      sel.classList.remove('selected');
      name.setAttribute('placeholder', url.value);
    });
  }


}

document.addEventListener('input', (event) => event.target.tagName.toLowerCase() === 'textarea' && autoExpand(event.target), false);
document.addEventListener('input', (event) => {
  const el = event.target;
  if (el.tagName.toLowerCase() !== 'input' || el.getAttribute('type') !== 'file') { return; }
  const reader = new FileReader();
  reader.onload = (e) => { document.getElementById(el.name).src = e.target.result; };
  reader.readAsDataURL(el.files[0]);
}, false);
document.addEventListener('change', (event) => {
  const el = event.target;
  if (el.tagName.toLowerCase() !== 'input' || el.getAttribute('type') !== 'checkbox' || !el.id.startsWith('_destroy')) { return; }
  el.parentElement.parentElement.querySelector('img').src = '';
}, false);

// Checkboxes don't send a value if un-checked. Ensure we send 'false' to the server for our data model.
document.addEventListener('change', (event) => {
  const el = event.target;
  if (el.tagName.toLowerCase() !== 'input' || el.getAttribute('type') !== 'checkbox' || !el.id.startsWith('content')) { return; }
  el.checked ? el.previousElementSibling.setAttribute('name', '') : el.previousElementSibling.setAttribute('name', el.getAttribute('name'));
}, false);

document.addEventListener('turbolinks:load', init);
