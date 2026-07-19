// Structural styles (page/panel/button/field/link) are CSS classes now,
// defined in app.css — see that file for the ancient-Greek palette this
// maps to. `colors` stays as hex values for the dynamic/conditional inline
// styles scattered through components (e.g. `color: entry.confirmed ? colors.success : colors.muted`).
export const colors = {
  bg: '#15120d',
  panel: '#1b1710',
  border: '#3a3327',
  text: '#ede3cf',
  muted: '#c9bfa9',
  accent: '#c79a4b',
  danger: '#b23a3a',
  success: '#6c7a4e',
};

export const page = 'page';
export const panel = 'panel';
export const button = 'btn';
export const buttonSecondary = 'btn-secondary';
export const input = 'field';
export const label = 'field-label';
export const link = 'link';
