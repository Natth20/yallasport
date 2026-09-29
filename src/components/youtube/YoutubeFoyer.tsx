import type { ReactNode } from 'react';
import styles from './youtube.module.css';

export function YoutubeFoyer({ children }: { children: ReactNode }) {
  return <div className={styles['yt-foyer']}>{children}</div>;
}
