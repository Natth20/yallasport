import styles from './entity-hall.module.css';

export function HallBezel({
  label,
  clock,
}: {
  label: string;
  clock: string;
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
      <div className={styles.bezelRight}>
        <span className={styles.hd}>HD</span>
        <span className={styles.clock}>{clock}</span>
      </div>
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
