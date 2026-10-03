import styles from './entity-hall.module.css';

export function HallBezel({
  label,
  clock,
  mark,
}: {
  label: string;
  clock?: string | null;
  mark?: string | null;
}) {
  return (
    <div className={styles.bezel}>
      <div className={styles.bezelLeft}>
        <span className={styles.equalizer} aria-hidden>
          <span />
          <span />
          <span />
        </span>
        <span>{label}</span>
      </div>
      {(mark || clock) ? (
        <div className={styles.bezelRight}>
          {mark ? <span className={styles.hd}>{mark}</span> : null}
          {clock ? <span className={styles.clock}>{clock}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

export function HallBrackets() {
  return (
    <>
      <span className={`${styles.bracket} ${styles.tl}`} aria-hidden />
      <span className={`${styles.bracket} ${styles.tr}`} aria-hidden />
      <span className={`${styles.bracket} ${styles.bl}`} aria-hidden />
      <span className={`${styles.bracket} ${styles.br}`} aria-hidden />
    </>
  );
}
