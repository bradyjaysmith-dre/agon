// Shared inline-style building blocks — no CSS framework, dark theme only.
export const colors = {
  bg: '#121212',
  panel: '#1c1c1c',
  border: '#333',
  text: '#e8e8e8',
  muted: '#999',
  accent: '#4f8cff',
  danger: '#ff5c5c',
  success: '#4caf50',
};

export const page = {
  minHeight: '100vh',
  background: colors.bg,
  color: colors.text,
  padding: '24px',
  maxWidth: '840px',
  margin: '0 auto',
};

export const panel = {
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  borderRadius: '10px',
  padding: '16px',
  marginBottom: '16px',
};

export const button = {
  background: colors.accent,
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  padding: '8px 14px',
  cursor: 'pointer',
  fontSize: '14px',
};

export const buttonSecondary = {
  ...button,
  background: 'transparent',
  border: `1px solid ${colors.border}`,
  color: colors.text,
};

export const input = {
  background: '#0e0e0e',
  border: `1px solid ${colors.border}`,
  borderRadius: '6px',
  color: colors.text,
  padding: '8px 10px',
  fontSize: '14px',
  width: '100%',
};

export const label = {
  display: 'block',
  fontSize: '13px',
  color: colors.muted,
  marginBottom: '4px',
  marginTop: '10px',
};

export const link = {
  color: colors.accent,
  textDecoration: 'none',
};
