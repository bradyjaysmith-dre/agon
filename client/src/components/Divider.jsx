export default function Divider({ glyph = 'ἀγών' }) {
  return (
    <div className="divider">
      <div className="divider-line" />
      <span className="divider-glyph">{glyph}</span>
      <div className="divider-line" />
    </div>
  );
}
