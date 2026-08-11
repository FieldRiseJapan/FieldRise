const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-button');

if (header && toggle) {
  toggle.addEventListener('click', () => {
    const isOpen = header.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
}
