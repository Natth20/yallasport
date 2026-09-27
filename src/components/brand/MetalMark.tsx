import styles from './metal-mark.module.css';

export function MetalMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className={`${styles.plate} ${styles[size]}`}>
      <span className={styles.letters}>YS</span>
    </div>
  );
}
